import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "../services/vision/mediapipeFaceLandmarker";
import type {
  CameraLifecycleState,
  FocusTrackingFrameState,
  FocusSessionAnalytics,
  FocusTrackingSessionSummary,
  RollingFocusMetrics,
} from "../types/focusTracking";
import {
  buildFacePresenceSummary,
  DEFAULT_FACE_MISSING_THRESHOLD_MS,
  getLiveAwayTimeMs,
  isFaceVisible,
} from "../utils/facePresence";
import {
  DEFAULT_EYE_SIGNAL_SETTINGS,
  estimateEyeOpenness,
  pruneBlinkTimestamps,
  resolveEyesOpen,
  smoothEyeOpenness,
} from "../utils/eyeMetrics";
import {
  classifyHeadDirection,
  DEFAULT_HEAD_POSE_SETTINGS,
  estimateHeadPose,
  smoothPoseValue,
} from "../utils/headPose";
import { evaluateAttentionScore } from "../utils/focusScore";
import {
  buildLiveSessionAnalytics,
  createEmptySessionAnalytics,
  getDistractionEventCount,
  getLiveDurationMs,
  getTotalAwayTimeMs,
} from "../utils/focusSessionAnalytics";

interface UseCameraFocusTrackingOptions {
  sampleIntervalMs?: number;
  faceMissingThresholdMs?: number;
}

const IDLE_SAMPLE_INTERVAL_MS = 700;
const FACE_VISIBILITY_GRACE_MS = 450;

export interface UseCameraFocusTrackingResult {
  videoRef: RefObject<HTMLVideoElement>;
  cameraState: CameraLifecycleState;
  error: string | null;
  isCameraActive: boolean;
  isSessionTracking: boolean;
  faceVisible: boolean;
  isAway: boolean;
  faceMissingDuration: number;
  totalAwayEvents: number;
  currentSessionAwayTime: number;
  eyesOpen: boolean;
  eyeClosureDuration: number;
  recentBlinkLikeEvents: number;
  eyeAttentionState: FocusTrackingFrameState["eyeAttentionState"];
  headDirection: FocusTrackingFrameState["headDirection"];
  lookingAway: boolean;
  lookingAwayDuration: number;
  attentionScore: number;
  attentionStatus: FocusTrackingFrameState["attentionStatus"];
  distractionCount: number;
  awayTime: number;
  focusStreak: number;
  sessionAnalytics: FocusSessionAnalytics;
  currentFrame: FocusTrackingFrameState;
  metrics: RollingFocusMetrics;
  faceMissingThresholdMs: number;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  beginSessionTracking: () => void;
  finishSessionTracking: (times?: {
    startedAt?: Date;
    endedAt?: Date;
  }) => FocusTrackingSessionSummary | null;
  resetSessionTracking: () => void;
  deskMode: boolean;
  setDeskMode: (deskMode: boolean) => void;
}

const createEmptyMetrics = (): RollingFocusMetrics => ({
  sampleCount: 0,
  faceVisibleSamples: 0,
  faceMissingSamples: 0,
  totalAwayEvents: 0,
  currentSessionAwayTimeMs: 0,
  blinkLikeEvents: 0,
  longEyeClosureEvents: 0,
  lookingAwayEvents: 0,
  currentSessionLookingAwayTimeMs: 0,
  totalFocusedTimeMs: 0,
  longestFocusStreakMs: 0,
  averageAttentionScore: 0,
});

const waitForVideoReady = (videoElement: HTMLVideoElement) => {
  if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    videoElement.addEventListener("loadedmetadata", () => resolve(), { once: true });
  });
};

const attachStreamToVideo = async (
  videoElement: HTMLVideoElement | null,
  stream: MediaStream,
): Promise<void> => {
  if (!videoElement) {
    return;
  }

  if (videoElement.srcObject !== stream) {
    videoElement.srcObject = stream;
  }
  videoElement.muted = true;
  videoElement.playsInline = true;
  await waitForVideoReady(videoElement);
  await videoElement.play().catch(() => undefined);
};

const stopVideoElement = (videoElement: HTMLVideoElement | null) => {
  if (!videoElement) {
    return;
  }

  videoElement.pause();
  videoElement.srcObject = null;
};

const stopStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const metricsEqual = (left: RollingFocusMetrics, right: RollingFocusMetrics) =>
  left.sampleCount === right.sampleCount &&
  left.faceVisibleSamples === right.faceVisibleSamples &&
  left.faceMissingSamples === right.faceMissingSamples &&
  left.totalAwayEvents === right.totalAwayEvents &&
  left.currentSessionAwayTimeMs === right.currentSessionAwayTimeMs &&
  left.blinkLikeEvents === right.blinkLikeEvents &&
  left.longEyeClosureEvents === right.longEyeClosureEvents &&
  left.lookingAwayEvents === right.lookingAwayEvents &&
  left.currentSessionLookingAwayTimeMs === right.currentSessionLookingAwayTimeMs &&
  left.totalFocusedTimeMs === right.totalFocusedTimeMs &&
  left.longestFocusStreakMs === right.longestFocusStreakMs &&
  left.averageAttentionScore === right.averageAttentionScore;

const sessionAnalyticsEqual = (left: FocusSessionAnalytics, right: FocusSessionAnalytics) =>
  left.totalSessionDurationMs === right.totalSessionDurationMs &&
  left.totalFocusedTimeMs === right.totalFocusedTimeMs &&
  left.totalAwayTimeMs === right.totalAwayTimeMs &&
  left.distractionEvents === right.distractionEvents &&
  left.longestFocusStreakMs === right.longestFocusStreakMs &&
  left.currentFocusStreakMs === right.currentFocusStreakMs;

const normalizeCameraError = (cameraError: unknown) => {
  const errorName = cameraError instanceof Error ? cameraError.name : "UnknownCameraError";

  if (errorName === "NotAllowedError" || errorName === "SecurityError") {
    return {
      state: "denied" as const,
      message: "Camera permission was denied. Allow access in your browser to use focus tracking.",
    };
  }

  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return {
      state: "error" as const,
      message: "No camera was found on this device.",
    };
  }

  return {
    state: "error" as const,
    message:
      cameraError instanceof Error
        ? cameraError.message
        : "Unable to start the webcam for focus tracking.",
  };
};

export const useCameraFocusTracking = ({
  sampleIntervalMs = 250,
  faceMissingThresholdMs = DEFAULT_FACE_MISSING_THRESHOLD_MS,
}: UseCameraFocusTrackingOptions = {}): UseCameraFocusTrackingResult => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionTimeoutRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const isMountedRef = useRef(true);
  const isDocumentVisibleRef = useRef(
    typeof document === "undefined" ? true : !document.hidden,
  );
  const sessionActiveRef = useRef(false);
  const sessionStartedAtRef = useRef<Date | null>(null);
  const sessionEndedAtMsRef = useRef<number | null>(null);
  const faceLandmarkerRef = useRef<Awaited<ReturnType<typeof getFaceLandmarker>> | null>(null);
  const missingStartedAtMsRef = useRef<number | null>(null);
  const lastFaceSeenAtMsRef = useRef<number | null>(null);
  const awayStartedAtMsRef = useRef<number | null>(null);
  const totalAwayEventsRef = useRef(0);
  const currentSessionAwayTimeMsRef = useRef(0);
  const eyeSmoothedScoreRef = useRef<number | null>(null);
  const eyeClosedStartedAtMsRef = useRef<number | null>(null);
  const longEyeClosureCountedRef = useRef(false);
  const blinkTimestampsRef = useRef<number[]>([]);
  const eyesOpenRef = useRef(false);
  const headSmoothedYawRef = useRef<number | null>(null);
  const headSmoothedPitchRef = useRef<number | null>(null);
  const headAwayStartedAtMsRef = useRef<number | null>(null);
  const lookingAwayStartedAtMsRef = useRef<number | null>(null);
  const currentSessionLookingAwayTimeMsRef = useRef(0);
  const lookingAwayCountedRef = useRef(false);
  const attentionScoreRef = useRef<number | null>(null);
  const attentionStatusRef = useRef<FocusTrackingFrameState["attentionStatus"] | null>(null);
  const focusStreakStartedAtMsRef = useRef<number | null>(null);
  const totalFocusedTimeMsRef = useRef(0);
  const longestFocusStreakMsRef = useRef(0);
  const metricsRef = useRef<RollingFocusMetrics>(createEmptyMetrics());

  const [cameraState, setCameraState] = useState<CameraLifecycleState>(() => {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      return "unsupported";
    }

    return "idle";
  });
  const [error, setError] = useState<string | null>(null);
  const [faceVisible, setFaceVisible] = useState(false);
  const [isAway, setIsAway] = useState(false);
  const [faceMissingDuration, setFaceMissingDuration] = useState(0);
  const [eyesOpen, setEyesOpen] = useState(false);
  const [eyeClosureDuration, setEyeClosureDuration] = useState(0);
  const [recentBlinkLikeEvents, setRecentBlinkLikeEvents] = useState(0);
  const [eyeAttentionState, setEyeAttentionState] =
    useState<FocusTrackingFrameState["eyeAttentionState"]>("unavailable");
  const [headDirection, setHeadDirection] =
    useState<FocusTrackingFrameState["headDirection"]>("unavailable");
  const [lookingAway, setLookingAway] = useState(false);
  const [lookingAwayDuration, setLookingAwayDuration] = useState(0);
  const [attentionScore, setAttentionScore] = useState(50);
  const [attentionStatus, setAttentionStatus] =
    useState<FocusTrackingFrameState["attentionStatus"]>("Slightly Distracted");
  const [sessionAnalytics, setSessionAnalytics] = useState<FocusSessionAnalytics>(
    createEmptySessionAnalytics,
  );
  const [metrics, setMetrics] = useState<RollingFocusMetrics>(createEmptyMetrics);
  const [deskMode, setDeskMode] = useState(false);

  const totalAwayEvents = metrics.totalAwayEvents;
  const currentSessionAwayTime = metrics.currentSessionAwayTimeMs;
  const distractionCount = sessionAnalytics.distractionEvents;
  const awayTime = sessionAnalytics.totalAwayTimeMs;
  const focusStreak = sessionAnalytics.currentFocusStreakMs;
  const currentFrame = useMemo(
    () => ({
      timestampMs: Date.now(),
      faceCount: faceVisible ? 1 : 0,
      faceVisible,
      isAway,
      faceMissingDurationMs: faceMissingDuration,
      eyesOpen,
      eyeClosureDurationMs: eyeClosureDuration,
      recentBlinkLikeEvents,
      eyeOpennessScore: eyeSmoothedScoreRef.current,
      eyeAttentionState,
      headDirection,
      lookingAway,
      lookingAwayDurationMs: lookingAwayDuration,
      attentionScore,
      attentionStatus,
    }),
    [
      attentionScore,
      attentionStatus,
      eyeAttentionState,
      eyeClosureDuration,
      eyesOpen,
      faceMissingDuration,
      faceVisible,
      headDirection,
      isAway,
      lookingAway,
      lookingAwayDuration,
      recentBlinkLikeEvents,
    ],
  );

  const syncMetricsState = useCallback((nowMs: number) => {
    const analyticsNowMs = sessionEndedAtMsRef.current ?? nowMs;
    const liveCurrentFocusStreakMs = getLiveDurationMs(
      0,
      focusStreakStartedAtMsRef.current,
      analyticsNowMs,
    );
    const nextMetrics: RollingFocusMetrics = {
      ...metricsRef.current,
      totalAwayEvents: totalAwayEventsRef.current,
      currentSessionAwayTimeMs: getLiveAwayTimeMs(
        currentSessionAwayTimeMsRef.current,
        awayStartedAtMsRef.current,
        analyticsNowMs,
      ),
      currentSessionLookingAwayTimeMs: getLiveAwayTimeMs(
        currentSessionLookingAwayTimeMsRef.current,
        lookingAwayStartedAtMsRef.current,
        analyticsNowMs,
      ),
      totalFocusedTimeMs: getLiveDurationMs(
        totalFocusedTimeMsRef.current,
        focusStreakStartedAtMsRef.current,
        analyticsNowMs,
      ),
      longestFocusStreakMs: Math.max(
        longestFocusStreakMsRef.current,
        liveCurrentFocusStreakMs,
      ),
    };
    const nextAwayTimeMs = getTotalAwayTimeMs(nextMetrics);
    const nextDistractionCount = getDistractionEventCount(nextMetrics);
    const nextSessionAnalytics = buildLiveSessionAnalytics({
      sessionStartedAtMs: sessionStartedAtRef.current?.getTime() ?? null,
      accumulatedFocusedTimeMs: totalFocusedTimeMsRef.current,
      focusStreakStartedAtMs: focusStreakStartedAtMsRef.current,
      totalAwayTimeMs: nextAwayTimeMs,
      distractionEvents: nextDistractionCount,
      longestFocusStreakMs: longestFocusStreakMsRef.current,
      nowMs: analyticsNowMs,
    });

    metricsRef.current = nextMetrics;

    if (!isMountedRef.current) {
      return;
    }

    setMetrics((previousMetrics) =>
      metricsEqual(previousMetrics, nextMetrics) ? previousMetrics : nextMetrics,
    );
    setSessionAnalytics((previousAnalytics) =>
      sessionAnalyticsEqual(previousAnalytics, nextSessionAnalytics)
        ? previousAnalytics
        : nextSessionAnalytics,
    );
  }, []);

  const closeFocusWindow = useCallback((endedAtMs: number) => {
    if (focusStreakStartedAtMsRef.current === null) {
      return;
    }

    const completedFocusStreakMs = Math.max(0, endedAtMs - focusStreakStartedAtMsRef.current);
    totalFocusedTimeMsRef.current += completedFocusStreakMs;
    longestFocusStreakMsRef.current = Math.max(
      longestFocusStreakMsRef.current,
      completedFocusStreakMs,
    );
    focusStreakStartedAtMsRef.current = null;
  }, []);

  const clearDetectionLoop = useCallback(() => {
    if (detectionTimeoutRef.current !== null) {
      window.clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
  }, []);

  const finalizeAwayWindow = useCallback(
    (endedAtMs: number, shouldSync = true) => {
      if (awayStartedAtMsRef.current !== null) {
        currentSessionAwayTimeMsRef.current += Math.max(0, endedAtMs - awayStartedAtMsRef.current);
        awayStartedAtMsRef.current = null;
      }

      if (shouldSync) {
        syncMetricsState(endedAtMs);
      }
    },
    [syncMetricsState],
  );

  const finalizeLookingAwayWindow = useCallback(
    (endedAtMs: number, shouldSync = true) => {
      if (lookingAwayStartedAtMsRef.current !== null) {
        currentSessionLookingAwayTimeMsRef.current += Math.max(
          0,
          endedAtMs - lookingAwayStartedAtMsRef.current,
        );
        lookingAwayStartedAtMsRef.current = null;
      }

      if (shouldSync) {
        syncMetricsState(endedAtMs);
      }
    },
    [syncMetricsState],
  );

  const finalizeFocusWindow = useCallback(
    (endedAtMs: number) => {
      closeFocusWindow(endedAtMs);
      syncMetricsState(endedAtMs);
    },
    [closeFocusWindow, syncMetricsState],
  );

  const stopCamera = useCallback(() => {
    const emptyMetrics = createEmptyMetrics();
    clearDetectionLoop();
    finalizeAwayWindow(Date.now());
    finalizeLookingAwayWindow(Date.now());
    finalizeFocusWindow(Date.now());

    stopStream(streamRef.current);
    streamRef.current = null;
    stopVideoElement(videoRef.current);

    processingRef.current = false;
    missingStartedAtMsRef.current = null;
    lastFaceSeenAtMsRef.current = null;
    eyeSmoothedScoreRef.current = null;
    eyeClosedStartedAtMsRef.current = null;
    longEyeClosureCountedRef.current = false;
    blinkTimestampsRef.current = [];
    eyesOpenRef.current = false;
    headSmoothedYawRef.current = null;
    headSmoothedPitchRef.current = null;
    headAwayStartedAtMsRef.current = null;
    lookingAwayStartedAtMsRef.current = null;
    lookingAwayCountedRef.current = false;
    attentionScoreRef.current = null;
    attentionStatusRef.current = null;
    focusStreakStartedAtMsRef.current = null;
    totalFocusedTimeMsRef.current = 0;
    longestFocusStreakMsRef.current = 0;
    sessionEndedAtMsRef.current = null;
    sessionStartedAtRef.current = null;
    sessionActiveRef.current = false;
    faceLandmarkerRef.current = null;
    metricsRef.current = emptyMetrics;

    if (isMountedRef.current) {
      setError(null);
      setFaceVisible(false);
      setIsAway(false);
      setFaceMissingDuration(0);
      setEyesOpen(false);
      setEyeClosureDuration(0);
      setRecentBlinkLikeEvents(0);
      setEyeAttentionState("unavailable");
      setHeadDirection("unavailable");
      setLookingAway(false);
      setLookingAwayDuration(0);
      setAttentionScore(50);
      setAttentionStatus("Slightly Distracted");
      setSessionAnalytics(createEmptySessionAnalytics());
      setMetrics(emptyMetrics);
      setCameraState((previous) =>
        previous === "unsupported" || previous === "denied" ? previous : "stopped",
      );
    }
  }, [clearDetectionLoop, finalizeAwayWindow, finalizeFocusWindow, finalizeLookingAwayWindow]);

  const sampleFrame = useCallback(async () => {
    if (processingRef.current || !streamRef.current || !videoRef.current) {
      return;
    }

    if (!isDocumentVisibleRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    processingRef.current = true;

    try {
      const faceLandmarker = faceLandmarkerRef.current ?? (await getFaceLandmarker());
      faceLandmarkerRef.current = faceLandmarker;
      const timestampMs = Date.now();
      const result = faceLandmarker.detectForVideo(videoElement, performance.now());
      const faceCount = result.faceLandmarks.length;
      const rawFaceVisible = isFaceVisible(faceCount);
      if (rawFaceVisible) {
        lastFaceSeenAtMsRef.current = timestampMs;
      }
      // Hold face visibility very briefly so one weak frame does not make the UI flash.
      const nextFaceVisible =
        rawFaceVisible ||
        (lastFaceSeenAtMsRef.current !== null &&
          timestampMs - lastFaceSeenAtMsRef.current <= FACE_VISIBILITY_GRACE_MS);
      let nextFaceMissingDuration = 0;
      let nextAwayState = false;

      blinkTimestampsRef.current = pruneBlinkTimestamps(blinkTimestampsRef.current, timestampMs);

      if (nextFaceVisible) {
        if (missingStartedAtMsRef.current !== null) {
          finalizeAwayWindow(timestampMs, false);
        }

        missingStartedAtMsRef.current = null;
      } else {
        if (missingStartedAtMsRef.current === null) {
          const missingStartAfterGrace =
            lastFaceSeenAtMsRef.current === null
              ? timestampMs
              : Math.min(timestampMs, lastFaceSeenAtMsRef.current + FACE_VISIBILITY_GRACE_MS);
          missingStartedAtMsRef.current = missingStartAfterGrace;
        }

        nextFaceMissingDuration = Math.max(0, timestampMs - missingStartedAtMsRef.current);
        nextAwayState = nextFaceMissingDuration >= faceMissingThresholdMs;

        if (nextAwayState && awayStartedAtMsRef.current === null) {
          totalAwayEventsRef.current += 1;
          awayStartedAtMsRef.current = missingStartedAtMsRef.current + faceMissingThresholdMs;
        }
      }

      let nextEyesOpen = false;
      let nextEyeClosureDuration = 0;
      let nextEyeAttentionState: FocusTrackingFrameState["eyeAttentionState"] = "unavailable";
      let blinkLikeEventDelta = 0;
      let longEyeClosureEventDelta = 0;
      let nextHeadDirection: FocusTrackingFrameState["headDirection"] = "unavailable";
      let nextLookingAway = false;
      let nextLookingAwayDuration = 0;
      let lookingAwayEventDelta = 0;

      if (nextFaceVisible) {
        const landmarks = result.faceLandmarks[0] as NormalizedLandmark[] | undefined;
        const eyeMetrics = estimateEyeOpenness(landmarks);
        const smoothedScore = smoothEyeOpenness(
          eyeSmoothedScoreRef.current,
          eyeMetrics.opennessScore,
          DEFAULT_EYE_SIGNAL_SETTINGS.smoothingAlpha,
        );

        eyeSmoothedScoreRef.current = smoothedScore;

        if (smoothedScore === null) {
          eyeClosedStartedAtMsRef.current = null;
          longEyeClosureCountedRef.current = false;
        } else {
          nextEyesOpen = resolveEyesOpen(
            smoothedScore,
            eyesOpenRef.current,
            DEFAULT_EYE_SIGNAL_SETTINGS,
          );

          if (nextEyesOpen) {
            if (eyeClosedStartedAtMsRef.current !== null) {
              const closureDurationMs = timestampMs - eyeClosedStartedAtMsRef.current;

              if (
                closureDurationMs >= DEFAULT_EYE_SIGNAL_SETTINGS.blinkMinMs &&
                closureDurationMs <= DEFAULT_EYE_SIGNAL_SETTINGS.blinkMaxMs
              ) {
                blinkTimestampsRef.current = [...blinkTimestampsRef.current, timestampMs];
                blinkLikeEventDelta = 1;
              }
            }

            eyeClosedStartedAtMsRef.current = null;
            longEyeClosureCountedRef.current = false;
            nextEyeAttentionState = "steady";
          } else {
            if (eyeClosedStartedAtMsRef.current === null) {
              eyeClosedStartedAtMsRef.current = timestampMs;
            }

            nextEyeClosureDuration = timestampMs - eyeClosedStartedAtMsRef.current;

            if (nextEyeClosureDuration >= DEFAULT_EYE_SIGNAL_SETTINGS.drowsyClosureMs) {
              nextEyeAttentionState = "drowsy";

              if (!longEyeClosureCountedRef.current) {
                longEyeClosureCountedRef.current = true;
                longEyeClosureEventDelta = 1;
              }
            } else if (
              nextEyeClosureDuration >= DEFAULT_EYE_SIGNAL_SETTINGS.reducedAttentionClosureMs
            ) {
              nextEyeAttentionState = "reduced";
            } else {
              nextEyeAttentionState = "blink-like";
            }
          }
        }

        const headPoseSettings = { ...DEFAULT_HEAD_POSE_SETTINGS, deskMode };
        const headPose = estimateHeadPose(landmarks, headPoseSettings);
        const smoothedYaw = smoothPoseValue(
          headSmoothedYawRef.current,
          headPose.yaw,
          headPoseSettings.smoothingAlpha,
        );
        const smoothedPitch = smoothPoseValue(
          headSmoothedPitchRef.current,
          headPose.pitch,
          headPoseSettings.smoothingAlpha,
        );

        headSmoothedYawRef.current = smoothedYaw;
        headSmoothedPitchRef.current = smoothedPitch;
        nextHeadDirection = classifyHeadDirection(
          smoothedYaw,
          smoothedPitch,
          headPoseSettings,
        );

        if (nextHeadDirection === "away") {
          if (headAwayStartedAtMsRef.current === null) {
            headAwayStartedAtMsRef.current = timestampMs;
          }

          nextLookingAwayDuration = timestampMs - headAwayStartedAtMsRef.current;
          nextLookingAway =
            nextLookingAwayDuration >= DEFAULT_HEAD_POSE_SETTINGS.lookingAwayThresholdMs;

          if (nextLookingAway && lookingAwayStartedAtMsRef.current === null) {
            lookingAwayStartedAtMsRef.current =
              headAwayStartedAtMsRef.current + DEFAULT_HEAD_POSE_SETTINGS.lookingAwayThresholdMs;
          }

          if (nextLookingAway && !lookingAwayCountedRef.current) {
            lookingAwayCountedRef.current = true;
            lookingAwayEventDelta = 1;
          }
        } else {
          headAwayStartedAtMsRef.current = null;
          lookingAwayCountedRef.current = false;
          finalizeLookingAwayWindow(timestampMs, false);
        }
      } else {
        eyeSmoothedScoreRef.current = null;
        eyeClosedStartedAtMsRef.current = null;
        longEyeClosureCountedRef.current = false;
        headSmoothedYawRef.current = null;
        headSmoothedPitchRef.current = null;
        headAwayStartedAtMsRef.current = null;
        lookingAwayCountedRef.current = false;
        finalizeLookingAwayWindow(timestampMs, false);
      }

      const nextAttention = evaluateAttentionScore(
        {
          faceVisible: nextFaceVisible,
          faceMissingDurationMs: nextFaceMissingDuration,
          eyesOpen: nextEyesOpen,
          eyeClosureDurationMs: nextEyeClosureDuration,
          headDirection: nextHeadDirection,
          lookingAway: nextLookingAway,
          lookingAwayDurationMs: nextLookingAwayDuration,
        },
        attentionScoreRef.current,
        attentionStatusRef.current,
      );

      attentionScoreRef.current = nextAttention.attentionScore;
      attentionStatusRef.current = nextAttention.attentionStatus;
      const isFocusedSample =
        sessionActiveRef.current &&
        nextFaceVisible &&
        !nextAwayState &&
        !nextLookingAway &&
        nextAttention.attentionStatus === "Focused";

      if (isFocusedSample) {
        if (focusStreakStartedAtMsRef.current === null) {
          focusStreakStartedAtMsRef.current = timestampMs;
        }
      } else {
        closeFocusWindow(timestampMs);
      }
      eyesOpenRef.current = nextEyesOpen;
      const liveFocusStreakMs = getLiveDurationMs(
        0,
        focusStreakStartedAtMsRef.current,
        timestampMs,
      );

      const previousMetrics = metricsRef.current;
      if (sessionActiveRef.current) {
        const nextSampleCount = previousMetrics.sampleCount + 1;
        metricsRef.current = {
          ...previousMetrics,
          sampleCount: nextSampleCount,
          faceVisibleSamples: previousMetrics.faceVisibleSamples + (nextFaceVisible ? 1 : 0),
          faceMissingSamples: previousMetrics.faceMissingSamples + (nextFaceVisible ? 0 : 1),
          totalAwayEvents: totalAwayEventsRef.current,
          currentSessionAwayTimeMs: getLiveAwayTimeMs(
            currentSessionAwayTimeMsRef.current,
            awayStartedAtMsRef.current,
            timestampMs,
          ),
          blinkLikeEvents: previousMetrics.blinkLikeEvents + blinkLikeEventDelta,
          longEyeClosureEvents: previousMetrics.longEyeClosureEvents + longEyeClosureEventDelta,
          lookingAwayEvents: previousMetrics.lookingAwayEvents + lookingAwayEventDelta,
          currentSessionLookingAwayTimeMs: getLiveAwayTimeMs(
            currentSessionLookingAwayTimeMsRef.current,
            lookingAwayStartedAtMsRef.current,
            timestampMs,
          ),
          totalFocusedTimeMs: getLiveDurationMs(
            totalFocusedTimeMsRef.current,
            focusStreakStartedAtMsRef.current,
            timestampMs,
          ),
          longestFocusStreakMs: Math.max(longestFocusStreakMsRef.current, liveFocusStreakMs),
          averageAttentionScore:
            (previousMetrics.averageAttentionScore * previousMetrics.sampleCount +
              nextAttention.attentionScore) /
            nextSampleCount,
        };
      }

      if (isMountedRef.current) {
        setFaceVisible(nextFaceVisible);
        setIsAway(nextAwayState);
        setFaceMissingDuration(nextFaceMissingDuration);
        setEyesOpen(nextEyesOpen);
        setEyeClosureDuration(nextEyeClosureDuration);
        setRecentBlinkLikeEvents(blinkTimestampsRef.current.length);
        setEyeAttentionState(nextEyeAttentionState);
        setHeadDirection(nextHeadDirection);
        setLookingAway(nextLookingAway);
        setLookingAwayDuration(nextLookingAwayDuration);
        setAttentionScore(nextAttention.attentionScore);
        setAttentionStatus(nextAttention.attentionStatus);
        setCameraState("running");
      }

      syncMetricsState(timestampMs);
    } catch (sampleError) {
      if (isMountedRef.current) {
        setCameraState("error");
        setError(
          sampleError instanceof Error
            ? sampleError.message
            : "Unable to process webcam frames for focus tracking.",
        );
      }
    } finally {
      processingRef.current = false;
    }
  }, [
    closeFocusWindow,
    faceMissingThresholdMs,
    finalizeAwayWindow,
    finalizeLookingAwayWindow,
    syncMetricsState,
    deskMode,
  ]);

  const getNextSampleDelay = useCallback(() => {
    if (!isDocumentVisibleRef.current) {
      return IDLE_SAMPLE_INTERVAL_MS;
    }

    return sessionActiveRef.current ? sampleIntervalMs : Math.max(sampleIntervalMs * 2, IDLE_SAMPLE_INTERVAL_MS);
  }, [sampleIntervalMs]);

  const scheduleNextSample = useCallback(() => {
    clearDetectionLoop();
    // Schedule after the previous frame settles so slow devices do not stack work.
    detectionTimeoutRef.current = window.setTimeout(() => {
      void sampleFrame().finally(() => {
        if (streamRef.current) {
          scheduleNextSample();
        }
      });
    }, getNextSampleDelay());
  }, [clearDetectionLoop, getNextSampleDelay, sampleFrame]);

  const startCamera = useCallback(async () => {
    if (cameraState === "unsupported") {
      setError("Camera access is not available in this browser.");
      return;
    }

    setError(null);
    setCameraState("requesting-permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      await attachStreamToVideo(videoRef.current, stream);
      faceLandmarkerRef.current = await getFaceLandmarker();

      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack) {
        videoTrack.addEventListener(
          "ended",
          () => {
            if (!isMountedRef.current) {
              return;
            }

            stopCamera();
            setCameraState("error");
            setError("Camera stream ended. Start the camera again to resume tracking.");
          },
          { once: true },
        );
      }

      if (!isMountedRef.current) {
        stopStream(stream);
        return;
      }

      setCameraState("ready");
      scheduleNextSample();
    } catch (cameraError) {
      if (!isMountedRef.current) {
        return;
      }

      const normalizedError = normalizeCameraError(cameraError);
      setCameraState(normalizedError.state);
      setError(normalizedError.message);
    }
  }, [cameraState, scheduleNextSample, stopCamera]);

  const resetSessionTracking = useCallback(() => {
    const emptyMetrics = createEmptyMetrics();
    metricsRef.current = emptyMetrics;
    sessionStartedAtRef.current = null;
    sessionActiveRef.current = false;
    awayStartedAtMsRef.current = null;
    totalAwayEventsRef.current = 0;
    currentSessionAwayTimeMsRef.current = 0;
    headAwayStartedAtMsRef.current = null;
    lookingAwayStartedAtMsRef.current = null;
    currentSessionLookingAwayTimeMsRef.current = 0;
    lookingAwayCountedRef.current = false;
    attentionScoreRef.current = null;
    attentionStatusRef.current = null;
    focusStreakStartedAtMsRef.current = null;
    totalFocusedTimeMsRef.current = 0;
    longestFocusStreakMsRef.current = 0;
    sessionEndedAtMsRef.current = null;
    lastFaceSeenAtMsRef.current = null;

    setMetrics(emptyMetrics);
    setLookingAway(false);
    setLookingAwayDuration(0);
    setAttentionScore(50);
    setAttentionStatus("Slightly Distracted");
    setSessionAnalytics(createEmptySessionAnalytics());
  }, []);

  const beginSessionTracking = useCallback(() => {
    const emptyMetrics = createEmptyMetrics();
    metricsRef.current = emptyMetrics;
    sessionActiveRef.current = true;
    sessionStartedAtRef.current = new Date();
    sessionEndedAtMsRef.current = null;
    totalAwayEventsRef.current = 0;
    currentSessionAwayTimeMsRef.current = 0;
    awayStartedAtMsRef.current = null;
    missingStartedAtMsRef.current = faceVisible ? null : Date.now();
    headAwayStartedAtMsRef.current =
      headDirection === "away" ? Date.now() : null;
    lookingAwayStartedAtMsRef.current = null;
    currentSessionLookingAwayTimeMsRef.current = 0;
    lookingAwayCountedRef.current = false;
    attentionScoreRef.current = attentionScore;
    attentionStatusRef.current = attentionStatus;
    totalFocusedTimeMsRef.current = 0;
    longestFocusStreakMsRef.current = 0;
    lastFaceSeenAtMsRef.current = faceVisible ? Date.now() : null;
    focusStreakStartedAtMsRef.current =
      attentionStatus === "Focused" && faceVisible && !lookingAway ? Date.now() : null;

    setMetrics(emptyMetrics);
    setFaceMissingDuration(0);
    setIsAway(false);
    setLookingAway(false);
    setLookingAwayDuration(0);
    setSessionAnalytics(createEmptySessionAnalytics());
  }, [attentionScore, attentionStatus, faceVisible, headDirection, lookingAway]);

  const finishSessionTracking = useCallback(
    (times?: {
      startedAt?: Date;
      endedAt?: Date;
    }) => {
      const endedAt = times?.endedAt ?? new Date();
      sessionEndedAtMsRef.current = endedAt.getTime();
      sessionActiveRef.current = false;
      finalizeAwayWindow(endedAt.getTime());
      finalizeLookingAwayWindow(endedAt.getTime());
      finalizeFocusWindow(endedAt.getTime());

      return buildFacePresenceSummary(metricsRef.current, sampleIntervalMs, faceMissingThresholdMs, {
        startedAt: times?.startedAt ?? sessionStartedAtRef.current ?? endedAt,
        endedAt,
      });
    },
    [
      faceMissingThresholdMs,
      finalizeAwayWindow,
      finalizeFocusWindow,
      finalizeLookingAwayWindow,
      sampleIntervalMs,
    ],
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = !document.hidden;

      if (!streamRef.current) {
        return;
      }

      if (isDocumentVisibleRef.current) {
        scheduleNextSample();
        return;
      }

      clearDetectionLoop();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [clearDetectionLoop, scheduleNextSample]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  return useMemo(
    () => ({
      videoRef,
      cameraState,
      error,
      isCameraActive:
        cameraState === "ready" || cameraState === "running" || cameraState === "requesting-permission",
      isSessionTracking: sessionActiveRef.current,
      faceVisible,
      isAway,
      faceMissingDuration,
      totalAwayEvents,
      currentSessionAwayTime,
      eyesOpen,
      eyeClosureDuration,
      recentBlinkLikeEvents,
      eyeAttentionState,
      headDirection,
      lookingAway,
      lookingAwayDuration,
      attentionScore,
      attentionStatus,
      distractionCount,
      awayTime,
      focusStreak,
      sessionAnalytics,
      currentFrame,
      metrics,
      faceMissingThresholdMs,
      startCamera,
      stopCamera,
      beginSessionTracking,
      finishSessionTracking,
      resetSessionTracking,
      deskMode,
      setDeskMode,
    }),
    [
      beginSessionTracking,
      cameraState,
      currentFrame,
      currentSessionAwayTime,
      distractionCount,
      error,
      eyeAttentionState,
      eyeClosureDuration,
      eyesOpen,
      attentionScore,
      attentionStatus,
      awayTime,
      faceMissingDuration,
      faceMissingThresholdMs,
      faceVisible,
      finishSessionTracking,
      focusStreak,
      headDirection,
      isAway,
      lookingAway,
      lookingAwayDuration,
      metrics,
      recentBlinkLikeEvents,
      resetSessionTracking,
      sessionAnalytics,
      startCamera,
      stopCamera,
      totalAwayEvents,
      deskMode,
    ],
  );
};
