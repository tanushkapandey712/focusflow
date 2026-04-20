import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FileInput, PencilLine, Plus, Trash2 } from "lucide-react";
import { Button, Card } from "../ui";
import type { Subject, SyllabusUnit } from "../../types/models";
import { createSyllabusTopic, createSyllabusUnit } from "../../utils/syllabus";
import {
  moveListItem,
  normalizeReviewUnits,
  parseSyllabusText,
} from "../../utils/syllabusImport";

interface SyllabusImportCardProps {
  subjects: Subject[];
  onSaveImport: (params: { subjectId?: string; subjectName?: string; units: SyllabusUnit[] }) => void;
}

const NEW_SUBJECT_VALUE = "__new__";

export const SyllabusImportCard = ({ subjects, onSaveImport }: SyllabusImportCardProps) => {
  const [targetSubjectId, setTargetSubjectId] = useState<string>(
    subjects[0]?.id ?? NEW_SUBJECT_VALUE,
  );
  const [newSubjectName, setNewSubjectName] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [reviewUnits, setReviewUnits] = useState<SyllabusUnit[] | null>(null);

  const usesNewSubject = targetSubjectId === NEW_SUBJECT_VALUE;

  const helperText = useMemo(() => {
    if (usesNewSubject) {
      return "Imported units will create a new subject and save the reviewed structure into it.";
    }

    return "Imported units will be added to the selected subject after you review them.";
  }, [usesNewSubject]);

  const resetImportState = () => {
    setRawText("");
    setReviewUnits(null);
    setError("");
  };

  const handleParse = () => {
    if (usesNewSubject && !newSubjectName.trim()) {
      setError("Enter a subject name before importing.");
      return;
    }

    if (!rawText.trim()) {
      setError("Paste the syllabus text before parsing it.");
      return;
    }

    const parsedUnits = parseSyllabusText(rawText);

    if (parsedUnits.length === 0) {
      setError("We could not identify units or topics from that text. Adjust it and try again.");
      return;
    }

    setReviewUnits(parsedUnits);
    setError("");
  };

  const updateUnitTitle = (unitId: string, title: string) => {
    setReviewUnits((current) =>
      current?.map((unit) => (unit.id === unitId ? { ...unit, title } : unit)) ?? current,
    );
  };

  const moveUnit = (unitIndex: number, direction: "up" | "down") => {
    setReviewUnits((current) => (current ? moveListItem(current, unitIndex, direction) : current));
  };

  const removeUnit = (unitId: string) => {
    setReviewUnits((current) => current?.filter((unit) => unit.id !== unitId) ?? current);
  };

  const addReviewUnit = () => {
    setReviewUnits((current) => [...(current ?? []), createSyllabusUnit("New Unit")]);
  };

  const updateTopicTitle = (unitId: string, topicId: string, title: string) => {
    setReviewUnits((current) =>
      current?.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              topics: unit.topics.map((topic) => (topic.id === topicId ? { ...topic, title } : topic)),
            }
          : unit,
      ) ?? current,
    );
  };

  const moveTopic = (unitId: string, topicIndex: number, direction: "up" | "down") => {
    setReviewUnits((current) =>
      current?.map((unit) =>
        unit.id === unitId
          ? { ...unit, topics: moveListItem(unit.topics, topicIndex, direction) }
          : unit,
      ) ?? current,
    );
  };

  const removeTopic = (unitId: string, topicId: string) => {
    setReviewUnits((current) =>
      current?.map((unit) =>
        unit.id === unitId
          ? { ...unit, topics: unit.topics.filter((topic) => topic.id !== topicId) }
          : unit,
      ) ?? current,
    );
  };

  const addReviewTopic = (unitId: string) => {
    setReviewUnits((current) =>
      current?.map((unit) =>
        unit.id === unitId
          ? { ...unit, topics: [...unit.topics, createSyllabusTopic("New Topic")] }
          : unit,
      ) ?? current,
    );
  };

  const handleSave = () => {
    if (!reviewUnits) {
      return;
    }

    if (usesNewSubject && !newSubjectName.trim()) {
      setError("Enter a subject name before saving the import.");
      return;
    }

    const normalizedUnits = normalizeReviewUnits(reviewUnits);

    if (normalizedUnits.length === 0) {
      setError("Keep at least one valid unit or topic before saving.");
      return;
    }

    onSaveImport({
      subjectId: usesNewSubject ? undefined : targetSubjectId,
      subjectName: usesNewSubject ? newSubjectName.trim() : undefined,
      units: normalizedUnits,
    });

    resetImportState();
    if (usesNewSubject) {
      setNewSubjectName("");
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="surface-pill inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
            <FileInput size={14} />
            Syllabus Import
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Paste and review syllabus text
          </h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Paste raw syllabus text, let FocusFlow organize it into units and topics, then review everything before saving.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Import into</span>
              <select
                value={targetSubjectId}
                onChange={(event) => {
                  setTargetSubjectId(event.target.value);
                  setError("");
                }}
                className="field-surface"
              >
                {subjects.length ? (
                  subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))
                ) : null}
                <option value={NEW_SUBJECT_VALUE}>Create new subject</option>
              </select>
            </div>

            {usesNewSubject ? (
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">New subject name</span>
                <input
                  value={newSubjectName}
                  onChange={(event) => {
                    setNewSubjectName(event.target.value);
                    setError("");
                  }}
                  placeholder="Physics"
                  className="field-surface"
                />
              </label>
            ) : null}

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Paste syllabus text</span>
              <textarea
                value={rawText}
                onChange={(event) => {
                  setRawText(event.target.value);
                  setError("");
                }}
                rows={10}
                placeholder={"Unit 1: Algebra\nLinear equations\nPolynomials\n\nUnit 2: Geometry\nTriangles\nCircles"}
                className="field-surface min-h-52 resize-y"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleParse}>
                <PencilLine size={15} />
                Parse for review
              </Button>
              {reviewUnits ? (
                <Button variant="secondary" onClick={resetImportState}>
                  Clear import
                </Button>
              ) : null}
            </div>

            {error ? (
              <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
            ) : (
              <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{helperText}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/88 p-4 shadow-soft dark:border-white/10 dark:bg-slate-900/68">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Review before save
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {reviewUnits ? `${reviewUnits.length} parsed units ready to edit` : "Nothing parsed yet"}
                  </p>
                </div>
                {reviewUnits ? (
                  <Button variant="secondary" onClick={addReviewUnit}>
                    <Plus size={15} />
                    Add Unit
                  </Button>
                ) : null}
              </div>

              {!reviewUnits ? (
                <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-300">
                  Parse the pasted text first. Saving is only enabled after you review the imported structure.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                    Edit titles, add or remove topics, and reorder the structure before saving.
                  </p>

                  {reviewUnits.map((unit, unitIndex) => (
                    <div
                      key={unit.id}
                      className="rounded-[1.35rem] border border-slate-200/80 bg-white/82 p-4 shadow-soft dark:border-white/10 dark:bg-slate-950/45"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Unit {unitIndex + 1}
                          </p>
                          <input
                            value={unit.title}
                            onChange={(event) => updateUnitTitle(unit.id, event.target.value)}
                            className="field-surface"
                          />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button
                            variant="secondary"
                            onClick={() => moveUnit(unitIndex, "up")}
                            disabled={unitIndex === 0}
                            className="h-11 w-11 px-0"
                          >
                            <ChevronUp size={15} />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => moveUnit(unitIndex, "down")}
                            disabled={unitIndex === reviewUnits.length - 1}
                            className="h-11 w-11 px-0"
                          >
                            <ChevronDown size={15} />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => removeUnit(unit.id)}
                            className="h-11 w-11 px-0"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Topics
                        </p>

                        {unit.topics.length === 0 ? (
                          <p className="rounded-[1.1rem] bg-slate-50/90 px-3 py-3 text-sm text-slate-500 dark:bg-slate-900/70 dark:text-slate-300">
                            No topics yet. Add the first topic below.
                          </p>
                        ) : (
                          unit.topics.map((topic, topicIndex) => (
                            <div key={topic.id} className="flex items-center gap-2">
                              <input
                                value={topic.title}
                                onChange={(event) => updateTopicTitle(unit.id, topic.id, event.target.value)}
                                className="field-surface"
                              />
                              <Button
                                variant="secondary"
                                onClick={() => moveTopic(unit.id, topicIndex, "up")}
                                disabled={topicIndex === 0}
                                className="h-11 w-11 px-0"
                              >
                                <ChevronUp size={15} />
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => moveTopic(unit.id, topicIndex, "down")}
                                disabled={topicIndex === unit.topics.length - 1}
                                className="h-11 w-11 px-0"
                              >
                                <ChevronDown size={15} />
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => removeTopic(unit.id, topic.id)}
                                className="h-11 w-11 px-0"
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-3">
                        <Button variant="secondary" onClick={() => addReviewTopic(unit.id)}>
                          <Plus size={15} />
                          Add Topic
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSave}>Save reviewed syllabus</Button>
                    <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                      Review is mandatory. The imported structure will only save after this step.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
