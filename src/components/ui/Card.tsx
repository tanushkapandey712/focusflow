import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

export type CardTone = "white" | "coral" | "teal" | "peach" | "lavender" | "navy" | "cream";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  tone?: CardTone;
};

const toneClass: Record<CardTone, string> = {
  white:    "soft-surface hover-lift",
  cream:    "card-cream hover-lift",
  coral:    "card-coral hover-lift",
  teal:     "card-teal hover-lift",
  peach:    "card-peach hover-lift",
  lavender: "card-lavender hover-lift",
  navy:     "card-navy hover-lift",
};

export const Card = ({ className, children, tone = "white", ...props }: CardProps) => (
  <div className={cn("relative min-w-0 overflow-hidden p-5", toneClass[tone], className)} {...props}>
    {children}
  </div>
);
