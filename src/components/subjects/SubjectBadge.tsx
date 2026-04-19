import { cn } from "../../lib/cn";
import type { ResolvedSubject } from "../../utils/subjects";
import { getSubjectVisuals } from "../../utils/subjects";

interface SubjectBadgeProps {
  subject: ResolvedSubject;
  className?: string;
}

export const SubjectBadge = ({ subject, className }: SubjectBadgeProps) => {
  const visuals = getSubjectVisuals(subject.color);

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em]",
        className,
      )}
      style={visuals.badgeStyle}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={visuals.dotStyle} />
      <span className="truncate">{subject.name}</span>
    </div>
  );
};
