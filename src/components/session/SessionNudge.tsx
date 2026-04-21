import { useEffect, useRef, useState } from "react";
import { AlertCircle, Coffee, MousePointerClick, X } from "lucide-react";
import { cn } from "../../lib/cn";

export type NudgeType = "inactivity" | "break_suggestion" | "tab_away" | "long_pause";

interface Nudge {
  id: string;
  type: NudgeType;
  message: string;
  icon: typeof AlertCircle;
}

interface SessionNudgeProps {
  /** Whether there's an active timer session */
  isSessionActive: boolean;
  /** Whether the user is currently inactive (no mouse/keyboard) */
  isInactive: boolean;
  /** Whether the user switched tabs */
  isTabAway: boolean;
  /** Timer status */
  status: "idle" | "running" | "paused" | "completed";
  /** How many seconds have elapsed in the session */
  elapsedSeconds: number;
}

const BREAK_SUGGEST_MINUTES = 50;
const LONG_PAUSE_SECONDS = 300; // 5 minutes

export const SessionNudge = ({
  isSessionActive,
  isInactive,
  isTabAway,
  status,
  elapsedSeconds,
}: SessionNudgeProps) => {
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const lastNudgeRef = useRef<string>("");
  const pauseStartRef = useRef<number | null>(null);

  // Track pause duration
  useEffect(() => {
    if (status === "paused") {
      pauseStartRef.current = pauseStartRef.current ?? Date.now();
    } else {
      pauseStartRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (!isSessionActive) {
      setActiveNudge(null);
      return;
    }

    let nudge: Nudge | null = null;

    if (isInactive && status === "running") {
      nudge = {
        id: "inactivity",
        type: "inactivity",
        message: "You seem inactive. Still studying? Move your mouse or press a key.",
        icon: MousePointerClick,
      };
    } else if (isTabAway && status === "running") {
      nudge = {
        id: "tab_away",
        type: "tab_away",
        message: "You switched tabs. Come back to stay in the flow.",
        icon: AlertCircle,
      };
    } else if (status === "running" && elapsedSeconds >= BREAK_SUGGEST_MINUTES * 60) {
      nudge = {
        id: "break",
        type: "break_suggestion",
        message: `${BREAK_SUGGEST_MINUTES}+ minutes in. Consider a short break to stay sharp.`,
        icon: Coffee,
      };
    } else if (
      status === "paused" &&
      pauseStartRef.current !== null &&
      Date.now() - pauseStartRef.current >= LONG_PAUSE_SECONDS * 1000
    ) {
      nudge = {
        id: "long_pause",
        type: "long_pause",
        message: "Long pause detected. Resume when ready or end the session to save progress.",
        icon: AlertCircle,
      };
    }

    // Only show a nudge if it's different from the last one shown
    if (nudge && nudge.id !== lastNudgeRef.current) {
      lastNudgeRef.current = nudge.id;
      setIsExiting(false);
      setActiveNudge(nudge);
    } else if (!nudge && activeNudge) {
      // Clear nudge if condition resolved
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setActiveNudge(null);
        setIsExiting(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isSessionActive, isInactive, isTabAway, status, elapsedSeconds, activeNudge]);

  if (!activeNudge) return null;

  const Icon = activeNudge.icon;

  return (
    <div
      className={cn(
        "fixed bottom-28 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 transition-all duration-300 lg:bottom-8",
        isExiting
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100 animate-fade-up",
      )}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/95 px-4 py-3 shadow-[0_24px_55px_-28px_rgba(217,119,6,0.4)] backdrop-blur-xl dark:border-amber-400/15 dark:bg-slate-900/95">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-200/70">
            Nudge
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-100">
            {activeNudge.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              setActiveNudge(null);
              setIsExiting(false);
            }, 300);
          }}
          className="shrink-0 rounded-lg p-1 text-amber-500 transition hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-500/10 dark:hover:text-amber-200"
          aria-label="Dismiss nudge"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
