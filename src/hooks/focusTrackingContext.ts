import { createContext } from "react";
import type { UseCameraFocusTrackingResult } from "./useCameraFocusTracking";

export const FocusTrackingContext = createContext<UseCameraFocusTrackingResult | null>(null);
