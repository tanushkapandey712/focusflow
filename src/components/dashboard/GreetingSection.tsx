import { GradientCard } from "../ui/GradientCard";

interface GreetingSectionProps {
  userName: string;
  message?: string;
}

export const GreetingSection = ({ userName, message }: GreetingSectionProps) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <GradientCard tone="lavender" className="animate-fade-up p-6 sm:p-7">
      <div className="space-y-4">
        <div className="surface-pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
          Welcome back
        </div>
        <div className="space-y-3">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-hero">
            {greeting}, {userName}
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {message ?? "Stay consistent. Start one focused block and build momentum."}
          </p>
        </div>
      </div>
    </GradientCard>
  );
};
