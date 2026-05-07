import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { PersistentTimerWidget } from "../../features/timer/PersistentTimerWidget";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { cn } from "../../lib/cn";

export const AppLayout = ({ children }: PropsWithChildren) => {
  const [darkMode, setDarkMode] = useLocalStorageState("focusflow.darkmode.v1", false);
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorageState("focusflow.sidebar.v1", true);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F0E4] dark:bg-surface-900">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-[-4rem] h-72 w-72 rounded-full bg-coral/8 blur-3xl dark:bg-coral/12" />
        <div className="absolute right-[-4rem] top-16 h-80 w-80 rounded-full bg-teal/8 blur-3xl dark:bg-teal/12" />
        <div className="absolute bottom-24 left-1/3 h-72 w-72 rounded-full bg-lavender-200/40 blur-3xl dark:bg-lavender-500/10" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-peach/20 blur-3xl dark:bg-peach/8" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen((v) => !v)}
          className="hidden lg:flex fixed top-4 left-4 z-50 h-11 w-11 items-center justify-center rounded-2xl bg-cream/80 backdrop-blur-md text-slate-500 shadow-sm transition hover:bg-coral hover:text-white dark:bg-surface-800/80 dark:text-slate-400 border border-cream-200 dark:border-white/10"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <Sidebar isOpen={isSidebarOpen} />
        <div className={cn("flex min-h-screen flex-1 flex-col min-w-0 transition-all duration-300", !isSidebarOpen ? "lg:pl-16" : "")}>
          <Topbar 
            darkMode={darkMode} 
            toggleDarkMode={() => setDarkMode((v) => !v)} 
          />
          <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>

      <PersistentTimerWidget />
      <MobileNav />
    </div>
  );
};
