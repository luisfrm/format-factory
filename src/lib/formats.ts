/**
 * Single source of truth for what this app can convert.
 *
 * Adding a new output format means adding one entry here; the UI (preset
 * tiles, target menus, extension filters) and the Rust planner both read
 * from this shape.
 */

export type MediaKind = "video" | "audio";

export type VideoFormat = "mp4" | "mkv" | "webm" | "mov";
export type AudioFormat = "mp3" | "aac" | "wav" | "flac" | "m4a";
export type TargetFormat = VideoFormat | AudioFormat;

/** Encoding effort. Maps to CRF / bitrate pairs, not to a container. */
export type QualityPreset = "high" | "balanced" | "compact";

export type FormatSpec = {
  id: TargetFormat;
  label: string;
  kind: MediaKind;
  extension: string;
  container: string;
  /** Short line shown under the label in menus. */
  note: string;
  vcodec?: string;
  acodec: string;
  /** True when the output keeps the source quality (no quality presets). */
  lossless?: boolean;
  /** Formats that play almost anywhere get a "recommended" badge. */
  recommended?: boolean;
};

export const FORMATS: Record<TargetFormat, FormatSpec> = {
  mp4: {
    id: "mp4",
    label: "MP4",
    kind: "video",
    extension: "mp4",
    container: "MPEG-4",
    note: "H.264 + AAC · compatible con todo",
    vcodec: "libx264",
    acodec: "aac",
    recommended: true,
  },
  mkv: {
    id: "mkv",
    label: "MKV",
    kind: "video",
    extension: "mkv",
    container: "Matroska",
    note: "H.264 + AAC · contenedor flexible",
    vcodec: "libx264",
    acodec: "aac",
  },
  webm: {
    id: "webm",
    label: "WebM",
    kind: "video",
    extension: "webm",
    container: "WebM",
    note: "VP9 + Opus · ideal para web",
    vcodec: "libvpx-vp9",
    acodec: "libopus",
  },
  mov: {
    id: "mov",
    label: "MOV",
    kind: "video",
    extension: "mov",
    container: "QuickTime",
    note: "H.264 + AAC · flujo de edición",
    vcodec: "libx264",
    acodec: "aac",
  },

  mp3: {
    id: "mp3",
    label: "MP3",
    kind: "audio",
    extension: "mp3",
    container: "MPEG Audio",
    note: "LAME · el más compatible",
    acodec: "libmp3lame",
    recommended: true,
  },
  aac: {
    id: "aac",
    label: "AAC",
    kind: "audio",
    extension: "aac",
    container: "ADTS AAC",
    note: "Mejor calidad por tamaño",
    acodec: "aac",
  },
  m4a: {
    id: "m4a",
    label: "M4A",
    kind: "audio",
    extension: "m4a",
    container: "MPEG-4 Audio",
    note: "AAC con etiquetas ID3",
    acodec: "aac",
  },
  wav: {
    id: "wav",
    label: "WAV",
    kind: "audio",
    extension: "wav",
    container: "Waveform",
    note: "PCM sin compresión",
    acodec: "pcm_s16le",
    lossless: true,
  },
  flac: {
    id: "flac",
    label: "FLAC",
    kind: "audio",
    extension: "flac",
    container: "FLAC",
    note: "Sin pérdida comprimido",
    acodec: "flac",
    lossless: true,
  },
};

export const VIDEO_FORMATS: VideoFormat[] = ["mp4", "mkv", "webm", "mov"];
export const AUDIO_FORMATS: AudioFormat[] = ["mp3", "aac", "m4a", "wav", "flac"];

const TARGET_FORMAT_IDS = Object.keys(FORMATS) as TargetFormat[];

export function isTargetFormat(value: string): value is TargetFormat {
  return (TARGET_FORMAT_IDS as string[]).includes(value);
}

export function targetsFor(kind: MediaKind): TargetFormat[] {
  return kind === "video" ? [...VIDEO_FORMATS] : [...AUDIO_FORMATS];
}

export function defaultTargetFor(kind: MediaKind): TargetFormat {
  return kind === "video" ? "mp4" : "mp3";
}

export function formatSpec(target: TargetFormat): FormatSpec {
  return FORMATS[target];
}

export function formatLabel(target: TargetFormat): string {
  return FORMATS[target].label;
}

/** Quality labels shown in the segmented control. */
export const QUALITY_PRESETS: {
  id: QualityPreset;
  label: string;
  hint: string;
}[] = [
  { id: "high", label: "Alta", hint: "CRF 18 · archivos más grandes" },
  { id: "balanced", label: "Balance", hint: "CRF 23 · equilibrio" },
  { id: "compact", label: "Compacta", hint: "CRF 28 · mínimo tamaño" },
];

export function qualityLabel(quality: QualityPreset): string {
  return QUALITY_PRESETS.find((preset) => preset.id === quality)?.label ?? quality;
}

/**
 * A video file can always become audio; audio cannot become video.
 * `outputKind` narrows it further when a preset locked the output family
 * (e.g. "Video a audio" only accepts audio containers).
 */
export function canTarget(
  source: MediaKind,
  target: TargetFormat,
  outputKind?: MediaKind | null,
): boolean {
  const spec = FORMATS[target];
  if (outputKind && spec.kind !== outputKind) return false;
  if (source === "video") return true;
  return spec.kind === "audio";
}

/**
 * Target formats that make sense for a concrete file, in display order.
 * Video sources get video + audio outputs; audio sources only audio.
 * A preset can pass `outputKind` to offer a single family.
 */
export function availableTargets(
  source: MediaKind,
  outputKind?: MediaKind | null,
): TargetFormat[] {
  const targets =
    source === "video"
      ? [...VIDEO_FORMATS, ...AUDIO_FORMATS]
      : [...AUDIO_FORMATS];

  return outputKind
    ? targets.filter((target) => FORMATS[target].kind === outputKind)
    : targets;
}

export type ConversionPreset = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  source: MediaKind;
  target: TargetFormat;
  badge: string;
  icon: "video" | "audio" | "wave" | "compress";
  /** Category drives the accent color of the tile. */
  tone: "accent" | "info" | "success" | "warning";
};

/** The "conversiones frecuentes" grid. */
export const CONVERSION_PRESETS: ConversionPreset[] = [
  {
    id: "video-to-mp4",
    title: "Video a MP4",
    subtitle: "Universal · H.264",
    description:
      "Convierte MKV, MOV, AVI o WebM a un MP4 que se reproduce en cualquier dispositivo.",
    source: "video",
    target: "mp4",
    badge: "RECOMENDADO",
    icon: "video",
    tone: "accent",
  },
  {
    id: "video-to-audio",
    title: "Video a audio",
    subtitle: "Extracción directa",
    description:
      "Separa la pista de sonido de cualquier clip y expórtala a MP3 sin recodificar el video.",
    source: "video",
    target: "mp3",
    badge: "1 CLIC",
    icon: "audio",
    tone: "info",
  },
  {
    id: "audio-to-flac",
    title: "Audio sin pérdida",
    subtitle: "FLAC / WAV",
    description:
      "Transcodifica MP3, M4A o AAC a FLAC para archivar con la máxima calidad posible.",
    source: "audio",
    target: "flac",
    badge: "ARCHIVO",
    icon: "wave",
    tone: "success",
  },
  {
    id: "audio-to-mp3",
    title: "Audio a MP3",
    subtitle: "320 kbps",
    description:
      "Normaliza y comprime una tanda de audios a MP3 compatible con cualquier reproductor.",
    source: "audio",
    target: "mp3",
    badge: "LOTE",
    icon: "audio",
    tone: "info",
  },
  {
    id: "video-compress",
    title: "Comprimir video",
    subtitle: "Máximo ahorro",
    description:
      "Reduce el peso de un video largo manteniendo la resolución y la sincronía de audio.",
    source: "video",
    target: "mp4",
    badge: "COMPACTA",
    icon: "compress",
    tone: "warning",
  },
  {
    id: "video-to-webm",
    title: "Video para web",
    subtitle: "VP9 + Opus",
    description:
      "Genera un WebM ligero para incrustar en webs, con soporte de transparencia.",
    source: "video",
    target: "webm",
    badge: "WEB",
    icon: "video",
    tone: "accent",
  },
];
