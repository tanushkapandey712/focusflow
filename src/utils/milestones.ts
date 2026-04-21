import type { StudySession, Subject } from "../types/models";
import { getCurrentStreakDays, getLongestStreakDays } from "./streak";
import { getSyllabusCompletionSummary } from "./syllabusProgress";

export type MilestoneCategory = "sessions" | "time" | "streak" | "topics" | "subjects";

export interface Milestone {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  /** Threshold to achieve */
  target: number;
  /** Current progress toward the target */
  current: number;
  /** Whether the milestone is achieved */
  achieved: boolean;
  /** Achievement percentage (0–100) */
  progress: number;
  /** Icon emoji for display */
  icon: string;
}

interface MilestoneDefinition {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  target: number;
  icon: string;
}

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // Session milestones
  { id: "sessions-1", category: "sessions", title: "First Step", description: "Complete your first study session", target: 1, icon: "🎯" },
  { id: "sessions-5", category: "sessions", title: "Getting Started", description: "Complete 5 study sessions", target: 5, icon: "📚" },
  { id: "sessions-25", category: "sessions", title: "Dedicated Learner", description: "Complete 25 study sessions", target: 25, icon: "🏆" },
  { id: "sessions-50", category: "sessions", title: "Half Century", description: "Complete 50 study sessions", target: 50, icon: "⭐" },
  { id: "sessions-100", category: "sessions", title: "Study Machine", description: "Complete 100 study sessions", target: 100, icon: "💎" },

  // Time milestones (in minutes)
  { id: "time-60", category: "time", title: "First Hour", description: "Study for a total of 1 hour", target: 60, icon: "⏰" },
  { id: "time-300", category: "time", title: "Five Hours", description: "Study for a total of 5 hours", target: 300, icon: "🕐" },
  { id: "time-600", category: "time", title: "Ten Hours In", description: "Accumulate 10 hours of study", target: 600, icon: "📖" },
  { id: "time-1500", category: "time", title: "25 Hour Club", description: "Reach 25 hours of total study time", target: 1500, icon: "🔥" },
  { id: "time-3000", category: "time", title: "50 Hour Scholar", description: "Study for a total of 50 hours", target: 3000, icon: "🎓" },

  // Streak milestones
  { id: "streak-3", category: "streak", title: "Three-Day Spark", description: "Maintain a 3-day study streak", target: 3, icon: "✨" },
  { id: "streak-7", category: "streak", title: "One Full Week", description: "Study every day for a week", target: 7, icon: "🔥" },
  { id: "streak-14", category: "streak", title: "Fortnight Focus", description: "Keep a 14-day study streak", target: 14, icon: "💪" },
  { id: "streak-30", category: "streak", title: "Monthly Master", description: "Study every day for 30 days", target: 30, icon: "👑" },

  // Topic milestones
  { id: "topics-5", category: "topics", title: "Coverage Begins", description: "Complete 5 syllabus topics", target: 5, icon: "✅" },
  { id: "topics-15", category: "topics", title: "Building Depth", description: "Complete 15 syllabus topics", target: 15, icon: "📋" },
  { id: "topics-30", category: "topics", title: "Deep Coverage", description: "Complete 30 syllabus topics", target: 30, icon: "🗂️" },
  { id: "topics-50", category: "topics", title: "Syllabus Champion", description: "Complete 50 syllabus topics", target: 50, icon: "🏅" },

  // Subject milestones
  { id: "subjects-2", category: "subjects", title: "Multi-Subject", description: "Study at least 2 different subjects", target: 2, icon: "📝" },
  { id: "subjects-5", category: "subjects", title: "Well Rounded", description: "Study at least 5 different subjects", target: 5, icon: "🌟" },
];

/**
 * Evaluates all milestones against current user data.
 */
export const evaluateMilestones = (
  sessions: StudySession[],
  subjects: Subject[],
): Milestone[] => {
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.actualMinutes, 0);
  const currentStreak = getCurrentStreakDays(sessions);
  const longestStreak = getLongestStreakDays(sessions);
  const bestStreak = Math.max(currentStreak, longestStreak);

  const completion = getSyllabusCompletionSummary(subjects);
  const completedTopics = completion.coveredTopics;

  const studiedSubjectIds = new Set(sessions.map((s) => s.subjectId));
  const studiedSubjectCount = studiedSubjectIds.size;

  const getValue = (category: MilestoneCategory): number => {
    switch (category) {
      case "sessions":
        return totalSessions;
      case "time":
        return totalMinutes;
      case "streak":
        return bestStreak;
      case "topics":
        return completedTopics;
      case "subjects":
        return studiedSubjectCount;
    }
  };

  const categories: MilestoneCategory[] = ["sessions", "time", "streak", "topics", "subjects"];
  
  return categories.flatMap((category) => {
    const current = getValue(category);
    const defs = MILESTONE_DEFINITIONS.filter((d) => d.category === category);
    const results: Milestone[] = [];
    
    let highestTarget = 0;
    for (const def of defs) {
      if (current >= def.target) {
        results.push({
          ...def,
          current,
          achieved: true,
          progress: 100,
        });
        highestTarget = Math.max(highestTarget, def.target);
      }
    }
    
    const unachieved = defs.find((d) => current < d.target);
    
    if (unachieved) {
      results.push({
        ...unachieved,
        current,
        achieved: false,
        progress: Math.min(100, Math.round((current / unachieved.target) * 100)),
      });
    } else {
      let nextTarget = highestTarget;
      let step = 10;
      if (category === "sessions") step = 50;
      else if (category === "time") step = 600;
      else if (category === "streak") step = 30;
      else if (category === "topics") step = 25;
      else if (category === "subjects") step = 5;
      
      let dynamicCount = 1;
      while (current >= nextTarget + step) {
        nextTarget += step;
        results.push({
          id: `${category}-dyn-${nextTarget}`,
          category,
          title: `Elite ${category.charAt(0).toUpperCase() + category.slice(1)} ${dynamicCount}`,
          description: `Reach ${nextTarget} in ${category}`,
          target: nextTarget,
          current,
          achieved: true,
          progress: 100,
          icon: "🌟",
        });
        dynamicCount++;
      }
      
      nextTarget += step;
      results.push({
        id: `${category}-dyn-${nextTarget}`,
        category,
        title: `Next Level: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        description: `Reach ${nextTarget} in ${category}`,
        target: nextTarget,
        current,
        achieved: false,
        progress: Math.min(100, Math.round((current / nextTarget) * 100)),
        icon: "🌟",
      });
    }
    
    return results;
  });
};

/** Count of achieved milestones */
export const countAchievedMilestones = (milestones: Milestone[]): number =>
  milestones.filter((m) => m.achieved).length;
