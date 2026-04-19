import { useMemo, useState } from "react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { SessionCard } from "../components/history/SessionCard";
import { Card } from "../components/ui/Card";
import { SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { getResolvedSubject } from "../utils/subjects";

export const SessionHistoryPage = () => {
  const { sessions, subjects } = useFocusFlowData();
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "duration" | "focus">("recent");

  const filteredSessions = useMemo(() => {
    const bySubject =
      subjectFilter === "all"
        ? sessions
        : sessions.filter((session) => session.subjectId === subjectFilter);

    const bySearch = bySubject.filter((session) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        session.subjectName.toLowerCase().includes(query) ||
        (session.note ?? "").toLowerCase().includes(query)
      );
    });

    const getFocusScore = (actual: number, planned: number) =>
      Math.min(100, Math.round((actual / Math.max(1, planned)) * 100));

    return [...bySearch].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.endedAt).getTime() - new Date(b.endedAt).getTime();
      }
      if (sortBy === "duration") return b.actualMinutes - a.actualMinutes;
      if (sortBy === "focus")
        return getFocusScore(b.actualMinutes, b.plannedMinutes) - getFocusScore(a.actualMinutes, a.plannedMinutes);
      return new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime();
    });
  }, [sessions, subjectFilter, searchQuery, sortBy]);

  return (
    <DashboardContainer className="max-w-3xl">
      <SectionContainer
        title="Session History"
        description="Review previous sessions with cleaner filters and more readable summaries."
      >
        <Card className="p-5 sm:p-6">
          <div className="space-y-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject or note"
              className="field-surface"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                className="field-surface"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                className="field-surface"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "oldest" | "duration" | "focus")}
              >
                <option value="recent">Recent</option>
                <option value="oldest">Oldest</option>
                <option value="duration">Duration</option>
                <option value="focus">Focus</option>
              </select>
            </div>
          </div>
        </Card>

        <div
          className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {filteredSessions.map((session) => (
            <div key={session.id}>
              <SessionCard
                session={session}
                subject={getResolvedSubject(subjects, {
                  subjectId: session.subjectId,
                  subjectName: session.subjectName,
                })}
              />
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <Card className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No sessions match this filter. Try changing search or sort.
              </p>
            </Card>
          )}
        </div>
      </SectionContainer>
    </DashboardContainer>
  );
};
