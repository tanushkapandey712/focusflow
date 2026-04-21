import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "../ui";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal = ({
  isOpen,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="soft-surface w-full max-w-md rounded-[1.7rem] border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900/92">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close delete confirmation"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition duration-200 hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100/70 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:border-white/15 dark:hover:text-slate-100 dark:focus-visible:ring-brand-900/40"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} className="sm:min-w-28">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="sm:min-w-32 border-rose-500/40 bg-[linear-gradient(135deg,#ef4444,#dc2626)] text-white shadow-[0_22px_50px_-28px_rgba(239,68,68,0.7)] hover:brightness-105 dark:border-rose-400/20 dark:bg-[linear-gradient(135deg,#ef4444,#be123c)]"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
