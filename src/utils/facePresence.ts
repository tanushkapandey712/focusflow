import type { FocusTrackingSessionSummary, RollingFocusMetrics } from "../types/focusTracking";
import { mapAttentionScoreToStatus } from "./focusScore";
import { getDistractionEventCount, getTotalAwayTimeMs } from "./focusSessionAnalytics";

export const DEFAULT_FACE_MISSING_THRESHOLD_MS = 2400;

export const isFaceVisible = (faceCount: number) => faceCount > 0;

export const getLiveAwayTimeMs = (
  baseAwayTimeMs: number,
  awayStartedAtMs: number | null,
  nowMs: number,
) => (awayStartedAtMs === null ? baseAwayTimeMs : baseAwayTimeMs + Math.max(0, nowMs - awayStartedAtMs));

export const buildFacePresenceSummary = (
  metrics: RollingFocusMetrics,
  sampleIntervalMs: number,
  faceMissingThresholdMs: number,
  times: {
    startedAt: Date;
    endedAt: Date;
  },
): FocusTrackingSessionSummary | null => {
  if (metrics.sampleCount === 0) {
    return null;
  }

  const sessionDurationMs = Math.max(0, times.endedAt.getTime() - times.startedAt.getTime());

  return {
    sampleIntervalMs,
    faceMissingThresholdMs,
    startedAt: times.startedAt.toISOString(),
    endedAt: times.endedAt.toISOString(),
    sessionDurationMs,
    sampleCount: metrics.sampleCount,
    faceDetectedRate: Math.round(
      (metrics.faceVisibleSamples / Math.max(1, metrics.sampleCount)) * 100,
    ),
    totalAwayEvents: metrics.totalAwayEvents,
    currentSessionAwayTimeMs: metrics.currentSessionAwayTimeMs,
    blinkLikeEvents: metrics.blinkLikeEvents,
    longEyeClosureEvents: metrics.longEyeClosureEvents,
    lookingAwayEvents: metrics.lookingAwayEvents,
    currentSessionLookingAwayTimeMs: metrics.currentSessionLookingAwayTimeMs,
    totalFocusedTimeMs: metrics.totalFocusedTimeMs,
    totalAwayTimeMs: getTotalAwayTimeMs(metrics),
    distractionEvents: getDistractionEventCount(metrics),
    longestFocusStreakMs: metrics.longestFocusStreakMs,
    averageAttentionScore: Math.round(metrics.averageAttentionScore),
    averageAttentionStatus: mapAttentionScoreToStatus(metrics.averageAttentionScore),
  };
};
