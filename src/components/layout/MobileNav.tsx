import { useState, useRef, useEffect } from "react";
import { BarChart3, BookOpenText, Clock3, LayoutDashboard, Target, MoreHorizontal, CalendarDays, Award, ListChecks, Settings2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";

const mainItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home"    },
  { to: "/timer",     icon: Clock3,          label: "Timer"   },
  { to: "/syllabus",  icon: BookOpenText,    label: "Syllabus"},
  { to: "/goals",     icon: Target,          label: "Goals"   },
];

const moreItems = [
  { to: "/planner",   label: "Study Planner",  icon: CalendarDays },
  { to: "/analytics", label: "Analytics",      icon: BarChart3 },
  { to: "/milestones",label: "Milestones",     icon: Award },
  { to: "/history",   label: "Session History",icon: ListChecks },
  { to: "/settings",  label: "Settings",       icon: Settings2 },
];

export const MobileNav = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isMoreActive = moreItems.some(item => location.pathname.startsWith(item.to));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMoreOpen]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 p-3 lg:hidden" ref={menuRef}>
      {/* More Menu Dropdown */}
      {isMoreOpen && (
        <div className="absolute bottom-full right-3 mb-2 w-52 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 dark:bg-surface-800 dark:border-white/10 animate-fade-up">
          <div className="flex flex-col gap-1">
            {moreItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition duration-200",
                    isActive
                      ? "bg-coral/10 text-coral dark:bg-coral/20 dark:text-coral-300"
                      : "text-slate-500 hover:bg-cream dark:text-slate-400 dark:hover:bg-surface-700"
                  )
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div className="soft-surface mx-auto grid max-w-sm grid-cols-5 gap-1 p-2">
        {mainItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setIsMoreOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center rounded-2xl px-1 py-2.5 text-[10px] font-bold transition duration-200",
                isActive ? "bg-coral text-white shadow-soft" : "text-slate-400"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-xl transition",
                  isActive ? "bg-white/20 text-white" : "text-slate-400",
                )}>
                  <Icon size={16} />
                </div>
                <span className="mt-1 leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        
        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={cn(
            "flex flex-col items-center rounded-2xl px-1 py-2.5 text-[10px] font-bold transition duration-200",
            (isMoreActive || isMoreOpen) ? "bg-coral text-white shadow-soft" : "text-slate-400"
          )}
        >
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-xl transition",
            (isMoreActive || isMoreOpen) ? "bg-white/20 text-white" : "text-slate-400",
          )}>
            <MoreHorizontal size={16} />
          </div>
          <span className="mt-1 leading-none">More</span>
        </button>
      </div>
    </nav>
  );
};
