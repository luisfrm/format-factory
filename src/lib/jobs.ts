import type { MediaKind, QualityPreset, TargetFormat } from "@/lib/formats";
import { buildOutputPath, extname, fileName } from "@/lib/files";

export type JobStatus = "queued" | "running" | "done" | "failed" | "canceled";

export type Job = {
  id: string;
  inputPath: string;
  outputPath: string;
  sourceName: string;
  outputName: string;
  sourceExtension: string;
  kind: MediaKind;
  target: TargetFormat;
  quality: QualityPreset;
  status: JobStatus;
  /** 0-100, one decimal. */
  progress: number;
  inputBytes: number;
  outputBytes?: number;
  durationSeconds?: number;
  fps?: number;
  /** Encoder speed multiplier, e.g. 2.4 means 2.4x realtime. */
  speed?: number;
  etaSeconds?: number;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
};

/** Partial update emitted by the conversion engine. */
export type JobUpdate = {
  id: string;
  status?: JobStatus;
  progress?: number;
  fps?: number;
  speed?: number;
  etaSeconds?: number;
  outputBytes?: number;
  error?: string;
};

const TERMINAL_STATUSES: JobStatus[] = ["done", "failed", "canceled"];

/** Merges an engine update into a job without losing previous telemetry. */
export function applyUpdate(job: Job, update: JobUpdate): Job {
  const status = update.status ?? job.status;
  const running = status === "running";

  return {
    ...job,
    status,
    progress: status === "done" ? 100 : (update.progress !== undefined ? clampPercent(update.progress) : job.progress),
    fps: update.fps ?? job.fps,
    speed: update.speed ?? job.speed,
    etaSeconds: update.etaSeconds ?? job.etaSeconds,
    outputBytes: update.outputBytes ?? job.outputBytes,
    error: update.error ?? job.error,
    startedAt: running && job.startedAt === undefined ? Date.now() : job.startedAt,
    finishedAt: TERMINAL_STATUSES.includes(status)
      ? (job.finishedAt ?? Date.now())
      : job.finishedAt,
  };
}

export type JobCounts = {
  total: number;
  queued: number;
  running: number;
  done: number;
  failed: number;
  canceled: number;
  /** queued + running */
  active: number;
  /** Overall completion across every job, 0-100. */
  percent: number;
};

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return Math.round(value * 10) / 10;
}

export function countJobs(jobs: Job[]): JobCounts {
  const counts: JobCounts = {
    total: jobs.length,
    queued: 0,
    running: 0,
    done: 0,
    failed: 0,
    canceled: 0,
    active: 0,
    percent: 0,
  };

  let progressSum = 0;

  for (const job of jobs) {
    counts[job.status] += 1;
    if (job.status === "done") {
      progressSum += 100;
    } else if (job.status === "running") {
      progressSum += job.progress;
    }
  }

  counts.active = counts.queued + counts.running;
  counts.percent = jobs.length === 0 ? 0 : clampPercent(progressSum / jobs.length);
  return counts;
}

/** Groups jobs by target so the UI can say "3 archivos a MP3". */
export function groupByTarget(jobs: Job[]): Record<string, Job[]> {
  return jobs.reduce<Record<string, Job[]>>((groups, job) => {
    (groups[job.target] ??= []).push(job);
    return groups;
  }, {});
}

/**
 * Remaining time for the whole queue: running job ETA plus queued jobs
 * estimated through their already measured speed.
 */
export function queueEtaSeconds(jobs: Job[]): number | null {
  const pending = jobs.filter((job) => job.status === "queued");
  const running = jobs.filter((job) => job.status === "running");

  let seconds = 0;
  if (running.length > 0) {
    const fastest = running.reduce(
      (best, job) => (job.etaSeconds !== undefined && job.etaSeconds < best ? job.etaSeconds : best),
      Number.POSITIVE_INFINITY,
    );
    if (Number.isFinite(fastest)) seconds += fastest;
  }

  for (const job of pending) {
    const duration = job.durationSeconds ?? 0;
    seconds += duration > 0 ? duration : 1;
  }

  if (seconds <= 0 && pending.length === 0) return null;
  return Math.round(seconds);
}

/** Deterministic ordering: running first, then queued, then finished. */
export function sortJobs(jobs: Job[]): Job[] {
  const weight: Record<JobStatus, number> = {
    running: 0,
    queued: 1,
    failed: 2,
    canceled: 3,
    done: 4,
  };

  return [...jobs].sort((a, b) => {
    const byStatus = weight[a.status] - weight[b.status];
    if (byStatus !== 0) return byStatus;
    return (a.startedAt ?? 0) - (b.startedAt ?? 0);
  });
}

export function isActive(job: Job): boolean {
  return job.status === "queued" || job.status === "running";
}

export type NewJobInput = {
  inputPath: string;
  kind: MediaKind;
  target: TargetFormat;
  quality: QualityPreset;
  inputBytes: number;
  durationSeconds?: number;
  outputDirectory?: string | null;
};

/** Builds a queued job, deriving names and the output path from the target. */
export function createJob(
  input: NewJobInput,
  id: string = crypto.randomUUID(),
): Job {
  const outputPath = buildOutputPath(
    input.inputPath,
    input.target,
    input.outputDirectory,
  );

  return {
    id,
    inputPath: input.inputPath,
    outputPath,
    sourceName: fileName(input.inputPath),
    outputName: fileName(outputPath),
    sourceExtension: extname(input.inputPath),
    kind: input.kind,
    target: input.target,
    quality: input.quality,
    status: "queued",
    progress: 0,
    inputBytes: input.inputBytes,
    durationSeconds: input.durationSeconds,
  };
}

/** Re-targets an existing job without losing its identity. */
export function retargetJob(
  job: Job,
  target: TargetFormat,
  outputDirectory?: string | null,
): Job {
  const outputPath = buildOutputPath(job.inputPath, target, outputDirectory);
  return {
    ...job,
    target,
    outputPath,
    outputName: fileName(outputPath),
    // A finished job that changes target must be reprocessed.
    status: job.status === "done" ? "queued" : job.status,
    progress: job.status === "done" ? 0 : job.progress,
  };
}

