import { cn } from "../../lib/cn";
import type { TimerMode, TimerPreset } from "./types";

interface TimerPresetSelectorProps {
  presets: TimerPreset[];
  mode: TimerMode;
  onModeChange: (value: TimerMode) => void;
  customMinutes: number;
  onCustomMinutesChange: (value: number) => void;
  disabled?: boolean;
}

export const TimerPresetSelector = ({
  presets,
  mode,
  onModeChange,
  customMinutes,
  onCustomMinutesChange,
  disabled = false,
}: TimerPresetSelectorProps) => (
  <div className="space-y-4">
    {/* Segmented control */}
    <div className="grid grid-cols-1 gap-1.5 rounded-[1.25rem] border border-white/80 bg-white/60 p-1.5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)] backdrop-blur sm:grid-cols-3 dark:border-white/10 dark:bg-slate-950/50">
      {presets.map((preset) => {
        const isActive = preset.mode === mode;

        return (
          <button
            key={preset.mode}
            type="button"
            onClick={() => onModeChange(preset.mode)}
            disabled={disabled}
            className={cn(
              "relative min-w-0 rounded-[0.95rem] px-4 py-2.5 text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
              isActive
                ? "bg-blue-600 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
            )}
          >
            <span className="relative z-10">{preset.label}</span>
            <span
              className={cn(
                "ml-1.5 text-xs font-medium",
                isActive ? "text-blue-100" : "text-slate-400 dark:text-slate-500",
              )}
            >
              {preset.mode === "custom" ? `${customMinutes}m` : `${preset.minutes}m`}
            </span>
          </button>
        );
      })}
    </div>

    {/* Custom duration input */}
    {mode === "custom" ? (
      <div className="w-full max-w-xs animate-fade-up">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Custom Duration (minutes)
        </label>
        <input
          type="number"
          min={5}
          max={180}
          value={customMinutes}
          onChange={(event) => onCustomMinutesChange(Number(event.target.value) || 5)}
          disabled={disabled}
          className="field-surface mt-2 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    ) : null}
  </div>
);
