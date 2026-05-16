import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Clock,
  FolderOpen,
  Target,
  UploadCloud,
} from "lucide-react";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { getNextAppRoute, isProfileSetupComplete } from "../utils/profile";

export const LandingPage = () => {
  const { profile } = useFocusFlowData();
  const nextRoute = getNextAppRoute(profile);
  const profileReady = isProfileSetupComplete(profile);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("focusflow.darkmode.v1");
      const darkMode = stored ? JSON.parse(stored) === true : false;
      document.documentElement.classList.toggle("dark", darkMode);
    } catch {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f8f9fc] text-slate-900 dark:bg-surface-900 dark:text-slate-100 font-sans selection:bg-brand-500/30">
      {/* Background Animated Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -left-[10%] -top-[10%] h-[50vw] w-[50vw] animate-[spin_40s_linear_infinite] rounded-full bg-brand-200/40 blur-[120px] dark:bg-brand-700/20" />
        <div className="absolute -right-[10%] top-[20%] h-[40vw] w-[40vw] animate-[spin_50s_linear_infinite_reverse] rounded-full bg-indigo-200/40 blur-[100px] dark:bg-indigo-700/15" />
        <div className="absolute bottom-[-20%] left-[20%] h-[60vw] w-[60vw] animate-[spin_60s_linear_infinite] rounded-full bg-sky-200/40 blur-[120px] dark:bg-sky-700/10" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-white/40 dark:bg-surface-900/40 border-b border-white/20 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 shadow-soft">
            <img
              src="/focusflow-icon.svg"
              alt="FocusFlow Logo"
              className="h-5 w-5 brightness-0 invert"
            />
          </div>
          <span className="text-xl font-bold tracking-tight">FocusFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={profileReady ? "/dashboard" : nextRoute}
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {profile.isAuthenticated ? "Open App" : "Sign In"}
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center pt-32 pb-24 space-y-32">
        {/* 1. Hero Section */}
        <section className="flex flex-col items-center text-center px-4 max-w-4xl mx-auto animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-50/50 px-4 py-1.5 text-sm font-medium text-brand-700 backdrop-blur-sm dark:border-brand-400/20 dark:bg-brand-900/20 dark:text-brand-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500"></span>
            </span>
            FocusFlow 1.0 is here
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            FocusFlow
          </h1>
          <h2 className="mt-6 text-xl md:text-2xl font-medium text-slate-600 dark:text-slate-300 max-w-2xl">
            The AI-powered study planner and Pomodoro focus timer for serious
            students.
          </h2>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
            <Link
              to={profileReady ? "/timer" : nextRoute}
              className="group flex h-14 items-center gap-2 rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] dark:hover:bg-slate-100"
            >
              Start Studying
              <ArrowRight
                className="transition-transform group-hover:translate-x-1"
                size={18}
              />
            </Link>
            <a
              href="#features"
              className="flex h-14 items-center justify-center rounded-full border border-slate-200 bg-white/50 px-8 text-base font-semibold text-slate-700 backdrop-blur-md transition-all hover:bg-white dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Explore Features
            </a>
          </div>
        </section>

        {/* 4. Mock Preview Hero Extension */}
        <section
          className="w-full max-w-6xl px-4 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="relative rounded-[2.5rem] border border-white/40 bg-white/40 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40 sm:p-6">
            <div className="w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/50 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-950 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-surface-900 dark:to-surface-800" />
              <div className="relative mx-auto w-[92%] sm:w-[85%] my-6 sm:my-10 rounded-2xl bg-[#f8f9fc] dark:bg-surface-900 shadow-2xl border border-slate-200/60 dark:border-slate-800 flex overflow-hidden">
                {/* Sidebar — hidden on mobile */}
                <div className="hidden md:block w-48 bg-white dark:bg-surface-800 border-r border-slate-100 dark:border-slate-700 p-4 space-y-6 shrink-0">
                  <div className="flex items-center gap-2 px-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500">
                      <img
                        src="/focusflow-icon.svg"
                        alt="FocusFlow Logo"
                        className="h-4 w-4 brightness-0 invert"
                      />
                    </div>
                    <span className="font-bold text-sm dark:text-white">
                      FocusFlow
                    </span>
                  </div>
                  <div className="space-y-1">
                    {[
                      "Dashboard",
                      "Study Timer",
                      "Syllabus Map",
                      "Analytics",
                      "Goals",
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold ${i === 0 ? "bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
                  {/* Mobile mini nav bar */}
                  <div className="flex md:hidden items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500">
                      <img
                        src="/focusflow-icon.svg"
                        alt="FocusFlow Logo"
                        className="h-4 w-4 brightness-0 invert"
                      />
                    </div>
                    <span className="font-bold text-xs dark:text-white">
                      FocusFlow
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base sm:text-xl font-bold dark:text-white">
                        Good evening, Alex
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        You're on a 5-day streak. Keep it up!
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-brand-100 flex items-center justify-center text-[10px] sm:text-xs font-bold text-brand-600">
                        AL
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-surface-800 p-2.5 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Today's Focus
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                        145{" "}
                        <span className="text-[10px] sm:text-sm font-medium text-slate-400">
                          min
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-surface-800 p-2.5 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Topics Done
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                        4
                      </p>
                    </div>
                    <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-surface-800 p-2.5 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Streak
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-emerald-500 mt-0.5 sm:mt-1">
                        5{" "}
                        <span className="text-[10px] sm:text-sm font-medium text-emerald-400">
                          days
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Active Syllabus */}
                  <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-surface-800 p-3 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-3 sm:gap-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs sm:text-sm font-bold dark:text-white">
                        Up Next: Mathematics-II
                      </p>
                      <span className="text-[10px] sm:text-xs font-semibold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 sm:py-1 rounded">
                        Unit 2
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold dark:text-slate-200">
                          Laplace Transforms
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500">
                          Recommended: 45m
                        </p>
                      </div>
                      <div className="h-7 sm:h-8 px-3 sm:px-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                        Start
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Features Section */}
        <section id="features" className="w-full max-w-6xl px-4 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Premium Study Tools
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Everything you need to focus, analyze, and succeed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Smart Pomodoro Timer",
                desc: "Adaptive intervals, custom deep work blocks, and strict AI distraction tracking.",
                icon: Clock,
              },
              {
                title: "Syllabus Tracker",
                desc: "Map out subjects, units, and topics to visualize exactly what's left to learn.",
                icon: FolderOpen,
              },
              {
                title: "AI Study Suggestions",
                desc: "Intelligent nudges based on your performance, weak areas, and fatigue levels.",
                icon: Brain,
              },
              {
                title: "Distraction Analytics",
                desc: "Heatmaps, weekly trends, and detailed insights into your study habits.",
                icon: BarChart3,
              },
              {
                title: "Ambient Focus Music",
                desc: "Enter a pristine, distraction-free interface with procedurally generated focus sounds.",
                icon: Target,
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-soft backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-surface-800/60"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. How It Works */}
        <section className="w-full max-w-5xl px-4 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              How It Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              A simple workflow designed for consistency.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-brand-200 via-indigo-200 to-sky-200 dark:from-brand-800 dark:via-indigo-800 dark:to-sky-800 -translate-y-1/2 z-0" />

            {[
              {
                step: "01",
                title: "Upload Syllabus",
                desc: "Import or manually add your subjects and topics to create a structured map.",
                icon: UploadCloud,
              },
              {
                step: "02",
                title: "Start Sessions",
                desc: "Launch a focused timer session tailored to the specific topic you need to cover.",
                icon: Target,
              },
              {
                step: "03",
                title: "Track Progress",
                desc: "Review your consistency, analyze weak points, and watch your completion grow.",
                icon: BarChart3,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative z-10 flex flex-col items-center text-center space-y-6"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#f8f9fc] bg-white shadow-xl dark:border-surface-900 dark:bg-surface-800">
                  <item.icon size={32} className="text-brand-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-brand-500 mb-2">
                    STEP {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Final CTA */}
        <section className="w-full max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 px-6 py-20 text-center text-white shadow-2xl sm:px-12 sm:py-24">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-sky-600/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_40%)]" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Build consistency, not burnout.
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Join students who have replaced chaotic study sessions with a
                calm, organized, and effective workflow.
              </p>
              <Link
                to={nextRoute}
                className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-lg font-semibold text-slate-900 transition-transform hover:scale-105"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 bg-white/50 px-6 py-12 backdrop-blur-md dark:border-white/5 dark:bg-surface-900/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500">
              <img
                src="/focusflow-icon.svg"
                alt="FocusFlow Logo"
                className="h-4 w-4 brightness-0 invert"
              />
            </div>
            <span className="font-semibold">FocusFlow</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Link
              to="/privacy"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Terms of Use
            </Link>
            <a
              href="https://github.com"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} FocusFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
