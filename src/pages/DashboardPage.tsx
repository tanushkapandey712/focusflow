import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Clock, Target, Flame, CheckCircle2, TrendingUp, Sparkles, BookOpen } from "lucide-react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { Button, Card, GradientCard } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { formatMinutes } from "../utils/date";
import { generateRecommendations } from "../utils/recommendations";
import { getSyllabusCompletionSummary } from "../utils/syllabusProgress";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { summary, sessions, subjects, profile } = useFocusFlowData();

  // Stats Data
  const weeklyBars = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    const dayKey = date.toDateString();
    return sessions
      .filter((session) => new Date(session.endedAt).toDateString() === dayKey)
      .reduce((sum, session) => sum + session.actualMinutes, 0);
  });

  const maxWeeklyBar = Math.max(...weeklyBars, 1);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      if (weeklyBars[6 - i] > 0) streak++;
      else break;
    }
    return streak;
  }, [weeklyBars]);

  const consistencyScore = sessions.length
    ? Math.round(
        (sessions.reduce((sum, session) => sum + session.actualMinutes, 0) /
          sessions.reduce((sum, session) => sum + Math.max(1, session.plannedMinutes), 0)) *
          100,
      )
    : 0;

  const syllabusCompletion = useMemo(
    () => getSyllabusCompletionSummary(subjects),
    [subjects],
  );

  const suggestions = useMemo(
    () => generateRecommendations(sessions, subjects),
    [sessions, subjects],
  );

  // Derive "Next Recommended Session" from suggestions
  const subjectSuggestion = suggestions.find(s => s.category === "subject")?.message || "Productivity 101";
  const recommendedSubject = subjects.find(s => subjectSuggestion.includes(s.name)) || subjects[0];

  // Derive "Recently Active Subjects"
  const recentlyActiveSubjects = useMemo(() => {
    const recentSessionSubjectIds = sessions
      .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime())
      .map(s => s.subjectId)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);
      
    return recentSessionSubjectIds
      .map(id => subjects.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
  }, [sessions, subjects]);

  const displayRecent = recentlyActiveSubjects.length > 0 ? recentlyActiveSubjects : subjects.slice(0, 2);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <DashboardContainer>
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* 1. Welcome Section */}
        <div className="animate-fade-up">
          <GradientCard tone="lavender" className="relative overflow-hidden p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/20 blur-3xl dark:bg-white/10" />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-600/80 dark:text-white/60">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {greeting}, {profile.name || "Student"}
                </h1>
                {recommendedSubject && (
                  <div className="flex items-center gap-2 text-slate-700 bg-white/40 dark:bg-black/10 rounded-full px-4 py-2 w-fit">
                    <Sparkles size={16} className="text-brand-600 dark:text-brand-400" />
                    <span className="text-sm font-medium dark:text-slate-200">
                      Up next: <strong>{recommendedSubject.name}</strong> • 25m Focus Block
                    </span>
                  </div>
                )}
              </div>
              <Button
                onClick={() => navigate("/timer")}
                className="w-full md:w-auto rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xl h-12 px-6"
              >
                <Clock size={18} className="mr-2" />
                Start Session
              </Button>
            </div>
          </GradientCard>
        </div>

        {/* 2. Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
          {[
            { label: "Today's Focus", value: formatMinutes(summary.todayMinutes), icon: Clock, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
            { label: "Day Streak", value: currentStreak, icon: Flame, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
            { label: "Topics Covered", value: syllabusCompletion.coveredTopics, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            { label: "Consistency", value: `${consistencyScore}%`, icon: Target, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-500/10" },
          ].map((stat, i) => (
            <Card key={i} className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 dark:bg-slate-800/90">
              <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
          
          <div className="space-y-6">
            {/* 3. Smart Suggestions */}
            <Card className="p-6 h-full dark:bg-slate-800/90">
              <div className="flex items-center gap-2 mb-6">
                <Brain size={20} className="text-brand-500" />
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">AI Insights</h2>
              </div>
              <div className="space-y-4">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                    <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                      {suggestion.message}
                    </p>
                  </div>
                ))}
                {suggestions.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Complete more sessions to receive smart insights.
                  </p>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* 4. Mini Weekly Trend */}
            <Card className="p-6 dark:bg-slate-800/90">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-brand-500" />
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Weekly Trend</h2>
                </div>
                <span className="text-xs font-bold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300 px-2 py-1 rounded-full">
                  {formatMinutes(summary.weeklyMinutes)} total
                </span>
              </div>
              <div className="h-32 flex items-end gap-2 px-2">
                {weeklyBars.map((val, i) => {
                  const height = val === 0 ? 4 : Math.max(10, (val / maxWeeklyBar) * 100);
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div 
                        className={`w-full rounded-md transition-all duration-500 ${isToday ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700 group-hover:bg-brand-300"}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 5. Continue Learning */}
            <Card className="p-6 dark:bg-slate-800/90">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} className="text-brand-500" />
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Continue Learning</h2>
                </div>
                <Link to="/syllabus" className="text-xs font-semibold text-slate-500 hover:text-brand-500">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {displayRecent.length > 0 ? (
                  displayRecent.map((subject) => (
                    <Link 
                      key={subject.id} 
                      to={`/syllabus/${subject.id}`}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color || '#3b82f6' }}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {subject.name}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400" />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No active subjects yet.
                  </p>
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </DashboardContainer>
  );
};
