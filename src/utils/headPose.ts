import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type HeadDirectionState = "centered" | "slightly-away" | "away" | "unavailable";

export const DEFAULT_HEAD_POSE_SETTINGS = {
  // These thresholds operate on a nose-offset value normalized by eye distance.
  // That keeps the rule more stable across different face sizes in the frame.
  slightlyAwayThreshold: 0.16,
  awayThreshold: 0.3,
  // Vertical movement tends to appear smaller than horizontal yaw, so we give it
  // a modest weight when computing overall direction severity.
  pitchWeight: 1.15,
  // Exponential smoothing dampens jitter from landmark noise and small movements.
  smoothingAlpha: 0.35,
  // Brief turns should not immediately count as active looking away.
  lookingAwayThresholdMs: 1400,
} as const;

export interface HeadPoseEstimate {
  yaw: number | null;
  pitch: number | null;
  severity: number | null;
  direction: HeadDirectionState;
}

interface PointLike {
  x: number;
  y: number;
}

const averagePoint = (...points: Array<NormalizedLandmark | undefined>): PointLike | null => {
  const validPoints = points.filter((point): point is NormalizedLandmark => Boolean(point));

  if (validPoints.length === 0) {
    return null;
  }

  return validPoints.reduce(
    (acc, point) => ({
      x: acc.x + point.x / validPoints.length,
      y: acc.y + point.y / validPoints.length,
    }),
    { x: 0, y: 0 },
  );
};

export const estimateHeadPose = (
  landmarks?: NormalizedLandmark[],
  settings = DEFAULT_HEAD_POSE_SETTINGS,
): HeadPoseEstimate => {
  if (!landmarks || landmarks.length === 0) {
    return {
      yaw: null,
      pitch: null,
      severity: null,
      direction: "unavailable",
    };
  }

  const leftEye = averagePoint(landmarks[33], landmarks[133]);
  const rightEye = averagePoint(landmarks[263], landmarks[362]);
  const mouth = averagePoint(landmarks[13], landmarks[14], landmarks[61], landmarks[291]);
  const noseTip = landmarks[1];

  if (!leftEye || !rightEye || !mouth || !noseTip) {
    return {
      yaw: null,
      pitch: null,
      severity: null,
      direction: "unavailable",
    };
  }

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeMidY = (leftEye.y + rightEye.y) / 2;
  const faceCenterY = (eyeMidY + mouth.y) / 2;
  const eyeDistance = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y);

  if (eyeDistance <= 0.0001) {
    return {
      yaw: null,
      pitch: null,
      severity: null,
      direction: "unavailable",
    };
  }

  const yaw = (noseTip.x - eyeMidX) / eyeDistance;
  const pitch = (noseTip.y - faceCenterY) / eyeDistance;
  const severity = Math.max(Math.abs(yaw), Math.abs(pitch) * settings.pitchWeight);

  return {
    yaw,
    pitch,
    severity,
    direction:
      severity >= settings.awayThreshold
        ? "away"
        : severity >= settings.slightlyAwayThreshold
          ? "slightly-away"
          : "centered",
  };
};

export const smoothPoseValue = (
  previousValue: number | null,
  nextValue: number | null,
  smoothingAlpha = DEFAULT_HEAD_POSE_SETTINGS.smoothingAlpha,
) => {
  if (nextValue === null) {
    return null;
  }

  if (previousValue === null) {
    return nextValue;
  }

  return previousValue + (nextValue - previousValue) * smoothingAlpha;
};

export const classifyHeadDirection = (
  smoothedYaw: number | null,
  smoothedPitch: number | null,
  settings = DEFAULT_HEAD_POSE_SETTINGS,
): HeadDirectionState => {
  if (smoothedYaw === null || smoothedPitch === null) {
    return "unavailable";
  }

  const severity = Math.max(
    Math.abs(smoothedYaw),
    Math.abs(smoothedPitch) * settings.pitchWeight,
  );

  if (severity >= settings.awayThreshold) {
    return "away";
  }

  if (severity >= settings.slightlyAwayThreshold) {
    return "slightly-away";
  }

  return "centered";
};
