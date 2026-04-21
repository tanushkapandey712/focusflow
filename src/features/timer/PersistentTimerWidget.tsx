import { useEffect, useMemo, useRef } from "react";
import { Pause, Play, TimerReset, Timer as TimerIcon } from "lucide-react";
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

export const PersistentTimerWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjects } = useFocusFlowData();
  const {
    status,
    remainingSec,
    activePreset,
    selectedSubjectId,
    selectedUnitId,
    selectedTopicId,
    goal,
    pause,
    resume,
  } = useStudyTimerSession();
  const defaultTitleRef = useRef<string>(typeof document !== "undefined" ? document.title || DEFAULT_TITLE : DEFAULT_TITLE);
  const previousStatusRef = useRef(status);

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

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] lg:bottom-6">
      <div className="pointer-events-auto soft-surface overflow-hidden rounded-[1.7rem] border border-blue-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(239,246,255,0.82))] p-4 shadow-[0_28px_70px_-38px_rgba(37,99,235,0.45)] dark:border-blue-400/12 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.84))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700/85 dark:text-blue-100/70">
              <TimerIcon size={14} />
              {status === "completed" ? "Session complete" : "Mini timer"}
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.08em] text-slate-950 dark:text-slate-50">
              {formatTimer(remainingSec)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                {activePreset.label}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
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

          <div className="rounded-[1.15rem] border border-white/70 bg-white/76 px-3 py-2 text-right shadow-[0_18px_40px_-34px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-slate-950/62">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Subject
            </p>
            <p className="mt-1 max-w-[8rem] truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {subjectLabel}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.3rem] border border-white/70 bg-white/72 px-3.5 py-3 dark:border-white/10 dark:bg-slate-950/58">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Linked topic
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {sessionLabel}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canPause ? (
            <Button
              variant="secondary"
              onClick={pause}
              className="h-10 rounded-[1.15rem] px-4 text-sm"
            >
              <Pause size={15} />
              Pause
            </Button>
          ) : null}
          {canResume ? (
            <Button
              onClick={resume}
              className="h-10 rounded-[1.15rem] px-4 text-sm shadow-[0_20px_45px_-28px_rgba(37,99,235,0.75)]"
            >
              <Play size={15} />
              Resume
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => navigate("/timer")}
            className="h-10 rounded-[1.15rem] px-4 text-sm"
          >
            <TimerReset size={15} />
            Open timer
          </Button>
        </div>
      </div>
    </div>
  );
};
