import type {
  InstitutionType,
  StudyGoal,
  StudySession,
  Subject,
  SyllabusTopic,
  SyllabusUnit,
  UserProfile,
} from "../../types/models";
import {
  getSubjectSyllabus as getSubjectSyllabusFromSubjects,
  type SaveReviewedSyllabusParams,
  saveReviewedSyllabusToSubjects,
} from "../../utils/syllabusPersistence";
import { getSyllabusTopicStatus } from "../../utils/syllabus";

const STORAGE_KEYS = {
  subjects: "focusflow.subjects.v1",
  sessions: "focusflow.sessions.v1",
  profile: "focusflow.profile.v1",
  goals: "focusflow.goals.v1",
} as const;

const defaultProfile: UserProfile = {
  id: "local-user",
  name: "Student",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  preferredMode: "pomodoro",
  isAuthenticated: false,
  hasCompletedProfileSetup: false,
};

const getValidInstitutionType = (value: unknown): InstitutionType | undefined =>
  value === "school" || value === "college" ? value : undefined;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently ignore quota/security issues for local mode.
  }
};

const readList = <T,>(key: string): T[] => {
  const parsed = safeParse<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
};

const createFallbackNodeId = (prefix: string, index: number) => `${prefix}-${index + 1}`;

const normalizeTopic = (value: unknown, index: number): SyllabusTopic | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<SyllabusTopic> & { completed?: unknown };
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";

  if (!title) {
    return null;
  }

  return {
    id:
      typeof candidate.id === "string" && candidate.id.trim()
        ? candidate.id
        : createFallbackNodeId("topic", index),
    title,
    studiedMinutes:
      typeof candidate.studiedMinutes === "number" && Number.isFinite(candidate.studiedMinutes)
        ? Math.max(0, candidate.studiedMinutes)
        : 0,
    studySessionsCount:
      typeof candidate.studySessionsCount === "number" &&
      Number.isFinite(candidate.studySessionsCount)
        ? Math.max(0, candidate.studySessionsCount)
        : 0,
    lastStudiedAt:
      typeof candidate.lastStudiedAt === "string" && candidate.lastStudiedAt.trim()
        ? candidate.lastStudiedAt
        : undefined,
    status: getSyllabusTopicStatus({
      id:
        typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id
          : createFallbackNodeId("topic", index),
      title,
      status:
        candidate.status === "not_started" ||
        candidate.status === "in_progress" ||
        candidate.status === "completed"
          ? candidate.status
          : candidate.completed === true
            ? "completed"
            : "not_started",
      studiedMinutes:
        typeof candidate.studiedMinutes === "number" && Number.isFinite(candidate.studiedMinutes)
          ? Math.max(0, candidate.studiedMinutes)
          : 0,
      studySessionsCount:
        typeof candidate.studySessionsCount === "number" &&
        Number.isFinite(candidate.studySessionsCount)
          ? Math.max(0, candidate.studySessionsCount)
          : 0,
      lastStudiedAt:
        typeof candidate.lastStudiedAt === "string" && candidate.lastStudiedAt.trim()
          ? candidate.lastStudiedAt
          : undefined,
    }),
  };
};

const normalizeUnit = (value: unknown, index: number): SyllabusUnit | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<SyllabusUnit> & { topics?: unknown };
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";

  if (!title) {
    return null;
  }

  const rawTopics = Array.isArray(candidate.topics) ? candidate.topics : [];

  return {
    id:
      typeof candidate.id === "string" && candidate.id.trim()
        ? candidate.id
        : createFallbackNodeId("unit", index),
    title,
    topics: rawTopics
      .map((topic, topicIndex) => normalizeTopic(topic, topicIndex))
      .filter((topic): topic is SyllabusTopic => Boolean(topic)),
  };
};

const normalizeSubject = (value: unknown): Subject | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Subject> & { syllabusUnits?: unknown };
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const color = typeof candidate.color === "string" ? candidate.color.trim() : "";

  if (!id || !name || !color) {
    return null;
  }

  const rawUnits = Array.isArray(candidate.syllabusUnits) ? candidate.syllabusUnits : [];

  return {
    id,
    name,
    color,
    examDate:
      typeof candidate.examDate === "string" && candidate.examDate.trim()
        ? candidate.examDate
        : undefined,
    syllabusUnits: rawUnits
      .map((unit, unitIndex) => normalizeUnit(unit, unitIndex))
      .filter((unit): unit is SyllabusUnit => Boolean(unit)),
  };
};

export interface FocusFlowStorageAPI {
  getSessions: () => StudySession[];
  saveSession: (session: StudySession) => StudySession[];
  updateSession: (sessionId: string, patch: Partial<StudySession>) => StudySession[];
  getSubjects: () => Subject[];
  getSubjectSyllabus: (subjectId: string) => SyllabusUnit[];
  saveSubjects: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => Subject[];
  updateSubject: (subjectId: string, patch: Partial<Subject>) => Subject[];
  saveReviewedSyllabus: (params: SaveReviewedSyllabusParams) => Subject[];
  getProfile: () => UserProfile;
  saveProfile: (profile: UserProfile) => void;
  getGoals: () => StudyGoal[];
  saveGoals: (goals: StudyGoal[]) => void;
}

export const focusFlowStorage: FocusFlowStorageAPI = {
  getSessions: () => readList<StudySession>(STORAGE_KEYS.sessions),

  saveSession: (session) => {
    const current = readList<StudySession>(STORAGE_KEYS.sessions);
    const next = [session, ...current];
    safeWrite(STORAGE_KEYS.sessions, next);
    return next;
  },

  updateSession: (sessionId, patch) => {
    const current = readList<StudySession>(STORAGE_KEYS.sessions);
    const next = current.map((session) =>
      session.id === sessionId ? { ...session, ...patch } : session,
    );
    safeWrite(STORAGE_KEYS.sessions, next);
    return next;
  },

  getSubjects: () =>
    readList<unknown>(STORAGE_KEYS.subjects)
      .map((subject) => normalizeSubject(subject))
      .filter((subject): subject is Subject => Boolean(subject)),

  getSubjectSyllabus: (subjectId) =>
    getSubjectSyllabusFromSubjects(focusFlowStorage.getSubjects(), subjectId),

  saveSubjects: (subjects) =>
    safeWrite(
      STORAGE_KEYS.subjects,
      subjects
        .map((subject) => normalizeSubject(subject))
        .filter((subject): subject is Subject => Boolean(subject)),
    ),

  addSubject: (subject) => {
    const current = focusFlowStorage.getSubjects();
    const normalized = normalizeSubject(subject);
    if (!normalized) {
      return current;
    }

    const next = [normalized, ...current.filter((item) => item.id !== normalized.id)];
    safeWrite(STORAGE_KEYS.subjects, next);
    return next;
  },

  updateSubject: (subjectId, patch) => {
    const current = focusFlowStorage.getSubjects();
    const next = current.map((subject) =>
      subject.id === subjectId
        ? normalizeSubject({ ...subject, ...patch }) ?? subject
        : subject,
    );
    safeWrite(STORAGE_KEYS.subjects, next);
    return next;
  },

  saveReviewedSyllabus: (params) => {
    const current = focusFlowStorage.getSubjects();
    const { subjects } = saveReviewedSyllabusToSubjects(current, params);
    focusFlowStorage.saveSubjects(subjects);
    return subjects;
  },

  getProfile: () => {
    const stored = safeParse<Partial<UserProfile>>(localStorage.getItem(STORAGE_KEYS.profile), {});
    const email = typeof stored.email === "string" ? stored.email : undefined;
    const emailVerifiedAt =
      typeof stored.emailVerifiedAt === "string" ? stored.emailVerifiedAt : undefined;
    const hasVerifiedEmail = Boolean(email && emailVerifiedAt);

    return {
      ...defaultProfile,
      ...stored,
      email,
      emailVerifiedAt,
      institutionType: getValidInstitutionType(stored.institutionType),
      classOrCourse: typeof stored.classOrCourse === "string" ? stored.classOrCourse : undefined,
      institutionStartTime:
        typeof stored.institutionStartTime === "string" ? stored.institutionStartTime : undefined,
      institutionEndTime:
        typeof stored.institutionEndTime === "string" ? stored.institutionEndTime : undefined,
      isAuthenticated: stored.isAuthenticated === true && hasVerifiedEmail,
      hasCompletedProfileSetup: stored.hasCompletedProfileSetup === true && hasVerifiedEmail,
    };
  },

  saveProfile: (profile) => safeWrite(STORAGE_KEYS.profile, profile),

  getGoals: () => readList<StudyGoal>(STORAGE_KEYS.goals),

  saveGoals: (goals) => safeWrite(STORAGE_KEYS.goals, goals),
};
