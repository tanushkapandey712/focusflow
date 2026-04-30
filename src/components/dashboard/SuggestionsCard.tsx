import { Lightbulb } from "lucide-react";
import type { RecommendationItem } from "../../types/models";
import { GradientCard } from "../ui";

interface SuggestionsCardProps {
  suggestions: RecommendationItem[];
}

const categoryConfig: Record<RecommendationItem["category"], { label: string; emoji: string; bg: string }> = {
  focus:   { label: "Focus",   emoji: "🎯", bg: "bg-coral/20 text-coral" },
  break:   { label: "Break",   emoji: "☕", bg: "bg-teal/20 text-teal" },
  subject: { label: "Subject", emoji: "📖", bg: "bg-lavender-500/20 text-lavender-600" },
};

export const SuggestionsCard = ({ suggestions }: SuggestionsCardProps) => (
  <GradientCard tone="lavender" className="h-full p-6">
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
          <Lightbulb size={16} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Smart Tips</p>
          <p className="text-base font-extrabold tracking-tight text-white">Suggestions</p>
        </div>
      </div>

      {/* Suggestions list */}
      <div className="space-y-3">
        {suggestions.length === 0 ? (
          <div className="rounded-2xl bg-white/15 p-4 text-sm font-semibold text-white/80">
            Study a few sessions to unlock personalized tips ✨
          </div>
        ) : (
          suggestions.map((item, index) => {
            const cfg = categoryConfig[item.category];
            return (
              <div
                key={`${item.category}-${item.message}`}
                className="rounded-2xl bg-white/15 p-3.5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] bg-white/90 text-navy`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  <span className="text-[10px] font-semibold text-white/50">Tip {index + 1}</span>
                </div>
                <p className="text-sm font-semibold leading-6 text-white">{item.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  </GradientCard>
);
