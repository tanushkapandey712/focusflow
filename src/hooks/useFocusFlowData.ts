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
  SyllabusTopic,
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
  addSubject: (subject: Subject) => Promise<Subject>;
  addUnitToSubject: (subjectId: string, unit: SyllabusUnit) => Promise<SyllabusUnit>;
  addTopicToUnit: (
    subjectId: string,
    unitId: string,
    topic: SyllabusTopic,
  ) => Promise<SyllabusTopic>;
  updateSubject: (subjectId: string, patch: Partial<Subject>) => void;
  deleteSubject: (subjectId: string) => void;
  saveReviewedSyllabus: (params: SaveReviewedSyllabusParams) => Promise<void>;
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
        // Logged out — explicitly reset to an unauthenticated state
        const emptyData = localDataSource.loadInitialData();
        // Keep the guest email out so it fails the RequireSignedIn check
        setProfileState({
          ...emptyData.profile,
          isAuthenticated: false,
          email: undefined
        });
        setSubjectsState([]);
        setSessions([]);
        setGoalsState([]);
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
      } else {
        // First-time user — create profile in Supabase from current local profile
        const currentProfile = localDataSource.loadInitialData().profile;
        await supabaseService.upsertProfile(userId, {
          ...currentProfile,
          id: userId,
          isAuthenticated: true,
        });
        setProfileState({
          ...currentProfile,
          id: userId,
          isAuthenticated: true,
        });
      }

      setSubjectsState(cloudSubjects);
      setSessions(cloudSessions);
      setGoalsState(cloudGoals);
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

    // Subscribe to realtime changes for multi-device sync
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      const channel = client
        .channel(`user-data-sync-${authUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            filter: `user_id=eq.${authUserId}`,
          },
          () => {
            // Refetch data when a mutation occurs on another device
            hydrateFromCloud(authUserId);
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [authUserId, hydrateFromCloud]);

  const refreshFromCloud = useCallback(async () => {
    if (authUserId) {
      await hydrateFromCloud(authUserId);
    }
  }, [authUserId, hydrateFromCloud]);

  const getSessionUserId = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return null;
    }

    const {
      data: { session },
      error,
    } = await getSupabaseClient().auth.getSession();

    if (error) {
      throw error;
    }

    return session?.user?.id ?? null;
  }, []);

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
      setSessions((prev) => [...prev, session]);
      if (authUserId) {
        syncToCloud((userId) => supabaseService.createSession(userId, session));
      } else {
        localDataSource.saveSession(session);
      }
    },
    [authUserId, syncToCloud],
  );

  const updateSession = useCallback(
    (sessionId: string, patch: Partial<StudySession>) => {
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)));
      if (authUserId) {
        syncToCloud((userId) => supabaseService.updateSession(userId, sessionId, patch));
      } else {
        localDataSource.updateSession(sessionId, patch);
      }
    },
    [authUserId, syncToCloud],
  );

  const addSubject = useCallback(
    async (subject: Subject) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const createdSubject = await supabaseService.createSubject(sessionUserId, subject);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState((prev) => [createdSubject, ...prev.filter((s) => s.id !== createdSubject.id)]);
          return createdSubject;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to create subject in Supabase.";
          console.error("[FocusFlow] Subject create failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        setSubjectsState((prev) => [...prev, subject]);
        setSyncError(null);
        localDataSource.addSubject(subject);
        return subject;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Subject create blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email],
  );

  const updateSubject = useCallback(
    (subjectId: string, patch: Partial<Subject>) => {
      setSubjectsState((prev) => prev.map((s) => (s.id === subjectId ? { ...s, ...patch } : s)));
      if (authUserId) {
        syncToCloud((userId) => supabaseService.updateSubject(userId, subjectId, patch));
      } else {
        localDataSource.updateSubject(subjectId, patch);
      }
    },
    [authUserId, syncToCloud],
  );

  const addUnitToSubject = useCallback(
    async (subjectId: string, unit: SyllabusUnit) => {
      const subject = subjects.find((item) => item.id === subjectId);

      if (!subject) {
        throw new Error("Subject not found.");
      }

      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const createdUnit = await supabaseService.createUnit(
            sessionUserId,
            subjectId,
            unit,
            subject.syllabusUnits.length,
          );

          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState((prev) =>
            prev.map((item) =>
              item.id === subjectId
                ? { ...item, syllabusUnits: [...item.syllabusUnits, createdUnit] }
                : item,
            ),
          );

          return createdUnit;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to create unit in Supabase.";
          console.error("[FocusFlow] Unit create failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextUnits = [...subject.syllabusUnits, unit];
        setSyncError(null);
        setSubjectsState((prev) =>
          prev.map((item) => (item.id === subjectId ? { ...item, syllabusUnits: nextUnits } : item)),
        );
        localDataSource.updateSubject(subjectId, { syllabusUnits: nextUnits });
        return unit;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Unit create blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email, subjects],
  );

  const addTopicToUnit = useCallback(
    async (subjectId: string, unitId: string, topic: SyllabusTopic) => {
      const subject = subjects.find((item) => item.id === subjectId);
      const unit = subject?.syllabusUnits.find((item) => item.id === unitId);

      if (!subject || !unit) {
        throw new Error("Unit not found.");
      }

      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const createdTopic = await supabaseService.createTopic(
            sessionUserId,
            unitId,
            topic,
            unit.topics.length,
          );

          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState((prev) =>
            prev.map((item) =>
              item.id === subjectId
                ? {
                    ...item,
                    syllabusUnits: item.syllabusUnits.map((entry) =>
                      entry.id === unitId
                        ? { ...entry, topics: [...entry.topics, createdTopic] }
                        : entry,
                    ),
                  }
                : item,
            ),
          );

          return createdTopic;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to create topic in Supabase.";
          console.error("[FocusFlow] Topic create failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextUnits = subject.syllabusUnits.map((entry) =>
          entry.id === unitId ? { ...entry, topics: [...entry.topics, topic] } : entry,
        );
        setSyncError(null);
        setSubjectsState((prev) =>
          prev.map((item) => (item.id === subjectId ? { ...item, syllabusUnits: nextUnits } : item)),
        );
        localDataSource.updateSubject(subjectId, { syllabusUnits: nextUnits });
        return topic;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Topic create blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email, subjects],
  );

  const deleteSubject = useCallback(
    (subjectId: string) => {
      setSubjectsState((prev) => prev.filter((s) => s.id !== subjectId));
      if (authUserId) {
        syncToCloud((userId) => supabaseService.deleteSubject(userId, subjectId));
      } else {
        const current = localDataSource.loadInitialData().subjects;
        const next = current.filter((s) => s.id !== subjectId);
        localDataSource.saveSubjects(next);
      }
    },
    [authUserId, syncToCloud],
  );

  const saveReviewedSyllabus = useCallback(
    async (params: SaveReviewedSyllabusParams) => {
      const { subjects: updatedSubjects, savedSubjectId } = saveReviewedSyllabusToSubjects(
        subjects,
        params,
      );

      const affected = savedSubjectId
        ? updatedSubjects.find((subject) => subject.id === savedSubjectId)
        : undefined;
      const sessionUserId = await getSessionUserId();

      if (!affected) {
        setSyncError(null);
        if (!isSupabaseConfigured || !profile.email || profile.email === "guest@focusflow.app") {
          localDataSource.saveReviewedSyllabus(params);
        }
        return;
      }

      if (sessionUserId && affected) {
        const existingSubject = subjects.find((subject) => subject.id === affected.id);

        try {
          if (existingSubject) {
            const existingUnitIds = new Set(existingSubject.syllabusUnits.map((unit) => unit.id));
            const newUnits = affected.syllabusUnits.filter((unit) => !existingUnitIds.has(unit.id));
            const createdUnits = await supabaseService.createUnitsWithTopics(
              sessionUserId,
              affected.id,
              newUnits,
              existingSubject.syllabusUnits.length,
            );
            const createdUnitsByDraftId = new Map(
              newUnits.map((unit, index) => [unit.id, createdUnits[index]] as const),
            );

            setSubjectsState((prev) =>
              prev.map((subject) =>
                subject.id === affected.id
                  ? {
                      ...subject,
                      syllabusUnits: affected.syllabusUnits.map(
                        (unit) => createdUnitsByDraftId.get(unit.id) ?? unit,
                      ),
                    }
                  : subject,
              ),
            );
          } else {
            const createdSubject = await supabaseService.createSubject(sessionUserId, affected);
            setSubjectsState((prev) =>
              [createdSubject, ...prev.filter((subject) => subject.id !== affected.id)],
            );
          }

          setAuthUserId(sessionUserId);
          setSyncError(null);
          return;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to save your syllabus to Supabase.";
          console.error("[FocusFlow] Syllabus save failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      if (!isSupabaseConfigured || !profile.email || profile.email === "guest@focusflow.app") {
        setSubjectsState(updatedSubjects);
        setSyncError(null);
        localDataSource.saveReviewedSyllabus(params);
        return;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Syllabus save blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email, subjects],
  );

  const getSubjectSyllabus = useCallback(
    (subjectId: string) => getSubjectSyllabusFromSubjects(subjects, subjectId),
    [subjects],
  );

  const setSubjects = useCallback(
    (nextSubjects: Subject[]) => {
      setSubjectsState(nextSubjects);
      if (authUserId) {
        syncToCloud(async (userId) => {
          for (const subject of nextSubjects) {
            await supabaseService.updateSubject(userId, subject.id, subject);
            await supabaseService.saveSubjectSyllabus(userId, subject);
          }
        });
      } else {
        localDataSource.saveSubjects(nextSubjects);
      }
    },
    [authUserId, syncToCloud],
  );

  const setProfile = useCallback(
    (nextProfile: UserProfile) => {
      setProfileState(nextProfile);
      if (authUserId) {
        syncToCloud((userId) => supabaseService.upsertProfile(userId, nextProfile));
      } else {
        localDataSource.saveProfile(nextProfile);
      }
    },
    [authUserId, syncToCloud],
  );

  const setGoals = useCallback(
    (nextGoals: StudyGoal[]) => {
      setGoalsState(nextGoals);
      if (authUserId) {
        syncToCloud((userId) => supabaseService.saveAllGoals(userId, nextGoals));
      } else {
        localDataSource.saveGoals(nextGoals);
      }
    },
    [authUserId, syncToCloud],
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
    addUnitToSubject,
    addTopicToUnit,
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
