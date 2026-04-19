import type { ReactNode } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { StudyHeatmapCard } from "../components/analytics/StudyHeatmapCard";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { SubjectBadge } from "../components/subjects/SubjectBadge";
import { Card } from "../components/ui/Card";
import { SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import {
  getDailyStudyTime,
  getFocusVsDistractionTrend,
  getStudyHeatmap,
  getSubjectDistribution,
  getWeeklyTrend,
} from "../utils/analytics";
import { getDominantSubjectFromSessions, getResolvedSubject, getSubjectVisuals, withAlpha } from "../utils/subjects";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartCardClassName = "space-y-5 overflow-hidden p-5 sm:p-6";
const gridStroke = "#dbe4f0";

const AnimatedCard = ({
  children,
  delay,
  className,
}: {
  children: ReactNode;
  delay: number;
  className?: string;
}) => (
  <div className={className} style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
    {children}
  </div>
);

export const AnalyticsPage = () => {
  const { sessions, subjects } = useFocusFlowData();
  const dailyStudyTime = getDailyStudyTime(sessions, 7);
  const weeklyTrend = getWeeklyTrend(sessions, 6);
  const subjectDistribution = getSubjectDistribution(sessions);
  const focusTrend = getFocusVsDistractionTrend(sessions, 7);
  const heatmap = getStudyHeatmap(sessions, 28);
  const hasData = sessions.length > 0;
  const totalMinutes = sessions.reduce((sum, session) => sum + session.actualMinutes, 0);
  const weeklyMinutes = dailyStudyTime.reduce((sum, item) => sum + item.value, 0);
  const averageFocus =
    sessions.length === 0
      ? 0
      : Math.round(
          sessions.reduce((sum, session) => {
            const focusScore = Math.min(
              100,
              Math.round((session.actualMinutes / Math.max(1, session.plannedMinutes)) * 100),
            );
            return sum + focusScore;
          }, 0) / sessions.length,
        );
  const activeDays = heatmap.filter((cell) => cell.minutes > 0).length;
  const topSubject = getDominantSubjectFromSessions(sessions, subjects);
  const topSubjectMinutes = topSubject
    ? sessions
        .filter(
          (session) =>
            session.subjectId === topSubject.id || session.subjectName.toLowerCase() === topSubject.name.toLowerCase(),
        )
        .reduce((sum, session) => sum + session.actualMinutes, 0)
    : 0;
  const topSubjectShare = Math.min(100, Math.round((topSubjectMinutes / Math.max(1, totalMinutes)) * 100));
  const topSubjectVisuals = topSubject ? getSubjectVisuals(topSubject.color) : undefined;

  return (
    <DashboardContainer>
      <SectionContainer
        title="Analytics"
        description="Clear trends, calmer charts, and a more readable sense of what is actually working."
      >
        {!hasData ? (
          <Card className="p-6">
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
              Complete sessions to unlock your analytics dashboard.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <AnimatedCard delay={0} className="animate-fade-up">
                <Card className="space-y-3 p-5 sm:p-6">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700/10 text-brand-700">
                    <TrendingUp size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Weekly Minutes
                    </p>
                    <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {weeklyMinutes}m
                    </p>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                      Across the last 7 days.
                    </p>
                  </div>
                </Card>
              </AnimatedCard>

              <AnimatedCard delay={80} className="animate-fade-up">
                <Card className="space-y-3 p-5 sm:p-6">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <Sparkles size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Average Focus
                    </p>
                    <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {averageFocus}%
                    </p>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                      {activeDays} active days in the last 28.
                    </p>
                  </div>
                </Card>
              </AnimatedCard>

              <AnimatedCard delay={160} className="animate-fade-up">
                <Card className="space-y-4 p-5 sm:p-6" style={topSubjectVisuals?.panelStyle}>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Top Subject
                    </p>
                    {topSubject ? (
                      <>
                        <SubjectBadge subject={topSubject} />
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {topSubjectMinutes} minutes logged, {topSubjectShare}% of total study time.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                        Start a few sessions to reveal your strongest subject pattern.
                      </p>
                    )}
                  </div>
                </Card>
              </AnimatedCard>
            </div>

            <StudyHeatmapCard cells={heatmap} subjects={subjects} />

            <div className="grid gap-4 lg:grid-cols-2">
              <AnimatedCard delay={40} className="animate-fade-up">
                <Card className={chartCardClassName}>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Weekly Trend
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300">Minutes per week</p>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={topSubject?.color ?? "#5a55f5"}
                          strokeWidth={3}
                          dot={{ r: 3, fill: topSubject?.color ?? "#5a55f5" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </AnimatedCard>

              <AnimatedCard delay={120} className="animate-fade-up">
                <Card className={chartCardClassName}>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Daily Study
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300">Last 7 days</p>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyStudyTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill={topSubject?.color ?? "#7c73ff"} radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </AnimatedCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AnimatedCard delay={80} className="animate-fade-up">
                <Card className={chartCardClassName}>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Subject Split
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300">Where your study time goes</p>
                  </div>
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_210px]">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subjectDistribution}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                          >
                            {subjectDistribution.map((item) => {
                              const subject = getResolvedSubject(subjects, {
                                subjectId: item.subjectId,
                                subjectName: item.label,
                              });

                              return <Cell key={item.id} fill={subject?.color ?? "#5a55f5"} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {subjectDistribution.map((item) => {
                        const subject = getResolvedSubject(subjects, {
                          subjectId: item.subjectId,
                          subjectName: item.label,
                        });

                        return (
                          <div
                            key={item.id}
                            className="rounded-[1.35rem] border border-slate-200/70 bg-white/70 p-3 shadow-soft dark:border-white/10 dark:bg-surface-900/70"
                            style={
                              subject
                                ? {
                                    borderColor: withAlpha(subject.color, 0.16),
                                    boxShadow: `0 18px 38px -32px ${withAlpha(subject.color, 0.55)}`,
                                  }
                                : undefined
                            }
                          >
                            {subject ? <SubjectBadge subject={subject} /> : null}
                            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                              <span>{item.value}m</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </AnimatedCard>

              <AnimatedCard delay={160} className="animate-fade-up">
                <Card className={chartCardClassName}>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Focus Trend
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300">Focus score vs distractions</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={focusTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="focusScore"
                          name="Focus"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="distractions"
                          name="Distractions"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </AnimatedCard>
            </div>
          </>
        )}
      </SectionContainer>
    </DashboardContainer>
  );
};
