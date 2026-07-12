import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { Breadcrumb, type BreadcrumbItem } from "@/shared/ui/breadcrumb";

type CandidatePageHeaderProps = Readonly<{
  action?: ReactNode;
  actionClassName?: string;
  breadcrumbItems: BreadcrumbItem[];
  description: string;
  descriptionClassName?: string;
  title: string;
}>;

export function CandidatePageHeader({
  action,
  actionClassName,
  breadcrumbItems,
  description,
  descriptionClassName,
  title,
}: CandidatePageHeaderProps) {
  return (
    <header className="border-b border-slate-200 pb-5 sm:pb-6">
      <Breadcrumb className="mb-4" items={breadcrumbItems} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-balance text-slate-950 sm:text-[2.1rem]">
            {title}
          </h1>
          <p
            className={cn(
              "mt-2 max-w-2xl text-sm leading-6 text-pretty text-slate-600",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        </div>
        {action ? (
          <div className={`shrink-0 sm:pb-0.5 ${actionClassName ?? ""}`}>{action}</div>
        ) : null}
      </div>
    </header>
  );
}
