import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Play, Pause, Square, Sparkles, Maximize2, Minimize2, AlertTriangle, Zap, TabletSmartphone, Clock } from "lucide-react";
import { FocusStatusBadge } from "../components/focus/FocusStatusBadge";
import { FocusMusicControl } from "../components/timer/FocusMusicControl";
import { Button } from "../components/ui";
import { formatTimer } from "../features/timer/format";
import { TIMER_PRESETS } from "../features/timer/types";
import { useStudyTimerSession } from "../features/timer/useStudyTimerSession";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { useFocusMusic } from "../hooks/useFocusMusic";
import { useFocusTracking } from "../hooks/useFocusTracking";
import { useTabDistraction } from "../hooks/useTabDistraction";
import { computeStabilityScore } from "../utils/stabilityScore";
import {
  applySessionToSubjectTopic,
  getSessionSyllabusLink,
  getValidSyllabusSelection,
} from "../utils/syllabusProgress";
import { cn } from "../lib/cn";

export const TimerPage = () => {
  const { subjects, addSession, updateTopicInUnit } = useFocusFlowData();
  const {
    mode,
    setMode,
    status,
    remainingSec,
    progress,
    customMinutes,
    setCustomMinutes,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedUnitId,
    setSelectedUnitId,
    selectedTopicId,
    setSelectedTopicId,
    goal,
    setGoal,
    distractionTags,
    start,
    pause,
    resume,
    reset,
    end,
    getSessionResult,
    resetSessionForm,
    manualDistractionCount,
  } = useStudyTimerSession();
  
  const cameraTracking = useFocusTracking();
  const focusMusic = useFocusMusic();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionSaveError, setSessionSaveError] = useState<string | null>(null);
  const attemptedSessionSaveKeyRef = useRef<string | null>(null);
  const [sessionRecap, setSessionRecap] = useState<{
    actualMinutes: number;
    plannedMinutes: number;
    distractionCount: number;
    tabSwitchCount: number;
    tabAwayMs: number;
    stabilityScore: number;
    distractionTags: string[];
    focusTracking?: { totalAwayEvents: number; longestFocusStreakMs: number };
  } | null>(null);

  const isSessionActive = status === "running" || status === "paused";
  const tabDistraction = useTabDistraction(isSessionActive);

  useEffect(() => {
    if (subjects.length === 0) {
      if (selectedSubjectId) setSelectedSubjectId("");
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

  const saveCompletedSession = useCallback(
    async (result: {
      startedAt: Date;
      endedAt: Date;
      plannedMinutes: number;
      actualMinutes: number;
    }) => {
      if (!selectedSubject) {
        throw new Error("Select a subject before saving the session.");
      }

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
        ...(focusTrackingSummary && focusTrackingSummary.totalAwayEvents > 0 ? ["away from frame"] : []),
        ...(focusTrackingSummary && focusTrackingSummary.lookingAwayEvents > 0 ? ["looked away"] : []),
        ...(focusTrackingSummary && focusTrackingSummary.longEyeClosureEvents > 0 ? ["long eye closure"] : []),
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

      const savedSession = await addSession({
        id: crypto.randomUUID(),
        subjectId: selectedSubject.id,
        unitId: syllabusTopic?.unitId ?? selectedUnit?.id,
        topicId: syllabusTopic?.topicId ?? selectedTopic?.id,
        subjectName: selectedSubject.name,
        startedAt: result.startedAt.toISOString(),
        endedAt: endedAtIso,
        plannedMinutes: result.plannedMinutes,
        actualMinutes: result.actualMinutes,
        durationMinutes: result.actualMinutes,
        mode,
        completed: true,
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
        actualMinutes: savedSession.actualMinutes,
        endedAt: endedAtIso,
      });

      if (nextSyllabusUnits !== selectedSubject.syllabusUnits && syllabusTopic) {
        const updatedTopic = nextSyllabusUnits
          .find((unit) => unit.id === syllabusTopic.unitId)
          ?.topics.find((topic) => topic.id === syllabusTopic.topicId);

        if (updatedTopic) {
          await updateTopicInUnit(selectedSubject.id, syllabusTopic.unitId, syllabusTopic.topicId, {
            status: updatedTopic.status,
            studiedMinutes: updatedTopic.studiedMinutes,
            studySessionsCount: updatedTopic.studySessionsCount,
            lastStudiedAt: updatedTopic.lastStudiedAt,
          });
        }
      }

      // Capture recap BEFORE resetSessionForm wipes the state
      const totalDistractions = distractionTags.length + (focusTrackingSummary?.distractionEvents ?? 0) + manualDistractionCount;
      setSessionRecap({
        actualMinutes: result.actualMinutes,
        plannedMinutes: result.plannedMinutes,
        distractionCount: totalDistractions,
        tabSwitchCount: tabDistractionSummary.tabSwitchCount,
        tabAwayMs: tabDistractionSummary.tabAwayMs,
        stabilityScore,
        distractionTags: allDistractionTags,
        focusTracking: focusTrackingSummary
          ? { totalAwayEvents: focusTrackingSummary.totalAwayEvents, longestFocusStreakMs: focusTrackingSummary.longestFocusStreakMs }
          : undefined,
      });

      if (isFullscreen) toggleFullscreen();
      resetSessionForm();
      setSessionSaveError(null);
    },
    [
      addSession,
      cameraTracking,
      distractionTags,
      goal,
      isFullscreen,
      manualDistractionCount,
      mode,
      resetSessionForm,
      selectedSubject,
      selectedTopic,
      selectedUnit,
      selectedTopicId,
      selectedUnitId,
      tabDistraction,
      updateTopicInUnit,
    ],
  );

  useEffect(() => {
    if (status !== "completed") return;

    const result = getSessionResult();
    const saveKey = [
      result.startedAt.toISOString(),
      result.endedAt.toISOString(),
      selectedSubject?.id ?? "",
      selectedUnitId,
      selectedTopicId,
    ].join(":");

    if (attemptedSessionSaveKeyRef.current === saveKey) {
      return;
    }

    attemptedSessionSaveKeyRef.current = saveKey;
    void saveCompletedSession(result).catch((err) => {
      const message = err instanceof Error ? err.message : "Failed to save completed session.";
      console.error("[FocusFlow] Completed session save failed:", err);
      setSessionSaveError(message);
    });
  }, [
    getSessionResult,
    saveCompletedSession,
    selectedSubject?.id,
    selectedTopicId,
    selectedUnitId,
    status,
  ]);

  const handleEndSession = () => {
    if (!selectedSubject) return;
    end();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isReady = Boolean(selectedSubjectId) && Boolean(goal.trim());

  if (status === "completed") {
    const recap = sessionRecap;
    const focusPercent = recap
      ? Math.min(100, Math.round((recap.actualMinutes / Math.max(1, recap.plannedMinutes)) * 100))
      : 0;
    const stabilityLabel =
      recap && recap.stabilityScore >= 80 ? "Excellent"
      : recap && recap.stabilityScore >= 60 ? "Good"
      : recap && recap.stabilityScore >= 40 ? "Fair"
      : "Needs Work";
    const stabilityColor =
      recap && recap.stabilityScore >= 80 ? "text-emerald-600 dark:text-emerald-400"
      : recap && recap.stabilityScore >= 60 ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";
    const tabAwayMin = recap ? Math.round(recap.tabAwayMs / 60000) : 0;

    return (
      <div className="min-h-[80vh] flex items-center justify-center py-8">
        <div className="animate-fade-up max-w-lg w-full space-y-5">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center dark:bg-emerald-900/30 dark:text-emerald-400">
              <Sparkles size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Session Complete!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {selectedSubject?.name} &middot; {selectedTopic?.title || "General Study"}
            </p>
          </div>

          {/* Stats grid */}
          {recap ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Duration */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-brand-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Duration</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{recap.actualMinutes}<span className="text-sm font-normal text-slate-500 ml-1">min</span></p>
                <p className="text-xs text-slate-400 mt-0.5">of {recap.plannedMinutes} planned</p>
              </div>

              {/* Focus score */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-brand-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Focus</p>
                </div>
                <p className={`text-2xl font-bold ${stabilityColor}`}>{recap.stabilityScore}<span className="text-sm font-normal text-slate-500 ml-1">/100</span></p>
                <p className="text-xs text-slate-400 mt-0.5">{stabilityLabel} &middot; {focusPercent}% completion</p>
              </div>

              {/* Distractions */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className={recap.distractionCount === 0 ? "text-emerald-500" : "text-amber-500"} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Distractions</p>
                </div>
                <p className={`text-2xl font-bold ${recap.distractionCount === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                  {recap.distractionCount}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {recap.distractionCount === 0 ? "Perfect session! 🎉" : `${recap.tabSwitchCount} tab switch${recap.tabSwitchCount !== 1 ? "es" : ""}`}
                </p>
              </div>

              {/* Tab away */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <TabletSmartphone size={14} className="text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time Away</p>
                </div>
                <p className={`text-2xl font-bold ${tabAwayMin === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                  {tabAwayMin}<span className="text-sm font-normal text-slate-500 ml-1">min</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {recap.focusTracking ? `${recap.focusTracking.totalAwayEvents} camera event${recap.focusTracking.totalAwayEvents !== 1 ? "s" : ""}` : "Tab away time"}
                </p>
              </div>
            </div>
          ) : null}

          {/* Distraction tags */}
          {recap && recap.distractionTags.length > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Distraction Types</p>
              <div className="flex flex-wrap gap-2">
                {recap.distractionTags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : recap ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">🎯 Zero distractions recorded — excellent focus!</p>
            </div>
          ) : null}

          {/* Error */}
          {sessionSaveError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {sessionSaveError}
            </p>
          ) : null}

          <Button className="w-full h-12 rounded-xl text-lg" onClick={() => {
            setSessionRecap(null);
            reset();
            resetSessionForm();
          }}>
            Start Another Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-[80vh] flex flex-col items-center justify-center transition-all duration-700", isFullscreen ? "bg-slate-950 fixed inset-0 z-[100] px-4" : "")}>
      
      {/* Background ambient gradient for fullscreen */}
      {isFullscreen && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-brand-500/5 blur-[120px]" />
        </div>
      )}

      <div className={cn("w-full max-w-2xl animate-fade-up relative z-10", isFullscreen ? "scale-110" : "")}>
        
        {/* Fullscreen Toggle */}
        <button 
          onClick={toggleFullscreen} 
          className="absolute top-0 right-0 p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-50"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
        </button>

        {/* Setup / Context Area */}
        <div className={cn("transition-all duration-500 overflow-hidden", isSessionActive ? "h-0 opacity-0 pointer-events-none" : "h-auto opacity-100 mb-8")}>
          <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl space-y-5">
            <div className="flex gap-2">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.mode}
                  onClick={() => {
                    setMode(preset.mode);
                    if (preset.mode === "custom" && customMinutes === 0) setCustomMinutes(25);
                  }}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all border-2",
                    mode === preset.mode 
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" 
                      : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject</label>
                <select 
                  value={selectedSubjectId} 
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Topic</label>
                <select 
                  value={selectedTopicId} 
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  disabled={!selectedSubjectId}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  <option value="">General Study</option>
                  {availableUnits.map(unit => (
                    <optgroup key={unit.id} label={unit.title}>
                      {unit.topics.map(topic => (
                        <option key={topic.id} value={topic.id}>{topic.title}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Session Goal</label>
              <input 
                type="text" 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What do you want to accomplish?"
                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-10">
          <div className={cn("text-sm font-semibold uppercase tracking-widest mb-4 transition-colors", isFullscreen ? "text-slate-400" : "text-brand-500 dark:text-brand-400")}>
            {isSessionActive ? (selectedTopic?.title || selectedSubject?.name || "Focus Session") : "Ready to focus"}
          </div>
          <div className={cn("font-bold tracking-tight transition-all duration-700", isFullscreen ? "text-[12rem] text-white leading-none drop-shadow-[0_0_80px_rgba(255,255,255,0.1)]" : "text-[8rem] sm:text-[10rem] text-slate-900 dark:text-white leading-none")}>
            {formatTimer(remainingSec)}
          </div>
          
          {/* Progress Bar (Visible only when running) */}
          <div className={cn("w-full max-w-sm mx-auto h-2 mt-8 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden transition-all duration-500", isSessionActive ? "opacity-100" : "opacity-0")}>
            <div className="h-full bg-brand-500 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          </div>

          {/* Live distraction counter */}
          {isSessionActive && (manualDistractionCount + distractionTags.length) > 0 ? (
            <div className="mt-4 flex items-center justify-center gap-2 animate-fade-up">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                (manualDistractionCount + distractionTags.length) >= 5
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                isFullscreen ? "bg-white/10 text-white/70" : ""
              )}>
                <AlertTriangle size={11} />
                {manualDistractionCount + distractionTags.length} distraction{(manualDistractionCount + distractionTags.length) !== 1 ? "s" : ""} detected
              </span>
            </div>
          ) : isSessionActive ? (
            <div className="mt-4 flex items-center justify-center">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                isFullscreen ? "bg-white/10 text-white/50" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              )}>
                <Zap size={11} />
                In the zone — no distractions
              </span>
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            {!isSessionActive ? (
              <Button 
                onClick={() => {
                  setSessionSaveError(null);
                  attemptedSessionSaveKeyRef.current = null;
                  cameraTracking.beginSessionTracking();
                  start();
                }} 
                disabled={!isReady}
                className="h-16 px-12 rounded-full text-lg shadow-xl shadow-brand-500/20 disabled:opacity-50 transition-all hover:scale-105"
              >
                <Play size={24} className="mr-3" />
                Start Session
              </Button>
            ) : (
              <>
                {status === "running" ? (
                  <Button variant="secondary" onClick={pause} className={cn("h-16 w-16 rounded-full p-0 flex items-center justify-center transition-all hover:scale-105", isFullscreen ? "bg-white/10 text-white border-none hover:bg-white/20" : "")}>
                    <Pause size={24} />
                  </Button>
                ) : (
                  <Button onClick={resume} className={cn("h-16 px-8 rounded-full text-lg shadow-xl transition-all hover:scale-105", isFullscreen ? "bg-white text-black hover:bg-slate-200" : "")}>
                    <Play size={20} className="mr-2" />
                    Resume
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  onClick={handleEndSession} 
                  className={cn("h-16 w-16 rounded-full p-0 flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all hover:scale-105 border-rose-200", isFullscreen ? "bg-white/10 border-none text-rose-400 hover:bg-rose-500/20" : "")}
                >
                  <Square size={20} />
                </Button>
              </>
            )}
          </div>

          {/* Optional Focus Tracking Toggle */}
          <div className={cn("flex items-center gap-3 transition-opacity duration-500", (isSessionActive && isFullscreen) ? "opacity-0 pointer-events-none" : "opacity-100")}>
            {!cameraTracking.isCameraActive ? (
              <button
                onClick={() => void cameraTracking.startCamera()}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <Camera size={16} /> Enable AI focus tracking
              </button>
            ) : (
              <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800">
                <FocusStatusBadge
                  cameraState={cameraTracking.cameraState}
                  attentionStatus={cameraTracking.attentionStatus}
                />
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
                <button
                  onClick={cameraTracking.stopCamera}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors"
                >
                  <CameraOff size={16} /> Stop tracking
                </button>
              </div>
            )}
          </div>

          {/* Optional Focus Music */}
          <div className={cn("w-full max-w-xs transition-opacity duration-500", (isSessionActive && isFullscreen) ? "opacity-0 pointer-events-none" : "opacity-100")}>
            <FocusMusicControl
              isPlaying={focusMusic.isPlaying}
              volume={focusMusic.volume}
              soundType={focusMusic.soundType}
              onToggle={focusMusic.toggle}
              onChangeSound={focusMusic.changeSound}
              onVolumeChange={focusMusic.setVolume}
              isFullscreen={isFullscreen}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
