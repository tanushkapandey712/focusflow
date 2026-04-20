import type { Subject, SyllabusUnit } from "../types/models";
import { buildSubjectsFromNames, normalizeSubjectName } from "./subjects";
import { normalizeReviewUnits } from "./syllabusImport";

export interface SaveReviewedSyllabusParams {
  subjectId?: string;
  subjectName?: string;
  units: SyllabusUnit[];
}

export interface SaveReviewedSyllabusResult {
  subjects: Subject[];
  savedSubjectId?: string;
}

const mergeUnitsIntoSubject = (subject: Subject, units: SyllabusUnit[]): Subject => ({
  ...subject,
  syllabusUnits: [...subject.syllabusUnits, ...units],
});

export const saveReviewedSyllabusToSubjects = (
  subjects: Subject[],
  params: SaveReviewedSyllabusParams,
): SaveReviewedSyllabusResult => {
  const normalizedUnits = normalizeReviewUnits(params.units);

  if (normalizedUnits.length === 0) {
    return {
      subjects,
      savedSubjectId: undefined,
    };
  }

  if (params.subjectId) {
    const existingSubject = subjects.find((subject) => subject.id === params.subjectId);

    if (!existingSubject) {
      return {
        subjects,
        savedSubjectId: undefined,
      };
    }

    return {
      subjects: subjects.map((subject) =>
        subject.id === existingSubject.id
          ? mergeUnitsIntoSubject(existingSubject, normalizedUnits)
          : subject,
      ),
      savedSubjectId: existingSubject.id,
    };
  }

  const normalizedName = params.subjectName?.trim() ?? "";

  if (!normalizedName) {
    return {
      subjects,
      savedSubjectId: undefined,
    };
  }

  const existingByName = subjects.find(
    (subject) => normalizeSubjectName(subject.name) === normalizeSubjectName(normalizedName),
  );

  if (existingByName) {
    return {
      subjects: subjects.map((subject) =>
        subject.id === existingByName.id
          ? mergeUnitsIntoSubject(existingByName, normalizedUnits)
          : subject,
      ),
      savedSubjectId: existingByName.id,
    };
  }

  const [nextSubject] = buildSubjectsFromNames([normalizedName], subjects);

  if (!nextSubject) {
    return {
      subjects,
      savedSubjectId: undefined,
    };
  }

  const createdSubject = {
    ...nextSubject,
    syllabusUnits: normalizedUnits,
  };

  return {
    subjects: [createdSubject, ...subjects.filter((subject) => subject.id !== createdSubject.id)],
    savedSubjectId: createdSubject.id,
  };
};

export const getSubjectSyllabus = (subjects: Subject[], subjectId: string): SyllabusUnit[] =>
  subjects.find((subject) => subject.id === subjectId)?.syllabusUnits ?? [];
