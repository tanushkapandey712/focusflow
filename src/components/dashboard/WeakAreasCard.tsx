import { AlertTriangle, BookX, Clock3, EyeOff } from "lucide-react";
import type { WeakArea } from "../../utils/weakAreas";
import { Card } from "../ui";

interface WeakAreasCardProps {
  weakAreas: WeakArea[];
  limit?: number;
}

const typeIconMap = {
  unstudied_subject: EyeOff,
  neglected_area:    Clock3,
  incomplete_unit:   BookX,
  low_time_topic:    AlertTriangle,
};

const typeLabelMap = {
  unstudied_subject: "Unstudied",
  neglected_area:    "Neglected",
  incomplete_unit:   "Incomplete",
  low_time_topic:    "Low Time",
};

const severityColor = (severity: number): { bg: string; badge: string; icon: string } => {
  if (severity >= 80) return { bg: "bg-coral/8 border border-coral/20",    badge: "bg-coral/15 text-coral",           icon: "bg-coral text-white" };
  if (severity >= 60) return { bg: "bg-peach/15 border border-peach/30",   badge: "bg-peach/20 text-peach-600",       icon: "bg-peach text-navy" };
  return               { bg: "bg-cream border border-cream-200",            badge: "bg-cream-200 text-slate-500",       icon: "bg-cream-200 text-slate-500" };
};

export const WeakAreasCard = ({ weakAreas, limit = 5 }: WeakAreasCardProps) => {
  const displayAreas = weakAreas.slice(0, limit);

  if (displayAreas.length === 0) {
    return (
      <Card tone="white" className="p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Weak Areas</p>
          <h3 className="text-2xl font-extrabold tracking-tight text-navy dark:text-slate-100">No gaps detected 🎉</h3>
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            Your syllabus coverage looks balanced. Keep it up!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card tone="white" className="overflow-hidden p-5 sm:p-6">
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Weak Areas</p>
          <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight text-navy dark:text-slate-100">
            {displayAreas.length} area{displayAreas.length === 1 ? "" : "s"} need attention
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Focus on high-severity items first to balance your study coverage.
          </p>
        </div>

        <div className="space-y-2.5">
          {displayAreas.map((area, idx) => {
            const Icon = typeIconMap[area.type];
            const { bg, badge, icon } = severityColor(area.severity);
            return (
              <div
                key={`${area.subjectId}-${area.type}-${idx}`}
                className={`flex items-start gap-3 rounded-2xl p-3.5 transition-all ${bg}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${icon}`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${badge}`}>
                      {typeLabelMap[area.type]}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">{area.subjectName}</span>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-navy dark:text-slate-100">{area.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-extrabold text-slate-400">{area.severity}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
