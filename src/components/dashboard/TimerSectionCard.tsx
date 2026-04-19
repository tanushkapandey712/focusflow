import { Link } from "react-router-dom";
import { Clock3, Play } from "lucide-react";
import { GradientCard } from "../ui";

interface TimerSectionCardProps {
  activeMinutes: number;
}

export const TimerSectionCard = ({ activeMinutes }: TimerSectionCardProps) => (
  <GradientCard tone="peach" className="animate-fade-up h-full p-6 sm:p-7">
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Timer</p>
          <p className="mt-3 text-5xl font-semibold leading-none tracking-tight text-slate-900">{activeMinutes}:00</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
            Your next study block is ready. Open the timer and start with one clear goal.
          </p>
        </div>
        <div className="surface-pill flex h-11 w-11 items-center justify-center text-slate-700 dark:text-slate-200">
          <Clock3 size={18} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[1.5rem] bg-white/68 p-4 shadow-soft ring-1 ring-white/65 dark:bg-surface-900/45 dark:ring-white/5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Recommended mode</p>
            <span className="surface-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              Ready now
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            One clean sprint to build momentum.
          </p>
        </div>

        <Link
          to="/timer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <Play size={14} />
          Start Session
        </Link>
      </div>
    </div>
  </GradientCard>
);
