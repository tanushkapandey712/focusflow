import { useState } from "react";
import { Check, ChevronDown, PencilLine, Plus, Trash2, X } from "lucide-react";
import { Button, Card } from "../ui";
import type { SyllabusUnit } from "../../types/models";
import {
  getNextTopicToStudy,
  getUnitCompletedTopicCount,
  getUnitCompletionPercent,
} from "../../utils/syllabus";
import { SyllabusTopicRow } from "./SyllabusTopicRow";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { cn } from "../../lib/cn";

const DEFAULT_VISIBLE_TOPICS = 8;

interface SyllabusUnitAccordionProps {
  subjectName: string;
  unit: SyllabusUnit;
  isExpanded: boolean;
  showAllTopics: boolean;
  onToggle: () => void;
  onToggleShowAll: () => void;
  onRenameUnit: (title: string) => void;
  onDeleteUnit: () => void;
  onAddTopic: (title: string) => void;
  onRenameTopic: (topicId: string, title: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onToggleTopic: (topicId: string) => void;
}

export const SyllabusUnitAccordion = ({
  subjectName,
  unit,
  isExpanded,
  showAllTopics,
  onToggle,
  onToggleShowAll,
  onRenameUnit,
  onDeleteUnit,
  onAddTopic,
  onRenameTopic,
  onDeleteTopic,
  onToggleTopic,
}: SyllabusUnitAccordionProps) => {
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [unitDraft, setUnitDraft] = useState(unit.title);
  const [newTopicTitle, setNewTopicTitle] = useState("");

  const completedTopicCount = getUnitCompletedTopicCount(unit);
  const nextTopic = getNextTopicToStudy(unit.topics);
  const unitCompletion = getUnitCompletionPercent(unit);
  const visibleTopics = showAllTopics ? unit.topics : unit.topics.slice(0, DEFAULT_VISIBLE_TOPICS);
  const bodyId = `syllabus-unit-panel-${unit.id}`;
  const handleToggle = () => onToggle();

  const saveUnitTitle = () => {
    const nextTitle = unitDraft.trim();

    if (!nextTitle) {
      return;
    }

    onRenameUnit(nextTitle);
    setIsEditingUnit(false);
  };

  const handleAddTopic = () => {
    const nextTitle = newTopicTitle.trim();

    if (!nextTitle) {
      return;
    }

    onAddTopic(nextTitle);
    setNewTopicTitle("");
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="px-5 py-4 sm:px-6">
        <div className="relative flex items-start gap-3">
          <button
            type="button"
            onClick={handleToggle}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleToggle();
              }
            }}
            aria-expanded={isExpanded}
            aria-controls={bodyId}
            className="relative z-10 min-w-0 flex-1 cursor-pointer text-left transition-colors duration-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100/70 dark:hover:text-slate-100 dark:focus-visible:ring-brand-900/40"
          >
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
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                {unit.topics.length} topics
              </span>
              <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                {completedTopicCount}/{unit.topics.length} completed
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500 dark:bg-brand-300"
                style={{ width: `${unitCompletion}%` }}
              />
            </div>
          </button>

          <div className="relative z-20 flex shrink-0 items-start gap-2 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                setUnitDraft(unit.title);
                setIsEditingUnit(true);
                if (!isExpanded) handleToggle();
              }}
              aria-label={`Edit ${unit.title}`}
              title={`Edit ${unit.title}`}
            >
              <PencilLine size={14} />
            </Button>
            <Button
              variant="danger-ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
              aria-label={`Delete ${unit.title}`}
              title={`Delete ${unit.title}`}
            >
              <Trash2 size={14} />
            </Button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleToggle();
              }}
              aria-label={isExpanded ? `Collapse ${unit.title}` : `Expand ${unit.title}`}
              aria-expanded={isExpanded}
              aria-controls={bodyId}
              className={cn(
                "relative z-20 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-slate-100 text-slate-600 shadow-soft transition-all duration-200 hover:border-slate-300/90 hover:bg-slate-200/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100/70 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-white/15 dark:hover:bg-slate-700/80 dark:focus-visible:ring-brand-900/40",
                isExpanded && "rotate-180",
              )}
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        aria-hidden={!isExpanded}
        className="accordion-body"
        data-open={isExpanded ? "true" : "false"}
      >
        <div id={bodyId} className="overflow-hidden">
            <div className="border-t border-slate-200/80 px-5 py-4 dark:border-white/10 sm:px-6">
              {isEditingUnit ? (
                <div className="mb-4 rounded-[1.2rem] bg-slate-50/88 p-3 dark:bg-slate-900/68">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={unitDraft}
                      onChange={(event) => setUnitDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveUnitTitle();
                        }
                      }}
                      placeholder="Rename unit"
                      className="field-surface"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={saveUnitTitle}
                        className="rounded-full px-3"
                      >
                        <Check size={14} />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUnitDraft(unit.title);
                          setIsEditingUnit(false);
                        }}
                        className="rounded-full px-3"
                      >
                        <X size={14} />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {unit.topics.length === 0 ? (
                <p className="rounded-[1.15rem] bg-slate-50/88 px-3 py-3 text-sm text-slate-500 dark:bg-slate-950/55 dark:text-slate-300">
                  No topics yet. Add the first topic.
                </p>
              ) : (
                <div className="space-y-2">
                  {visibleTopics.map((topic) => (
                    <SyllabusTopicRow
                      key={topic.id}
                      subjectName={subjectName}
                      unitTitle={unit.title}
                      topic={topic}
                      onToggle={() => onToggleTopic(topic.id)}
                      onRename={(title) => onRenameTopic(topic.id, title)}
                      onDelete={() => onDeleteTopic(topic.id)}
                    />
                  ))}
                </div>
              )}

              {unit.topics.length > DEFAULT_VISIBLE_TOPICS ? (
                <div className="mt-3 flex justify-start">
                  <Button
                    variant="secondary"
                    onClick={onToggleShowAll}
                    className="rounded-full px-4 text-xs"
                  >
                    {showAllTopics
                      ? "Show fewer topics"
                      : `Show all ${unit.topics.length} topics`}
                  </Button>
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={newTopicTitle}
                  onChange={(event) => setNewTopicTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddTopic();
                    }
                  }}
                  placeholder="Add a topic"
                  className="field-surface"
                />
                <Button
                  variant="secondary"
                  onClick={handleAddTopic}
                  className="sm:min-w-32"
                >
                  <Plus size={15} />
                  Add Topic
                </Button>
              </div>
            </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete unit?"
        body={`Are you sure you want to delete "${unit.title}" and all topics inside it from ${subjectName}?`}
        confirmLabel="Delete unit"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDeleteUnit();
        }}
      />
    </Card>
  );
};
