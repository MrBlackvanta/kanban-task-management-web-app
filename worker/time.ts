export const DAY_MS = 24 * 60 * 60 * 1000;

export const WORKSPACE_LIFETIME_MS = 90 * DAY_MS;

export function startOfUtcDay(time: number) {
  return time - (time % DAY_MS);
}
