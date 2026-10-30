use crate::engines;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Deserialize)]
struct FfprobeOutput {
    #[serde(default)]
    streams: Vec<Stream>,
    format: Option<MediaFormat>,
}

#[derive(Debug, Deserialize)]
struct Stream {
    codec_type: Option<String>,
    codec_name: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct MediaFormat {
    duration: Option<String>,
    size: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub path: String,
    pub name: String,
    pub extension: String,
    pub kind: String,
    pub bytes: u64,
    pub duration_seconds: Option<f64>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub video_codec: Option<String>,
    pub audio_codec: Option<String>,
}

const VIDEO_EXTENSIONS: &[&str] = &[
    "mp4", "mkv", "mov", "webm", "avi", "m4v", "flv", "wmv", "ts", "mpg", "mpeg", "3gp",
];

const AUDIO_EXTENSIONS: &[&str] = &[
    "mp3", "m4a", "aac", "wav", "flac", "ogg", "opus", "wma", "aiff", "aif", "alac",
];

fn extension_of(path: &Path) -> String {
    path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or_default()
        .to_lowercase()
}

fn kind_from_extension(extension: &str) -> Option<&'static str> {
    if VIDEO_EXTENSIONS.contains(&extension) {
        Some("video")
    } else if AUDIO_EXTENSIONS.contains(&extension) {
        Some("audio")
    } else {
        None
    }
}

fn probe_one(path: &str) -> MediaInfo {
    let file_path = Path::new(path);
    let extension = extension_of(file_path);
    let fallback_kind = kind_from_extension(&extension).unwrap_or("video");
    let fallback_bytes = std::fs::metadata(file_path).map(|meta| meta.len()).unwrap_or(0);

    let output = engines::command(&engines::ffprobe())
        .args([
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
        ])
        .arg(path)
        .output();

    let parsed = output
        .ok()
        .filter(|out| out.status.success())
        .and_then(|out| serde_json::from_slice::<FfprobeOutput>(&out.stdout).ok());

    let mut info = MediaInfo {
        path: path.to_string(),
        name: file_path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_default()
            .to_string(),
        extension: extension.clone(),
        kind: fallback_kind.to_string(),
        bytes: fallback_bytes,
        duration_seconds: None,
        width: None,
        height: None,
        video_codec: None,
        audio_codec: None,
    };

    let Some(probe) = parsed else {
        return info;
    };

    if let Some(format) = probe.format {
        if let Some(duration) = format.duration.and_then(|value| value.parse::<f64>().ok()) {
            info.duration_seconds = Some(duration);
        }
        if let Some(size) = format.size.and_then(|value| value.parse::<u64>().ok()) {
            info.bytes = size;
        }
    }

    for stream in probe.streams {
        match stream.codec_type.as_deref() {
            Some("video") => {
                if info.width.is_none() {
                    info.width = stream.width;
                    info.height = stream.height;
                    info.video_codec = stream.codec_name;
                }
            }
            Some("audio") => {
                if info.audio_codec.is_none() {
                    info.audio_codec = stream.codec_name;
                }
            }
            _ => {}
        }
    }

    // A stream can contradict the extension (e.g. an .mkv holding only audio).
    if info.video_codec.is_none() && info.audio_codec.is_some() {
        info.kind = "audio".to_string();
    }

    info
}

/// Probes a batch of files. Never fails as a whole: unreadable files fall back
/// to extension + filesystem metadata so the UI can still list them.
#[tauri::command]
pub fn probe_files(paths: Vec<String>) -> Vec<MediaInfo> {
    paths.iter().map(|path| probe_one(path)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_kind_from_extension() {
        assert_eq!(kind_from_extension("mkv"), Some("video"));
        assert_eq!(kind_from_extension("flac"), Some("audio"));
        assert_eq!(kind_from_extension("txt"), None);
    }

    #[test]
    fn extracts_lowercase_extension() {
        assert_eq!(extension_of(Path::new("C:/media/CLIP.MP4")), "mp4");
        assert_eq!(extension_of(Path::new("C:/media/noext")), "");
    }

    #[test]
    fn falls_back_when_file_is_missing() {
        let info = probe_one("C:/definitely/missing/clip.mkv");
        assert_eq!(info.kind, "video");
        assert_eq!(info.extension, "mkv");
        assert_eq!(info.bytes, 0);
    }

    /// Reads the real fixture with ffprobe. Skips when the sidecars are absent.
    #[test]
    fn probes_a_real_file() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("repo root");
        let input = root.join("files-mock").join("video1.mp4");

        if !input.exists() || !crate::engines::ffprobe().exists() {
            return;
        }

        let info = probe_one(&input.to_string_lossy());

        assert_eq!(info.kind, "video");
        assert_eq!(info.extension, "mp4");
        assert_eq!(info.width, Some(480));
        assert_eq!(info.height, Some(480));
        assert_eq!(info.video_codec.as_deref(), Some("h264"));
        assert_eq!(info.audio_codec.as_deref(), Some("aac"));
        assert!(info.bytes > 2_000_000);
        let duration = info.duration_seconds.expect("duration");
        assert!((duration - 14.125).abs() < 0.5, "unexpected duration {duration}");
    }
}
