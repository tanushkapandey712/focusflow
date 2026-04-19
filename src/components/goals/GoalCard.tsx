import type { ResolvedSubject } from "../../utils/subjects";
import { getSubjectVisuals, withAlpha } from "../../utils/subjects";
import { SubjectBadge } from "../subjects/SubjectBadge";
import { Card, GradientCard } from "../ui";

export interface GoalViewModel {
  id: string;
  title: string;
  progress: number;
  percentage: number;
  status: "on-track" | "in-progress" | "behind";
  subject?: ResolvedSubject;
}

interface GoalCardProps {
  goal: GoalViewModel;
  highlight?: boolean;
}

const statusLabel = {
  "on-track": "On Track",
  "in-progress": "In Progress",
  behind: "Behind",
};

const statusColor = {
  "on-track": "text-emerald-700",
  "in-progress": "text-amber-700",
  behind: "text-rose-700",
};

export const GoalCard = ({ goal, highlight = false }: GoalCardProps) => {
  const Shell = highlight ? GradientCard : Card;
  const subjectColor = goal.subject?.color ?? "#5a55f5";
  const subjectVisuals = goal.subject ? getSubjectVisuals(goal.subject.color) : undefined;
  const ringStyle = {
    background: `conic-gradient(${subjectColor} ${goal.percentage * 3.6}deg, rgba(148,163,184,0.25) 0deg)`,
  };

  return (
    <Shell className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {goal.title}
          </p>
          <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusColor[goal.status]}`}>
            {statusLabel[goal.status]}
          </p>
          {goal.subject ? (
            <div className="mt-3">
              <SubjectBadge subject={goal.subject} />
            </div>
          ) : null}
        </div>

        <div className="relative grid h-14 w-14 place-items-center rounded-full p-1" style={ringStyle}>
          <div className="grid h-full w-full place-items-center rounded-full bg-white text-xs font-semibold shadow-soft dark:bg-surface-900">
            {goal.percentage}%
          </div>
        </div>
      </div>

      {goal.subject ? (
        <div className="mt-5 rounded-[1.35rem] border px-4 py-3" style={subjectVisuals?.panelStyle}>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Most of this goal&apos;s momentum is coming from {goal.subject.name}.
          </p>
        </div>
      ) : null}

      <div
        className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800"
        style={goal.subject ? { backgroundColor: withAlpha(subjectColor, 0.14) } : undefined}
      >
        <div
          className={goal.subject ? "h-2.5 rounded-full transition-all duration-700" : "h-2.5 rounded-full bg-gradient-to-r from-brand-700 to-sky-400 transition-all duration-700"}
          style={{ width: `${goal.progress}%`, ...(subjectVisuals?.fillStyle ?? {}) }}
        />
      </div>
    </Shell>
  );
};
