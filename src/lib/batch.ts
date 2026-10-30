import type { Job } from "@/lib/jobs";

/** Minimal shape needed from a staged file to summarize a batch. */
export type BatchFile = {
  id: string;
  jobId?: string;
};

export type BatchSummary = {
  total: number;
  /** Files with no job yet: they can be converted. */
  ready: number;
  queued: number;
  running: number;
  done: number;
  failed: number;
  canceled: number;
  /** queued + running */
  active: number;
  /** Overall completion of the batch, 0-100. */
  percent: number;
  /** At least one file already produced a job. */
  started: boolean;
  /** Every file finished successfully. */
  allDone: boolean;
};

export function summarizeBatch(
  files: BatchFile[],
  jobs: Job[],
): BatchSummary {
  const byId = new Map(jobs.map((job) => [job.id, job]));

  const summary: BatchSummary = {
    total: files.length,
    ready: 0,
    queued: 0,
    running: 0,
    done: 0,
    failed: 0,
    canceled: 0,
    active: 0,
    percent: 0,
    started: false,
    allDone: false,
  };

  let progressSum = 0;

  for (const file of files) {
    const job = file.jobId ? byId.get(file.jobId) : undefined;

    if (!job) {
      summary.ready += 1;
      continue;
    }

    summary.started = true;
    summary[job.status] += 1;

    if (job.status === "done") progressSum += 100;
    else if (job.status === "running") progressSum += job.progress;
  }

  summary.active = summary.queued + summary.running;
  summary.percent =
    files.length === 0 ? 0 : Math.round((progressSum / files.length) * 10) / 10;
  summary.allDone = files.length > 0 && summary.done === files.length;

  return summary;
}

/** Files that should be enqueued when the user presses "Convertir". */
export function pendingFiles<T extends BatchFile>(files: T[]): T[] {
  return files.filter((file) => !file.jobId);
}
