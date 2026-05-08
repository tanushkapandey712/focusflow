import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { localDataSource } from "../services/data/focusFlowDataSource";
import { getSupabaseClient, isSupabaseConfigured } from "../services/data/supabaseClient";
import * as supabaseService from "../services/data/supabaseDataService";
import {
  shouldShowMigrationPrompt,
} from "../services/data/dataMigration";
import { MigrationPrompt } from "../components/sync/MigrationPrompt";
import type {
  DashboardSummary,
  StudyGoal,
  StudySession,
  Subject,
  SyllabusUnit,
  UserProfile,
} from "../types/models";
import { getLast7DaysTotal, isToday } from "../utils/date";
import {
  getSubjectSyllabus as getSubjectSyllabusFromSubjects,
  type SaveReviewedSyllabusParams,
  saveReviewedSyllabusToSubjects,
} from "../utils/syllabusPersistence";

interface FocusFlowDataValue {
  sessions: StudySession[];
  subjects: Subject[];
  profile: UserProfile;
  goals: StudyGoal[];
  isLoading: boolean;
  syncError: string | null;
  /** The Supabase auth user ID, or null if not signed in via Supabase. */
  authUserId: string | null;
  addSession: (session: StudySession) => void;
  updateSession: (sessionId: string, patch: Partial<StudySession>) => void;
  addSubject: (subject: Subject) => void;
  updateSubject: (subjectId: string, patch: Partial<Subject>) => void;
  deleteSubject: (subjectId: string) => void;
  saveReviewedSyllabus: (params: SaveReviewedSyllabusParams) => void;
  getSubjectSyllabus: (subjectId: string) => SyllabusUnit[];
  setSubjects: (nextSubjects: Subject[]) => void;
  setProfile: (nextProfile: UserProfile) => void;
  setGoals: (nextGoals: StudyGoal[]) => void;
  summary: DashboardSummary;
  refreshFromCloud: () => Promise<void>;
}

const STORAGE_KEY_PREFIX = "focusflow.";

const FocusFlowDataContext = createContext<FocusFlowDataValue | null>(null);

export const FocusFlowDataProvider = ({ children }: PropsWithChildren) => {
  // Local data as initial fallback (instant render)
  const [initialData] = useState(() => localDataSource.loadInitialData());
  const [subjects, setSubjectsState] = useState<Subject[]>(initialData.subjects);
  const [sessions, setSessions] = useState<StudySession[]>(initialData.sessions);
  const [profile, setProfileState] = useState<UserProfile>(initialData.profile);
  const [goals, setGoalsState] = useState<StudyGoal[]>(initialData.goals);

  // Sync state
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [showMigration, setShowMigration] = useState(false);

  const isCloudMode = Boolean(authUserId);

  // -------------------------------------------------------------------------
  // Auth listener — get user ID when signed in
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const client = getSupabaseClient();

    // Check current session
    client.auth.getUser().then(({ data: { user } }) => {
      setAuthUserId(user?.id ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      setAuthUserId(nextUserId);
      if (!nextUserId) {
        // Logged out — reset to defaults but keep localStorage data
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // -------------------------------------------------------------------------
  // Hydrate from Supabase when user signs in
  // -------------------------------------------------------------------------
  const hydrateFromCloud = useCallback(async (userId: string) => {
    setIsLoading(true);
    setSyncError(null);

    try {
      const [cloudProfile, cloudSubjects, cloudSessions, cloudGoals] = await Promise.all([
        supabaseService.fetchUserProfile(userId),
        supabaseService.fetchSubjects(userId),
        supabaseService.fetchSessions(userId),
        supabaseService.fetchGoals(userId),
      ]);

      if (cloudProfile) {
        setProfileState(cloudProfile);
        // Also save to localStorage for offline fallback
        localDataSource.saveProfile(cloudProfile);
      } else {
        // First-time user — create profile in Supabase from current local profile
        const currentProfile = localDataSource.loadInitialData().profile;
        await supabaseService.upsertProfile(userId, {
          ...currentProfile,
          id: userId,
          isAuthenticated: true,
        });
      }

      setSubjectsState(cloudSubjects);
      setSessions(cloudSessions);
      setGoalsState(cloudGoals);

      // Cache in localStorage for offline access
      localDataSource.saveSubjects(cloudSubjects);
      localDataSource.saveGoals(cloudGoals);


    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load your data.";
      setSyncError(message);
      console.error("[FocusFlow] Cloud hydration failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authUserId) return;

    // Check for migration prompt first
    if (shouldShowMigrationPrompt()) {
      setShowMigration(true);
    } else {
      hydrateFromCloud(authUserId);
    }
  }, [authUserId, hydrateFromCloud]);

  const refreshFromCloud = useCallback(async () => {
    if (authUserId) {
      await hydrateFromCloud(authUserId);
    }
  }, [authUserId, hydrateFromCloud]);

  // -------------------------------------------------------------------------
  // Background sync helper — wraps Supabase calls with error handling
  // -------------------------------------------------------------------------
  const syncToCloud = useCallback(
    async (operation: (userId: string) => Promise<void>) => {
      if (!authUserId) return;
      try {
        await operation(authUserId);
      } catch (err) {
        console.error("[FocusFlow] Sync error:", err);
        setSyncError(err instanceof Error ? err.message : "Sync failed.");
      }
    },
    [authUserId],
  );

  // -------------------------------------------------------------------------
  // CRUD operations — update local state first (optimistic), then sync to cloud
  // -------------------------------------------------------------------------
  const addSession = useCallback(
    (session: StudySession) => {
      // Local update
      const next = localDataSource.saveSession(session);
      setSessions(next);
      // Cloud sync
      syncToCloud((userId) => supabaseService.createSession(userId, session));
    },
    [syncToCloud],
  );

  const updateSession = useCallback(
    (sessionId: string, patch: Partial<StudySession>) => {
      const next = localDataSource.updateSession(sessionId, patch);
      setSessions(next);
      syncToCloud((userId) => supabaseService.updateSession(userId, sessionId, patch));
    },
    [syncToCloud],
  );

  const addSubject = useCallback(
    (subject: Subject) => {
      const next = localDataSource.addSubject(subject);
      setSubjectsState(next);
      syncToCloud((userId) => supabaseService.createSubject(userId, subject));
    },
    [syncToCloud],
  );

  const updateSubject = useCallback(
    (subjectId: string, patch: Partial<Subject>) => {
      const next = localDataSource.updateSubject(subjectId, patch);
      setSubjectsState(next);
      syncToCloud((userId) => supabaseService.updateSubject(userId, subjectId, patch));
    },
    [syncToCloud],
  );

  const deleteSubject = useCallback(
    (subjectId: string) => {
      const current = localDataSource.loadInitialData().subjects;
      const next = current.filter((s) => s.id !== subjectId);
      localDataSource.saveSubjects(next);
      setSubjectsState(next);
      syncToCloud((userId) => supabaseService.deleteSubject(userId, subjectId));
    },
    [syncToCloud],
  );

  const saveReviewedSyllabus = useCallback(
    (params: SaveReviewedSyllabusParams) => {
      const next = localDataSource.saveReviewedSyllabus(params);
      setSubjectsState(next);
      // Sync the affected subject to cloud
      syncToCloud(async (userId) => {
        const { subjects: updatedSubjects } = saveReviewedSyllabusToSubjects(next, params);
        // Find the affected subject and sync it
        const affectedId = params.subjectId;
        if (affectedId) {
          const affected = updatedSubjects.find((s) => s.id === affectedId);
          if (affected) await supabaseService.saveSubjectSyllabus(userId, affected);
        } else {
          // New subject was created — sync all
          for (const s of updatedSubjects) {
            await supabaseService.createSubject(userId, s);
          }
        }
      });
    },
    [syncToCloud],
  );

  const getSubjectSyllabus = useCallback(
    (subjectId: string) => getSubjectSyllabusFromSubjects(subjects, subjectId),
    [subjects],
  );

  const setSubjects = useCallback(
    (nextSubjects: Subject[]) => {
      setSubjectsState(nextSubjects);
      localDataSource.saveSubjects(nextSubjects);
      // Full sync — save each subject to cloud
      syncToCloud(async (userId) => {
        for (const subject of nextSubjects) {
          await supabaseService.createSubject(userId, subject);
        }
      });
    },
    [syncToCloud],
  );

  const setProfile = useCallback(
    (nextProfile: UserProfile) => {
      setProfileState(nextProfile);
      localDataSource.saveProfile(nextProfile);
      syncToCloud((userId) => supabaseService.upsertProfile(userId, nextProfile));
    },
    [syncToCloud],
  );

  const setGoals = useCallback(
    (nextGoals: StudyGoal[]) => {
      setGoalsState(nextGoals);
      localDataSource.saveGoals(nextGoals);
      syncToCloud((userId) => supabaseService.saveAllGoals(userId, nextGoals));
    },
    [syncToCloud],
  );

  // -------------------------------------------------------------------------
  // Dashboard summary (unchanged)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Cross-tab sync via storage events (local mode)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isCloudMode) return; // Cloud mode doesn't need storage events

    const handleStorage = (event: StorageEvent) => {
      if (!event.key?.startsWith(STORAGE_KEY_PREFIX)) return;

      const next = localDataSource.loadInitialData();
      setSubjectsState(next.subjects);
      setSessions(next.sessions);
      setProfileState(next.profile);
      setGoalsState(next.goals);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isCloudMode]);

  // -------------------------------------------------------------------------
  // Migration prompt handlers
  // -------------------------------------------------------------------------
  const handleMigrationComplete = useCallback(() => {
    setShowMigration(false);
    if (authUserId) hydrateFromCloud(authUserId);
  }, [authUserId, hydrateFromCloud]);

  const handleMigrationDismiss = useCallback(() => {
    setShowMigration(false);
    if (authUserId) hydrateFromCloud(authUserId);
  }, [authUserId, hydrateFromCloud]);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value: FocusFlowDataValue = {
    sessions,
    subjects,
    profile,
    goals,
    isLoading,
    syncError,
    authUserId,
    addSession,
    updateSession,
    addSubject,
    updateSubject,
    deleteSubject,
    saveReviewedSyllabus,
    getSubjectSyllabus,
    setSubjects,
    setProfile,
    setGoals,
    summary,
    refreshFromCloud,
  };

  return createElement(
    FocusFlowDataContext.Provider,
    { value },
    children,
    showMigration && authUserId
      ? createElement(MigrationPrompt, {
          userId: authUserId,
          onComplete: handleMigrationComplete,
          onDismiss: handleMigrationDismiss,
        })
      : null,
  );
};

export const useFocusFlowData = () => {
  const context = useContext(FocusFlowDataContext);

  if (!context) {
    throw new Error("useFocusFlowData must be used within FocusFlowDataProvider.");
  }

  return context;
};
