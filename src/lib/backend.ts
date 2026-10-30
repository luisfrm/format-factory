import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { ACCEPTED_EXTENSIONS, extname, fileName, kindFromPath } from "@/lib/files";
import type { MediaKind, QualityPreset, TargetFormat } from "@/lib/formats";
import type { JobUpdate } from "@/lib/jobs";

/** True when running inside the Tauri webview, false in a normal browser. */
export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export type EngineStatus = {
  id: string;
  label: string;
  available: boolean;
  version: string | null;
};

export type ProbeResult = {
  path: string;
  name: string;
  extension: string;
  kind: MediaKind;
  bytes: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  videoCodec?: string;
  audioCodec?: string;
};

export type JobSpec = {
  jobId: string;
  inputPath: string;
  outputPath: string;
  target: TargetFormat;
  quality: QualityPreset;
  durationSeconds?: number;
  /** Only used by the demo backend to report a plausible output size. */
  inputBytes?: number;
};

export interface Backend {
  readonly kind: "native" | "demo";
  engines(): Promise<EngineStatus[]>;
  pickMediaFiles(): Promise<string[]>;
  pickDirectory(): Promise<string | null>;
  probe(paths: string[]): Promise<ProbeResult[]>;
  startJob(spec: JobSpec): Promise<void>;
  cancelJob(jobId: string): Promise<void>;
  revealInFolder(path: string): Promise<void>;
  openFile(path: string): Promise<void>;
  onJobUpdate(callback: (update: JobUpdate) => void): () => void;
}

const MEDIA_FILTER = {
  name: "Video y audio",
  extensions: [...ACCEPTED_EXTENSIONS],
};

function normalizeProbe(path: string, raw: Partial<ProbeResult>): ProbeResult {
  const kind = raw.kind ?? kindFromPath(path) ?? "video";
  return {
    path,
    name: raw.name ?? fileName(path),
    extension: raw.extension ?? extname(path),
    kind,
    bytes: raw.bytes ?? 0,
    durationSeconds: raw.durationSeconds,
    width: raw.width,
    height: raw.height,
    videoCodec: raw.videoCodec,
    audioCodec: raw.audioCodec,
  };
}

/* ------------------------------------------------------------------ */
/* Native backend (Tauri)                                              */
/* ------------------------------------------------------------------ */

const nativeBackend: Backend = {
  kind: "native",

  engines: () => invoke<EngineStatus[]>("engine_status"),

  async pickMediaFiles() {
    const selection = await openDialog({
      multiple: true,
      directory: false,
      filters: [MEDIA_FILTER],
    });
    if (!selection) return [];
    return Array.isArray(selection) ? selection : [selection];
  },

  async pickDirectory() {
    const selection = await openDialog({ directory: true, multiple: false });
    return typeof selection === "string" ? selection : null;
  },

  async probe(paths) {
    if (paths.length === 0) return [];
    const results = await invoke<Partial<ProbeResult>[]>("probe_files", { paths });
    return results.map((raw, index) => normalizeProbe(paths[index], raw));
  },

  startJob: (spec) => invoke<void>("enqueue_job", { spec }),
  cancelJob: (jobId) => invoke<void>("cancel_job", { jobId }),
  revealInFolder: (path) => revealItemInDir(path),
  openFile: (path) => openPath(path),

  onJobUpdate(callback) {
    const unlisten = listen<JobUpdate>("job-event", (event) =>
      callback(event.payload),
    );
    return () => {
      void unlisten.then((dispose) => dispose());
    };
  },
};

/* ------------------------------------------------------------------ */
/* Demo backend (browser / Playwright)                                 */
/* ------------------------------------------------------------------ */

/**
 * Keeps the app fully explorable in a browser: file picking uses a real
 * <input type="file">, probing reads File metadata and conversions are
 * simulated so every visual state can be reviewed without Tauri.
 */
function createDemoBackend(): Backend {
  const picked = new Map<string, File>();
  const listeners = new Set<(update: JobUpdate) => void>();
  const timers = new Map<string, number>();
  const canceled = new Set<string>();
  let queue: Promise<void> = Promise.resolve();

  function emit(update: JobUpdate) {
    for (const listener of listeners) listener(update);
  }

  function runJob(spec: JobSpec): Promise<void> {
    return new Promise((resolve) => {
      if (canceled.delete(spec.jobId)) {
        emit({ id: spec.jobId, status: "canceled" });
        resolve();
        return;
      }

      const totalMs = 2600;
      const startedAt = Date.now();
      emit({ id: spec.jobId, status: "running", progress: 0 });

      const timer = window.setInterval(() => {
        if (canceled.delete(spec.jobId)) {
          window.clearInterval(timer);
          timers.delete(spec.jobId);
          emit({ id: spec.jobId, status: "canceled" });
          resolve();
          return;
        }

        const elapsed = Date.now() - startedAt;

        if (elapsed >= totalMs) {
          window.clearInterval(timer);
          timers.delete(spec.jobId);
          emit({
            id: spec.jobId,
            status: "done",
            progress: 100,
            outputBytes: spec.inputBytes
              ? Math.round(spec.inputBytes * 0.72)
              : undefined,
          });
          resolve();
          return;
        }

        emit({
          id: spec.jobId,
          status: "running",
          progress: Math.min(99.9, (elapsed / totalMs) * 100 + Math.random() * 2),
          speed: 2.4,
          fps: 142,
          etaSeconds: Math.round((totalMs - elapsed) / 1000),
        });
      }, 140);

      timers.set(spec.jobId, timer);
    });
  }

  async function pickViaInput(): Promise<string[]> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");
      input.style.display = "none";
      document.body.appendChild(input);

      input.addEventListener(
        "change",
        () => {
          const files = Array.from(input.files ?? []);
          for (const file of files) picked.set(file.name, file);
          input.remove();
          resolve(files.map((file) => file.name));
        },
        { once: true },
      );

      input.addEventListener("cancel", () => {
        input.remove();
        resolve([]);
      });

      input.click();
    });
  }

  return {
    kind: "demo",

    async engines() {
      return [
        { id: "ffmpeg", label: "FFmpeg", available: false, version: null },
        { id: "ffprobe", label: "FFprobe", available: false, version: null },
      ];
    },

    pickMediaFiles: pickViaInput,
    pickDirectory: async () => null,

    async probe(paths) {
      return paths.map((path) => {
        const file = picked.get(path);
        return normalizeProbe(path, {
          bytes: file?.size ?? 0,
          kind: kindFromPath(path) ?? "video",
        });
      });
    },

    async startJob(spec) {
      // Mirror the native queue: one job at a time, FIFO.
      queue = queue.then(() => runJob(spec));
      await Promise.resolve();
    },

    async cancelJob(jobId) {
      // The running interval notices the flag on its next tick and resolves the
      // queue, so the chain never stalls.
      canceled.add(jobId);
    },

    async revealInFolder() {
      /* no-op in the browser */
    },

    async openFile() {
      /* no-op in the browser */
    },

    onJobUpdate(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

export const backend: Backend = isTauri ? nativeBackend : createDemoBackend();
