"use client";

import { useMemo, useState } from "react";

import { dashboardReferenceNow } from "@/features/recruiter/data/dashboard-data";
import {
  dashboardPeriodLabels,
  type DashboardPeriod,
} from "@/features/recruiter/data/dashboard-date-range";
import {
  getRecruiterDashboardViewModel,
  type RecruiterDashboardViewModel,
} from "@/features/recruiter/data/dashboard-metrics";
import { cn } from "@/shared/lib/cn";

import { InterviewSchedule } from "./interview-schedule";
import { JobPerformanceTable } from "./job-performance-table";
import { KpiGrid } from "./kpi-grid";
import { PackageCard } from "./package-card";
import { PipelineProgress } from "./pipeline-progress";
import { RecruitmentPerformanceChart } from "./recruitment-performance-chart";
import { TaskCard } from "./task-card";
import { TrustScoreCard } from "./trust-score-card";

const dashboardPeriods: DashboardPeriod[] = ["day", "week", "month", "year"];

export function RecruiterDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const dashboard = useMemo<RecruiterDashboardViewModel>(
    () => getRecruiterDashboardViewModel(period, dashboardReferenceNow),
    [period],
  );
  const trustScoreValue = Number(
    dashboard.kpis.find((item) => item.key === "trustScore")?.value.split("/")[0] ?? 0,
  );

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[25px] leading-tight font-extrabold tracking-normal text-slate-950">
            Chào buổi sáng, UpNext Studio
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Dưới đây là tổng quan hoạt động tuyển dụng của bạn hôm nay.
          </p>
        </div>

        <div className="inline-flex w-full max-w-full rounded-xl border border-emerald-100 bg-white p-1 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:w-auto">
          {dashboardPeriods.map((item) => (
            <button
              className={cn(
                "min-w-[84px] rounded-lg px-3 py-2 text-sm font-bold transition",
                item === period
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:text-slate-900",
              )}
              key={item}
              onClick={() => setPeriod(item)}
              type="button"
            >
              {dashboardPeriodLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <KpiGrid cards={dashboard.kpis} />

      <div className="mt-5 grid gap-4 xl:grid-cols-[244px_minmax(0,1fr)_340px]">
        <TaskCard items={dashboard.tasks} />
        <div className="min-w-0">
          <RecruitmentPerformanceChart
            points={dashboard.chart.points}
            title={dashboard.chart.title}
            totalInterviews={dashboard.chart.totalInterviews}
            totalProfiles={dashboard.chart.totalProfiles}
            trendInterviews={dashboard.chart.trendInterviews}
            trendProfiles={dashboard.chart.trendProfiles}
          />
        </div>
        <InterviewSchedule items={dashboard.interviewSchedule} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <JobPerformanceTable />
        <div className="grid gap-4">
          <PipelineProgress stages={dashboard.pipeline.stages} title={dashboard.pipeline.title} />
          <PackageCard />
          <TrustScoreCard score={trustScoreValue} />
        </div>
      </div>
    </div>
  );
}
