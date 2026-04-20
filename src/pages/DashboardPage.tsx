import { useMemo } from "react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { AnalyticsPreviewCard } from "../components/dashboard/AnalyticsPreviewCard";
import { FocusSnapshotCard } from "../components/dashboard/FocusSnapshotCard";
import { GreetingSection } from "../components/dashboard/GreetingSection";
import { StatsSection } from "../components/dashboard/StatsSection";
import { SuggestionsCard } from "../components/dashboard/SuggestionsCard";
import { SyllabusInsightsCard } from "../components/dashboard/SyllabusInsightsCard";
import { TimerSectionCard } from "../components/dashboard/TimerSectionCard";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { useFocusTracking } from "../hooks/useFocusTracking";
import { formatMinutes } from "../utils/date";
import { generateRecommendations, getSyllabusDashboardInsights } from "../utils/recommendations";
import {
  getSubjectStudyBreakdown,
  getSyllabusCompletionSummary,
} from "../utils/syllabusProgress";

export const DashboardPage = () => {
  const { summary, sessions, subjects, profile } = useFocusFlowData();
  const focusTracking = useFocusTracking();

  const weeklyBars = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    const dayKey = date.toDateString();
    return sessions
      .filter((session) => new Date(session.endedAt).toDateString() === dayKey)
      .reduce((sum, session) => sum + session.actualMinutes, 0);
  });

  const focusScore = sessions.length
    ? Math.round(
        (sessions.reduce((sum, session) => sum + session.actualMinutes, 0) /
          sessions.reduce((sum, session) => sum + Math.max(1, session.plannedMinutes), 0)) *
          100,
      )
    : 0;

  const suggestions = generateRecommendations(sessions, subjects);
  const subjectBreakdown = useMemo(
    () => getSubjectStudyBreakdown(sessions, subjects),
    [sessions, subjects],
  );
  const syllabusCompletion = useMemo(
    () => getSyllabusCompletionSummary(subjects),
    [subjects],
  );
  const syllabusInsights = useMemo(
    () => getSyllabusDashboardInsights(subjects, sessions),
    [subjects, sessions],
  );
  const topSubject = subjectBreakdown[0];

  return (
    <DashboardContainer>
      <GreetingSection userName={profile.name} message="Ready for a calm, focused study day?" />

      <StatsSection
        todayMinutes={formatMinutes(summary.todayMinutes)}
        totalSessions={String(summary.totalSessions)}
        focusScore={`${focusScore}%`}
        topSubjectTime={topSubject ? formatMinutes(topSubject.minutes) : "--"}
        topSubjectDetail={topSubject ? topSubject.subjectName : "No tracked study time yet"}
        syllabusCompletion={`${syllabusCompletion.completionPercent}%`}
        syllabusDetail={
          syllabusCompletion.totalTopics > 0
            ? `${syllabusCompletion.coveredTopics} of ${syllabusCompletion.totalTopics} topics covered`
            : "Add topics in Syllabus Map"
        }
      />

      <SyllabusInsightsCard insights={syllabusInsights} />

      <FocusSnapshotCard
        isCameraActive={focusTracking.isCameraActive}
        attentionStatus={focusTracking.attentionStatus}
        attentionScore={focusTracking.attentionScore}
        distractionCount={focusTracking.distractionCount}
        awayTimeMs={focusTracking.awayTime}
        focusStreakMs={focusTracking.focusStreak}
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <TimerSectionCard activeMinutes={profile.preferredMode === "deep-work" ? 50 : 25} />
        <SuggestionsCard suggestions={suggestions} />
      </div>

      <AnalyticsPreviewCard points={weeklyBars} />
    </DashboardContainer>
  );
};
