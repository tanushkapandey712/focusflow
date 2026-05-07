import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Sparkles, Plus, Trash2, Clock, Brain, Target, BookOpen } from "lucide-react";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { Button, Card } from "../components/ui";
import { buildSubjectsFromNames } from "../utils/subjects";

const TOTAL_STEPS = 6;

const GOAL_OPTIONS = [
  { id: "consistency", label: "Improve Consistency", icon: Target },
  { id: "syllabus", label: "Complete Syllabus", icon: BookOpen },
  { id: "distractions", label: "Reduce Distractions", icon: Check },
  { id: "deep-work", label: "Increase Deep Work", icon: Brain },
  { id: "focus", label: "Improve Focus", icon: Clock },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { profile, setProfile, subjects, addSubject } = useFocusFlowData();
  const [step, setStep] = useState(1);

  // Step 1: Name
  const [name, setName] = useState(profile.name || "");

  // Step 2: Student Profile
  const [institutionType, setInstitutionType] = useState<"school" | "college">(
    profile.institutionType || "school"
  );
  const [institutionName, setInstitutionName] = useState(profile.institutionName || "");
  const [classOrCourse, setClassOrCourse] = useState(profile.classOrCourse || "");
  const [fieldOfStudy, setFieldOfStudy] = useState(profile.fieldOfStudy || "");

  // Step 3: Subjects
  const [newSubject, setNewSubject] = useState("");
  const [localSubjects, setLocalSubjects] = useState<string[]>(
    subjects.map((s) => s.name)
  );

  // Step 4: Routine Setup
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [preferredStudyHours, setPreferredStudyHours] = useState("morning");

  // Step 5: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Smooth scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.trim() && !localSubjects.includes(newSubject.trim())) {
      setLocalSubjects([...localSubjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (subjectToRemove: string) => {
    setLocalSubjects(localSubjects.filter((s) => s !== subjectToRemove));
  };

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((id) => id !== goalId));
    } else {
      if (selectedGoals.length < 3) {
        setSelectedGoals([...selectedGoals, goalId]);
      }
    }
  };

  const handleComplete = () => {
    // Save Profile
    setProfile({
      ...profile,
      name: name.trim() || "Student",
      institutionType,
      institutionName,
      classOrCourse,
      fieldOfStudy,
      hasCompletedProfileSetup: true,
      hasCompletedSyllabusSetup: true,
      hasCompletedScheduleSetup: true,
    });

    // Save Subjects
    const nextSubjects = buildSubjectsFromNames(localSubjects, subjects);
    nextSubjects.forEach((s) => {
      if (!subjects.find((sub) => sub.name === s.name)) {
        addSubject(s);
      }
    });

    navigate("/dashboard");
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              What should we call you?
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Let's make this workspace yours.
            </p>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) handleNext();
              }}
              placeholder="e.g. Alex"
              className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-6 text-lg outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:border-brand-400"
            />
            <Button
              className="w-full h-14 rounded-full mt-8"
              onClick={handleNext}
              disabled={!name.trim()}
            >
              Continue <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Student Profile
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Help us tailor your study recommendations.
            </p>
            
            <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
              <button
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${institutionType === "school" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}
                onClick={() => setInstitutionType("school")}
              >
                School
              </button>
              <button
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${institutionType === "college" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}
                onClick={() => setInstitutionType("college")}
              >
                College
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder={institutionType === "school" ? "School Name" : "College/University Name"}
                className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-6 text-lg outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:border-brand-400"
              />
              <input
                type="text"
                value={classOrCourse}
                onChange={(e) => setClassOrCourse(e.target.value)}
                placeholder={institutionType === "school" ? "Class / Grade (e.g. 12th)" : "Course (e.g. B.Tech CS)"}
                className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-6 text-lg outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:border-brand-400"
              />
              {institutionType === "college" && (
                <input
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="Field / Major (Optional)"
                  className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-6 text-lg outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:border-brand-400"
                />
              )}
            </div>

            <Button className="w-full h-14 rounded-full mt-8" onClick={handleNext}>
              Continue <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Add your subjects
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              What are you studying this term?
            </p>
            
            <form onSubmit={handleAddSubject} className="flex gap-3">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-6 text-lg outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:border-brand-400"
              />
              <Button type="submit" variant="secondary" className="h-14 px-6 rounded-2xl">
                <Plus size={20} />
              </Button>
            </form>

            <div className="flex flex-wrap gap-3 pt-4">
              {localSubjects.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-sm">
                  <span className="font-medium">{sub}</span>
                  <button onClick={() => removeSubject(sub)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {localSubjects.length === 0 && (
                <div className="w-full p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center text-slate-500">
                  No subjects added yet. Add a few to build your syllabus.
                </div>
              )}
            </div>

            <Button className="w-full h-14 rounded-full mt-8" onClick={handleNext}>
              {localSubjects.length > 0 ? "Continue" : "Skip for now"} <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Set your routine
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              This helps FocusFlow calculate your realistic free time.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Wake up time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-4 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sleep time</label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/50 px-4 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800/50"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">When do you focus best?</label>
              <div className="grid grid-cols-3 gap-3">
                {["morning", "afternoon", "evening"].map((time) => (
                  <button
                    key={time}
                    onClick={() => setPreferredStudyHours(time)}
                    className={`h-12 rounded-xl border-2 capitalize font-semibold transition-all ${preferredStudyHours === time ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300" : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 hover:border-slate-300"}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full h-14 rounded-full mt-8" onClick={handleNext}>
              Continue <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              What are your goals?
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Select up to 3 primary focuses.
            </p>
            
            <div className="grid gap-3">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isSelected ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-slate-200 bg-white hover:border-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"}`}
                  >
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full ${isSelected ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                      <goal.icon size={18} />
                    </div>
                    <span className={`font-semibold ${isSelected ? "text-brand-900 dark:text-brand-100" : "text-slate-700 dark:text-slate-300"}`}>
                      {goal.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <Button className="w-full h-14 rounded-full mt-8" onClick={handleNext}>
              {selectedGoals.length > 0 ? "Generate Workspace" : "Skip"} <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        );
      case 6:
        const recommendedSubject = localSubjects.length > 0 ? localSubjects[0] : "Productivity 101";
        return (
          <div className="space-y-8 animate-fade-in text-center flex flex-col items-center">
            <div className="h-20 w-20 bg-gradient-to-br from-brand-400 to-sky-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-brand-500/20 animate-bounce-slow">
              <Sparkles size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                You're all set, {name || "Student"}!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Your calm workspace is ready. Based on your profile, here is a recommended starting point:
              </p>
            </div>

            <Card className="w-full p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-left text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 blur-3xl rounded-full mix-blend-screen" />
              <div className="relative z-10 space-y-4">
                <div className="text-xs uppercase tracking-widest font-semibold text-brand-300">Recommended First Session</div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{recommendedSubject}</div>
                  <div className="text-slate-300 flex items-center gap-2">
                    <ArrowRight size={14} className="text-brand-400" />
                    Chapter 1: Fundamentals
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-sm font-medium">
                  <Clock size={16} className="text-brand-300" />
                  25 min Deep Work
                </div>
              </div>
            </Card>

            <Button className="w-full h-14 rounded-full mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100" onClick={handleComplete}>
              Enter FocusFlow <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-surface-900 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-brand-500/30">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 shadow-soft"></div>
          <span className="text-xl font-bold tracking-tight">FocusFlow</span>
        </div>
        <div className="flex gap-2">
          {step > 1 && step < TOTAL_STEPS && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="fixed top-20 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 z-50">
        <div 
          className="h-full bg-brand-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-xl">
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
};
