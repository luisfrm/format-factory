import { describe, expect, it } from "vitest";
import {
  CHECK_INTERVAL_MS,
  compareVersions,
  daysLeft,
  shouldCheck,
  shouldNotify,
  snoozeUntil,
} from "@/lib/update-policy";

const DAY = 24 * 60 * 60 * 1000;

describe("shouldCheck", () => {
  it("checks when it has never checked before", () => {
    expect(shouldCheck(null)).toBe(true);
  });

  it("skips when the last check is recent", () => {
    const now = 1_000_000_000_000;
    expect(shouldCheck(now - DAY / 2, now)).toBe(false);
  });

  it("checks again after the interval", () => {
    const now = 1_000_000_000_000;
    expect(shouldCheck(now - CHECK_INTERVAL_MS, now)).toBe(true);
    expect(shouldCheck(now - CHECK_INTERVAL_MS - 1, now)).toBe(true);
  });
});

describe("shouldNotify", () => {
  const now = 1_000_000_000_000;

  it("does not notify without a version", () => {
    expect(shouldNotify(null, { skippedVersion: null, snoozedUntil: null }, now)).toBe(false);
  });

  it("notifies a fresh version", () => {
    expect(shouldNotify("0.2.0", { skippedVersion: null, snoozedUntil: null }, now)).toBe(true);
  });

  it("respects a skipped version", () => {
    expect(
      shouldNotify("0.2.0", { skippedVersion: "0.2.0", snoozedUntil: null }, now),
    ).toBe(false);
  });

  it("notifies again when the skipped version is superseded", () => {
    expect(
      shouldNotify("0.3.0", { skippedVersion: "0.2.0", snoozedUntil: null }, now),
    ).toBe(true);
  });

  it("respects an active snooze", () => {
    expect(
      shouldNotify("0.2.0", { skippedVersion: null, snoozedUntil: now + DAY }, now),
    ).toBe(false);
  });

  it("notifies once the snooze expires", () => {
    expect(
      shouldNotify("0.2.0", { skippedVersion: null, snoozedUntil: now - 1 }, now),
    ).toBe(true);
  });
});

describe("snoozeUntil", () => {
  it("returns a timestamp seven days ahead", () => {
    const now = 1_000_000_000_000;
    expect(snoozeUntil(now)).toBe(now + 7 * DAY);
  });

  it("accepts a custom number of days", () => {
    expect(snoozeUntil(0, 1)).toBe(DAY);
  });
});

describe("daysLeft", () => {
  it("rounds up partial days", () => {
    const now = 1_000_000_000_000;
    expect(daysLeft(now + DAY / 2, now)).toBe(1);
  });

  it("returns zero for expired or missing values", () => {
    expect(daysLeft(null)).toBe(0);
    expect(daysLeft(1, 1_000_000)).toBe(0);
  });
});

describe("compareVersions", () => {
  it("orders patch releases", () => {
    expect(compareVersions("0.1.1", "0.1.0")).toBeGreaterThan(0);
    expect(compareVersions("0.1.0", "0.1.1")).toBeLessThan(0);
  });

  it("orders minor and major releases", () => {
    expect(compareVersions("0.2.0", "0.1.9")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "0.9.9")).toBeGreaterThan(0);
  });

  it("treats equal versions as equal, with or without the v prefix", () => {
    expect(compareVersions("v0.2.0", "0.2.0")).toBe(0);
  });

  it("ignores prerelease suffixes", () => {
    expect(compareVersions("0.2.0-beta.1", "0.2.0")).toBe(0);
  });
});
