import { Card } from "../ui";

interface AnalyticsPreviewCardProps {
  points: number[];
}

export const AnalyticsPreviewCard = ({ points }: AnalyticsPreviewCardProps) => {
  const max = Math.max(...points, 1);
  const total = points.reduce((sum, point) => sum + point, 0);
  const average = Math.round(total / Math.max(1, points.length));
  const best = Math.max(...points, 0);

  return (
    <Card className="animate-fade-up overflow-hidden p-6 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Analytics</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Weekly Preview</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                A quick read on your rhythm before you open the full analytics page.
              </p>
            </div>
            <div className="surface-pill hidden px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 sm:inline-flex">
              7-day trend
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-soft ring-1 ring-white/70 dark:from-surface-900 dark:to-surface-800 dark:ring-white/5">
            <div className="flex h-40 items-end gap-3">
              {points.map((value, idx) => (
                <div key={`${value}-${idx}`} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-slate-950 via-brand-600 to-sky-300 transition-all duration-700"
                    style={{ height: `${Math.max(20, (value / max) * 100)}%` }}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    {["S", "M", "T", "W", "T", "F", "S"][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            {average >= 45
              ? "Consistency is holding up well. Keep the same start time if it still feels natural."
              : "Your week is still forming. One clean session today can lift the whole pattern."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Total", value: `${total}m` },
            { label: "Average", value: `${average}m` },
            { label: "Best Day", value: `${best}m` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] bg-slate-50/88 p-4 shadow-soft ring-1 ring-white/70 dark:bg-surface-900/70 dark:ring-white/5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
