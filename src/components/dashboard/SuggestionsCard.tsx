import { Lightbulb } from "lucide-react";
import type { RecommendationItem } from "../../types/models";
import { GradientCard } from "../ui";

interface SuggestionsCardProps {
  suggestions: RecommendationItem[];
}

const labelMap: Record<RecommendationItem["category"], string> = {
  focus: "Focus",
  break: "Break",
  subject: "Subject",
};

export const SuggestionsCard = ({ suggestions }: SuggestionsCardProps) => (
  <GradientCard tone="mint" className="animate-fade-up h-full p-6">
    <div className="flex h-full items-start gap-4">
      <div className="surface-pill flex h-11 w-11 items-center justify-center text-emerald-700 dark:text-emerald-300">
        <Lightbulb size={16} />
      </div>
      <div className="w-full space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Smart Suggestions</p>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Short, useful nudges to keep the next block clean.
          </p>
        </div>
        {suggestions.map((item, index) => (
          <div
            key={`${item.category}-${item.message}`}
            className="flex items-start gap-3 rounded-[1.35rem] bg-white/70 p-3 shadow-soft ring-1 ring-white/60 dark:bg-surface-900/45 dark:ring-white/5"
          >
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-surface-800 dark:text-slate-200">
              {labelMap[item.category]}
            </span>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Tip {index + 1}
              </p>
              <p className="text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </GradientCard>
);
