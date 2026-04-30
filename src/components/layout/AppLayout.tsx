import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { PersistentTimerWidget } from "../../features/timer/PersistentTimerWidget";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";

export const AppLayout = ({ children }: PropsWithChildren) => {
  const [darkMode, setDarkMode] = useLocalStorageState("focusflow.darkmode.v1", false);

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
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col min-w-0">
          <Topbar darkMode={darkMode} toggleDarkMode={() => setDarkMode((v) => !v)} />
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
