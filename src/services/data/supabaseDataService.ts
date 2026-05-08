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
  class_year?: string | null;
  field_of_study: string | null;
  field?: string | null;
  institution_start_time: string | null;
  institution_end_time: string | null;
  has_completed_profile_setup: boolean;
  has_completed_syllabus_setup: boolean;
  has_completed_schedule_setup: boolean;
  onboarding_completed?: boolean | null;
  preferred_study_hours?: string | null;
  routine: RoutinePreferences | null;
  avatar_url: string | null;
}

const toAppProfile = (row: DbProfile, email?: string, emailVerifiedAt?: string): UserProfile => ({
  id: row.user_id,
  name: row.name,
  timezone: row.timezone || "UTC",
  preferredMode: (row.preferred_mode as UserProfile["preferredMode"]) || "pomodoro",
  isAuthenticated: true,
  hasCompletedProfileSetup: row.has_completed_profile_setup || row.onboarding_completed === true,
  hasCompletedSyllabusSetup: row.has_completed_syllabus_setup || row.onboarding_completed === true,
  hasCompletedScheduleSetup: row.has_completed_schedule_setup || row.onboarding_completed === true,
  institutionType: row.institution_type as UserProfile["institutionType"],
  institutionName: row.institution_name || undefined,
  classOrCourse: row.class_or_course || row.class_year || undefined,
  fieldOfStudy: row.field_of_study || row.field || undefined,
  preferredStudyHours: row.preferred_study_hours || row.routine?.preferredStudyTime,
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

export const upsertProfile = async (userId: string, profile: UserProfile): Promise<UserProfile> => {
  const existingResult = await sb()
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingResult.error) {
    throw new Error(existingResult.error.message);
  }

  const existing = existingResult.data as DbProfile | null;
  const mergedName =
    profile.name && profile.name !== "Student" ? profile.name : existing?.name || profile.name || "Student";
  const mergedClassOrCourse = profile.classOrCourse ?? existing?.class_or_course ?? existing?.class_year ?? null;
  const mergedFieldOfStudy = profile.fieldOfStudy ?? existing?.field_of_study ?? existing?.field ?? null;
  const mergedRoutine = profile.routine ?? existing?.routine ?? null;
  const onboardingCompleted =
    profile.hasCompletedProfileSetup &&
    profile.hasCompletedSyllabusSetup &&
    profile.hasCompletedScheduleSetup;

  const savedProfile = throwOnError(
    await sb()
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          name: mergedName,
          timezone: profile.timezone || existing?.timezone || "UTC",
          preferred_mode: profile.preferredMode || existing?.preferred_mode || "pomodoro",
          institution_type: profile.institutionType ?? existing?.institution_type ?? null,
          institution_name: profile.institutionName ?? existing?.institution_name ?? null,
          class_or_course: mergedClassOrCourse,
          class_year: mergedClassOrCourse,
          field_of_study: mergedFieldOfStudy,
          field: mergedFieldOfStudy,
          institution_start_time: profile.institutionStartTime ?? existing?.institution_start_time ?? null,
          institution_end_time: profile.institutionEndTime ?? existing?.institution_end_time ?? null,
          has_completed_profile_setup:
            profile.hasCompletedProfileSetup || existing?.has_completed_profile_setup || false,
          has_completed_syllabus_setup:
            profile.hasCompletedSyllabusSetup || existing?.has_completed_syllabus_setup || false,
          has_completed_schedule_setup:
            profile.hasCompletedScheduleSetup || existing?.has_completed_schedule_setup || false,
          onboarding_completed: onboardingCompleted || existing?.onboarding_completed || false,
          preferred_study_hours:
            profile.preferredStudyHours ||
            profile.routine?.preferredStudyTime ||
            existing?.preferred_study_hours ||
            existing?.routine?.preferredStudyTime ||
            null,
          routine: mergedRoutine,
          avatar_url: profile.avatarUrl ?? existing?.avatar_url ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single(),
  ) as DbProfile;

  return toAppProfile(savedProfile, profile.email, profile.emailVerifiedAt);
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

const fetchSubjectById = async (userId: string, subjectId: string): Promise<Subject> => {
  const [subjectRes, unitsRes, topicsRes] = await Promise.all([
    sb().from("subjects").select("*").eq("id", subjectId).eq("user_id", userId).single(),
    sb().from("units").select("*").eq("subject_id", subjectId).eq("user_id", userId),
    sb().from("topics").select("*").eq("user_id", userId),
  ]);

  const subject = throwOnError(subjectRes) as DbSubject;
  const units = throwOnError(unitsRes) as DbUnit[];
  const unitIds = new Set(units.map((unit) => unit.id));
  const topics = (throwOnError(topicsRes) as DbTopic[]).filter((topic) =>
    unitIds.has(topic.unit_id),
  );

  return toAppSubject(subject, units, topics);
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
): Promise<Subject> => {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updatePayload.name = patch.name;
  if (patch.color !== undefined) updatePayload.color = patch.color;
  if (patch.examDate !== undefined) updatePayload.exam_date = patch.examDate || null;

  if (Object.keys(updatePayload).length > 1) {
    throwOnError(
      await sb()
        .from("subjects")
        .update(updatePayload)
        .eq("id", subjectId)
        .eq("user_id", userId)
        .select("*")
        .single(),
    );
  }

  if (patch.syllabusUnits !== undefined) {
    const currentSubject = await fetchSubjectById(userId, subjectId);
    await saveSubjectSyllabus(userId, {
      ...currentSubject,
      syllabusUnits: patch.syllabusUnits,
    });
  }

  return fetchSubjectById(userId, subjectId);
};

export const deleteSubject = async (userId: string, subjectId: string): Promise<void> => {
  // FK constraints in supabase/schema.sql cascade subjects -> units -> topics.
  throwOnError(
    await sb().from("subjects").delete().eq("id", subjectId).eq("user_id", userId),
  );
};

export const updateUnit = async (
  userId: string,
  unitId: string,
  patch: Partial<SyllabusUnit> & { orderIndex?: number },
): Promise<SyllabusUnit> => {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.orderIndex !== undefined) updatePayload.order_index = patch.orderIndex;

  const updatedUnit = throwOnError(
    await sb()
      .from("units")
      .update(updatePayload)
      .eq("id", unitId)
      .eq("user_id", userId)
      .select("*")
      .single(),
  ) as DbUnit;

  const topics = throwOnError(
    await sb().from("topics").select("*").eq("unit_id", unitId).eq("user_id", userId),
  ) as DbTopic[];

  return toAppUnit(updatedUnit, topics);
};

export const deleteUnit = async (userId: string, unitId: string): Promise<void> => {
  // FK constraints in supabase/schema.sql cascade units -> topics.
  throwOnError(await sb().from("units").delete().eq("id", unitId).eq("user_id", userId));
};

export const updateTopic = async (
  userId: string,
  topicId: string,
  patch: Partial<SyllabusTopic> & { orderIndex?: number },
): Promise<SyllabusTopic> => {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.status !== undefined) updatePayload.status = patch.status;
  if (patch.studiedMinutes !== undefined) updatePayload.studied_minutes = patch.studiedMinutes;
  if (patch.studySessionsCount !== undefined) {
    updatePayload.study_sessions_count = patch.studySessionsCount;
  }
  if (patch.lastStudiedAt !== undefined) {
    updatePayload.last_studied_at = patch.lastStudiedAt || null;
  }
  if (patch.orderIndex !== undefined) updatePayload.order_index = patch.orderIndex;

  const updatedTopic = throwOnError(
    await sb()
      .from("topics")
      .update(updatePayload)
      .eq("id", topicId)
      .eq("user_id", userId)
      .select("*")
      .single(),
  ) as DbTopic;

  return toAppTopic(updatedTopic);
};

export const deleteTopic = async (userId: string, topicId: string): Promise<void> => {
  throwOnError(await sb().from("topics").delete().eq("id", topicId).eq("user_id", userId));
};

/**
 * Full save of a subject's syllabus structure.
 * Updates existing units/topics in place, inserts new rows, and deletes
 * rows removed from the subject so session foreign keys stay stable.
 */
export const saveSubjectSyllabus = async (
  userId: string,
  subject: Subject,
): Promise<void> => {
  const updatedAt = new Date().toISOString();
  const existingUnits = throwOnError(
    await sb().from("units").select("*").eq("subject_id", subject.id).eq("user_id", userId),
  ) as DbUnit[];
  const existingUnitIds = new Set(existingUnits.map((unit) => unit.id));
  const existingTopics = existingUnits.length
    ? (throwOnError(
        await sb()
          .from("topics")
          .select("*")
          .eq("user_id", userId)
          .in(
            "unit_id",
            existingUnits.map((unit) => unit.id),
          ),
      ) as DbTopic[])
    : [];
  const existingTopicsByUnit = new Map<string, DbTopic[]>();

  existingTopics.forEach((topic) => {
    const topics = existingTopicsByUnit.get(topic.unit_id) ?? [];
    topics.push(topic);
    existingTopicsByUnit.set(topic.unit_id, topics);
  });

  const keptUnitIds = new Set<string>();

  // Upsert units/topics in place so unchanged rows keep their IDs and session FKs.
  for (let ui = 0; ui < subject.syllabusUnits.length; ui++) {
    const unit = subject.syllabusUnits[ui];
    const unitPayload = {
      title: unit.title,
      order_index: ui,
      updated_at: updatedAt,
    };
    const savedUnit =
      isUuid(unit.id) && existingUnitIds.has(unit.id)
        ? (throwOnError(
            await sb()
              .from("units")
              .update(unitPayload)
              .eq("id", unit.id)
              .eq("user_id", userId)
              .select("*")
              .single(),
          ) as DbUnit)
        : (throwOnError(
            await sb()
              .from("units")
              .insert({
                ...(isUuid(unit.id) ? { id: unit.id } : {}),
                user_id: userId,
                subject_id: subject.id,
                ...unitPayload,
              })
              .select("*")
              .single(),
          ) as DbUnit);

    keptUnitIds.add(savedUnit.id);

    const currentTopics = existingTopicsByUnit.get(savedUnit.id) ?? [];
    const currentTopicIds = new Set(currentTopics.map((topic) => topic.id));
    const keptTopicIds = new Set<string>();

    for (let ti = 0; ti < unit.topics.length; ti++) {
      const topic = unit.topics[ti];
      const topicPayload = {
        title: topic.title,
        status: topic.status,
        studied_minutes: topic.studiedMinutes || 0,
        study_sessions_count: topic.studySessionsCount || 0,
        last_studied_at: topic.lastStudiedAt || null,
        order_index: ti,
        updated_at: updatedAt,
      };
      const savedTopic =
        isUuid(topic.id) && currentTopicIds.has(topic.id)
          ? (throwOnError(
              await sb()
                .from("topics")
                .update(topicPayload)
                .eq("id", topic.id)
                .eq("user_id", userId)
                .select("*")
                .single(),
            ) as DbTopic)
          : (throwOnError(
              await sb()
                .from("topics")
                .insert({
                  ...(isUuid(topic.id) ? { id: topic.id } : {}),
                  user_id: userId,
                  unit_id: savedUnit.id,
                  ...topicPayload,
                })
                .select("*")
                .single(),
            ) as DbTopic);

      keptTopicIds.add(savedTopic.id);
    }

    const removedTopicIds = currentTopics
      .filter((topic) => !keptTopicIds.has(topic.id))
      .map((topic) => topic.id);

    if (removedTopicIds.length > 0) {
      throwOnError(
        await sb().from("topics").delete().eq("user_id", userId).in("id", removedTopicIds),
      );
    }
  }

  const removedUnitIds = existingUnits
    .filter((unit) => !keptUnitIds.has(unit.id))
    .map((unit) => unit.id);

  if (removedUnitIds.length > 0) {
    throwOnError(
      await sb().from("units").delete().eq("user_id", userId).in("id", removedUnitIds),
    );
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

export const createGoal = async (userId: string, goal: StudyGoal): Promise<StudyGoal> => {
  const createdGoal = throwOnError(
    await sb()
      .from("goals")
      .insert({
        ...(isUuid(goal.id) ? { id: goal.id } : {}),
        user_id: userId,
        title: goal.title,
        type: goal.type || "academic",
        target_minutes: goal.targetMinutes || 0,
        completed_minutes: goal.completedMinutes || 0,
        due_date: goal.dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single(),
  ) as DbGoal;

  return toAppGoal(createdGoal);
};

export const updateGoal = async (
  userId: string,
  goalId: string,
  patch: Partial<StudyGoal>,
): Promise<StudyGoal> => {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.type !== undefined) updatePayload.type = patch.type;
  if (patch.targetMinutes !== undefined) updatePayload.target_minutes = patch.targetMinutes;
  if (patch.completedMinutes !== undefined) updatePayload.completed_minutes = patch.completedMinutes;
  if (patch.dueDate !== undefined) updatePayload.due_date = patch.dueDate || null;

  const updatedGoal = throwOnError(
    await sb()
      .from("goals")
      .update(updatePayload)
      .eq("id", goalId)
      .eq("user_id", userId)
      .select("*")
      .single(),
  ) as DbGoal;

  return toAppGoal(updatedGoal);
};

export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  throwOnError(
    await sb().from("goals").delete().eq("id", goalId).eq("user_id", userId),
  );
};

export const saveAllGoals = async (userId: string, goals: StudyGoal[]): Promise<StudyGoal[]> => {
  // Delete existing goals and re-insert (used during migration and bulk save)
  throwOnError(await sb().from("goals").delete().eq("user_id", userId));

  if (goals.length === 0) {
    return [];
  }

  const rows = goals.map((goal) => ({
    ...(isUuid(goal.id) ? { id: goal.id } : {}),
    user_id: userId,
    title: goal.title,
    type: goal.type || "academic",
    target_minutes: goal.targetMinutes || 0,
    completed_minutes: goal.completedMinutes || 0,
    due_date: goal.dueDate || null,
  }));

  const savedGoals = throwOnError(await sb().from("goals").insert(rows).select("*")) as DbGoal[];
  return savedGoals.map(toAppGoal);
};

// ---------------------------------------------------------------------------
// SESSIONS
// ---------------------------------------------------------------------------

interface DbSession {
  id: string;
  user_id: string;
  subject_id: string | null;
  unit_id: string | null;
  topic_id: string | null;
  subject_name: string;
  started_at: string;
  ended_at: string;
  planned_minutes: number;
  actual_minutes: number;
  duration_minutes: number | null;
  mode: string | null;
  completed: boolean | null;
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

const toAppSessionMode = (mode: string | null): StudySession["mode"] =>
  mode === "pomodoro" || mode === "deep-work" || mode === "custom" ? mode : undefined;

const toAppSession = (row: DbSession): StudySession => ({
  id: row.id,
  subjectId: row.subject_id || "",
  unitId: row.unit_id || row.syllabus_topic?.unitId,
  topicId: row.topic_id || row.syllabus_topic?.topicId,
  subjectName: row.subject_name,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  plannedMinutes: row.planned_minutes,
  actualMinutes: row.actual_minutes,
  durationMinutes: row.duration_minutes ?? row.actual_minutes,
  mode: toAppSessionMode(row.mode),
  completed: row.completed ?? true,
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

export const createSession = async (userId: string, session: StudySession): Promise<StudySession> => {
  const unitId = session.unitId ?? session.syllabusTopic?.unitId;
  const topicId = session.topicId ?? session.syllabusTopic?.topicId;
  const createdSession = throwOnError(
    await sb()
      .from("sessions")
      .insert({
        ...(isUuid(session.id) ? { id: session.id } : {}),
        user_id: userId,
        subject_id: session.subjectId || null,
        unit_id: isUuid(unitId) ? unitId : null,
        topic_id: isUuid(topicId) ? topicId : null,
        subject_name: session.subjectName,
        started_at: session.startedAt,
        ended_at: session.endedAt,
        planned_minutes: session.plannedMinutes,
        actual_minutes: session.actualMinutes,
        duration_minutes: session.durationMinutes ?? session.actualMinutes,
        mode: session.mode || "pomodoro",
        completed: session.completed ?? true,
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
      })
      .select("*")
      .single(),
  ) as DbSession;

  return toAppSession(createdSession);
};

export const updateSession = async (
  userId: string,
  sessionId: string,
  patch: Partial<StudySession>,
): Promise<StudySession> => {
  const updatePayload: Record<string, unknown> = {};
  if (patch.actualMinutes !== undefined) updatePayload.actual_minutes = patch.actualMinutes;
  if (patch.durationMinutes !== undefined) updatePayload.duration_minutes = patch.durationMinutes;
  if (patch.plannedMinutes !== undefined) updatePayload.planned_minutes = patch.plannedMinutes;
  if (patch.mode !== undefined) updatePayload.mode = patch.mode;
  if (patch.completed !== undefined) updatePayload.completed = patch.completed;
  if (patch.subjectId !== undefined) updatePayload.subject_id = patch.subjectId || null;
  if (patch.unitId !== undefined) updatePayload.unit_id = isUuid(patch.unitId) ? patch.unitId : null;
  if (patch.topicId !== undefined) updatePayload.topic_id = isUuid(patch.topicId) ? patch.topicId : null;
  if (patch.subjectName !== undefined) updatePayload.subject_name = patch.subjectName;
  if (patch.startedAt !== undefined) updatePayload.started_at = patch.startedAt;
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

  if (patch.syllabusTopic !== undefined) {
    updatePayload.unit_id = isUuid(patch.syllabusTopic?.unitId) ? patch.syllabusTopic.unitId : null;
    updatePayload.topic_id = isUuid(patch.syllabusTopic?.topicId) ? patch.syllabusTopic.topicId : null;
  }

  if (Object.keys(updatePayload).length === 0) {
    const currentSession = throwOnError(
      await sb().from("sessions").select("*").eq("id", sessionId).eq("user_id", userId).single(),
    ) as DbSession;
    return toAppSession(currentSession);
  }

  const updatedSession = throwOnError(
    await sb()
      .from("sessions")
      .update(updatePayload)
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select("*")
      .single(),
  ) as DbSession;

  return toAppSession(updatedSession);
};

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  throwOnError(await sb().from("sessions").delete().eq("id", sessionId).eq("user_id", userId));
};

export const saveAllSessions = async (userId: string, sessions: StudySession[]): Promise<void> => {
  if (sessions.length === 0) return;

  // Batch insert in chunks of 50 to avoid payload limits
  const chunkSize = 50;
  for (let i = 0; i < sessions.length; i += chunkSize) {
    const chunk = sessions.slice(i, i + chunkSize);
    const rows = chunk.map((session) => {
      const unitId = session.unitId ?? session.syllabusTopic?.unitId;
      const topicId = session.topicId ?? session.syllabusTopic?.topicId;

      return {
        ...(isUuid(session.id) ? { id: session.id } : {}),
        user_id: userId,
        subject_id: session.subjectId || null,
        unit_id: isUuid(unitId) ? unitId : null,
        topic_id: isUuid(topicId) ? topicId : null,
        subject_name: session.subjectName,
        started_at: session.startedAt,
        ended_at: session.endedAt,
        planned_minutes: session.plannedMinutes,
        actual_minutes: session.actualMinutes,
        duration_minutes: session.durationMinutes ?? session.actualMinutes,
        mode: session.mode || "pomodoro",
        completed: session.completed ?? true,
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
      };
    });

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
  const [sessionsResult, goalsResult] = await Promise.all([
    sb().from("sessions").delete().eq("user_id", userId),
    sb().from("goals").delete().eq("user_id", userId),
  ]);

  throwOnError(sessionsResult);
  throwOnError(goalsResult);

  // Subjects cascade deletes units → topics
  throwOnError(await sb().from("subjects").delete().eq("user_id", userId));

  // Finally, profile
  throwOnError(await sb().from("profiles").delete().eq("user_id", userId));
};
