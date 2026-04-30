import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "../../components/ui";
import { cn } from "../../lib/cn";
import type { TimerStatus } from "./types";

interface TimerDisplayProps {
  timerText: string;
  status: TimerStatus;
  progress: number;
  accent: "teal" | "indigo";
  statusLabel: string;
  statusMessage: string;
  statusTone: string;
  isReady: boolean;
  nextAction: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onReset: () => void;
  manualDistractionCount: number;
  onLogManualDistraction: () => void;
}

const RING_SIZE = 280;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const TimerDisplay = ({
  timerText,
  status,
  progress,
  accent,
  statusLabel,
  statusMessage,
  statusTone,
  isReady,
  nextAction,
  onStart,
  onPause,
  onResume,
  onEnd,
  onReset,
  manualDistractionCount,
  onLogManualDistraction,
}: TimerDisplayProps) => {
  const dashOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * Math.max(0, Math.min(progress, 100))) / 100;
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isIdle = status === "idle";
  const isCompleted = status === "completed";
  const isActive = isRunning || isPaused || isCompleted;

  return (
    <div
      className={cn(
        "rounded-[1.8rem] border px-4 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_22px_65px_-44px_rgba(37,99,235,0.45)] transition-all duration-500 sm:px-8 sm:py-10",
        isRunning
          ? "border-blue-300/60 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),rgba(255,255,255,0.96)_58%)] dark:border-blue-400/20 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.3),rgba(15,23,42,0.96)_60%)]"
          : "border-blue-200/70 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),rgba(255,255,255,0.96)_58%)] dark:border-blue-400/10 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.24),rgba(15,23,42,0.96)_60%)]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700/80 dark:text-blue-100/70">
        Focus Timer
      </p>

      {/* Circular progress ring */}
      <div
        className={cn(
          "relative mx-auto mt-6 aspect-square w-full max-w-[min(17.5rem,calc(100vw-8rem))] min-w-0 flex items-center justify-center sm:max-w-[17.5rem]",
          isRunning && "timer-glow",
        )}
      >
        {/* Background ring */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={RING_STROKE}
            className="text-blue-100/80 dark:text-slate-800/90"
          />
          {/* Progress ring */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={cn(
              "transition-[stroke-dashoffset] duration-1000 ease-out",
              accent === "teal"
                ? "stroke-[url(#timer-gradient-teal)]"
                : "stroke-[url(#timer-gradient-indigo)]",
            )}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
          />
          <defs>
            <linearGradient id="timer-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="timer-gradient-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>

        {/* Glow + pulsing ring effect when running */}
        {isRunning ? (
          <div className="absolute inset-0 timer-ring-pulse rounded-full">
            <div
              className={cn(
                "h-full w-full rounded-full blur-xl",
                accent === "teal" ? "bg-cyan-400/30" : "bg-blue-400/30",
              )}
            />
          </div>
        ) : null}

        {/* Timer digits */}
        <div
          className={cn(
            "relative z-10 font-semibold tracking-[-0.06em] tabular-nums drop-shadow-[0_16px_40px_rgba(37,99,235,0.18)]",
            isActive ? "text-4xl sm:text-7xl" : "text-4xl sm:text-6xl",
            accent === "teal"
              ? "text-slate-950 dark:text-cyan-50"
              : "text-slate-950 dark:text-blue-50",
          )}
        >
          {timerText}
        </div>
      </div>

      {/* Status message */}
      <p className={cn("mt-4 text-sm font-medium", statusTone)}>{statusMessage}</p>

      {/* Progress label */}
      <div className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        <span>{statusLabel}</span>
        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span>{Math.round(progress)}% elapsed</span>
      </div>

      {/* Controls */}
      <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        {isIdle ? (
          <Button
            onClick={onStart}
            disabled={!isReady}
            className="h-12 w-full rounded-[1.35rem] px-6 text-base shadow-[0_24px_55px_-28px_rgba(37,99,235,0.75)] sm:h-14 sm:w-auto sm:rounded-[1.5rem] sm:px-8"
          >
            <Play size={18} />
            Start Session
          </Button>
        ) : null}

        {isRunning ? (
          <Button
            variant="secondary"
            onClick={onPause}
            className="h-12 w-full rounded-[1.35rem] px-6 text-base sm:h-14 sm:w-auto sm:rounded-[1.5rem]"
          >
            <Pause size={18} />
            Pause
          </Button>
        ) : null}

        {isPaused ? (
          <Button
            onClick={onResume}
            className="h-12 w-full rounded-[1.35rem] px-6 text-base shadow-[0_24px_55px_-28px_rgba(37,99,235,0.75)] sm:h-14 sm:w-auto sm:rounded-[1.5rem] sm:px-8"
          >
            <Play size={18} />
            Resume
          </Button>
        ) : null}

        {isActive ? (
          <>
            <Button
              variant="secondary"
              onClick={onReset}
              className="h-12 w-full rounded-[1.35rem] px-6 text-base sm:h-14 sm:w-auto sm:rounded-[1.5rem]"
            >
              <RotateCcw size={18} />
              Reset
            </Button>
            <Button
              variant="secondary"
              onClick={onEnd}
              className="h-12 w-full rounded-[1.35rem] px-6 text-base sm:h-14 sm:w-auto sm:rounded-[1.5rem]"
            >
              <Square size={18} />
              End Session
            </Button>
            {isRunning && (
              <Button
                variant="ghost"
                onClick={onLogManualDistraction}
                className="h-12 w-full rounded-[1.35rem] px-6 text-base text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-500 dark:hover:bg-amber-950/30 sm:h-14 sm:w-auto sm:rounded-[1.5rem]"
              >
                Log Distraction {manualDistractionCount > 0 ? `(${manualDistractionCount})` : ""}
              </Button>
            )}
          </>
        ) : null}
      </div>

      {/* Guidance nudge for incomplete setup */}
      {!isReady && isIdle ? (
        <div className="mx-auto mt-5 max-w-2xl animate-fade-up rounded-[1.4rem] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-left text-sm text-amber-800 shadow-[0_18px_36px_-28px_rgba(217,119,6,0.35)] dark:border-amber-400/15 dark:bg-amber-500/10 dark:text-amber-100">
          <p>{nextAction}</p>
        </div>
      ) : null}
    </div>
  );
};
