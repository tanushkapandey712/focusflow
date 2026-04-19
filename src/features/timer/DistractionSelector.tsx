import { cn } from "../../lib/cn";

const DISTRACTION_OPTIONS = ["phone", "social media", "tiredness"] as const;

interface DistractionSelectorProps {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export const DistractionSelector = ({
  selected,
  onChange,
  disabled = false,
}: DistractionSelectorProps) => {
  const toggleTag = (tag: string) => {
    if (disabled) return;
    if (selected.includes(tag)) {
      onChange(selected.filter((item) => item !== tag));
      return;
    }
    onChange([...selected, tag]);
  };

  return (
    <div className="space-y-3 text-left">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Distractions
      </p>
      <div className="flex flex-wrap gap-2">
        {DISTRACTION_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggleTag(option)}
            disabled={disabled}
            className={cn(
              "surface-pill rounded-full px-3 py-1.5 text-xs font-medium transition duration-300 disabled:opacity-50",
              selected.includes(option)
                ? "border-brand-500 bg-brand-600 text-white shadow-soft"
                : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-surface-800",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
