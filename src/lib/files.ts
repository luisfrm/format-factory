import { FORMATS, type MediaKind, type TargetFormat } from "@/lib/formats";

export const SUPPORTED_VIDEO_EXTENSIONS = [
  "mp4",
  "mkv",
  "mov",
  "webm",
  "avi",
  "m4v",
  "flv",
  "wmv",
  "ts",
  "mpg",
  "mpeg",
  "3gp",
] as const;

export const SUPPORTED_AUDIO_EXTENSIONS = [
  "mp3",
  "m4a",
  "aac",
  "wav",
  "flac",
  "ogg",
  "opus",
  "wma",
  "aiff",
  "aif",
  "alac",
] as const;

const VIDEO_SET = new Set<string>(SUPPORTED_VIDEO_EXTENSIONS);
const AUDIO_SET = new Set<string>(SUPPORTED_AUDIO_EXTENSIONS);

export const ACCEPTED_EXTENSIONS = [
  ...SUPPORTED_VIDEO_EXTENSIONS,
  ...SUPPORTED_AUDIO_EXTENSIONS,
];

/**
 * Extensions accepted by an intake. `null`/`undefined` accepts everything
 * supported; a preset narrows it to its source kind.
 */
export function extensionsFor(
  kind?: MediaKind | null,
): readonly string[] {
  if (kind === "video") return SUPPORTED_VIDEO_EXTENSIONS;
  if (kind === "audio") return SUPPORTED_AUDIO_EXTENSIONS;
  return ACCEPTED_EXTENSIONS;
}

/** `accept` attribute for <input type="file">. */
export function acceptFor(kind?: MediaKind | null): string {
  return extensionsFor(kind)
    .map((ext) => `.${ext}`)
    .join(",");
}

export const FILE_ACCEPT = acceptFor();

/**
 * Splits a path into directory + file name. Works with both separators and
 * always returns forward slashes so the value is stable for comparisons.
 */
export function splitPath(path: string): {
  directory: string;
  fileName: string;
} {
  const normalized = path.replaceAll('\\', "/");
  const index = normalized.lastIndexOf("/");

  if (index === -1) return { directory: "", fileName: normalized };
  return {
    directory: normalized.slice(0, index),
    fileName: normalized.slice(index + 1),
  };
}

/** Lower-case extension without the dot, or "" when there is none. */
export function extname(path: string): string {
  const { fileName } = splitPath(path);
  const index = fileName.lastIndexOf(".");
  if (index <= 0) return "";
  return fileName.slice(index + 1).toLowerCase();
}

/** File name without its extension. */
export function stem(path: string): string {
  const { fileName } = splitPath(path);
  const index = fileName.lastIndexOf(".");
  if (index <= 0) return fileName;
  return fileName.slice(0, index);
}

export function fileName(path: string): string {
  return splitPath(path).fileName;
}

export function kindFromExtension(extension: string): MediaKind | null {
  const ext = extension.toLowerCase().replace(/^\./, "");
  if (VIDEO_SET.has(ext)) return "video";
  if (AUDIO_SET.has(ext)) return "audio";
  return null;
}

export function kindFromPath(path: string): MediaKind | null {
  return kindFromExtension(extname(path));
}

/** When `kind` is given, files of the other family are rejected. */
export function isSupportedFile(
  path: string,
  kind?: MediaKind | null,
): boolean {
  const detected = kindFromPath(path);
  if (!detected) return false;
  return kind ? detected === kind : true;
}

/** "mkv" → "MKV", unknown → "?" */
export function extensionLabel(path: string): string {
  const ext = extname(path);
  return ext ? ext.toUpperCase() : "?";
}

/**
 * Output path for a conversion. When the target would overwrite the input
 * in place, a `-convertido` suffix keeps the original safe.
 */
export function buildOutputPath(
  inputPath: string,
  target: TargetFormat,
  outputDirectory?: string | null,
): string {
  const { directory, fileName: name } = splitPath(inputPath);
  const spec = FORMATS[target];
  const base = stem(name);

  let outputName = `${base}.${spec.extension}`;
  if (outputName.toLowerCase() === name.toLowerCase()) {
    outputName = `${base}-convertido.${spec.extension}`;
  }

  const targetDirectory = outputDirectory ?? directory;
  return targetDirectory ? `${targetDirectory}/${outputName}` : outputName;
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** 7122240 → "6.8 MB" */
export function humanBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const unit = BYTE_UNITS[exponent];

  if (exponent === 0) return `${Math.round(value)} ${unit}`;
  const rounded = value.toFixed(decimals).replace(/\.0+$/, "");
  return `${rounded} ${unit}`;
}

/** 4321 → "1h 12m" · 192 → "3m 12s" · 7 → "7s" */
export function humanDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (!Number.isFinite(seconds) || seconds < 0) return "—";

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remaining.toString().padStart(2, "0")}s`;
  }
  return `${remaining}s`;
}

/** 72 → "01:12" — used for ETA / timecodes. */
export function humanClock(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "--:--";
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;

  const mm = minutes.toString().padStart(2, "0");
  const ss = remaining.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Ratio of size saved, 0-100. Negative results mean the file got bigger. */
export function savedPercent(inputBytes: number, outputBytes: number): number {
  if (inputBytes <= 0) return 0;
  return Math.round(((inputBytes - outputBytes) / inputBytes) * 100);
}
