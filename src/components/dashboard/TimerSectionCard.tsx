import { Link } from "react-router-dom";
import { Clock3, Play } from "lucide-react";
import { GradientCard } from "../ui";
import { formatTimer } from "../../features/timer/format";
import { useStudyTimerSession } from "../../features/timer/useStudyTimerSession";

interface TimerSectionCardProps {
  activeMinutes: number;
}

export const TimerSectionCard = ({ activeMinutes }: TimerSectionCardProps) => {
  const { status, remainingSec, progress } = useStudyTimerSession();
  const timerText = formatTimer(remainingSec);
  const isRunning = status === "running" || status === "paused" || status === "completed";

  return (
    <GradientCard tone="teal" className="h-full p-6 sm:p-7 relative overflow-hidden">
      {/* Progress bar */}
      {isRunning && (
        <div
          className="absolute top-0 left-0 h-1.5 rounded-full bg-white/60 transition-all duration-1000"
          style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
        />
      )}

      <div className="flex h-full flex-col justify-between gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
              {isRunning ? "Active Session" : "Study Timer"}
            </p>
            <p className="mt-2 text-5xl sm:text-6xl font-extrabold leading-none tracking-[-0.05em] text-white tabular-nums">
              {isRunning ? timerText : `${activeMinutes}:00`}
            </p>
          </div>
          <div className="flex shrink-0 h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
            <Clock3 size={18} className="text-white" />
          </div>
        </div>

        {/* Info box */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">
                Recommended mode
              </p>
              <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                Ready
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-white">
              {isRunning
                ? "Your timer is active. Head back to stay focused."
                : "One clean sprint to build momentum."}
            </p>
          </div>

          <Link
            to="/timer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-teal shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-glow-teal"
          >
            {isRunning ? (
              <>
                <Clock3 size={14} />
                Return to Timer
              </>
            ) : (
              <>
                <Play size={14} className="fill-teal" />
                Start Session
              </>
            )}
          </Link>
        </div>
      </div>
    </GradientCard>
  );
};
