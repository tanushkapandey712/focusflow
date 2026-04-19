import type { FocusTrackingSessionSummary } from "./focusTracking";

export interface SyllabusTopic {
  id: string;
  title: string;
  completed: boolean;
}

export interface SyllabusUnit {
  id: string;
  title: string;
  topics: SyllabusTopic[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  syllabusUnits: SyllabusUnit[];
}

export type InstitutionType = "school" | "college";

export interface UserProfile {
  id: string;
  name: string;
  timezone: string;
  preferredMode: "pomodoro" | "deep-work" | "custom";
  isAuthenticated: boolean;
  hasCompletedProfileSetup: boolean;
  email?: string;
  emailVerifiedAt?: string;
  institutionType?: InstitutionType;
  classOrCourse?: string;
  institutionStartTime?: string;
  institutionEndTime?: string;
}

export interface StudyGoal {
  id: string;
  title: string;
  targetMinutes: number;
  completedMinutes: number;
  dueDate?: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  startedAt: string;
  endedAt: string;
  plannedMinutes: number;
  actualMinutes: number;
  distractionCount?: number;
  distractionTags?: string[];
  goal?: string;
  note?: string;
  focusTracking?: FocusTrackingSessionSummary;
}

export interface DashboardSummary {
  todayMinutes: number;
  totalSessions: number;
  totalSubjects: number;
  weeklyMinutes: number;
}

export type RecommendationCategory = "focus" | "break" | "subject";

export interface RecommendationItem {
  category: RecommendationCategory;
  message: string;
}
