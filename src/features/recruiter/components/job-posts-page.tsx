"use client";

import { useMemo, useState } from "react";

import { Sparkles } from "@/features/recruiter/data/job-posts-data";
import {
  filterRecruiterJobPosts,
  useJobPostsPageData,
} from "@/features/recruiter/hooks/use-job-posts-page-data";
import { Plus } from "@/features/recruiter/icons";
import { type RecruiterJobPostStatus, type RecruiterJobPostTab } from "@/features/recruiter/types";
import { Link } from "@/i18n/navigation";

import { JobFilters } from "./job-posts/job-filters";
import { JobKpiGrid } from "./job-posts/job-kpi-grid";
import { JobPostsTable } from "./job-posts/job-posts-table";
import { JobStatusTabs } from "./job-posts/job-status-tabs";

export function RecruiterJobPostsPage() {
  const { companyName, error, isLoading, jobPosts, kpis } = useJobPostsPageData();
  const [activeTab, setActiveTab] = useState<RecruiterJobPostTab>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RecruiterJobPostStatus>("ALL");
  const [locationFilter, setLocationFilter] = useState("");
  const [effectivenessFilter, setEffectivenessFilter] = useState<
    "ALL" | "good" | "needsOptimization" | "new" | "ok"
  >("ALL");

  const filteredJobPosts = useMemo(() => {
    return filterRecruiterJobPosts(jobPosts, {
      effectiveness: effectivenessFilter,
      location: locationFilter,
      search,
      status: statusFilter,
      tab: activeTab,
    });
  }, [activeTab, effectivenessFilter, jobPosts, locationFilter, search, statusFilter]);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold text-slate-950">
            Tin tuyển dụng
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Quản lý bài đăng, theo dõi hiệu quả và tối ưu tin tuyển dụng của {companyName}.
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

      {error instanceof Error ? (
        <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error.message}
        </div>
      ) : null}

      <JobKpiGrid items={kpis} />
      <JobStatusTabs activeTab={activeTab} items={jobPosts} onChange={setActiveTab} />
      <div className="mt-4 space-y-5">
        <JobFilters
          effectiveness={effectivenessFilter}
          location={locationFilter}
          onClear={() => {
            setSearch("");
            setStatusFilter("ALL");
            setLocationFilter("");
            setEffectivenessFilter("ALL");
            setActiveTab("all");
          }}
          onEffectivenessChange={setEffectivenessFilter}
          onLocationChange={setLocationFilter}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
          search={search}
          status={statusFilter}
        />
        <JobPostsTable
          isLoading={isLoading}
          items={filteredJobPosts}
          totalItems={jobPosts.length}
        />
      </div>
    </div>
  );
}
