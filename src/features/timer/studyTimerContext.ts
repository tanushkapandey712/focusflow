import { createContext } from "react";
import type { TimerMode, TimerPreset, TimerStatus } from "./types";

export interface StudyTimerSessionValue {
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  status: TimerStatus;
  remainingSec: number;
  progress: number;
  customMinutes: number;
  setCustomMinutes: (minutes: number) => void;
  activePreset: TimerPreset;
  totalSec: number;
  selectedSubjectId: string;
  setSelectedSubjectId: (subjectId: string) => void;
  selectedUnitId: string;
  setSelectedUnitId: (unitId: string) => void;
  selectedTopicId: string;
  setSelectedTopicId: (topicId: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
  distractionTags: string[];
  setDistractionTags: (next: string[]) => void;
  manualDistractionCount: number;
  logManualDistraction: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  end: () => {
    startedAt: Date;
    endedAt: Date;
    plannedMinutes: number;
    actualMinutes: number;
  };
  resetSessionForm: () => void;
}

export const StudyTimerContext = createContext<StudyTimerSessionValue | null>(null);
