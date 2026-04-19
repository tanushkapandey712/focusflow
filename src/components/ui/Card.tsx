import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export const Card = ({ className, children, ...props }: CardProps) => (
  <div className={cn("soft-surface hover-lift relative min-w-0 overflow-hidden p-5", className)} {...props}>
    {children}
  </div>
);
