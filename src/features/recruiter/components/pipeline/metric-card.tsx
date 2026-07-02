import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type MetricCardProps = Readonly<{
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  status?: "success" | "warning" | "info" | "brand" | "danger";
  className?: string;
}>;

export function MetricCard({
  title,
  value,
  description,
  icon,
  status = "info",
  className,
}: MetricCardProps) {
  const statusColors = {
    brand: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    success: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    warning: "text-amber-600 bg-amber-50/50 border-amber-100",
    info: "text-blue-600 bg-blue-50/50 border-blue-100",
    danger: "text-rose-600 bg-rose-50/50 border-rose-100",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border",
              statusColors[status],
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>
      {description && <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>}
    </div>
  );
}
