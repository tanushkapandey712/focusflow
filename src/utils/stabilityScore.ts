import type { StudySession } from "../types/models";

/**
 * Computes a 0–100 "stability" score for a study session.
 *
 * Stability reflects how consistently the user stayed focused,
 * factoring in distractions, tab switches, inactivity periods,
 * and camera-tracked away events.
 *
 * A perfect session with zero interruptions scores 100.
 */

interface StabilityInputs {
  /** Session duration in minutes */
  actualMinutes: number;
  /** Manual + auto distraction count */
  distractionCount: number;
  /** Number of tab-switch events */
  tabSwitchCount?: number;
  /** Number of inactivity periods */
  inactivityCount?: number;
  /** Total ms spent away from the tab */
  tabAwayMs?: number;
  /** Total ms of user inactivity */
  inactivityMs?: number;
  /** Camera-tracked away events */
  cameraAwayEvents?: number;
}

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

export const computeStabilityScore = (inputs: StabilityInputs): number => {
  const {
    actualMinutes,
    distractionCount,
    tabSwitchCount = 0,
    inactivityCount = 0,
    tabAwayMs = 0,
    inactivityMs = 0,
    cameraAwayEvents = 0,
  } = inputs;

  if (actualMinutes <= 0) return 0;

  const sessionMs = actualMinutes * 60 * 1000;

  // Penalty per interruption event (each costs 3–5 points)
  const eventPenalty =
    distractionCount * 4 +
    tabSwitchCount * 3 +
    inactivityCount * 5 +
    cameraAwayEvents * 3;

  // Penalty for time away (proportional to session length)
  const awayRatio = clamp((tabAwayMs + inactivityMs) / sessionMs, 0, 1);
  const timePenalty = awayRatio * 40; // max 40 points lost for being away the whole time

  return clamp(Math.round(100 - eventPenalty - timePenalty));
};

/**
 * Extracts stability inputs from a completed StudySession record.
 */
export const getSessionStabilityInputs = (session: StudySession): StabilityInputs => ({
  actualMinutes: session.actualMinutes,
  distractionCount: session.distractionCount ?? 0,
  tabSwitchCount: session.tabSwitchCount ?? 0,
  inactivityCount: session.inactivityCount ?? 0,
  tabAwayMs: session.tabAwayMs ?? 0,
  inactivityMs: session.inactivityMs ?? 0,
  cameraAwayEvents: session.focusTracking?.totalAwayEvents ?? 0,
});

/**
 * Returns a human-readable label for a stability score.
 */
export const getStabilityLabel = (score: number): string => {
  if (score >= 90) return "Rock Solid";
  if (score >= 75) return "Stable";
  if (score >= 55) return "Moderate";
  if (score >= 35) return "Fragmented";
  return "Scattered";
};

/**
 * Returns Tailwind class names for the stability badge.
 */
export const getStabilityTone = (score: number): string => {
  if (score >= 90) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
  if (score >= 75) return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200";
  if (score >= 55) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200";
  return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200";
};
