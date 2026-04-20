import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, PencilLine, Plus, Trash2, X } from "lucide-react";
import { SubjectBadge } from "../subjects/SubjectBadge";
import { Button, Card } from "../ui";
import { cn } from "../../lib/cn";
import type { Subject } from "../../types/models";
import {
  formatLastStudiedLabel,
  getSyllabusStats,
  getSyllabusTopicStatus,
  getTopicProgressLabel,
  getTopicStatusTone,
  getTopicTimeSpentLabel,
} from "../../utils/syllabus";

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
}

const getTopicEditKey = (unitId: string, topicId: string) => `${unitId}:${topicId}`;

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
}: SyllabusSubjectCardProps) => {
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitDrafts, setUnitDrafts] = useState<Record<string, string>>({});
  const [editingTopicKey, setEditingTopicKey] = useState<string | null>(null);
  const [topicEditDrafts, setTopicEditDrafts] = useState<Record<string, string>>({});
  const stats = getSyllabusStats(subject);

  const handleAddUnit = () => {
    const title = newUnitTitle.trim();

    if (!title) {
      return;
    }

    onAddUnit(subject.id, title);
    setNewUnitTitle("");
  };

  const startEditingUnit = (unitId: string, currentTitle: string) => {
    setEditingTopicKey(null);
    setEditingUnitId(unitId);
    setUnitDrafts((current) => ({ ...current, [unitId]: currentTitle }));
  };

  const saveUnitEdit = (unitId: string) => {
    const title = (unitDrafts[unitId] ?? "").trim();

    if (!title) {
      return;
    }

    onRenameUnit(subject.id, unitId, title);
    setEditingUnitId(null);
  };

  const startEditingTopic = (unitId: string, topicId: string, currentTitle: string) => {
    const topicKey = getTopicEditKey(unitId, topicId);

    setEditingUnitId(null);
    setEditingTopicKey(topicKey);
    setTopicEditDrafts((current) => ({ ...current, [topicKey]: currentTitle }));
  };

  const saveTopicEdit = (unitId: string, topicId: string) => {
    const topicKey = getTopicEditKey(unitId, topicId);
    const title = (topicEditDrafts[topicKey] ?? "").trim();

    if (!title) {
      return;
    }

    onRenameTopic(subject.id, unitId, topicId, title);
    setEditingTopicKey(null);
  };

  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <SubjectBadge subject={{ id: subject.id, name: subject.name, color: subject.color }} />
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {subject.name}
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Map the syllabus by unit, then break each unit into topics you can actually track.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onOpenSubject ? (
              <Button
                variant="secondary"
                onClick={() => onOpenSubject(subject.id)}
                className="rounded-full px-4"
              >
                View Subject
                <ArrowRight size={15} />
              </Button>
            ) : null}
            <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              {stats.unitCount} units
            </span>
            <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              {stats.topicCount} topics
            </span>
            <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              {stats.coveredTopicCount} covered
            </span>
          </div>
        </div>

        {subject.syllabusUnits.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/85 px-4 py-4 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
            No units yet. Add the first unit below to start structuring this subject.
          </div>
        ) : (
          <div className="space-y-3">
            {subject.syllabusUnits.map((unit) => (
              <div
                key={unit.id}
                className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/88 p-4 shadow-soft dark:border-white/10 dark:bg-slate-900/68"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Unit
                    </p>
                    {editingUnitId === unit.id ? (
                      <div className="mt-2 space-y-2">
                        <input
                          value={unitDrafts[unit.id] ?? ""}
                          onChange={(event) =>
                            setUnitDrafts((current) => ({
                              ...current,
                              [unit.id]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              saveUnitEdit(unit.id);
                            }
                          }}
                          placeholder="Rename unit"
                          className="field-surface"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => saveUnitEdit(unit.id)}
                            className="h-9 rounded-full px-3 text-xs"
                          >
                            <Check size={14} />
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setEditingUnitId(null)}
                            className="h-9 rounded-full px-3 text-xs"
                          >
                            <X size={14} />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                        {unit.title}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                      {unit.topics.length} topics
                    </span>
                    {editingUnitId !== unit.id ? (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => startEditingUnit(unit.id, unit.title)}
                          className="h-9 rounded-full px-3 text-xs"
                        >
                          <PencilLine size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${unit.title}" and all of its topics from ${subject.name}?`,
                              )
                            ) {
                              onDeleteUnit(subject.id, unit.id);
                              setEditingUnitId(null);
                              setEditingTopicKey(null);
                            }
                          }}
                          className="h-9 rounded-full px-3 text-xs text-rose-600 dark:text-rose-300"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {unit.topics.length ? (
                    unit.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-start gap-3 rounded-[1.15rem] bg-white/80 px-3 py-3 shadow-soft dark:bg-slate-950/55"
                      >
                        <input
                          type="checkbox"
                          checked={getSyllabusTopicStatus(topic) === "completed"}
                          onChange={() => onToggleTopic(subject.id, unit.id, topic.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-950"
                        />
                        <div className="min-w-0 flex-1">
                          {editingTopicKey === getTopicEditKey(unit.id, topic.id) ? (
                            <div className="space-y-2">
                              <input
                                value={topicEditDrafts[getTopicEditKey(unit.id, topic.id)] ?? ""}
                                onChange={(event) =>
                                  setTopicEditDrafts((current) => ({
                                    ...current,
                                    [getTopicEditKey(unit.id, topic.id)]: event.target.value,
                                  }))
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    saveTopicEdit(unit.id, topic.id);
                                  }
                                }}
                                placeholder="Rename topic"
                                className="field-surface"
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => saveTopicEdit(unit.id, topic.id)}
                                  className="h-9 rounded-full px-3 text-xs"
                                >
                                  <Check size={14} />
                                  Save
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => setEditingTopicKey(null)}
                                  className="h-9 rounded-full px-3 text-xs"
                                >
                                  <X size={14} />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p
                                    className={cn(
                                      "text-sm font-medium text-slate-800 dark:text-slate-100",
                                      getSyllabusTopicStatus(topic) === "completed" &&
                                        "text-slate-500 line-through dark:text-slate-400",
                                    )}
                                  >
                                    {topic.title}
                                  </p>
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                                      getTopicStatusTone(topic),
                                    )}
                                  >
                                    {getTopicProgressLabel(topic)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {getTopicTimeSpentLabel(topic)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {formatLastStudiedLabel(topic.lastStudiedAt)}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-wrap gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => startEditingTopic(unit.id, topic.id, topic.title)}
                                  className="h-9 rounded-full px-3 text-xs"
                                >
                                  <PencilLine size={14} />
                                  Edit
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Delete "${topic.title}" from ${unit.title}?`,
                                      )
                                    ) {
                                      onDeleteTopic(subject.id, unit.id, topic.id);
                                      setEditingTopicKey(null);
                                    }
                                  }}
                                  className="h-9 rounded-full px-3 text-xs text-rose-600 dark:text-rose-300"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-[1.15rem] bg-white/80 px-3 py-3 text-sm text-slate-500 dark:bg-slate-950/55 dark:text-slate-300">
                      Add the first topic in this unit.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={topicDrafts[unit.id] ?? ""}
                    onChange={(event) =>
                      setTopicDrafts((current) => ({ ...current, [unit.id]: event.target.value }))
                    }
                    placeholder="Add a topic"
                    className="field-surface"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const title = (topicDrafts[unit.id] ?? "").trim();

                      if (!title) {
                        return;
                      }

                      onAddTopic(subject.id, unit.id, title);
                      setTopicDrafts((current) => ({ ...current, [unit.id]: "" }));
                    }}
                    className="sm:min-w-32"
                  >
                    <Plus size={15} />
                    Add Topic
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/88 p-4 dark:border-white/10 dark:bg-slate-900/68">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-brand-600 dark:text-brand-100" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add another unit</p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={newUnitTitle}
              onChange={(event) => setNewUnitTitle(event.target.value)}
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
    </Card>
  );
};
