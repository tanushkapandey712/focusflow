import { useState } from "react";
import { CloudUpload, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button, Card } from "../ui";
import {
  migrateLocalDataToSupabase,
  markMigrationDone,
  clearMigratedLocalData,
  type MigrationProgress,
} from "../../services/data/dataMigration";

interface MigrationPromptProps {
  userId: string;
  onComplete: () => void;
  onDismiss: () => void;
}

export const MigrationPrompt = ({ userId, onComplete, onDismiss }: MigrationPromptProps) => {
  const [status, setStatus] = useState<"idle" | "migrating" | "done" | "error">("idle");
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleMigrate = async () => {
    setStatus("migrating");
    setErrorMessage("");

    try {
      await migrateLocalDataToSupabase(userId, setProgress);
      clearMigratedLocalData();
      setStatus("done");
      setTimeout(onComplete, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Migration failed. Your local data is still safe.");
      setStatus("error");
    }
  };

  const handleSkip = () => {
    markMigrationDone();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="relative w-full max-w-md p-6 sm:p-8 animate-fade-up">
        {status === "idle" && (
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        )}

        <div className="flex flex-col items-center text-center gap-4">
          {status === "idle" && (
            <>
              <div className="h-14 w-14 rounded-2xl bg-brand-100 dark:bg-brand-500/15 flex items-center justify-center">
                <CloudUpload size={28} className="text-brand-600 dark:text-brand-300" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Sync your local data?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We found existing study data on this device. Would you like to sync it
                to your account so it appears on all your devices?
              </p>
              <div className="flex gap-3 mt-2 w-full">
                <Button variant="secondary" onClick={handleSkip} className="flex-1">
                  Skip
                </Button>
                <Button onClick={handleMigrate} className="flex-1">
                  <CloudUpload size={16} />
                  Sync Data
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your local data will remain safe if you skip.
              </p>
            </>
          )}

          {status === "migrating" && (
            <>
              <Loader2 size={32} className="text-brand-500 animate-spin" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Syncing your data...
              </h2>
              {progress && (
                <div className="w-full space-y-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{progress.step}</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-300"
                      style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    {progress.current} / {progress.total}
                  </p>
                </div>
              )}
            </>
          )}

          {status === "done" && (
            <>
              <CheckCircle2 size={40} className="text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Data synced successfully!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your study data is now available across all devices.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertTriangle size={40} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Sync encountered an issue
              </h2>
              <p className="text-sm text-rose-600 dark:text-rose-400">{errorMessage}</p>
              <div className="flex gap-3 mt-2 w-full">
                <Button variant="secondary" onClick={handleSkip} className="flex-1">
                  Skip for now
                </Button>
                <Button onClick={handleMigrate} className="flex-1">
                  Retry
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
