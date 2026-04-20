import type {
  Subject,
  SyllabusTopic,
  SyllabusTopicStatus,
  SyllabusUnit,
} from "../types/models";

const createNodeId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `syllabus-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createSyllabusUnit = (title: string): SyllabusUnit => ({
  id: createNodeId(),
  title: title.trim(),
  topics: [],
});

export const createSyllabusTopic = (title: string): SyllabusTopic => ({
  id: createNodeId(),
  title: title.trim(),
  status: "not_started",
  studiedMinutes: 0,
  studySessionsCount: 0,
});

export const isSyllabusTopicCovered = (topic: SyllabusTopic) =>
  topic.status !== "not_started" || topic.studiedMinutes > 0;

export const getSyllabusTopicStatus = (topic: SyllabusTopic): SyllabusTopicStatus => {
  if (topic.status === "completed") {
    return "completed";
  }

  if (topic.studiedMinutes > 0) {
    return "in_progress";
  }

  return "not_started";
};

export const getTopicProgressPercent = (topic: SyllabusTopic) => {
  const status = getSyllabusTopicStatus(topic);

  if (status === "completed") {
    return 100;
  }

  if (status === "in_progress") {
    return 50;
  }

  return 0;
};

export const getTopicProgressLabel = (topic: SyllabusTopic) => {
  const status = getSyllabusTopicStatus(topic);

  if (status === "completed") {
    return "Completed";
  }

  if (status === "in_progress") {
    return "In Progress";
  }

  return "Not Started";
};

export const getTopicStatusTone = (topic: SyllabusTopic) => {
  const status = getSyllabusTopicStatus(topic);

  if (status === "completed") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
  }

  if (status === "in_progress") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
};

export const getTopicTimeSpentLabel = (topic: SyllabusTopic) =>
  topic.studiedMinutes > 0
    ? `${topic.studiedMinutes} min tracked across ${topic.studySessionsCount} session${topic.studySessionsCount === 1 ? "" : "s"}`
    : "No tracked study time yet";

export const formatLastStudiedLabel = (lastStudiedAt?: string) =>
  lastStudiedAt
    ? `Last studied ${new Date(lastStudiedAt).toLocaleDateString()}`
    : "Not studied yet";

export const toggleTopicCompletionStatus = (topic: SyllabusTopic): SyllabusTopic => ({
  ...topic,
  status:
    getSyllabusTopicStatus(topic) === "completed"
      ? topic.studiedMinutes > 0
        ? "in_progress"
        : "not_started"
      : "completed",
});

export const getUnitCompletionPercent = (unit: SyllabusUnit) => {
  if (unit.topics.length === 0) {
    return 0;
  }

  const totalProgress = unit.topics.reduce((sum, topic) => sum + getTopicProgressPercent(topic), 0);
  return Math.round(totalProgress / unit.topics.length);
};

export const getSubjectCompletionPercent = (subject: Subject) => {
  const allTopics = subject.syllabusUnits.flatMap((unit) => unit.topics);

  if (allTopics.length === 0) {
    return 0;
  }

  const totalProgress = allTopics.reduce((sum, topic) => sum + getTopicProgressPercent(topic), 0);
  return Math.round(totalProgress / allTopics.length);
};

export const getSyllabusStats = (subject: Subject) => {
  const unitCount = subject.syllabusUnits.length;
  const topicCount = subject.syllabusUnits.reduce((sum, unit) => sum + unit.topics.length, 0);
  const coveredTopicCount = subject.syllabusUnits.reduce(
    (sum, unit) => sum + unit.topics.filter((topic) => isSyllabusTopicCovered(topic)).length,
    0,
  );
  const studiedMinutes = subject.syllabusUnits.reduce(
    (sum, unit) => sum + unit.topics.reduce((unitSum, topic) => unitSum + topic.studiedMinutes, 0),
    0,
  );

  return {
    unitCount,
    topicCount,
    coveredTopicCount,
    studiedMinutes,
    completionPercent: getSubjectCompletionPercent(subject),
  };
};
