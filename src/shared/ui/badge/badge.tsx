import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        brand: "bg-brand-muted text-emerald-800",
        premium: "bg-premium-muted text-indigo-700",
        success: "bg-success-muted text-emerald-700",
        warning: "bg-warning-muted text-amber-700",
        info: "bg-info-muted text-blue-700",
        neutral: "bg-slate-100 text-slate-700",
        error: "bg-error-muted text-error",
      },
    },
    defaultVariants: {
      tone: "brand",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
