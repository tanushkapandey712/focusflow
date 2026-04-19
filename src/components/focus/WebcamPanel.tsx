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

const getCameraPanelMessage = (tracker: UseCameraFocusTrackingResult) => {
  if (tracker.cameraState === "requesting-permission") {
    return {
      title: "Waiting for camera access",
      detail: "Approve the browser permission prompt to begin local tracking. The feed stays hidden in the interface.",
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

  if (tracker.isCameraActive) {
    return {
      title: "Camera view stays hidden",
      detail: "FocusFlow tracks locally in the background and only shows the focus signals here.",
    };
  }

  return {
    title: "Camera view stays hidden",
    detail: "Start tracking when you want focus signals. The interface will never show a live self-view.",
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
    return "Tracking is ready. Session analytics start when you begin a study block.";
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
  const cameraPanelMessage = getCameraPanelMessage(tracker);
  const presenceMessage = getPresenceMessage(tracker);
  const liveSignals = [
    {
      label: "Face",
      value: tracker.faceVisible ? "Detected" : "Not detected",
      detail: presenceMessage.detail,
    },
    {
      label: "Eyes",
      value: tracker.eyesOpen ? "Open" : tracker.faceVisible ? "Closed" : "Waiting",
      detail: getEyeMessage(tracker),
    },
    {
      label: "Head",
      value:
        tracker.headDirection === "centered"
          ? "Centered"
          : tracker.headDirection === "slightly-away"
            ? "Slightly away"
            : "Away",
      detail: getHeadMessage(tracker),
    },
    {
      label: "Attention",
      value: `${tracker.attentionScore}/100`,
      detail: tracker.attentionStatus,
    },
  ];
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
              Focus tracking
            </h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Optional local camera cues that support the timer without changing the rest of the flow.
            </p>
          </div>

          <FocusStatusBadge
            cameraState={tracker.cameraState}
            attentionStatus={tracker.attentionStatus}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/88 p-5 shadow-soft transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/72">
            <div className="flex h-full flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-soft dark:bg-slate-800">
                  <PreviewIcon size={18} />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cameraPanelMessage.title}
                  </p>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {cameraPanelMessage.detail}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {["No live self-view", "Local processing", "Optional at any time", "Focus signals only"].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.2rem] bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-soft ring-1 ring-white/70 dark:bg-slate-950/55 dark:text-slate-300 dark:ring-white/5"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-slate-900/72">
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

            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-4 transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/72">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Live Signals
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {presenceMessage.title}
                  </p>
                </div>
                <span className="surface-pill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                  Phase 1
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {liveSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-[1.2rem] bg-white/78 p-3 shadow-soft ring-1 ring-white/60 dark:bg-slate-950/55 dark:ring-white/5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {signal.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {signal.value}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {signal.detail}
                    </p>
                  </div>
                ))}
              </div>
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
            Camera tracking stays optional and runs locally so the timer workflow remains simple.
          </p>
        )}
      </div>
    </Card>
  );
};
