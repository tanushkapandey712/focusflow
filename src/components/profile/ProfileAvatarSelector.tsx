import { Upload, UserCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "../../lib/cn";

interface ProfileAvatarSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=f8fafc",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=f8fafc",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Caleb&backgroundColor=f8fafc",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Daisy&backgroundColor=f8fafc",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Eliza&backgroundColor=f8fafc",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Max&backgroundColor=f8fafc",
];

export const ProfileAvatarSelector = ({ value, onChange }: ProfileAvatarSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        onChange(event.target.result);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Main Display */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-200 bg-white shadow-soft dark:border-brand-500/30 dark:bg-slate-800">
          {value ? (
            <img src={value} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <UserCircle2 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
          )}
        </div>

        {/* Upload Action */}
        <div className="flex flex-col items-start gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:text-brand-300"
          >
            <Upload size={14} />
            Upload Photo
          </button>
          {error ? (
            <p className="text-xs text-rose-500">{error}</p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              JPG, PNG, WEBP (Max 2MB)
            </p>
          )}
        </div>
      </div>

      {/* Preset Avatars Grid */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Or choose an avatar
        </p>
        <div className="flex flex-wrap gap-3">
          {PRESET_AVATARS.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => onChange(url)}
              className={cn(
                "h-12 w-12 overflow-hidden rounded-full border-2 transition-all hover:-translate-y-1 hover:shadow-md",
                value === url
                  ? "border-brand-500 shadow-md dark:border-brand-400"
                  : "border-transparent bg-white shadow-sm dark:bg-slate-800",
              )}
            >
              <img src={url} alt="Preset Avatar" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
