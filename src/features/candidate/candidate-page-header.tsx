import type { ReactNode } from "react";

import { Breadcrumb, type BreadcrumbItem } from "@/shared/ui/breadcrumb";

type CandidatePageHeaderProps = Readonly<{
  action?: ReactNode;
  actionClassName?: string;
  breadcrumbItems: BreadcrumbItem[];
  description: string;
  eyebrow?: string;
  title: string;
}>;

export function CandidatePageHeader({
  action,
  actionClassName,
  breadcrumbItems,
  description,
  eyebrow,
  title,
}: CandidatePageHeaderProps) {
  return (
    <header className="border-b border-slate-200 pb-6 sm:pb-7">
      <Breadcrumb className="mb-5" items={breadcrumbItems} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-brand mb-2 text-xs font-bold tracking-[0.13em] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-balance text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-pretty text-slate-600">
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
