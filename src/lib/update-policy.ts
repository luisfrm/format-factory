/**
 * Update policy: when to check and when to bother the user.
 *
 * Pure functions so the rules can be tested without Tauri or a clock.
 */

/** Never check more than once a day. */
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** "Ahora no" hides the banner for a week. */
export const SNOOZE_DAYS = 7;

/** Give the app time to open before hitting the network. */
export const INITIAL_CHECK_DELAY_MS = 10_000;

export function shouldCheck(
  lastCheckedAt: number | null,
  now: number = Date.now(),
  interval: number = CHECK_INTERVAL_MS,
): boolean {
  if (lastCheckedAt === null) return true;
  return now - lastCheckedAt >= interval;
}

export type NotificationState = {
  skippedVersion: string | null;
  snoozedUntil: number | null;
};

export function shouldNotify(
  version: string | null,
  state: NotificationState,
  now: number = Date.now(),
): boolean {
  if (!version) return false;
  if (state.skippedVersion === version) return false;
  if (state.snoozedUntil !== null && state.snoozedUntil > now) return false;
  return true;
}

export function snoozeUntil(now: number = Date.now(), days: number = SNOOZE_DAYS): number {
  return now + days * 24 * 60 * 60 * 1000;
}

export function daysLeft(until: number | null, now: number = Date.now()): number {
  if (until === null) return 0;
  return Math.max(0, Math.ceil((until - now) / (24 * 60 * 60 * 1000)));
}

/**
 * Compares two semver-ish versions. Prerelease suffixes are ignored on purpose:
 * the updater endpoint only serves stable builds.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (value: string) =>
    value
      .replace(/^v/i, "")
      .split("-")[0]
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);

  const left = parse(a);
  const right = parse(b);

  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}
