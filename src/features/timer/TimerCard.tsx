import type { ReactNode } from "react";
import {
  AlertCircle,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FolderTree,
  Goal,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Target,
} from "lucide-react";
import type { Subject, SyllabusTopic, SyllabusUnit } from "../../types/models";
import {
  getNextSubjectTopicToStudy,
  getSyllabusStats,
  getTopicProgressLabel,
  getTopicStatusTone,
} from "../../utils/syllabus";
import { Button } from "../../components/ui";
import { cn } from "../../lib/cn";
import type { TimerMode, TimerPreset, TimerStatus } from "./types";

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
  onOpenSyllabusMap?: () => void;
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

const SetupStep = ({
  step,
  title,
  description,
  complete,
  children,
}: {
  step: number;
  title: string;
  description: string;
  complete: boolean;
  children: ReactNode;
}) => (
  <div className="rounded-[1.5rem] border border-white/80 bg-white/75 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/45">
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
          complete
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
            : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
        )}
      >
        {complete ? <CheckCircle2 size={16} /> : step}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
              complete
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            {complete ? "Ready" : "Next"}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </div>
);

const SummaryTile = ({
  icon,
  label,
  value,
  supporting,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  supporting: string;
  tone?: "default" | "blue";
}) => (
  <div
    className={cn(
      "rounded-[1.45rem] border p-4 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.2)]",
      tone === "blue"
        ? "border-blue-200/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.96),rgba(255,255,255,0.88))] dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.76))]"
        : "border-white/80 bg-white/74 dark:border-white/10 dark:bg-slate-950/44",
    )}
  >
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {icon}
      {label}
    </div>
    <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{supporting}</p>
  </div>
);

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
  const selectedTopicTone = selectedTopic ? getTopicStatusTone(selectedTopic) : "";

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
      <div className="rounded-[1.7rem] border border-blue-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(239,246,255,0.68))] p-5 shadow-[0_26px_70px_-44px_rgba(37,99,235,0.45)] dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.82))]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700/80 dark:text-blue-100/70">
              Session Setup
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              Build one clear study block before you start the clock.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Pick the subject, link the exact syllabus topic, define the outcome, then start with a
              block that already knows what progress to update.
            </p>
          </div>

          <div className="surface-pill flex flex-wrap items-center gap-2 self-start px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-300" />
            {statusCopy.label}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
              {selectedSubject?.name ?? "No subject selected"}
            </span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {selectedUnit?.title ?? "No unit linked"}
            </span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {selectedTopic?.title ?? "No topic linked"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="surface-pill px-3 py-2">{plannedMinutes} min block</span>
            <span className="surface-pill px-3 py-2">{normalizedGoal || "Goal still needed"}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
        <div className="space-y-5">
          <div className="rounded-[1.9rem] border border-blue-200/80 bg-[linear-gradient(180deg,rgba(219,234,254,0.72),rgba(255,255,255,0.94))] p-5 shadow-[0_28px_80px_-48px_rgba(37,99,235,0.48)] dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
            <div className="flex flex-wrap gap-3">
              {presets.map((preset) => {
                const isActive = preset.mode === mode;

                return (
                  <button
                    key={preset.mode}
                    type="button"
                    onClick={() => onModeChange(preset.mode)}
                    className={cn(
                      "rounded-[1.35rem] border px-4 py-3 text-left transition duration-300",
                      isActive
                        ? "border-blue-500/40 bg-blue-600 text-white shadow-[0_20px_44px_-28px_rgba(37,99,235,0.7)]"
                        : "border-white/80 bg-white/82 text-slate-700 hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-100 dark:hover:border-blue-400/15",
                    )}
                  >
                    <p className="text-sm font-semibold">{preset.label}</p>
                    <p className={cn("mt-1 text-xs", isActive ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
                      {preset.mode === "custom" ? `${customMinutes} min` : `${preset.minutes} min`}
                    </p>
                  </button>
                );
              })}
            </div>

            {mode === "custom" ? (
              <div className="mt-4 max-w-xs">
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Custom Duration
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={customMinutes}
                  onChange={(event) => onCustomMinutesChange(Number(event.target.value) || 5)}
                  className="field-surface mt-2"
                />
              </div>
            ) : null}

            <div className="mt-5 rounded-[1.8rem] border border-blue-200/70 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),rgba(255,255,255,0.96)_58%)] px-5 py-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_22px_65px_-44px_rgba(37,99,235,0.45)] dark:border-blue-400/10 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.24),rgba(15,23,42,0.96)_60%)] sm:px-8 sm:py-9">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700/80 dark:text-blue-100/70">
                Focus Timer
              </p>
              <div
                className={cn(
                  "mt-4 text-6xl font-semibold tracking-[-0.08em] text-slate-950 drop-shadow-[0_16px_40px_rgba(37,99,235,0.18)] sm:text-7xl lg:text-[5.5rem]",
                  accent === "teal" ? "dark:text-cyan-50" : "dark:text-blue-50",
                )}
              >
                {timerText}
              </div>
              <p className={cn("mt-3 text-sm font-medium", statusCopy.tone)}>{statusCopy.message}</p>

              <div className="mx-auto mt-6 max-w-xl">
                <div className="h-3 overflow-hidden rounded-full bg-blue-100/80 dark:bg-slate-800/90">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      accent === "teal"
                        ? "bg-[linear-gradient(90deg,#0891b2,#22d3ee)]"
                        : "bg-[linear-gradient(90deg,#2563eb,#60a5fa)]",
                    )}
                    style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <span>{statusCopy.label}</span>
                  <span>{Math.round(progress)}% elapsed</span>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                {status === "idle" ? (
                  <Button
                    onClick={handleStart}
                    disabled={!isReady}
                    className="h-14 rounded-[1.5rem] px-7 text-base shadow-[0_24px_55px_-28px_rgba(37,99,235,0.75)]"
                  >
                    <Play size={18} />
                    Start Session
                  </Button>
                ) : null}

                {status === "running" ? (
                  <Button
                    variant="secondary"
                    onClick={onPause}
                    className="h-14 rounded-[1.5rem] px-6 text-base"
                  >
                    <Pause size={18} />
                    Pause
                  </Button>
                ) : null}

                {status === "paused" ? (
                  <Button
                    onClick={onResume}
                    className="h-14 rounded-[1.5rem] px-7 text-base shadow-[0_24px_55px_-28px_rgba(37,99,235,0.75)]"
                  >
                    <Play size={18} />
                    Resume
                  </Button>
                ) : null}

                {(status === "running" || status === "paused" || status === "completed") ? (
                  <Button
                    variant="secondary"
                    onClick={onReset}
                    className="h-14 rounded-[1.5rem] px-6 text-base"
                  >
                    <RotateCcw size={18} />
                    Reset
                  </Button>
                ) : null}

                {(status === "running" || status === "paused" || status === "completed") ? (
                  <Button
                    variant="secondary"
                    onClick={onEnd}
                    className="h-14 rounded-[1.5rem] px-6 text-base"
                  >
                    <Square size={18} />
                    End Session
                  </Button>
                ) : null}
              </div>

              {!isReady && status === "idle" ? (
                <div className="mx-auto mt-5 max-w-2xl rounded-[1.4rem] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-left text-sm text-amber-800 shadow-[0_18px_36px_-28px_rgba(217,119,6,0.35)] dark:border-amber-400/15 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>{nextAction}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryTile
              icon={<Clock3 size={14} className="text-blue-600 dark:text-blue-300" />}
              label="Block Status"
              value={statusCopy.label}
              supporting={`${plannedMinutes} minute ${activePreset.label.toLowerCase()} block with ${status === "idle" ? "setup guidance" : "live progress"}.`}
              tone="blue"
            />
            <SummaryTile
              icon={<FolderTree size={14} className="text-blue-600 dark:text-blue-300" />}
              label="Linked Topic"
              value={selectedTopic?.title ?? "No topic linked yet"}
              supporting={
                selectedTopic
                  ? `${selectedUnit?.title ?? "Current unit"} • ${selectedTopicStatus ?? "Ready"}`
                  : hasSubject
                    ? "Pick or add a topic so this session updates syllabus progress."
                    : "Choose a subject first to unlock unit and topic linking."
              }
            />
            <SummaryTile
              icon={<Target size={14} className="text-blue-600 dark:text-blue-300" />}
              label="Subject Progress"
              value={subjectStats ? `${subjectStats.completionPercent}% complete` : "No subject context"}
              supporting={
                subjectStats
                  ? `${subjectStats.coveredTopicCount}/${subjectStats.topicCount} topics touched${nextSubjectTopic ? ` • Next: ${nextSubjectTopic.topic.title}` : ""}`
                  : "Once a subject is selected, this panel shows where the next session should go."
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <SetupStep
            step={1}
            title="Choose Subject"
            description="Anchor the session to one subject so the timer and syllabus progress stay connected."
            complete={hasSubject}
          >
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(event) => onSelectSubject(event.target.value)}
              className="field-surface mt-2"
            >
              {hasSubjects ? null : <option value="">No subjects yet</option>}
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            {!hasSubjects ? (
              <div className="mt-3 rounded-[1.25rem] border border-blue-200/80 bg-blue-50/80 p-3 text-sm text-blue-800 dark:border-blue-400/15 dark:bg-blue-500/10 dark:text-blue-100">
                <p>No subjects are available yet. Add one in Syllabus Map, then come back here to start a linked session.</p>
                {onOpenSyllabusMap ? (
                  <Button
                    variant="secondary"
                    onClick={onOpenSyllabusMap}
                    className="mt-3 rounded-full px-4"
                  >
                    <BookMarked size={15} />
                    Open Syllabus Map
                  </Button>
                ) : null}
              </div>
            ) : null}
          </SetupStep>

          <SetupStep
            step={2}
            title="Select Unit"
            description="Pick the chapter or unit that this study block should contribute to."
            complete={hasSubject && hasUnits && Boolean(selectedUnit)}
          >
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Unit
            </label>
            <select
              value={selectedUnitId}
              onChange={(event) => onSelectUnit(event.target.value)}
              disabled={!hasSubject || !hasUnits}
              className="field-surface mt-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!hasSubject ? <option value="">Choose a subject first</option> : null}
              {hasSubject && !hasUnits ? <option value="">No units yet</option> : null}
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>

            {hasSubject && !hasUnits ? (
              <div className="mt-3 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/85 p-3 text-sm text-amber-800 dark:border-amber-400/15 dark:bg-amber-500/10 dark:text-amber-100">
                <p>This subject does not have syllabus units yet. Add one so your timer sessions can roll up into real progress.</p>
                {onOpenSyllabusMap ? (
                  <Button
                    variant="secondary"
                    onClick={onOpenSyllabusMap}
                    className="mt-3 rounded-full px-4"
                  >
                    <ChevronRight size={15} />
                    Add unit in Syllabus Map
                  </Button>
                ) : null}
              </div>
            ) : null}
          </SetupStep>

          <SetupStep
            step={3}
            title="Select Topic"
            description="Connect the timer to one specific topic so the next session updates the right progress node."
            complete={hasSubject && hasUnits && hasTopics && Boolean(selectedTopic)}
          >
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Topic
            </label>
            <select
              value={selectedTopicId}
              onChange={(event) => onSelectTopic(event.target.value)}
              disabled={!hasSubject || !hasUnits || !hasTopics}
              className="field-surface mt-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!hasSubject ? <option value="">Choose a subject first</option> : null}
              {hasSubject && hasUnits && !hasTopics ? <option value="">No topics yet</option> : null}
              {availableTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>

            {selectedTopic ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", selectedTopicTone)}>
                  {selectedTopicStatus}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedTopic.studiedMinutes > 0
                    ? `${selectedTopic.studiedMinutes} min already tracked here`
                    : "This topic is ready to receive its first linked session."}
                </span>
              </div>
            ) : null}

            {hasSubject && hasUnits && !hasTopics ? (
              <div className="mt-3 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/85 p-3 text-sm text-amber-800 dark:border-amber-400/15 dark:bg-amber-500/10 dark:text-amber-100">
                <p>Add at least one topic inside this unit so the timer can update progress automatically after the session ends.</p>
                {onOpenSyllabusMap ? (
                  <Button
                    variant="secondary"
                    onClick={onOpenSyllabusMap}
                    className="mt-3 rounded-full px-4"
                  >
                    <ChevronRight size={15} />
                    Add topic in Syllabus Map
                  </Button>
                ) : null}
              </div>
            ) : null}
          </SetupStep>

          <SetupStep
            step={4}
            title="Define Goal"
            description="Write the outcome you want from this block so the timer starts with a concrete finish line."
            complete={hasGoal}
          >
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Goal
            </label>
            <input
              value={goal}
              onChange={(event) => onGoalChange(event.target.value)}
              placeholder={selectedTopic ? `Review ${selectedTopic.title}` : "Example: Finish worked examples and revise notes"}
              className="field-surface mt-2"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {selectedTopic && !hasGoal ? (
                <Button
                  variant="secondary"
                  onClick={() => onGoalChange(`Study ${selectedTopic.title}`)}
                  className="rounded-full px-4"
                >
                  <Goal size={15} />
                  Use selected topic as goal
                </Button>
              ) : null}

              <span className="text-sm text-slate-600 dark:text-slate-300">
                {hasGoal
                  ? "Clear goal set. This session now has a defined outcome."
                  : "Add one short sentence so the session has a clear direction before it starts."}
              </span>
            </div>
          </SetupStep>

          <div className="rounded-[1.55rem] border border-white/80 bg-white/78 p-4 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-950/46">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                <Sparkles size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  What the page wants you to do next
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
