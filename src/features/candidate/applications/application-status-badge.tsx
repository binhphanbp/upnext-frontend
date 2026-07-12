"use client";

import { useTranslations } from "next-intl";

import type { CandidateApplicationStatus } from "@/features/candidate/api/profile";
import { getApplicationStatusGroup } from "@/features/candidate/job-activity-model";
import { cn } from "@/shared/lib/cn";

export function ApplicationStatusBadge({
  status,
}: Readonly<{ status: CandidateApplicationStatus }>) {
  const t = useTranslations("CandidateWorkspace");
  const group = getApplicationStatusGroup(status);

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset",
        group === "active" && "bg-blue-50 text-blue-700 ring-blue-200",
        group === "interview" && "bg-amber-50 text-amber-800 ring-amber-200",
        group === "offer" && "bg-emerald-50 text-emerald-800 ring-emerald-200",
        group === "closed" && "bg-slate-100 text-slate-600 ring-slate-200",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          group === "active" && "bg-blue-500",
          group === "interview" && "bg-amber-500",
          group === "offer" && "bg-emerald-500",
          group === "closed" && "bg-slate-400",
        )}
      />
      {t(`applications.status.${status}.label`)}
    </span>
  );
}
