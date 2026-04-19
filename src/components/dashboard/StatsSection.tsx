import { StatCard } from "../ui";

interface StatsSectionProps {
  todayMinutes: string;
  totalSessions: string;
  focusScore: string;
}

export const StatsSection = ({ todayMinutes, totalSessions, focusScore }: StatsSectionProps) => {
  const stats = [
    { label: "Today", value: todayMinutes },
    { label: "Sessions", value: totalSessions },
    { label: "Focus", value: focusScore },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {stats.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} compact />
      ))}
    </section>
  );
};
