import type { CameraLifecycleState, FocusTrackingFrameState } from "../../types/focusTracking";
import { cn } from "../../lib/cn";

interface FocusStatusBadgeProps {
  cameraState: CameraLifecycleState;
  attentionStatus: FocusTrackingFrameState["attentionStatus"];
}

const statusMap = {
  focused: {
    label: "Focused",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  },
  slight: {
    label: "Slightly Distracted",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  },
  distracted: {
    label: "Distracted",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  },
  requesting: {
    label: "Enabling",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
  },
  away: {
    label: "Away",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  },
  issue: {
    label: "Camera Issue",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  },
  denied: {
    label: "Permission Needed",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  },
  unsupported: {
    label: "Unsupported",
    className: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  },
  inactive: {
    label: "Camera Off",
    className: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  },
} as const;

export const FocusStatusBadge = ({ cameraState, attentionStatus }: FocusStatusBadgeProps) => {
  const presentation =
    cameraState === "requesting-permission"
      ? statusMap.requesting
      : cameraState === "error"
        ? statusMap.issue
        : cameraState === "denied"
          ? statusMap.denied
          : cameraState === "unsupported"
            ? statusMap.unsupported
            : cameraState !== "ready" && cameraState !== "running"
              ? statusMap.inactive
              : attentionStatus === "Away"
                ? statusMap.away
                : attentionStatus === "Distracted"
                  ? statusMap.distracted
                  : attentionStatus === "Slightly Distracted"
                    ? statusMap.slight
                    : statusMap.focused;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-300",
        presentation.className,
      )}
    >
      {presentation.label}
    </span>
  );
};
