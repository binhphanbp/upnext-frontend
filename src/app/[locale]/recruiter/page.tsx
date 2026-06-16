import { setRequestLocale } from "next-intl/server";

import {
  InterviewSchedule,
  JobPerformanceTable,
  KpiGrid,
  PackageCard,
  PipelineProgress,
  RecruitmentPerformanceChart,
  TaskCard,
  TrustScoreCard,
} from "@/features/recruiter/components";

export const metadata = {
  title: "Dashboard nhà tuyển dụng",
};

type RecruiterDashboardPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterDashboardPage({ params }: RecruiterDashboardPageProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return (
    <div className="w-full">
      <div className="mb-5">
        <h1 className="text-[25px] leading-tight font-extrabold tracking-normal text-slate-950">
          Chào buổi sáng, UpNext Studio 👋
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Dưới đây là tổng quan hoạt động tuyển dụng của bạn hôm nay.
        </p>
      </div>

      <KpiGrid />

      <div className="mt-5 grid gap-4 xl:grid-cols-[244px_minmax(0,340px)_216px_1fr]">
        <TaskCard />
        <RecruitmentPerformanceChart />
        <PipelineProgress />
        <InterviewSchedule />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <JobPerformanceTable />
        <div className="grid gap-4">
          <PackageCard />
          <TrustScoreCard />
        </div>
      </div>
    </div>
  );
}
