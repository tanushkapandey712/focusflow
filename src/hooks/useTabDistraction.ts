import { useCallback, useEffect, useRef, useState } from "react";

const INACTIVITY_THRESHOLD_MS = 90_000; // 90 seconds of no interaction = inactive

export interface TabDistractionState {
  /** Number of times the user switched away from the tab */
  tabSwitchCount: number;
  /** Total milliseconds spent on other tabs */
  tabAwayMs: number;
  /** Number of inactivity periods detected */
  inactivityCount: number;
  /** Total milliseconds of inactivity */
  inactivityMs: number;
  /** Whether the user is currently on another tab */
  isTabAway: boolean;
  /** Whether the user is currently inactive */
  isInactive: boolean;
}

const INITIAL_STATE: TabDistractionState = {
  tabSwitchCount: 0,
  tabAwayMs: 0,
  inactivityCount: 0,
  inactivityMs: 0,
  isTabAway: false,
  isInactive: false,
};

/**
 * Tracks tab-away events (via visibilitychange) and user inactivity
 * (via mousemove / keydown / pointerdown silence) while `isActive` is true.
 */
export const useTabDistraction = (isActive: boolean) => {
  const [state, setState] = useState<TabDistractionState>(INITIAL_STATE);

  // Refs to track timing without causing re-renders
  const tabAwayStartRef = useRef<number | null>(null);
  const inactivityStartRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    // If we were inactive, record the duration
    if (inactivityStartRef.current !== null) {
      const elapsed = Date.now() - inactivityStartRef.current;
      inactivityStartRef.current = null;
      setState((prev) => ({
        ...prev,
        inactivityMs: prev.inactivityMs + elapsed,
        isInactive: false,
      }));
    }

    // Clear existing timer
    if (inactivityTimerRef.current !== null) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Start new inactivity countdown
    inactivityTimerRef.current = setTimeout(() => {
      inactivityStartRef.current = Date.now();
      setState((prev) => ({
        ...prev,
        inactivityCount: prev.inactivityCount + 1,
        isInactive: true,
      }));
    }, INACTIVITY_THRESHOLD_MS);
  }, []);

  // Track tab visibility changes
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switched away
        tabAwayStartRef.current = Date.now();
        setState((prev) => ({
          ...prev,
          tabSwitchCount: prev.tabSwitchCount + 1,
          isTabAway: true,
        }));
      } else {
        // Tab returned
        if (tabAwayStartRef.current !== null) {
          const elapsed = Date.now() - tabAwayStartRef.current;
          tabAwayStartRef.current = null;
          setState((prev) => ({
            ...prev,
            tabAwayMs: prev.tabAwayMs + elapsed,
            isTabAway: false,
          }));
        }
        resetInactivityTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, resetInactivityTimer]);

  // Track user activity for inactivity detection
  useEffect(() => {
    if (!isActive) return;

    const handleActivity = () => {
      resetInactivityTimer();
    };

    resetInactivityTimer();

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("scroll", handleActivity);

      if (inactivityTimerRef.current !== null) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isActive, resetInactivityTimer]);

  const reset = useCallback(() => {
    tabAwayStartRef.current = null;
    inactivityStartRef.current = null;
    if (inactivityTimerRef.current !== null) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  /** Finalize and return the current distraction summary, then reset */
  const finalize = useCallback(() => {
    let finalState = { ...state };

    // Flush any ongoing tab-away duration
    if (tabAwayStartRef.current !== null) {
      finalState.tabAwayMs += Date.now() - tabAwayStartRef.current;
      finalState.isTabAway = false;
    }

    // Flush any ongoing inactivity duration
    if (inactivityStartRef.current !== null) {
      finalState.inactivityMs += Date.now() - inactivityStartRef.current;
      finalState.isInactive = false;
    }

    reset();
    return finalState;
  }, [state, reset]);

  return {
    ...state,
    reset,
    finalize,
  };
};
