"use client";

import { useTranslations } from "next-intl";

import type { RecruiterAnalyticsWindowDays } from "@/features/recruiter/api/analytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const WINDOW_OPTIONS: RecruiterAnalyticsWindowDays[] = [7, 30, 90];
const ALL_JOBS_VALUE = "all";

export function AnalyticsFilters({
  windowDays,
  onWindowDaysChange,
  jobs,
  selectedJobPostId,
  onSelectedJobPostIdChange,
}: {
  windowDays: RecruiterAnalyticsWindowDays;
  onWindowDaysChange: (windowDays: RecruiterAnalyticsWindowDays) => void;
  jobs: ReadonlyArray<{ jobPostId: string; title: string }>;
  selectedJobPostId: string | null;
  onSelectedJobPostIdChange: (jobPostId: string | null) => void;
}) {
  const t = useTranslations("Recruiter.analytics.filters");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={String(windowDays)}
        onValueChange={(value) => onWindowDaysChange(Number(value) as RecruiterAnalyticsWindowDays)}
      >
        <TabsList>
          {WINDOW_OPTIONS.map((option) => (
            <TabsTrigger key={option} value={String(option)}>
              {t(`window${option}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Select
        value={selectedJobPostId ?? ALL_JOBS_VALUE}
        onValueChange={(value) =>
          onSelectedJobPostIdChange(value === ALL_JOBS_VALUE ? null : value)
        }
      >
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder={t("allJobs")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_JOBS_VALUE}>{t("allJobs")}</SelectItem>
          {jobs.map((job) => (
            <SelectItem key={job.jobPostId} value={job.jobPostId}>
              {job.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
