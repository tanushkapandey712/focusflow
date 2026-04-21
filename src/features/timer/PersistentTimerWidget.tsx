import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, Pause, Play, TimerReset, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui";
import { cn } from "../../lib/cn";
import { useFocusFlowData } from "../../hooks/useFocusFlowData";
import { formatTimer } from "./format";
import { useStudyTimerSession } from "./useStudyTimerSession";

const DEFAULT_TITLE = "FocusFlow";

const getTitleForTimer = (status: "running" | "paused", remainingSec: number) => {
  const formatted = formatTimer(remainingSec);
  return status === "paused"
    ? `${formatted} paused - ${DEFAULT_TITLE}`
    : `${formatted} left - ${DEFAULT_TITLE}`;
};

/** Mini SVG ring for the collapsed pill */
const MiniProgressRing = ({ progress, status }: { progress: number; status: string }) => {
  const size = 32;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * Math.max(0, Math.min(progress, 100))) / 100;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-blue-200/60 dark:text-slate-700/60"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className={cn(
          "transition-[stroke-dashoffset] duration-1000 ease-out",
          status === "running"
            ? "stroke-blue-500 dark:stroke-blue-400"
            : status === "paused"
              ? "stroke-amber-500 dark:stroke-amber-400"
              : "stroke-emerald-500 dark:stroke-emerald-400",
        )}
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
    </svg>
  );
};

export const PersistentTimerWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjects } = useFocusFlowData();
  const {
    status,
    remainingSec,
    progress,
    activePreset,
    selectedSubjectId,
    selectedUnitId,
    selectedTopicId,
    goal,
    pause,
    resume,
  } = useStudyTimerSession();
  const defaultTitleRef = useRef<string>(
    typeof document !== "undefined" ? document.title || DEFAULT_TITLE : DEFAULT_TITLE,
  );
  const previousStatusRef = useRef(status);
  const [isMiniTimerVisible, setIsMiniTimerVisible] = useState(true);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId),
    [selectedSubjectId, subjects],
  );
  const selectedUnit = useMemo(
    () => selectedSubject?.syllabusUnits.find((unit) => unit.id === selectedUnitId),
    [selectedSubject, selectedUnitId],
  );
  const selectedTopic = useMemo(
    () => selectedUnit?.topics.find((topic) => topic.id === selectedTopicId),
    [selectedTopicId, selectedUnit],
  );

  const isSessionVisible = status !== "idle" && location.pathname !== "/timer";
  const normalizedGoal = goal.trim() || undefined;
  const sessionLabel =
    selectedTopic?.title ??
    normalizedGoal ??
    selectedUnit?.title ??
    selectedSubject?.name ??
    "Session in progress";
  const subjectLabel = selectedSubject?.name ?? "Focus session";
  const canResume = status === "paused";
  const canPause = status === "running";

  const timerProgress = useMemo(() => {
    if (status === "idle") return 0;
    return progress;
  }, [progress, status]);

  useEffect(() => {
    if (status === "idle" || location.pathname === "/timer") {
      setIsMiniTimerVisible(true);
    }
  }, [location.pathname, status]);

  useEffect(() => {
    if (status === "running" || status === "paused") {
      document.title = getTitleForTimer(status, remainingSec);
      return;
    }

    document.title = defaultTitleRef.current || DEFAULT_TITLE;
  }, [remainingSec, status]);

  useEffect(() => {
    const wasCompletedNow =
      previousStatusRef.current !== "completed" && status === "completed";

    if (
      wasCompletedNow &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      (document.hidden || location.pathname !== "/timer")
    ) {
      const body = selectedTopic?.title
        ? `${selectedSubject?.name ?? "Your subject"} • ${selectedTopic.title}`
        : selectedSubject?.name ?? "Your session is ready to review.";

      new Notification("FocusFlow session complete", {
        body,
        tag: "focusflow-study-timer-complete",
      });
    }

    previousStatusRef.current = status;
  }, [location.pathname, selectedSubject?.name, selectedTopic?.title, status]);

  if (!isSessionVisible) {
    return null;
  }

  /* ── Collapsed pill ────────────────────────────────────────────── */
  if (!isMiniTimerVisible) {
    return (
      <div className="pointer-events-none fixed bottom-24 right-4 z-40 lg:bottom-6 widget-enter">
        <button
          type="button"
          onClick={() => setIsMiniTimerVisible(true)}
          aria-label="Reopen mini timer"
          className="pointer-events-auto inline-flex h-14 items-center gap-3 rounded-full border border-blue-200/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] px-3 pr-5 text-sm font-semibold text-blue-700 shadow-[0_24px_55px_-34px_rgba(37,99,235,0.45)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300/90 hover:shadow-[0_28px_65px_-34px_rgba(37,99,235,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100/70 dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.9))] dark:text-blue-100 dark:hover:border-blue-400/25 dark:focus-visible:ring-brand-900/40"
        >
          <MiniProgressRing progress={timerProgress} status={status} />
          <span className="tabular-nums">{formatTimer(remainingSec)}</span>
          <ChevronUp size={14} className="text-blue-400" />
        </button>
      </div>
    );
  }

  /* ── Expanded widget ───────────────────────────────────────────── */
  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] lg:bottom-6 widget-enter">
      <div
        className={cn(
          "pointer-events-auto group overflow-hidden rounded-[1.7rem] border p-4 shadow-[0_28px_70px_-38px_rgba(37,99,235,0.45)] backdrop-blur-xl transition-all duration-300 timer-glow",
          status === "running"
            ? "border-blue-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.88))] dark:border-blue-400/20 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))]"
            : "border-blue-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(239,246,255,0.82))] dark:border-blue-400/12 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.84))]",
        )}
      >
        {/* Minimize button */}
        <button
          type="button"
          onClick={() => setIsMiniTimerVisible(false)}
          aria-label="Minimize timer"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-400 opacity-0 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-600 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100/70 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-400 dark:hover:border-white/15 dark:hover:bg-slate-900 dark:hover:text-slate-300 dark:focus-visible:ring-brand-900/40"
        >
          <X size={14} />
        </button>

        {/* Timer display row */}
        <div className="flex items-center gap-4 pr-9">
          {/* Mini progress ring */}
          <div className="relative shrink-0">
            <MiniProgressRing progress={timerProgress} status={status} />
            {status === "running" ? (
              <div className="absolute inset-0 timer-ring-pulse rounded-full bg-blue-400/20" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700/85 dark:text-blue-100/70">
              {status === "completed" ? "Session complete" : status === "running" ? "Focusing..." : "Paused"}
            </div>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] tabular-nums text-slate-950 dark:text-slate-50">
              {formatTimer(remainingSec)}
            </p>
          </div>

          {/* Status badges */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
              {activePreset.label}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                status === "running"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                  : status === "paused"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200",
              )}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Context info */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[1.15rem] border border-white/70 bg-white/72 px-3 py-2 dark:border-white/10 dark:bg-slate-950/58">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Subject
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {subjectLabel}
            </p>
          </div>
          <div className="rounded-[1.15rem] border border-white/70 bg-white/72 px-3 py-2 dark:border-white/10 dark:bg-slate-950/58">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Topic
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {sessionLabel}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center gap-2">
          {canPause ? (
            <Button
              variant="secondary"
              onClick={pause}
              className="h-9 rounded-full px-3.5 text-xs"
            >
              <Pause size={14} />
              Pause
            </Button>
          ) : null}
          {canResume ? (
            <Button
              onClick={resume}
              className="h-9 rounded-full px-3.5 text-xs shadow-[0_16px_36px_-22px_rgba(37,99,235,0.75)]"
            >
              <Play size={14} />
              Resume
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => navigate("/timer")}
            className="h-9 rounded-full px-3.5 text-xs"
          >
            <TimerReset size={14} />
            Open timer
          </Button>
        </div>
      </div>
    </div>
  );
};
