import type { FocusSessionAnalytics } from "../../types/focusTracking";
import { Card } from "../ui";

interface FocusMiniStatsProps {
  analytics: FocusSessionAnalytics;
  isSessionTracking: boolean;
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

export const FocusMiniStats = ({
  analytics,
  isSessionTracking,
}: FocusMiniStatsProps) => {
  const hasSessionData = analytics.totalSessionDurationMs > 0;
  const formatMetric = (durationMs: number) =>
    !hasSessionData && !isSessionTracking ? "--" : formatDurationLabel(durationMs);
  const items = [
    { label: "Session", value: formatMetric(analytics.totalSessionDurationMs) },
    { label: "Focused", value: formatMetric(analytics.totalFocusedTimeMs) },
    { label: "Away", value: formatMetric(analytics.totalAwayTimeMs) },
    {
      label: "Distractions",
      value: !hasSessionData && !isSessionTracking ? "--" : String(analytics.distractionEvents),
    },
    { label: "Longest Streak", value: formatMetric(analytics.longestFocusStreakMs) },
    { label: "Current Streak", value: formatMetric(analytics.currentFocusStreakMs) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Session Analytics
        </p>
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {isSessionTracking ? "Live" : hasSessionData ? "Latest" : "Idle"}
        </span>
      </div>

      {!hasSessionData && !isSessionTracking ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Start a study session to fill these live totals.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label} className="p-4 transition-colors duration-300">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {item.value}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
