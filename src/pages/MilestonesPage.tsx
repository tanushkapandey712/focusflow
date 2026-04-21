import { useMemo } from "react";
import { Award } from "lucide-react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { Card, GradientCard, SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import {
  countAchievedMilestones,
  evaluateMilestones,
  type Milestone,
  type MilestoneCategory,
} from "../utils/milestones";
import { cn } from "../lib/cn";

const categoryLabels: Record<MilestoneCategory, string> = {
  sessions: "Sessions",
  time: "Study Time",
  streak: "Streaks",
  topics: "Topics",
  subjects: "Subjects",
};

const categoryOrder: MilestoneCategory[] = ["sessions", "time", "streak", "topics", "subjects"];

const MilestoneCard = ({ milestone }: { milestone: Milestone }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-[1.5rem] border p-4 transition-all duration-300",
      milestone.achieved
        ? "border-brand-200/80 bg-gradient-to-br from-brand-50/80 to-white shadow-soft dark:border-brand-500/20 dark:from-brand-500/8 dark:to-slate-900/60"
        : "border-slate-200/80 bg-white/75 dark:border-white/10 dark:bg-slate-900/60",
    )}
  >
    {milestone.achieved && (
      <div className="absolute right-3 top-3 text-xl">{milestone.icon}</div>
    )}
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg",
          milestone.achieved
            ? "bg-brand-100 shadow-soft dark:bg-brand-500/15"
            : "bg-slate-100 dark:bg-slate-800",
        )}
      >
        {milestone.achieved ? milestone.icon : "🔒"}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            milestone.achieved
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400",
          )}
        >
          {milestone.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {milestone.description}
        </p>
      </div>
    </div>

    {/* Progress bar */}
    <div className="mt-3 flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            milestone.achieved
              ? "bg-brand-500 dark:bg-brand-300"
              : "bg-slate-400 dark:bg-slate-500",
          )}
          style={{ width: `${milestone.progress}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        {milestone.progress}%
      </span>
    </div>

    <p className="mt-2 text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
      {milestone.current} / {milestone.target}
      {milestone.category === "time" ? " min" : ""}
    </p>
  </div>
);

export const MilestonesPage = () => {
  const { sessions, subjects } = useFocusFlowData();

  const milestones = useMemo(
    () => evaluateMilestones(sessions, subjects),
    [sessions, subjects],
  );

  const achievedCount = countAchievedMilestones(milestones);
  const totalCount = milestones.length;
  const overallProgress = Math.round((achievedCount / Math.max(1, totalCount)) * 100);

  const grouped = useMemo(() => {
    const map = new Map<MilestoneCategory, Milestone[]>();
    for (const cat of categoryOrder) {
      map.set(cat, []);
    }
    for (const m of milestones) {
      map.get(m.category)?.push(m);
    }
    return map;
  }, [milestones]);

  return (
    <DashboardContainer>
      <SectionContainer
        title="Milestones & Achievements"
        description="Track your study journey through meaningful milestones. Each badge marks real progress."
      >
        {/* Summary banner */}
        <GradientCard tone="lavender" className="animate-fade-up p-6 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="surface-pill inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                <Award size={13} />
                Achievements
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                {achievedCount} of {totalCount} unlocked
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                {achievedCount === 0
                  ? "Start studying to unlock your first milestone. Every session counts."
                  : achievedCount === totalCount
                    ? "You've unlocked every milestone. Incredible dedication!"
                    : "Keep going. Each session brings you closer to the next milestone."}
              </p>
            </div>

            <div className="flex items-center gap-4 lg:flex-col lg:items-end">
              <div className="relative grid h-20 w-20 place-items-center rounded-full p-1"
                style={{
                  background: `conic-gradient(#5a55f5 ${overallProgress * 3.6}deg, rgba(148,163,184,0.25) 0deg)`,
                }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-white text-sm font-semibold shadow-soft dark:bg-surface-900">
                  {overallProgress}%
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Overall Progress
              </p>
            </div>
          </div>
        </GradientCard>

        {/* Milestone categories */}
        {categoryOrder.map((category) => {
          const items = grouped.get(category) ?? [];
          if (items.length === 0) return null;

          const categoryAchieved = items.filter((m) => m.achieved).length;

          return (
            <section key={category} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {categoryLabels[category]}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {categoryAchieved} of {items.length} achieved
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </section>
          );
        })}
      </SectionContainer>
    </DashboardContainer>
  );
};
