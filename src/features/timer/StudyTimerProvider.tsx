import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useStudyTimer } from "./useStudyTimer";
import { StudyTimerContext, type StudyTimerSessionValue } from "./studyTimerContext";
import {
  readPersistedStudyTimerFormState,
  writePersistedStudyTimerFormState,
} from "./timerStorage";
import { TIMER_PRESETS } from "./types";

export const StudyTimerProvider = ({ children }: PropsWithChildren) => {
  const timer = useStudyTimer({ presets: TIMER_PRESETS });
  const [persistedForm] = useState(() => readPersistedStudyTimerFormState());
  const [selectedSubjectId, setSelectedSubjectId] = useState(persistedForm.selectedSubjectId);
  const [selectedUnitId, setSelectedUnitId] = useState(persistedForm.selectedUnitId);
  const [selectedTopicId, setSelectedTopicId] = useState(persistedForm.selectedTopicId);
  const [goal, setGoal] = useState(persistedForm.goal);
  const [distractionTags, setDistractionTags] = useState<string[]>(persistedForm.distractionTags);

  const resetSessionForm = useCallback(() => {
    setGoal("");
    setDistractionTags([]);
  }, []);

  useEffect(() => {
    writePersistedStudyTimerFormState({
      selectedSubjectId,
      selectedUnitId,
      selectedTopicId,
      goal,
      distractionTags,
    });
  }, [distractionTags, goal, selectedSubjectId, selectedTopicId, selectedUnitId]);

  const value: StudyTimerSessionValue = useMemo(
    () => ({
      mode: timer.mode,
      setMode: timer.setMode,
      status: timer.status,
      remainingSec: timer.remainingSec,
      progress: timer.progress,
      customMinutes: timer.customMinutes,
      setCustomMinutes: timer.setCustomMinutes,
      activePreset: timer.activePreset,
      totalSec: timer.totalSec,
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
      start: timer.start,
      pause: timer.pause,
      resume: timer.resume,
      reset: timer.reset,
      end: timer.end,
      resetSessionForm,
    }),
    [
      distractionTags,
      goal,
      selectedSubjectId,
      selectedTopicId,
      selectedUnitId,
      timer.activePreset,
      timer.customMinutes,
      timer.end,
      timer.mode,
      timer.pause,
      timer.progress,
      timer.remainingSec,
      timer.reset,
      timer.resume,
      timer.setCustomMinutes,
      timer.setMode,
      timer.start,
      timer.status,
      timer.totalSec,
      resetSessionForm,
    ],
  );

  return createElement(StudyTimerContext.Provider, { value }, children);
};
