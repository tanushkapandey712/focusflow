import { StatCard } from "../ui";

interface StatsSectionProps {
  todayMinutes: string;
  todayTrend?: string;
  totalSessions: string;
  focusScore: string;
  topSubjectTime: string;
  topSubjectDetail: string;
  syllabusCompletion: string;
  syllabusDetail: string;
}

export const StatsSection = ({
  todayMinutes,
  todayTrend,
  totalSessions,
  focusScore,
  topSubjectTime,
  topSubjectDetail,
  syllabusCompletion,
  syllabusDetail,
}: StatsSectionProps) => {
  const stats = [
    { label: "Today", value: todayMinutes, trend: todayTrend, tone: "teal" as const },
    { label: "Sessions", value: totalSessions, tone: "lavender" as const },
    { label: "Focus Score", value: focusScore, tone: "coral" as const },
    { label: "Top Subject", value: topSubjectTime, detail: topSubjectDetail, tone: "peach" as const },
    { label: "Syllabus", value: syllabusCompletion, detail: syllabusDetail, tone: "white" as const },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          trend={item.trend}
          detail={item.detail}
          tone={item.tone}
          compact
        />
      ))}
    </section>
  );
};
