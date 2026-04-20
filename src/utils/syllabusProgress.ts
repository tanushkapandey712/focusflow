import type {
  StudySession,
  StudySessionSyllabusLink,
  Subject,
  SyllabusUnit,
} from "../types/models";
import { getSyllabusTopicStatus, isSyllabusTopicCovered } from "./syllabus";

export interface SyllabusSelectionState {
  unitId: string;
  topicId: string;
}

export interface SubjectStudyBreakdownItem {
  subjectId: string;
  subjectName: string;
  minutes: number;
}

export interface SyllabusCompletionSummary {
  totalTopics: number;
  coveredTopics: number;
  completionPercent: number;
}

export const getValidSyllabusSelection = (
  subject: Subject | undefined,
  unitId: string,
  topicId: string,
): SyllabusSelectionState => {
  if (!subject || subject.syllabusUnits.length === 0) {
    return {
      unitId: "",
      topicId: "",
    };
  }

  const selectedUnit =
    subject.syllabusUnits.find((candidate) => candidate.id === unitId) ?? subject.syllabusUnits[0];
  const selectedTopic =
    selectedUnit.topics.find((candidate) => candidate.id === topicId) ?? selectedUnit.topics[0];

  return {
    unitId: selectedUnit.id,
    topicId: selectedTopic?.id ?? "",
  };
};

export const getSessionSyllabusLink = (
  subject: Subject | undefined,
  unitId: string,
  topicId: string,
): StudySessionSyllabusLink | undefined => {
  if (!subject || !unitId || !topicId) {
    return undefined;
  }

  const unit = subject.syllabusUnits.find((candidate) => candidate.id === unitId);
  const topic = unit?.topics.find((candidate) => candidate.id === topicId);

  if (!unit || !topic) {
    return undefined;
  }

  return {
    unitId: unit.id,
    unitTitle: unit.title,
    topicId: topic.id,
    topicTitle: topic.title,
  };
};

export const applySessionToSubjectTopic = (
  subject: Subject,
  params: {
    syllabusTopic?: StudySessionSyllabusLink;
    actualMinutes: number;
    endedAt: string;
  },
): SyllabusUnit[] => {
  const { syllabusTopic, actualMinutes, endedAt } = params;

  if (!syllabusTopic || actualMinutes <= 0) {
    return subject.syllabusUnits;
  }

  let topicUpdated = false;

  const nextUnits = subject.syllabusUnits.map((unit) => {
    if (unit.id !== syllabusTopic.unitId) {
      return unit;
    }

    const nextTopics = unit.topics.map((topic) => {
      if (topic.id !== syllabusTopic.topicId) {
        return topic;
      }

      topicUpdated = true;

      return {
        ...topic,
        status:
          getSyllabusTopicStatus(topic) === "completed"
            ? ("completed" as const)
            : ("in_progress" as const),
        studiedMinutes: topic.studiedMinutes + actualMinutes,
        studySessionsCount: topic.studySessionsCount + 1,
        lastStudiedAt: endedAt,
      };
    });

    return {
      ...unit,
      topics: nextTopics,
    };
  });

  return topicUpdated ? nextUnits : subject.syllabusUnits;
};

export const rebuildSubjectsWithSessionProgress = (
  subjects: Subject[],
  sessions: StudySession[],
): Subject[] => {
  const nextSubjects: Subject[] = subjects.map((subject) => ({
    ...subject,
    syllabusUnits: subject.syllabusUnits.map((unit) => ({
      ...unit,
      topics: unit.topics.map((topic) => ({
        ...topic,
        status:
          getSyllabusTopicStatus(topic) === "completed"
            ? ("completed" as const)
            : ("not_started" as const),
        studiedMinutes: 0,
        studySessionsCount: 0,
        lastStudiedAt: undefined as string | undefined,
      })),
    })),
  }));

  sessions.forEach((session) => {
    if (!session.syllabusTopic || session.actualMinutes <= 0) {
      return;
    }

    const subject = nextSubjects.find((candidate) => candidate.id === session.subjectId);
    const unit = subject?.syllabusUnits.find((candidate) => candidate.id === session.syllabusTopic?.unitId);
    const topic = unit?.topics.find((candidate) => candidate.id === session.syllabusTopic?.topicId);

    if (!topic) {
      return;
    }

    topic.studiedMinutes += session.actualMinutes;
    topic.studySessionsCount += 1;
    topic.status = topic.status === "completed" ? "completed" : "in_progress";
    topic.lastStudiedAt =
      !topic.lastStudiedAt || new Date(session.endedAt).getTime() > new Date(topic.lastStudiedAt).getTime()
        ? session.endedAt
        : topic.lastStudiedAt;
  });

  return nextSubjects;
};

export const getSubjectStudyBreakdown = (
  sessions: StudySession[],
  subjects: Subject[],
): SubjectStudyBreakdownItem[] => {
  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name] as const));
  const breakdown = new Map<string, SubjectStudyBreakdownItem>();

  sessions.forEach((session) => {
    const subjectId = session.subjectId;
    const subjectName = subjectNames.get(subjectId) ?? session.subjectName;
    const current = breakdown.get(subjectId);

    breakdown.set(subjectId, {
      subjectId,
      subjectName,
      minutes: (current?.minutes ?? 0) + session.actualMinutes,
    });
  });

  return [...breakdown.values()].sort((left, right) => right.minutes - left.minutes);
};

export const getSyllabusCompletionSummary = (subjects: Subject[]): SyllabusCompletionSummary => {
  const totalTopics = subjects.reduce(
    (sum, subject) => sum + subject.syllabusUnits.reduce((unitSum, unit) => unitSum + unit.topics.length, 0),
    0,
  );
  const coveredTopics = subjects.reduce(
    (sum, subject) =>
      sum +
      subject.syllabusUnits.reduce(
        (unitSum, unit) =>
          unitSum + unit.topics.filter((topic) => isSyllabusTopicCovered(topic)).length,
        0,
      ),
    0,
  );

  return {
    totalTopics,
    coveredTopics,
    completionPercent: totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0,
  };
};
