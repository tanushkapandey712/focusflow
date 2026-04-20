import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui";
import type { StudySession, Subject } from "../../types/models";
import { getValidSyllabusSelection } from "../../utils/syllabusProgress";

interface SessionTopicLinkEditorProps {
  session: StudySession;
  subjects: Subject[];
  onSave: (params: { subjectId: string; unitId: string; topicId: string }) => void;
  onCancel: () => void;
}

export const SessionTopicLinkEditor = ({
  session,
  subjects,
  onSave,
  onCancel,
}: SessionTopicLinkEditorProps) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(session.subjectId);
  const [selectedUnitId, setSelectedUnitId] = useState(session.syllabusTopic?.unitId ?? "");
  const [selectedTopicId, setSelectedTopicId] = useState(session.syllabusTopic?.topicId ?? "");

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0],
    [selectedSubjectId, subjects],
  );
  const availableUnits = useMemo(
    () => selectedSubject?.syllabusUnits ?? [],
    [selectedSubject],
  );
  const selectedUnit = useMemo(
    () => availableUnits.find((unit) => unit.id === selectedUnitId),
    [availableUnits, selectedUnitId],
  );
  const availableTopics = useMemo(
    () => selectedUnit?.topics ?? [],
    [selectedUnit],
  );

  useEffect(() => {
    const nextSelection = getValidSyllabusSelection(
      selectedSubject,
      selectedUnitId,
      selectedTopicId,
    );

    if (nextSelection.unitId !== selectedUnitId) {
      setSelectedUnitId(nextSelection.unitId);
    }

    if (nextSelection.topicId !== selectedTopicId) {
      setSelectedTopicId(nextSelection.topicId);
    }
  }, [selectedSubject, selectedTopicId, selectedUnitId]);

  return (
    <div className="mt-4 rounded-[1.35rem] bg-slate-50/88 p-4 shadow-soft dark:bg-surface-900/72">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Subject
          </span>
          <select
            value={selectedSubjectId}
            onChange={(event) => setSelectedSubjectId(event.target.value)}
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
            Unit
          </span>
          <select
            value={selectedUnitId}
            onChange={(event) => setSelectedUnitId(event.target.value)}
            disabled={availableUnits.length === 0}
            className="field-surface"
          >
            {availableUnits.length === 0 ? <option value="">No units yet</option> : null}
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Topic
          </span>
          <select
            value={selectedTopicId}
            onChange={(event) => setSelectedTopicId(event.target.value)}
            disabled={availableTopics.length === 0}
            className="field-surface"
          >
            {availableTopics.length === 0 ? (
              <option value="">
                {availableUnits.length === 0 ? "Add topics in Syllabus Map" : "No topics in this unit"}
              </option>
            ) : null}
            {availableTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          onClick={() =>
            selectedSubjectId && selectedUnitId && selectedTopicId
              ? onSave({
                  subjectId: selectedSubjectId,
                  unitId: selectedUnitId,
                  topicId: selectedTopicId,
                })
              : undefined
          }
          disabled={!selectedSubjectId || !selectedUnitId || !selectedTopicId}
        >
          Save Link
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
          Re-linking a session will recalculate tracked study time for the affected topic.
        </p>
      </div>
    </div>
  );
};
