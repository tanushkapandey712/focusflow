import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button = ({
  className,
  variant = "primary",
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold tracking-[0.01em] shadow-soft transition duration-300 ease-out active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100/70 dark:focus-visible:ring-brand-900/40 motion-safe:hover:-translate-y-0.5",
      variant === "primary"
        ? "bg-gradient-to-r from-slate-950 via-brand-700 to-brand-600 text-white hover:brightness-105 dark:from-white dark:via-slate-100 dark:to-brand-100 dark:text-slate-950"
        : "border border-white/70 bg-white/80 text-slate-700 backdrop-blur hover:bg-white dark:border-white/10 dark:bg-surface-800/82 dark:text-slate-100 dark:hover:bg-surface-800",
      className,
    )}
    {...props}
  />
);
