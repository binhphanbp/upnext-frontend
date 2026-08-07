"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import type { RecruiterAnalyticsJobRow } from "@/features/recruiter/api/analytics";
import { Badge } from "@/shared/ui/badge";

import { RecruiterTableLayout } from "../recruiter-table-layout";

const STATUS_TONE: Record<string, "success" | "neutral" | "warning" | "error"> = {
  PUBLISHED: "success",
  DRAFT: "neutral",
  CLOSED: "error",
  ARCHIVED: "warning",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatRate(rate: number | null) {
  return rate === null ? "—" : `${rate}%`;
}

export function JobComparisonTable({
  jobs,
  onSelectJob,
}: {
  jobs: readonly RecruiterAnalyticsJobRow[];
  onSelectJob: (jobPostId: string) => void;
}) {
  const t = useTranslations("Recruiter.analytics.jobTable");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const totalItems = jobs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;

  const paginatedJobs = useMemo(
    () => jobs.slice(startIndex, startIndex + pageSize),
    [jobs, startIndex],
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <div>
      <div className="border-border border-b p-5">
        <h3 className="text-foreground text-base font-bold">{t("title")}</h3>
      </div>
      <RecruiterTableLayout
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      >
        <thead className="bg-slate-50/75 text-left text-xs font-bold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-5 py-3" scope="col">
              {t("columns.job")}
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              {t("columns.views")}
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              {t("columns.applications")}
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              {t("columns.viewToApplyRate")}
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              {t("columns.interviewing")}
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              {t("columns.offered")}
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              {t("columns.hired")}
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              {t("columns.applyToHireRate")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {paginatedJobs.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="text-muted-foreground p-8 text-center text-xs font-semibold"
              >
                {t("empty")}
              </td>
            </tr>
          ) : (
            paginatedJobs.map((job) => (
              <tr
                key={job.jobPostId}
                className="cursor-pointer hover:bg-slate-50/50"
                onClick={() => onSelectJob(job.jobPostId)}
              >
                <td className="px-5 py-4">
                  <div className="text-foreground font-bold">{job.title}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge tone={STATUS_TONE[job.status] ?? "neutral"}>{job.status}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(job.publishedAt)}
                    </span>
                  </div>
                </td>
                <td className="text-foreground px-5 py-4 text-right font-semibold">{job.views}</td>
                <td className="text-foreground px-5 py-4 text-right font-semibold">
                  {job.applications}
                </td>
                <td className="text-muted-foreground px-5 py-4 text-right">
                  {formatRate(job.viewToApplyRate)}
                </td>
                <td className="text-foreground px-5 py-4 text-right font-semibold">
                  {job.interviewing}
                </td>
                <td className="text-foreground px-5 py-4 text-right font-semibold">
                  {job.offered}
                </td>
                <td className="text-foreground px-5 py-4 text-right font-semibold">{job.hired}</td>
                <td className="text-muted-foreground px-5 py-4 text-right">
                  {formatRate(job.applyToHireRate)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </RecruiterTableLayout>
    </div>
  );
}
