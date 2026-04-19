import { Moon, Sun } from "lucide-react";
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
  "/dashboard": { title: "Dashboard", subtitle: "FocusFlow Workspace" },
  "/timer": { title: "Study Timer", subtitle: "FocusFlow Workspace" },
  "/goals": { title: "Goals & Streaks", subtitle: "FocusFlow Workspace" },
  "/analytics": { title: "Analytics", subtitle: "FocusFlow Workspace" },
  "/history": { title: "Session History", subtitle: "FocusFlow Workspace" },
  "/settings": { title: "Profile & Settings", subtitle: "FocusFlow Workspace" },
};

const TopbarContent = ({ darkMode, toggleDarkMode }: TopbarProps) => {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? routeMeta["/dashboard"];

  return (
    <header className="px-4 pt-5 sm:px-6 lg:px-8">
      <div className="soft-surface animate-fade-up flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {meta.subtitle}
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
            {meta.title}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
