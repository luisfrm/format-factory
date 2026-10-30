import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type AvailableUpdate,
  type DownloadProgress,
  updater,
} from "@/lib/updater";
import { snoozeUntil } from "@/lib/update-policy";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";

/** What a check produced, so the caller can react (e.g. show a toast). */
export type CheckResult = "available" | "up-to-date" | "error" | "skipped";

type UpdateState = {
  currentVersion: string | null;
  platform: string | null;
  installKind: string | null;
  supported: boolean;

  status: UpdateStatus;
  available: AvailableUpdate | null;
  progress: DownloadProgress;
  error: string | null;

  /** Persisted so the banner does not nag after a restart. */
  lastCheckedAt: number | null;
  snoozedUntil: number | null;
  skippedVersion: string | null;

  dialogOpen: boolean;

  init: () => Promise<void>;
  check: () => Promise<CheckResult>;
  install: () => Promise<void>;
  snooze: () => void;
  skip: () => void;
  openDialog: () => void;
  closeDialog: () => void;
  clearError: () => void;
};

const EMPTY_PROGRESS: DownloadProgress = {
  downloaded: 0,
  total: null,
  percent: null,
};

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set, get) => ({
      currentVersion: null,
      platform: null,
      installKind: null,
      supported: false,

      status: "idle",
      available: null,
      progress: EMPTY_PROGRESS,
      error: null,

      lastCheckedAt: null,
      snoozedUntil: null,
      skippedVersion: null,

      dialogOpen: false,

      async init() {
        if (get().currentVersion) return;

        try {
          const [runtime, version] = await Promise.all([
            updater.runtime(),
            updater.currentVersion(),
          ]);

          set({
            currentVersion: version,
            platform: runtime.platform,
            installKind: runtime.installKind,
            supported: runtime.updaterSupported,
          });
        } catch {
          set({ currentVersion: "0.0.0", supported: false });
        }
      },

      async check() {
        if (get().status === "checking" || get().status === "downloading") {
          return "skipped";
        }

        set({ status: "checking", error: null });

        try {
          const available = await updater.check();

          set({
            available,
            status: available ? "available" : "idle",
            lastCheckedAt: Date.now(),
          });

          return available ? "available" : "up-to-date";
        } catch (error) {
          set({
            status: "error",
            lastCheckedAt: Date.now(),
            error:
              error instanceof Error
                ? error.message
                : "No se pudo comprobar si hay actualizaciones",
          });

          return "error";
        }
      },

      async install() {
        if (get().status === "downloading" || !get().available) return;

        set({ status: "downloading", error: null, progress: EMPTY_PROGRESS });

        try {
          await updater.downloadAndInstall((progress) => set({ progress }));
          set({ status: "ready" });

          // The installer replaces the binary; give the UI a beat to show it.
          window.setTimeout(() => {
            void updater.relaunch();
          }, 1200);
        } catch (error) {
          set({
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "La actualización no se pudo instalar",
          });
        }
      },

      snooze() {
        set({
          snoozedUntil: snoozeUntil(),
          dialogOpen: false,
        });
      },

      skip() {
        set({
          skippedVersion: get().available?.version ?? null,
          dialogOpen: false,
        });
      },

      openDialog() {
        set({ dialogOpen: true });
      },

      closeDialog() {
        set({ dialogOpen: false });
      },

      clearError() {
        set({ error: null, status: get().available ? "available" : "idle" });
      },
    }),
    {
      name: "ff.updates",
      partialize: (state) => ({
        lastCheckedAt: state.lastCheckedAt,
        snoozedUntil: state.snoozedUntil,
        skippedVersion: state.skippedVersion,
      }),
    },
  ),
);
