/**
 * Data Migration — one-time upload of localStorage data to Supabase.
 *
 * When a user signs in for the first time with existing local data,
 * we prompt them to sync it to their account. This module handles
 * the actual upload logic.
 */

import {
  createSubject,
  saveAllGoals,
  saveAllSessions,
  upsertProfile,
} from "./supabaseDataService";
import { focusFlowStorage } from "../storage/focusFlowStorage";

const MIGRATION_KEY = "focusflow.migrated.v1";

/** Check if migration has already been completed. */
export const isMigrationDone = (): boolean =>
  localStorage.getItem(MIGRATION_KEY) === "true";

/** Mark migration as completed so it doesn't run again. */
export const markMigrationDone = (): void =>
  localStorage.setItem(MIGRATION_KEY, "true");

/** Check if there is meaningful local data worth migrating. */
export const hasLocalData = (): boolean => {
  const subjects = focusFlowStorage.getSubjects();
  const sessions = focusFlowStorage.getSessions();
  const goals = focusFlowStorage.getGoals();

  return subjects.length > 0 || sessions.length > 0 || goals.length > 0;
};

/** Should we show the migration prompt? */
export const shouldShowMigrationPrompt = (): boolean =>
  !isMigrationDone() && hasLocalData();

export interface MigrationProgress {
  step: string;
  current: number;
  total: number;
}

/**
 * Upload all local data to Supabase for the given user.
 * Progress callback is called for each major step.
 */
export const migrateLocalDataToSupabase = async (
  userId: string,
  onProgress?: (progress: MigrationProgress) => void,
): Promise<void> => {
  const profile = focusFlowStorage.getProfile();
  const subjects = focusFlowStorage.getSubjects();
  const sessions = focusFlowStorage.getSessions();
  const goals = focusFlowStorage.getGoals();

  const totalSteps = 1 + subjects.length + 1 + 1; // profile + subjects + sessions + goals
  let currentStep = 0;

  const report = (step: string) => {
    currentStep++;
    onProgress?.({ step, current: currentStep, total: totalSteps });
  };

  // 1. Profile
  report("Syncing profile...");
  await upsertProfile(userId, {
    ...profile,
    id: userId,
    isAuthenticated: true,
  });

  // 2. Subjects (with units + topics)
  for (const subject of subjects) {
    report(`Syncing subject: ${subject.name}`);
    await createSubject(userId, subject);
  }

  // 3. Sessions
  report("Syncing study sessions...");
  await saveAllSessions(userId, sessions);

  // 4. Goals
  report("Syncing goals...");
  await saveAllGoals(userId, goals);

  markMigrationDone();
};

/**
 * Clear localStorage data after successful migration.
 * Keeps only UI preferences (theme, sidebar state, timer recovery).
 */
export const clearMigratedLocalData = (): void => {
  const keysToKeep = [
    "focusflow.theme",
    "focusflow.sidebarCollapsed",
    "focusflow.timerRecovery",
    MIGRATION_KEY,
  ];

  const allKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("focusflow.") && !keysToKeep.includes(key)) {
      allKeys.push(key);
    }
  }

  allKeys.forEach((key) => localStorage.removeItem(key));
};
