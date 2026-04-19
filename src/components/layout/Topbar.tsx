import { CalendarDays, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "../ui/Button";

interface TopbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Topbar = ({ darkMode, toggleDarkMode }: TopbarProps) => (
  <TopbarContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
);

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Your study overview" },
  "/timer": { title: "Study Timer", subtitle: "One clean block at a time" },
  "/syllabus": { title: "Syllabus Map", subtitle: "Keep the scope visible" },
  "/goals": { title: "Goals & Streaks", subtitle: "Progress that stays visible" },
  "/analytics": { title: "Analytics", subtitle: "Patterns worth noticing" },
  "/history": { title: "Session History", subtitle: "Review the rhythm" },
  "/settings": { title: "Profile & Settings", subtitle: "Keep the workspace personal" },
};

const TopbarContent = ({ darkMode, toggleDarkMode }: TopbarProps) => {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? routeMeta["/dashboard"];
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="px-4 pt-5 sm:px-6 lg:px-8">
      <div className="soft-surface animate-fade-up flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {meta.subtitle}
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[1.35rem]">
            {meta.title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="surface-pill hidden items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 md:inline-flex">
            <CalendarDays size={14} />
            {dateLabel}
          </div>
          <div className="surface-pill hidden px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 sm:inline-flex">
            Calm mode
          </div>
          <Button variant="secondary" onClick={toggleDarkMode} className="h-11 w-11 rounded-2xl px-0">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </div>
      </div>
    </header>
  );
};
