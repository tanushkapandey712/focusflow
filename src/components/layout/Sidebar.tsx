import { Award, BarChart3, BookOpenText, Clock3, LayoutDashboard, ListChecks, Settings2, Sparkles, Target } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timer", label: "Study Timer", icon: Clock3 },
  { to: "/syllabus", label: "Syllabus Map", icon: BookOpenText },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/milestones", label: "Milestones", icon: Award },
  { to: "/history", label: "Session History", icon: ListChecks },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

export const Sidebar = () => (
  <aside className="hidden w-[19rem] px-4 py-5 lg:block">
    <div className="soft-surface animate-fade-up flex h-full flex-col p-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-brand-700 to-sky-400 text-white shadow-soft">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">FocusFlow</p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Calm workspace</p>
        </div>
      </div>

      <div className="mb-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Workspace
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-[1.4rem] px-3.5 py-3 text-sm font-medium text-slate-600 transition duration-300 hover:bg-white/76 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/90 dark:hover:text-white",
                isActive &&
                  "bg-white/92 text-slate-900 shadow-soft ring-1 ring-white/60 dark:bg-brand-500/15 dark:text-white dark:ring-brand-300/15",
              )
            }
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/72 text-slate-700 shadow-soft transition group-hover:bg-white dark:bg-slate-950/55 dark:text-slate-200">
              <Icon size={16} />
            </div>
            <span className="tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.55rem] border border-white/80 bg-white/68 p-4 shadow-soft dark:border-white/10 dark:bg-slate-900/72">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Study Style
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Keep the flow clean.
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Timer, focus cues, analytics, and history stay in one calm workspace.
        </p>
      </div>
    </div>
  </aside>
);
