import { ArrowUpRight } from "lucide-react";
import { Card, type CardTone } from "./Card";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  detail?: string;
  compact?: boolean;
  tone?: CardTone;
  icon?: React.ReactNode;
}

export const StatCard = ({ label, value, trend, detail, compact = false, tone = "white", icon }: StatCardProps) => (
  <Card
    tone={tone}
    className={compact ? "flex h-full flex-col justify-between gap-3 p-5" : "flex h-full flex-col gap-4 p-6"}
  >
    <div className="flex items-center justify-between gap-3">
      <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
        tone === "white" || tone === "cream"
          ? "text-slate-500 dark:text-slate-400"
          : "text-white/70"
      }`}>
        {label}
      </p>
      {icon ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/20">
          {icon}
        </div>
      ) : (
        <span className={`h-2.5 w-2.5 rounded-full ${
          tone === "coral" ? "bg-white/60" :
          tone === "teal"  ? "bg-white/60" :
          tone === "lavender" ? "bg-white/60" :
          "bg-coral/70"
        } shadow-soft`} />
      )}
    </div>

    <p className={`${compact ? "text-3xl" : "text-4xl"} font-extrabold tracking-tight tabular-nums ${
      tone === "white" || tone === "cream" || tone === "peach"
        ? "text-navy dark:text-slate-100"
        : "text-white"
    }`}>
      {value}
    </p>

    {trend ? (
      <p className={`inline-flex items-center gap-1 text-xs font-bold ${
        tone === "white" || tone === "cream" ? "text-teal-500" : "text-white/80"
      }`}>
        <ArrowUpRight size={14} />
        {trend}
      </p>
    ) : detail ? (
      <p className={`text-xs font-medium leading-5 ${
        tone === "white" || tone === "cream" ? "text-slate-500 dark:text-slate-400" : "text-white/70"
      }`}>
        {detail}
      </p>
    ) : null}
  </Card>
);
