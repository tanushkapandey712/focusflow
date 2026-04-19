import type { FocusSessionAnalytics, RollingFocusMetrics } from "../types/focusTracking";

export const createEmptySessionAnalytics = (): FocusSessionAnalytics => ({
  totalSessionDurationMs: 0,
  totalFocusedTimeMs: 0,
  totalAwayTimeMs: 0,
  distractionEvents: 0,
  longestFocusStreakMs: 0,
  currentFocusStreakMs: 0,
});

export const getLiveDurationMs = (
  baseDurationMs: number,
  startedAtMs: number | null,
  nowMs: number,
) => (startedAtMs === null ? baseDurationMs : baseDurationMs + Math.max(0, nowMs - startedAtMs));

export const getTotalAwayTimeMs = (
  metrics: Pick<RollingFocusMetrics, "currentSessionAwayTimeMs" | "currentSessionLookingAwayTimeMs">,
) => metrics.currentSessionAwayTimeMs + metrics.currentSessionLookingAwayTimeMs;

export const getDistractionEventCount = (
  metrics: Pick<RollingFocusMetrics, "totalAwayEvents" | "lookingAwayEvents" | "longEyeClosureEvents">,
) => metrics.totalAwayEvents + metrics.lookingAwayEvents + metrics.longEyeClosureEvents;

export const buildLiveSessionAnalytics = ({
  sessionStartedAtMs,
  accumulatedFocusedTimeMs,
  focusStreakStartedAtMs,
  totalAwayTimeMs,
  distractionEvents,
  longestFocusStreakMs,
  nowMs,
}: {
  sessionStartedAtMs: number | null;
  accumulatedFocusedTimeMs: number;
  focusStreakStartedAtMs: number | null;
  totalAwayTimeMs: number;
  distractionEvents: number;
  longestFocusStreakMs: number;
  nowMs: number;
}): FocusSessionAnalytics => {
  const currentFocusStreakMs =
    focusStreakStartedAtMs === null ? 0 : Math.max(0, nowMs - focusStreakStartedAtMs);

  return {
    totalSessionDurationMs:
      sessionStartedAtMs === null ? 0 : Math.max(0, nowMs - sessionStartedAtMs),
    totalFocusedTimeMs: getLiveDurationMs(
      accumulatedFocusedTimeMs,
      focusStreakStartedAtMs,
      nowMs,
    ),
    totalAwayTimeMs,
    distractionEvents,
    longestFocusStreakMs: Math.max(longestFocusStreakMs, currentFocusStreakMs),
    currentFocusStreakMs,
  };
};
