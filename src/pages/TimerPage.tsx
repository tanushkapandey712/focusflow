import { useEffect, useMemo, useState } from "react";
import { WebcamPanel } from "../components/focus/WebcamPanel";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { GradientCard, SectionContainer } from "../components/ui";
import { formatTimer } from "../features/timer/format";
import { TimerCard } from "../features/timer/TimerCard";
import { TIMER_PRESETS } from "../features/timer/types";
import { useStudyTimer } from "../features/timer/useStudyTimer";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { useFocusTracking } from "../hooks/useFocusTracking";

export const TimerPage = () => {
  const { subjects, addSession } = useFocusFlowData();
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id ?? "");
  const [goal, setGoal] = useState("");
  const [distractionTags, setDistractionTags] = useState<string[]>([]);

  const timer = useStudyTimer({ presets: TIMER_PRESETS });
  const cameraTracking = useFocusTracking();

  useEffect(() => {
    if (subjects.length === 0) {
      if (selectedSubjectId) {
        setSelectedSubjectId("");
      }
      return;
    }

    if (!subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [selectedSubjectId, subjects]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId),
    [subjects, selectedSubjectId],
  );

  const handleEndSession = () => {
    if (!selectedSubject) return;
    const result = timer.end();
    const focusTrackingSummary = cameraTracking.finishSessionTracking({
      startedAt: result.startedAt,
      endedAt: result.endedAt,
    });
    const autoDistractionTags = [
      ...(focusTrackingSummary && focusTrackingSummary.totalAwayEvents > 0
        ? ["away from frame"]
        : []),
      ...(focusTrackingSummary && focusTrackingSummary.lookingAwayEvents > 0
        ? ["looked away"]
        : []),
      ...(focusTrackingSummary && focusTrackingSummary.longEyeClosureEvents > 0
        ? ["long eye closure"]
        : []),
    ];
    const allDistractionTags = Array.from(new Set([...distractionTags, ...autoDistractionTags]));

    addSession({
      id: crypto.randomUUID(),
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      startedAt: result.startedAt.toISOString(),
      endedAt: result.endedAt.toISOString(),
      plannedMinutes: result.plannedMinutes,
      actualMinutes: result.actualMinutes,
      distractionCount: distractionTags.length + (focusTrackingSummary?.distractionEvents ?? 0),
      distractionTags: allDistractionTags,
      goal: goal.trim() || undefined,
      focusTracking: focusTrackingSummary ?? undefined,
    });
    setGoal("");
    setDistractionTags([]);
  };

  return (
    <DashboardContainer>
      <SectionContainer
        title="Study Timer"
        description="A clean focus timer with optional on-device camera cues, smooth controls, and no extra clutter."
      >
        <TimerCard
          subjects={subjects}
          selectedSubject={selectedSubject}
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={setSelectedSubjectId}
          goal={goal}
          onGoalChange={setGoal}
          distractionTags={distractionTags}
          onDistractionTagsChange={setDistractionTags}
          presets={TIMER_PRESETS}
          mode={timer.mode}
          onModeChange={timer.setMode}
          customMinutes={timer.customMinutes}
          onCustomMinutesChange={timer.setCustomMinutes}
          timerText={formatTimer(timer.remainingSec)}
          status={timer.status}
          progress={timer.progress}
          accent={timer.activePreset.accent}
          onStart={() => {
            if (!selectedSubject) return;
            setDistractionTags([]);
            cameraTracking.beginSessionTracking();
            timer.start();
          }}
          onPause={timer.pause}
          onResume={timer.resume}
          onEnd={handleEndSession}
          onReset={() => {
            cameraTracking.resetSessionTracking();
            timer.reset();
          }}
        />
      </SectionContainer>

      <WebcamPanel
        tracker={cameraTracking}
        sessionRunning={timer.status === "running" || timer.status === "paused"}
      />

      <GradientCard tone="mint" className="animate-fade-up mx-auto max-w-3xl p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Built to stay calm under focus.</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The timer stays simple: choose the subject, define the goal, and let the rest of the block feel lighter.
        </p>
      </GradientCard>
    </DashboardContainer>
  );
};
