import { useState } from "react";
import { ArrowRight, Calendar, Clock3, Moon, Sparkles, Sun, Sunrise } from "lucide-react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { isProfileSetupComplete, isSyllabusSetupComplete } from "../utils/profile";
import type { RoutinePreferences, TimetableSession } from "../types/models";
import {
  generateTimetable,
  getDayName,
  getDayStudyMinutes,
  getSubjectAllocation,
  getWeeklyStudyMinutes,
} from "../utils/timetable";

const STUDY_TIME_OPTIONS = ["morning", "night", "flexible"] as const;
const STUDY_TIME_LABELS: Record<string, { label: string; icon: typeof Sun }> = {
  morning: { label: "Morning Person", icon: Sunrise },
  night: { label: "Night Owl", icon: Moon },
  flexible: { label: "Flexible", icon: Sun },
};

export const ScheduleSetupPage = () => {
  const navigate = useNavigate();
  const { profile, subjects, setProfile } = useFocusFlowData();

  const [wakeUpTime, setWakeUpTime] = useState(profile.routine?.wakeUpTime ?? "06:00");
  const [sleepTime, setSleepTime] = useState(profile.routine?.sleepTime ?? "23:00");
  const [commute, setCommute] = useState(profile.routine?.commuteDurationMinutes ?? 30);
  const [preferredStudyTime, setPreferredStudyTime] = useState<RoutinePreferences["preferredStudyTime"]>(
    profile.routine?.preferredStudyTime ?? "flexible",
  );
  const [studyBlockMinutes, setStudyBlockMinutes] = useState(45);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [generatedTimetable, setGeneratedTimetable] = useState<TimetableSession[] | null>(null);

  if (!profile.isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }
  if (!isProfileSetupComplete(profile)) {
    return <Navigate to="/profile-setup" replace />;
  }
  if (!isSyllabusSetupComplete(profile)) {
    return <Navigate to="/syllabus-setup" replace />;
  }
  if (profile.hasCompletedScheduleSetup) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGenerate = () => {
    const routine: RoutinePreferences = {
      wakeUpTime,
      sleepTime,
      commuteDurationMinutes: commute,
      preferredStudyTime,
    };

    const timetable = generateTimetable({
      routine,
      collegeStart: profile.institutionStartTime ?? "09:00",
      collegeEnd: profile.institutionEndTime ?? "16:00",
      subjects,
      studyBlockMinutes,
      breakMinutes,
    });

    setGeneratedTimetable(timetable);
  };

  const handleComplete = () => {
    const routine: RoutinePreferences = {
      wakeUpTime,
      sleepTime,
      commuteDurationMinutes: commute,
      preferredStudyTime,
    };

    setProfile({
      ...profile,
      routine,
      hasCompletedScheduleSetup: true,
    });

    // Store the timetable in localStorage
    try {
      localStorage.setItem(
        "focusflow.timetable.v1",
        JSON.stringify(generatedTimetable ?? []),
      );
    } catch {
      // Ignore storage errors
    }

    navigate("/dashboard");
  };

  const handleSkip = () => {
    setProfile({
      ...profile,
      hasCompletedScheduleSetup: true,
    });
    navigate("/dashboard");
  };

  const weeklyMinutes = generatedTimetable ? getWeeklyStudyMinutes(generatedTimetable) : 0;
  const subjectAllocation = generatedTimetable ? getSubjectAllocation(generatedTimetable) : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8ff] text-slate-900 dark:bg-surface-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-[-4rem] h-72 w-72 rounded-full bg-brand-100/80 blur-3xl dark:bg-brand-700/15" />
        <div className="absolute right-[-4rem] top-16 h-72 w-72 rounded-full bg-cyan-200/70 blur-3xl dark:bg-sky-500/12" />
        <div className="absolute bottom-[-2rem] left-1/3 h-80 w-80 rounded-full bg-pastel-peach/65 blur-3xl dark:bg-orange-300/8" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="w-full mb-8 flex justify-between items-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-brand-700 to-sky-400 text-white shadow-soft">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900">FocusFlow</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Schedule Setup</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
            {generatedTimetable && (
              <Button onClick={handleComplete} className="rounded-full shadow-soft">
                Go to Dashboard
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="w-full text-center space-y-3 mb-10">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Build your study schedule.
          </h1>
          <p className="max-w-xl mx-auto text-base leading-7 text-slate-600">
            Tell us about your daily routine and we'll generate a personalized, realistic timetable.
          </p>
        </div>

        <div className="w-full grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Left: Routine inputs */}
          <Card className="p-6 space-y-6 shadow-soft animate-stagger-1">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Routine</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Wake-up Time</span>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  className="field-surface"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sleep Time</span>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="field-surface"
                />
              </label>
            </div>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Commute Time (one way, minutes)
              </span>
              <input
                type="number"
                min={0}
                max={180}
                value={commute}
                onChange={(e) => setCommute(Number(e.target.value))}
                className="field-surface"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Preferred Study Time
              </span>
              <div className="flex flex-wrap gap-2">
                {STUDY_TIME_OPTIONS.map((option) => {
                  const { label, icon: Icon } = STUDY_TIME_LABELS[option];
                  const isActive = preferredStudyTime === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPreferredStudyTime(option)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition duration-200 ${
                        isActive
                          ? "border-brand-500/40 bg-brand-600 text-white shadow-[0_12px_28px_-16px_rgba(99,102,241,0.55)]"
                          : "border-white/80 bg-white/82 text-slate-600 hover:border-brand-200 hover:text-brand-700 dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Study Block (minutes)
                </span>
                <input
                  type="number"
                  min={15}
                  max={120}
                  value={studyBlockMinutes}
                  onChange={(e) => setStudyBlockMinutes(Number(e.target.value))}
                  className="field-surface"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Break Duration (minutes)
                </span>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="field-surface"
                />
              </label>
            </div>

            <div className="pt-2">
              <Button onClick={handleGenerate} className="w-full rounded-2xl">
                <Sparkles size={16} />
                Generate Timetable
              </Button>
            </div>
          </Card>

          {/* Right: Preview */}
          <div className="space-y-4 animate-stagger-2">
            {!generatedTimetable ? (
              <Card className="relative flex h-full min-h-[440px] flex-col items-center justify-center overflow-hidden border-dashed border-2 border-slate-200/80 bg-slate-50/50 p-12 text-center shadow-none transition-all hover:border-brand-300/50 dark:border-white/10 dark:bg-slate-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0,transparent_100%)]" />
                
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-soft dark:bg-slate-800">
                  <Calendar size={32} className="text-brand-500" />
                  <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 shadow-sm dark:bg-sky-500/20 dark:text-sky-400">
                    <Sparkles size={14} />
                  </div>
                </div>
                
                <h3 className="relative text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Ready to map your week?
                </h3>
                <p className="relative mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Tell us your daily rhythm on the left, and we'll craft a perfectly balanced study schedule tailored to your goals.
                </p>
              </Card>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4 shadow-soft text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Weekly Study</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m
                    </p>
                  </Card>
                  <Card className="p-4 shadow-soft text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subjects</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {subjectAllocation.length}
                    </p>
                  </Card>
                </div>

                {/* Subject allocation */}
                {subjectAllocation.length > 0 && (
                  <Card className="p-4 shadow-soft space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Subject Allocation
                    </p>
                    {subjectAllocation.map((item) => (
                      <div key={item.subjectId} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                        <span className="tabular-nums text-slate-500">{Math.floor(item.minutes / 60)}h {item.minutes % 60}m / week</span>
                      </div>
                    ))}
                  </Card>
                )}

                {/* Daily overview */}
                <Card className="p-4 shadow-soft space-y-3 max-h-[420px] overflow-y-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sticky top-0 bg-white/95 dark:bg-surface-800/95 py-1 z-10">
                    Weekly Schedule
                  </p>
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const daySessions = generatedTimetable.filter((s) => s.dayOfWeek === day);
                    const studyMin = getDayStudyMinutes(generatedTimetable, day);
                    if (daySessions.length === 0) return null;

                    return (
                      <div key={day} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {getDayName(day)}
                          </span>
                          <span className="text-xs tabular-nums text-slate-500">
                            {Math.floor(studyMin / 60)}h {studyMin % 60}m study
                          </span>
                        </div>
                        <div className="space-y-1">
                          {daySessions.map((s) => (
                            <div
                              key={s.id}
                              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                                s.type === "study"
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                                  : s.type === "college"
                                    ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-200"
                                    : "bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
                              }`}
                            >
                              <Clock3 size={12} />
                              <span className="tabular-nums font-medium">
                                {s.startTime}–{s.endTime}
                              </span>
                              <span className="truncate">{s.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
