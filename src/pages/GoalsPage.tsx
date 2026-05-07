import { useState } from "react";
import { Plus, CheckCircle2, Circle, Trophy, BookOpen, Clock, Trash2, Edit2, Check } from "lucide-react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { StreakCard } from "../components/goals/StreakCard";
import { SectionContainer, Button } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { getCurrentStreakDays, getLongestStreakDays } from "../utils/streak";
import { cn } from "../lib/cn";
import type { StudyGoal } from "../types/models";

// Helper components

const GoalSection = ({ 
  title, 
  icon: Icon, 
  goals, 
  type,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onToggleGoal
}: { 
  title: string; 
  icon: any; 
  goals: StudyGoal[];
  type: "academic" | "habit" | "milestone";
  onAddGoal: (title: string, targetMinutes: number, type: "academic" | "habit" | "milestone") => void;
  onUpdateGoal: (id: string, title: string) => void;
  onDeleteGoal: (id: string) => void;
  onToggleGoal: (id: string, isCompleted: boolean) => void;
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) {
      setAddError("Goal title is required.");
      return;
    }
    onAddGoal(newTitle.trim(), 120, type); // Default to 120 min or arbitrary target
    setNewTitle("");
    setAddError("");
    setIsAdding(false);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onUpdateGoal(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-brand-500">
            <Icon size={18} />
          </div>
          {title}
        </h3>
        <Button variant="secondary" onClick={() => setIsAdding(true)} className="h-8 rounded-full px-3 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => {
          const isCompleted = goal.completedMinutes >= goal.targetMinutes;
          const isEditing = editingId === goal.id;

          return (
            <div 
              key={goal.id} 
              className={cn(
                "p-4 rounded-2xl border transition-all duration-300",
                isCompleted 
                  ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 opacity-70"
                  : "bg-white border-slate-200/60 dark:bg-slate-900/40 dark:border-white/10 shadow-sm hover:shadow-md"
              )}
            >
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(goal.id)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <Button onClick={() => handleSaveEdit(goal.id)} className="h-9 w-9 p-0 rounded-xl"><Check size={16} /></Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button 
                      onClick={() => onToggleGoal(goal.id, !isCompleted)}
                      className={cn("transition-colors", isCompleted ? "text-emerald-500" : "text-slate-300 hover:text-brand-500")}
                    >
                      {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    <div className="flex-1">
                      <p className={cn("text-sm font-semibold transition-all", isCompleted ? "text-slate-500 line-through dark:text-slate-400" : "text-slate-900 dark:text-slate-100")}>
                        {goal.title}
                      </p>
                      {/* Simple visual progress bar if it's an active goal that isn't just a simple checklist item (i.e. if we actually track minutes) */}
                      {!isCompleted && goal.targetMinutes > 1 && (
                        <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (goal.completedMinutes / goal.targetMinutes) * 100)}%` }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingId(goal.id);
                        setEditTitle(goal.title);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isAdding && (
          <div className="p-4 rounded-2xl border border-brand-200 bg-brand-50/50 dark:border-brand-500/20 dark:bg-brand-500/5 animate-fade-up">
            <div className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Goal title <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => { setNewTitle(e.target.value); setAddError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder={`e.g. ${type === 'academic' ? 'Finish Math-II before June' : type === 'habit' ? 'Study 3 hours/day' : 'Finish Unit 2'}`}
                  aria-required="true"
                  aria-invalid={!!addError}
                  className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm ${addError ? "border-rose-400 dark:border-rose-500" : "border-transparent"}`}
                />
                {addError && <p className="text-xs text-rose-500">{addError}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setIsAdding(false); setAddError(""); }} className="h-9 px-4 rounded-xl text-xs">Cancel</Button>
                <Button onClick={handleAdd} className="h-9 px-4 rounded-xl text-xs">Save Goal</Button>
              </div>
            </div>
          </div>
        )}

        {goals.length === 0 && !isAdding && (
          <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">No {type} goals set yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const GoalsPage = () => {
  const { goals, setGoals, sessions } = useFocusFlowData();

  const handleAddGoal = (title: string, targetMinutes: number, type: "academic" | "habit" | "milestone") => {
    const newGoal: StudyGoal = {
      id: crypto.randomUUID(),
      title,
      type,
      targetMinutes,
      completedMinutes: 0,
    };
    setGoals([...goals, newGoal]);
  };

  const handleUpdateGoal = (id: string, title: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, title } : g));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleToggleGoal = (id: string, isCompleted: boolean) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        return {
          ...g,
          completedMinutes: isCompleted ? Math.max(g.targetMinutes, 1) : 0
        };
      }
      return g;
    }));
  };

  // Group goals by type
  const academicGoals = goals.filter(g => g.type === "academic");
  const habitGoals = goals.filter(g => g.type === "habit" || !g.type); // old goals default to habit
  const milestoneGoals = goals.filter(g => g.type === "milestone");

  const currentStreak = getCurrentStreakDays(sessions);
  const longestStreak = getLongestStreakDays(sessions);

  return (
    <DashboardContainer className="max-w-4xl">
      <SectionContainer
        title="Goals & Milestones"
        description="Structure your academic targets, daily habits, and key milestones in one place."
      >
        <div className="mb-8">
          <StreakCard currentDays={currentStreak} longestDays={Math.max(longestStreak, 7)} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <GoalSection 
              title="Academic Goals" 
              icon={BookOpen} 
              type="academic"
              goals={academicGoals} 
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onToggleGoal={handleToggleGoal}
            />
            
            <GoalSection 
              title="Habit Goals" 
              icon={Clock} 
              type="habit"
              goals={habitGoals} 
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onToggleGoal={handleToggleGoal}
            />
          </div>

          <div className="space-y-8">
            <GoalSection 
              title="Milestones" 
              icon={Trophy} 
              type="milestone"
              goals={milestoneGoals} 
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onToggleGoal={handleToggleGoal}
            />
            
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Focus Tip</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Keep your milestones small and actionable (e.g. "Finish Unit 2 Notes"). Small wins build momentum for larger academic goals.
              </p>
            </div>
          </div>
        </div>

      </SectionContainer>
    </DashboardContainer>
  );
};
