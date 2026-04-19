import { createElement, type PropsWithChildren } from "react";
import { FocusTrackingContext } from "./focusTrackingContext";
import { useCameraFocusTracking } from "./useCameraFocusTracking";

export const FocusTrackingProvider = ({ children }: PropsWithChildren) => {
  const tracker = useCameraFocusTracking({ sampleIntervalMs: 250 });

  return createElement(
    FocusTrackingContext.Provider,
    { value: tracker },
    <>
      <video
        ref={tracker.videoRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        autoPlay
        muted
        playsInline
      />
      {children}
    </>,
  );
};
