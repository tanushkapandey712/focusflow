/**
 * Supabase Data Service — all CRUD operations for FocusFlow data.
 *
 * Every function requires a `userId` (from Supabase Auth) so RLS can
 * verify ownership. Data is stored in flat relational tables and
 * assembled/decomposed to match the app's nested model interfaces.
 */
import type {
  StudyGoal,
  StudySession,
  Subject,
  SyllabusTopic,
  SyllabusUnit,
  UserProfile,
  RoutinePreferences,
} from "../../types/models";
import { getSupabaseClient } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sb = () => getSupabaseClient();
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string | undefined) => Boolean(value && UUID_PATTERN.test(value));

/** Throws a readable error if a Supabase query fails. */
const throwOnError = <T>(result: { data: T; error: unknown }): T => {
  if (result.error) {
    const message =
      typeof (result.error as { message?: string }).message === "string"
        ? (result.error as { message: string }).message
        : "Supabase query failed.";
    throw new Error(message);
  }
  return result.data;
};

// ---------------------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------------------

interface DbProfile {
  id: string;
  user_id: string;
  name: string;
  timezone: string;
  preferred_mode: string;
  institution_type: string | null;
  institution_name: string | null;
  class_or_course: string | null;
  field_of_study: string | null;
  institution_start_time: string | null;
  institution_end_time: string | null;
  has_completed_profile_setup: boolean;
  has_completed_syllabus_setup: boolean;
  has_completed_schedule_setup: boolean;
  routine: RoutinePreferences | null;
  avatar_url: string | null;
}

const toAppProfile = (row: DbProfile, email?: string, emailVerifiedAt?: string): UserProfile => ({
  id: row.user_id,
  name: row.name,
  timezone: row.timezone || "UTC",
  preferredMode: (row.preferred_mode as UserProfile["preferredMode"]) || "pomodoro",
  isAuthenticated: true,
  hasCompletedProfileSetup: row.has_completed_profile_setup,
  hasCompletedSyllabusSetup: row.has_completed_syllabus_setup,
  hasCompletedScheduleSetup: row.has_completed_schedule_setup,
  institutionType: row.institution_type as UserProfile["institutionType"],
  institutionName: row.institution_name || undefined,
  classOrCourse: row.class_or_course || undefined,
  fieldOfStudy: row.field_of_study || undefined,
  institutionStartTime: row.institution_start_time || undefined,
  institutionEndTime: row.institution_end_time || undefined,
  routine: row.routine || undefined,
  avatarUrl: row.avatar_url || undefined,
  email,
  emailVerifiedAt,
});

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const result = await sb()
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;

  // Get email from auth
  const { data: { user } } = await sb().auth.getUser();
  return toAppProfile(
    result.data as DbProfile,
    user?.email,
    user?.email_confirmed_at || undefined,
  );
};

export const upsertProfile = async (userId: string, profile: UserProfile): Promise<void> => {
  throwOnError(
    await sb()
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          name: profile.name,
          timezone: profile.timezone,
          preferred_mode: profile.preferredMode,
          institution_type: profile.institutionType || null,
          institution_name: profile.institutionName || null,
          class_or_course: profile.classOrCourse || null,
          field_of_study: profile.fieldOfStudy || null,
          institution_start_time: profile.institutionStartTime || null,
          institution_end_time: profile.institutionEndTime || null,
          has_completed_profile_setup: profile.hasCompletedProfileSetup,
          has_completed_syllabus_setup: profile.hasCompletedSyllabusSetup,
          has_completed_schedule_setup: profile.hasCompletedScheduleSetup,
          routine: profile.routine || null,
          avatar_url: profile.avatarUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      ),
  );
};

// ---------------------------------------------------------------------------
// SUBJECTS (with nested units → topics)
// ---------------------------------------------------------------------------

interface DbSubject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  exam_date: string | null;
}

interface DbUnit {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  order_index: number;
}

interface DbTopic {
  id: string;
  user_id: string;
  unit_id: string;
  title: string;
  status: string;
  studied_minutes: number;
  study_sessions_count: number;
  last_studied_at: string | null;
  order_index: number;
}

const toAppTopic = (row: DbTopic): SyllabusTopic => ({
  id: row.id,
  title: row.title,
  status: (row.status as SyllabusTopic["status"]) || "not_started",
  studiedMinutes: row.studied_minutes || 0,
  studySessionsCount: row.study_sessions_count || 0,
  lastStudiedAt: row.last_studied_at || undefined,
});

const toAppUnit = (row: DbUnit, topics: DbTopic[]): SyllabusUnit => ({
  id: row.id,
  title: row.title,
  topics: topics
    .filter((t) => t.unit_id === row.id)
    .sort((a, b) => a.order_index - b.order_index)
    .map(toAppTopic),
});

const toAppSubject = (row: DbSubject, units: DbUnit[], topics: DbTopic[]): Subject => {
  const subjectUnits = units
    .filter((u) => u.subject_id === row.id)
    .sort((a, b) => a.order_index - b.order_index);

  return {
    id: row.id,
    name: row.name,
    color: row.color,
    examDate: row.exam_date || undefined,
    syllabusUnits: subjectUnits.map((u) => toAppUnit(u, topics)),
  };
};

const toAppSubjectWithUnits = (row: DbSubject, syllabusUnits: SyllabusUnit[]): Subject => ({
  id: row.id,
  name: row.name,
  color: row.color,
  examDate: row.exam_date || undefined,
  syllabusUnits,
});

export const fetchSubjects = async (userId: string): Promise<Subject[]> => {
  const [subjectsRes, unitsRes, topicsRes] = await Promise.all([
    sb().from("subjects").select("*").eq("user_id", userId),
    sb().from("units").select("*").eq("user_id", userId),
    sb().from("topics").select("*").eq("user_id", userId),
  ]);

  const subjects = throwOnError(subjectsRes) as DbSubject[];
  const units = throwOnError(unitsRes) as DbUnit[];
  const topics = throwOnError(topicsRes) as DbTopic[];

  return subjects.map((s) => toAppSubject(s, units, topics));
};

export const createUnitsWithTopics = async (
  userId: string,
  subjectId: string,
  units: SyllabusUnit[],
  startOrderIndex = 0,
): Promise<SyllabusUnit[]> => {
  if (units.length === 0) {
    return [];
  }

  const updatedAt = new Date().toISOString();
  const unitRows = units.map((unit, unitIndex) => ({
    ...(isUuid(unit.id) ? { id: unit.id } : {}),
    user_id: userId,
    subject_id: subjectId,
    title: unit.title,
    order_index: startOrderIndex + unitIndex,
    updated_at: updatedAt,
  }));
  let createdUnits: DbUnit[] = [];

  try {
    createdUnits = (
      throwOnError(await sb().from("units").insert(unitRows).select("*")) as DbUnit[]
    ).sort((a, b) => a.order_index - b.order_index);

    const topicRows = createdUnits.flatMap((createdUnit, unitIndex) => {
      const sourceUnit = units[unitIndex];

      return sourceUnit.topics.map((topic, topicIndex) => ({
        ...(isUuid(topic.id) ? { id: topic.id } : {}),
        user_id: userId,
        unit_id: createdUnit.id,
        title: topic.title,
        status: "not_started",
        studied_minutes: 0,
        study_sessions_count: 0,
        last_studied_at: null,
        order_index: topicIndex,
        updated_at: updatedAt,
      }));
    });

    const createdTopics =
      topicRows.length > 0
        ? (throwOnError(await sb().from("topics").insert(topicRows).select("*")) as DbTopic[])
        : [];

    return createdUnits.map((unit) => toAppUnit(unit, createdTopics));
  } catch (error) {
    if (createdUnits.length > 0) {
      const rollbackResult = await sb()
        .from("units")
        .delete()
        .eq("user_id", userId)
        .in(
          "id",
          createdUnits.map((unit) => unit.id),
        );

      if (rollbackResult.error) {
        console.error("[FocusFlow] Failed to rollback parsed syllabus units:", rollbackResult.error);
      }
    }

    throw error instanceof Error ? error : new Error("Failed to save parsed syllabus.");
  }
};

export const createSubject = async (userId: string, subject: Subject): Promise<Subject> => {
  const updatedAt = new Date().toISOString();
  let createdSubject: DbSubject | null = null;

  try {
    createdSubject = throwOnError(
      await sb()
        .from("subjects")
        .insert({
          ...(isUuid(subject.id) ? { id: subject.id } : {}),
          user_id: userId,
          name: subject.name,
          color: subject.color,
          exam_date: subject.examDate || null,
          updated_at: updatedAt,
        })
        .select("*")
        .single(),
    ) as DbSubject;

    const createdUnits = await createUnitsWithTopics(userId, createdSubject.id, subject.syllabusUnits);
    return toAppSubjectWithUnits(createdSubject, createdUnits);
  } catch (error) {
    if (createdSubject) {
      const rollbackResult = await sb()
        .from("subjects")
        .delete()
        .eq("id", createdSubject.id)
        .eq("user_id", userId);

      if (rollbackResult.error) {
        console.error("[FocusFlow] Failed to rollback subject after create error:", rollbackResult.error);
      }
    }

    throw error instanceof Error ? error : new Error("Failed to create subject.");
  }
};

export const createUnit = async (
  userId: string,
  subjectId: string,
  unit: SyllabusUnit,
  orderIndex: number,
): Promise<SyllabusUnit> => {
  const updatedAt = new Date().toISOString();
  let createdUnit: DbUnit | null = null;

  try {
    createdUnit = throwOnError(
      await sb()
        .from("units")
        .insert({
          ...(isUuid(unit.id) ? { id: unit.id } : {}),
          user_id: userId,
          subject_id: subjectId,
          title: unit.title,
          order_index: orderIndex,
          updated_at: updatedAt,
        })
        .select("*")
        .single(),
    ) as DbUnit;

    if (unit.topics.length === 0) {
      return toAppUnit(createdUnit, []);
    }

    const topicRows = unit.topics.map((topic, topicIndex) => ({
      ...(isUuid(topic.id) ? { id: topic.id } : {}),
      user_id: userId,
      unit_id: createdUnit!.id,
      title: topic.title,
      status: topic.status,
      studied_minutes: topic.studiedMinutes || 0,
      study_sessions_count: topic.studySessionsCount || 0,
      last_studied_at: topic.lastStudiedAt || null,
      order_index: topicIndex,
      updated_at: updatedAt,
    }));

    const createdTopics = throwOnError(
      await sb().from("topics").insert(topicRows).select("*"),
    ) as DbTopic[];

    return toAppUnit(createdUnit, createdTopics);
  } catch (error) {
    if (createdUnit) {
      const rollbackResult = await sb()
        .from("units")
        .delete()
        .eq("id", createdUnit.id)
        .eq("user_id", userId);

      if (rollbackResult.error) {
        console.error("[FocusFlow] Failed to rollback unit after create error:", rollbackResult.error);
      }
    }

    throw error instanceof Error ? error : new Error("Failed to create unit.");
  }
};

export const createTopic = async (
  userId: string,
  unitId: string,
  topic: SyllabusTopic,
  orderIndex: number,
): Promise<SyllabusTopic> => {
  const createdTopic = throwOnError(
    await sb()
      .from("topics")
      .insert({
        ...(isUuid(topic.id) ? { id: topic.id } : {}),
        user_id: userId,
        unit_id: unitId,
        title: topic.title,
        status: "not_started",
        studied_minutes: 0,
        study_sessions_count: 0,
        last_studied_at: null,
        order_index: orderIndex,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single(),
  ) as DbTopic;

  return toAppTopic(createdTopic);
};

export const updateSubject = async (
  userId: string,
  subjectId: string,
  patch: Partial<Subject>,
): Promise<void> => {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updatePayload.name = patch.name;
  if (patch.color !== undefined) updatePayload.color = patch.color;
  if (patch.examDate !== undefined) updatePayload.exam_date = patch.examDate || null;

  throwOnError(
    await sb().from("subjects").update(updatePayload).eq("id", subjectId).eq("user_id", userId),
  );
};

export const deleteSubject = async (userId: string, subjectId: string): Promise<void> => {
  throwOnError(
    await sb().from("subjects").delete().eq("id", subjectId).eq("user_id", userId),
  );
};

/**
 * Full save of a subject's syllabus structure.
 * Deletes existing units/topics for the subject and re-inserts fresh.
 */
export const saveSubjectSyllabus = async (
  userId: string,
  subject: Subject,
): Promise<void> => {
  // Delete old units (cascades to topics)
  await sb().from("units").delete().eq("subject_id", subject.id).eq("user_id", userId);

  // Re-insert units + topics
  for (let ui = 0; ui < subject.syllabusUnits.length; ui++) {
    const unit = subject.syllabusUnits[ui];
    throwOnError(
      await sb().from("units").insert({
        id: unit.id,
        user_id: userId,
        subject_id: subject.id,
        title: unit.title,
        order_index: ui,
      }),
    );

    if (unit.topics.length > 0) {
      const topicRows = unit.topics.map((topic, ti) => ({
        id: topic.id,
        user_id: userId,
        unit_id: unit.id,
        title: topic.title,
        status: topic.status,
        studied_minutes: topic.studiedMinutes || 0,
        study_sessions_count: topic.studySessionsCount || 0,
        last_studied_at: topic.lastStudiedAt || null,
        order_index: ti,
      }));

      throwOnError(await sb().from("topics").insert(topicRows));
    }
  }
};

// ---------------------------------------------------------------------------
// GOALS
// ---------------------------------------------------------------------------

interface DbGoal {
  id: string;
  user_id: string;
  title: string;
  type: string;
  target_minutes: number;
  completed_minutes: number;
  due_date: string | null;
}

const toAppGoal = (row: DbGoal): StudyGoal => ({
  id: row.id,
  title: row.title,
  type: (row.type as StudyGoal["type"]) || "academic",
  targetMinutes: row.target_minutes || 0,
  completedMinutes: row.completed_minutes || 0,
  dueDate: row.due_date || undefined,
});

export const fetchGoals = async (userId: string): Promise<StudyGoal[]> => {
  const result = throwOnError(
    await sb().from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  );
  return (result as DbGoal[]).map(toAppGoal);
};

export const createGoal = async (userId: string, goal: StudyGoal): Promise<void> => {
  throwOnError(
    await sb().from("goals").upsert({
      id: goal.id,
      user_id: userId,
      title: goal.title,
      type: goal.type || "academic",
      target_minutes: goal.targetMinutes || 0,
      completed_minutes: goal.completedMinutes || 0,
      due_date: goal.dueDate || null,
      updated_at: new Date().toISOString(),
    }),
  );
};

export const updateGoal = async (
  userId: string,
  goalId: string,
  patch: Partial<StudyGoal>,
): Promise<void> => {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.type !== undefined) updatePayload.type = patch.type;
  if (patch.targetMinutes !== undefined) updatePayload.target_minutes = patch.targetMinutes;
  if (patch.completedMinutes !== undefined) updatePayload.completed_minutes = patch.completedMinutes;
  if (patch.dueDate !== undefined) updatePayload.due_date = patch.dueDate || null;

  throwOnError(
    await sb().from("goals").update(updatePayload).eq("id", goalId).eq("user_id", userId),
  );
};

export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  throwOnError(
    await sb().from("goals").delete().eq("id", goalId).eq("user_id", userId),
  );
};

export const saveAllGoals = async (userId: string, goals: StudyGoal[]): Promise<void> => {
  // Delete existing goals and re-insert (used during migration and bulk save)
  await sb().from("goals").delete().eq("user_id", userId);

  if (goals.length > 0) {
    const rows = goals.map((goal) => ({
      id: goal.id,
      user_id: userId,
      title: goal.title,
      type: goal.type || "academic",
      target_minutes: goal.targetMinutes || 0,
      completed_minutes: goal.completedMinutes || 0,
      due_date: goal.dueDate || null,
    }));

    throwOnError(await sb().from("goals").insert(rows));
  }
};

// ---------------------------------------------------------------------------
// SESSIONS
// ---------------------------------------------------------------------------

interface DbSession {
  id: string;
  user_id: string;
  subject_id: string | null;
  subject_name: string;
  started_at: string;
  ended_at: string;
  planned_minutes: number;
  actual_minutes: number;
  distraction_count: number;
  distraction_tags: string[];
  tab_switch_count: number;
  tab_away_ms: number;
  inactivity_count: number;
  inactivity_ms: number;
  stability_score: number | null;
  goal: string | null;
  note: string | null;
  syllabus_topic: StudySession["syllabusTopic"] | null;
  focus_tracking: StudySession["focusTracking"] | null;
}

const toAppSession = (row: DbSession): StudySession => ({
  id: row.id,
  subjectId: row.subject_id || "",
  subjectName: row.subject_name,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  plannedMinutes: row.planned_minutes,
  actualMinutes: row.actual_minutes,
  distractionCount: row.distraction_count || 0,
  distractionTags: row.distraction_tags || [],
  tabSwitchCount: row.tab_switch_count || 0,
  tabAwayMs: row.tab_away_ms || 0,
  inactivityCount: row.inactivity_count || 0,
  inactivityMs: row.inactivity_ms || 0,
  stabilityScore: row.stability_score ?? undefined,
  goal: row.goal || undefined,
  note: row.note || undefined,
  syllabusTopic: row.syllabus_topic || undefined,
  focusTracking: row.focus_tracking || undefined,
});

export const fetchSessions = async (userId: string): Promise<StudySession[]> => {
  const result = throwOnError(
    await sb()
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false }),
  );
  return (result as DbSession[]).map(toAppSession);
};

export const createSession = async (userId: string, session: StudySession): Promise<void> => {
  throwOnError(
    await sb().from("sessions").upsert({
      id: session.id,
      user_id: userId,
      subject_id: session.subjectId || null,
      subject_name: session.subjectName,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      planned_minutes: session.plannedMinutes,
      actual_minutes: session.actualMinutes,
      distraction_count: session.distractionCount || 0,
      distraction_tags: session.distractionTags || [],
      tab_switch_count: session.tabSwitchCount || 0,
      tab_away_ms: session.tabAwayMs || 0,
      inactivity_count: session.inactivityCount || 0,
      inactivity_ms: session.inactivityMs || 0,
      stability_score: session.stabilityScore ?? null,
      goal: session.goal || null,
      note: session.note || null,
      syllabus_topic: session.syllabusTopic || null,
      focus_tracking: session.focusTracking || null,
    }),
  );
};

export const updateSession = async (
  userId: string,
  sessionId: string,
  patch: Partial<StudySession>,
): Promise<void> => {
  const updatePayload: Record<string, unknown> = {};
  if (patch.actualMinutes !== undefined) updatePayload.actual_minutes = patch.actualMinutes;
  if (patch.endedAt !== undefined) updatePayload.ended_at = patch.endedAt;
  if (patch.goal !== undefined) updatePayload.goal = patch.goal;
  if (patch.note !== undefined) updatePayload.note = patch.note;
  if (patch.distractionCount !== undefined) updatePayload.distraction_count = patch.distractionCount;
  if (patch.distractionTags !== undefined) updatePayload.distraction_tags = patch.distractionTags;
  if (patch.tabSwitchCount !== undefined) updatePayload.tab_switch_count = patch.tabSwitchCount;
  if (patch.tabAwayMs !== undefined) updatePayload.tab_away_ms = patch.tabAwayMs;
  if (patch.inactivityCount !== undefined) updatePayload.inactivity_count = patch.inactivityCount;
  if (patch.inactivityMs !== undefined) updatePayload.inactivity_ms = patch.inactivityMs;
  if (patch.stabilityScore !== undefined) updatePayload.stability_score = patch.stabilityScore;
  if (patch.syllabusTopic !== undefined) updatePayload.syllabus_topic = patch.syllabusTopic;
  if (patch.focusTracking !== undefined) updatePayload.focus_tracking = patch.focusTracking;

  if (Object.keys(updatePayload).length === 0) return;

  throwOnError(
    await sb().from("sessions").update(updatePayload).eq("id", sessionId).eq("user_id", userId),
  );
};

export const saveAllSessions = async (userId: string, sessions: StudySession[]): Promise<void> => {
  if (sessions.length === 0) return;

  // Batch insert in chunks of 50 to avoid payload limits
  const chunkSize = 50;
  for (let i = 0; i < sessions.length; i += chunkSize) {
    const chunk = sessions.slice(i, i + chunkSize);
    const rows = chunk.map((session) => ({
      id: session.id,
      user_id: userId,
      subject_id: session.subjectId || null,
      subject_name: session.subjectName,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      planned_minutes: session.plannedMinutes,
      actual_minutes: session.actualMinutes,
      distraction_count: session.distractionCount || 0,
      distraction_tags: session.distractionTags || [],
      tab_switch_count: session.tabSwitchCount || 0,
      tab_away_ms: session.tabAwayMs || 0,
      inactivity_count: session.inactivityCount || 0,
      inactivity_ms: session.inactivityMs || 0,
      stability_score: session.stabilityScore ?? null,
      goal: session.goal || null,
      note: session.note || null,
      syllabus_topic: session.syllabusTopic || null,
      focus_tracking: session.focusTracking || null,
    }));

    throwOnError(await sb().from("sessions").upsert(rows));
  }
};

// ---------------------------------------------------------------------------
// ACCOUNT DELETION — wipe all user data from Supabase tables
// ---------------------------------------------------------------------------

/**
 * Delete all data owned by a user across every table.
 * Subjects cascade to units → topics automatically via FK constraints.
 */
export const deleteAllUserData = async (userId: string): Promise<void> => {
  // Delete in dependency order (sessions/goals first, then subjects which cascade)
  await Promise.all([
    sb().from("sessions").delete().eq("user_id", userId),
    sb().from("goals").delete().eq("user_id", userId),
  ]);

  // Subjects cascade deletes units → topics
  await sb().from("subjects").delete().eq("user_id", userId);

  // Finally, profile
  await sb().from("profiles").delete().eq("user_id", userId);
};
