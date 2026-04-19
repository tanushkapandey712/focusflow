import { ArrowUpRight } from "lucide-react";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  compact?: boolean;
}

export const StatCard = ({ label, value, trend, compact = false }: StatCardProps) => (
  <Card className={compact ? "flex h-full flex-col justify-between gap-3 p-4 sm:p-5" : "flex h-full flex-col gap-4"}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
    <p
      className={
        compact
          ? "text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
          : "text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
      }
    >
      {value}
    </p>
    {trend ? (
      <p className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-100">
        <ArrowUpRight size={14} />
        {trend}
      </p>
    ) : null}
  </Card>
);
