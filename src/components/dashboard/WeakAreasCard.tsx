import { AlertTriangle, BookX, Clock3, EyeOff } from "lucide-react";
import type { WeakArea } from "../../utils/weakAreas";
import { Card } from "../ui";

interface WeakAreasCardProps {
  weakAreas: WeakArea[];
  /** Max items to display */
  limit?: number;
}

const typeIconMap = {
  unstudied_subject: EyeOff,
  neglected_area: Clock3,
  incomplete_unit: BookX,
  low_time_topic: AlertTriangle,
};

const typeLabelMap = {
  unstudied_subject: "Unstudied",
  neglected_area: "Neglected",
  incomplete_unit: "Incomplete",
  low_time_topic: "Low Time",
};

const severityTone = (severity: number) => {
  if (severity >= 80) return "border-rose-200/80 bg-rose-50/60 dark:border-rose-500/15 dark:bg-rose-500/5";
  if (severity >= 60) return "border-amber-200/80 bg-amber-50/60 dark:border-amber-500/15 dark:bg-amber-500/5";
  return "border-slate-200/80 bg-slate-50/60 dark:border-white/10 dark:bg-slate-900/30";
};

export const WeakAreasCard = ({ weakAreas, limit = 5 }: WeakAreasCardProps) => {
  const displayAreas = weakAreas.slice(0, limit);

  if (displayAreas.length === 0) {
    return (
      <Card className="animate-fade-up p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Weak Areas
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            No gaps detected
          </h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Your syllabus coverage looks balanced. Keep this up and check back after more sessions.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-up overflow-hidden p-5 sm:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Weak Areas
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {displayAreas.length} area{displayAreas.length === 1 ? "" : "s"} need attention
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Focus on high-severity items first to balance your study coverage.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {displayAreas.map((area, idx) => {
            const Icon = typeIconMap[area.type];
            return (
              <div
                key={`${area.subjectId}-${area.type}-${idx}`}
                className={`flex items-start gap-3 rounded-[1.25rem] border p-3 transition-all ${severityTone(area.severity)}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-soft dark:bg-slate-800">
                  <Icon size={15} className="text-slate-600 dark:text-slate-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {typeLabelMap[area.type]}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {area.subjectName}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {area.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
