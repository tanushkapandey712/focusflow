import type { PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

interface SectionContainerProps extends PropsWithChildren {
  title?: string;
  description?: string;
  className?: string;
}

export const SectionContainer = ({
  title,
  description,
  className,
  children,
}: SectionContainerProps) => (
  <section className={cn("space-y-5 sm:space-y-6", className)}>
    {title ? (
      <div className="page-intro">
        <h2 className="page-title">{title}</h2>
        {description ? (
          <p className="page-copy">{description}</p>
        ) : null}
      </div>
    ) : null}
    {children}
  </section>
);
