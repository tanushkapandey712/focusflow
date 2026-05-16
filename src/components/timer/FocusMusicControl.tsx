import { useState } from "react";
import { Music, Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/cn";
import { FOCUS_SOUNDS, type FocusSoundType } from "../../hooks/useFocusMusic";

interface FocusMusicControlProps {
  isPlaying: boolean;
  volume: number;
  soundType: FocusSoundType;
  onToggle: () => void;
  onChangeSound: (type: FocusSoundType) => void;
  onVolumeChange: (volume: number) => void;
  isFullscreen?: boolean;
}

export const FocusMusicControl = ({
  isPlaying,
  volume,
  soundType,
  onToggle,
  onChangeSound,
  onVolumeChange,
  isFullscreen = false,
}: FocusMusicControlProps) => {
  const [expanded, setExpanded] = useState(false);

  const selectedSound = FOCUS_SOUNDS.find((s) => s.id === soundType)!;

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-300 overflow-hidden",
        isFullscreen
          ? "bg-white/5 border-white/10 text-white"
          : "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-white/10",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Play/Pause toggle */}
        <button
          onClick={onToggle}
          aria-label={isPlaying ? "Stop focus music" : "Play focus music"}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
            isPlaying
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/30 scale-105"
              : isFullscreen
              ? "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400",
          )}
        >
          <Music size={14} />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-xs font-semibold leading-tight",
              isFullscreen ? "text-white/80" : "text-slate-600 dark:text-slate-300",
            )}
          >
            Focus Music
            {isPlaying && (
              <span className="ml-2 inline-flex gap-0.5 items-end h-3 relative top-[1px]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-[2px] rounded-full bg-brand-500 animate-music-bar"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      height: "100%",
                    }}
                  />
                ))}
              </span>
            )}
          </p>
          <p
            className={cn(
              "text-[10px] leading-tight mt-0.5",
              isFullscreen ? "text-white/40" : "text-slate-400 dark:text-slate-500",
            )}
          >
            {isPlaying ? `${selectedSound.emoji} ${selectedSound.label}` : "Optional ambient sounds"}
          </p>
        </div>

        {/* Volume icon */}
        <button
          onClick={() => onVolumeChange(volume > 0 ? 0 : 0.3)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isFullscreen
              ? "text-white/40 hover:text-white/80"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
          )}
          aria-label={volume === 0 ? "Unmute" : "Mute"}
        >
          {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isFullscreen
              ? "text-white/40 hover:text-white/80"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
          )}
          aria-label={expanded ? "Collapse music settings" : "Expand music settings"}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded panel */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          expanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0 pointer-events-none",
        )}
      >
        <div
          className={cn(
            "px-4 pb-4 pt-1 space-y-3 border-t",
            isFullscreen ? "border-white/10" : "border-slate-100 dark:border-slate-800",
          )}
        >
          {/* Sound selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {FOCUS_SOUNDS.map((sound) => (
              <button
                key={sound.id}
                onClick={() => onChangeSound(sound.id)}
                title={sound.description}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all duration-150 text-[10px] font-semibold",
                  soundType === sound.id
                    ? "bg-brand-500 text-white shadow-sm"
                    : isFullscreen
                    ? "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400",
                )}
              >
                <span className="text-base leading-none">{sound.emoji}</span>
                <span className="leading-tight">{sound.label}</span>
              </button>
            ))}
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <VolumeX
              size={12}
              className={isFullscreen ? "text-white/40" : "text-slate-400"}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer accent-brand-500"
              style={{
                background: `linear-gradient(to right, var(--color-brand-500, #7c3aed) ${volume * 100}%, ${
                  isFullscreen ? "rgba(255,255,255,0.15)" : "#e2e8f0"
                } ${volume * 100}%)`,
              }}
              aria-label="Music volume"
            />
            <Volume2
              size={12}
              className={isFullscreen ? "text-white/40" : "text-slate-400"}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes music-bar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-music-bar {
          animation: music-bar 0.8s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  );
};
