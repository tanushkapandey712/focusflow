import { useState } from "react";
import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
import { SubjectBadge } from "../subjects/SubjectBadge";
import { Button, Card } from "../ui";
import type { Subject } from "../../types/models";
import { getSyllabusStats } from "../../utils/syllabus";
import { SyllabusUnitAccordion } from "./SyllabusUnitAccordion";

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
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [showAllTopics, setShowAllTopics] = useState<Record<string, boolean>>({});
  const stats = getSyllabusStats(subject);

  const handleAddUnit = () => {
    const title = newUnitTitle.trim();

    if (!title) {
      return;
    }

    onAddUnit(subject.id, title);
    setNewUnitTitle("");
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
                Navigate this syllabus unit by unit instead of scrolling through one long topic dump.
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
              <SyllabusUnitAccordion
                key={unit.id}
                subjectName={subject.name}
                unit={unit}
                isExpanded={expandedUnitId === unit.id}
                showAllTopics={showAllTopics[unit.id] === true}
                onToggle={() => {
                  setExpandedUnitId((current) => (current === unit.id ? null : unit.id));
                }}
                onToggleShowAll={() =>
                  setShowAllTopics((current) => ({
                    ...current,
                    [unit.id]: !current[unit.id],
                  }))
                }
                onRenameUnit={(title) => onRenameUnit(subject.id, unit.id, title)}
                onDeleteUnit={() => {
                  onDeleteUnit(subject.id, unit.id);
                  setExpandedUnitId((current) => (current === unit.id ? null : current));
                }}
                onAddTopic={(title) => onAddTopic(subject.id, unit.id, title)}
                onRenameTopic={(topicId, title) =>
                  onRenameTopic(subject.id, unit.id, topicId, title)
                }
                onDeleteTopic={(topicId) => onDeleteTopic(subject.id, unit.id, topicId)}
                onToggleTopic={(topicId) => onToggleTopic(subject.id, unit.id, topicId)}
              />
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
