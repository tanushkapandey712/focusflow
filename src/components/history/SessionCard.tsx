import { useState } from "react";
import type { StudySession, Subject } from "../../types/models";
import type { ResolvedSubject } from "../../utils/subjects";
import { getSubjectVisuals } from "../../utils/subjects";
import { getStabilityLabel, getStabilityTone } from "../../utils/stabilityScore";
import { SessionTopicLinkEditor } from "./SessionTopicLinkEditor";
import { SubjectBadge } from "../subjects/SubjectBadge";
import { Button, Card } from "../ui";

interface SessionCardProps {
  session: StudySession;
  subject?: ResolvedSubject;
  subjects: Subject[];
  onSaveTopicLink?: (
    sessionId: string,
    params: { subjectId: string; unitId: string; topicId: string },
  ) => void;
}

const getFocusScore = (session: StudySession) =>
  Math.min(100, Math.round((session.actualMinutes / Math.max(1, session.plannedMinutes)) * 100));

const formatDurationLabel = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
};

const getStatus = (focusScore: number) => {
  if (focusScore >= 90) return { label: "On Track", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" };
  if (focusScore >= 70) return { label: "Steady", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200" };
  return { label: "Distracted", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200" };
};

export const SessionCard = ({
  session,
  subject,
  subjects,
  onSaveTopicLink,
}: SessionCardProps) => {
  const [isEditingTopicLink, setIsEditingTopicLink] = useState(false);
  const focusScore = getFocusScore(session);
  const status = getStatus(focusScore);
  const shortNote = session.note ? session.note.slice(0, 80) : "";
  const subjectVisuals = subject ? getSubjectVisuals(subject.color) : undefined;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {subject ? <SubjectBadge subject={subject} /> : null}
          <p className="mt-3 truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {session.goal || session.subjectName}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {new Date(session.endedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${status.className}`}>
            {status.label}
          </span>
          {session.stabilityScore !== undefined ? (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStabilityTone(session.stabilityScore)}`}>
              {getStabilityLabel(session.stabilityScore)} ({session.stabilityScore})
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div
          className="rounded-2xl bg-slate-50/90 px-2 py-3 shadow-soft dark:bg-surface-900/70"
          style={subjectVisuals?.panelStyle}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Duration</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{session.actualMinutes}m</p>
        </div>
        <div className="rounded-2xl bg-slate-50/90 px-2 py-3 shadow-soft dark:bg-surface-900/70">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Focus</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{focusScore}%</p>
        </div>
        <div className="rounded-2xl bg-slate-50/90 px-2 py-3 shadow-soft dark:bg-surface-900/70">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Plan</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{session.plannedMinutes}m</p>
        </div>
      </div>

      {shortNote ? (
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {shortNote}
          {session.note && session.note.length > 80 ? "..." : ""}
        </p>
      ) : null}

      {session.syllabusTopic ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="surface-pill px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            Unit {session.syllabusTopic.unitTitle}
          </span>
          <span className="surface-pill px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            Topic {session.syllabusTopic.topicTitle}
          </span>
        </div>
      ) : null}

      {onSaveTopicLink ? (
        <div className="mt-4">
          {!isEditingTopicLink ? (
            <Button
              variant="secondary"
              onClick={() => setIsEditingTopicLink(true)}
              className="rounded-full px-4"
            >
              {session.syllabusTopic ? "Edit topic link" : "Link topic"}
            </Button>
          ) : (
            <SessionTopicLinkEditor
              session={session}
              subjects={subjects}
              onCancel={() => setIsEditingTopicLink(false)}
              onSave={(params) => {
                onSaveTopicLink(session.id, params);
                setIsEditingTopicLink(false);
              }}
            />
          )}
        </div>
      ) : null}

      {session.focusTracking ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="surface-pill px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            Focused {formatDurationLabel(session.focusTracking.totalFocusedTimeMs)}
          </span>
          <span className="surface-pill px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            Best streak {formatDurationLabel(session.focusTracking.longestFocusStreakMs)}
          </span>
          <span className="surface-pill px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            Away events {session.focusTracking.totalAwayEvents}
          </span>
          <span className="surface-pill px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            Away {formatDurationLabel(session.focusTracking.totalAwayTimeMs)}
          </span>
        </div>
      ) : null}
    </Card>
  );
};
