import { useEffect, useMemo, useState } from "react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { SubjectBadge } from "../components/subjects/SubjectBadge";
import { Button, Card, SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import type { InstitutionType, StudyGoal, UserProfile } from "../types/models";
import {
  getCompletedMinutesByGoal,
  getDefaultGoalTargetMinutes,
  goalTitlesToText,
  normalizeGoalTitle,
  parseGoalTitles,
} from "../utils/goals";
import {
  getClassOrCourseLabel,
  getInstitutionLabel,
  getSavedInstitutionType,
} from "../utils/profile";
import { buildSubjectsFromNames, parseSubjectNames, subjectNamesToText } from "../utils/subjects";

const studyTypeOptions: Array<{ value: UserProfile["preferredMode"]; label: string }> = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "deep-work", label: "Deep Work" },
  { value: "custom", label: "Custom" },
];

const institutionTypeOptions: Array<{ value: InstitutionType; label: string }> = [
  { value: "school", label: "School" },
  { value: "college", label: "College" },
];

export const SettingsPage = () => {
  const { profile, goals, sessions, subjects, setGoals, setProfile, setSubjects } = useFocusFlowData();
  const initialGoalsText = useMemo(() => goalTitlesToText(goals), [goals]);
  const initialSubjectsText = useMemo(() => subjectNamesToText(subjects), [subjects]);
  const [name, setName] = useState(profile.name);
  const [institutionType, setInstitutionType] = useState<InstitutionType>(getSavedInstitutionType(profile));
  const [classOrCourse, setClassOrCourse] = useState(profile.classOrCourse ?? "");
  const [institutionStartTime, setInstitutionStartTime] = useState(profile.institutionStartTime ?? "");
  const [institutionEndTime, setInstitutionEndTime] = useState(profile.institutionEndTime ?? "");
  const [studyType, setStudyType] = useState<UserProfile["preferredMode"]>(profile.preferredMode);
  const [subjectsText, setSubjectsText] = useState(initialSubjectsText);
  const [goalsText, setGoalsText] = useState(initialGoalsText);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(profile.name);
    setInstitutionType(getSavedInstitutionType(profile));
    setClassOrCourse(profile.classOrCourse ?? "");
    setInstitutionStartTime(profile.institutionStartTime ?? "");
    setInstitutionEndTime(profile.institutionEndTime ?? "");
    setStudyType(profile.preferredMode);
    setSubjectsText(initialSubjectsText);
    setGoalsText(initialGoalsText);
    setStatus("idle");
    setError("");
  }, [initialGoalsText, initialSubjectsText, profile]);

  const normalizedGoalText = useMemo(() => parseGoalTitles(goalsText).join("\n"), [goalsText]);
  const normalizedInitialGoalText = useMemo(() => parseGoalTitles(initialGoalsText).join("\n"), [initialGoalsText]);
  const parsedSubjectNames = useMemo(() => parseSubjectNames(subjectsText), [subjectsText]);
  const previewSubjects = useMemo(
    () => buildSubjectsFromNames(parsedSubjectNames, subjects),
    [parsedSubjectNames, subjects],
  );
  const normalizedSubjectText = parsedSubjectNames.join("\n");
  const normalizedInitialSubjectText = useMemo(
    () => parseSubjectNames(initialSubjectsText).join("\n"),
    [initialSubjectsText],
  );
  const trimmedName = name.trim();
  const normalizedClassOrCourse = classOrCourse.trim();
  const classOrCourseLabel = getClassOrCourseLabel(institutionType);
  const institutionLabel = getInstitutionLabel(institutionType);
  const verifiedDateLabel = profile.emailVerifiedAt
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(profile.emailVerifiedAt))
    : "Waiting for verification";
  const isDirty =
    trimmedName !== profile.name ||
    institutionType !== getSavedInstitutionType(profile) ||
    normalizedClassOrCourse !== (profile.classOrCourse ?? "") ||
    institutionStartTime !== (profile.institutionStartTime ?? "") ||
    institutionEndTime !== (profile.institutionEndTime ?? "") ||
    studyType !== profile.preferredMode ||
    normalizedSubjectText !== normalizedInitialSubjectText ||
    normalizedGoalText !== normalizedInitialGoalText;
  const completedMinutesByGoal = useMemo(() => getCompletedMinutesByGoal(sessions), [sessions]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedName) {
      setError("Enter your name before saving.");
      setStatus("idle");
      return;
    }

    if (!normalizedClassOrCourse) {
      setError(`Enter your ${classOrCourseLabel.toLowerCase()} before saving.`);
      setStatus("idle");
      return;
    }

    if (!institutionStartTime || !institutionEndTime) {
      setError(`Enter your ${institutionLabel.toLowerCase()} start and end times.`);
      setStatus("idle");
      return;
    }

    if (institutionStartTime === institutionEndTime) {
      setError(`${institutionLabel} start and end times should be different.`);
      setStatus("idle");
      return;
    }

    if (previewSubjects.length === 0) {
      setError("Add at least one subject to keep the timer and analytics useful.");
      setStatus("idle");
      return;
    }

    const parsedTitles = parseGoalTitles(goalsText);
    const existingGoalsByTitle = new Map(goals.map((goal) => [normalizeGoalTitle(goal.title), goal]));

    const nextGoals: StudyGoal[] = parsedTitles.map((title) => {
      const normalizedTitle = normalizeGoalTitle(title);
      const existingGoal = existingGoalsByTitle.get(normalizedTitle);

      return {
        id: existingGoal?.id ?? crypto.randomUUID(),
        title,
        targetMinutes: existingGoal?.targetMinutes ?? getDefaultGoalTargetMinutes(studyType),
        completedMinutes: completedMinutesByGoal[normalizedTitle] ?? existingGoal?.completedMinutes ?? 0,
        dueDate: existingGoal?.dueDate,
      };
    });

    setProfile({
      ...profile,
      name: trimmedName,
      preferredMode: studyType,
      isAuthenticated: true,
      hasCompletedProfileSetup: true,
      institutionType,
      classOrCourse: normalizedClassOrCourse,
      institutionStartTime,
      institutionEndTime,
    });
    setSubjects(previewSubjects);
    setGoals(nextGoals);
    setSubjectsText(subjectNamesToText(previewSubjects));
    setGoalsText(goalTitlesToText(nextGoals));
    setError("");
    setStatus("saved");
  };

  return (
    <DashboardContainer className="max-w-3xl">
      <SectionContainer
        title="Profile & Settings"
        description="Keep your profile, subjects, study timings, and goals aligned with how you actually study."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="space-y-5 p-5 sm:p-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Profile</h3>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                Keep your study profile current while your verified email remains the sign-in identity for this device.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setStatus("idle");
                    setError("");
                  }}
                  placeholder="Student"
                  className="field-surface"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">School or college</span>
                <select
                  value={institutionType}
                  onChange={(event) => {
                    setInstitutionType(event.target.value as InstitutionType);
                    setStatus("idle");
                    setError("");
                  }}
                  className="field-surface"
                >
                  {institutionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{classOrCourseLabel}</span>
                <input
                  value={classOrCourse}
                  onChange={(event) => {
                    setClassOrCourse(event.target.value);
                    setStatus("idle");
                    setError("");
                  }}
                  placeholder={institutionType === "college" ? "B.Tech CSE" : "Class 11 Science"}
                  className="field-surface"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Study type</span>
                <select
                  value={studyType}
                  onChange={(event) => {
                    setStudyType(event.target.value as UserProfile["preferredMode"]);
                    setStatus("idle");
                    setError("");
                  }}
                  className="field-surface"
                >
                  {studyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{institutionLabel} start time</span>
                <input
                  type="time"
                  value={institutionStartTime}
                  onChange={(event) => {
                    setInstitutionStartTime(event.target.value);
                    setStatus("idle");
                    setError("");
                  }}
                  className="field-surface"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{institutionLabel} end time</span>
                <input
                  type="time"
                  value={institutionEndTime}
                  onChange={(event) => {
                    setInstitutionEndTime(event.target.value);
                    setStatus("idle");
                    setError("");
                  }}
                  className="field-surface"
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Verified email</span>
                <input value={profile.email ?? ""} readOnly className="field-surface cursor-not-allowed opacity-80" />
              </label>

              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 sm:col-span-2">
                Verified on {verifiedDateLabel}. This email is currently used to sign in on this device.
              </div>
            </div>
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Subjects</h3>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                Add one subject per line or use commas. The same list powers your timer, history, and analytics.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject list</span>
              <textarea
                value={subjectsText}
                onChange={(event) => {
                  setSubjectsText(event.target.value);
                  setStatus("idle");
                  setError("");
                }}
                rows={5}
                placeholder={"Mathematics\nPhysics\nEnglish"}
                className="field-surface min-h-36 resize-y"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Preview</span>
              <div className="flex min-h-16 flex-wrap gap-2 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-900/60">
                {previewSubjects.length ? (
                  previewSubjects.map((subject) => <SubjectBadge key={subject.id} subject={subject} />)
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Add at least one subject.</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Goals</h3>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                Add one goal per line. Reuse the same goal text in the timer to track progress automatically.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Goal list</span>
              <textarea
                value={goalsText}
                onChange={(event) => {
                  setGoalsText(event.target.value);
                  setStatus("idle");
                  setError("");
                }}
                rows={6}
                placeholder={"Finish chapter summary\nPractice past paper\nReview chemistry notes"}
                className="field-surface min-h-36 resize-y"
              />
            </label>
          </Card>

          <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                {status === "saved" ? "Saved locally." : "Changes stay on this device."}
              </p>
              {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
            </div>
            <Button type="submit" disabled={!isDirty} className="sm:min-w-32">
              Save Settings
            </Button>
          </Card>
        </form>
      </SectionContainer>
    </DashboardContainer>
  );
};
