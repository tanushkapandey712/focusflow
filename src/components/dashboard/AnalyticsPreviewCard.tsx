import { Card } from "../ui";
import { TrendingUp } from "lucide-react";

interface AnalyticsPreviewCardProps {
  points: number[];
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Pastel bar colors cycling through the playful palette
const BAR_COLORS = [
  "bg-coral",
  "bg-lavender-500",
  "bg-teal",
  "bg-peach",
  "bg-coral",
  "bg-lavender-500",
  "bg-teal",
];

export const AnalyticsPreviewCard = ({ points }: AnalyticsPreviewCardProps) => {
  const max = Math.max(...points, 1);
  const total = points.reduce((sum, point) => sum + point, 0);
  const average = Math.round(total / Math.max(1, points.length));
  const best = Math.max(...points, 0);
  const todayIdx = new Date().getDay(); // 0=Sun

  return (
    <Card tone="white" className="overflow-hidden p-6 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        {/* Chart section */}
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Weekly Activity
              </p>
              <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight text-navy dark:text-slate-100">
                Your Study Rhythm
              </h3>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1.5 text-xs font-bold text-teal">
              <TrendingUp size={13} />
              7-day
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-3xl bg-cream p-5 dark:bg-surface-800/60">
            <div className="flex h-36 items-end gap-2 sm:gap-3">
              {points.map((value, idx) => {
                const isToday = idx === todayIdx;
                const heightPct = Math.max(8, (value / max) * 100);
                return (
                  <div key={`${value}-${idx}`} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className={`w-full rounded-full transition-all duration-700 bar-grow ${
                        isToday
                          ? "bg-coral shadow-glow-coral"
                          : BAR_COLORS[idx % BAR_COLORS.length]
                      } opacity-${isToday ? "100" : "70"}`}
                      style={{
                        height: `${heightPct}%`,
                        animationDelay: `${idx * 0.07}s`,
                        opacity: isToday ? 1 : 0.72,
                      }}
                    />
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                      isToday ? "text-coral" : "text-slate-400"
                    }`}>
                      {DAY_LABELS[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            {average >= 45
              ? "Consistency is holding up well. Keep the same start time if it still feels natural."
              : "Your week is still forming. One clean session today can lift the whole pattern."}
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Total", value: `${total}m`, color: "bg-coral/10 text-coral" },
            { label: "Average", value: `${average}m`, color: "bg-teal/10 text-teal" },
            { label: "Best Day", value: `${best}m`, color: "bg-lavender-500/10 text-lavender-600" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl bg-cream p-4 dark:bg-surface-800/60"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-navy dark:text-slate-100">
                  {item.value}
                </p>
              </div>
              <div className={`rounded-2xl px-3 py-1.5 text-xs font-bold ${item.color}`}>
                {item.label === "Total" ? "📚" : item.label === "Average" ? "📈" : "🏆"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
