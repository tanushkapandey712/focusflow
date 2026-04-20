import type { SyllabusDashboardInsights } from "../../utils/recommendations";
import { Card } from "../ui";

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
    return `${insights.neglectedSubject.topicTitle} was last studied 1 day ago.`;
  }

  return `${insights.neglectedSubject.topicTitle} was last studied ${insights.neglectedSubject.daysSinceLastStudy} days ago.`;
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
    if (nextRecommendedTopic.examDaysAway === 0) {
      return `${nextRecommendedTopic.subjectName} · ${nextRecommendedTopic.unitTitle} · Exam today`;
    }

    if (nextRecommendedTopic.examDaysAway === 1) {
      return `${nextRecommendedTopic.subjectName} · ${nextRecommendedTopic.unitTitle} · Exam in 1 day`;
    }

    return `${nextRecommendedTopic.subjectName} · ${nextRecommendedTopic.unitTitle} · Exam in ${nextRecommendedTopic.examDaysAway} days`;
  }

  if (nextRecommendedTopic.reason === "neglected_subject") {
    return `${nextRecommendedTopic.subjectName} · ${nextRecommendedTopic.unitTitle} · Best place to restart`;
  }

  return `${nextRecommendedTopic.subjectName} · ${nextRecommendedTopic.unitTitle} · Best next unfinished topic`;
};

export const SyllabusInsightsCard = ({ insights }: SyllabusInsightsCardProps) => {
  const items = [
    {
      label: "Completion",
      value: `${insights.completionPercent}%`,
      detail:
        insights.totalTopics > 0
          ? `${insights.coveredTopics} of ${insights.totalTopics} topics covered`
          : "Add topics in Syllabus Map",
    },
    {
      label: "Neglected Subject",
      value: insights.neglectedSubject?.subjectName ?? "All active",
      detail: formatNeglectedDetail(insights),
    },
    {
      label: "Next Topic",
      value: formatNextTopicValue(insights),
      detail: formatNextTopicDetail(insights),
    },
  ];

  return (
    <Card className="animate-fade-up overflow-hidden p-5 sm:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Syllabus Insights
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              What to finish next
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              A quick read on coverage, neglected subjects, and the cleanest next topic to pick up.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] bg-slate-50/88 p-4 shadow-soft ring-1 ring-white/70 dark:bg-slate-900/72 dark:ring-white/5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
