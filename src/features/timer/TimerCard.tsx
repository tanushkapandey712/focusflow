import { Pause, Play, Square, StopCircle } from "lucide-react";
import { SubjectBadge } from "../../components/subjects/SubjectBadge";
import { Button } from "../../components/ui";
import { cn } from "../../lib/cn";
import type { Subject } from "../../types/models";
import { getResolvedSubject, getSubjectVisuals } from "../../utils/subjects";
import { DistractionSelector } from "./DistractionSelector";
import type { TimerPreset, TimerStatus } from "./types";

interface TimerCardProps {
  subjects: Subject[];
  selectedSubject?: Subject;
  selectedSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  goal: string;
  onGoalChange: (value: string) => void;
  distractionTags: string[];
  onDistractionTagsChange: (next: string[]) => void;
  presets: TimerPreset[];
  mode: TimerPreset["mode"];
  onModeChange: (mode: TimerPreset["mode"]) => void;
  customMinutes: number;
  onCustomMinutesChange: (minutes: number) => void;
  timerText: string;
  status: TimerStatus;
  progress: number;
  accent: TimerPreset["accent"];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onReset: () => void;
}

const accentClass = {
  teal: "from-teal-400 via-emerald-300 to-cyan-200",
  indigo: "from-indigo-500 via-violet-400 to-sky-200",
};

export const TimerCard = ({
  subjects,
  selectedSubject,
  selectedSubjectId,
  onSelectSubject,
  goal,
  onGoalChange,
  distractionTags,
  onDistractionTagsChange,
  presets,
  mode,
  onModeChange,
  customMinutes,
  onCustomMinutesChange,
  timerText,
  status,
  progress,
  accent,
  onStart,
  onPause,
  onResume,
  onEnd,
  onReset,
}: TimerCardProps) => {
  const resolvedSubject = selectedSubject
    ? getResolvedSubject([selectedSubject], { subjectId: selectedSubject.id, subjectName: selectedSubject.name })
    : undefined;
  const subjectVisuals = resolvedSubject ? getSubjectVisuals(resolvedSubject.color) : undefined;

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] bg-gradient-to-br p-[1px] shadow-panel transition-all duration-500",
        accentClass[accent],
      )}
    >
      <div className="relative rounded-[2rem] bg-white/90 p-5 backdrop-blur-xl dark:bg-surface-900/88 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_30%)]" />
        <div className="relative space-y-7 text-center">
          <div className="space-y-3">
            <div className="surface-pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
              FocusFlow Timer
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[4.75rem]">
              {timerText}
            </h1>
            {resolvedSubject ? (
              <div className="flex justify-center">
                <SubjectBadge subject={resolvedSubject} />
              </div>
            ) : null}
          </div>

          <div className="mx-auto h-2.5 w-full max-w-md overflow-hidden rounded-full bg-slate-200/70 shadow-inner dark:bg-slate-700/80">
            <div
              className={cn(
                "h-2.5 rounded-full transition-all duration-700 ease-out",
                !subjectVisuals && (accent === "teal" ? "bg-teal-500" : "bg-indigo-500"),
              )}
              style={{
                width: `${Math.max(0, Math.min(100, progress))}%`,
                ...(subjectVisuals?.fillStyle ?? {}),
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.mode}
                onClick={() => onModeChange(preset.mode)}
                disabled={status === "running" || status === "paused"}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                  mode === preset.mode
                    ? "bg-white text-slate-900 shadow-soft dark:bg-surface-800 dark:text-white"
                    : "bg-white/58 text-slate-600 hover:bg-white/85 dark:bg-surface-800/80 dark:text-slate-300 dark:hover:bg-surface-800",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 text-left sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Subject
              </span>
              <select
                value={selectedSubjectId}
                onChange={(e) => onSelectSubject(e.target.value)}
                disabled={status === "running" || status === "paused"}
                className="field-surface"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Session Goal
              </span>
              <input
                value={goal}
                onChange={(e) => onGoalChange(e.target.value)}
                placeholder="Finish chapter summary"
                disabled={status === "running" || status === "paused"}
                className="field-surface"
              />
            </label>
          </div>

          {resolvedSubject ? (
            <div
              className="grid gap-3 rounded-[1.75rem] border px-4 py-4 text-left sm:grid-cols-3"
              style={subjectVisuals?.panelStyle}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Active Subject
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {resolvedSubject.name}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Session Mode
                </p>
                <p className="mt-2 text-base font-semibold capitalize text-slate-900 dark:text-slate-100">
                  {mode.replace("-", " ")}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Progress
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          ) : null}

          <DistractionSelector
            selected={distractionTags}
            onChange={onDistractionTagsChange}
            disabled={status === "completed"}
          />

          {mode === "custom" ? (
            <div className="mx-auto max-w-xs text-left">
              <label className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Custom Minutes
                </span>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={customMinutes}
                  onChange={(e) => onCustomMinutesChange(Number(e.target.value))}
                  disabled={status === "running" || status === "paused"}
                  className="field-surface"
                />
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {status === "idle" || status === "completed" ? (
              <Button onClick={onStart} className="rounded-full px-7 text-base">
                <Play size={16} className="mr-1" />
                Start
              </Button>
            ) : null}

            {status === "running" ? (
              <>
                <Button variant="secondary" onClick={onPause} className="rounded-full px-6">
                  <Pause size={16} className="mr-1" />
                  Pause
                </Button>
                <Button variant="secondary" onClick={onEnd} className="rounded-full px-6">
                  <StopCircle size={16} className="mr-1" />
                  End Session
                </Button>
              </>
            ) : null}

            {status === "paused" ? (
              <>
                <Button onClick={onResume} className="rounded-full px-7 text-base">
                  <Play size={16} className="mr-1" />
                  Resume
                </Button>
                <Button variant="secondary" onClick={onEnd} className="rounded-full px-6">
                  <StopCircle size={16} className="mr-1" />
                  End Session
                </Button>
              </>
            ) : null}

            {status === "completed" ? (
              <Button variant="secondary" onClick={onReset} className="rounded-full px-6">
                <Square size={16} className="mr-1" />
                Reset
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
