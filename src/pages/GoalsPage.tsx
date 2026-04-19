import { useMemo } from "react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { GoalCard, type GoalViewModel } from "../components/goals/GoalCard";
import { StreakCard } from "../components/goals/StreakCard";
import { SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { getCompletedMinutesByGoal, normalizeGoalTitle } from "../utils/goals";
import { getCurrentStreakDays, getLongestStreakDays } from "../utils/streak";
import { getGoalSubject } from "../utils/subjects";

const getGoalStatus = (percentage: number): GoalViewModel["status"] => {
  if (percentage >= 90) return "on-track";
  if (percentage >= 60) return "in-progress";
  return "behind";
};

export const GoalsPage = () => {
  const { goals, sessions, subjects, summary } = useFocusFlowData();
  const completedMinutesByGoal = useMemo(() => getCompletedMinutesByGoal(sessions), [sessions]);

  const displayGoals: GoalViewModel[] = useMemo(
    () =>
      goals.length > 0
        ? goals.map((goal) => {
            const completedMinutes =
              completedMinutesByGoal[normalizeGoalTitle(goal.title)] ?? goal.completedMinutes;
            const percentage = Math.min(100, Math.round((completedMinutes / Math.max(1, goal.targetMinutes)) * 100));

            return {
              id: goal.id,
              title: goal.title,
              progress: percentage,
              percentage,
              status: getGoalStatus(percentage),
              subject: getGoalSubject(goal.title, sessions, subjects),
            };
          })
        : [
            {
              id: "weekly-focus",
              title: "Weekly Focus Goal",
              progress: Math.min(100, Math.round((summary.weeklyMinutes / 600) * 100)),
              percentage: Math.min(100, Math.round((summary.weeklyMinutes / 600) * 100)),
              status: getGoalStatus(Math.min(100, Math.round((summary.weeklyMinutes / 600) * 100))),
            },
            {
              id: "daily-consistency",
              title: "Daily Consistency",
              progress: Math.min(100, Math.round((summary.todayMinutes / 120) * 100)),
              percentage: Math.min(100, Math.round((summary.todayMinutes / 120) * 100)),
              status: getGoalStatus(Math.min(100, Math.round((summary.todayMinutes / 120) * 100))),
            },
          ],
    [completedMinutesByGoal, goals, sessions, subjects, summary.todayMinutes, summary.weeklyMinutes],
  );

  const currentStreak = getCurrentStreakDays(sessions);
  const longestStreak = getLongestStreakDays(sessions);

  return (
    <DashboardContainer className="max-w-3xl">
      <SectionContainer
        title="Goals & Streaks"
        description="Stay motivated with visible progress and a cleaner sense of momentum."
      >
        <StreakCard currentDays={currentStreak} longestDays={Math.max(longestStreak, 7)} />

        <section className="space-y-4">
          {displayGoals.map((goal, index) => (
            <GoalCard key={goal.id} goal={goal} highlight={index === 0} />
          ))}
        </section>
      </SectionContainer>
    </DashboardContainer>
  );
};
