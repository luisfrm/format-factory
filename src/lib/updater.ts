import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { isTauri } from "@/lib/backend";

export type AvailableUpdate = {
  version: string;
  notes: string | null;
  date: string | null;
};

export type DownloadProgress = {
  downloaded: number;
  total: number | null;
  /** 0-100, or null when the server did not send a content length. */
  percent: number | null;
};

export type RuntimeInfo = {
  platform: string;
  installKind: string;
  updaterSupported: boolean;
};

export interface Updater {
  readonly kind: "native" | "demo";
  runtime(): Promise<RuntimeInfo>;
  currentVersion(): Promise<string>;
  check(): Promise<AvailableUpdate | null>;
  downloadAndInstall(onProgress: (progress: DownloadProgress) => void): Promise<void>;
  relaunch(): Promise<void>;
}

/**
 * The updater plugin hands back an opaque `Update` handle that must be reused
 * for the download, so it is cached between `check()` and `downloadAndInstall()`.
 */
let pending: Update | null = null;

const nativeUpdater: Updater = {
  kind: "native",

  runtime: () => invoke<RuntimeInfo>("runtime_info"),

  currentVersion: () => getVersion(),

  async check() {
    pending = await check();
    if (!pending) return null;

    return {
      version: pending.version,
      notes: pending.body ?? null,
      date: pending.date ?? null,
    };
  },

  async downloadAndInstall(onProgress) {
    if (!pending) throw new Error("No hay una actualización preparada");

    let downloaded = 0;
    let total: number | null = null;

    await pending.downloadAndInstall((event) => {
      if (event.event === "Started") {
        total = event.data.contentLength ?? null;
      } else if (event.event === "Progress") {
        downloaded += event.data.chunkLength;
      }

      onProgress({
        downloaded,
        total,
        percent: total && total > 0 ? Math.min(100, (downloaded / total) * 100) : null,
      });
    });
  },

  relaunch,
};

/** Browser/dev fallback: never reports an update. */
const demoUpdater: Updater = {
  kind: "demo",
  runtime: async () => ({
    platform: "browser",
    installKind: "unknown",
    updaterSupported: false,
  }),
  currentVersion: async () => "0.0.0",
  check: async () => null,
  downloadAndInstall: async () => {
    throw new Error("Las actualizaciones solo funcionan en la app instalada");
  },
  relaunch: async () => {},
};

export const updater: Updater = isTauri ? nativeUpdater : demoUpdater;
