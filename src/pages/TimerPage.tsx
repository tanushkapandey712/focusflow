import { useEffect, useMemo } from "react";
import { Camera, CameraOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { FocusStatusBadge } from "../components/focus/FocusStatusBadge";
import { Button, SectionContainer } from "../components/ui";
import { formatTimer } from "../features/timer/format";
import { TimerCard } from "../features/timer/TimerCard";
import { TIMER_PRESETS } from "../features/timer/types";
import { useStudyTimerSession } from "../features/timer/useStudyTimerSession";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { useFocusTracking } from "../hooks/useFocusTracking";
import { useTabDistraction } from "../hooks/useTabDistraction";
import { SessionNudge } from "../components/session/SessionNudge";
import { computeStabilityScore } from "../utils/stabilityScore";
import {
  applySessionToSubjectTopic,
  getSessionSyllabusLink,
  getValidSyllabusSelection,
} from "../utils/syllabusProgress";
import { cn } from "../lib/cn";

export const TimerPage = () => {
  const navigate = useNavigate();
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
    totalSec,
    manualDistractionCount,
    logManualDistraction,
  } = useStudyTimerSession();
  const cameraTracking = useFocusTracking();

  const isSessionActive = status === "running" || status === "paused";
  const tabDistraction = useTabDistraction(isSessionActive);
  const elapsedSeconds = Math.max(0, totalSec - remainingSec);

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

    const tabDistractionSummary = tabDistraction.finalize();

    const stabilityScore = computeStabilityScore({
      actualMinutes: result.actualMinutes,
      distractionCount: distractionTags.length + (focusTrackingSummary?.distractionEvents ?? 0) + manualDistractionCount,
      tabSwitchCount: tabDistractionSummary.tabSwitchCount,
      inactivityCount: tabDistractionSummary.inactivityCount,
      tabAwayMs: tabDistractionSummary.tabAwayMs,
      inactivityMs: tabDistractionSummary.inactivityMs,
      cameraAwayEvents: focusTrackingSummary?.totalAwayEvents ?? 0,
    });

    addSession({
      id: crypto.randomUUID(),
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      startedAt: result.startedAt.toISOString(),
      endedAt: endedAtIso,
      plannedMinutes: result.plannedMinutes,
      actualMinutes: result.actualMinutes,
      distractionCount: distractionTags.length + (focusTrackingSummary?.distractionEvents ?? 0) + manualDistractionCount,
      distractionTags: allDistractionTags,
      tabSwitchCount: tabDistractionSummary.tabSwitchCount,
      tabAwayMs: tabDistractionSummary.tabAwayMs,
      inactivityCount: tabDistractionSummary.inactivityCount,
      inactivityMs: tabDistractionSummary.inactivityMs,
      stabilityScore,
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
        <SessionNudge
          isSessionActive={isSessionActive}
          isInactive={tabDistraction.isInactive}
          isTabAway={tabDistraction.isTabAway}
          status={status}
          elapsedSeconds={elapsedSeconds}
        />
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
            // resetManualDistraction is handled inside resetSessionForm which gets called on End
            cameraTracking.beginSessionTracking();
            start();
          }}
          onPause={pause}
          onResume={resume}
          onEnd={handleEndSession}
          onReset={() => {
            cameraTracking.resetSessionTracking();
            resetSessionForm(); // reset form & manual distraction
            reset();
          }}
          onOpenSyllabusMap={() => navigate("/syllabus")}
          manualDistractionCount={manualDistractionCount}
          onLogManualDistraction={logManualDistraction}
        />
      </SectionContainer>

      <div className="animate-fade-up mx-auto max-w-3xl pt-4">
        <div className="flex flex-col gap-3 rounded-[1.55rem] border border-blue-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(239,246,255,0.7))] p-4 shadow-[0_22px_50px_-34px_rgba(37,99,235,0.25)] dark:border-blue-400/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.62))]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700/80 dark:text-blue-100/70">
                AI Focus Tracking
              </p>
            </div>
            <FocusStatusBadge
              cameraState={cameraTracking.cameraState}
              attentionStatus={cameraTracking.attentionStatus}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <div className="flex flex-wrap items-center gap-2">
              {!cameraTracking.isCameraActive ? (
                <Button
                  variant="secondary"
                  onClick={() => void cameraTracking.startCamera()}
                  className="rounded-full border-blue-200/80 bg-white/88 px-5 text-blue-700 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)] hover:bg-white dark:border-blue-400/10 dark:bg-slate-900/82 dark:text-blue-100"
                >
                  <Camera size={15} />
                  Enable tracking
                </Button>
              ) : cameraTracking.cameraState === "requesting-permission" ? (
                <Button variant="secondary" disabled className="rounded-full px-5">
                  <Camera size={15} />
                  Waiting for access
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={cameraTracking.stopCamera}
                  className="rounded-full border-blue-200/80 bg-white/88 px-5 text-slate-700 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.18)] hover:bg-white dark:border-blue-400/10 dark:bg-slate-900/82 dark:text-slate-100"
                >
                  <CameraOff size={15} />
                  Disable tracking
                </Button>
              )}

              {cameraTracking.error ? (
                <p className="text-sm text-rose-600 dark:text-rose-300">{cameraTracking.error}</p>
              ) : null}
            </div>

            {cameraTracking.isCameraActive && (
              <div className="flex items-center gap-2.5 rounded-full border border-blue-200/50 bg-white/50 px-3.5 py-1.5 dark:border-blue-400/10 dark:bg-slate-900/40">
                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300" title="Ignore downward head tilt when reading">Desk Mode</span>
                <button
                  type="button"
                  onClick={() => cameraTracking.setDeskMode(!cameraTracking.deskMode)}
                  className={cn(
                    "flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    cameraTracking.deskMode ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600",
                  )}
                  role="switch"
                  aria-checked={cameraTracking.deskMode}
                  title="Ignore downward head tilt when reading"
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full bg-white transition-transform duration-300",
                      cameraTracking.deskMode ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
};
