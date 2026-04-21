import { useState } from "react";
import { Check, PencilLine, Trash2, X } from "lucide-react";
import { Button } from "../ui";
import { cn } from "../../lib/cn";
import type { SyllabusTopic } from "../../types/models";
import {
  formatLastStudiedLabel,
  getSyllabusTopicStatus,
  getTopicProgressLabel,
  getTopicStatusTone,
  getTopicTimeSpentLabel,
} from "../../utils/syllabus";

interface SyllabusTopicRowProps {
  subjectName: string;
  unitTitle: string;
  topic: SyllabusTopic;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

const getTopicTooltip = (topic: SyllabusTopic) => {
  const details = [
    topic.studiedMinutes > 0 ? getTopicTimeSpentLabel(topic) : null,
    topic.lastStudiedAt ? formatLastStudiedLabel(topic.lastStudiedAt) : null,
  ].filter(Boolean);

  return details.length ? details.join(" / ") : undefined;
};

export const SyllabusTopicRow = ({
  subjectName,
  unitTitle,
  topic,
  onToggle,
  onRename,
  onDelete,
}: SyllabusTopicRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(topic.title);

  const topicStatus = getSyllabusTopicStatus(topic);
  const tooltip = getTopicTooltip(topic);

  const saveTitle = () => {
    const nextTitle = draftTitle.trim();

    if (!nextTitle) {
      return;
    }

    onRename(nextTitle);
    setIsEditing(false);
  };

  return (
    <div
      title={tooltip}
      className="rounded-[1.1rem] border border-slate-200/70 bg-white/80 px-3 py-3 shadow-soft transition-colors duration-200 hover:border-slate-300/80 dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-white/15"
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={topicStatus === "completed"}
          onChange={onToggle}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-950"
        />

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveTitle();
                  }
                }}
                placeholder="Rename topic"
                className="field-surface"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={saveTitle}
                  className="h-8 rounded-full px-3 text-xs"
                >
                  <Check size={13} />
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDraftTitle(topic.title);
                    setIsEditing(false);
                  }}
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
                  onClick={() => setIsEditing(true)}
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
                        `Delete "${topic.title}" from ${unitTitle} in ${subjectName}?`,
                      )
                    ) {
                      onDelete();
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
};
