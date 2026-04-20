import { useEffect, useMemo } from "react";
import { Camera, CameraOff } from "lucide-react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { FocusStatusBadge } from "../components/focus/FocusStatusBadge";
import { Button, GradientCard, SectionContainer } from "../components/ui";
import { formatTimer } from "../features/timer/format";
import { TimerCard } from "../features/timer/TimerCard";
import { TIMER_PRESETS } from "../features/timer/types";
import { useStudyTimerSession } from "../features/timer/useStudyTimerSession";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { useFocusTracking } from "../hooks/useFocusTracking";
import {
  applySessionToSubjectTopic,
  getSessionSyllabusLink,
  getValidSyllabusSelection,
} from "../utils/syllabusProgress";

export const TimerPage = () => {
  const { subjects, addSession, updateSubject } = useFocusFlowData();
  const {
    mode,
    setMode,
    status,
    remainingSec,
    progress,
    customMinutes,
    setCustomMinutes,
    activePreset,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedUnitId,
    setSelectedUnitId,
    selectedTopicId,
    setSelectedTopicId,
    goal,
    setGoal,
    distractionTags,
    setDistractionTags,
    start,
    pause,
    resume,
    reset,
    end,
    resetSessionForm,
  } = useStudyTimerSession();
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
  }, [selectedSubjectId, setSelectedSubjectId, subjects]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId),
    [selectedSubjectId, subjects],
  );
  const availableUnits = useMemo(
    () => selectedSubject?.syllabusUnits ?? [],
    [selectedSubject],
  );
  const selectedUnit = useMemo(
    () => availableUnits.find((unit) => unit.id === selectedUnitId),
    [availableUnits, selectedUnitId],
  );
  const availableTopics = useMemo(
    () => selectedUnit?.topics ?? [],
    [selectedUnit],
  );
  const selectedTopic = useMemo(
    () => availableTopics.find((topic) => topic.id === selectedTopicId),
    [availableTopics, selectedTopicId],
  );

  useEffect(() => {
    const nextSelection = getValidSyllabusSelection(
      selectedSubject,
      selectedUnitId,
      selectedTopicId,
    );

    if (nextSelection.unitId !== selectedUnitId) {
      setSelectedUnitId(nextSelection.unitId);
    }

    if (nextSelection.topicId !== selectedTopicId) {
      setSelectedTopicId(nextSelection.topicId);
    }
  }, [selectedSubject, selectedTopicId, selectedUnitId, setSelectedTopicId, setSelectedUnitId]);

  const handleEndSession = () => {
    if (!selectedSubject) return;
    const result = end();
    const endedAtIso = result.endedAt.toISOString();
    const syllabusTopic = getSessionSyllabusLink(
      selectedSubject,
      selectedUnitId,
      selectedTopicId,
    );
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
      endedAt: endedAtIso,
      plannedMinutes: result.plannedMinutes,
      actualMinutes: result.actualMinutes,
      distractionCount: distractionTags.length + (focusTrackingSummary?.distractionEvents ?? 0),
      distractionTags: allDistractionTags,
      goal: goal.trim() || undefined,
      syllabusTopic,
      focusTracking: focusTrackingSummary ?? undefined,
    });

    const nextSyllabusUnits = applySessionToSubjectTopic(selectedSubject, {
      syllabusTopic,
      actualMinutes: result.actualMinutes,
      endedAt: endedAtIso,
    });

    if (nextSyllabusUnits !== selectedSubject.syllabusUnits) {
      updateSubject(selectedSubject.id, {
        syllabusUnits: nextSyllabusUnits,
      });
    }

    resetSessionForm();
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
          availableUnits={availableUnits}
          selectedUnit={selectedUnit}
          selectedUnitId={selectedUnitId}
          onSelectUnit={setSelectedUnitId}
          availableTopics={availableTopics}
          selectedTopic={selectedTopic}
          selectedTopicId={selectedTopicId}
          onSelectTopic={setSelectedTopicId}
          goal={goal}
          onGoalChange={setGoal}
          distractionTags={distractionTags}
          onDistractionTagsChange={setDistractionTags}
          presets={TIMER_PRESETS}
          mode={mode}
          onModeChange={setMode}
          customMinutes={customMinutes}
          onCustomMinutesChange={setCustomMinutes}
          timerText={formatTimer(remainingSec)}
          status={status}
          progress={progress}
          accent={activePreset.accent}
          onStart={() => {
            if (!selectedSubject) return;
            setDistractionTags([]);
            cameraTracking.beginSessionTracking();
            start();
          }}
          onPause={pause}
          onResume={resume}
          onEnd={handleEndSession}
          onReset={() => {
            cameraTracking.resetSessionTracking();
            reset();
          }}
        />
      </SectionContainer>

      <GradientCard tone="mint" className="animate-fade-up mx-auto max-w-3xl p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Built to stay calm under focus.</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The timer stays simple: choose the subject, define the goal, and let the rest of the block feel lighter.
        </p>

        <div className="mt-5 flex flex-col gap-3 rounded-[1.4rem] bg-white/72 p-4 shadow-soft dark:bg-slate-900/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Focus Tracking
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Camera tracking stays hidden and local. Turn it on only when you want live focus signals.
              </p>
            </div>
            <FocusStatusBadge
              cameraState={cameraTracking.cameraState}
              attentionStatus={cameraTracking.attentionStatus}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!cameraTracking.isCameraActive ? (
              <Button variant="secondary" onClick={() => void cameraTracking.startCamera()} className="rounded-full px-5">
                <Camera size={15} />
                Enable tracking
              </Button>
            ) : cameraTracking.cameraState === "requesting-permission" ? (
              <Button variant="secondary" disabled className="rounded-full px-5">
                <Camera size={15} />
                Waiting for access
              </Button>
            ) : (
              <Button variant="secondary" onClick={cameraTracking.stopCamera} className="rounded-full px-5">
                <CameraOff size={15} />
                Disable tracking
              </Button>
            )}

            {cameraTracking.error ? (
              <p className="text-sm text-rose-600 dark:text-rose-300">{cameraTracking.error}</p>
            ) : null}
          </div>
        </div>
      </GradientCard>
    </DashboardContainer>
  );
};
