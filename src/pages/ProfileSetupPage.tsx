import { useState } from "react";
import { ArrowRight, BookOpenText, GraduationCap, Sparkles } from "lucide-react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button, Card, GradientCard } from "../components/ui";
import { ProfileAvatarSelector } from "../components/profile/ProfileAvatarSelector";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import type { InstitutionType } from "../types/models";
import {
  getClassOrCourseLabel,
  getInstitutionLabel,
  getSavedInstitutionType,
  isProfileSetupComplete,
} from "../utils/profile";

const institutionOptions: Array<{ value: InstitutionType; label: string; icon: typeof GraduationCap }> = [
  { value: "school", label: "School Student", icon: BookOpenText },
  { value: "college", label: "College Student", icon: GraduationCap },
];

export const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { profile, setProfile } = useFocusFlowData();

  const [name, setName] = useState(profile.name === "Student" ? "" : profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [institutionType, setInstitutionType] = useState<InstitutionType>(getSavedInstitutionType(profile));
  const [classOrCourse, setClassOrCourse] = useState(profile.classOrCourse ?? "");
  const [startTime, setStartTime] = useState(profile.institutionStartTime ?? "");
  const [endTime, setEndTime] = useState(profile.institutionEndTime ?? "");
  const [error, setError] = useState("");

  if (!profile.isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (isProfileSetupComplete(profile)) {
    return <Navigate to="/dashboard" replace />;
  }

  const classOrCourseLabel = getClassOrCourseLabel(institutionType);
  const institutionLabel = getInstitutionLabel(institutionType);
  const trimmedName = name.trim();
  const trimmedClassOrCourse = classOrCourse.trim();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedName) {
      setError("Enter your name to finish the profile.");
      return;
    }

    if (!trimmedClassOrCourse) {
      setError(`Enter your ${classOrCourseLabel.toLowerCase()} to finish the profile.`);
      return;
    }

    if (!startTime || !endTime) {
      setError(`Enter your ${institutionLabel.toLowerCase()} start and end times.`);
      return;
    }

    if (startTime === endTime) {
      setError(`${institutionLabel} start and end times should be different.`);
      return;
    }

    setProfile({
      ...profile,
      name: trimmedName,
      avatarUrl,
      institutionType,
      classOrCourse: trimmedClassOrCourse,
      institutionStartTime: startTime,
      institutionEndTime: endTime,
      hasCompletedProfileSetup: true,
    });

    navigate("/syllabus-setup");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8ff] text-slate-900 dark:bg-surface-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-[-4rem] h-72 w-72 rounded-full bg-brand-100/80 blur-3xl dark:bg-brand-700/15" />
        <div className="absolute right-[-4rem] top-16 h-72 w-72 rounded-full bg-cyan-200/70 blur-3xl dark:bg-sky-500/12" />
        <div className="absolute bottom-[-2rem] left-1/3 h-80 w-80 rounded-full bg-pastel-peach/65 blur-3xl dark:bg-orange-300/8" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
          <GradientCard tone="mint" className="overflow-hidden p-7 sm:p-8">
            <div className="space-y-6">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-brand-700 to-sky-400 text-white shadow-soft">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-900">FocusFlow</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Academic Profile</p>
                </div>
              </Link>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Personalize</p>
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  Set up your study workspace.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600">
                  Add the details that shape your subjects, schedule, and study suggestions.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  ["Verified email", profile.email ?? "Connected securely"],
                  ["Subjects", "Used across the timer, history, and analytics."],
                  ["Routine", "Your schedule keeps the workspace grounded in your day."],
                ].map(([label, text]) => (
                  <div key={label} className="rounded-3xl bg-white/70 p-4 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </GradientCard>

          <Card className="space-y-6 p-6 sm:p-7 dark:bg-slate-800/90">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <ProfileAvatarSelector value={avatarUrl} onChange={setAvatarUrl} />
                </div>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    placeholder="Your name"
                    className="field-surface"
                  />
                </label>

                <div className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">You study in</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {institutionOptions.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setInstitutionType(value);
                          setError("");
                        }}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          institutionType === value
                            ? "border-brand-500 bg-brand-50 text-slate-900 shadow-soft dark:border-brand-300 dark:bg-brand-700/20 dark:text-white"
                            : "border-white/80 bg-white/75 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900"
                        }`}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-soft dark:bg-slate-800">
                          <Icon size={16} />
                        </span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{classOrCourseLabel}</span>
                  <input
                    value={classOrCourse}
                    onChange={(event) => {
                      setClassOrCourse(event.target.value);
                      setError("");
                    }}
                    placeholder={institutionType === "college" ? "B.Tech CSE" : "Class 11 Science"}
                    className="field-surface"
                  />
                </label>

                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
                  Your profile will show {trimmedName || "your name"} in {trimmedClassOrCourse || classOrCourseLabel.toLowerCase()}.
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{institutionLabel} start time</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => {
                      setStartTime(event.target.value);
                      setError("");
                    }}
                    className="field-surface"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{institutionLabel} end time</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => {
                      setEndTime(event.target.value);
                      setError("");
                    }}
                    className="field-surface"
                  />
                </label>
              </div>

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You can refine all of this later in settings.
                </p>
              )}

              <Button type="submit" className="w-full justify-center">
                Save and continue
                <ArrowRight size={16} />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
