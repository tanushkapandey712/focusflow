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
        ? "border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-brand-700 text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.65)] hover:brightness-105 dark:border-brand-300/15 dark:from-brand-700 dark:via-brand-600 dark:to-sky-500 dark:text-white dark:shadow-[0_18px_40px_-24px_rgba(99,102,241,0.85)]"
        : "border border-white/80 bg-white/82 text-slate-700 backdrop-blur hover:bg-white dark:border-white/10 dark:bg-slate-900/82 dark:text-slate-100 dark:hover:bg-slate-900",
      className,
    )}
    {...props}
  />
);
