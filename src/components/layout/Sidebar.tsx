import { Award, BarChart3, BookOpenText, CalendarDays, Clock3, LayoutDashboard, ListChecks, Settings2, Sparkles, Target } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";
import { useFocusFlowData } from "../../hooks/useFocusFlowData";

const navItems = [
  { to: "/dashboard", label: "Dashboard",      icon: LayoutDashboard },
  { to: "/timer",     label: "Study Timer",    icon: Clock3 },
  { to: "/syllabus",  label: "Syllabus Map",   icon: BookOpenText },
  { to: "/goals",     label: "Goals",          icon: Target },
  { to: "/planner",   label: "Study Planner",  icon: CalendarDays },
  { to: "/analytics", label: "Analytics",      icon: BarChart3 },
  { to: "/milestones",label: "Milestones",     icon: Award },
  { to: "/history",   label: "Session History",icon: ListChecks },
  { to: "/settings",  label: "Settings",       icon: Settings2 },
];

export const Sidebar = () => {
  const { profile } = useFocusFlowData();
  const initials = (profile.name ?? "S")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden w-[18.5rem] px-4 py-5 lg:block">
      <div className="soft-surface animate-fade-up flex h-full flex-col p-4">
        {/* Logo */}
        <div className="mb-7 flex items-center gap-3 px-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card-coral shadow-soft">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight text-navy dark:text-slate-100">FocusFlow</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Study workspace</p>
          </div>
        </div>

        {/* Section label */}
        <div className="mb-2 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Navigation</p>
        </div>

        {/* Nav items */}
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition duration-200",
                  "hover:bg-cream hover:text-navy dark:hover:bg-surface-800 dark:hover:text-white",
                  isActive &&
                    "bg-coral text-white shadow-soft hover:bg-coral hover:text-white dark:bg-coral dark:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-cream text-slate-500 group-hover:bg-white dark:bg-surface-800 dark:text-slate-400",
                  )}>
                    <Icon size={15} />
                  </div>
                  <span className="tracking-[-0.01em]">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="mt-auto pt-4">
          <NavLink
            to="/settings"
            className="group flex items-center gap-3 rounded-2xl border border-cream-200 bg-cream p-3.5 transition duration-200 hover:border-coral/30 hover:bg-coral/5 dark:border-white/10 dark:bg-surface-800 dark:hover:border-coral/30"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-soft"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card-coral text-sm font-extrabold text-white shadow-soft">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-navy dark:text-slate-100">{profile.name}</p>
              <p className="truncate text-xs text-slate-400">{profile.email ?? "View profile"}</p>
            </div>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
