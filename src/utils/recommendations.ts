import type { RecommendationItem, StudySession } from "../types/models";

const getFocusScore = (session: StudySession) =>
  Math.min(100, Math.round((session.actualMinutes / Math.max(1, session.plannedMinutes)) * 100));

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const averageFocus = (sessions: StudySession[]) => average(sessions.map(getFocusScore));

const totalDistractions = (sessions: StudySession[]) =>
  sessions.reduce((sum, session) => sum + (session.distractionCount ?? 0), 0);

const totalMinutes = (sessions: StudySession[]) =>
  sessions.reduce((sum, session) => sum + session.actualMinutes, 0);

const byMostRecent = (sessions: StudySession[]) =>
  [...sessions].sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());

interface SubjectInsight {
  name: string;
  avgFocus: number;
  recentMinutes: number;
  totalMinutes: number;
}

const getSubjectInsights = (sessions: StudySession[], recentSessions: StudySession[]): SubjectInsight[] => {
  const recentMinutesBySubject = recentSessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.subjectName] = (acc[session.subjectName] ?? 0) + session.actualMinutes;
    return acc;
  }, {});

  const grouped = sessions.reduce<Record<string, StudySession[]>>((acc, session) => {
    acc[session.subjectName] = acc[session.subjectName] ?? [];
    acc[session.subjectName].push(session);
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, subjectSessions]) => ({
    name,
    avgFocus: averageFocus(subjectSessions),
    recentMinutes: recentMinutesBySubject[name] ?? 0,
    totalMinutes: totalMinutes(subjectSessions),
  }));
};

const getFocusMessage = (
  recentSessions: StudySession[],
  previousSessions: StudySession[],
  distractions: number,
) => {
  const recentFocus = averageFocus(recentSessions);
  const previousFocus = averageFocus(previousSessions);
  const averagePlannedMinutes = average(recentSessions.map((session) => session.plannedMinutes));

  if (recentFocus >= 92 && totalMinutes(recentSessions) >= 90) {
    return "Focus is sharp. Push one deep block.";
  }

  if (recentFocus >= 85) {
    return "Momentum is good. Stay in one lane.";
  }

  if (previousSessions.length > 0 && recentFocus >= previousFocus + 8) {
    return "Momentum is back. Protect this run.";
  }

  if (recentFocus < 70 && averagePlannedMinutes >= 40) {
    return "Cut the next block shorter.";
  }

  if (recentFocus < 70) {
    return "Start small. Win one clean sprint.";
  }

  if (distractions > recentSessions.length) {
    return "Guard the next block from noise.";
  }

  return "Lock in one clean 25-min sprint.";
};

const getBreakMessage = (recentSessions: StudySession[], distractions: number) => {
  const recentMinutes = totalMinutes(recentSessions);
  const distractionRate = recentSessions.length > 0 ? distractions / recentSessions.length : 0;
  const longSessions = recentSessions.filter((session) => session.actualMinutes >= 50).length;

  if (distractionRate >= 2) {
    return "Take 5. Reset before you restart.";
  }

  if (longSessions >= 2 || recentMinutes >= 140) {
    return "Take 10. Avoid a sloppy block.";
  }

  if (averageFocus(recentSessions) >= 85) {
    return "Keep breaks short. Come back fast.";
  }

  if (averageFocus(recentSessions) < 70) {
    return "Pause now. Restart with a clear head.";
  }

  return "Take a quick reset after this block.";
};

const getSubjectMessage = (sessions: StudySession[], recentSessions: StudySession[]) => {
  const insights = getSubjectInsights(sessions, recentSessions);
  const recentLeader = [...insights].sort(
    (a, b) => b.recentMinutes - a.recentMinutes || b.avgFocus - a.avgFocus || b.totalMinutes - a.totalMinutes,
  )[0];
  const focusLeader = [...insights].sort(
    (a, b) => b.avgFocus - a.avgFocus || b.recentMinutes - a.recentMinutes || b.totalMinutes - a.totalMinutes,
  )[0];
  const lastSubject = recentSessions[0]?.subjectName;

  if (lastSubject) {
    const lastSubjectInsight = insights.find((item) => item.name === lastSubject);
    if (lastSubjectInsight && lastSubjectInsight.avgFocus >= 85 && lastSubjectInsight.recentMinutes >= 45) {
      return `Stay with ${lastSubject}. It's clicking.`;
    }
  }

  if (focusLeader && focusLeader.avgFocus >= 85) {
    return `${focusLeader.name} deserves the next block.`;
  }

  if (recentLeader) {
    return `Go back to ${recentLeader.name}. Momentum is there.`;
  }

  return "Pick one subject and stay with it.";
};

export const generateRecommendations = (sessions: StudySession[]): RecommendationItem[] => {
  if (sessions.length === 0) {
    return [
      { category: "focus", message: "Start one 25-min block to unlock insights." },
      { category: "break", message: "Take a 5-min reset between first sessions." },
      { category: "subject", message: "Pick one subject and stay consistent today." },
    ];
  }

  const sortedSessions = byMostRecent(sessions);
  const recentSessions = sortedSessions.slice(0, 4);
  const previousSessions = sortedSessions.slice(4, 8);
  const distractions = totalDistractions(recentSessions);

  const focusMessage = getFocusMessage(recentSessions, previousSessions, distractions);
  const breakMessage = getBreakMessage(recentSessions, distractions);
  const subjectMessage = getSubjectMessage(sortedSessions, recentSessions);

  return [
    { category: "focus", message: focusMessage },
    { category: "break", message: breakMessage },
    { category: "subject", message: subjectMessage },
  ];
};
