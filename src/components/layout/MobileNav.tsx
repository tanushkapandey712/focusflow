import { BarChart3, Clock3, LayoutDashboard, ListChecks, Settings2, Target } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/timer", icon: Clock3, label: "Timer" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/analytics", icon: BarChart3, label: "Stats" },
  { to: "/history", icon: ListChecks, label: "History" },
  { to: "/settings", icon: Settings2, label: "Profile" },
];

export const MobileNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-20 p-3 lg:hidden">
    <div className="soft-surface mx-auto grid max-w-xl grid-cols-6 gap-1.5 p-2.5">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center rounded-[1.35rem] px-1 py-2 text-[10px] font-medium text-slate-500 transition duration-300 dark:text-slate-400",
              isActive && "bg-white/90 text-slate-900 shadow-soft ring-1 ring-white/60 dark:bg-surface-800 dark:text-white dark:ring-white/5",
            )
          }
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/72 shadow-soft transition-colors dark:bg-surface-900/70">
            <Icon size={15} />
          </div>
          <span className="mt-1">{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
