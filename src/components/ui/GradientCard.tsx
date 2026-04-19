import type { PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

type GradientTone = "lavender" | "mint" | "peach";

interface GradientCardProps extends PropsWithChildren {
  className?: string;
  tone?: GradientTone;
}

const toneClass: Record<GradientTone, string> = {
  lavender:
    "bg-card-lavender dark:bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.2),transparent_44%),linear-gradient(145deg,rgba(30,41,59,0.98),rgba(40,51,82,0.96))]",
  mint:
    "bg-card-mint dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_44%),linear-gradient(145deg,rgba(17,24,39,0.98),rgba(23,47,61,0.96))]",
  peach:
    "bg-card-peach dark:bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_44%),linear-gradient(145deg,rgba(28,25,35,0.98),rgba(63,38,49,0.96))]",
};

export const GradientCard = ({
  className,
  tone = "lavender",
  children,
}: GradientCardProps) => (
  <div
    className={cn(
      "hover-lift relative min-w-0 overflow-hidden rounded-3xl border border-white/75 p-5 shadow-panel before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_44%)] before:content-[''] dark:border-white/10 dark:before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%)]",
      toneClass[tone],
      className,
    )}
  >
    <div className="relative z-[1]">{children}</div>
  </div>
);
