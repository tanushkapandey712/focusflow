import { Bell, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "../ui/Button";

interface TopbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Topbar = ({ darkMode, toggleDarkMode }: TopbarProps) => (
  <TopbarContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
);

const routeMeta: Record<string, { title: string; emoji: string }> = {
  "/dashboard": { title: "Dashboard",      emoji: "🏠" },
  "/timer":     { title: "Study Timer",    emoji: "⏱️" },
  "/syllabus":  { title: "Syllabus Map",   emoji: "📖" },
  "/goals":     { title: "Goals",          emoji: "🎯" },
  "/analytics": { title: "Analytics",      emoji: "📊" },
  "/history":   { title: "Session History",emoji: "📋" },
  "/settings":  { title: "Settings",       emoji: "⚙️" },
  "/planner":   { title: "Study Planner",  emoji: "📅" },
  "/milestones":{ title: "Milestones",     emoji: "🏆" },
};

const TopbarContent = ({ darkMode, toggleDarkMode }: TopbarProps) => {
  const { pathname } = useLocation();
  const meta = pathname.startsWith("/syllabus/")
    ? { title: "Subject Detail", emoji: "📖" }
    : routeMeta[pathname] ?? routeMeta["/dashboard"];

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="px-4 pt-4 sm:px-6 lg:px-8">
      <div className="soft-surface animate-fade-up flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        {/* Title */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{meta.emoji}</span>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold tracking-tight text-navy dark:text-slate-100 sm:text-xl">
              {meta.title}
            </p>
            <p className="text-[11px] font-semibold text-slate-400">{dateLabel}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cream text-slate-500 transition hover:bg-coral hover:text-white dark:bg-surface-800 dark:text-slate-400"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
          <Button
            variant="secondary"
            onClick={toggleDarkMode}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cream px-0 text-slate-500 hover:bg-coral hover:text-white dark:bg-surface-800 dark:text-slate-400"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </div>
      </div>
    </header>
  );
};
