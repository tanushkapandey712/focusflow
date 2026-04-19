import { CalendarDays } from "lucide-react";
import type { Subject } from "../../types/models";
import type { HeatmapCell } from "../../utils/analytics";
import { getResolvedSubject, getSubjectVisuals, withAlpha } from "../../utils/subjects";
import { Card } from "../ui";

interface StudyHeatmapCardProps {
  cells: HeatmapCell[];
  subjects: Subject[];
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const StudyHeatmapCard = ({ cells, subjects }: StudyHeatmapCardProps) => {
  const bestCell = [...cells].sort((a, b) => b.minutes - a.minutes)[0];
  const activeDays = cells.filter((cell) => cell.minutes > 0).length;

  return (
    <div className="animate-fade-up" style={{ animationDelay: "140ms", animationFillMode: "both" }}>
      <Card className="space-y-5 overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <CalendarDays size={14} />
              Study Heatmap
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Last 28 days
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              A quick view of study consistency, colored by the subject that led each day.
            </p>
          </div>

          <div className="rounded-[1.35rem] bg-slate-50/90 p-4 shadow-soft dark:bg-surface-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Active Days</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {activeDays}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Best: {bestCell?.minutes ?? 0}m</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, index) => {
              const subject = getResolvedSubject(subjects, {
                subjectId: cell.subjectId,
                subjectName: cell.subjectName,
              });
              const visuals = subject ? getSubjectVisuals(subject.color) : undefined;
              const baseColor = subject?.color ?? "#cbd5e1";
              const intensity = cell.intensity === 0 ? 0 : 0.14 + cell.intensity * 0.1;
              const cellStyle =
                cell.minutes > 0
                  ? {
                      background: `linear-gradient(135deg, ${withAlpha(baseColor, intensity)}, ${withAlpha(baseColor, Math.min(0.85, intensity + 0.18))})`,
                      borderColor: withAlpha(baseColor, Math.min(0.5, intensity + 0.12)),
                      boxShadow: `0 14px 28px -24px ${withAlpha(baseColor, 0.55)}`,
                    }
                  : undefined;

              return (
                <div
                  key={cell.key}
                  className={`group relative aspect-square rounded-2xl border border-slate-200/80 bg-slate-100/70 transition duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-surface-900/70 ${
                    cell.isToday ? "ring-2 ring-slate-900/10 dark:ring-white/15" : ""
                  }`}
                  style={{
                    ...cellStyle,
                    animationDelay: `${index * 18}ms`,
                    animationFillMode: "both",
                  }}
                  title={
                    cell.minutes > 0
                      ? `${cell.dateLabel}: ${cell.minutes} minutes${subject ? ` - ${subject.name}` : ""}`
                      : `${cell.dateLabel}: No study logged`
                  }
                >
                  <div className="absolute inset-0 animate-fade-up rounded-2xl" />
                  <div className="relative flex h-full flex-col justify-between p-2">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">
                      {cell.dayNumber}
                    </span>
                    {subject ? (
                      <span className="h-2.5 w-2.5 rounded-full self-end shadow-soft" style={visuals?.dotStyle} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-[0.16em]">Low</span>
            <div className="flex items-center gap-1">
              {[0.15, 0.3, 0.45, 0.6].map((alpha) => (
                <span
                  key={alpha}
                  className="h-3 w-3 rounded-md border border-slate-200/80"
                  style={{ backgroundColor: withAlpha("#5a55f5", alpha) }}
                />
              ))}
            </div>
            <span className="font-semibold uppercase tracking-[0.16em]">High</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {bestCell?.minutes
              ? `${bestCell.dateLabel} was your strongest day.`
              : "Start a session to light up the heatmap."}
          </p>
        </div>
      </Card>
    </div>
  );
};
