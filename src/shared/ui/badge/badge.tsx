import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type BadgeTone = "brand" | "premium" | "success" | "warning" | "info" | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, string> = {
  brand: "bg-brand-muted text-emerald-800",
  premium: "bg-premium-muted text-indigo-700",
  success: "bg-success-muted text-emerald-700",
  warning: "bg-warning-muted text-amber-700",
  info: "bg-info-muted text-blue-700",
  neutral: "bg-slate-100 text-slate-700",
};

export function Badge({ className, tone = "brand", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
