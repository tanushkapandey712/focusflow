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
    { label: "Today", value: todayMinutes, trend: todayTrend },
    { label: "Sessions", value: totalSessions },
    { label: "Focus", value: focusScore },
    { label: "Top Subject", value: topSubjectTime, detail: topSubjectDetail },
    { label: "Syllabus", value: syllabusCompletion, detail: syllabusDetail },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          detail={item.detail}
          compact
        />
      ))}
    </section>
  );
};
