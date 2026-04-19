import type { AttentionStatus, HeadDirectionState } from "../types/focusTracking";
import { DEFAULT_EYE_SIGNAL_SETTINGS } from "./eyeMetrics";
import { DEFAULT_HEAD_POSE_SETTINGS } from "./headPose";

const DEFAULT_FACE_MISSING_AWAY_THRESHOLD_MS = 2400;

export interface AttentionScoreInputs {
  faceVisible: boolean;
  faceMissingDurationMs: number;
  eyesOpen: boolean;
  eyeClosureDurationMs: number;
  headDirection: HeadDirectionState;
  lookingAway: boolean;
  lookingAwayDurationMs: number;
}

export interface AttentionScoreBreakdown {
  faceScore: number;
  eyeScore: number;
  headScore: number;
}

export interface AttentionScoreResult {
  instantScore: number;
  attentionScore: number;
  attentionStatus: AttentionStatus;
  breakdown: AttentionScoreBreakdown;
}

export const DEFAULT_ATTENTION_SCORE_SETTINGS = {
  // Face presence is the strongest live signal in Phase 1, so it carries the
  // largest share of the total score.
  faceWeight: 45,
  // Eyes help identify reduced alertness, but they should not overpower face
  // presence because the signal can be weaker with glasses or lighting issues.
  eyeWeight: 20,
  // Head direction adds context about engagement without requiring full 3D pose.
  headWeight: 35,
  // Short misses are tolerated, but prolonged absence should strongly reduce the
  // score even before the "Away" label is reached.
  faceMissingGraceMs: 300,
  faceMissingSaturationMs: 4500,
  // This matches the current Phase 1 "face missing becomes away" threshold.
  faceMissingAwayThresholdMs: DEFAULT_FACE_MISSING_AWAY_THRESHOLD_MS,
  // Short closures are treated as blink-like. Longer closures lower the score
  // more noticeably to reflect reduced attention or drowsiness.
  eyeBlinkGraceMs: DEFAULT_EYE_SIGNAL_SETTINGS.blinkMaxMs,
  eyeReducedClosureMs: DEFAULT_EYE_SIGNAL_SETTINGS.reducedAttentionClosureMs,
  eyeDrowsyClosureMs: DEFAULT_EYE_SIGNAL_SETTINGS.drowsyClosureMs,
  eyeClosureSaturationMs: 3500,
  // Head turns are penalized mildly at first, and sustained turns lower the
  // score more aggressively once they resemble actual looking away.
  slightlyAwayHeadRatio: 0.72,
  awayHeadRatio: 0.42,
  lookingAwayStartRatio: 0.3,
  lookingAwayMinRatio: 0.08,
  lookingAwayAwayThresholdMs: DEFAULT_HEAD_POSE_SETTINGS.lookingAwayThresholdMs + 1800,
  lookingAwaySaturationMs: DEFAULT_HEAD_POSE_SETTINGS.lookingAwayThresholdMs + 4200,
  // Exponential smoothing keeps the live score readable instead of reacting to
  // every landmark jitter.
  smoothingAlpha: 0.28,
  focusedThreshold: 80,
  slightlyDistractedThreshold: 55,
  // Hysteresis reduces status flip-flopping when the score hovers near a
  // threshold. Entering a stronger state requires a higher bar than staying in it.
  focusedReleaseThreshold: 74,
  slightlyDistractedReleaseThreshold: 49,
} as const;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const interpolate = (
  durationMs: number,
  startMs: number,
  endMs: number,
  fromValue: number,
  toValue: number,
) => {
  if (durationMs <= startMs) {
    return fromValue;
  }

  if (durationMs >= endMs) {
    return toValue;
  }

  const progress = clamp((durationMs - startMs) / Math.max(1, endMs - startMs));
  return fromValue + (toValue - fromValue) * progress;
};

export const smoothAttentionScore = (
  previousScore: number | null,
  nextScore: number,
  smoothingAlpha = DEFAULT_ATTENTION_SCORE_SETTINGS.smoothingAlpha,
) => {
  if (previousScore === null) {
    return nextScore;
  }

  return previousScore + (nextScore - previousScore) * smoothingAlpha;
};

const getFaceScore = (
  faceVisible: boolean,
  faceMissingDurationMs: number,
  settings = DEFAULT_ATTENTION_SCORE_SETTINGS,
) => {
  if (faceVisible) {
    return settings.faceWeight;
  }

  return interpolate(
    faceMissingDurationMs,
    settings.faceMissingGraceMs,
    settings.faceMissingSaturationMs,
    settings.faceWeight * 0.45,
    0,
  );
};

const getEyeScore = (
  faceVisible: boolean,
  eyesOpen: boolean,
  eyeClosureDurationMs: number,
  settings = DEFAULT_ATTENTION_SCORE_SETTINGS,
) => {
  if (!faceVisible) {
    // When the face is gone we keep the eye signal neutral so the face score
    // remains the main reason the score drops.
    return settings.eyeWeight * 0.5;
  }

  if (eyesOpen) {
    return settings.eyeWeight;
  }

  if (eyeClosureDurationMs <= settings.eyeBlinkGraceMs) {
    return settings.eyeWeight * 0.9;
  }

  if (eyeClosureDurationMs <= settings.eyeReducedClosureMs) {
    return settings.eyeWeight * 0.72;
  }

  if (eyeClosureDurationMs <= settings.eyeDrowsyClosureMs) {
    return interpolate(
      eyeClosureDurationMs,
      settings.eyeReducedClosureMs,
      settings.eyeDrowsyClosureMs,
      settings.eyeWeight * 0.72,
      settings.eyeWeight * 0.35,
    );
  }

  return interpolate(
    eyeClosureDurationMs,
    settings.eyeDrowsyClosureMs,
    settings.eyeClosureSaturationMs,
    settings.eyeWeight * 0.35,
    0,
  );
};

const getHeadScore = (
  headDirection: HeadDirectionState,
  lookingAway: boolean,
  lookingAwayDurationMs: number,
  settings = DEFAULT_ATTENTION_SCORE_SETTINGS,
) => {
  if (headDirection === "unavailable") {
    return settings.headWeight * 0.55;
  }

  if (lookingAway) {
    return interpolate(
      lookingAwayDurationMs,
      DEFAULT_HEAD_POSE_SETTINGS.lookingAwayThresholdMs,
      settings.lookingAwaySaturationMs,
      settings.headWeight * settings.lookingAwayStartRatio,
      settings.headWeight * settings.lookingAwayMinRatio,
    );
  }

  if (headDirection === "away") {
    return settings.headWeight * settings.awayHeadRatio;
  }

  if (headDirection === "slightly-away") {
    return settings.headWeight * settings.slightlyAwayHeadRatio;
  }

  return settings.headWeight;
};

export const computeInstantAttentionScore = (
  inputs: AttentionScoreInputs,
  settings = DEFAULT_ATTENTION_SCORE_SETTINGS,
) => {
  const breakdown: AttentionScoreBreakdown = {
    faceScore: getFaceScore(inputs.faceVisible, inputs.faceMissingDurationMs, settings),
    eyeScore: getEyeScore(
      inputs.faceVisible,
      inputs.eyesOpen,
      inputs.eyeClosureDurationMs,
      settings,
    ),
    headScore: getHeadScore(
      inputs.headDirection,
      inputs.lookingAway,
      inputs.lookingAwayDurationMs,
      settings,
    ),
  };

  return {
    score: Math.round(clamp((breakdown.faceScore + breakdown.eyeScore + breakdown.headScore) / 100) * 100),
    breakdown,
  };
};

export const mapAttentionScoreToStatus = (
  score: number,
  settings = DEFAULT_ATTENTION_SCORE_SETTINGS,
): AttentionStatus => {
  if (score >= settings.focusedThreshold) {
    return "Focused";
  }

  if (score >= settings.slightlyDistractedThreshold) {
    return "Slightly Distracted";
  }

  return "Distracted";
};

export const resolveAttentionStatusWithHysteresis = (
  score: number,
  previousStatus: AttentionStatus | null,
  settings = DEFAULT_ATTENTION_SCORE_SETTINGS,
): AttentionStatus => {
  if (!previousStatus || previousStatus === "Away") {
    return mapAttentionScoreToStatus(score, settings);
  }

  if (previousStatus === "Focused") {
    return score >= settings.focusedReleaseThreshold
      ? "Focused"
      : mapAttentionScoreToStatus(score, settings);
  }

  if (previousStatus === "Slightly Distracted") {
    if (score >= settings.focusedThreshold) {
      return "Focused";
    }

    return score >= settings.slightlyDistractedReleaseThreshold
      ? "Slightly Distracted"
      : "Distracted";
  }

  return score >= settings.slightlyDistractedThreshold ? "Slightly Distracted" : "Distracted";
};

export const deriveAttentionStatus = (
  score: number,
  inputs: AttentionScoreInputs,
  previousStatus: AttentionStatus | null,
  settings = DEFAULT_ATTENTION_SCORE_SETTINGS,
): AttentionStatus => {
  if (!inputs.faceVisible && inputs.faceMissingDurationMs >= settings.faceMissingAwayThresholdMs) {
    return "Away";
  }

  if (inputs.lookingAway && inputs.lookingAwayDurationMs >= settings.lookingAwayAwayThresholdMs) {
    return "Away";
  }

  return resolveAttentionStatusWithHysteresis(score, previousStatus, settings);
};

export const evaluateAttentionScore = (
  inputs: AttentionScoreInputs,
  previousScore: number | null,
  previousStatus: AttentionStatus | null,
  settings = DEFAULT_ATTENTION_SCORE_SETTINGS,
): AttentionScoreResult => {
  const { score: instantScore, breakdown } = computeInstantAttentionScore(inputs, settings);
  const smoothedScore = smoothAttentionScore(previousScore, instantScore, settings.smoothingAlpha);
  const attentionScore = Math.round(clamp(smoothedScore / 100) * 100);

  return {
    instantScore,
    attentionScore,
    attentionStatus: deriveAttentionStatus(attentionScore, inputs, previousStatus, settings),
    breakdown,
  };
};
