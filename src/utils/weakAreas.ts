import type { StudySession, Subject } from "../types/models";
import { getSyllabusTopicStatus } from "./syllabus";

export interface WeakArea {
  type: "low_time_topic" | "unstudied_subject" | "incomplete_unit" | "neglected_area";
  subjectName: string;
  subjectId: string;
  detail: string;
  /** Severity from 0–100, higher = more urgent */
  severity: number;
}

const LOW_TIME_THRESHOLD_MINUTES = 10;
const NEGLECTED_DAYS = 7;

/**
 * Detects weak areas across subjects and sessions.
 * Returns a list sorted by severity (most urgent first).
 */
export const detectWeakAreas = (
  subjects: Subject[],
  sessions: StudySession[],
): WeakArea[] => {
  const now = new Date();
  const areas: WeakArea[] = [];

  // Build a map of total minutes per subject
  const minutesBySubject = sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.subjectId] = (acc[session.subjectId] ?? 0) + session.actualMinutes;
    return acc;
  }, {});

  // Build a map of most recent session per subject
  const lastStudiedBySubject = sessions.reduce<Record<string, Date>>((acc, session) => {
    const endDate = new Date(session.endedAt);
    if (!acc[session.subjectId] || endDate > acc[session.subjectId]) {
      acc[session.subjectId] = endDate;
    }
    return acc;
  }, {});

  for (const subject of subjects) {
    const totalMinutes = minutesBySubject[subject.id] ?? 0;
    const lastStudied = lastStudiedBySubject[subject.id];
    const daysSinceStudy = lastStudied
      ? Math.floor((now.getTime() - lastStudied.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // 1. Unstudied subjects (no sessions at all)
    if (totalMinutes === 0 && subject.syllabusUnits.length > 0) {
      areas.push({
        type: "unstudied_subject",
        subjectName: subject.name,
        subjectId: subject.id,
        detail: `${subject.name} has no study sessions logged yet.`,
        severity: 90,
      });
      continue;
    }

    // 2. Neglected subjects (not studied in 7+ days)
    if (daysSinceStudy !== undefined && daysSinceStudy >= NEGLECTED_DAYS) {
      areas.push({
        type: "neglected_area",
        subjectName: subject.name,
        subjectId: subject.id,
        detail: `${subject.name} hasn't been studied in ${daysSinceStudy} days.`,
        severity: Math.min(85, 50 + daysSinceStudy * 2),
      });
    }

    // 3. Incomplete units with low-time topics
    for (const unit of subject.syllabusUnits) {
      const incompleteTops = unit.topics.filter(
        (t) => getSyllabusTopicStatus(t) !== "completed",
      );
      const lowTimeTopics = unit.topics.filter(
        (t) =>
          getSyllabusTopicStatus(t) !== "completed" &&
          t.studiedMinutes < LOW_TIME_THRESHOLD_MINUTES,
      );

      if (incompleteTops.length > 0 && incompleteTops.length === unit.topics.length) {
        areas.push({
          type: "incomplete_unit",
          subjectName: subject.name,
          subjectId: subject.id,
          detail: `"${unit.title}" in ${subject.name} is fully incomplete (${unit.topics.length} topics).`,
          severity: 70,
        });
      } else if (lowTimeTopics.length > 0) {
        areas.push({
          type: "low_time_topic",
          subjectName: subject.name,
          subjectId: subject.id,
          detail: `${lowTimeTopics.length} topic${lowTimeTopics.length === 1 ? "" : "s"} in "${unit.title}" ${lowTimeTopics.length === 1 ? "has" : "have"} less than ${LOW_TIME_THRESHOLD_MINUTES} min of study.`,
          severity: 55,
        });
      }
    }
  }

  // Sort by severity descending
  return areas.sort((a, b) => b.severity - a.severity);
};
