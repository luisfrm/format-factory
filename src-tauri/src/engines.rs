use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(windows)]
const EXE_EXT: &str = ".exe";
#[cfg(not(windows))]
const EXE_EXT: &str = "";

/// Target triple injected by build.rs, e.g. `x86_64-pc-windows-msvc`.
const TARGET: &str = env!("FF_TARGET");

/// A conversion engine the app can shell out to.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub id: &'static str,
    pub label: &'static str,
    pub available: bool,
    pub version: Option<String>,
}

/// Builds a command that never flashes a console window on Windows.
pub fn command(path: &Path) -> Command {
    let mut cmd = Command::new(path);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd
}

/// Resolution order:
/// 1. `FMT_<NAME>` environment variable (escape hatch for development)
/// 2. next to the executable (bundled sidecar)
/// 3. `src-tauri/binaries/<name>-<target>.exe` (development)
/// 4. `<name>` from PATH
pub fn locate(name: &str) -> PathBuf {
    let env_key = format!("FMT_{}", name.to_uppercase());
    if let Ok(value) = std::env::var(&env_key) {
        let trimmed = value.trim();
        if !trimmed.is_empty() {
            return PathBuf::from(trimmed);
        }
    }

    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let bundled = dir.join(format!("{name}{EXE_EXT}"));
            if bundled.is_file() {
                return bundled;
            }
        }
    }

    if let Some(manifest) = option_env!("CARGO_MANIFEST_DIR") {
        let binaries = PathBuf::from(manifest).join("binaries");
        for candidate in [
            binaries.join(format!("{name}-{TARGET}{EXE_EXT}")),
            binaries.join(format!("{name}{EXE_EXT}")),
        ] {
            if candidate.is_file() {
                return candidate;
            }
        }
    }

    PathBuf::from(format!("{name}{EXE_EXT}"))
}

pub fn ffmpeg() -> PathBuf {
    locate("ffmpeg")
}

pub fn ffprobe() -> PathBuf {
    locate("ffprobe")
}

fn first_line_of_version(path: &Path, flag: &str) -> Option<String> {
    let output = command(path).arg(flag).output().ok()?;
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

fn probe(id: &'static str, label: &'static str, binary: &str, flag: &str) -> EngineStatus {
    let version = first_line_of_version(&locate(binary), flag);
    EngineStatus {
        id,
        label,
        available: version.is_some(),
        version,
    }
}

/// Reports which external binaries are reachable from the app.
#[tauri::command]
pub fn engine_status() -> Vec<EngineStatus> {
    vec![
        probe("ffmpeg", "FFmpeg", "ffmpeg", "-version"),
        probe("ffprobe", "FFprobe", "ffprobe", "-version"),
        probe("calibre", "Calibre", "ebook-convert", "--version"),
    ]
}
