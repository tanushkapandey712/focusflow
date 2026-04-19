import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
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
    <div className="relative min-h-screen overflow-hidden bg-hero-soft dark:bg-surface-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-4rem] top-[-3rem] h-64 w-64 rounded-full bg-white/60 blur-3xl dark:bg-brand-700/15" />
        <div className="absolute right-[-3rem] top-24 h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pastel-peach/55 blur-3xl dark:bg-orange-300/5" />
      </div>

      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar darkMode={darkMode} toggleDarkMode={() => setDarkMode((v) => !v)} />
          <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">{children ?? <Outlet />}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
};
