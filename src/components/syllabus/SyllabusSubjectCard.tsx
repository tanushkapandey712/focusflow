import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Plus } from "lucide-react";
import { SubjectBadge } from "../subjects/SubjectBadge";
import { Button, Card } from "../ui";
import type { Subject } from "../../types/models";
import { getSyllabusStats } from "../../utils/syllabus";
import { SyllabusUnitAccordion } from "./SyllabusUnitAccordion";
import { cn } from "../../lib/cn";

const DEFAULT_VISIBLE_UNITS = 3;

interface SyllabusSubjectCardProps {
  subject: Subject;
  onAddUnit: (subjectId: string, title: string) => void;
  onAddTopic: (subjectId: string, unitId: string, title: string) => void;
  onRenameUnit: (subjectId: string, unitId: string, title: string) => void;
  onDeleteUnit: (subjectId: string, unitId: string) => void;
  onRenameTopic: (subjectId: string, unitId: string, topicId: string, title: string) => void;
  onDeleteTopic: (subjectId: string, unitId: string, topicId: string) => void;
  onToggleTopic: (subjectId: string, unitId: string, topicId: string) => void;
  onOpenSubject?: (subjectId: string) => void;
  defaultExpanded?: boolean;
}

export const SyllabusSubjectCard = ({
  subject,
  onAddUnit,
  onAddTopic,
  onRenameUnit,
  onDeleteUnit,
  onRenameTopic,
  onDeleteTopic,
  onToggleTopic,
  onOpenSubject,
  defaultExpanded = false,
}: SyllabusSubjectCardProps) => {
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set());
  const [showAllTopics, setShowAllTopics] = useState<Record<string, boolean>>({});
  const [isSubjectExpanded, setIsSubjectExpanded] = useState(defaultExpanded);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const stats = getSyllabusStats(subject);
  const completionPercent = stats.completionPercent ?? 0;

  const visibleUnits = showAllUnits
    ? subject.syllabusUnits
    : subject.syllabusUnits.slice(0, DEFAULT_VISIBLE_UNITS);
  const hasHiddenUnits = subject.syllabusUnits.length > DEFAULT_VISIBLE_UNITS;

  const toggleUnit = (unitId: string) => {
    setExpandedUnitIds((current) => {
      const next = new Set(current);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const handleAddUnit = () => {
    const title = newUnitTitle.trim();

    if (!title) {
      return;
    }

    onAddUnit(subject.id, title);
    setNewUnitTitle("");
  };

  return (
    <Card className="h-full overflow-hidden p-0">
      {/* Subject header — always visible, acts as collapse toggle */}
      <button
        type="button"
        onClick={() => setIsSubjectExpanded((prev) => !prev)}
        className="flex w-full items-start gap-3 p-5 text-left transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30 sm:p-6"
      >
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SubjectBadge subject={{ id: subject.id, name: subject.name, color: subject.color }} />
            {onOpenSubject ? (
              <Button
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenSubject(subject.id);
                }}
                className="rounded-full px-3 text-xs"
              >
                View
                <ArrowRight size={13} />
              </Button>
            ) : null}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {subject.name}
            </h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {stats.unitCount} units · {stats.topicCount} topics · {stats.coveredTopicCount} covered
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500 dark:bg-brand-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
              {completionPercent}%
            </span>
          </div>
        </div>

        <div
          className={cn(
            "mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-slate-100 text-slate-500 transition-transform duration-300 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300",
            isSubjectExpanded && "rotate-180",
          )}
        >
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Collapsible body */}
      <div
        className="accordion-body"
        data-open={isSubjectExpanded ? "true" : "false"}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-200/80 px-5 py-4 dark:border-white/10 sm:px-6">
            <div className="space-y-3">
              {subject.syllabusUnits.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/85 px-4 py-4 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
                  No units yet. Add the first unit below to start structuring this subject.
                </div>
              ) : (
                <>
                  {visibleUnits.map((unit) => (
                    <SyllabusUnitAccordion
                      key={unit.id}
                      subjectName={subject.name}
                      unit={unit}
                      isExpanded={expandedUnitIds.has(unit.id)}
                      showAllTopics={showAllTopics[unit.id] === true}
                      onToggle={() => toggleUnit(unit.id)}
                      onToggleShowAll={() =>
                        setShowAllTopics((current) => ({
                          ...current,
                          [unit.id]: !current[unit.id],
                        }))
                      }
                      onRenameUnit={(title) => onRenameUnit(subject.id, unit.id, title)}
                      onDeleteUnit={() => {
                        onDeleteUnit(subject.id, unit.id);
                        setExpandedUnitIds((current) => {
                          const next = new Set(current);
                          next.delete(unit.id);
                          return next;
                        });
                      }}
                      onAddTopic={(title) => onAddTopic(subject.id, unit.id, title)}
                      onRenameTopic={(topicId, title) =>
                        onRenameTopic(subject.id, unit.id, topicId, title)
                      }
                      onDeleteTopic={(topicId) => onDeleteTopic(subject.id, unit.id, topicId)}
                      onToggleTopic={(topicId) => onToggleTopic(subject.id, unit.id, topicId)}
                    />
                  ))}

                  {hasHiddenUnits ? (
                    <div className="flex justify-center pt-1">
                      <Button
                        variant="secondary"
                        onClick={() => setShowAllUnits((prev) => !prev)}
                        className="rounded-full px-5 text-xs"
                      >
                        {showAllUnits
                          ? "Show fewer units"
                          : `Show all ${subject.syllabusUnits.length} units`}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}

              {/* Add unit form */}
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/88 p-4 dark:border-white/10 dark:bg-slate-900/68">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-brand-600 dark:text-brand-100" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add another unit</p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={newUnitTitle}
                    onChange={(event) => setNewUnitTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddUnit();
                      }
                    }}
                    placeholder="Unit 1: Fundamentals"
                    className="field-surface"
                  />
                  <Button variant="secondary" onClick={handleAddUnit} className="sm:min-w-32">
                    <Plus size={15} />
                    Add Unit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
