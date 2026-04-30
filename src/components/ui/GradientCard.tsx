import type { PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

type GradientTone = "lavender" | "mint" | "peach" | "coral" | "teal" | "navy";

interface GradientCardProps extends PropsWithChildren {
  className?: string;
  tone?: GradientTone;
}

const toneClass: Record<GradientTone, string> = {
  lavender: "bg-card-lavender text-white",
  mint:     "bg-card-teal text-white",
  peach:    "bg-card-peach text-navy",
  coral:    "bg-card-coral text-white",
  teal:     "bg-card-teal text-white",
  navy:     "bg-card-navy text-white",
};

export const GradientCard = ({
  className,
  tone = "lavender",
  children,
}: GradientCardProps) => (
  <div
    className={cn(
      "hover-lift relative min-w-0 overflow-hidden rounded-3xl p-5 shadow-card",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl",
      "before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_50%)]",
      "before:content-['']",
      "after:pointer-events-none after:absolute after:bottom-[-2rem] after:right-[-2rem]",
      "after:h-36 after:w-36 after:rounded-full after:bg-white/10 after:content-['']",
      toneClass[tone],
      className,
    )}
  >
    <div className="relative z-[1]">{children}</div>
  </div>
);
