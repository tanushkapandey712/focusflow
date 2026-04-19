import type { StudySession } from "../types/models";

export const formatMinutes = (minutes: number) => `${minutes} min`;

export const isToday = (isoDate: string) => {
  const date = new Date(isoDate);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const getLast7DaysTotal = (sessions: StudySession[]) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return sessions
    .filter((session) => new Date(session.endedAt) >= sevenDaysAgo)
    .reduce((sum, session) => sum + session.actualMinutes, 0);
};
