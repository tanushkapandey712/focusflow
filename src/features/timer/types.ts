export type TimerMode = "pomodoro" | "deep-work" | "custom";
export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface TimerPreset {
  mode: TimerMode;
  label: string;
  minutes: number;
  accent: "teal" | "indigo";
}

export const TIMER_PRESETS: TimerPreset[] = [
  { mode: "pomodoro", label: "Pomodoro", minutes: 25, accent: "indigo" },
  { mode: "deep-work", label: "Deep Work", minutes: 50, accent: "teal" },
  { mode: "custom", label: "Custom", minutes: 30, accent: "indigo" },
];
