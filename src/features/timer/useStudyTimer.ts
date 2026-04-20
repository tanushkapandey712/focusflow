import { useCallback, useEffect, useMemo, useState } from "react";
import {
  readPersistedStudyTimerState,
  writePersistedStudyTimerState,
  type PersistedStudyTimerState,
} from "./timerStorage";
import type { TimerMode, TimerPreset, TimerStatus } from "./types";

interface UseStudyTimerOptions {
  presets: TimerPreset[];
}

interface StudyTimerState {
  mode: TimerMode;
  status: TimerStatus;
  customMinutes: number;
  plannedSec: number;
  sessionStartedAtMs: number | null;
  activeSegmentStartedAtMs: number | null;
  accumulatedElapsedSec: number;
}

const getPresetSeconds = (mode: TimerMode, presets: TimerPreset[], customMinutes: number) => {
  if (mode === "custom") {
    return customMinutes * 60;
  }

  return (presets.find((preset) => preset.mode === mode) ?? presets[0]).minutes * 60;
};

const getRunningElapsedSec = (
  accumulatedElapsedSec: number,
  activeSegmentStartedAtMs: number | null,
  nowMs: number,
) =>
  accumulatedElapsedSec +
  (activeSegmentStartedAtMs === null
    ? 0
    : Math.max(0, Math.floor((nowMs - activeSegmentStartedAtMs) / 1000)));

const getInitialStudyTimerState = (presets: TimerPreset[]): StudyTimerState => {
  const persistedState = readPersistedStudyTimerState();
  const defaultMode: TimerMode = presets[0]?.mode ?? "pomodoro";
  const defaultCustomMinutes = 30;
  const defaultPlannedSec = getPresetSeconds(defaultMode, presets, defaultCustomMinutes);

  if (!persistedState) {
    return {
      mode: defaultMode,
      status: "idle",
      customMinutes: defaultCustomMinutes,
      plannedSec: defaultPlannedSec,
      sessionStartedAtMs: null,
      activeSegmentStartedAtMs: null,
      accumulatedElapsedSec: 0,
    };
  }

  const nowMs = Date.now();
  const normalizedMode = persistedState.mode;
  const normalizedCustomMinutes = Math.max(5, persistedState.customMinutes);
  const normalizedPlannedSec =
    persistedState.plannedSec > 0
      ? persistedState.plannedSec
      : getPresetSeconds(normalizedMode, presets, normalizedCustomMinutes);
  const liveElapsedSec = getRunningElapsedSec(
    persistedState.accumulatedElapsedSec,
    persistedState.isPaused ? null : persistedState.activeSegmentStartedAtMs,
    nowMs,
  );

  if (liveElapsedSec >= normalizedPlannedSec) {
    return {
      mode: normalizedMode,
      status: "completed",
      customMinutes: normalizedCustomMinutes,
      plannedSec: normalizedPlannedSec,
      sessionStartedAtMs: persistedState.sessionStartedAtMs,
      activeSegmentStartedAtMs: null,
      accumulatedElapsedSec: normalizedPlannedSec,
    };
  }

  if (persistedState.isPaused) {
    return {
      mode: normalizedMode,
      status: "paused",
      customMinutes: normalizedCustomMinutes,
      plannedSec: normalizedPlannedSec,
      sessionStartedAtMs: persistedState.sessionStartedAtMs,
      activeSegmentStartedAtMs: null,
      accumulatedElapsedSec: persistedState.accumulatedElapsedSec,
    };
  }

  if (persistedState.activeSegmentStartedAtMs !== null) {
    return {
      mode: normalizedMode,
      status: "running",
      customMinutes: normalizedCustomMinutes,
      plannedSec: normalizedPlannedSec,
      sessionStartedAtMs:
        persistedState.sessionStartedAtMs ?? persistedState.activeSegmentStartedAtMs,
      activeSegmentStartedAtMs: persistedState.activeSegmentStartedAtMs,
      accumulatedElapsedSec: persistedState.accumulatedElapsedSec,
    };
  }

  return {
    mode: normalizedMode,
    status: "idle",
    customMinutes: normalizedCustomMinutes,
    plannedSec: getPresetSeconds(normalizedMode, presets, normalizedCustomMinutes),
    sessionStartedAtMs: null,
    activeSegmentStartedAtMs: null,
    accumulatedElapsedSec: 0,
  };
};

export const useStudyTimer = ({ presets }: UseStudyTimerOptions) => {
  const [timerState, setTimerState] = useState<StudyTimerState>(() => getInitialStudyTimerState(presets));
  const [nowMs, setNowMs] = useState(() => Date.now());

  const activePreset = useMemo(
    () => presets.find((preset) => preset.mode === timerState.mode) ?? presets[0],
    [presets, timerState.mode],
  );

  const totalSec = getPresetSeconds(timerState.mode, presets, timerState.customMinutes);
  const elapsedSec =
    timerState.status === "running"
      ? getRunningElapsedSec(
          timerState.accumulatedElapsedSec,
          timerState.activeSegmentStartedAtMs,
          nowMs,
        )
      : timerState.accumulatedElapsedSec;
  const clampedElapsedSec = Math.min(timerState.plannedSec, elapsedSec);
  const remainingSec = Math.max(0, timerState.plannedSec - clampedElapsedSec);

  useEffect(() => {
    if (timerState.status !== "idle") {
      return;
    }

    if (timerState.plannedSec === totalSec) {
      return;
    }

    setTimerState((current) =>
      current.status === "idle" ? { ...current, plannedSec: totalSec } : current,
    );
  }, [timerState.plannedSec, timerState.status, totalSec]);

  useEffect(() => {
    if (timerState.status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerState.status]);

  useEffect(() => {
    if (timerState.status !== "running" || remainingSec > 0) {
      return;
    }

    setTimerState((current) =>
      current.status === "running"
        ? {
            ...current,
            status: "completed",
            activeSegmentStartedAtMs: null,
            accumulatedElapsedSec: current.plannedSec,
          }
        : current,
    );
  }, [remainingSec, timerState.status]);

  useEffect(() => {
    const persistedState: PersistedStudyTimerState | null =
      timerState.status === "idle"
        ? null
        : {
            mode: timerState.mode,
            customMinutes: timerState.customMinutes,
            plannedSec: timerState.plannedSec,
            sessionStartedAtMs: timerState.sessionStartedAtMs,
            activeSegmentStartedAtMs:
              timerState.status === "running" ? timerState.activeSegmentStartedAtMs : null,
            isPaused: timerState.status === "paused",
            accumulatedElapsedSec:
              timerState.status === "running"
                ? timerState.accumulatedElapsedSec
                : clampedElapsedSec,
          };

    writePersistedStudyTimerState(persistedState);
  }, [
    clampedElapsedSec,
    timerState.accumulatedElapsedSec,
    timerState.activeSegmentStartedAtMs,
    timerState.customMinutes,
    timerState.mode,
    timerState.plannedSec,
    timerState.sessionStartedAtMs,
    timerState.status,
  ]);

  const progress =
    timerState.plannedSec === 0
      ? 0
      : Math.max(0, Math.min(100, (clampedElapsedSec / timerState.plannedSec) * 100));

  const setMode = useCallback((mode: TimerMode) => {
    setTimerState((current) => ({ ...current, mode }));
  }, []);

  const setCustomMinutes = useCallback((minutes: number) => {
    const normalizedMinutes = Number.isFinite(minutes) ? Math.max(5, Math.floor(minutes)) : 30;
    setTimerState((current) => ({ ...current, customMinutes: normalizedMinutes }));
  }, []);

  const start = useCallback(() => {
    setTimerState((current) => {
      if (current.status === "running" || current.status === "paused") {
        return current;
      }

      const startedAtMs = Date.now();

      return {
        ...current,
        status: "running",
        plannedSec: getPresetSeconds(current.mode, presets, current.customMinutes),
        sessionStartedAtMs: startedAtMs,
        activeSegmentStartedAtMs: startedAtMs,
        accumulatedElapsedSec: 0,
      };
    });
    setNowMs(Date.now());
  }, [presets]);

  const pause = useCallback(() => {
    setTimerState((current) => {
      if (current.status !== "running" || current.activeSegmentStartedAtMs === null) {
        return current;
      }

      return {
        ...current,
        status: "paused",
        activeSegmentStartedAtMs: null,
        accumulatedElapsedSec: getRunningElapsedSec(
          current.accumulatedElapsedSec,
          current.activeSegmentStartedAtMs,
          Date.now(),
        ),
      };
    });
    setNowMs(Date.now());
  }, []);

  const resume = useCallback(() => {
    setTimerState((current) => {
      if (current.status !== "paused") {
        return current;
      }

      return {
        ...current,
        status: "running",
        activeSegmentStartedAtMs: Date.now(),
      };
    });
    setNowMs(Date.now());
  }, []);

  const reset = useCallback(() => {
    setTimerState((current) => ({
      ...current,
      status: "idle",
      plannedSec: getPresetSeconds(current.mode, presets, current.customMinutes),
      sessionStartedAtMs: null,
      activeSegmentStartedAtMs: null,
      accumulatedElapsedSec: 0,
    }));
    setNowMs(Date.now());
  }, [presets]);

  const end = useCallback(() => {
    const endedAt = new Date();
    const finalElapsedSec = Math.min(
      timerState.plannedSec,
      timerState.status === "running"
        ? getRunningElapsedSec(
            timerState.accumulatedElapsedSec,
            timerState.activeSegmentStartedAtMs,
            endedAt.getTime(),
          )
        : timerState.accumulatedElapsedSec,
    );

    setTimerState((current) => ({
      ...current,
      status: "completed",
      activeSegmentStartedAtMs: null,
      accumulatedElapsedSec: finalElapsedSec,
    }));

    return {
      startedAt: timerState.sessionStartedAtMs ? new Date(timerState.sessionStartedAtMs) : endedAt,
      endedAt,
      plannedMinutes: Math.round(timerState.plannedSec / 60),
      actualMinutes: Math.max(1, Math.round(finalElapsedSec / 60)),
    };
  }, [
    timerState.accumulatedElapsedSec,
    timerState.activeSegmentStartedAtMs,
    timerState.plannedSec,
    timerState.sessionStartedAtMs,
    timerState.status,
  ]);

  return {
    mode: timerState.mode,
    setMode,
    status: timerState.status,
    remainingSec,
    progress,
    customMinutes: timerState.customMinutes,
    setCustomMinutes,
    activePreset,
    totalSec,
    start,
    pause,
    resume,
    reset,
    end,
  };
};
