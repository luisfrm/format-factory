import { create } from "zustand";
import { backend } from "@/lib/backend";
import { extname, fileName, isSupportedFile, kindFromPath } from "@/lib/files";
import {
  FORMATS,
  availableTargets,
  canTarget,
  defaultTargetFor,
  type MediaKind,
  type QualityPreset,
  type TargetFormat,
} from "@/lib/formats";

export type StagedFile = {
  id: string;
  path: string;
  name: string;
  extension: string;
  kind: MediaKind;
  bytes: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  target: TargetFormat;
  /**
   * Output family fixed by the preset that staged this file ("Video a audio"
   * → "audio"). `null` means the source kind decides.
   */
  outputKind: MediaKind | null;
  /** Linked conversion job, once the batch is started. */
  jobId?: string;
  /** True while ffprobe is still reading the file. */
  probing: boolean;
};

/** Constraints carried from a preset tile into the file picker. */
export type IntakeOptions = {
  /** Only stage files of this kind. */
  source?: MediaKind | null;
  /** Fix the output kind of the staged files. */
  target?: TargetFormat | null;
};

type ConverterState = {
  files: StagedFile[];
  quality: QualityPreset;
  outputDirectory: string | null;
  /** Target pre-selected by a preset tile, applied to the next picked files. */
  pendingTarget: TargetFormat | null;
  /** Source kind required by the preset that opened the dialog. */
  pendingSource: MediaKind | null;

  addPaths: (paths: string[], intake?: IntakeOptions) => Promise<void>;
  pickFiles: () => Promise<void>;
  pickFilesWithTarget: (
    target: TargetFormat,
    source?: MediaKind,
  ) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setTarget: (id: string, target: TargetFormat) => void;
  applyTargetToAll: (target: TargetFormat) => void;
  /** Links freshly created jobs to their staged files (same order as `start`). */
  attachJobs: (entries: { fileId: string; jobId: string }[]) => void;
  setQuality: (quality: QualityPreset) => void;
  setOutputDirectory: (directory: string | null) => void;
  pickOutputDirectory: () => Promise<void>;
};

/** First target that respects both the source and the preset lock. */
function fallbackTarget(
  kind: MediaKind,
  outputKind: MediaKind | null,
): TargetFormat {
  const allowed = availableTargets(kind, outputKind);
  if (allowed.length > 0) return allowed[0];

  // Rare: probe finds an audio-only stream inside a "video → video" preset.
  // A valid target beats an impossible lock.
  return defaultTargetFor(kind);
}

function stage(
  path: string,
  preferred: TargetFormat | null,
  outputKind: MediaKind | null,
): StagedFile {
  const kind = kindFromPath(path) ?? "video";
  const target =
    preferred && canTarget(kind, preferred, outputKind)
      ? preferred
      : fallbackTarget(kind, outputKind);

  return {
    id: crypto.randomUUID(),
    path,
    name: fileName(path),
    extension: extname(path),
    kind,
    bytes: 0,
    target,
    outputKind,
    probing: true,
  };
}

export const useConverterStore = create<ConverterState>()((set, get) => ({
  files: [],
  quality: "balanced",
  outputDirectory: null,
  pendingTarget: null,
  pendingSource: null,

  async addPaths(paths, intake = {}) {
    const existing = new Set(get().files.map((file) => file.path));
    const source = intake.source ?? null;
    const preferred = intake.target ?? null;
    const outputKind = preferred ? FORMATS[preferred].kind : null;

    const fresh = paths.filter((path) => {
      if (existing.has(path) || !isSupportedFile(path, source)) return false;
      // The preset also decides the output family: a video-to-audio intake
      // never stages a file that cannot reach it.
      if (!preferred) return true;
      return canTarget(kindFromPath(path) ?? "video", preferred, outputKind);
    });
    if (fresh.length === 0) return;

    set((current) => ({
      files: [
        ...current.files,
        ...fresh.map((path) => stage(path, preferred, outputKind)),
      ],
    }));

    try {
      const probed = await backend.probe(fresh);
      const byPath = new Map(probed.map((result) => [result.path, result]));

      set((current) => ({
        files: current.files.map((file) => {
          const result = byPath.get(file.path);
          if (!result) return { ...file, probing: false };

          // ffprobe can contradict the extension (an .mkv holding only audio),
          // so the target is re-validated against the real kind and the lock.
          const target = canTarget(result.kind, file.target, file.outputKind)
            ? file.target
            : fallbackTarget(result.kind, file.outputKind);

          return {
            ...file,
            kind: result.kind,
            bytes: result.bytes,
            durationSeconds: result.durationSeconds,
            width: result.width,
            height: result.height,
            target,
            probing: false,
          };
        }),
      }));
    } catch {
      set((current) => ({
        files: current.files.map((file) =>
          file.probing ? { ...file, probing: false } : file,
        ),
      }));
    }
  },

  async pickFiles() {
    // Consume the preset *before* awaiting: a cancelled dialog must not leak
    // its intake into the next drag & drop.
    const { pendingSource, pendingTarget } = get();
    if (pendingSource || pendingTarget) {
      set({ pendingSource: null, pendingTarget: null });
    }

    const paths = await backend.pickMediaFiles(pendingSource);
    if (paths.length > 0) {
      await get().addPaths(paths, {
        source: pendingSource,
        target: pendingTarget,
      });
    }
  },

  async pickFilesWithTarget(target, source) {
    set({ pendingTarget: target, pendingSource: source ?? null });
    await get().pickFiles();
  },

  removeFile(id) {
    set((state) => ({ files: state.files.filter((file) => file.id !== id) }));
  },

  clearFiles() {
    set({ files: [] });
  },

  setTarget(id, target) {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id && canTarget(file.kind, target, file.outputKind)
          ? { ...file, target, jobId: undefined }
          : file,
      ),
    }));
  },

  applyTargetToAll(target) {
    set((state) => ({
      files: state.files.map((file) =>
        canTarget(file.kind, target, file.outputKind)
          ? { ...file, target, jobId: undefined }
          : file,
      ),
    }));
  },

  attachJobs(entries) {
    if (entries.length === 0) return;
    const byFile = new Map(entries.map((entry) => [entry.fileId, entry.jobId]));

    set((state) => ({
      files: state.files.map((file) =>
        byFile.has(file.id) ? { ...file, jobId: byFile.get(file.id) } : file,
      ),
    }));
  },

  setQuality(quality) {
    set({ quality });
  },

  setOutputDirectory(directory) {
    set({ outputDirectory: directory });
  },

  async pickOutputDirectory() {
    const directory = await backend.pickDirectory();
    if (directory) set({ outputDirectory: directory });
  },
}));
