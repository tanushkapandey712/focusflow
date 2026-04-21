import { ArrowRight, Sparkles } from "lucide-react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { SyllabusImportCard } from "../components/syllabus/SyllabusImportCard";
import { Button, Card } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { buildSubjectsFromNames } from "../utils/subjects";
import { isProfileSetupComplete, isSyllabusSetupComplete } from "../utils/profile";

export const SyllabusSetupPage = () => {
  const navigate = useNavigate();
  const { profile, subjects, setProfile, addSubject, updateSubject } = useFocusFlowData();

  if (!profile.isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!isProfileSetupComplete(profile)) {
    return <Navigate to="/profile-setup" replace />;
  }

  if (isSyllabusSetupComplete(profile)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCompleteSetup = () => {
    setProfile({
      ...profile,
      hasCompletedSyllabusSetup: true,
    });
    navigate("/schedule-setup");
  };

  const handleSaveImport = (params: {
    subjectId?: string;
    subjectName?: string;
    units: any[];
  }) => {
    if (params.subjectId) {
      const existing = subjects.find((s) => s.id === params.subjectId);
      if (existing) {
        updateSubject(existing.id, {
          syllabusUnits: [...existing.syllabusUnits, ...params.units],
        });
      }
    } else if (params.subjectName) {
      const [nextSubject] = buildSubjectsFromNames([params.subjectName], subjects);
      if (nextSubject) {
        addSubject({
          ...nextSubject,
          syllabusUnits: params.units,
        });
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8ff] text-slate-900 dark:bg-surface-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-[-4rem] h-72 w-72 rounded-full bg-brand-100/80 blur-3xl dark:bg-brand-700/15" />
        <div className="absolute right-[-4rem] top-16 h-72 w-72 rounded-full bg-cyan-200/70 blur-3xl dark:bg-sky-500/12" />
        <div className="absolute bottom-[-2rem] left-1/3 h-80 w-80 rounded-full bg-pastel-peach/65 blur-3xl dark:bg-orange-300/8" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full mb-8 flex justify-between items-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-brand-700 to-sky-400 text-white shadow-soft">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900">FocusFlow</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Syllabus Setup</p>
            </div>
          </Link>
          <Button
            onClick={handleCompleteSetup}
            disabled={subjects.length === 0}
            variant="primary"
            className="rounded-full shadow-soft"
          >
            Continue to Schedule
            <ArrowRight size={16} />
          </Button>
        </div>

        <div className="w-full space-y-6">
          <div className="text-center space-y-3 mb-8">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Map your study path.
            </h1>
            <p className="max-w-xl mx-auto text-base leading-7 text-slate-600">
              Upload your syllabus or curriculum below to break it down into trackable units and topics.
            </p>
          </div>

          <SyllabusImportCard subjects={subjects} onSaveImport={handleSaveImport} />

          {subjects.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Your Subjects ({subjects.length})
                </h3>
                <p className="text-sm text-slate-500">
                  Review and confirm before continuing
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="p-4 flex items-center justify-between shadow-soft">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{subject.name}</span>
                    <span className="text-sm text-slate-500">{subject.syllabusUnits.length} units</span>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {subjects.length === 0 && (
            <Card className="mt-8 p-12 text-center text-slate-500 border-dashed border-2">
              No subjects added yet. Try uploading a PDF or Image above!
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
