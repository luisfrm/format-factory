import { create } from "zustand";
import { backend } from "@/lib/backend";
import { extname, fileName, isSupportedFile, kindFromPath } from "@/lib/files";
import {
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
  /** True while ffprobe is still reading the file. */
  probing: boolean;
};

type ConverterState = {
  files: StagedFile[];
  quality: QualityPreset;
  outputDirectory: string | null;
  /** Target pre-selected by a preset tile, applied to the next picked files. */
  pendingTarget: TargetFormat | null;

  addPaths: (paths: string[]) => Promise<void>;
  pickFiles: () => Promise<void>;
  pickFilesWithTarget: (target: TargetFormat) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setTarget: (id: string, target: TargetFormat) => void;
  applyTargetToAll: (target: TargetFormat) => void;
  setQuality: (quality: QualityPreset) => void;
  setOutputDirectory: (directory: string | null) => void;
  pickOutputDirectory: () => Promise<void>;
};

function stage(path: string, preferred: TargetFormat | null): StagedFile {
  const kind = kindFromPath(path) ?? "video";
  const target =
    preferred && canTarget(kind, preferred) ? preferred : defaultTargetFor(kind);

  return {
    id: crypto.randomUUID(),
    path,
    name: fileName(path),
    extension: extname(path),
    kind,
    bytes: 0,
    target,
    probing: true,
  };
}

export const useConverterStore = create<ConverterState>()((set, get) => ({
  files: [],
  quality: "balanced",
  outputDirectory: null,
  pendingTarget: null,

  async addPaths(paths) {
    const state = get();
    const existing = new Set(state.files.map((file) => file.path));
    const fresh = paths.filter(
      (path) => !existing.has(path) && isSupportedFile(path),
    );
    if (fresh.length === 0) return;

    const preferred = state.pendingTarget;
    set((current) => ({
      files: [...current.files, ...fresh.map((path) => stage(path, preferred))],
      pendingTarget: null,
    }));

    try {
      const probed = await backend.probe(fresh);
      const byPath = new Map(probed.map((result) => [result.path, result]));

      set((current) => ({
        files: current.files.map((file) => {
          const result = byPath.get(file.path);
          if (!result) return { ...file, probing: false };

          const target =
            file.kind !== result.kind &&
            !canTarget(result.kind, file.target)
              ? defaultTargetFor(result.kind)
              : file.target;

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
    const paths = await backend.pickMediaFiles();
    if (paths.length > 0) await get().addPaths(paths);
  },

  async pickFilesWithTarget(target) {
    set({ pendingTarget: target });
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
        file.id === id ? { ...file, target } : file,
      ),
    }));
  },

  applyTargetToAll(target) {
    set((state) => ({
      files: state.files.map((file) =>
        canTarget(file.kind, target) ? { ...file, target } : file,
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
