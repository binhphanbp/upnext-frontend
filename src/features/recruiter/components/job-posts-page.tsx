import { Sparkles } from "@/features/recruiter/data/job-posts-data";
import { Plus } from "@/features/recruiter/icons";
import { Link } from "@/i18n/navigation";

import { CurrentPlanCard } from "./job-posts/current-plan-card";
import { JobFilters } from "./job-posts/job-filters";
import { JobKpiGrid } from "./job-posts/job-kpi-grid";
import { JobPostsTable } from "./job-posts/job-posts-table";
import { JobStatusTabs } from "./job-posts/job-status-tabs";
import { PostingPerformanceCard } from "./job-posts/posting-performance-card";
import { RightActionCard } from "./job-posts/right-action-card";

export function RecruiterJobPostsPage() {
  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold text-slate-950">
            Tin tuyển dụng
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Quản lý bài đăng, theo dõi hiệu quả và tối ưu tin tuyển dụng của doanh nghiệp.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <Sparkles aria-hidden className="h-4.5 w-4.5 text-emerald-600" />
            Dùng AI viết tin
          </button>
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
            href="/recruiter/job-posts/create"
          >
            <Plus aria-hidden className="h-5 w-5" />
            Đăng tin mới
          </Link>
        </div>
      </div>

      <JobKpiGrid />
      <JobStatusTabs />
      <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <JobFilters />
          <JobPostsTable />
        </div>
        <aside className="space-y-4">
          <RightActionCard />
          <PostingPerformanceCard />
          <CurrentPlanCard />
        </aside>
      </div>
    </div>
  );
}
