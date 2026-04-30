import { GradientCard } from "../ui/GradientCard";
import { getDailyQuote } from "../../utils/dailyQuote";
import { Flame } from "lucide-react";

interface GreetingSectionProps {
  userName: string;
  avatarUrl?: string;
  streak?: number;
  /** Today's study minutes (from summary.todayMinutes) */
  todayMinutes?: number;
}

/** Derives a plain-English study goal label from today's minutes so far. */
function getTodayGoalLabel(minutes: number): string {
  if (minutes === 0) return "Start your first session";
  if (minutes < 30)  return `${minutes}min studied · keep going!`;
  if (minutes < 60)  return `${minutes}min in · great start`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hrs}h ${rem}min studied today` : `${hrs}h studied today`;
}

export const GreetingSection = ({
  userName,
  avatarUrl,
  streak = 0,
  todayMinutes = 0,
}: GreetingSectionProps) => {
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const quote = getDailyQuote();

  const initials = (userName ?? "S")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <GradientCard tone="coral" className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        {/* ── Left content ─────────────────────── */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Date + streak badge row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
              {dateLabel}
            </span>

            {/* Streak counter — always visible, dims at 0 */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                streak > 0
                  ? "bg-white/30 text-white"
                  : "bg-white/10 text-white/50"
              }`}
            >
              <Flame
                size={13}
                className={streak > 0 ? "fill-orange-300 text-orange-300" : "text-white/40"}
              />
              {streak > 0 ? `${streak}-day streak` : "No streak yet"}
            </span>
          </div>

          {/* Greeting + name */}
          <div>
            <p className="text-sm font-semibold text-white/70">{greeting} 👋</p>
            <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Hi, {userName}
            </h1>
          </div>

          {/* Daily quote */}
          <blockquote className="border-l-2 border-white/30 pl-3">
            <p className="text-sm font-semibold italic leading-6 text-white/80">
              "{quote.text}"
            </p>
            <footer className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
              — {quote.author}
            </footer>
          </blockquote>

          {/* Dynamic mini-cards */}
          <div className="flex flex-wrap gap-3">
            {/* Today's study progress */}
            <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                Today's study
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-white">
                {getTodayGoalLabel(todayMinutes)}
              </p>
            </div>

            {/* Streak mini-card */}
            <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                Current streak
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-extrabold text-white">
                <Flame
                  size={14}
                  className={streak > 0 ? "fill-orange-300 text-orange-300" : "text-white/40"}
                />
                {streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "Start today!"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Avatar — hidden on xs, shown from sm ── */}
        <div className="hidden shrink-0 sm:block">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="h-16 w-16 rounded-full border-2 border-white/50 object-cover shadow-card sm:h-20 sm:w-20"
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
