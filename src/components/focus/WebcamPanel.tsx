import { Camera, CameraOff } from "lucide-react";
import type { UseCameraFocusTrackingResult } from "../../hooks/useCameraFocusTracking";
import { cn } from "../../lib/cn";
import { FocusStatusBadge } from "./FocusStatusBadge";
import { FocusMiniStats } from "./FocusMiniStats";
import { Button, Card } from "../ui";

interface WebcamPanelProps {
  tracker: UseCameraFocusTrackingResult;
  sessionRunning: boolean;
}

const cameraStateLabel: Record<UseCameraFocusTrackingResult["cameraState"], string> = {
  idle: "Camera is off",
  "requesting-permission": "Requesting camera access",
  ready: "Camera is ready",
  running: "Tracking is live",
  stopped: "Camera stopped",
  denied: "Camera permission denied",
  unsupported: "Camera tracking unsupported",
  error: "Camera unavailable",
};

const getPreviewMessage = (tracker: UseCameraFocusTrackingResult) => {
  if (tracker.cameraState === "requesting-permission") {
    return {
      title: "Waiting for camera access",
      detail: "Approve the browser permission prompt to begin local tracking.",
    };
  }

  if (tracker.cameraState === "denied") {
    return {
      title: "Camera access is blocked",
      detail: "Allow camera permission in your browser settings and then try again.",
    };
  }

  if (tracker.cameraState === "unsupported") {
    return {
      title: "Camera access is unsupported",
      detail: "This browser cannot provide the webcam APIs needed for FocusFlow tracking.",
    };
  }

  if (tracker.cameraState === "error") {
    return {
      title: "Camera is unavailable",
      detail: tracker.error ?? "Check that your webcam is connected and not in use by another app.",
    };
  }

  return {
    title: "Camera preview will appear here.",
    detail: "Start the camera to track simple attention signals during the session.",
  };
};

const getCameraHelperText = (
  tracker: UseCameraFocusTrackingResult,
  sessionRunning: boolean,
) => {
  if (tracker.cameraState === "requesting-permission") {
    return "FocusFlow will start tracking after permission is granted.";
  }

  if (tracker.cameraState === "denied") {
    return "Permission can usually be changed from the address bar camera control.";
  }

  if (tracker.cameraState === "unsupported" || tracker.cameraState === "error") {
    return "You can keep using the timer normally even when camera tracking is unavailable.";
  }

  if (tracker.isCameraActive && !sessionRunning) {
    return "Preview is live. Session analytics start when you begin a study block.";
  }

  if (tracker.isCameraActive && sessionRunning) {
    return "Live tracking is running with lightweight on-device processing.";
  }

  return "Camera tracking is optional and stays out of the way until you turn it on.";
};

const getPresenceMessage = (tracker: UseCameraFocusTrackingResult) => {
  if (tracker.faceVisible) {
    return {
      title: "Face detected in the current frame.",
      detail: "Tracking is stable and the session can continue normally.",
    };
  }

  if (tracker.isCameraActive && tracker.faceMissingDuration === 0) {
    return {
      title: "Brief signal drop while reacquiring your face.",
      detail: "FocusFlow adds a short grace window before counting this as away.",
    };
  }

  return {
    title: "No face detected in the current frame.",
    detail: `FocusFlow waits ${Math.round(tracker.faceMissingThresholdMs / 1000)} seconds before counting this as away.`,
  };
};

const getEyeMessage = (tracker: UseCameraFocusTrackingResult) => {
  if (!tracker.faceVisible) {
    return "Eye signal resumes once a face is visible.";
  }

  if (tracker.eyeAttentionState === "unavailable") {
    return "Eye signal is temporarily unavailable.";
  }

  if (tracker.eyesOpen) {
    return "Eyes appear open.";
  }

  return tracker.eyeAttentionState === "drowsy"
    ? "Eyes appear closed for a while."
    : "Eyes appear closed briefly.";
};

const getHeadMessage = (tracker: UseCameraFocusTrackingResult) => {
  if (!tracker.faceVisible) {
    return "Head direction resumes once a face is visible.";
  }

  if (tracker.lookingAway) {
    return `Head is ${tracker.headDirection} and has been away for ${Math.round(
      tracker.lookingAwayDuration / 1000,
    )}s.`;
  }

  if (tracker.headDirection === "slightly-away") {
    return "Head is slightly away from center.";
  }

  if (tracker.headDirection === "away") {
    return "Head briefly turned away.";
  }

  return "Head appears centered.";
};

export const WebcamPanel = ({
  tracker,
  sessionRunning,
}: WebcamPanelProps) => {
  const previewMessage = getPreviewMessage(tracker);
  const presenceMessage = getPresenceMessage(tracker);
  const PreviewIcon =
    tracker.cameraState === "error" || tracker.cameraState === "denied" ? CameraOff : Camera;

  return (
    <Card className="mx-auto w-full max-w-3xl p-5 sm:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Camera Focus Tracking
            </p>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Phase 1 attention tracking
            </h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              FocusFlow checks face presence, a lightweight eye-openness signal, and basic head direction without changing the timer flow.
            </p>
          </div>

          <FocusStatusBadge
            cameraState={tracker.cameraState}
            attentionStatus={tracker.attentionStatus}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-950 shadow-soft transition-colors duration-300 dark:border-white/10">
            {tracker.isCameraActive ? (
              <video
                ref={tracker.previewRef}
                className="aspect-video w-full object-cover"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center">
                <div className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                    <PreviewIcon size={18} />
                  </div>
                  <p className="text-sm font-medium text-white">{previewMessage.title}</p>
                  <p className="text-xs leading-6 text-white/70">{previewMessage.detail}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-surface-900/65">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Camera Status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cameraStateLabel[tracker.cameraState]}
                  </p>
                </div>
                <span
                  className={cn(
                    "surface-pill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                    sessionRunning
                      ? "text-brand-700 dark:text-brand-100"
                      : "text-slate-500 dark:text-slate-300",
                  )}
                >
                  {sessionRunning ? "Session live" : "Session idle"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!tracker.isCameraActive ? (
                  <Button onClick={() => void tracker.startCamera()} className="rounded-full px-5">
                    <Camera size={15} />
                    Start Camera
                  </Button>
                ) : tracker.cameraState === "requesting-permission" ? (
                  <Button variant="secondary" disabled className="rounded-full px-5">
                    <Camera size={15} />
                    Waiting For Access
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={tracker.stopCamera} className="rounded-full px-5">
                    <CameraOff size={15} />
                    Stop Tracking
                  </Button>
                )}
              </div>

              <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {getCameraHelperText(tracker, sessionRunning)}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-4 transition-colors duration-300 dark:border-white/10 dark:bg-surface-900/65">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Presence Signal
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {presenceMessage.title}
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {presenceMessage.detail}
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {getEyeMessage(tracker)}
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {getHeadMessage(tracker)}
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                Attention score {tracker.attentionScore}/100 with live status {tracker.attentionStatus}.
              </p>
            </div>
          </div>
        </div>

        <FocusMiniStats
          analytics={tracker.sessionAnalytics}
          isSessionTracking={tracker.isSessionTracking}
        />

        {tracker.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {tracker.error}
          </p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The camera feature is optional. It scores face presence, eye openness, and head direction locally while keeping the timer workflow unchanged.
          </p>
        )}
      </div>
    </Card>
  );
};
