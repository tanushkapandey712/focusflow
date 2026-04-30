import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "danger-ghost";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
}

const variantClass = {
  // Coral CTA — main actions
  primary:
    "bg-card-coral text-white shadow-soft hover:brightness-108 hover:shadow-glow-coral focus-visible:ring-coral/30",

  // Neutral outlined — secondary actions
  secondary:
    "border border-cream-200 bg-cream text-navy shadow-soft hover:bg-white hover:border-slate-200 " +
    "dark:border-white/10 dark:bg-surface-800 dark:text-slate-100 dark:hover:bg-surface-700 dark:hover:border-white/20 " +
    "focus-visible:ring-navy/15",

  // Deep red — irreversible / destructive confirm buttons
  danger:
    "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-soft " +
    "hover:from-red-500 hover:to-rose-500 hover:shadow-[0_8px_24px_-6px_rgba(220,38,38,0.45)] " +
    "focus-visible:ring-red-400/40",

  // Text-only — cancel, dismiss, low-emphasis actions
  ghost:
    "bg-transparent text-slate-500 shadow-none hover:bg-cream hover:text-navy " +
    "dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-slate-100 " +
    "focus-visible:ring-slate-300/40",

  // Destructive icon/text button without a filled background (trash, remove, etc.)
  "danger-ghost":
    "bg-transparent text-rose-500 shadow-none hover:bg-rose-50 hover:text-rose-700 " +
    "dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 " +
    "focus-visible:ring-rose-400/30",
} as const;

const sizeClass = {
  sm:   "h-8 rounded-xl px-3 text-xs gap-1.5",
  md:   "h-11 rounded-2xl px-4 py-2.5 text-sm gap-2",
  icon: "h-8 w-8 rounded-xl px-0 gap-0",
} as const;

export const Button = ({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  leftIcon,
  disabled,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      // Base
      "inline-flex items-center justify-center font-semibold tracking-[0.01em]",
      "transition duration-200 ease-out",
      "active:scale-[0.97]",
      "focus-visible:outline-none focus-visible:ring-4",
      // Disabled / loading
      "disabled:pointer-events-none disabled:opacity-50",
      // Motion
      "motion-safe:hover:-translate-y-0.5",
      // Variant + size
      variantClass[variant],
      sizeClass[size],
      // Loading keeps the button non-interactive but doesn't collapse it
      loading && "pointer-events-none",
      className,
    )}
    disabled={disabled || loading}
    aria-busy={loading}
    {...props}
  >
    {loading ? (
      <>
        <Loader2
          size={size === "sm" ? 13 : 15}
          className="shrink-0 animate-spin"
        />
        <span>{loadingText ?? children}</span>
      </>
    ) : (
      <>
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
      </>
    )}
  </button>
);
