import { BarChart3, Clock3, LayoutDashboard, ListChecks, Settings2, Sparkles, Target } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timer", label: "Study Timer", icon: Clock3 },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/history", label: "Session History", icon: ListChecks },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

export const Sidebar = () => (
  <aside className="hidden w-[19rem] px-4 py-5 lg:block">
    <div className="soft-surface animate-fade-up h-full p-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-brand-700 to-sky-400 text-white shadow-soft">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">FocusFlow</p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Calm workspace</p>
        </div>
      </div>
      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-slate-600 transition duration-300 hover:bg-white/72 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-surface-800 dark:hover:text-white",
                isActive && "bg-white/92 text-slate-900 shadow-soft dark:bg-surface-800 dark:text-white",
              )
            }
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/72 text-slate-700 shadow-soft transition group-hover:bg-white dark:bg-surface-900/70 dark:text-slate-200">
              <Icon size={16} />
            </div>
            <span className="tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  </aside>
);
