import { useContext } from "react";
import { StudyTimerContext } from "./studyTimerContext";

export const useStudyTimerSession = () => {
  const context = useContext(StudyTimerContext);

  if (!context) {
    throw new Error("useStudyTimerSession must be used within StudyTimerProvider.");
  }

  return context;
};
