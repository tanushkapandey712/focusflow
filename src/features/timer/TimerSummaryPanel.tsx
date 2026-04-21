import type { ReactNode } from "react";
import { Clock3, FolderTree, Target } from "lucide-react";
import { cn } from "../../lib/cn";

interface SummaryTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  supporting: string;
  tone?: "default" | "blue";
}

const SummaryTile = ({ icon, label, value, supporting, tone = "default" }: SummaryTileProps) => (
  <div
    className={cn(
      "rounded-[1.45rem] border p-4 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.2)]",
      tone === "blue"
        ? "border-blue-200/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.96),rgba(255,255,255,0.88))] dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.76))]"
        : "border-white/80 bg-white/74 dark:border-white/10 dark:bg-slate-950/44",
    )}
  >
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-3" title={value}>{value}</p>
    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-3" title={supporting}>{supporting}</p>
  </div>
);

interface TimerSummaryPanelProps {
  statusLabel: string;
  plannedMinutes: number;
  presetLabel: string;
  status: "idle" | "running" | "paused" | "completed";
  selectedTopicTitle?: string;
  selectedUnitTitle?: string;
  hasSubject: boolean;
  selectedTopicStatus?: string | null;
  subjectCompletionPercent?: number | null;
  subjectCoveredTopics?: number;
  subjectTotalTopics?: number;
  nextTopicTitle?: string;
}

export const TimerSummaryPanel = ({
  statusLabel,
  plannedMinutes,
  presetLabel,
  status,
  selectedTopicTitle,
  selectedUnitTitle,
  hasSubject,
  selectedTopicStatus,
  subjectCompletionPercent,
  subjectCoveredTopics,
  subjectTotalTopics,
  nextTopicTitle,
}: TimerSummaryPanelProps) => (
  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
    <SummaryTile
      icon={<Clock3 size={14} className="text-blue-600 dark:text-blue-300" />}
      label="Block Status"
      value={statusLabel}
      supporting={`${plannedMinutes} minute ${presetLabel.toLowerCase()} block with ${status === "idle" ? "setup guidance" : "live progress"}.`}
      tone="blue"
    />
    <SummaryTile
      icon={<FolderTree size={14} className="text-blue-600 dark:text-blue-300" />}
      label="Linked Topic"
      value={selectedTopicTitle ?? "No topic linked yet"}
      supporting={
        selectedTopicTitle
          ? `${selectedUnitTitle ?? "Current unit"} • ${selectedTopicStatus ?? "Ready"}`
          : hasSubject
            ? "Pick or add a topic so this session updates syllabus progress."
            : "Choose a subject first to unlock unit and topic linking."
      }
    />
    <SummaryTile
      icon={<Target size={14} className="text-blue-600 dark:text-blue-300" />}
      label="Subject Progress"
      value={subjectCompletionPercent != null ? `${subjectCompletionPercent}% complete` : "No subject context"}
      supporting={
        subjectTotalTopics != null && subjectCoveredTopics != null
          ? `${subjectCoveredTopics}/${subjectTotalTopics} topics touched${nextTopicTitle ? ` • Next: ${nextTopicTitle}` : ""}`
          : "Once a subject is selected, this panel shows where the next session should go."
      }
    />
  </div>
);
