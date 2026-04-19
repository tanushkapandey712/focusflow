export type CameraLifecycleState =
  | "idle"
  | "requesting-permission"
  | "ready"
  | "running"
  | "stopped"
  | "denied"
  | "unsupported"
  | "error";

export type HeadDirectionState = "centered" | "slightly-away" | "away" | "unavailable";
export type AttentionStatus = "Focused" | "Slightly Distracted" | "Distracted" | "Away";

export interface FocusSessionAnalytics {
  totalSessionDurationMs: number;
  totalFocusedTimeMs: number;
  totalAwayTimeMs: number;
  distractionEvents: number;
  longestFocusStreakMs: number;
  currentFocusStreakMs: number;
}

export interface FocusTrackingFrameState {
  timestampMs: number;
  faceCount: number;
  faceVisible: boolean;
  isAway: boolean;
  faceMissingDurationMs: number;
  eyesOpen: boolean;
  eyeClosureDurationMs: number;
  recentBlinkLikeEvents: number;
  eyeOpennessScore: number | null;
  eyeAttentionState: "steady" | "blink-like" | "reduced" | "drowsy" | "unavailable";
  headDirection: HeadDirectionState;
  lookingAway: boolean;
  lookingAwayDurationMs: number;
  attentionScore: number;
  attentionStatus: AttentionStatus;
}

export interface RollingFocusMetrics {
  sampleCount: number;
  faceVisibleSamples: number;
  faceMissingSamples: number;
  totalAwayEvents: number;
  currentSessionAwayTimeMs: number;
  blinkLikeEvents: number;
  longEyeClosureEvents: number;
  lookingAwayEvents: number;
  currentSessionLookingAwayTimeMs: number;
  totalFocusedTimeMs: number;
  longestFocusStreakMs: number;
  averageAttentionScore: number;
}

export interface FocusTrackingSessionSummary {
  sampleIntervalMs: number;
  faceMissingThresholdMs: number;
  startedAt: string;
  endedAt: string;
  sessionDurationMs: number;
  sampleCount: number;
  faceDetectedRate: number;
  totalAwayEvents: number;
  currentSessionAwayTimeMs: number;
  blinkLikeEvents: number;
  longEyeClosureEvents: number;
  lookingAwayEvents: number;
  currentSessionLookingAwayTimeMs: number;
  totalFocusedTimeMs: number;
  totalAwayTimeMs: number;
  distractionEvents: number;
  longestFocusStreakMs: number;
  averageAttentionScore: number;
  averageAttentionStatus: AttentionStatus;
}
