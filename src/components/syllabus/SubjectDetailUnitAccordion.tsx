import { useState, type CSSProperties } from "react";
import { Check, ChevronDown, PencilLine, Trash2, X } from "lucide-react";
import { Button, Card } from "../ui";
import { cn } from "../../lib/cn";
import type { SyllabusTopic, SyllabusUnit } from "../../types/models";
import {
  formatLastStudiedLabel,
  getNextTopicToStudy,
  getSyllabusTopicStatus,
  getTopicProgressLabel,
  getTopicStatusTone,
  getTopicTimeSpentLabel,
  getUnitCompletedTopicCount,
  getUnitCompletionPercent,
} from "../../utils/syllabus";

const DEFAULT_VISIBLE_TOPICS = 4;

interface SubjectDetailUnitAccordionProps {
  subjectName: string;
  unit: SyllabusUnit;
  displayTopics: SyllabusTopic[];
  isExpanded: boolean;
  showAllTopics: boolean;
  onToggle: () => void;
  onToggleShowAll: () => void;
  onToggleTopic: (topicId: string) => void;
  onRenameTopic: (topicId: string, title: string) => void;
  onDeleteTopic: (topicId: string) => void;
  progressFillStyle?: CSSProperties;
  matchSummary?: string | null;
}

const getTopicTooltip = (topic: SyllabusTopic) => {
  const details = [
    topic.studiedMinutes > 0 ? getTopicTimeSpentLabel(topic) : null,
    topic.lastStudiedAt ? formatLastStudiedLabel(topic.lastStudiedAt) : null,
  ].filter(Boolean);

  return details.length ? details.join(" / ") : undefined;
};

export const SubjectDetailUnitAccordion = ({
  subjectName,
  unit,
  displayTopics,
  isExpanded,
  showAllTopics,
  onToggle,
  onToggleShowAll,
  onToggleTopic,
  onRenameTopic,
  onDeleteTopic,
  progressFillStyle,
  matchSummary,
}: SubjectDetailUnitAccordionProps) => {
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});

  const nextTopic = getNextTopicToStudy(unit.topics);
  const completedTopicCount = getUnitCompletedTopicCount(unit);
  const unitCompletion = getUnitCompletionPercent(unit);
  const visibleTopics = showAllTopics
    ? displayTopics
    : displayTopics.slice(0, DEFAULT_VISIBLE_TOPICS);
  const hiddenTopicCount = Math.max(displayTopics.length - DEFAULT_VISIBLE_TOPICS, 0);

  const startEditingTopic = (topic: SyllabusTopic) => {
    setEditingTopicId(topic.id);
    setTopicDrafts((current) => ({ ...current, [topic.id]: topic.title }));
  };

  const saveTopicEdit = (topicId: string) => {
    const title = (topicDrafts[topicId] ?? "").trim();

    if (!title) {
      return;
    }

    onRenameTopic(topicId, title);
    setEditingTopicId(null);
  };

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 text-left transition-colors duration-200 hover:bg-slate-50/65 dark:hover:bg-slate-900/35 sm:px-6"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Unit
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {unit.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {nextTopic
                ? `Next: ${nextTopic.title}`
                : unit.topics.length
                  ? "All topics in this unit are already covered."
                  : "No topics in this unit yet."}
            </p>
            {matchSummary ? (
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {matchSummary}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              {unit.topics.length} topics
            </span>
            <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              {completedTopicCount}/{unit.topics.length} completed
            </span>
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 dark:bg-slate-800 dark:text-slate-300",
                isExpanded && "rotate-180",
              )}
            >
              <ChevronDown size={18} />
            </span>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${unitCompletion}%`,
              ...(progressFillStyle ?? {}),
            }}
          />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-200/80 px-5 py-4 dark:border-white/10 sm:px-6">
            {displayTopics.length === 0 ? (
              <p className="rounded-[1.2rem] bg-slate-50/88 px-4 py-3 text-sm leading-6 text-slate-500 dark:bg-slate-900/72 dark:text-slate-300">
                {unit.topics.length === 0
                  ? "No topics in this unit yet."
                  : "No topics match the current search or filter."}
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {visibleTopics.map((topic) => {
                    const topicStatus = getSyllabusTopicStatus(topic);
                    const tooltip = getTopicTooltip(topic);
                    const isEditing = editingTopicId === topic.id;

                    return (
                      <div
                        key={topic.id}
                        title={tooltip}
                        className="rounded-[1.1rem] border border-slate-200/70 bg-slate-50/88 px-3 py-3 shadow-soft transition-colors duration-200 hover:border-slate-300/80 dark:border-white/10 dark:bg-slate-900/72 dark:hover:border-white/15"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={topicStatus === "completed"}
                            onChange={() => onToggleTopic(topic.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-950"
                          />

                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  value={topicDrafts[topic.id] ?? ""}
                                  onChange={(event) =>
                                    setTopicDrafts((current) => ({
                                      ...current,
                                      [topic.id]: event.target.value,
                                    }))
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      saveTopicEdit(topic.id);
                                    }
                                  }}
                                  placeholder="Rename topic"
                                  className="field-surface"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="secondary"
                                    onClick={() => saveTopicEdit(topic.id)}
                                    className="h-8 rounded-full px-3 text-xs"
                                  >
                                    <Check size={13} />
                                    Save
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    onClick={() => setEditingTopicId(null)}
                                    className="h-8 rounded-full px-3 text-xs"
                                  >
                                    <X size={13} />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p
                                    className={cn(
                                      "text-sm font-medium text-slate-900 dark:text-slate-100",
                                      topicStatus === "completed" &&
                                        "text-slate-500 line-through dark:text-slate-400",
                                    )}
                                  >
                                    {topic.title}
                                  </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  {topic.studiedMinutes > 0 ? (
                                    <span className="surface-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                                      {topic.studiedMinutes} min
                                    </span>
                                  ) : null}
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                                      getTopicStatusTone(topic),
                                    )}
                                  >
                                    {getTopicProgressLabel(topic)}
                                  </span>
                                  <Button
                                    variant="secondary"
                                    onClick={() => startEditingTopic(topic)}
                                    className="h-8 w-8 rounded-full p-0"
                                    aria-label={`Edit ${topic.title}`}
                                    title={`Edit ${topic.title}`}
                                  >
                                    <PencilLine size={14} />
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Delete "${topic.title}" from ${unit.title} in ${subjectName}?`,
                                        )
                                      ) {
                                        onDeleteTopic(topic.id);
                                        setEditingTopicId(null);
                                      }
                                    }}
                                    className="h-8 w-8 rounded-full p-0 text-rose-600 dark:text-rose-300"
                                    aria-label={`Delete ${topic.title}`}
                                    title={`Delete ${topic.title}`}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hiddenTopicCount > 0 ? (
                  <div className="mt-3 flex justify-start">
                    <Button
                      variant="secondary"
                      onClick={onToggleShowAll}
                      className="rounded-full px-4 text-xs"
                    >
                      {showAllTopics ? "Show Less" : `Show ${hiddenTopicCount} More`}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
