import type { RoutinePreferences, Subject, TimetableSession } from "../types/models";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parse "HH:mm" to total minutes since midnight */
const parseTime = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Format total minutes since midnight to "HH:mm" */
export const formatTimeSlot = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Get day name for index */
export const getDayName = (dayOfWeek: number): string => DAYS[dayOfWeek] ?? "?";

/** Get full day name */
export const getFullDayName = (dayOfWeek: number): string => {
  const full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return full[dayOfWeek] ?? "Unknown";
};

let _sessionCounter = 0;
const nextId = (): string => `tt-${Date.now()}-${++_sessionCounter}`;

interface GenerateOptions {
  routine: RoutinePreferences;
  collegeStart: string; // "HH:mm"
  collegeEnd: string;   // "HH:mm"
  subjects: Subject[];
  studyBlockMinutes?: number;
  breakMinutes?: number;
}

/** Identify free time slots in a day given constraints */
const findFreeSlots = (
  wakeUp: number,
  sleep: number,
  collegeStart: number,
  collegeEnd: number,
  commute: number,
): Array<{ start: number; end: number }> => {
  // Build blocked intervals
  const blocked: Array<{ start: number; end: number }> = [];

  // College block (including commute)
  const commuteToCollege = Math.max(0, collegeStart - commute);
  const commuteFromCollege = Math.min(sleep, collegeEnd + commute);
  blocked.push({ start: commuteToCollege, end: commuteFromCollege });

  // Sort blocked intervals
  blocked.sort((a, b) => a.start - b.start);

  // Find free slots between wake-up and sleep
  const free: Array<{ start: number; end: number }> = [];
  let cursor = wakeUp;

  for (const block of blocked) {
    if (cursor < block.start) {
      free.push({ start: cursor, end: block.start });
    }
    cursor = Math.max(cursor, block.end);
  }

  if (cursor < sleep) {
    free.push({ start: cursor, end: sleep });
  }

  return free;
};

/** Generate a weekly timetable */
export const generateTimetable = (options: GenerateOptions): TimetableSession[] => {
  const {
    routine,
    collegeStart,
    collegeEnd,
    subjects,
    studyBlockMinutes = 45,
    breakMinutes = 10,
  } = options;

  const wakeUp = parseTime(routine.wakeUpTime);
  const sleep = parseTime(routine.sleepTime);
  const colStart = parseTime(collegeStart);
  const colEnd = parseTime(collegeEnd);
  const commute = routine.commuteDurationMinutes;

  const sessions: TimetableSession[] = [];

  // Generate for each day (Mon-Sat, with lighter Sunday)
  for (let day = 0; day < 7; day++) {
    const isSunday = day === 0;

    // College block (Mon-Sat)
    if (!isSunday) {
      sessions.push({
        id: nextId(),
        dayOfWeek: day,
        startTime: collegeStart,
        endTime: collegeEnd,
        type: "college",
        label: "College / School",
      });
    }

    // Find free time
    const free = isSunday
      ? [{ start: wakeUp, end: sleep }]
      : findFreeSlots(wakeUp, sleep, colStart, colEnd, commute);

    // Optionally prioritize morning or night
    const orderedSlots =
      routine.preferredStudyTime === "night"
        ? [...free].reverse()
        : free;

    let subjectIndex = day % Math.max(1, subjects.length);

    for (const slot of orderedSlots) {
      let cursor = slot.start;
      const slotEnd = slot.end;

      // Need at least studyBlockMinutes for a session
      while (cursor + studyBlockMinutes <= slotEnd) {
        const subject = subjects[subjectIndex % subjects.length];

        sessions.push({
          id: nextId(),
          subjectId: subject?.id,
          dayOfWeek: day,
          startTime: formatTimeSlot(cursor),
          endTime: formatTimeSlot(cursor + studyBlockMinutes),
          type: "study",
          label: subject?.name ?? "Study Block",
        });

        cursor += studyBlockMinutes;
        subjectIndex++;

        // Add break if there's room for another session after
        if (cursor + breakMinutes + studyBlockMinutes <= slotEnd) {
          sessions.push({
            id: nextId(),
            dayOfWeek: day,
            startTime: formatTimeSlot(cursor),
            endTime: formatTimeSlot(cursor + breakMinutes),
            type: "break",
            label: "Break",
          });
          cursor += breakMinutes;
        } else if (cursor < slotEnd) {
          // Add remaining time as a break
          if (slotEnd - cursor >= 5) {
            sessions.push({
              id: nextId(),
              dayOfWeek: day,
              startTime: formatTimeSlot(cursor),
              endTime: formatTimeSlot(slotEnd),
              type: "break",
              label: "Free Time",
            });
          }
          cursor = slotEnd;
        }
      }
    }
  }

  return sessions;
};

/** Check for overlapping sessions */
export const hasOverlap = (
  sessions: TimetableSession[],
  newSession: TimetableSession,
): boolean => {
  const newStart = parseTime(newSession.startTime);
  const newEnd = parseTime(newSession.endTime);

  return sessions.some((s) => {
    if (s.dayOfWeek !== newSession.dayOfWeek || s.id === newSession.id) return false;
    const start = parseTime(s.startTime);
    const end = parseTime(s.endTime);
    return newStart < end && newEnd > start;
  });
};

/** Get duration in minutes */
export const getSessionDuration = (session: TimetableSession): number => {
  return parseTime(session.endTime) - parseTime(session.startTime);
};

/** Get total study minutes for a day */
export const getDayStudyMinutes = (sessions: TimetableSession[], day: number): number => {
  return sessions
    .filter((s) => s.dayOfWeek === day && s.type === "study")
    .reduce((sum, s) => sum + getSessionDuration(s), 0);
};

/** Get total weekly study minutes */
export const getWeeklyStudyMinutes = (sessions: TimetableSession[]): number => {
  return sessions
    .filter((s) => s.type === "study")
    .reduce((sum, s) => sum + getSessionDuration(s), 0);
};

/** Get subject-wise allocation */
export const getSubjectAllocation = (
  sessions: TimetableSession[],
): Array<{ subjectId: string; label: string; minutes: number }> => {
  const map = new Map<string, { label: string; minutes: number }>();

  for (const s of sessions) {
    if (s.type !== "study" || !s.subjectId) continue;
    const key = s.subjectId;
    const existing = map.get(key) ?? { label: s.label ?? "Study", minutes: 0 };
    existing.minutes += getSessionDuration(s);
    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([subjectId, data]) => ({
    subjectId,
    ...data,
  }));
};
