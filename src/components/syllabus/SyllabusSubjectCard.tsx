import { ArrowRight, BookOpen } from "lucide-react";
import { SubjectBadge } from "../subjects/SubjectBadge";
import { Card, Button } from "../ui";
import type { Subject } from "../../types/models";
import { getSyllabusStats, getNextSubjectTopicToStudy } from "../../utils/syllabus";

interface SyllabusSubjectCardProps {
  subject: Subject;
  onOpenSubject: (subjectId: string) => void;
}

export const SyllabusSubjectCard = ({
  subject,
  onOpenSubject,
}: SyllabusSubjectCardProps) => {
  const stats = getSyllabusStats(subject);
  const completionPercent = stats.completionPercent ?? 0;
  const nextTopic = getNextSubjectTopicToStudy(subject);

  return (
    <Card className="h-full flex flex-col justify-between overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-white/5 border border-slate-200/60 dark:border-slate-700/50">
      <div className="flex w-full flex-col items-start gap-5 p-6 text-left transition-colors">
        <div className="flex w-full items-start justify-between gap-3">
          <SubjectBadge subject={{ id: subject.id, name: subject.name, color: subject.color }} />
        </div>

        <div className="space-y-2 w-full">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {subject.name}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {stats.unitCount} units • {stats.topicCount} topics • {stats.coveredTopicCount} completed
          </p>
        </div>

        {nextTopic ? (
          <div className="w-full rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-1">
              Next Up
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <BookOpen size={16} className="text-slate-400" />
              {nextTopic.topic.title}
            </p>
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              All topics completed! 🎉
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{completionPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700/50">
        <Button 
          className="w-full justify-between bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 h-12 rounded-xl"
          onClick={() => onOpenSubject(subject.id)}
        >
          Open Subject
          <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
        </Button>
      </div>
    </Card>
  );
};
