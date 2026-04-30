import type { SyllabusDashboardInsights } from "../../utils/recommendations";
import { Card } from "../ui";
import { BookOpen, AlertCircle, Lightbulb } from "lucide-react";

interface SyllabusInsightsCardProps {
  insights: SyllabusDashboardInsights;
}

const formatNeglectedDetail = (insights: SyllabusDashboardInsights) => {
  if (!insights.neglectedSubject) {
    return insights.totalTopics > 0 ? "No neglected subject right now." : "Track topics in Syllabus Map first.";
  }
  if (insights.neglectedSubject.daysSinceLastStudy === undefined) {
    return `${insights.neglectedSubject.topicTitle} has not been studied yet.`;
  }
  if (insights.neglectedSubject.daysSinceLastStudy <= 0) {
    return `${insights.neglectedSubject.topicTitle} was touched today.`;
  }
  if (insights.neglectedSubject.daysSinceLastStudy === 1) {
    return `${insights.neglectedSubject.topicTitle} — last studied 1 day ago.`;
  }
  return `${insights.neglectedSubject.topicTitle} — last studied ${insights.neglectedSubject.daysSinceLastStudy} days ago.`;
};

const formatNextTopicValue = (insights: SyllabusDashboardInsights) => {
  if (!insights.nextRecommendedTopic) {
    return insights.totalTopics > 0 ? "No recommendation yet" : "Add syllabus topics";
  }
  return insights.nextRecommendedTopic.topicTitle;
};

const formatNextTopicDetail = (insights: SyllabusDashboardInsights) => {
  if (!insights.nextRecommendedTopic) {
    return insights.totalTopics > 0
      ? "Complete a few sessions to unlock the next topic suggestion."
      : "Use Syllabus Map to add subjects, units, and topics.";
  }
  const { nextRecommendedTopic } = insights;
  if (nextRecommendedTopic.reason === "exam_priority" && nextRecommendedTopic.examDaysAway !== undefined) {
    if (nextRecommendedTopic.examDaysAway === 0) return `${nextRecommendedTopic.subjectName} · Exam today`;
    if (nextRecommendedTopic.examDaysAway === 1) return `${nextRecommendedTopic.subjectName} · Exam in 1 day`;
    return `${nextRecommendedTopic.subjectName} · Exam in ${nextRecommendedTopic.examDaysAway} days`;
  }
  if (nextRecommendedTopic.reason === "neglected_subject") {
    return `${nextRecommendedTopic.subjectName} · Best place to restart`;
  }
  return `${nextRecommendedTopic.subjectName} · Best next unfinished topic`;
};

const insightItems = (insights: SyllabusDashboardInsights) => [
  {
    label: "Completion",
    value: `${insights.completionPercent}%`,
    detail: insights.totalTopics > 0
      ? `${insights.coveredTopics} of ${insights.totalTopics} topics covered`
      : "Add topics in Syllabus Map",
    icon: BookOpen,
    tone: "bg-teal/10 text-teal",
    iconBg: "bg-teal text-white",
    isPercent: true,
    pct: insights.completionPercent,
  },
  {
    label: "Needs Attention",
    value: insights.neglectedSubject?.subjectName ?? "All active",
    detail: formatNeglectedDetail(insights),
    icon: AlertCircle,
    tone: "bg-coral/10 text-coral",
    iconBg: "bg-coral text-white",
    isPercent: false,
    pct: 0,
  },
  {
    label: "Next Topic",
    value: formatNextTopicValue(insights),
    detail: formatNextTopicDetail(insights),
    icon: Lightbulb,
    tone: "bg-lavender-500/10 text-lavender-600",
    iconBg: "bg-lavender-500 text-white",
    isPercent: false,
    pct: 0,
  },
];

export const SyllabusInsightsCard = ({ insights }: SyllabusInsightsCardProps) => {
  const items = insightItems(insights);

  return (
    <Card tone="white" className="overflow-hidden p-5 sm:p-6">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Syllabus Insights
          </p>
          <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight text-navy dark:text-slate-100">
            What to finish next
          </h3>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl bg-cream p-4 dark:bg-surface-800/60"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${item.iconBg}`}>
                    <Icon size={13} />
                  </div>
                </div>

                <p className="text-base font-extrabold tracking-tight text-navy dark:text-slate-100 leading-tight">
                  {item.value}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.detail}</p>

                {item.isPercent && (
                  <div className="mt-3 progress-bar-track">
                    <div
                      className="progress-bar-fill bg-teal"
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
