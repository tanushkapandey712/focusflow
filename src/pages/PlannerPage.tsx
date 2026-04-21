import { useCallback, useMemo, useState } from "react";
import { Clock3, Plus, RefreshCw, Trash2 } from "lucide-react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { Button, Card } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import type { TimetableSession } from "../types/models";
import {
  generateTimetable,
  getDayName,
  getDayStudyMinutes,
  getFullDayName,
  getSubjectAllocation,
  getWeeklyStudyMinutes,
  hasOverlap,
} from "../utils/timetable";

const STORAGE_KEY = "focusflow.timetable.v1";

const loadTimetable = (): TimetableSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTimetable = (sessions: TimetableSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore
  }
};

export const PlannerPage = () => {
  const { profile, subjects } = useFocusFlowData();
  const [sessions, setSessions] = useState<TimetableSession[]>(() => loadTimetable());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("09:00");
  const [newType, setNewType] = useState<TimetableSession["type"]>("study");
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id ?? "");
  const [newLabel, setNewLabel] = useState("");
  const [warning, setWarning] = useState("");

  const daySessions = useMemo(
    () => sessions.filter((s) => s.dayOfWeek === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [sessions, selectedDay],
  );

  const weeklyMinutes = useMemo(() => getWeeklyStudyMinutes(sessions), [sessions]);
  const dayStudyMinutes = useMemo(() => getDayStudyMinutes(sessions, selectedDay), [sessions, selectedDay]);
  const subjectAllocation = useMemo(() => getSubjectAllocation(sessions), [sessions]);

  const updateSessions = useCallback((next: TimetableSession[]) => {
    setSessions(next);
    saveTimetable(next);
  }, []);

  const handleDelete = (id: string) => {
    updateSessions(sessions.filter((s) => s.id !== id));
  };

  const handleAdd = () => {
    const session: TimetableSession = {
      id: `tt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dayOfWeek: selectedDay,
      startTime: newStart,
      endTime: newEnd,
      type: newType,
      subjectId: newType === "study" ? newSubjectId : undefined,
      label: newType === "study"
        ? subjects.find((s) => s.id === newSubjectId)?.name ?? "Study"
        : newLabel || (newType === "break" ? "Break" : "Custom"),
    };

    if (hasOverlap(sessions, session)) {
      setWarning("This time slot overlaps with an existing session.");
      return;
    }

    updateSessions([...sessions, session]);
    setShowAddForm(false);
    setWarning("");
  };

  const handleRegenerate = () => {
    if (!profile.routine) return;

    const timetable = generateTimetable({
      routine: profile.routine,
      collegeStart: profile.institutionStartTime ?? "09:00",
      collegeEnd: profile.institutionEndTime ?? "16:00",
      subjects,
    });

    updateSessions(timetable);
  };

  const handleRegenerateDay = () => {
    if (!profile.routine) return;

    const fullTimetable = generateTimetable({
      routine: profile.routine,
      collegeStart: profile.institutionStartTime ?? "09:00",
      collegeEnd: profile.institutionEndTime ?? "16:00",
      subjects,
    });

    const otherDays = sessions.filter((s) => s.dayOfWeek !== selectedDay);
    const newDaySessions = fullTimetable.filter((s) => s.dayOfWeek === selectedDay);
    updateSessions([...otherDays, ...newDaySessions]);
  };

  return (
    <DashboardContainer>
      <div className="page-intro animate-stagger-1">
        <p className="page-eyebrow">Smart Study Planner</p>
        <h1 className="page-title">Your Study Timetable</h1>
        <p className="page-copy">
          View, edit, and regenerate your personalized study schedule. Drag or click to make changes.
        </p>
      </div>

      {/* Stats bar */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-stagger-2">
        <Card className="p-4 shadow-soft text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Weekly Study</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m
          </p>
        </Card>
        <Card className="p-4 shadow-soft text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Today's Study</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {Math.floor(dayStudyMinutes / 60)}h {dayStudyMinutes % 60}m
          </p>
        </Card>
        <Card className="p-4 shadow-soft text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Sessions Today</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {daySessions.filter((s) => s.type === "study").length}
          </p>
        </Card>
        <Card className="p-4 shadow-soft text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subjects</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {subjectAllocation.length}
          </p>
        </Card>
      </div>

      {/* Day tabs + actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 animate-stagger-3">
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                selectedDay === day
                  ? "bg-brand-600 text-white shadow-[0_12px_28px_-16px_rgba(99,102,241,0.55)]"
                  : "border border-white/80 bg-white/82 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300"
              }`}
            >
              {getDayName(day)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleRegenerateDay} className="rounded-full text-xs">
            <RefreshCw size={14} />
            Regen Day
          </Button>
          <Button variant="secondary" onClick={handleRegenerate} className="rounded-full text-xs">
            <RefreshCw size={14} />
            Regen All
          </Button>
          <Button variant="secondary" onClick={() => setShowAddForm(!showAddForm)} className="rounded-full text-xs">
            <Plus size={14} />
            Add Session
          </Button>
        </div>
      </div>

      {/* Add session form */}
      {showAddForm && (
        <Card className="mt-4 p-5 shadow-soft animate-slide-up space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Add to {getFullDayName(selectedDay)}
          </h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Start</span>
              <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="field-surface" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">End</span>
              <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="field-surface" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Type</span>
              <select value={newType} onChange={(e) => setNewType(e.target.value as TimetableSession["type"])} className="field-surface">
                <option value="study">Study</option>
                <option value="break">Break</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            {newType === "study" ? (
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Subject</span>
                <select value={newSubjectId} onChange={(e) => setNewSubjectId(e.target.value)} className="field-surface">
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Label</span>
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Gym" className="field-surface" />
              </label>
            )}
          </div>
          {warning && (
            <p className="text-sm text-rose-600 dark:text-rose-300">{warning}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="rounded-full text-xs">Add</Button>
            <Button variant="ghost" onClick={() => { setShowAddForm(false); setWarning(""); }} className="text-xs">Cancel</Button>
          </div>
        </Card>
      )}

      {/* Day sessions */}
      <div className="mt-6 space-y-2 animate-stagger-4">
        {daySessions.length === 0 ? (
          <Card className="p-12 text-center text-slate-500 border-dashed border-2 shadow-soft">
            <p className="text-sm">No sessions for {getFullDayName(selectedDay)}. Add one or regenerate.</p>
          </Card>
        ) : (
          daySessions.map((session) => (
            <Card
              key={session.id}
              className={`flex items-center gap-4 p-4 shadow-soft transition duration-200 hover:shadow-panel ${
                session.type === "study"
                  ? "border-l-4 border-l-blue-400"
                  : session.type === "college"
                    ? "border-l-4 border-l-purple-400"
                    : session.type === "break"
                      ? "border-l-4 border-l-emerald-400"
                      : "border-l-4 border-l-slate-300"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Clock3 size={16} className="text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {session.label}
                </p>
                <p className="text-xs tabular-nums text-slate-500">
                  {session.startTime} – {session.endTime}
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span className="capitalize">{session.type}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleDelete(session.id)}
                className="h-9 w-9 shrink-0 rounded-full p-0 text-slate-400 hover:text-rose-500"
              >
                <Trash2 size={15} />
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Subject allocation */}
      {subjectAllocation.length > 0 && (
        <Card className="mt-6 p-5 shadow-soft animate-stagger-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
            Weekly Subject Allocation
          </p>
          <div className="space-y-2">
            {subjectAllocation.map((item) => (
              <div key={item.subjectId} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                <span className="tabular-nums text-sm text-slate-500">
                  {Math.floor(item.minutes / 60)}h {item.minutes % 60}m
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DashboardContainer>
  );
};
