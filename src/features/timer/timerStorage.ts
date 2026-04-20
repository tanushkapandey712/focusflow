import type { TimerMode } from "./types";

const STORAGE_KEYS = {
  timerState: "focusflow.timer.session.v1",
  timerForm: "focusflow.timer.form.v1",
} as const;

export interface PersistedStudyTimerState {
  mode: TimerMode;
  customMinutes: number;
  plannedSec: number;
  sessionStartedAtMs: number | null;
  activeSegmentStartedAtMs: number | null;
  isPaused: boolean;
  accumulatedElapsedSec: number;
}

export interface PersistedStudyTimerFormState {
  selectedSubjectId: string;
  selectedUnitId: string;
  selectedTopicId: string;
  goal: string;
  distractionTags: string[];
}

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures in local mode.
  }
};

const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures in local mode.
  }
};

const isValidTimerMode = (value: unknown): value is TimerMode =>
  value === "pomodoro" || value === "deep-work" || value === "custom";

const normalizeTimestamp = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const normalizeWholeSeconds = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;

export const readPersistedStudyTimerState = (): PersistedStudyTimerState | null => {
  const candidate = safeParse<Partial<PersistedStudyTimerState>>(localStorage.getItem(STORAGE_KEYS.timerState), {});

  if (!isValidTimerMode(candidate.mode)) {
    return null;
  }

  const plannedSec = normalizeWholeSeconds(candidate.plannedSec);

  if (plannedSec <= 0) {
    return null;
  }

  return {
    mode: candidate.mode,
    customMinutes: normalizeWholeSeconds(candidate.customMinutes, 30),
    plannedSec,
    sessionStartedAtMs: normalizeTimestamp(candidate.sessionStartedAtMs),
    activeSegmentStartedAtMs: normalizeTimestamp(candidate.activeSegmentStartedAtMs),
    isPaused: candidate.isPaused === true,
    accumulatedElapsedSec: normalizeWholeSeconds(candidate.accumulatedElapsedSec),
  };
};

export const writePersistedStudyTimerState = (state: PersistedStudyTimerState | null) => {
  if (!state) {
    safeRemove(STORAGE_KEYS.timerState);
    return;
  }

  safeWrite(STORAGE_KEYS.timerState, state);
};

export const readPersistedStudyTimerFormState = (): PersistedStudyTimerFormState => {
  const candidate = safeParse<Partial<PersistedStudyTimerFormState>>(localStorage.getItem(STORAGE_KEYS.timerForm), {});

  return {
    selectedSubjectId:
      typeof candidate.selectedSubjectId === "string" ? candidate.selectedSubjectId : "",
    selectedUnitId: typeof candidate.selectedUnitId === "string" ? candidate.selectedUnitId : "",
    selectedTopicId: typeof candidate.selectedTopicId === "string" ? candidate.selectedTopicId : "",
    goal: typeof candidate.goal === "string" ? candidate.goal : "",
    distractionTags: Array.isArray(candidate.distractionTags)
      ? candidate.distractionTags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
};

export const writePersistedStudyTimerFormState = (state: PersistedStudyTimerFormState) => {
  safeWrite(STORAGE_KEYS.timerForm, state);
};
