use serde::Deserialize;

/// Everything the frontend needs to describe one conversion.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobSpec {
    pub job_id: String,
    pub input_path: String,
    pub output_path: String,
    /// Target format id: mp4 | mkv | webm | mov | mp3 | aac | m4a | wav | flac
    pub target: String,
    /// high | balanced | compact
    pub quality: String,
    pub duration_seconds: Option<f64>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum Quality {
    High,
    Balanced,
    Compact,
}

impl Quality {
    fn parse(value: &str) -> Self {
        match value {
            "high" => Self::High,
            "compact" => Self::Compact,
            _ => Self::Balanced,
        }
    }

    fn crf(self) -> &'static str {
        match self {
            Self::High => "18",
            Self::Balanced => "23",
            Self::Compact => "28",
        }
    }

    fn audio_kbps(self) -> &'static str {
        match self {
            Self::High => "256k",
            Self::Balanced => "192k",
            Self::Compact => "128k",
        }
    }

    fn vp9_deadline(self) -> &'static str {
        match self {
            Self::Compact => "realtime",
            _ => "good",
        }
    }
}

/// Builds the full ffmpeg argument list for a job.
///
/// `-progress pipe:1` makes ffmpeg write machine-readable progress to stdout,
/// which the queue worker streams to the UI as job events.
pub fn build_args(spec: &JobSpec) -> Result<Vec<String>, String> {
    let quality = Quality::parse(&spec.quality);
    let mut args: Vec<String> = vec![
        "-hide_banner".into(),
        "-y".into(),
        "-i".into(),
        spec.input_path.clone(),
    ];

    match spec.target.as_str() {
        "mp4" | "mov" => {
            push_video(&mut args, "libx264", quality);
            push_audio(&mut args, "aac", quality);
            args.push("-movflags".into());
            args.push("+faststart".into());
        }
        "mkv" => {
            push_video(&mut args, "libx264", quality);
            push_audio(&mut args, "aac", quality);
        }
        "webm" => {
            args.push("-c:v".into());
            args.push("libvpx-vp9".into());
            args.push("-crf".into());
            args.push(quality.crf().into());
            args.push("-b:v".into());
            args.push("0".into());
            args.push("-deadline".into());
            args.push(quality.vp9_deadline().into());
            args.push("-row-mt".into());
            args.push("1".into());
            push_audio(&mut args, "libopus", quality);
        }
        "mp3" => {
            args.push("-vn".into());
            args.push("-c:a".into());
            args.push("libmp3lame".into());
            args.push("-b:a".into());
            args.push(quality.audio_kbps().into());
        }
        "aac" => {
            args.push("-vn".into());
            args.push("-c:a".into());
            args.push("aac".into());
            args.push("-b:a".into());
            args.push(quality.audio_kbps().into());
        }
        "m4a" => {
            args.push("-vn".into());
            args.push("-c:a".into());
            args.push("aac".into());
            args.push("-b:a".into());
            args.push(quality.audio_kbps().into());
            args.push("-movflags".into());
            args.push("+faststart".into());
        }
        "wav" => {
            args.push("-vn".into());
            args.push("-c:a".into());
            args.push("pcm_s16le".into());
        }
        "flac" => {
            args.push("-vn".into());
            args.push("-c:a".into());
            args.push("flac".into());
            args.push("-compression_level".into());
            args.push("5".into());
        }
        other => return Err(format!("formato de salida no soportado: {other}")),
    }

    args.extend([
        "-progress".into(),
        "pipe:1".into(),
        "-nostats".into(),
        "-loglevel".into(),
        "error".into(),
        spec.output_path.clone(),
    ]);

    Ok(args)
}

fn push_video(args: &mut Vec<String>, codec: &str, quality: Quality) {
    args.extend([
        "-c:v".to_string(),
        codec.to_string(),
        "-preset".to_string(),
        "medium".to_string(),
        "-crf".to_string(),
        quality.crf().to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
    ]);
}

fn push_audio(args: &mut Vec<String>, codec: &str, quality: Quality) {
    args.extend([
        "-c:a".to_string(),
        codec.to_string(),
        "-b:a".to_string(),
        quality.audio_kbps().to_string(),
    ]);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn spec(target: &str, quality: &str) -> JobSpec {
        JobSpec {
            job_id: "job-1".into(),
            input_path: "C:/media/video1.mp4".into(),
            output_path: format!("C:/media/video1.{target}"),
            target: target.into(),
            quality: quality.into(),
            duration_seconds: Some(42.0),
        }
    }

    fn joined(args: &[String]) -> String {
        args.join(" ")
    }

    #[test]
    fn mp4_uses_h264_aac_and_faststart() {
        let args = build_args(&spec("mp4", "balanced")).unwrap();
        let line = joined(&args);
        assert!(line.contains("-c:v libx264"));
        assert!(line.contains("-c:a aac"));
        assert!(line.contains("-crf 23"));
        assert!(line.contains("-b:a 192k"));
        assert!(line.contains("-movflags +faststart"));
        assert!(line.contains("-progress pipe:1"));
    }

    #[test]
    fn quality_changes_crf_and_bitrate() {
        let high = joined(&build_args(&spec("mp4", "high")).unwrap());
        let compact = joined(&build_args(&spec("mp4", "compact")).unwrap());
        assert!(high.contains("-crf 18"));
        assert!(high.contains("-b:a 256k"));
        assert!(compact.contains("-crf 28"));
        assert!(compact.contains("-b:a 128k"));
    }

    #[test]
    fn webm_uses_vp9_and_opus() {
        let line = joined(&build_args(&spec("webm", "balanced")).unwrap());
        assert!(line.contains("-c:v libvpx-vp9"));
        assert!(line.contains("-c:a libopus"));
        assert!(!line.contains("-movflags"));
    }

    #[test]
    fn audio_targets_drop_the_video_stream() {
        for target in ["mp3", "aac", "m4a", "wav", "flac"] {
            let line = joined(&build_args(&spec(target, "balanced")).unwrap());
            assert!(line.contains("-vn"), "{target} should drop video");
            assert!(!line.contains("-c:v"), "{target} should not encode video");
        }
    }

    #[test]
    fn lossless_targets_ignore_the_quality_bitrate() {
        let wave = joined(&build_args(&spec("wav", "compact")).unwrap());
        assert!(wave.contains("-c:a pcm_s16le"));
        assert!(!wave.contains("-b:a"));

        let flac = joined(&build_args(&spec("flac", "high")).unwrap());
        assert!(flac.contains("-c:a flac"));
        assert!(!flac.contains("-b:a"));
    }

    #[test]
    fn output_path_is_always_last() {
        let args = build_args(&spec("mp3", "balanced")).unwrap();
        assert_eq!(args.last().unwrap(), "C:/media/video1.mp3");
    }

    #[test]
    fn unknown_targets_are_rejected() {
        let error = build_args(&spec("exe", "balanced")).unwrap_err();
        assert!(error.contains("no soportado"));
    }

    /// End-to-end check against the real binary and the files in `files-mock/`.
    /// Skips itself when the sidecars or fixtures are absent.
    #[test]
    fn converts_a_real_file_with_ffmpeg() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("repo root");
        let input = root.join("files-mock").join("video1.mp4");

        if !input.exists() || !crate::engines::ffmpeg().exists() {
            return;
        }

        let output_dir = std::env::temp_dir().join("format-factory-tests");
        std::fs::create_dir_all(&output_dir).expect("temp dir");
        let output_path = output_dir.join("video1-test.mp3");

        let real_spec = JobSpec {
            job_id: "integration".into(),
            input_path: input.to_string_lossy().to_string(),
            output_path: output_path.to_string_lossy().to_string(),
            target: "mp3".into(),
            quality: "balanced".into(),
            duration_seconds: Some(14.1),
        };

        let args = build_args(&real_spec).expect("args");
        let status = crate::engines::command(&crate::engines::ffmpeg())
            .args(&args)
            .status()
            .expect("spawn ffmpeg");

        assert!(status.success(), "ffmpeg should finish successfully");
        let bytes = std::fs::metadata(&output_path).expect("output exists").len();
        assert!(bytes > 10_000, "output should be a real mp3, got {bytes} bytes");

        let _ = std::fs::remove_file(&output_path);
    }
}
