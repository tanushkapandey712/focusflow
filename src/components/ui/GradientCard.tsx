import type { PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

type GradientTone = "lavender" | "mint" | "peach";

interface GradientCardProps extends PropsWithChildren {
  className?: string;
  tone?: GradientTone;
}

const toneClass: Record<GradientTone, string> = {
  lavender: "bg-card-lavender",
  mint: "bg-card-mint",
  peach: "bg-card-peach",
};

export const GradientCard = ({
  className,
  tone = "lavender",
  children,
}: GradientCardProps) => (
  <div
    className={cn(
      "hover-lift relative min-w-0 overflow-hidden rounded-3xl border border-white/75 p-5 shadow-panel before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_44%)] before:content-[''] dark:border-white/10 dark:brightness-95",
      toneClass[tone],
      className,
    )}
  >
    <div className="relative z-[1]">{children}</div>
  </div>
);
