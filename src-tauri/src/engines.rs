use serde::Serialize;
use std::process::Command;

/// A conversion engine the app can shell out to.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    /// Stable id used by the frontend: "ffmpeg" | "ffprobe" | "calibre".
    pub id: &'static str,
    pub label: &'static str,
    pub available: bool,
    /// First line of `-version` output, e.g. "ffmpeg version 7.1".
    pub version: Option<String>,
}

fn run_version(bin: &str, version_flag: &str) -> Option<String> {
    let mut cmd = Command::new(bin);
    cmd.arg(version_flag);

    // Avoid spawning a console window for each probe on Windows.
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let output = cmd.output().ok()?;
    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout
        .lines()
        .next()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty())
}

fn probe(id: &'static str, label: &'static str, bin: &str, flag: &str) -> EngineStatus {
    let version = run_version(bin, flag);
    EngineStatus {
        id,
        label,
        available: version.is_some(),
        version,
    }
}

/// Reports which external binaries are reachable from the app.
/// Later this will also check bundled sidecars in the app resources dir.
#[tauri::command]
pub fn engine_status() -> Vec<EngineStatus> {
    vec![
        probe("ffmpeg", "FFmpeg", "ffmpeg", "-version"),
        probe("ffprobe", "FFprobe", "ffprobe", "-version"),
        probe("calibre", "Calibre", "ebook-convert", "--version"),
    ]
}
