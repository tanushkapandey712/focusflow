import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertCircle,
  BookMarked,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Goal,
} from "lucide-react";
import type { Subject, SyllabusTopic, SyllabusUnit } from "../../types/models";
import { Button } from "../../components/ui";
import { cn } from "../../lib/cn";
import { getTopicProgressLabel, getTopicStatusTone } from "../../utils/syllabus";

interface TimerSetupWizardProps {
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
  onOpenSyllabusMap?: () => void;
  disabled?: boolean;
}

interface StepConfig {
  key: string;
  step: number;
  title: string;
  description: string;
  complete: boolean;
  children: ReactNode;
  warningNode?: ReactNode;
}

const SetupStepCollapsed = ({
  step,
  title,
  complete,
  summary,
  onClick,
}: {
  step: number;
  title: string;
  complete: boolean;
  summary: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition-all duration-200 hover:shadow-[0_8px_20px_-12px_rgba(15,23,42,0.15)]",
      complete
        ? "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-500/15 dark:bg-emerald-500/5"
        : "border-white/80 bg-white/60 dark:border-white/10 dark:bg-slate-950/30",
    )}
  >
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
        complete
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
          : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
      )}
    >
      {complete ? <CheckCircle2 size={14} /> : step}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{summary}</p>
    </div>
    <ChevronDown size={16} className="shrink-0 text-slate-400" />
  </button>
);

const SetupStepExpanded = ({
  step,
  title,
  description,
  complete,
  children,
  warningNode,
  onCollapse,
}: {
  step: number;
  title: string;
  description: string;
  complete: boolean;
  children: ReactNode;
  warningNode?: ReactNode;
  onCollapse: () => void;
}) => (
  <div className="animate-fade-up rounded-[1.5rem] border border-blue-200/70 bg-white/75 p-4 shadow-[0_18px_40px_-34px_rgba(37,99,235,0.2)] backdrop-blur dark:border-blue-400/12 dark:bg-slate-950/45">
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
      <button
        type="button"
        onClick={onCollapse}
        className="mt-1 shrink-0 rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <ChevronDown size={16} className="rotate-180" />
      </button>
    </div>
    <div className="mt-4">{children}</div>
    {warningNode}
  </div>
);

export const TimerSetupWizard = ({
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
  onOpenSyllabusMap,
  disabled = false,
}: TimerSetupWizardProps) => {
  const hasSubjects = subjects.length > 0;
  const hasSubject = Boolean(selectedSubject);
  const hasUnits = availableUnits.length > 0;
  const hasTopics = availableTopics.length > 0;
  const hasGoal = goal.trim().length > 0;
  const selectedTopicStatus = selectedTopic ? getTopicProgressLabel(selectedTopic) : null;
  const selectedTopicTone = selectedTopic ? getTopicStatusTone(selectedTopic) : "";

  // Auto-expand first incomplete step
  const getFirstIncompleteStep = () => {
    if (!hasSubject) return "subject";
    if (!hasUnits || !selectedUnit) return "unit";
    if (!hasTopics || !selectedTopic) return "topic";
    if (!hasGoal) return "goal";
    return null;
  };

  const [expandedStep, setExpandedStep] = useState<string | null>(getFirstIncompleteStep);

  const steps: StepConfig[] = [
    {
      key: "subject",
      step: 1,
      title: "Choose Subject",
      description: "Anchor the session to one subject.",
      complete: hasSubject,
      children: (
        <>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(event) => onSelectSubject(event.target.value)}
            disabled={disabled}
            className="field-surface mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasSubjects ? null : <option value="">No subjects yet</option>}
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </>
      ),
      warningNode:
        !hasSubjects ? (
          <div className="mt-3 rounded-[1.25rem] border border-blue-200/80 bg-blue-50/80 p-3 text-sm text-blue-800 dark:border-blue-400/15 dark:bg-blue-500/10 dark:text-blue-100">
            <p>No subjects yet. Add one in Syllabus Map.</p>
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
        ) : undefined,
    },
    {
      key: "unit",
      step: 2,
      title: "Select Unit",
      description: "Pick the chapter this session contributes to.",
      complete: hasSubject && hasUnits && Boolean(selectedUnit),
      children: (
        <>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Unit
          </label>
          <select
            value={selectedUnitId}
            onChange={(event) => onSelectUnit(event.target.value)}
            disabled={disabled || !hasSubject || !hasUnits}
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
        </>
      ),
      warningNode:
        hasSubject && !hasUnits ? (
          <div className="mt-3 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/85 p-3 text-sm text-amber-800 dark:border-amber-400/15 dark:bg-amber-500/10 dark:text-amber-100">
            <p>Add at least one unit in Syllabus Map.</p>
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
        ) : undefined,
    },
    {
      key: "topic",
      step: 3,
      title: "Select Topic",
      description: "Connect to one specific topic for progress tracking.",
      complete: hasSubject && hasUnits && hasTopics && Boolean(selectedTopic),
      children: (
        <>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Topic
          </label>
          <select
            value={selectedTopicId}
            onChange={(event) => onSelectTopic(event.target.value)}
            disabled={disabled || !hasSubject || !hasUnits || !hasTopics}
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
                  ? `${selectedTopic.studiedMinutes} min tracked`
                  : "Ready for its first session."}
              </span>
            </div>
          ) : null}
        </>
      ),
      warningNode:
        hasSubject && hasUnits && !hasTopics ? (
          <div className="mt-3 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/85 p-3 text-sm text-amber-800 dark:border-amber-400/15 dark:bg-amber-500/10 dark:text-amber-100">
            <p>Add a topic inside this unit for auto progress tracking.</p>
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
        ) : undefined,
    },
    {
      key: "goal",
      step: 4,
      title: "Define Goal",
      description: "Write the outcome you want from this block.",
      complete: hasGoal,
      children: (
        <>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Goal
          </label>
          <input
            value={goal}
            onChange={(event) => onGoalChange(event.target.value)}
            disabled={disabled}
            placeholder={selectedTopic ? `Review ${selectedTopic.title}` : "Example: Finish worked examples and revise notes"}
            className="field-surface mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedTopic && !hasGoal ? (
              <Button
                variant="secondary"
                onClick={() => onGoalChange(`Study ${selectedTopic.title}`)}
                className="rounded-full px-4"
              >
                <Goal size={15} />
                Use topic as goal
              </Button>
            ) : null}
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {hasGoal ? "✓ Goal set" : "A short sentence gives the session direction."}
            </span>
          </div>
        </>
      ),
    },
  ];

  const getSummary = (stepConfig: StepConfig) => {
    switch (stepConfig.key) {
      case "subject":
        return selectedSubject?.name ?? "Not selected";
      case "unit":
        return selectedUnit?.title ?? "Not linked";
      case "topic":
        return selectedTopic?.title ?? "Not linked";
      case "goal":
        return goal.trim() || "Not set";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-2">
      {steps.map((stepConfig) => {
        const isExpanded = expandedStep === stepConfig.key;

        if (isExpanded) {
          return (
            <SetupStepExpanded
              key={stepConfig.key}
              step={stepConfig.step}
              title={stepConfig.title}
              description={stepConfig.description}
              complete={stepConfig.complete}
              warningNode={stepConfig.warningNode}
              onCollapse={() => setExpandedStep(null)}
            >
              {stepConfig.children}
            </SetupStepExpanded>
          );
        }

        return (
          <SetupStepCollapsed
            key={stepConfig.key}
            step={stepConfig.step}
            title={stepConfig.title}
            complete={stepConfig.complete}
            summary={getSummary(stepConfig)}
            onClick={() => setExpandedStep(stepConfig.key)}
          />
        );
      })}
    </div>
  );
};
