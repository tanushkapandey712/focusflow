import { GradientCard } from "../ui/GradientCard";

interface GreetingSectionProps {
  userName: string;
  message?: string;
  streak?: number;
}

export const GreetingSection = ({ userName, message, streak }: GreetingSectionProps) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <GradientCard tone="lavender" className="animate-fade-up p-6 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="surface-pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
              Welcome back
            </div>
            {streak != null && streak > 0 && (
              <div className="surface-pill inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                🔥 {streak}-day streak
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-hero">
              {greeting}, {userName}
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {message ?? "Stay consistent. Start one focused block and let the rest follow."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[18rem] lg:max-w-[22rem]">
          <div className="rounded-[1.4rem] bg-white/72 p-4 shadow-soft dark:bg-surface-900/55">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Today
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Keep the first block simple.
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-white/72 p-4 shadow-soft dark:bg-surface-900/55">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Mindset
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Momentum beats perfection.
            </p>
          </div>
        </div>
      </div>
    </GradientCard>
  );
};
