import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Brain, CheckCircle2, Clock3, Sparkles, Target, Zap } from "lucide-react";
import { Card, GradientCard } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { cn } from "../lib/cn";
import { getNextAppRoute, isProfileSetupComplete } from "../utils/profile";

type FeatureTone = "lavender" | "mint" | "peach";

const featureItems: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  tone: FeatureTone;
}> = [
  {
    title: "Calm timer",
    description: "One clean workspace for deep blocks.",
    icon: Clock3,
    tone: "lavender",
  },
  {
    title: "Smart nudges",
    description: "Short suggestions that keep momentum up.",
    icon: Brain,
    tone: "mint",
  },
  {
    title: "Visible progress",
    description: "Goals, streaks, and trends in one glance.",
    icon: Target,
    tone: "peach",
  },
];

const heroPills = ["Secure email access", "Soft focus UI", "Actionable analytics"];
const overviewItems = [
  {
    title: "Verified access",
    description: "Secure email verification keeps entry simple and reliable.",
  },
  {
    title: "Personal study profile",
    description: "Subjects, class or course, and timings tailor the workspace to your routine.",
  },
  {
    title: "Connected workspace",
    description: "Dashboard, timer, analytics, history, and settings stay aligned.",
  },
] as const;
const chartBars = [42, 66, 58, 88, 74, 96, 82];
const chartLine = [28, 36, 32, 52, 48, 62, 58];

const primaryLinkClass =
  "inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100";

const secondaryLinkClass =
  "inline-flex items-center justify-center rounded-full border border-white/60 bg-white/18 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/24";

export const LandingPage = () => {
  const { profile } = useFocusFlowData();
  const nextRoute = getNextAppRoute(profile);
  const profileReady = isProfileSetupComplete(profile);
  const primaryLabel = !profile.isAuthenticated
    ? "Get Started"
    : profileReady
      ? "Open Dashboard"
      : "Complete Profile";
  const secondaryLabel = !profile.isAuthenticated
    ? "Explore the Flow"
    : profileReady
      ? "Open Timer"
      : "Continue Setup";

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f8ff] text-slate-900 dark:bg-surface-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-[-5rem] h-72 w-72 rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-700/20" />
        <div className="absolute right-[-4rem] top-24 h-64 w-64 rounded-full bg-cyan-200/70 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute bottom-10 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-pastel-peach/70 blur-3xl dark:bg-orange-300/10" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-white/80 bg-white/75 px-5 py-3 shadow-soft backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/70">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-sky-400 text-white shadow-soft">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">FocusFlow</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Calm study system</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 sm:flex">
            <a href="#features" className="transition hover:text-slate-950 dark:hover:text-white">
              Features
            </a>
            <a href="#analytics" className="transition hover:text-slate-950 dark:hover:text-white">
              Analytics
            </a>
            {profileReady ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-white shadow-soft transition hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                Open App
              </Link>
            ) : (
              <Link
                to={nextRoute}
                className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-white shadow-soft transition hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                {profile.isAuthenticated ? "Complete Profile" : "Sign In"}
              </Link>
            )}
          </div>
        </header>

        <main className="space-y-16 pb-16 pt-6 sm:space-y-20">
          <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-700 to-sky-400 px-6 py-8 text-white shadow-soft sm:px-8 sm:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.18),_transparent_38%)]" />
              <div className="relative max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white/80">
                  <Zap size={14} />
                  Study without noise
                </div>

                <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Flow state,
                  <span className="block text-white/72">designed on purpose.</span>
                </h1>

                <p className="mt-4 max-w-lg text-base leading-7 text-white/74 sm:text-lg">
                  Timer, goals, analytics, and smart nudges in one polished focus dashboard.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to={profileReady ? "/dashboard" : nextRoute} className={primaryLinkClass}>
                    {primaryLabel}
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                  {profileReady ? (
                    <Link to="/timer" className={secondaryLinkClass}>
                      {secondaryLabel}
                    </Link>
                  ) : (
                    <Link to={nextRoute} className={secondaryLinkClass}>
                      {secondaryLabel}
                    </Link>
                  )}
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  {heroPills.map((pill) => (
                    <div
                      key={pill}
                      className="rounded-full border border-white/16 bg-white/12 px-3 py-2 text-sm text-white/82 backdrop-blur"
                    >
                      {pill}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:items-start xl:gap-5">
              <GradientCard tone="lavender" className="overflow-hidden p-6 lg:col-span-2">
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspace</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        Built around your routine, not extra friction.
                      </h2>
                    </div>
                    <div className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-brand-700">
                      {profileReady ? "Ready to study" : "Ready when you are"}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {overviewItems.map(({ title, description }) => (
                      <div key={title} className="rounded-[1.75rem] bg-white/72 p-4 shadow-soft">
                        <p className="mt-2 text-lg font-semibold text-slate-900">{title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link to={nextRoute} className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                      {!profile.isAuthenticated ? "Open FocusFlow" : profileReady ? "Open Dashboard" : "Continue"}
                      <ArrowRight size={16} className="ml-2" />
                    </Link>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Secure access, a personalized profile, and focused tools in one place.
                    </p>
                  </div>
                </div>
              </GradientCard>

              <Card className="w-full space-y-4 p-5 dark:bg-slate-800/90">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Focus Timer</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                      24:18
                    </p>
                  </div>
                  <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-700/20 dark:text-brand-100">
                    Deep Work
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-brand-600 to-cyan-400" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current Goal</p>
                    <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">Finish calculus set</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Distractions</p>
                    <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">Muted and controlled</p>
                  </div>
                </div>
              </Card>

              <GradientCard tone="mint" className="w-full p-5 lg:mt-10">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Smart Suggestions</p>
                <div className="mt-4 space-y-3">
                  {[
                    ["Focus", "Protect the next 25 minutes."],
                    ["Break", "Take 5 before the next push."],
                    ["Subject", "Math is clicking. Stay there."],
                  ].map(([label, text]) => (
                    <div key={label} className="flex items-start gap-3 rounded-3xl bg-white/72 p-3 shadow-soft">
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {label}
                      </span>
                      <p className="text-sm font-medium text-slate-800">{text}</p>
                    </div>
                  ))}
                </div>
              </GradientCard>
            </div>
          </section>

          <section id="features" className="space-y-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-100">
                Features
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Soft UI. Sharp intent.
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300">
                Built to feel calm, quick, and ready for real study sessions.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featureItems.map(({ title, description, icon: Icon, tone }) => (
                <GradientCard key={title} tone={tone} className="h-full p-6">
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/78 text-slate-900 shadow-soft">
                      <Icon size={22} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
                      <p className="text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                  </div>
                </GradientCard>
              ))}
            </div>
          </section>

          <section id="analytics" className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-100">
                Analytics Preview
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                See the pattern. Adjust fast.
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                FocusFlow keeps trends readable so the next study decision feels obvious.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Weekly focus trend at a glance",
                  "Clean session summaries without clutter",
                  "Small insights that guide the next block",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <CheckCircle2 size={18} className="text-brand-600 dark:text-brand-100" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <GradientCard tone="peach" className="overflow-hidden p-6">
              <div className="grid gap-4 lg:grid-cols-[0.74fr_0.26fr]">
                <div className="rounded-[1.75rem] bg-white/72 p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Weekly Focus</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">Steady lift, low friction.</p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      +18%
                    </div>
                  </div>

                  <div className="mt-6 flex h-48 items-end gap-3 rounded-[1.5rem] bg-gradient-to-b from-white to-slate-50 p-4">
                    {chartBars.map((value, index) => (
                      <div key={`${value}-${index}`} className="relative flex flex-1 items-end justify-center">
                        <div
                          className="w-full rounded-full bg-gradient-to-t from-slate-950 via-brand-600 to-sky-300"
                          style={{ height: `${Math.max(28, value * 1.45)}px` }}
                        />
                        <div
                          className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white shadow-soft"
                          style={{ bottom: `${Math.max(18, chartLine[index] * 1.75)}px` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    { label: "Best subject", value: "Math" },
                    { label: "Best window", value: "8 AM" },
                    { label: "Avg. block", value: "42 min" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.75rem] bg-white/72 p-4 shadow-soft">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GradientCard>
          </section>

          <section>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-brand-600 via-indigo-500 to-sky-400 px-6 py-8 text-white shadow-soft sm:px-8 sm:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.16),_transparent_36%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">CTA</p>
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Built for calm study sessions that still look sharp in a portfolio.
                  </h2>
                  <p className="text-base text-white/78">
                    Open the product, start a block, and see the flow immediately.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {profileReady ? (
                    <Link
                      to="/dashboard"
                      className={cn(
                        "inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-100",
                      )}
                    >
                      Explore FocusFlow
                      <ArrowRight size={16} className="ml-2" />
                    </Link>
                  ) : (
                    <Link
                      to={nextRoute}
                      className={cn(
                        "inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-100",
                      )}
                    >
                      {!profile.isAuthenticated ? "Sign In First" : "Complete Profile"}
                      <ArrowRight size={16} className="ml-2" />
                    </Link>
                  )}
                  {profileReady ? (
                    <Link
                      to="/settings"
                      className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18"
                    >
                      Customize Profile
                    </Link>
                  ) : (
                    <Link
                      to={nextRoute}
                      className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18"
                    >
                      Add Profile Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
