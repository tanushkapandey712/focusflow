import { Flame } from "lucide-react";
import { GradientCard } from "../ui";

interface StreakCardProps {
  currentDays: number;
  longestDays: number;
}

export const StreakCard = ({ currentDays, longestDays }: StreakCardProps) => {
  const progress = Math.min(100, Math.round((currentDays / Math.max(1, longestDays || 7)) * 100));
  const ringStyle = {
    background: `conic-gradient(#f97316 ${progress * 3.6}deg, rgba(251,191,36,0.25) 0deg)`,
  };

  return (
    <GradientCard tone="peach" className="animate-fade-up p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Streak</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{currentDays} days</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Best run: {longestDays} days</p>
        </div>
        <div className="relative grid h-16 w-16 place-items-center rounded-full p-1" style={ringStyle}>
          <div className="grid h-full w-full place-items-center rounded-full bg-white shadow-soft dark:bg-surface-900">
            <Flame className="text-orange-500" size={20} />
          </div>
        </div>
      </div>
    </GradientCard>
  );
};
