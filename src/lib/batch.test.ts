import { describe, expect, it } from "vitest";
import { pendingFiles, summarizeBatch } from "@/lib/batch";
import { createJob, type Job } from "@/lib/jobs";

function job(id: string, overrides: Partial<Job> = {}): Job {
  return {
    ...createJob(
      {
        inputPath: `C:/media/${id}.mkv`,
        kind: "video",
        target: "mp4",
        quality: "balanced",
        inputBytes: 1000,
      },
      `job-${id}`,
    ),
    ...overrides,
  };
}

describe("summarizeBatch", () => {
  it("handles an empty batch", () => {
    const summary = summarizeBatch([], []);
    expect(summary.total).toBe(0);
    expect(summary.percent).toBe(0);
    expect(summary.allDone).toBe(false);
  });

  it("reports every file as ready when nothing has started", () => {
    const summary = summarizeBatch([{ id: "a" }, { id: "b" }], []);
    expect(summary.ready).toBe(2);
    expect(summary.started).toBe(false);
    expect(summary.percent).toBe(0);
  });

  it("merges statuses from linked jobs", () => {
    const jobs = [
      job("a", { status: "done", progress: 100 }),
      job("b", { status: "running", progress: 50 }),
      job("c", { status: "queued" }),
    ];

    const summary = summarizeBatch(
      [
        { id: "1", jobId: "job-a" },
        { id: "2", jobId: "job-b" },
        { id: "3", jobId: "job-c" },
      ],
      jobs,
    );

    expect(summary).toMatchObject({
      total: 3,
      done: 1,
      running: 1,
      queued: 1,
      active: 2,
      started: true,
      allDone: false,
    });
    expect(summary.percent).toBe(50);
  });

  it("counts unlinked files as ready even when other jobs exist", () => {
    const jobs = [job("a", { status: "done", progress: 100 })];
    const summary = summarizeBatch(
      [{ id: "1", jobId: "job-a" }, { id: "2" }],
      jobs,
    );

    expect(summary.done).toBe(1);
    expect(summary.ready).toBe(1);
    expect(summary.percent).toBe(50);
  });

  it("marks the batch as done only when every file succeeded", () => {
    const jobs = [
      job("a", { status: "done", progress: 100 }),
      job("b", { status: "failed", progress: 40 }),
    ];

    const summary = summarizeBatch(
      [
        { id: "1", jobId: "job-a" },
        { id: "2", jobId: "job-b" },
      ],
      jobs,
    );

    expect(summary.allDone).toBe(false);
    expect(summary.failed).toBe(1);
  });

  it("ignores job ids that are not in the queue anymore", () => {
    const summary = summarizeBatch([{ id: "1", jobId: "deleted" }], []);
    expect(summary.ready).toBe(1);
    expect(summary.started).toBe(false);
  });
});

describe("pendingFiles", () => {
  it("returns only files without a job", () => {
    const files = [
      { id: "1", jobId: "job-a" },
      { id: "2" },
      { id: "3" },
    ];

    expect(pendingFiles(files).map((file) => file.id)).toEqual(["2", "3"]);
  });
});
