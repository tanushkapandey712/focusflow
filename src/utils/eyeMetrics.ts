import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144] as const;
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const;

export const DEFAULT_EYE_SIGNAL_SETTINGS = {
  // These values define a practical EAR band for a typical front-facing webcam.
  // The score is normalized between these two points so it can be smoothed and
  // compared more consistently across faces and camera distances.
  earFloor: 0.16,
  earCeiling: 0.3,
  // Hysteresis reduces flicker: reopening needs a slightly higher score than
  // the score required to stay open.
  closedThreshold: 0.32,
  openThreshold: 0.42,
  // Exponential smoothing keeps the signal stable without making it sluggish.
  smoothingAlpha: 0.45,
  // Closures in this band are treated as blink-like instead of drowsy.
  blinkMinMs: 80,
  blinkMaxMs: 450,
  // Beyond this duration, the eye signal should slightly reduce attention.
  reducedAttentionClosureMs: 900,
  // Beyond this duration, the eye signal is better treated as prolonged closure.
  drowsyClosureMs: 1800,
  recentBlinkWindowMs: 30000,
} as const;

export interface EyeOpennessResult {
  rawEyeAspectRatio: number | null;
  opennessScore: number | null;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const distance = (first: NormalizedLandmark, second: NormalizedLandmark) =>
  Math.hypot(first.x - second.x, first.y - second.y);

const getEyeAspectRatio = (
  landmarks: NormalizedLandmark[],
  [outer, upperInner, upperOuter, inner, lowerOuter, lowerInner]: readonly number[],
) => {
  const points = [outer, upperInner, upperOuter, inner, lowerOuter, lowerInner].map(
    (index) => landmarks[index],
  );

  if (points.some((point) => point === undefined)) {
    return null;
  }

  const horizontal = distance(points[0], points[3]);
  const verticalOne = distance(points[1], points[5]);
  const verticalTwo = distance(points[2], points[4]);

  if (horizontal <= 0.0001) {
    return null;
  }

  return (verticalOne + verticalTwo) / (2 * horizontal);
};

export const estimateEyeOpenness = (
  landmarks?: NormalizedLandmark[],
  settings = DEFAULT_EYE_SIGNAL_SETTINGS,
): EyeOpennessResult => {
  if (!landmarks || landmarks.length === 0) {
    return {
      rawEyeAspectRatio: null,
      opennessScore: null,
    };
  }

  const leftEar = getEyeAspectRatio(landmarks, LEFT_EYE_INDICES);
  const rightEar = getEyeAspectRatio(landmarks, RIGHT_EYE_INDICES);

  if (leftEar === null || rightEar === null) {
    return {
      rawEyeAspectRatio: null,
      opennessScore: null,
    };
  }

  const rawEyeAspectRatio = (leftEar + rightEar) / 2;
  const opennessScore = clamp(
    (rawEyeAspectRatio - settings.earFloor) / (settings.earCeiling - settings.earFloor),
  );

  return {
    rawEyeAspectRatio,
    opennessScore,
  };
};

export const smoothEyeOpenness = (
  previousScore: number | null,
  nextScore: number | null,
  smoothingAlpha = DEFAULT_EYE_SIGNAL_SETTINGS.smoothingAlpha,
) => {
  if (nextScore === null) {
    return null;
  }

  if (previousScore === null) {
    return nextScore;
  }

  return previousScore + (nextScore - previousScore) * smoothingAlpha;
};

export const resolveEyesOpen = (
  smoothedScore: number | null,
  previousEyesOpen: boolean,
  settings = DEFAULT_EYE_SIGNAL_SETTINGS,
) => {
  if (smoothedScore === null) {
    return false;
  }

  if (previousEyesOpen) {
    return smoothedScore >= settings.closedThreshold;
  }

  return smoothedScore >= settings.openThreshold;
};

export const pruneBlinkTimestamps = (
  timestamps: number[],
  nowMs: number,
  recentWindowMs = DEFAULT_EYE_SIGNAL_SETTINGS.recentBlinkWindowMs,
) => timestamps.filter((timestamp) => nowMs - timestamp <= recentWindowMs);
