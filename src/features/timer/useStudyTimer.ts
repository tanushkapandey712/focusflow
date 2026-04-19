import { useEffect, useMemo, useState } from "react";
import type { TimerMode, TimerPreset, TimerStatus } from "./types";

interface UseStudyTimerOptions {
  presets: TimerPreset[];
}

export const useStudyTimer = ({ presets }: UseStudyTimerOptions) => {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [customMinutes, setCustomMinutes] = useState(30);
  const [remainingSec, setRemainingSec] = useState(25 * 60);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [plannedSec, setPlannedSec] = useState(25 * 60);

  const activePreset = useMemo(
    () => presets.find((preset) => preset.mode === mode) ?? presets[0],
    [mode, presets],
  );

  const totalSec = mode === "custom" ? customMinutes * 60 : activePreset.minutes * 60;

  useEffect(() => {
    if (status !== "idle") return;
    setRemainingSec(totalSec);
    setPlannedSec(totalSec);
  }, [status, totalSec]);

  useEffect(() => {
    if (status !== "running") return;
    const interval = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setStatus("completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  const progress = plannedSec === 0 ? 0 : ((plannedSec - remainingSec) / plannedSec) * 100;

  const start = () => {
    setPlannedSec(totalSec);
    setRemainingSec(totalSec);
    setStartedAt(new Date());
    setStatus("running");
  };

  const pause = () => setStatus("paused");
  const resume = () => setStatus("running");
  const reset = () => {
    setStatus("idle");
    setRemainingSec(totalSec);
    setStartedAt(null);
    setPlannedSec(totalSec);
  };

  const end = () => {
    const endedAt = new Date();
    const actualSec =
      startedAt && status !== "idle" ? Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)) : 0;
    setStatus("completed");
    return {
      startedAt: startedAt ?? endedAt,
      endedAt,
      plannedMinutes: Math.round(plannedSec / 60),
      actualMinutes: Math.max(1, Math.round(actualSec / 60)),
    };
  };

  return {
    mode,
    setMode,
    status,
    remainingSec,
    progress,
    customMinutes,
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
