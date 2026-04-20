import type { StudyGoal, StudySession, Subject, SyllabusUnit, UserProfile } from "../../types/models";
import type { SaveReviewedSyllabusParams } from "../../utils/syllabusPersistence";
import { focusFlowStorage } from "../storage/focusFlowStorage";

export interface FocusFlowDataSource {
  loadInitialData: () => {
    sessions: StudySession[];
    subjects: Subject[];
    profile: UserProfile;
    goals: StudyGoal[];
  };
  saveSession: (session: StudySession) => StudySession[];
  updateSession: (sessionId: string, patch: Partial<StudySession>) => StudySession[];
  getSubjectSyllabus: (subjectId: string) => SyllabusUnit[];
  saveProfile: (profile: UserProfile) => void;
  saveGoals: (goals: StudyGoal[]) => void;
  saveSubjects: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => Subject[];
  updateSubject: (subjectId: string, patch: Partial<Subject>) => Subject[];
  saveReviewedSyllabus: (params: SaveReviewedSyllabusParams) => Subject[];
}

// Swap this implementation with an API-backed source in future.
export const localDataSource: FocusFlowDataSource = {
  loadInitialData: () => ({
    sessions: focusFlowStorage.getSessions(),
    subjects: focusFlowStorage.getSubjects(),
    profile: focusFlowStorage.getProfile(),
    goals: focusFlowStorage.getGoals(),
  }),
  saveSession: (session) => focusFlowStorage.saveSession(session),
  updateSession: (sessionId, patch) => focusFlowStorage.updateSession(sessionId, patch),
  getSubjectSyllabus: (subjectId) => focusFlowStorage.getSubjectSyllabus(subjectId),
  saveProfile: (profile) => focusFlowStorage.saveProfile(profile),
  saveGoals: (goals) => focusFlowStorage.saveGoals(goals),
  saveSubjects: (subjects) => focusFlowStorage.saveSubjects(subjects),
  addSubject: (subject) => focusFlowStorage.addSubject(subject),
  updateSubject: (subjectId, patch) => focusFlowStorage.updateSubject(subjectId, patch),
  saveReviewedSyllabus: (params) => focusFlowStorage.saveReviewedSyllabus(params),
};
