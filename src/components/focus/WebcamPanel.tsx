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

  return (
    <Card className="mx-auto w-full max-w-3xl p-5 sm:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Camera Focus Tracking
            </p>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Settings
            </h3>
          </div>

          <FocusStatusBadge
            cameraState={tracker.cameraState}
            attentionStatus={tracker.attentionStatus}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
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
                    Waiting
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={tracker.stopCamera} className="rounded-full px-5">
                    <CameraOff size={15} />
                    Stop Tracking
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/85 p-4 transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/72">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Desk Mode
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Reading a book or writing notes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => tracker.setDeskMode(!tracker.deskMode)}
                  className={cn(
                    "flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    tracker.deskMode ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600",
                  )}
                  role="switch"
                  aria-checked={tracker.deskMode}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full bg-white transition-transform duration-300",
                      tracker.deskMode ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                Ignore downward head tilt when reading.
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

        <FocusMiniStats
          analytics={tracker.sessionAnalytics}
          isSessionTracking={tracker.isSessionTracking}
        />

        {tracker.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {tracker.error}
          </p>
        ) : null}
      </div>
    </Card>
  );
};
