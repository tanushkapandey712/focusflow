import { Sparkles } from "lucide-react";
import type { Subject, SyllabusTopic, SyllabusUnit } from "../../types/models";
import {
  getNextSubjectTopicToStudy,
  getSyllabusStats,
  getTopicProgressLabel,
} from "../../utils/syllabus";
import { cn } from "../../lib/cn";
import type { TimerMode, TimerPreset, TimerStatus } from "./types";
import { TimerPresetSelector } from "./TimerPresetSelector";
import { TimerDisplay } from "./TimerDisplay";
import { TimerSetupWizard } from "./TimerSetupWizard";
import { TimerSummaryPanel } from "./TimerSummaryPanel";

const DISTRACTION_OPTIONS = ["Phone", "Tabs", "Noise", "Low energy"];

interface TimerCardProps {
  subjects: Subject[];
  selectedSubject?: Subject;
  selectedSubjectId: string;
  onSelectSubject: (value: string) => void;
  availableUnits: SyllabusUnit[];
  selectedUnit?: SyllabusUnit;
  selectedUnitId: string;
  onSelectUnit: (value: string) => void;
  availableTopics: SyllabusTopic[];
  selectedTopic?: SyllabusTopic;
  selectedTopicId: string;
  onSelectTopic: (value: string) => void;
  goal: string;
  onGoalChange: (value: string) => void;
  distractionTags: string[];
  onDistractionTagsChange: (value: string[]) => void;
  presets: TimerPreset[];
  mode: TimerMode;
  onModeChange: (value: TimerMode) => void;
  customMinutes: number;
  onCustomMinutesChange: (value: number) => void;
  timerText: string;
  status: TimerStatus;
  progress: number;
  accent: "teal" | "indigo";
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onReset: () => void;
  onOpenSyllabusMap: () => void;
  manualDistractionCount: number;
  onLogManualDistraction: () => void;
}

const getStatusCopy = (status: TimerStatus, isReady: boolean) => {
  if (status === "running") {
    return {
      label: "In Session",
      tone: "text-emerald-600 dark:text-emerald-300",
      message: "Stay with the current block. Your timer and topic link are already locked in.",
    };
  }

  if (status === "paused") {
    return {
      label: "Paused",
      tone: "text-amber-600 dark:text-amber-300",
      message: "Resume when you're ready, or reset if you want to rebuild the setup.",
    };
  }

  if (status === "completed") {
    return {
      label: "Completed",
      tone: "text-blue-600 dark:text-blue-300",
      message: "Wrap this block, log the session, and choose the next topic while it's still fresh.",
    };
  }

  return {
    label: isReady ? "Ready to Start" : "Setup Needed",
    tone: isReady ? "text-blue-600 dark:text-blue-300" : "text-slate-600 dark:text-slate-300",
    message: isReady
      ? "Your session plan is clear. Start when you're ready to focus."
      : "Use the setup steps to make the next study block specific before you start.",
  };
};

const getNextAction = (params: {
  hasSubjects: boolean;
  hasSelectedSubject: boolean;
  hasUnits: boolean;
  hasTopics: boolean;
  hasGoal: boolean;
  status: TimerStatus;
}) => {
  if (!params.hasSubjects) {
    return "Add your first subject to anchor this study session.";
  }

  if (!params.hasSelectedSubject) {
    return "Choose a subject first so the rest of the session can stay linked.";
  }

  if (!params.hasUnits) {
    return "Add at least one syllabus unit so sessions can roll up into meaningful progress.";
  }

  if (!params.hasTopics) {
    return "Add a topic inside this unit so the session can update topic progress automatically.";
  }

  if (!params.hasGoal) {
    return "Add a short session goal so this block starts with a concrete outcome.";
  }

  if (params.status === "running") {
    return "Stay with the timer. This block is already active.";
  }

  if (params.status === "paused") {
    return "Resume this block when you're ready, or reset it to choose a different topic.";
  }

  if (params.status === "completed") {
    return "End and save this session, then pick the next topic while the momentum is still there.";
  }

  return "Everything is set. Start the timer when you're ready to begin.";
};

export const TimerCard = ({
  subjects,
  selectedSubject,
  selectedSubjectId,
  onSelectSubject,
  availableUnits,
  selectedUnit,
  selectedUnitId,
  onSelectUnit,
  availableTopics,
  selectedTopic,
  selectedTopicId,
  onSelectTopic,
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
  onOpenSyllabusMap,
  manualDistractionCount,
  onLogManualDistraction,
}: TimerCardProps) => {
  const activePreset = presets.find((preset) => preset.mode === mode) ?? presets[0];
  const plannedMinutes = mode === "custom" ? customMinutes : activePreset.minutes;
  const normalizedGoal = goal.trim();
  const hasSubjects = subjects.length > 0;
  const hasSubject = Boolean(selectedSubject);
  const hasUnits = availableUnits.length > 0;
  const hasTopics = availableTopics.length > 0;
  const hasGoal = normalizedGoal.length > 0;
  const isReady = hasSubject && hasGoal;
  const statusCopy = getStatusCopy(status, isReady);
  const nextAction = getNextAction({
    hasSubjects,
    hasSelectedSubject: hasSubject,
    hasUnits,
    hasTopics,
    hasGoal,
    status,
  });
  const subjectStats = selectedSubject ? getSyllabusStats(selectedSubject) : null;
  const nextSubjectTopic = selectedSubject ? getNextSubjectTopicToStudy(selectedSubject) : null;
  const selectedTopicStatus = selectedTopic ? getTopicProgressLabel(selectedTopic) : null;

  const isSessionActive = status === "running" || status === "paused" || status === "completed";

  const toggleDistractionTag = (tag: string) => {
    const nextTags = distractionTags.includes(tag)
      ? distractionTags.filter((entry) => entry !== tag)
      : [...distractionTags, tag];
    onDistractionTagsChange(nextTags);
  };

  const handleStart = () => {
    if (!isReady || status !== "idle") {
      return;
    }

    onStart();
  };

  return (
    <div className="soft-surface mx-auto max-w-5xl overflow-hidden p-4 sm:p-6 lg:p-7">
      {/* Header */}
      <div className="rounded-[1.7rem] border border-blue-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(239,246,255,0.68))] p-5 shadow-[0_26px_70px_-44px_rgba(37,99,235,0.45)] dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.82))]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700/80 dark:text-blue-100/70">
              Session Setup
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {isSessionActive
                ? "Session in progress"
                : "Build one clear study block before you start the clock."}
            </h2>
            {!isSessionActive ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Pick the subject, link the exact syllabus topic, define the outcome, then start.
              </p>
            ) : null}
          </div>

          <div className="surface-pill flex flex-wrap items-center gap-2 self-start px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-300" />
            {statusCopy.label}
          </div>
        </div>

        {/* Session context breadcrumb */}
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="max-w-full rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
              {selectedSubject?.name ?? "No subject selected"}
            </span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="max-w-full truncate text-sm font-medium text-slate-600 dark:text-slate-300">
              {selectedUnit?.title ?? "No unit linked"}
            </span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="max-w-full truncate text-sm font-medium text-slate-600 dark:text-slate-300">
              {selectedTopic?.title ?? "No topic linked"}
            </span>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="surface-pill px-3 py-2">{plannedMinutes} min block</span>
            <span className="surface-pill max-w-full truncate px-3 py-2 sm:max-w-[18rem]">
              {normalizedGoal || "Goal still needed"}
            </span>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
        {/* Left column: Presets + Timer */}
        <div className="space-y-5">
          <div className="rounded-[1.9rem] border border-blue-200/80 bg-[linear-gradient(180deg,rgba(219,234,254,0.72),rgba(255,255,255,0.94))] p-5 shadow-[0_28px_80px_-48px_rgba(37,99,235,0.48)] dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
            {/* Preset selector — hidden when active */}
            {!isSessionActive ? (
              <div className="mb-5">
                <TimerPresetSelector
                  presets={presets}
                  mode={mode}
                  onModeChange={onModeChange}
                  customMinutes={customMinutes}
                  onCustomMinutesChange={onCustomMinutesChange}
                />
              </div>
            ) : null}

            {/* Timer display */}
            <TimerDisplay
              timerText={timerText}
              status={status}
              progress={progress}
              accent={accent}
              statusLabel={statusCopy.label}
              statusMessage={statusCopy.message}
              statusTone={statusCopy.tone}
              isReady={isReady}
              nextAction={nextAction}
              onStart={handleStart}
              onPause={onPause}
              onResume={onResume}
              onEnd={onEnd}
              onReset={onReset}
              manualDistractionCount={manualDistractionCount}
              onLogManualDistraction={onLogManualDistraction}
            />
          </div>

          {/* Summary tiles */}
          <TimerSummaryPanel
            statusLabel={statusCopy.label}
            plannedMinutes={plannedMinutes}
            presetLabel={activePreset.label}
            status={status}
            selectedTopicTitle={selectedTopic?.title}
            selectedUnitTitle={selectedUnit?.title}
            hasSubject={hasSubject}
            selectedTopicStatus={selectedTopicStatus}
            subjectCompletionPercent={subjectStats?.completionPercent ?? null}
            subjectCoveredTopics={subjectStats?.coveredTopicCount}
            subjectTotalTopics={subjectStats?.topicCount}
            nextTopicTitle={nextSubjectTopic?.topic.title}
          />
        </div>

        {/* Right column: Setup wizard + extras */}
        <div className="space-y-4">
          {/* Setup wizard — auto-collapses completed steps */}
          <TimerSetupWizard
            subjects={subjects}
            selectedSubject={selectedSubject}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={onSelectSubject}
            availableUnits={availableUnits}
            selectedUnit={selectedUnit}
            selectedUnitId={selectedUnitId}
            onSelectUnit={onSelectUnit}
            availableTopics={availableTopics}
            selectedTopic={selectedTopic}
            selectedTopicId={selectedTopicId}
            onSelectTopic={onSelectTopic}
            goal={goal}
            onGoalChange={onGoalChange}
            onOpenSyllabusMap={onOpenSyllabusMap}
            disabled={isSessionActive}
          />

          {/* Next-action guidance */}
          <div className="rounded-[1.55rem] border border-white/80 bg-white/78 p-4 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-950/46">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                <Sparkles size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  What to do next
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{nextAction}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-white/70 bg-white/70 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Suggested next topic
                </span>
                <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">
                  {selectedTopic?.title ?? nextSubjectTopic?.topic.title ?? "Choose a subject to see the next topic"}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/70 bg-white/70 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Setup readiness
                </span>
                <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">
                  {[hasSubject, hasUnits || !hasSubject, hasTopics || !hasUnits || !hasSubject, hasGoal].filter(Boolean).length}/4 steps ready
                </p>
              </div>
            </div>
          </div>

          {/* Distraction watchouts */}
          <div className="rounded-[1.55rem] border border-white/80 bg-white/78 p-4 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-950/46">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Watchouts
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Optional context for what might pull this session off track.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {DISTRACTION_OPTIONS.map((tag) => {
                const active = distractionTags.includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDistractionTag(tag.toLowerCase())}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm font-medium transition duration-200",
                      active
                        ? "border-blue-500/30 bg-blue-600 text-white shadow-[0_16px_30px_-22px_rgba(37,99,235,0.7)]"
                        : "border-white/80 bg-white/80 text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-blue-400/20 dark:hover:text-blue-200",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
