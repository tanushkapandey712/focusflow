import type {
  InstitutionType,
  StudyGoal,
  StudySession,
  Subject,
  UserProfile,
} from "../../types/models";

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

export interface FocusFlowStorageAPI {
  getSessions: () => StudySession[];
  saveSession: (session: StudySession) => StudySession[];
  updateSession: (sessionId: string, patch: Partial<StudySession>) => StudySession[];
  getSubjects: () => Subject[];
  saveSubjects: (subjects: Subject[]) => void;
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

  getSubjects: () => readList<Subject>(STORAGE_KEYS.subjects),

  saveSubjects: (subjects) => safeWrite(STORAGE_KEYS.subjects, subjects),

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
