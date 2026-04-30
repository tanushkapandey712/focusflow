import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export const Button = ({
  className,
  variant = "primary",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold tracking-[0.01em] shadow-soft transition duration-300 ease-out active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100/70 dark:focus-visible:ring-brand-900/40 motion-safe:hover:-translate-y-0.5",
      variant === "primary" &&
        "bg-card-coral text-white shadow-soft hover:shadow-glow-coral hover:brightness-105",
      variant === "secondary" &&
        "border border-cream-200 bg-cream text-navy hover:bg-coral hover:text-white hover:border-coral dark:border-white/10 dark:bg-surface-800 dark:text-slate-100 dark:hover:bg-coral dark:hover:border-coral",
      variant === "danger" &&
        "bg-coral text-white shadow-soft hover:brightness-110",
      variant === "ghost" &&
        "border-none bg-transparent text-slate-500 shadow-none hover:bg-cream hover:text-navy dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-slate-100",
      loading && "pointer-events-none",
      className,
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <>
        <Loader2 size={16} className="animate-spin" />
        {children}
      </>
    ) : (
      children
    )}
  </button>
);
