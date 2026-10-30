import { describe, expect, it } from "vitest";
import {
  applyUpdate,
  clampPercent,
  countJobs,
  createJob,
  groupByTarget,
  isActive,
  queueEtaSeconds,
  retargetJob,
  sortJobs,
  type Job,
} from "@/lib/jobs";
import type { TargetFormat } from "@/lib/formats";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    ...createJob(
      {
        inputPath: "C:/media/clip.mkv",
        kind: "video",
        target: "mp4",
        quality: "balanced",
        inputBytes: 1000,
      },
      overrides.id ?? "job-1",
    ),
    ...overrides,
  };
}

describe("clampPercent", () => {
  it("keeps values inside 0-100 with one decimal", () => {
    expect(clampPercent(42.456)).toBe(42.5);
    expect(clampPercent(-3)).toBe(0);
    expect(clampPercent(120)).toBe(100);
  });

  it("normalizes non-finite input", () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("createJob", () => {
  it("derives names and the output path", () => {
    const job = createJob(
      {
        inputPath: "C:/media/clip.mkv",
        kind: "video",
        target: "mp3",
        quality: "high",
        inputBytes: 2048,
        durationSeconds: 60,
      },
      "fixed-id",
    );

    expect(job.id).toBe("fixed-id");
    expect(job.sourceName).toBe("clip.mkv");
    expect(job.outputName).toBe("clip.mp3");
    expect(job.outputPath).toBe("C:/media/clip.mp3");
    expect(job.status).toBe("queued");
    expect(job.progress).toBe(0);
  });
});

describe("retargetJob", () => {
  it("keeps the job id and updates the output", () => {
    const job = makeJob();
    const next = retargetJob(job, "webm");

    expect(next.id).toBe(job.id);
    expect(next.outputName).toBe("clip.webm");
    expect(next.outputPath).toBe("C:/media/clip.webm");
  });

  it("requeues a finished job", () => {
    const job = makeJob({ status: "done", progress: 100 });
    const next = retargetJob(job, "mov");

    expect(next.status).toBe("queued");
    expect(next.progress).toBe(0);
  });

  it("does not disturb a running job", () => {
    const job = makeJob({ status: "running", progress: 40 });
    expect(retargetJob(job, "mov").status).toBe("running");
  });
});

describe("countJobs", () => {
  it("counts every status and the overall percent", () => {
    const jobs = [
      makeJob({ id: "a", status: "done", progress: 100 }),
      makeJob({ id: "b", status: "running", progress: 50 }),
      makeJob({ id: "c", status: "queued" }),
      makeJob({ id: "d", status: "failed" }),
    ];

    const counts = countJobs(jobs);
    expect(counts).toMatchObject({
      total: 4,
      done: 1,
      running: 1,
      queued: 1,
      failed: 1,
      active: 2,
    });
    expect(counts.percent).toBe(37.5);
  });

  it("reports zero for an empty queue", () => {
    expect(countJobs([]).percent).toBe(0);
    expect(countJobs([]).active).toBe(0);
  });
});

describe("sortJobs", () => {
  it("orders running, queued and finished jobs", () => {
    const jobs = [
      makeJob({ id: "done", status: "done" }),
      makeJob({ id: "queued", status: "queued" }),
      makeJob({ id: "running", status: "running" }),
    ];

    expect(sortJobs(jobs).map((job) => job.id)).toEqual([
      "running",
      "queued",
      "done",
    ]);
  });

  it("does not mutate the input array", () => {
    const jobs = [makeJob({ id: "b", status: "done" }), makeJob({ id: "a", status: "running" })];
    sortJobs(jobs);
    expect(jobs[0].id).toBe("b");
  });
});

describe("queueEtaSeconds", () => {
  it("returns null when nothing is pending", () => {
    expect(queueEtaSeconds([makeJob({ status: "done" })])).toBeNull();
  });

  it("adds the running ETA plus one duration per queued job", () => {
    const jobs = [
      makeJob({ id: "run", status: "running", etaSeconds: 30 }),
      makeJob({ id: "q1", status: "queued", durationSeconds: 120 }),
      makeJob({ id: "q2", status: "queued", durationSeconds: 60 }),
    ];
    expect(queueEtaSeconds(jobs)).toBe(210);
  });

  it("falls back to one second when a queued job has no duration", () => {
    expect(queueEtaSeconds([makeJob({ status: "queued" })])).toBe(1);
  });
});

describe("groupByTarget", () => {
  it("groups jobs by their target format", () => {
    const groups = groupByTarget([
      makeJob({ id: "a", target: "mp3" }),
      makeJob({ id: "b", target: "mp3" }),
      makeJob({ id: "c", target: "mp4" }),
    ]);
    expect(groups.mp3).toHaveLength(2);
    expect(groups.mp4).toHaveLength(1);
  });
});

describe("isActive", () => {
  it("is true only for queued and running jobs", () => {
    expect(isActive(makeJob({ status: "queued" }))).toBe(true);
    expect(isActive(makeJob({ status: "running" }))).toBe(true);
    expect(isActive(makeJob({ status: "done" }))).toBe(false);
    expect(isActive(makeJob({ status: "failed" }))).toBe(false);
  });
});

describe("target typing", () => {
  it("accepts audio targets on a video job", () => {
    const job = makeJob();
    const target: TargetFormat = "flac";
    expect(retargetJob(job, target).outputName).toBe("clip.flac");
  });
});

describe("applyUpdate", () => {
  it("merges progress and telemetry without dropping prior values", () => {
    const job = makeJob();
    const running = applyUpdate(job, {
      id: job.id,
      status: "running",
      progress: 42.44,
      speed: 2.4,
      fps: 120,
      etaSeconds: 12,
    });

    expect(running.status).toBe("running");
    expect(running.progress).toBe(42.4);
    expect(running.speed).toBe(2.4);
    expect(running.startedAt).toBeTypeOf("number");
  });

  it("keeps the previous value when an update omits a field", () => {
    const job = makeJob({ status: "running", speed: 3.1, progress: 30 });
    const next = applyUpdate(job, { id: job.id, progress: 55 });

    expect(next.speed).toBe(3.1);
    expect(next.progress).toBe(55);
  });

  it("forces 100% and stamps the finish time on done", () => {
    const job = makeJob({ status: "running", progress: 89 });
    const done = applyUpdate(job, { id: job.id, status: "done" });

    expect(done.progress).toBe(100);
    expect(done.finishedAt).toBeTypeOf("number");
  });

  it("records the error of a failed job", () => {
    const job = makeJob({
      status: "running",
      startedAt: Date.now() - 1000,
    });
    const failed = applyUpdate(job, {
      id: job.id,
      status: "failed",
      error: "Conversion failed!",
    });

    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("Conversion failed!");
    expect(failed.finishedAt).toBeGreaterThanOrEqual(failed.startedAt!);
  });
});
