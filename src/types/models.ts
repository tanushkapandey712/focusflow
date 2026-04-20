import type { FocusTrackingSessionSummary } from "./focusTracking";

export type SyllabusTopicStatus = "not_started" | "in_progress" | "completed";

export interface SyllabusTopic {
  id: string;
  title: string;
  status: SyllabusTopicStatus;
  studiedMinutes: number;
  studySessionsCount: number;
  lastStudiedAt?: string;
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
  examDate?: string;
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

export interface StudySessionSyllabusLink {
  unitId: string;
  unitTitle: string;
  topicId: string;
  topicTitle: string;
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
  syllabusTopic?: StudySessionSyllabusLink;
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
