import { useContext } from "react";
import { FocusTrackingContext } from "./focusTrackingContext";

export const useFocusTracking = () => {
  const context = useContext(FocusTrackingContext);

  if (!context) {
    throw new Error("useFocusTracking must be used within FocusTrackingProvider.");
  }

  return context;
};
