import type { StudySession } from "../types/models";

const dayKey = (date: Date) => date.toISOString().split("T")[0];

export const getCurrentStreakDays = (sessions: StudySession[]) => {
  if (sessions.length === 0) return 0;

  const daysWithSessions = new Set(
    sessions.map((session) => dayKey(new Date(session.endedAt))),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (daysWithSessions.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const getLongestStreakDays = (sessions: StudySession[]) => {
  if (sessions.length === 0) return 0;
  const sortedDays = Array.from(
    new Set(sessions.map((session) => dayKey(new Date(session.endedAt)))),
  ).sort();

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDays.length; i += 1) {
    const prev = new Date(sortedDays[i - 1]);
    const next = new Date(sortedDays[i]);
    const diffDays = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
};
