import type { FocusTrackingFrameState } from "../../types/focusTracking";
import { cn } from "../../lib/cn";
import { Card } from "../ui";
import { Camera, CameraOff, Zap } from "lucide-react";

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
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Focused:              { bg: "bg-teal/10",      text: "text-teal",       dot: "bg-teal" },
  "Slightly Distracted":{ bg: "bg-peach/20",     text: "text-peach-600",  dot: "bg-peach" },
  Distracted:           { bg: "bg-coral/10",     text: "text-coral",      dot: "bg-coral" },
  Away:                 { bg: "bg-coral/15",     text: "text-coral",      dot: "bg-coral" },
  inactive:             { bg: "bg-cream",        text: "text-slate-400",  dot: "bg-slate-300" },
};

export const FocusSnapshotCard = ({
  isCameraActive,
  attentionStatus,
  attentionScore,
  distractionCount,
  awayTimeMs,
  focusStreakMs,
}: FocusSnapshotCardProps) => {
  const statusKey = isCameraActive ? attentionStatus : "inactive";
  const cfg = statusConfig[statusKey] ?? statusConfig.inactive;

  const statItems = [
    { label: "Attention Score", value: isCameraActive ? `${attentionScore}` : "--",  emoji: "🎯", suffix: isCameraActive ? "/100" : "" },
    { label: "Distractions",    value: String(distractionCount),                      emoji: "⚡" },
    { label: "Away Time",       value: formatDurationLabel(awayTimeMs),               emoji: "⏸️" },
    { label: "Focus Streak",    value: formatDurationLabel(focusStreakMs),             emoji: "🔥" },
  ];

  return (
    <Card tone="white" className="overflow-hidden p-5 sm:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Focus Snapshot
            </p>
            <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight text-navy dark:text-slate-100">
              Live attention at a glance
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold", cfg.bg, cfg.text)}>
              <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
              {isCameraActive ? attentionStatus : "Camera Off"}
            </div>
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              isCameraActive ? "bg-teal text-white" : "bg-cream text-slate-400",
            )}>
              {isCameraActive ? <Camera size={15} /> : <CameraOff size={15} />}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-cream p-4 dark:bg-surface-800/60"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <span className="text-base">{item.emoji}</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-navy dark:text-slate-100">
                {item.value}
                {item.suffix && <span className="text-sm font-semibold text-slate-400">{item.suffix}</span>}
              </p>
            </div>
          ))}
        </div>

        <div className={cn("flex items-center gap-2 rounded-2xl p-3 text-xs font-semibold", cfg.bg, cfg.text)}>
          <Zap size={13} />
          {isCameraActive
            ? "Live focus signals mirrored from your camera — no distraction needed."
            : "Start camera tracking on the timer page to see live focus updates here."}
        </div>
      </div>
    </Card>
  );
};
