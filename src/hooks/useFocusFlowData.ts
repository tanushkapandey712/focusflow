import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  isAuthReady: boolean;
  syncError: string | null;
  /** The Supabase auth user ID, or null if not signed in via Supabase. */
  authUserId: string | null;
  addSession: (session: StudySession) => Promise<StudySession>;
  updateSession: (sessionId: string, patch: Partial<StudySession>) => Promise<StudySession>;
  deleteSession: (sessionId: string) => Promise<void>;
  addSubject: (subject: Subject) => Promise<Subject>;
  addUnitToSubject: (subjectId: string, unit: SyllabusUnit) => Promise<SyllabusUnit>;
  addTopicToUnit: (
    subjectId: string,
    unitId: string,
    topic: SyllabusTopic,
  ) => Promise<SyllabusTopic>;
  updateSubject: (subjectId: string, patch: Partial<Subject>) => Promise<Subject>;
  deleteSubject: (subjectId: string) => Promise<void>;
  updateUnitInSubject: (
    subjectId: string,
    unitId: string,
    patch: Partial<SyllabusUnit>,
  ) => Promise<SyllabusUnit>;
  deleteUnitFromSubject: (subjectId: string, unitId: string) => Promise<void>;
  updateTopicInUnit: (
    subjectId: string,
    unitId: string,
    topicId: string,
    patch: Partial<SyllabusTopic>,
  ) => Promise<SyllabusTopic>;
  deleteTopicFromUnit: (subjectId: string, unitId: string, topicId: string) => Promise<void>;
  addGoal: (goal: StudyGoal) => Promise<StudyGoal>;
  updateGoal: (goalId: string, patch: Partial<StudyGoal>) => Promise<StudyGoal>;
  deleteGoal: (goalId: string) => Promise<void>;
  saveReviewedSyllabus: (params: SaveReviewedSyllabusParams) => Promise<void>;
  getSubjectSyllabus: (subjectId: string) => SyllabusUnit[];
  setSubjects: (nextSubjects: Subject[]) => Promise<Subject[]>;
  setProfile: (nextProfile: UserProfile) => Promise<UserProfile>;
  setGoals: (nextGoals: StudyGoal[]) => Promise<StudyGoal[]>;
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
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [showMigration, setShowMigration] = useState(false);
  const authUserIdRef = useRef<string | null>(null);
  const syllabusRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goalsRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionsRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCloudMode = Boolean(authUserId);

  useEffect(() => {
    authUserIdRef.current = authUserId;
  }, [authUserId]);

  // -------------------------------------------------------------------------
  // Auth listener — get user ID when signed in
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthReady(true);
      return;
    }

    const client = getSupabaseClient();
    let isMounted = true;

    client.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;

        if (error) {
          console.error("[FocusFlow] Auth session restore failed:", error);
          setSyncError(error.message);
        }

        const nextUserId = session?.user?.id ?? null;
        setAuthUserId(nextUserId);
        setIsLoading(Boolean(nextUserId));
        setIsAuthReady(true);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;

        const message = error instanceof Error ? error.message : "Unable to restore auth session.";
        console.error("[FocusFlow] Auth session restore failed:", error);
        setSyncError(message);
        setIsLoading(false);
        setIsAuthReady(true);
      });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;

      if (nextUserId) {
        if (authUserIdRef.current !== nextUserId) {
          setIsLoading(true);
        }

        setAuthUserId(nextUserId);
        setIsAuthReady(true);
        return;
      }

      setAuthUserId(nextUserId);
      setIsLoading(false);
      setIsAuthReady(true);
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

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
        const createdProfile = await supabaseService.upsertProfile(userId, {
          ...currentProfile,
          id: userId,
          isAuthenticated: true,
        });
        setProfileState(createdProfile);
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

  const refetchProfileData = useCallback(async (userId: string) => {
    try {
      const cloudProfile = await supabaseService.fetchUserProfile(userId);

      if (cloudProfile) {
        setProfileState(cloudProfile);
      }

      setSyncError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sync profile.";
      console.error("[FocusFlow] Profile realtime refresh failed:", err);
      setSyncError(message);
    }
  }, []);

  const refetchSyllabusData = useCallback(async (userId: string) => {
    try {
      const cloudSubjects = await supabaseService.fetchSubjects(userId);
      setSubjectsState(cloudSubjects);
      setSyncError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sync syllabus data.";
      console.error("[FocusFlow] Syllabus realtime refresh failed:", err);
      setSyncError(message);
    }
  }, []);

  const refetchGoalsData = useCallback(async (userId: string) => {
    try {
      const cloudGoals = await supabaseService.fetchGoals(userId);
      setGoalsState(cloudGoals);
      setSyncError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sync goals.";
      console.error("[FocusFlow] Goals realtime refresh failed:", err);
      setSyncError(message);
    }
  }, []);

  const refetchSessionsData = useCallback(async (userId: string) => {
    try {
      const cloudSessions = await supabaseService.fetchSessions(userId);
      setSessions(cloudSessions);
      setSyncError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sync sessions.";
      console.error("[FocusFlow] Sessions realtime refresh failed:", err);
      setSyncError(message);
    }
  }, []);

  const scheduleSyllabusRefetch = useCallback(
    (userId: string) => {
      if (syllabusRefreshTimeoutRef.current) {
        clearTimeout(syllabusRefreshTimeoutRef.current);
      }

      syllabusRefreshTimeoutRef.current = setTimeout(() => {
        syllabusRefreshTimeoutRef.current = null;
        void refetchSyllabusData(userId);
      }, 250);
    },
    [refetchSyllabusData],
  );

  const scheduleProfileRefetch = useCallback(
    (userId: string) => {
      if (profileRefreshTimeoutRef.current) {
        clearTimeout(profileRefreshTimeoutRef.current);
      }

      profileRefreshTimeoutRef.current = setTimeout(() => {
        profileRefreshTimeoutRef.current = null;
        void refetchProfileData(userId);
      }, 250);
    },
    [refetchProfileData],
  );

  const scheduleGoalsRefetch = useCallback(
    (userId: string) => {
      if (goalsRefreshTimeoutRef.current) {
        clearTimeout(goalsRefreshTimeoutRef.current);
      }

      goalsRefreshTimeoutRef.current = setTimeout(() => {
        goalsRefreshTimeoutRef.current = null;
        void refetchGoalsData(userId);
      }, 250);
    },
    [refetchGoalsData],
  );

  const scheduleSessionsRefetch = useCallback(
    (userId: string) => {
      if (sessionsRefreshTimeoutRef.current) {
        clearTimeout(sessionsRefreshTimeoutRef.current);
      }

      sessionsRefreshTimeoutRef.current = setTimeout(() => {
        sessionsRefreshTimeoutRef.current = null;
        void refetchSessionsData(userId);
      }, 250);
    },
    [refetchSessionsData],
  );

  useEffect(() => {
    if (!authUserId) return;

    // Check for migration prompt first
    if (shouldShowMigrationPrompt()) {
      setIsLoading(false);
      setShowMigration(true);
    } else {
      hydrateFromCloud(authUserId);
    }
  }, [authUserId, hydrateFromCloud]);

  useEffect(() => {
    if (!authUserId || !isSupabaseConfigured) return;

    const client = getSupabaseClient();
    const handleSyllabusChange = () => scheduleSyllabusRefetch(authUserId);
    const handleProfileChange = () => scheduleProfileRefetch(authUserId);
    const handleGoalsChange = () => scheduleGoalsRefetch(authUserId);
    const handleSessionsChange = () => scheduleSessionsRefetch(authUserId);
    const channel = client
      .channel(`focusflow-data-sync-${authUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${authUserId}`,
        },
        handleProfileChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subjects",
          filter: `user_id=eq.${authUserId}`,
        },
        handleSyllabusChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "units",
          filter: `user_id=eq.${authUserId}`,
        },
        handleSyllabusChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "topics",
          filter: `user_id=eq.${authUserId}`,
        },
        handleSyllabusChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
          filter: `user_id=eq.${authUserId}`,
        },
        handleGoalsChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `user_id=eq.${authUserId}`,
        },
        handleSessionsChange,
      )
      .subscribe((status, error) => {
        if (error) {
          const message = error.message || "Realtime data sync failed.";
          console.error("[FocusFlow] Realtime subscription failed:", error);
          setSyncError(message);
        } else if (status === "SUBSCRIBED") {
          setSyncError(null);
        }
      });

    return () => {
      if (syllabusRefreshTimeoutRef.current) {
        clearTimeout(syllabusRefreshTimeoutRef.current);
        syllabusRefreshTimeoutRef.current = null;
      }
      if (goalsRefreshTimeoutRef.current) {
        clearTimeout(goalsRefreshTimeoutRef.current);
        goalsRefreshTimeoutRef.current = null;
      }
      if (sessionsRefreshTimeoutRef.current) {
        clearTimeout(sessionsRefreshTimeoutRef.current);
        sessionsRefreshTimeoutRef.current = null;
      }
      if (profileRefreshTimeoutRef.current) {
        clearTimeout(profileRefreshTimeoutRef.current);
        profileRefreshTimeoutRef.current = null;
      }
      void client.removeChannel(channel);
    };
  }, [
    authUserId,
    scheduleGoalsRefetch,
    scheduleProfileRefetch,
    scheduleSessionsRefetch,
    scheduleSyllabusRefetch,
  ]);

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
  // CRUD operations
  // -------------------------------------------------------------------------
  const addSession = useCallback(
    async (session: StudySession) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const createdSession = await supabaseService.createSession(sessionUserId, session);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSessions((prev) => [
            createdSession,
            ...prev.filter((item) => item.id !== createdSession.id),
          ]);
          return createdSession;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to create session in Supabase.";
          console.error("[FocusFlow] Session create failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextSessions = localDataSource.saveSession(session);
        setSessions(nextSessions);
        setSyncError(null);
        return session;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Session create blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email],
  );

  const updateSession = useCallback(
    async (sessionId: string, patch: Partial<StudySession>) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const updatedSession = await supabaseService.updateSession(sessionUserId, sessionId, patch);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSessions((prev) =>
            prev.map((session) => (session.id === sessionId ? updatedSession : session)),
          );
          return updatedSession;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to update session in Supabase.";
          console.error("[FocusFlow] Session update failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextSessions = localDataSource.updateSession(sessionId, patch);
        const updatedSession = nextSessions.find((session) => session.id === sessionId);

        if (!updatedSession) {
          throw new Error("Session not found.");
        }

        setSessions(nextSessions);
        setSyncError(null);
        return updatedSession;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Session update blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          await supabaseService.deleteSession(sessionUserId, sessionId);
          const cloudSessions = await supabaseService.fetchSessions(sessionUserId);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSessions(cloudSessions);
          return;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to delete session in Supabase.";
          console.error("[FocusFlow] Session delete failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextSessions = sessions.filter((session) => session.id !== sessionId);
        localDataSource.saveSessions(nextSessions);
        setSessions(nextSessions);
        setSyncError(null);
        return;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Session delete blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email, sessions],
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
    async (subjectId: string, patch: Partial<Subject>) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const updatedSubject = await supabaseService.updateSubject(sessionUserId, subjectId, patch);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState((prev) =>
            prev.map((subject) => (subject.id === subjectId ? updatedSubject : subject)),
          );
          return updatedSubject;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to update subject in Supabase.";
          console.error("[FocusFlow] Subject update failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextSubjects = localDataSource.updateSubject(subjectId, patch);
        const updatedSubject = nextSubjects.find((subject) => subject.id === subjectId);

        if (!updatedSubject) {
          throw new Error("Subject not found.");
        }

        setSubjectsState(nextSubjects);
        setSyncError(null);
        return updatedSubject;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Subject update blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email],
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
    async (subjectId: string) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          await supabaseService.deleteSubject(sessionUserId, subjectId);
          const cloudSubjects = await supabaseService.fetchSubjects(sessionUserId);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState(cloudSubjects);
          return;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to delete subject in Supabase.";
          console.error("[FocusFlow] Subject delete failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const current = localDataSource.loadInitialData().subjects;
        const nextSubjects = current.filter((subject) => subject.id !== subjectId);
        localDataSource.saveSubjects(nextSubjects);
        setSubjectsState(nextSubjects);
        setSyncError(null);
        return;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Subject delete blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email],
  );

  const updateUnitInSubject = useCallback(
    async (subjectId: string, unitId: string, patch: Partial<SyllabusUnit>) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const updatedUnit = await supabaseService.updateUnit(sessionUserId, unitId, patch);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState((prev) =>
            prev.map((subject) =>
              subject.id === subjectId
                ? {
                    ...subject,
                    syllabusUnits: subject.syllabusUnits.map((unit) =>
                      unit.id === unitId ? updatedUnit : unit,
                    ),
                  }
                : subject,
            ),
          );
          return updatedUnit;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to update unit in Supabase.";
          console.error("[FocusFlow] Unit update failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const subject = subjects.find((item) => item.id === subjectId);
        const updatedUnit = subject?.syllabusUnits.find((unit) => unit.id === unitId);

        if (!subject || !updatedUnit) {
          throw new Error("Unit not found.");
        }

        const nextUnits = subject.syllabusUnits.map((unit) =>
          unit.id === unitId ? { ...unit, ...patch } : unit,
        );
        const nextSubjects = localDataSource.updateSubject(subjectId, { syllabusUnits: nextUnits });
        const savedUnit = nextUnits.find((unit) => unit.id === unitId);

        if (!savedUnit) {
          throw new Error("Unit not found.");
        }

        setSubjectsState(nextSubjects);
        setSyncError(null);
        return savedUnit;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Unit update blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email, subjects],
  );

  const deleteUnitFromSubject = useCallback(
    async (subjectId: string, unitId: string) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          await supabaseService.deleteUnit(sessionUserId, unitId);
          const cloudSubjects = await supabaseService.fetchSubjects(sessionUserId);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState(cloudSubjects);
          return;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to delete unit in Supabase.";
          console.error("[FocusFlow] Unit delete failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const subject = subjects.find((item) => item.id === subjectId);

        if (!subject) {
          throw new Error("Subject not found.");
        }

        const nextUnits = subject.syllabusUnits.filter((unit) => unit.id !== unitId);
        const nextSubjects = localDataSource.updateSubject(subjectId, { syllabusUnits: nextUnits });
        setSubjectsState(nextSubjects);
        setSyncError(null);
        return;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Unit delete blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email, subjects],
  );

  const updateTopicInUnit = useCallback(
    async (
      subjectId: string,
      unitId: string,
      topicId: string,
      patch: Partial<SyllabusTopic>,
    ) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const updatedTopic = await supabaseService.updateTopic(sessionUserId, topicId, patch);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState((prev) =>
            prev.map((subject) =>
              subject.id === subjectId
                ? {
                    ...subject,
                    syllabusUnits: subject.syllabusUnits.map((unit) =>
                      unit.id === unitId
                        ? {
                            ...unit,
                            topics: unit.topics.map((topic) =>
                              topic.id === topicId ? updatedTopic : topic,
                            ),
                          }
                        : unit,
                    ),
                  }
                : subject,
            ),
          );
          return updatedTopic;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to update topic in Supabase.";
          console.error("[FocusFlow] Topic update failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const subject = subjects.find((item) => item.id === subjectId);
        const unit = subject?.syllabusUnits.find((item) => item.id === unitId);

        if (!subject || !unit) {
          throw new Error("Unit not found.");
        }

        const nextUnits = subject.syllabusUnits.map((entry) =>
          entry.id === unitId
            ? {
                ...entry,
                topics: entry.topics.map((topic) =>
                  topic.id === topicId ? { ...topic, ...patch } : topic,
                ),
              }
            : entry,
        );
        const nextSubjects = localDataSource.updateSubject(subjectId, { syllabusUnits: nextUnits });
        const updatedTopic = nextUnits
          .find((entry) => entry.id === unitId)
          ?.topics.find((topic) => topic.id === topicId);

        if (!updatedTopic) {
          throw new Error("Topic not found.");
        }

        setSubjectsState(nextSubjects);
        setSyncError(null);
        return updatedTopic;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Topic update blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email, subjects],
  );

  const deleteTopicFromUnit = useCallback(
    async (subjectId: string, unitId: string, topicId: string) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          await supabaseService.deleteTopic(sessionUserId, topicId);
          const cloudSubjects = await supabaseService.fetchSubjects(sessionUserId);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState(cloudSubjects);
          return;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to delete topic in Supabase.";
          console.error("[FocusFlow] Topic delete failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const subject = subjects.find((item) => item.id === subjectId);

        if (!subject) {
          throw new Error("Subject not found.");
        }

        const nextUnits = subject.syllabusUnits.map((entry) =>
          entry.id === unitId
            ? { ...entry, topics: entry.topics.filter((topic) => topic.id !== topicId) }
            : entry,
        );
        const nextSubjects = localDataSource.updateSubject(subjectId, { syllabusUnits: nextUnits });
        setSubjectsState(nextSubjects);
        setSyncError(null);
        return;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Topic delete blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email, subjects],
  );

  const addGoal = useCallback(
    async (goal: StudyGoal) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const createdGoal = await supabaseService.createGoal(sessionUserId, goal);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setGoalsState((prev) => [...prev.filter((item) => item.id !== createdGoal.id), createdGoal]);
          return createdGoal;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to create goal in Supabase.";
          console.error("[FocusFlow] Goal create failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextGoals = [...goals, goal];
        setGoalsState(nextGoals);
        setSyncError(null);
        localDataSource.saveGoals(nextGoals);
        return goal;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Goal create blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, goals, profile.email],
  );

  const updateGoal = useCallback(
    async (goalId: string, patch: Partial<StudyGoal>) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const updatedGoal = await supabaseService.updateGoal(sessionUserId, goalId, patch);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setGoalsState((prev) =>
            prev.map((goal) => (goal.id === goalId ? updatedGoal : goal)),
          );
          return updatedGoal;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to update goal in Supabase.";
          console.error("[FocusFlow] Goal update failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextGoals = goals.map((goal) =>
          goal.id === goalId ? { ...goal, ...patch } : goal,
        );
        const updatedGoal = nextGoals.find((goal) => goal.id === goalId);

        if (!updatedGoal) {
          throw new Error("Goal not found.");
        }

        setGoalsState(nextGoals);
        setSyncError(null);
        localDataSource.saveGoals(nextGoals);
        return updatedGoal;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Goal update blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, goals, profile.email],
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          await supabaseService.deleteGoal(sessionUserId, goalId);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setGoalsState((prev) => prev.filter((goal) => goal.id !== goalId));
          return;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to delete goal in Supabase.";
          console.error("[FocusFlow] Goal delete failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        const nextGoals = goals.filter((goal) => goal.id !== goalId);
        setGoalsState(nextGoals);
        setSyncError(null);
        localDataSource.saveGoals(nextGoals);
        return;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Goal delete blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, goals, profile.email],
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
    async (nextSubjects: Subject[]) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          for (const subject of nextSubjects) {
            await supabaseService.updateSubject(sessionUserId, subject.id, subject);
          }

          const cloudSubjects = await supabaseService.fetchSubjects(sessionUserId);
          setAuthUserId(sessionUserId);
          setSyncError(null);
          setSubjectsState(cloudSubjects);
          return cloudSubjects;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to save subjects in Supabase.";
          console.error("[FocusFlow] Subjects bulk save failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        localDataSource.saveSubjects(nextSubjects);
        setSubjectsState(nextSubjects);
        setSyncError(null);
        return nextSubjects;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Subjects bulk save blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email],
  );

  const setProfile = useCallback(
    async (nextProfile: UserProfile) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const savedProfile = await supabaseService.upsertProfile(sessionUserId, {
            ...nextProfile,
            id: sessionUserId,
            isAuthenticated: true,
          });
          setAuthUserId(sessionUserId);
          setProfileState(savedProfile);
          setSyncError(null);
          return savedProfile;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to save profile in Supabase.";
          console.error("[FocusFlow] Profile save failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !nextProfile.email || nextProfile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        setProfileState(nextProfile);
        setSyncError(null);
        localDataSource.saveProfile(nextProfile);
        return nextProfile;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Profile save blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId],
  );

  const setGoals = useCallback(
    async (nextGoals: StudyGoal[]) => {
      const sessionUserId = await getSessionUserId();

      if (sessionUserId) {
        try {
          const savedGoals = await supabaseService.saveAllGoals(sessionUserId, nextGoals);
          setAuthUserId(sessionUserId);
          setGoalsState(savedGoals);
          setSyncError(null);
          return savedGoals;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to save goals in Supabase.";
          console.error("[FocusFlow] Goals bulk save failed:", err);
          setSyncError(message);
          throw err instanceof Error ? err : new Error(message);
        }
      }

      const isGuestMode = !profile.email || profile.email === "guest@focusflow.app";
      if (!isSupabaseConfigured || isGuestMode) {
        localDataSource.saveGoals(nextGoals);
        setGoalsState(nextGoals);
        setSyncError(null);
        return nextGoals;
      }

      const authError = new Error("User not signed in.");
      console.error("[FocusFlow] Goals bulk save blocked: no Supabase session found.");
      setSyncError(authError.message);
      throw authError;
    },
    [getSessionUserId, profile.email],
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
    isAuthReady,
    syncError,
    authUserId,
    addSession,
    updateSession,
    deleteSession,
    addSubject,
    addUnitToSubject,
    addTopicToUnit,
    updateSubject,
    deleteSubject,
    updateUnitInSubject,
    deleteUnitFromSubject,
    updateTopicInUnit,
    deleteTopicFromUnit,
    addGoal,
    updateGoal,
    deleteGoal,
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
