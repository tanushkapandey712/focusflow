import { useMemo, useState } from "react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { SessionCard } from "../components/history/SessionCard";
import { Card } from "../components/ui/Card";
import { SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { getSessionSyllabusLink, rebuildSubjectsWithSessionProgress } from "../utils/syllabusProgress";
import { getResolvedSubject } from "../utils/subjects";
import { Clock, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

export const SessionHistoryPage = () => {
  const { sessions, subjects, updateSession, setSubjects } = useFocusFlowData();
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "duration" | "focus">("recent");

  const filteredSessions = useMemo(() => {
    let result = sessions;

    if (subjectFilter !== "all") {
      result = result.filter((s) => s.subjectId === subjectFilter);
    }

    if (durationFilter !== "all") {
      result = result.filter((s) => {
        if (durationFilter === "short") return s.actualMinutes < 30;
        if (durationFilter === "medium") return s.actualMinutes >= 30 && s.actualMinutes <= 60;
        if (durationFilter === "long") return s.actualMinutes > 60;
        return true;
      });
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((s) => 
        s.subjectName.toLowerCase().includes(query) ||
        (s.note ?? "").toLowerCase().includes(query) ||
        (s.syllabusTopic?.topicTitle ?? "").toLowerCase().includes(query)
      );
    }

    const getFocusScore = (actual: number, planned: number) =>
      Math.min(100, Math.round((actual / Math.max(1, planned)) * 100));

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.endedAt).getTime() - new Date(b.endedAt).getTime();
      }
      if (sortBy === "duration") return b.actualMinutes - a.actualMinutes;
      if (sortBy === "focus")
        return getFocusScore(b.actualMinutes, b.plannedMinutes) - getFocusScore(a.actualMinutes, a.plannedMinutes);
      return new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime();
    });
  }, [sessions, subjectFilter, durationFilter, searchQuery, sortBy]);

  const handleSaveTopicLink = (
    sessionId: string,
    params: { subjectId: string; unitId: string; topicId: string },
  ) => {
    const nextSubject = subjects.find((subject) => subject.id === params.subjectId);
    const currentSession = sessions.find((session) => session.id === sessionId);

    if (!nextSubject || !currentSession) return;

    const syllabusTopic = getSessionSyllabusLink(nextSubject, params.unitId, params.topicId);
    if (!syllabusTopic) return;

    const patch = {
      subjectId: nextSubject.id,
      subjectName: nextSubject.name,
      syllabusTopic,
    };

    updateSession(sessionId, patch);

    const nextSessions = sessions.map((session) =>
      session.id === sessionId ? { ...session, ...patch } : session,
    );
    setSubjects(rebuildSubjectsWithSessionProgress(subjects, nextSessions));
  };

  // Compact statistics summary
  const summaryStats = useMemo(() => {
    const totalSessions = filteredSessions.length;
    const totalMinutes = filteredSessions.reduce((acc, s) => acc + s.actualMinutes, 0);
    const avgFocus = totalSessions > 0 
      ? Math.round(filteredSessions.reduce((acc, s) => acc + Math.min(100, Math.round((s.actualMinutes / Math.max(1, s.plannedMinutes)) * 100)), 0) / totalSessions)
      : 0;
    const successfulSessions = filteredSessions.filter(s => s.actualMinutes >= s.plannedMinutes * 0.9).length;

    return { totalSessions, totalMinutes, avgFocus, successfulSessions };
  }, [filteredSessions]);

  return (
    <DashboardContainer className="max-w-4xl">
      <SectionContainer
        title="Session History"
        description="Review previous sessions with clean filters, robust search, and quick insights."
      >
        {/* Compact Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 flex flex-col justify-center items-center text-center bg-brand-50/50 border-brand-100/50 dark:bg-brand-900/10 dark:border-brand-900/30">
            <TrendingUp size={20} className="text-brand-500 mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summaryStats.totalSessions}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sessions</p>
          </Card>
          <Card className="p-4 flex flex-col justify-center items-center text-center bg-blue-50/50 border-blue-100/50 dark:bg-blue-900/10 dark:border-blue-900/30">
            <Clock size={20} className="text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {Math.floor(summaryStats.totalMinutes / 60)}h {summaryStats.totalMinutes % 60}m
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Time</p>
          </Card>
          <Card className="p-4 flex flex-col justify-center items-center text-center bg-emerald-50/50 border-emerald-100/50 dark:bg-emerald-900/10 dark:border-emerald-900/30">
            <CheckCircle2 size={20} className="text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summaryStats.avgFocus}%</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Focus</p>
          </Card>
          <Card className="p-4 flex flex-col justify-center items-center text-center bg-amber-50/50 border-amber-100/50 dark:bg-amber-900/10 dark:border-amber-900/30">
            <AlertTriangle size={20} className="text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summaryStats.successfulSessions}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Targets Hit</p>
          </Card>
        </div>

        <Card className="p-5 sm:p-6 mb-6">
          <div className="space-y-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, topic, or note..."
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="all">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              
              <select
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
              >
                <option value="all">Any Duration</option>
                <option value="short">Short (&lt; 30m)</option>
                <option value="medium">Medium (30-60m)</option>
                <option value="long">Deep Work (&gt; 60m)</option>
              </select>

              <select
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "oldest" | "duration" | "focus")}
              >
                <option value="recent">Sort: Most Recent</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="duration">Sort: Longest First</option>
                <option value="focus">Sort: Highest Focus</option>
              </select>
            </div>
          </div>
        </Card>

        <div
          className="space-y-4"
        >
          {filteredSessions.map((session) => (
            <div key={session.id} className="animate-fade-up">
              <SessionCard
                session={session}
                subjects={subjects}
                subject={getResolvedSubject(subjects, {
                  subjectId: session.subjectId,
                  subjectName: session.subjectName,
                })}
                onSaveTopicLink={handleSaveTopicLink}
              />
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No sessions match this filter. Try changing search or sort.
              </p>
            </div>
          )}
        </div>
      </SectionContainer>
    </DashboardContainer>
  );
};
