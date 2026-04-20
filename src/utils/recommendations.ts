import type { RecommendationItem, StudySession, Subject } from "../types/models";
import { getSyllabusTopicStatus } from "./syllabus";
import { getSyllabusCompletionSummary } from "./syllabusProgress";

const RECENT_SESSION_COUNT = 4;
const PREVIOUS_SESSION_COUNT = 4;
const NEGLECTED_SUBJECT_DAYS = 7;
const EXAM_PRIORITY_DAYS = 14;

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

interface TopicTarget {
  subjectId: string;
  subjectName: string;
  unitTitle: string;
  topicTitle: string;
  topicStatus: ReturnType<typeof getSyllabusTopicStatus>;
  examDaysAway?: number;
  recentMinutes: number;
  totalMinutes: number;
  lastStudiedAt?: string;
}

export interface SyllabusDashboardInsights {
  completionPercent: number;
  coveredTopics: number;
  totalTopics: number;
  neglectedSubject?: {
    subjectName: string;
    topicTitle: string;
    daysSinceLastStudy?: number;
  };
  nextRecommendedTopic?: {
    subjectName: string;
    unitTitle: string;
    topicTitle: string;
    topicStatus: TopicTarget["topicStatus"];
    reason: "exam_priority" | "neglected_subject" | "momentum";
    examDaysAway?: number;
  };
}

const getStatusMessage = (status: TopicTarget["topicStatus"]) => {
  if (status === "completed") {
    return "completed";
  }

  if (status === "in_progress") {
    return "in progress";
  }

  return "not started";
};

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

const getDaysUntil = (isoDate: string, now: Date) =>
  Math.ceil((new Date(isoDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

const getDaysSince = (isoDate: string, now: Date) =>
  Math.floor((now.getTime() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));

const getNextOpenTopic = (subject: Subject) => {
  for (const unit of subject.syllabusUnits) {
    for (const topic of unit.topics) {
      if (getSyllabusTopicStatus(topic) !== "completed") {
        return {
          unitTitle: unit.title,
          topic,
        };
      }
    }
  }

  return undefined;
};

const getLastStudiedBySubject = (subjectId: string, sessions: StudySession[]) =>
  byMostRecent(sessions).find((session) => session.subjectId === subjectId)?.endedAt;

const getSubjectMinutes = (subjectId: string, sessions: StudySession[]) =>
  sessions
    .filter((session) => session.subjectId === subjectId)
    .reduce((sum, session) => sum + session.actualMinutes, 0);

const getRecentMinutesBySubject = (subjectId: string, sessions: StudySession[], now: Date) => {
  const recentCutoff = new Date(now);
  recentCutoff.setDate(recentCutoff.getDate() - NEGLECTED_SUBJECT_DAYS);

  return sessions
    .filter((session) => session.subjectId === subjectId && new Date(session.endedAt) >= recentCutoff)
    .reduce((sum, session) => sum + session.actualMinutes, 0);
};

const buildTopicTargets = (subjects: Subject[], sessions: StudySession[], now: Date): TopicTarget[] =>
  subjects.reduce<TopicTarget[]>((acc, subject) => {
    const nextOpenTopic = getNextOpenTopic(subject);

    if (!nextOpenTopic) {
      return acc;
    }

    acc.push({
      subjectId: subject.id,
      subjectName: subject.name,
      unitTitle: nextOpenTopic.unitTitle,
      topicTitle: nextOpenTopic.topic.title,
      topicStatus: getSyllabusTopicStatus(nextOpenTopic.topic),
      examDaysAway:
        subject.examDate && getDaysUntil(subject.examDate, now) >= 0
          ? getDaysUntil(subject.examDate, now)
          : undefined,
      recentMinutes: getRecentMinutesBySubject(subject.id, sessions, now),
      totalMinutes: getSubjectMinutes(subject.id, sessions),
      lastStudiedAt: getLastStudiedBySubject(subject.id, sessions),
    });

    return acc;
  }, []);

const getExamPrioritySuggestion = (targets: TopicTarget[]) =>
  [...targets]
    .filter(
      (target) =>
        target.examDaysAway !== undefined && target.examDaysAway >= 0 && target.examDaysAway <= EXAM_PRIORITY_DAYS,
    )
    .sort(
      (a, b) =>
        (a.examDaysAway ?? Number.POSITIVE_INFINITY) - (b.examDaysAway ?? Number.POSITIVE_INFINITY) ||
        a.recentMinutes - b.recentMinutes ||
        a.totalMinutes - b.totalMinutes,
    )[0];

const getNeglectedSubjectSuggestion = (targets: TopicTarget[], now: Date) =>
  [...targets]
    .filter((target) => {
      if (!target.lastStudiedAt) {
        return true;
      }

      return getDaysUntil(target.lastStudiedAt, now) <= -NEGLECTED_SUBJECT_DAYS;
    })
    .sort(
      (a, b) =>
        a.recentMinutes - b.recentMinutes ||
        (a.lastStudiedAt ? new Date(a.lastStudiedAt).getTime() : 0) -
          (b.lastStudiedAt ? new Date(b.lastStudiedAt).getTime() : 0),
    )[0];

const getMomentumTopicSuggestion = (targets: TopicTarget[]) =>
  [...targets].sort((a, b) => b.totalMinutes - a.totalMinutes || a.recentMinutes - b.recentMinutes)[0];

export const getSyllabusDashboardInsights = (
  subjects: Subject[],
  sessions: StudySession[],
  now = new Date(),
): SyllabusDashboardInsights => {
  const completion = getSyllabusCompletionSummary(subjects);
  const targets = buildTopicTargets(subjects, sessions, now);
  const examPriority = getExamPrioritySuggestion(targets);
  const neglectedTarget = getNeglectedSubjectSuggestion(targets, now);
  const momentumTarget = getMomentumTopicSuggestion(targets);

  let nextRecommendedTopic: SyllabusDashboardInsights["nextRecommendedTopic"];

  if (examPriority) {
    nextRecommendedTopic = {
      subjectName: examPriority.subjectName,
      unitTitle: examPriority.unitTitle,
      topicTitle: examPriority.topicTitle,
      topicStatus: examPriority.topicStatus,
      reason: "exam_priority",
      examDaysAway: examPriority.examDaysAway,
    };
  } else if (neglectedTarget) {
    nextRecommendedTopic = {
      subjectName: neglectedTarget.subjectName,
      unitTitle: neglectedTarget.unitTitle,
      topicTitle: neglectedTarget.topicTitle,
      topicStatus: neglectedTarget.topicStatus,
      reason: "neglected_subject",
    };
  } else if (momentumTarget) {
    nextRecommendedTopic = {
      subjectName: momentumTarget.subjectName,
      unitTitle: momentumTarget.unitTitle,
      topicTitle: momentumTarget.topicTitle,
      topicStatus: momentumTarget.topicStatus,
      reason: "momentum",
      examDaysAway: momentumTarget.examDaysAway,
    };
  }

  return {
    completionPercent: completion.completionPercent,
    coveredTopics: completion.coveredTopics,
    totalTopics: completion.totalTopics,
    neglectedSubject: neglectedTarget
      ? {
          subjectName: neglectedTarget.subjectName,
          topicTitle: neglectedTarget.topicTitle,
          daysSinceLastStudy: neglectedTarget.lastStudiedAt
            ? getDaysSince(neglectedTarget.lastStudiedAt, now)
            : undefined,
        }
      : undefined,
    nextRecommendedTopic,
  };
};

const formatDayLabel = (days: number) => {
  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "in 1 day";
  }

  return `in ${days} days`;
};

const getSubjectMessage = (sessions: StudySession[], recentSessions: StudySession[], subjects: Subject[]) => {
  const now = new Date();
  const targets = buildTopicTargets(subjects, sessions, now);

  if (targets.length === 0) {
    const insights = getSubjectInsights(sessions, recentSessions);
    const recentLeader = [...insights].sort(
      (a, b) =>
        b.recentMinutes - a.recentMinutes || b.avgFocus - a.avgFocus || b.totalMinutes - a.totalMinutes,
    )[0];

    return recentLeader
      ? `Stay with ${recentLeader.name}. Momentum is there.`
      : "Map a few syllabus topics to unlock subject suggestions.";
  }

  const examPriority = getExamPrioritySuggestion(targets);

  if (examPriority?.examDaysAway !== undefined) {
    return `Prioritize ${examPriority.subjectName}: ${examPriority.topicTitle} is still ${getStatusMessage(examPriority.topicStatus)} and the exam is ${formatDayLabel(examPriority.examDaysAway)}.`;
  }

  const neglectedTarget = getNeglectedSubjectSuggestion(targets, now);

  if (neglectedTarget) {
    return `Return to ${neglectedTarget.subjectName}: ${neglectedTarget.topicTitle} is still ${getStatusMessage(neglectedTarget.topicStatus)} and the subject has been quiet lately.`;
  }

  const momentumTarget = getMomentumTopicSuggestion(targets);

  if (momentumTarget) {
    return `Finish ${momentumTarget.unitTitle} / ${momentumTarget.topicTitle} in ${momentumTarget.subjectName} next.`;
  }

  return "Pick one unfinished topic and close it out.";
};

export const generateRecommendations = (
  sessions: StudySession[],
  subjects: Subject[],
): RecommendationItem[] => {
  if (sessions.length === 0) {
    const now = new Date();
    const examTarget = getExamPrioritySuggestion(buildTopicTargets(subjects, sessions, now));

    return [
      { category: "focus", message: "Start one 25-min block to unlock insights." },
      { category: "break", message: "Take a 5-min reset between first sessions." },
      {
        category: "subject",
        message: examTarget?.examDaysAway !== undefined
          ? `Start with ${examTarget.subjectName}. The exam is ${formatDayLabel(examTarget.examDaysAway)}.`
          : "Pick one unfinished topic and make the first pass today.",
      },
    ];
  }

  const sortedSessions = byMostRecent(sessions);
  const recentSessions = sortedSessions.slice(0, RECENT_SESSION_COUNT);
  const previousSessions = sortedSessions.slice(
    RECENT_SESSION_COUNT,
    RECENT_SESSION_COUNT + PREVIOUS_SESSION_COUNT,
  );
  const distractions = totalDistractions(recentSessions);

  const focusMessage = getFocusMessage(recentSessions, previousSessions, distractions);
  const breakMessage = getBreakMessage(recentSessions, distractions);
  const subjectMessage = getSubjectMessage(sortedSessions, recentSessions, subjects);

  return [
    { category: "focus", message: focusMessage },
    { category: "break", message: breakMessage },
    { category: "subject", message: subjectMessage },
  ];
};
