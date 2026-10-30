import { create } from "zustand";
import { persist } from "zustand/middleware";
import { backend } from "@/lib/backend";
import { applyUpdate, createJob, type Job, type JobUpdate } from "@/lib/jobs";
import type { QualityPreset } from "@/lib/formats";
import type { StagedFile } from "@/store/converter-store";

const HISTORY_LIMIT = 60;

type QueueState = {
  jobs: Job[];
  /** True once the engine event listener is attached. */
  listening: boolean;

  start: (
    files: StagedFile[],
    quality: QualityPreset,
    outputDirectory: string | null,
  ) => Promise<Job[]>;
  receive: (update: JobUpdate) => void;
  cancel: (id: string) => Promise<void>;
  cancelAll: () => Promise<void>;
  retry: (id: string) => Promise<void>;
  remove: (id: string) => void;
  clearFinished: () => void;
};

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      jobs: [],
      listening: false,

      async start(files, quality, outputDirectory) {
        if (files.length === 0) return [];

        const jobs = files.map((file) =>
          createJob({
            inputPath: file.path,
            kind: file.kind,
            target: file.target,
            quality,
            inputBytes: file.bytes,
            durationSeconds: file.durationSeconds,
            outputDirectory,
          }),
        );

        set((state) => ({ jobs: [...state.jobs, ...jobs] }));

        for (const job of jobs) {
          try {
            await backend.startJob({
              jobId: job.id,
              inputPath: job.inputPath,
              outputPath: job.outputPath,
              target: job.target,
              quality: job.quality,
              durationSeconds: job.durationSeconds,
              inputBytes: job.inputBytes,
            });
          } catch (error) {
            get().receive({
              id: job.id,
              status: "failed",
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return jobs;
      },

      receive(update) {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === update.id ? applyUpdate(job, update) : job,
          ),
        }));
      },

      async cancel(id) {
        await backend.cancelJob(id);
        get().receive({ id, status: "canceled" });
      },

      async cancelAll() {
        const active = get().jobs.filter(
          (job) => job.status === "running" || job.status === "queued",
        );
        await Promise.all(
          active.map(async (job) => {
            await backend.cancelJob(job.id);
            get().receive({ id: job.id, status: "canceled" });
          }),
        );
      },

      async retry(id) {
        const job = get().jobs.find((item) => item.id === id);
        if (!job) return;

        set((state) => ({
          jobs: state.jobs.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "queued",
                  progress: 0,
                  error: undefined,
                  etaSeconds: undefined,
                  finishedAt: undefined,
                  outputBytes: undefined,
                }
              : item,
          ),
        }));

        try {
          await backend.startJob({
            jobId: job.id,
            inputPath: job.inputPath,
            outputPath: job.outputPath,
            target: job.target,
            quality: job.quality,
            durationSeconds: job.durationSeconds,
            inputBytes: job.inputBytes,
          });
        } catch (error) {
          get().receive({
            id,
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },

      remove(id) {
        set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) }));
      },

      clearFinished() {
        set((state) => ({
          jobs: state.jobs.filter(
            (job) =>
              job.status === "running" ||
              job.status === "queued",
          ),
        }));
      },
    }),
    {
      name: "ff.queue",
      partialize: (state) => ({
        jobs: state.jobs.filter((job) => job.status !== "running" && job.status !== "queued"),
      }),
    },
  ),
);

/** Subscribes the store to engine events exactly once. */
export function attachQueueListener(): () => void {
  if (useQueueStore.getState().listening) return () => {};

  useQueueStore.setState({ listening: true });
  const unsubscribe = backend.onJobUpdate((update) =>
    useQueueStore.getState().receive(update),
  );

  return () => {
    unsubscribe();
    useQueueStore.setState({ listening: false });
  };
}

export { HISTORY_LIMIT };
