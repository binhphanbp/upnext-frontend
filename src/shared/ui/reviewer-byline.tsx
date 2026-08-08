import { cn } from "@/shared/lib/cn";
import { getInitials } from "@/shared/lib/name";

type ReviewerBylineProps = {
  fullName: string;
  /** ISO date the review was written. */
  createdAt: string;
  className?: string;
};

/**
 * Identifies who wrote a company review. Reviews are attributed, not anonymous, but the
 * API deliberately returns only the name — there is no candidate avatar to show, so the
 * initials stand in for one.
 */
export function ReviewerByline({ fullName, createdAt, className }: ReviewerBylineProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      >
        {getInitials(fullName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-800">{fullName}</span>
        <span className="block text-xs text-slate-400">
          {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(createdAt))}
        </span>
      </span>
    </div>
  );
}
