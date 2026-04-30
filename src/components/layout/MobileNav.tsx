import { BarChart3, BookOpenText, Clock3, LayoutDashboard, Target } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home"    },
  { to: "/timer",     icon: Clock3,          label: "Timer"   },
  { to: "/syllabus",  icon: BookOpenText,    label: "Syllabus"},
  { to: "/goals",     icon: Target,          label: "Goals"   },
  { to: "/analytics", icon: BarChart3,       label: "Stats"   },
];

export const MobileNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-20 p-3 lg:hidden">
    <div className="soft-surface mx-auto grid max-w-sm grid-cols-5 gap-1 p-2">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center rounded-2xl px-1 py-2.5 text-[10px] font-bold text-slate-400 transition duration-200",
              isActive && "bg-coral text-white shadow-soft",
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
    </div>
  </nav>
);
