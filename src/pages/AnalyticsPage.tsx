import type { ReactNode } from "react";
import { Sparkles, TrendingUp, Clock, AlertTriangle, Zap, BookOpen, AlertCircle } from "lucide-react";
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
import { getResolvedSubject } from "../utils/subjects";
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

  // Best Study Hours
  const hourCounts = sessions.reduce((acc, session) => {
    const hour = new Date(session.startedAt).getHours();
    acc[hour] = (acc[hour] || 0) + session.actualMinutes;
    return acc;
  }, {} as Record<number, number>);
  const bestHour = Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0]?.[0];
  const bestStudyHourStr = bestHour 
    ? `${parseInt(bestHour) % 12 || 12} ${parseInt(bestHour) >= 12 ? 'PM' : 'AM'} - ${(parseInt(bestHour)+1) % 12 || 12} ${(parseInt(bestHour)+1) >= 12 ? 'PM' : 'AM'}` 
    : "Not enough data";

  // Distraction Analytics
  const allTags = sessions.flatMap(s => s.distractionTags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonDistraction = Object.entries(tagCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || "None logged";

  // Consistency (Streak)
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dayHasSession = sessions.some(s => {
      const sDate = new Date(s.startedAt);
      return sDate.getFullYear() === checkDate.getFullYear() && sDate.getMonth() === checkDate.getMonth() && sDate.getDate() === checkDate.getDate();
    });
    if (dayHasSession) currentStreak++;
    else if (i !== 0) break; // skip today if no session yet, but break if yesterday had no session
  }

  // Subject Performance
  const subjectMins = sessions.reduce((acc, s) => {
    acc[s.subjectName] = (acc[s.subjectName] || 0) + s.actualMinutes;
    return acc;
  }, {} as Record<string, number>);
  const sortedSubjects = Object.entries(subjectMins).sort(([,a], [,b]) => b - a);
  const strongestSubject = sortedSubjects[0]?.[0] || "None";
  const weakestSubject = sortedSubjects.length > 1 ? sortedSubjects[sortedSubjects.length - 1]?.[0] : "None";
  
  // Find neglected subject (in subjects list but 0 minutes)
  const neglectedSubject = subjects.find(sub => !subjectMins[sub.name])?.name || "None";

  return (
    <DashboardContainer>
      <SectionContainer
        title="Analytics & Insights"
        description="Deep dive into your productivity trends, best study hours, and distraction patterns."
      >
        {!hasData ? (
          <Card className="p-6">
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
              Complete sessions to unlock your analytics dashboard.
            </p>
          </Card>
        ) : (
          <>
            {/* 1. Focus Trends & Consistency Overview */}
            <div className="grid gap-4 lg:grid-cols-4">
              <AnimatedCard delay={0} className="animate-fade-up">
                <Card className="space-y-3 p-5 h-full border-l-4 border-l-brand-500">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Focus</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalMinutes} <span className="text-sm font-medium text-slate-500">min</span></p>
                  </div>
                </Card>
              </AnimatedCard>

              <AnimatedCard delay={50} className="animate-fade-up">
                <Card className="space-y-3 p-5 h-full border-l-4 border-l-orange-500">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Streak</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentStreak} <span className="text-sm font-medium text-slate-500">days</span></p>
                  </div>
                </Card>
              </AnimatedCard>

              <AnimatedCard delay={100} className="animate-fade-up">
                <Card className="space-y-3 p-5 h-full border-l-4 border-l-emerald-500">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Best Study Hours</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{bestStudyHourStr}</p>
                  </div>
                </Card>
              </AnimatedCard>
              
              <AnimatedCard delay={150} className="animate-fade-up">
                <Card className="space-y-3 p-5 h-full border-l-4 border-l-rose-500">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top Distraction</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 capitalize">{mostCommonDistraction}</p>
                  </div>
                </Card>
              </AnimatedCard>
            </div>

            {/* 2. Subject Performance */}
            <AnimatedCard delay={200} className="animate-fade-up mt-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="p-5 flex items-center gap-4 border border-slate-200/60 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Strongest Subject</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{strongestSubject}</p>
                  </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 border border-slate-200/60 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Weakest Subject</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{weakestSubject}</p>
                  </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 border border-slate-200/60 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Neglected Subject</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{neglectedSubject}</p>
                  </div>
                </Card>
              </div>
            </AnimatedCard>

            <StudyHeatmapCard cells={heatmap} subjects={subjects} />

            {/* 3. Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <AnimatedCard delay={250} className="animate-fade-up">
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
                          stroke="#5a55f5"
                          strokeWidth={3}
                          dot={{ r: 3, fill: "#5a55f5" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </AnimatedCard>

              <AnimatedCard delay={300} className="animate-fade-up">
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
                        <Bar dataKey="value" fill="#7c73ff" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </AnimatedCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 mt-4">
              <AnimatedCard delay={350} className="animate-fade-up">
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

              <AnimatedCard delay={400} className="animate-fade-up">
                <Card className={chartCardClassName}>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Distraction Pattern
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
