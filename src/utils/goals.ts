import type { StudyGoal, StudySession, UserProfile } from "../types/models";

export const normalizeGoalTitle = (value: string | undefined) =>
  value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";

export const parseGoalTitles = (value: string) => {
  const seen = new Set<string>();

  return value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => {
      const normalized = normalizeGoalTitle(line);

      if (!normalized || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
};

export const goalTitlesToText = (goals: Pick<StudyGoal, "title">[]) => goals.map((goal) => goal.title).join("\n");

const defaultTargetMinutesByMode: Record<UserProfile["preferredMode"], number> = {
  pomodoro: 150,
  "deep-work": 300,
  custom: 240,
};

export const getDefaultGoalTargetMinutes = (mode: UserProfile["preferredMode"]) =>
  defaultTargetMinutesByMode[mode];

export const getCompletedMinutesByGoal = (sessions: StudySession[]) =>
  sessions.reduce<Record<string, number>>((acc, session) => {
    const key = normalizeGoalTitle(session.goal);

    if (!key) {
      return acc;
    }

    acc[key] = (acc[key] ?? 0) + session.actualMinutes;
    return acc;
  }, {});
