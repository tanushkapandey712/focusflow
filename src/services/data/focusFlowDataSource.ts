import type { StudyGoal, StudySession, Subject, UserProfile } from "../../types/models";
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
  saveProfile: (profile: UserProfile) => void;
  saveGoals: (goals: StudyGoal[]) => void;
  saveSubjects: (subjects: Subject[]) => void;
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
  saveProfile: (profile) => focusFlowStorage.saveProfile(profile),
  saveGoals: (goals) => focusFlowStorage.saveGoals(goals),
  saveSubjects: (subjects) => focusFlowStorage.saveSubjects(subjects),
};
