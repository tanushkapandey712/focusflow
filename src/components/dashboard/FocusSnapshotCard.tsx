import type { FocusTrackingFrameState } from "../../types/focusTracking";
import { cn } from "../../lib/cn";
import { Card } from "../ui";

interface FocusSnapshotCardProps {
  isCameraActive: boolean;
  attentionStatus: FocusTrackingFrameState["attentionStatus"];
  attentionScore: number;
  distractionCount: number;
  awayTimeMs: number;
  focusStreakMs: number;
}

const formatDurationLabel = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
};

const statusToneMap: Record<string, string> = {
  Focused: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  "Slightly Distracted":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  Distracted: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  Away: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  inactive: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
};

export const FocusSnapshotCard = ({
  isCameraActive,
  attentionStatus,
  attentionScore,
  distractionCount,
  awayTimeMs,
  focusStreakMs,
}: FocusSnapshotCardProps) => {
  const currentStatus = isCameraActive ? attentionStatus : "Tracking inactive";
  const statusTone = isCameraActive ? statusToneMap[attentionStatus] : statusToneMap.inactive;
  const items = [
    { label: "Status", value: currentStatus },
    { label: "Attention", value: isCameraActive ? `${attentionScore}/100` : "--" },
    { label: "Distractions", value: String(distractionCount) },
    { label: "Away Time", value: formatDurationLabel(awayTimeMs) },
    { label: "Focus Streak", value: formatDurationLabel(focusStreakMs) },
  ];

  return (
    <Card className="animate-fade-up overflow-hidden p-5 sm:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Focus Snapshot
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Live attention at a glance
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              A light read on your current tracking state without changing the rest of the dashboard.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
              statusTone,
            )}
          >
            {isCameraActive ? "Live Tracking" : "Camera Off"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] bg-slate-50/88 p-4 shadow-soft dark:bg-surface-900/70"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isCameraActive
            ? "This card mirrors the current camera tracking state while you study."
            : "Start camera tracking on the timer page to see live focus updates here."}
        </p>
      </div>
    </Card>
  );
};
