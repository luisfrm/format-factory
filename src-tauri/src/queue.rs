use crate::engines;
use crate::plan::{build_args, JobSpec};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::io::{BufRead, BufReader, Read};
use std::process::Stdio;
use std::sync::{mpsc, Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};

const PROGRESS_INTERVAL: Duration = Duration::from_millis(140);
const MAX_ERROR_CHARS: usize = 400;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobEvent {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub progress: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fps: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speed: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eta_seconds: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_bytes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl JobEvent {
    fn with_status(id: &str, status: &str) -> Self {
        Self {
            id: id.to_string(),
            status: Some(status.to_string()),
            progress: None,
            fps: None,
            speed: None,
            eta_seconds: None,
            output_bytes: None,
            error: None,
        }
    }

    fn failed(id: &str, error: impl Into<String>) -> Self {
        Self {
            id: id.to_string(),
            status: Some("failed".to_string()),
            progress: None,
            fps: None,
            speed: None,
            eta_seconds: None,
            output_bytes: None,
            error: Some(error.into()),
        }
    }
}

#[derive(Default)]
struct Runtime {
    /// job id -> ffmpeg PID
    pids: HashMap<String, u32>,
    /// jobs cancelled by the user while ffmpeg was running
    canceled: HashSet<String>,
}

/// Serial queue: one ffmpeg process at a time keeps the machine responsive.
pub struct JobManager {
    sender: Mutex<mpsc::Sender<JobSpec>>,
    runtime: Arc<Mutex<Runtime>>,
}

impl JobManager {
    pub fn new(app: AppHandle) -> Self {
        let (sender, receiver) = mpsc::channel::<JobSpec>();
        let runtime = Arc::new(Mutex::new(Runtime::default()));
        let worker_runtime = Arc::clone(&runtime);

        std::thread::spawn(move || {
            while let Ok(spec) = receiver.recv() {
                run_job(&app, &worker_runtime, spec);
            }
        });

        Self {
            sender: Mutex::new(sender),
            runtime,
        }
    }

    fn enqueue(&self, spec: JobSpec) -> Result<(), String> {
        self.sender
            .lock()
            .map_err(|_| "cola no disponible".to_string())?
            .send(spec)
            .map_err(|_| "la cola de conversión se cerró".to_string())
    }

    fn cancel(&self, job_id: &str) {
        let pid = {
            let mut runtime = self.runtime.lock().expect("runtime poisoned");
            runtime.canceled.insert(job_id.to_string());
            runtime.pids.get(job_id).copied()
        };

        if let Some(pid) = pid {
            terminate_process(pid);
        }
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn enqueue_job(manager: State<'_, JobManager>, spec: JobSpec) -> Result<(), String> {
    manager.enqueue(spec)
}

#[tauri::command(rename_all = "camelCase")]
pub fn cancel_job(manager: State<'_, JobManager>, job_id: String) -> Result<(), String> {
    manager.cancel(&job_id);
    Ok(())
}

fn emit(app: &AppHandle, event: JobEvent) {
    let _ = app.emit("job-event", event);
}

fn run_job(app: &AppHandle, runtime: &Arc<Mutex<Runtime>>, spec: JobSpec) {
    let job_id = spec.job_id.clone();

    // The user may have cancelled while the job was still queued.
    let was_canceled = {
        let mut guard = runtime.lock().expect("runtime poisoned");
        guard.canceled.remove(&job_id)
    };
    if was_canceled {
        emit(app, JobEvent::with_status(&job_id, "canceled"));
        return;
    }

    emit(app, JobEvent::with_status(&job_id, "running"));

    let args = match build_args(&spec) {
        Ok(args) => args,
        Err(error) => {
            emit(app, JobEvent::failed(&job_id, error));
            return;
        }
    };

    let mut child = match engines::command(&engines::ffmpeg())
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => child,
        Err(error) => {
            emit(
                app,
                JobEvent::failed(&job_id, format!("no se pudo iniciar ffmpeg: {error}")),
            );
            return;
        }
    };

    {
        let mut guard = runtime.lock().expect("runtime poisoned");
        guard.pids.insert(job_id.clone(), child.id());
    }

    let stderr_handle = child.stderr.take().map(|mut stderr| {
        std::thread::spawn(move || {
            let mut buffer = String::new();
            let _ = stderr.read_to_string(&mut buffer);
            buffer
        })
    });

    let duration = spec.duration_seconds.unwrap_or(0.0);
    let mut last_emit = Instant::now();
    let mut processed_seconds = 0.0_f64;
    let mut speed = 0.0_f64;
    let mut fps = 0.0_f64;

    if let Some(stdout) = child.stdout.take() {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            if let Some(value) = line.strip_prefix("out_time_us=") {
                processed_seconds = value.trim().parse::<f64>().unwrap_or(0.0) / 1_000_000.0;
            } else if let Some(value) = line.strip_prefix("fps=") {
                fps = value.trim().parse::<f64>().unwrap_or(fps);
            } else if let Some(value) = line.strip_prefix("speed=") {
                speed = value
                    .trim()
                    .trim_end_matches('x')
                    .parse::<f64>()
                    .unwrap_or(speed);
            }

            if last_emit.elapsed() >= PROGRESS_INTERVAL {
                emit(
                    app,
                    progress_event(&job_id, processed_seconds, duration, speed, fps),
                );
                last_emit = Instant::now();
            }
        }
    }

    let exit_status = child.wait();

    let canceled = {
        let mut guard = runtime.lock().expect("runtime poisoned");
        guard.pids.remove(&job_id);
        guard.canceled.remove(&job_id)
    };

    let stderr_text = stderr_handle
        .and_then(|handle| handle.join().ok())
        .unwrap_or_default();

    if canceled {
        emit(app, JobEvent::with_status(&job_id, "canceled"));
        return;
    }

    match exit_status {
        Ok(status) if status.success() => {
            let bytes = std::fs::metadata(&spec.output_path)
                .map(|meta| meta.len())
                .ok();

            emit(
                app,
                JobEvent {
                    id: job_id,
                    status: Some("done".to_string()),
                    progress: Some(100.0),
                    output_bytes: bytes,
                    ..Default::default()
                },
            );
        }
        Ok(status) => {
            let error = summarize_error(&stderr_text)
                .unwrap_or_else(|| format!("ffmpeg terminó con código {}", status.code().unwrap_or(-1)));
            emit(app, JobEvent::failed(&job_id, error));
        }
        Err(error) => emit(
            app,
            JobEvent::failed(&job_id, format!("ffmpeg no terminó correctamente: {error}")),
        ),
    }
}

impl Default for JobEvent {
    fn default() -> Self {
        Self {
            id: String::new(),
            status: None,
            progress: None,
            fps: None,
            speed: None,
            eta_seconds: None,
            output_bytes: None,
            error: None,
        }
    }
}

fn progress_event(
    job_id: &str,
    processed_seconds: f64,
    duration: f64,
    speed: f64,
    fps: f64,
) -> JobEvent {
    let percent = if duration > 0.0 {
        (processed_seconds / duration * 100.0).clamp(0.0, 99.9)
    } else {
        0.0
    };

    let eta = if duration > 0.0 && speed > 0.0 {
        Some(((duration - processed_seconds).max(0.0)) / speed)
    } else {
        None
    };

    JobEvent {
        id: job_id.to_string(),
        status: Some("running".to_string()),
        progress: Some((percent * 10.0).round() / 10.0),
        fps: if fps > 0.0 { Some(fps) } else { None },
        speed: if speed > 0.0 { Some(speed) } else { None },
        eta_seconds: eta,
        output_bytes: None,
        error: None,
    }
}

fn summarize_error(stderr: &str) -> Option<String> {
    let relevant = stderr
        .lines()
        .rev()
        .find(|line| !line.trim().is_empty())?
        .trim();

    if relevant.is_empty() {
        return None;
    }

    Some(relevant.chars().take(MAX_ERROR_CHARS).collect())
}

fn terminate_process(pid: u32) {
    #[cfg(windows)]
    {
        let _ = engines::command(std::path::Path::new("taskkill"))
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .output();
    }

    #[cfg(not(windows))]
    {
        let _ = engines::command(std::path::Path::new("kill"))
            .args(["-9", &pid.to_string()])
            .output();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn progress_is_clamped_and_rounded() {
        let event = progress_event("job", 30.0, 120.0, 2.0, 60.0);
        assert_eq!(event.progress, Some(25.0));
        assert_eq!(event.eta_seconds, Some(45.0));
    }

    #[test]
    fn unknown_duration_reports_zero_progress_without_eta() {
        let event = progress_event("job", 10.0, 0.0, 1.0, 0.0);
        assert_eq!(event.progress, Some(0.0));
        assert_eq!(event.eta_seconds, None);
    }

    #[test]
    fn progress_never_reaches_one_hundred_while_running() {
        let event = progress_event("job", 500.0, 100.0, 1.0, 30.0);
        assert_eq!(event.progress, Some(99.9));
    }

    #[test]
    fn picks_the_last_error_line() {
        let stderr = "line one\nConversion failed!\n\n";
        assert_eq!(
            summarize_error(stderr).as_deref(),
            Some("Conversion failed!")
        );
    }
}
