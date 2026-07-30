"use client";

import {
  ArrowsClockwise,
  CaretDown,
  Clock,
  Funnel,
  MagnifyingGlass,
  Plus,
  X,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import type { InterviewStatus, InterviewType } from "@/features/recruiter/api/interviews";
import { RecruiterTableLayout } from "@/features/recruiter/components/recruiter-table-layout";
import { useRecruiterInterviews } from "@/features/recruiter/hooks/use-recruiter-interviews";
import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { getRecruiterSession } from "@/features/recruiter/session";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { InterviewResultBadge, InterviewStatusBadge, InterviewTypeBadge } from "./interview-badges";
import { InterviewDetailDialog } from "./interview-detail-dialog";
import { ScheduleInterviewDialog } from "./schedule-interview-dialog";
import { SearchInput } from "./search-input";
import { SelectFilter } from "./select-filter";

export function RecruiterInterviewsPage() {
  const t = useTranslations("Recruiter");
  const locale = useLocale();

  const [token, setToken] = useState<string | null>(null);
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [jobSearch, setJobSearch] = useState("");
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [nextRoundSeed, setNextRoundSeed] = useState<{
    applicationId: string;
    interviewRound: number;
  } | null>(null);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    if (jobFilter !== "all") count++;
    return count;
  }, [statusFilter, typeFilter, jobFilter]);

  useEffect(() => {
    const session = getRecruiterSession();
    if (session) {
      setToken(session.accessToken);
      getRecruiterJobPosts(session.accessToken, session.user.id).then(setJobs).catch(console.error);
    }
  }, []);

  const { data: interviews, isLoading, isError, refetch } = useRecruiterInterviews(token);

  const statusOptions = [
    { label: t("interviews.filters.allStatus"), value: "all" },
    { label: t("interviews.status.SCHEDULED"), value: "SCHEDULED" },
    { label: t("interviews.status.RESCHEDULED"), value: "RESCHEDULED" },
    { label: t("interviews.status.COMPLETED"), value: "COMPLETED" },
    { label: t("interviews.status.CANCELLED"), value: "CANCELLED" },
    { label: t("interviews.status.NO_SHOW"), value: "NO_SHOW" },
  ];

  const typeOptions = [
    { label: t("interviews.filters.allTypes"), value: "all" },
    { label: t("interviews.type.ONLINE"), value: "ONLINE" },
    { label: t("interviews.type.ONSITE"), value: "ONSITE" },
  ];

  const filteredJobsForSelect = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter((job) => job.title.toLowerCase().includes(query));
  }, [jobs, jobSearch]);

  const filteredInterviews = useMemo(() => {
    const list = interviews ?? [];
    const query = search.trim().toLowerCase();

    return list.filter((interview) => {
      if (statusFilter !== "all" && interview.status !== (statusFilter as InterviewStatus)) {
        return false;
      }
      if (typeFilter !== "all" && interview.type !== (typeFilter as InterviewType)) {
        return false;
      }
      if (jobFilter !== "all" && interview.application?.jobPost.id !== jobFilter) {
        return false;
      }
      if (query) {
        const candidateName = interview.application?.candidateProfile.account.fullName ?? "";
        const jobTitle = interview.application?.jobPost.title ?? "";
        const haystack = `${candidateName} ${jobTitle}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [interviews, search, statusFilter, typeFilter, jobFilter]);

  const metrics = useMemo(() => {
    const list = interviews ?? [];
    return {
      total: list.length,
      upcoming: list.filter((i) => i.status === "SCHEDULED" || i.status === "RESCHEDULED").length,
      completed: list.filter((i) => i.status === "COMPLETED").length,
      cancelled: list.filter((i) => i.status === "CANCELLED" || i.status === "NO_SHOW").length,
    };
  }, [interviews]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    jobFilter !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setJobFilter("all");
    setJobSearch("");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] flex-col gap-6 bg-slate-50/10 p-6">
        <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white p-4"></div>
        <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
            ></div>
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white p-5"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center bg-slate-50/10 p-6 text-center">
        <div className="mb-4 flex size-14 animate-bounce items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600">
          <Clock size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          {locale === "vi" ? "Không thể tải dữ liệu phỏng vấn" : "Unable to load interview data"}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          {locale === "vi"
            ? "Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra lại kết nối mạng của bạn."
            : "Something went wrong connecting to the server. Please check your network connection."}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
        >
          {locale === "vi" ? "Thử lại" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 [font-family:var(--font-sans)]">
      {/* Filter Bar — sits directly below the workspace breadcrumb, no duplicate page title */}
      <div className="sticky top-[-16px] z-30 -mx-4 -mt-4 border-t border-b border-slate-200 bg-white px-4 py-4 md:top-[-32px] md:-mx-8 md:-mt-8 md:px-8">
        <div className="flex flex-col gap-3">
          {/* Top filter row: Label (desktop), Search Input (always visible) & Toggle Button (mobile only) */}
          <div className="flex items-center gap-2">
            <span className="hidden shrink-0 text-xs font-bold text-slate-500 md:inline">
              {t("interviews.filters.label")}
            </span>

            <div className="min-w-0 flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("interviews.filters.searchPlaceholder")}
                inputClassName="rounded-full"
              />
            </div>

            {/* Mobile Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className={cn(
                "sm:hidden flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 relative shrink-0",
                (showFiltersMobile || activeFiltersCount > 0) &&
                  "border-emerald-500 text-emerald-600 bg-emerald-50/10",
              )}
            >
              <Funnel
                size={18}
                weight={showFiltersMobile || activeFiltersCount > 0 ? "bold" : "regular"}
              />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Desktop Filters (Hidden on Mobile) */}
            <div className="hidden items-center gap-2 sm:flex">
              <DropdownMenu
                open={jobDropdownOpen}
                onOpenChange={(open) => {
                  setJobDropdownOpen(open);
                  if (!open) setJobSearch("");
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={jobDropdownOpen}
                    className={cn(
                      "flex h-10 w-64 cursor-pointer items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500",
                      jobFilter !== "all" &&
                        "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                    )}
                  >
                    <span className="flex-1 truncate text-left">
                      {jobFilter === "all"
                        ? locale === "vi"
                          ? "Chọn tin tuyển dụng"
                          : "Select Job Post"
                        : (jobs.find((j) => j.id === jobFilter)?.title ??
                          t("candidates.filters.allJobs"))}
                    </span>
                    <CaretDown
                      size={16}
                      className={cn(
                        "ml-2 shrink-0 text-slate-400",
                        jobFilter !== "all" && "text-emerald-600",
                      )}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="z-50 flex max-h-80 w-72 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                >
                  <div className="relative flex items-center px-1 py-1">
                    <MagnifyingGlass size={16} className="absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={locale === "vi" ? "Tìm tin tuyển dụng..." : "Search jobs..."}
                      aria-label={locale === "vi" ? "Tìm tin tuyển dụng" : "Search jobs"}
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="focus:border-primary h-9 w-full rounded-lg border border-slate-200 pr-8 pl-9 text-xs font-semibold placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === " ") e.stopPropagation();
                      }}
                    />
                    {jobSearch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setJobSearch("");
                        }}
                        className="absolute right-3 rounded-full p-0.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <DropdownMenuItem
                      onClick={() => {
                        setJobFilter("all");
                        setJobDropdownOpen(false);
                      }}
                      className={cn(
                        "cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-slate-50",
                        jobFilter === "all" && "text-emerald-600 bg-emerald-50/30",
                      )}
                    >
                      {t("candidates.filters.allJobs")}
                    </DropdownMenuItem>
                    {filteredJobsForSelect.map((job) => (
                      <DropdownMenuItem
                        key={job.id}
                        onClick={() => {
                          setJobFilter(job.id);
                          setJobDropdownOpen(false);
                        }}
                        className={cn(
                          "cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-slate-50",
                          jobFilter === job.id && "text-emerald-600 bg-emerald-50/30",
                        )}
                      >
                        {job.title}
                      </DropdownMenuItem>
                    ))}
                    {filteredJobsForSelect.length === 0 && (
                      <div className="py-4 text-center text-xs font-medium text-slate-400">
                        {locale === "vi" ? "Không tìm thấy tin tuyển dụng" : "No job posts found"}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-48"
                triggerClassName={cn(
                  "rounded-full",
                  statusFilter !== "all" &&
                    "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                )}
              />
              <SelectFilter
                value={typeFilter}
                onChange={setTypeFilter}
                options={typeOptions}
                className="w-48"
                triggerClassName={cn(
                  "rounded-full",
                  typeFilter !== "all" &&
                    "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                )}
              />

              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-slate-200 px-4 text-xs font-semibold text-slate-600 shadow-none hover:bg-slate-50"
              >
                <ArrowsClockwise size={14} />
                {t("interviews.filters.clearFilters")}
              </Button>
            </div>
          </div>

          {/* Collapsible Mobile-only filters panel */}
          {showFiltersMobile && (
            <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-3 border-t border-slate-100 pt-3 duration-200 sm:hidden">
              <DropdownMenu
                open={jobDropdownOpen}
                onOpenChange={(open) => {
                  setJobDropdownOpen(open);
                  if (!open) setJobSearch("");
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={jobDropdownOpen}
                    className={cn(
                      "flex h-10 w-full cursor-pointer items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500",
                      jobFilter !== "all" &&
                        "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                    )}
                  >
                    <span className="flex-1 truncate text-left">
                      {jobFilter === "all"
                        ? locale === "vi"
                          ? "Chọn tin tuyển dụng"
                          : "Select Job Post"
                        : (jobs.find((j) => j.id === jobFilter)?.title ??
                          t("candidates.filters.allJobs"))}
                    </span>
                    <CaretDown
                      size={16}
                      className={cn(
                        "ml-2 shrink-0 text-slate-400",
                        jobFilter !== "all" && "text-emerald-600",
                      )}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="z-50 flex max-h-80 w-72 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                >
                  <div className="relative flex items-center px-1 py-1">
                    <MagnifyingGlass size={16} className="absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={locale === "vi" ? "Tìm tin tuyển dụng..." : "Search jobs..."}
                      aria-label={locale === "vi" ? "Tìm tin tuyển dụng" : "Search jobs"}
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="focus:border-primary h-9 w-full rounded-lg border border-slate-200 pr-8 pl-9 text-xs font-semibold placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === " ") e.stopPropagation();
                      }}
                    />
                    {jobSearch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setJobSearch("");
                        }}
                        className="absolute right-3 rounded-full p-0.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <DropdownMenuItem
                      onClick={() => {
                        setJobFilter("all");
                        setJobDropdownOpen(false);
                      }}
                      className={cn(
                        "cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-slate-50",
                        jobFilter === "all" && "text-emerald-600 bg-emerald-50/30",
                      )}
                    >
                      {t("candidates.filters.allJobs")}
                    </DropdownMenuItem>
                    {filteredJobsForSelect.map((job) => (
                      <DropdownMenuItem
                        key={job.id}
                        onClick={() => {
                          setJobFilter(job.id);
                          setJobDropdownOpen(false);
                        }}
                        className={cn(
                          "cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-slate-50",
                          jobFilter === job.id && "text-emerald-600 bg-emerald-50/30",
                        )}
                      >
                        {job.title}
                      </DropdownMenuItem>
                    ))}
                    {filteredJobsForSelect.length === 0 && (
                      <div className="py-4 text-center text-xs font-medium text-slate-400">
                        {locale === "vi" ? "Không tìm thấy tin tuyển dụng" : "No job posts found"}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-full"
                triggerClassName={cn(
                  "rounded-full",
                  statusFilter !== "all" &&
                    "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                )}
              />
              <SelectFilter
                value={typeFilter}
                onChange={setTypeFilter}
                options={typeOptions}
                className="w-full"
                triggerClassName={cn(
                  "rounded-full",
                  typeFilter !== "all" &&
                    "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                )}
              />

              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-slate-200 px-4 text-xs font-semibold text-slate-600 shadow-none hover:bg-slate-50"
              >
                <ArrowsClockwise size={14} />
                {t("interviews.filters.clearFilters")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total */}
          <div className="upnext-shadow relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
            {/* Background Accent Mesh */}
            <div
              className="pointer-events-none absolute right-0 bottom-0 size-20"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(2, 132, 199, 0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "8px 8px",
                maskImage: "radial-gradient(circle at right bottom, black, transparent 70%)",
                WebkitMaskImage: "radial-gradient(circle at right bottom, black, transparent 70%)",
              }}
            />
            {/* Top Row: Title & Icon */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#0284c7]">
                {t("interviews.metrics.total")}
              </span>
              <img
                src="/assets/recruiter/icon/icon-1.png"
                alt="Total"
                className="size-10 object-contain drop-shadow-[0_2px_8px_rgba(2,132,199,0.12)]"
              />
            </div>
            {/* Middle Row: Value */}
            <div className="relative z-10 mt-1 text-4xl font-black tracking-tight text-slate-800">
              {metrics.total}
            </div>
            {/* Bottom Row: Description */}
            <div className="relative z-10 mt-1 text-[11px] leading-normal text-slate-400">
              {t("interviews.metrics.totalDesc")}
            </div>
          </div>

          {/* Card 2: Upcoming */}
          <div className="upnext-shadow relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
            {/* Background Accent Mesh */}
            <div
              className="pointer-events-none absolute right-0 bottom-0 size-20"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(16, 185, 129, 0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "8px 8px",
                maskImage: "radial-gradient(circle at right bottom, black, transparent 70%)",
                WebkitMaskImage: "radial-gradient(circle at right bottom, black, transparent 70%)",
              }}
            />
            {/* Top Row: Title & Icon */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[14px] font-bold text-emerald-600">
                {t("interviews.metrics.upcoming")}
              </span>
              <img
                src="/assets/recruiter/icon/icon-2.png"
                alt="Upcoming"
                className="size-10 object-contain drop-shadow-[0_2px_8px_rgba(16,185,129,0.12)]"
              />
            </div>
            {/* Middle Row: Value */}
            <div className="relative z-10 mt-1 text-4xl font-black tracking-tight text-emerald-600">
              {metrics.upcoming}
            </div>
            {/* Bottom Row: Description */}
            <div className="relative z-10 mt-1 text-[11px] leading-normal text-slate-400">
              {t("interviews.metrics.upcomingDesc")}
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="upnext-shadow relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
            {/* Background Accent Mesh */}
            <div
              className="pointer-events-none absolute right-0 bottom-0 size-20"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(6, 182, 212, 0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "8px 8px",
                maskImage: "radial-gradient(circle at right bottom, black, transparent 70%)",
                WebkitMaskImage: "radial-gradient(circle at right bottom, black, transparent 70%)",
              }}
            />
            {/* Top Row: Title & Icon */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[14px] font-bold text-cyan-600">
                {t("interviews.metrics.completed")}
              </span>
              <img
                src="/assets/recruiter/icon/icon-4.png"
                alt="Completed"
                className="size-10 object-contain drop-shadow-[0_2px_8px_rgba(6,182,212,0.12)]"
              />
            </div>
            {/* Middle Row: Value */}
            <div className="relative z-10 mt-1 text-4xl font-black tracking-tight text-cyan-600">
              {metrics.completed}
            </div>
            {/* Bottom Row: Description */}
            <div className="relative z-10 mt-1 text-[11px] leading-normal text-slate-400">
              {t("interviews.metrics.completedDesc")}
            </div>
          </div>

          {/* Card 4: Cancelled */}
          <div className="upnext-shadow relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
            {/* Background Accent Mesh */}
            <div
              className="pointer-events-none absolute right-0 bottom-0 size-20"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(239, 68, 68, 0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "8px 8px",
                maskImage: "radial-gradient(circle at right bottom, black, transparent 70%)",
                WebkitMaskImage: "radial-gradient(circle at right bottom, black, transparent 70%)",
              }}
            />
            {/* Top Row: Title & Icon */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[14px] font-bold text-rose-600">
                {t("interviews.metrics.cancelled")}
              </span>
              <img
                src="/assets/recruiter/icon/icon-3.png"
                alt="Cancelled"
                className="size-10 object-contain drop-shadow-[0_2px_8px_rgba(239,68,68,0.12)]"
              />
            </div>
            {/* Middle Row: Value */}
            <div className="relative z-10 mt-1 text-4xl font-black tracking-tight text-rose-600">
              {metrics.cancelled}
            </div>
            {/* Bottom Row: Description */}
            <div className="relative z-10 mt-1 text-[11px] leading-normal text-slate-400">
              {t("interviews.metrics.cancelledDesc")}
            </div>
          </div>
        </div>

        <RecruiterTableLayout
          loading={false}
          actionBar={
            <Button
              onClick={() => setScheduleDialogOpen(true)}
              className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-none bg-emerald-600 px-4 text-xs font-semibold text-white shadow-none hover:bg-emerald-700"
            >
              <Plus size={16} weight="bold" />
              <span>{t("interviews.scheduleBtn")}</span>
            </Button>
          }
        >
          <thead className="bg-slate-50/75 text-left text-xs font-bold tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5" scope="col">
                {t("interviews.table.candidate")}
              </th>
              <th className="px-4 py-2.5" scope="col">
                {t("interviews.table.job")}
              </th>
              <th className="px-4 py-2.5 text-center" scope="col">
                {t("interviews.table.round")}
              </th>
              <th className="px-4 py-2.5" scope="col">
                {t("interviews.table.type")}
              </th>
              <th className="px-4 py-2.5" scope="col">
                {t("interviews.table.schedule")}
              </th>
              <th className="px-4 py-2.5" scope="col">
                {t("interviews.table.status")}
              </th>
              <th className="px-4 py-2.5" scope="col">
                {t("interviews.table.result")}
              </th>
              <th className="px-4 py-2.5" scope="col">
                {t("interviews.table.interviewer")}
              </th>
              <th className="px-4 py-2.5 text-right" scope="col">
                {t("interviews.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInterviews.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm font-medium text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-bold text-slate-800">{t("interviews.emptyState.title")}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("interviews.emptyState.description")}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 cursor-pointer rounded-lg border border-emerald-200/50 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100/70"
                      >
                        {t("interviews.emptyState.clearFilters")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredInterviews.map((interview) => (
                <tr key={interview.id} className="hover:bg-slate-50/50">
                  <td className="max-w-[180px] truncate px-4 py-3 font-bold text-slate-800">
                    {interview.application?.candidateProfile.account.fullName ?? "—"}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">
                    {interview.application?.jobPost.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {interview.interviewRound}
                  </td>
                  <td className="px-4 py-3">
                    <InterviewTypeBadge type={interview.type} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(interview.scheduledStartAt).toLocaleString(
                      locale === "vi" ? "vi-VN" : "en-US",
                      { dateStyle: "short", timeStyle: "short" },
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <InterviewStatusBadge status={interview.status} />
                  </td>
                  <td className="px-4 py-3">
                    <InterviewResultBadge result={interview.result} />
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-slate-600">
                    {interview.recruiterProfile?.fullName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedInterviewId(interview.id)}
                      className="cursor-pointer text-xs font-bold text-[#5d87ff] hover:underline"
                    >
                      {t("interviews.actions.viewDetail")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </RecruiterTableLayout>
      </div>

      <ScheduleInterviewDialog
        token={token}
        jobs={jobs}
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setNextRoundSeed(null);
        }}
        initialValues={nextRoundSeed}
      />

      <InterviewDetailDialog
        interviewId={selectedInterviewId}
        token={token}
        open={Boolean(selectedInterviewId)}
        onOpenChange={(open) => {
          if (!open) setSelectedInterviewId(null);
        }}
        onScheduleNextRound={(applicationId, nextRound) => {
          setNextRoundSeed({ applicationId, interviewRound: nextRound });
          setScheduleDialogOpen(true);
        }}
      />
    </div>
  );
}
