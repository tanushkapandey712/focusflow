import type { PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

interface DashboardContainerProps extends PropsWithChildren {
  className?: string;
}

export const DashboardContainer = ({ className, children }: DashboardContainerProps) => (
  <div className={cn("mx-auto w-full max-w-6xl space-y-6 sm:space-y-7 lg:space-y-8", className)}>{children}</div>
);
