import { GradientCard } from "../ui/GradientCard";

interface GreetingSectionProps {
  userName: string;
  avatarUrl?: string;
  message?: string;
  streak?: number;
}

export const GreetingSection = ({ userName, avatarUrl, message, streak }: GreetingSectionProps) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const initials = (userName ?? "S")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <GradientCard tone="coral" className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
              {dateLabel}
            </span>
            {streak != null && streak > 0 && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white/90">
                🔥 {streak}-day streak
              </span>
            )}
          </div>

          <div>
            <p className="text-white/75 text-sm font-semibold">{greeting} 👋</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Hi, {userName}
            </h1>
          </div>

          <p className="max-w-xs text-sm leading-6 text-white/75">
            {message ?? "Stay consistent. Start one focused block and let the rest follow."}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Today's goal</p>
              <p className="mt-0.5 text-sm font-bold text-white">Keep the first block simple</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Mindset</p>
              <p className="mt-0.5 text-sm font-bold text-white">Momentum beats perfection</p>
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="h-16 w-16 rounded-full border-3 border-white/50 object-cover shadow-card sm:h-20 sm:w-20"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-xl font-extrabold text-white shadow-card backdrop-blur-sm sm:h-20 sm:w-20 sm:text-2xl">
              {initials}
            </div>
          )}
        </div>
      </div>
    </GradientCard>
  );
};
