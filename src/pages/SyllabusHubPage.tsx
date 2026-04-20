import { useState } from "react";
import { BookOpenText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SyllabusImportCard } from "../components/syllabus/SyllabusImportCard";
import { SyllabusSubjectCard } from "../components/syllabus/SyllabusSubjectCard";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { Button, Card, SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import type { Subject } from "../types/models";
import { buildSubjectsFromNames, normalizeSubjectName } from "../utils/subjects";
import {
  createSyllabusTopic,
  createSyllabusUnit,
  toggleTopicCompletionStatus,
} from "../utils/syllabus";

export const SyllabusHubPage = () => {
  const navigate = useNavigate();
  const { subjects, addSubject, updateSubject, saveReviewedSyllabus, getSubjectSyllabus } =
    useFocusFlowData();
  const [newSubjectName, setNewSubjectName] = useState("");
  const [error, setError] = useState("");

  const handleAddSubject = () => {
    const title = newSubjectName.trim();

    if (!title) {
      setError("Enter a subject name before adding it.");
      return;
    }

    const alreadyExists = subjects.some(
      (subject) => normalizeSubjectName(subject.name) === normalizeSubjectName(title),
    );

    if (alreadyExists) {
      setError("That subject already exists in your syllabus map.");
      return;
    }

    const [nextSubject] = buildSubjectsFromNames([title], subjects);

    if (!nextSubject) {
      setError("We could not create that subject right now.");
      return;
    }

    addSubject(nextSubject);
    setNewSubjectName("");
    setError("");
  };

  const getSubjectById = (subjectId: string) => subjects.find((subject) => subject.id === subjectId);

  const handleSubjectUnitsUpdate = (subject: Subject, nextUnits: Subject["syllabusUnits"]) => {
    updateSubject(subject.id, { syllabusUnits: nextUnits });
  };

  const handleAddUnit = (subjectId: string, title: string) => {
    const subject = getSubjectById(subjectId);

    if (!subject) {
      return;
    }

    handleSubjectUnitsUpdate(subject, [...subject.syllabusUnits, createSyllabusUnit(title)]);
  };

  const handleAddTopic = (subjectId: string, unitId: string, title: string) => {
    const subject = getSubjectById(subjectId);

    if (!subject) {
      return;
    }

    const nextUnits = subject.syllabusUnits.map((unit) =>
      unit.id === unitId ? { ...unit, topics: [...unit.topics, createSyllabusTopic(title)] } : unit,
    );

    handleSubjectUnitsUpdate(subject, nextUnits);
  };

  const handleToggleTopic = (subjectId: string, unitId: string, topicId: string) => {
    const subject = getSubjectById(subjectId);

    if (!subject) {
      return;
    }

    const nextUnits = subject.syllabusUnits.map((unit) =>
      unit.id === unitId
        ? {
            ...unit,
            topics: unit.topics.map((topic) =>
              topic.id === topicId ? toggleTopicCompletionStatus(topic) : topic,
            ),
          }
        : unit,
    );

    handleSubjectUnitsUpdate(subject, nextUnits);
  };

  return (
    <DashboardContainer>
      <SectionContainer
        title="Syllabus Map"
        description="Keep subjects, units, and topics in one clear structure so the scope of each subject stays visible."
      >
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="surface-pill inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                <BookOpenText size={14} />
                Syllabus Hub
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Build subjects with units and topics
              </h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Add a subject once, then keep its full syllabus broken down into manageable units and topics.
              </p>
            </div>

            <div className="w-full max-w-md space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newSubjectName}
                  onChange={(event) => {
                    setNewSubjectName(event.target.value);
                    setError("");
                  }}
                  placeholder="Add a new subject"
                  className="field-surface"
                />
                <Button onClick={handleAddSubject} className="sm:min-w-36">
                  <Plus size={15} />
                  Add Subject
                </Button>
              </div>
              {error ? (
                <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
              ) : (
                <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                  Subjects you already use in FocusFlow can also be expanded here into units and topics.
                </p>
              )}
            </div>
          </div>
        </Card>

        <SyllabusImportCard subjects={subjects} onSaveImport={saveReviewedSyllabus} />

        {subjects.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              No subjects yet. Add your first subject above to start mapping the syllabus.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {subjects.map((subject) => (
              <SyllabusSubjectCard
                key={subject.id}
                subject={{ ...subject, syllabusUnits: getSubjectSyllabus(subject.id) }}
                onAddUnit={handleAddUnit}
                onAddTopic={handleAddTopic}
                onToggleTopic={handleToggleTopic}
                onOpenSubject={(subjectId) => navigate(`/syllabus/${subjectId}`)}
              />
            ))}
          </div>
        )}
      </SectionContainer>
    </DashboardContainer>
  );
};
