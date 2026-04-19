import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { localDataSource } from "../services/data/focusFlowDataSource";
import type { DashboardSummary, StudyGoal, StudySession, Subject, UserProfile } from "../types/models";
import { getLast7DaysTotal, isToday } from "../utils/date";

interface FocusFlowDataValue {
  sessions: StudySession[];
  subjects: Subject[];
  profile: UserProfile;
  goals: StudyGoal[];
  addSession: (session: StudySession) => void;
  updateSession: (sessionId: string, patch: Partial<StudySession>) => void;
  setSubjects: (nextSubjects: Subject[]) => void;
  setProfile: (nextProfile: UserProfile) => void;
  setGoals: (nextGoals: StudyGoal[]) => void;
  summary: DashboardSummary;
}

const STORAGE_KEY_PREFIX = "focusflow.";

const FocusFlowDataContext = createContext<FocusFlowDataValue | null>(null);

export const FocusFlowDataProvider = ({ children }: PropsWithChildren) => {
  const [initialData] = useState(() => localDataSource.loadInitialData());
  const [subjects, setSubjectsState] = useState<Subject[]>(initialData.subjects);
  const [sessions, setSessions] = useState<StudySession[]>(initialData.sessions);
  const [profile, setProfileState] = useState<UserProfile>(initialData.profile);
  const [goals, setGoalsState] = useState<StudyGoal[]>(initialData.goals);

  const addSession = (session: StudySession) => {
    const next = localDataSource.saveSession(session);
    setSessions(next);
  };

  const updateSession = (sessionId: string, patch: Partial<StudySession>) => {
    const next = localDataSource.updateSession(sessionId, patch);
    setSessions(next);
  };

  const setSubjects = (nextSubjects: Subject[]) => {
    setSubjectsState(nextSubjects);
    localDataSource.saveSubjects(nextSubjects);
  };

  const setProfile = (nextProfile: UserProfile) => {
    setProfileState(nextProfile);
    localDataSource.saveProfile(nextProfile);
  };

  const setGoals = (nextGoals: StudyGoal[]) => {
    setGoalsState(nextGoals);
    localDataSource.saveGoals(nextGoals);
  };

  const summary: DashboardSummary = useMemo(() => {
    const todayMinutes = sessions
      .filter((session) => isToday(session.endedAt))
      .reduce((sum, session) => sum + session.actualMinutes, 0);

    return {
      todayMinutes,
      totalSessions: sessions.length,
      totalSubjects: subjects.length,
      weeklyMinutes: getLast7DaysTotal(sessions),
    };
  }, [sessions, subjects.length]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key?.startsWith(STORAGE_KEY_PREFIX)) {
        return;
      }

      const next = localDataSource.loadInitialData();
      setSubjectsState(next.subjects);
      setSessions(next.sessions);
      setProfileState(next.profile);
      setGoalsState(next.goals);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value: FocusFlowDataValue = {
    sessions,
    subjects,
    profile,
    goals,
    addSession,
    updateSession,
    setSubjects,
    setProfile,
    setGoals,
    summary,
  };

  return createElement(FocusFlowDataContext.Provider, { value }, children);
};

export const useFocusFlowData = () => {
  const context = useContext(FocusFlowDataContext);

  if (!context) {
    throw new Error("useFocusFlowData must be used within FocusFlowDataProvider.");
  }

  return context;
};
