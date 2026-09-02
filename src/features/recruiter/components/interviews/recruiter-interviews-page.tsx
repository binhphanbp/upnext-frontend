"use client";

import { Clock, Funnel, Plus, X } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { InterviewStatus, InterviewType } from "@/features/recruiter/api/interviews";
import { RecruiterTableLayout } from "@/features/recruiter/components/recruiter-table-layout";
import { useRecruiterInterviews } from "@/features/recruiter/hooks/use-recruiter-interviews";
import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { getRecruiterSession } from "@/features/recruiter/session";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import { InterviewResultBadge, InterviewStatusBadge, InterviewTypeBadge } from "./interview-badges";
import { ScheduleInterviewDialog } from "./schedule-interview-dialog";
import { SearchInput } from "./search-input";
import { SelectFilter, type SelectFilterOption } from "./select-filter";

export function RecruiterInterviewsPage() {
  const t = useTranslations("Recruiter");
  const locale = useLocale();

  const [token, setToken] = useState<string | null>(null);
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [jobFilter, setJobFilter] = useState("ALL");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const [nextRoundSeed, setNextRoundSeed] = useState<{
    applicationId: string;
    interviewRound: number;
  } | null>(null);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (typeFilter !== "ALL") count++;
    if (jobFilter !== "ALL") count++;
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

  const jobFilterOptions: SelectFilterOption[] = useMemo(
    () => [
      { value: "ALL", label: t("candidates.filters.allJobs") },
      ...jobs.map((job) => ({ value: job.id, label: job.title })),
    ],
    [jobs, t],
  );

  const statusOptions: SelectFilterOption[] = [
    { label: t("interviews.filters.allStatus"), value: "ALL" },
    { label: t("interviews.status.SCHEDULED"), value: "SCHEDULED" },
    { label: t("interviews.status.RESCHEDULED"), value: "RESCHEDULED" },
    { label: t("interviews.status.COMPLETED"), value: "COMPLETED" },
    { label: t("interviews.status.CANCELLED"), value: "CANCELLED" },
    { label: t("interviews.status.NO_SHOW"), value: "NO_SHOW" },
  ];

  const typeOptions: SelectFilterOption[] = [
    { label: t("interviews.filters.allTypes"), value: "ALL" },
    { label: t("interviews.type.ONLINE"), value: "ONLINE" },
    { label: t("interviews.type.ONSITE"), value: "ONSITE" },
  ];

  const filteredInterviews = useMemo(() => {
    const list = interviews ?? [];
    const query = search.trim().toLowerCase();

    return list.filter((interview) => {
      if (statusFilter !== "ALL" && interview.status !== (statusFilter as InterviewStatus)) {
        return false;
      }
      if (typeFilter !== "ALL" && interview.type !== (typeFilter as InterviewType)) {
        return false;
      }
      if (jobFilter !== "ALL" && interview.application?.jobPost.id !== jobFilter) {
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

  // Reset to page 1 when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter, jobFilter]);

  const paginatedInterviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInterviews.slice(start, start + pageSize);
  }, [filteredInterviews, currentPage, pageSize]);

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
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    jobFilter !== "ALL";

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setJobFilter("ALL");
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
              <SelectFilter
                ariaLabel={t("candidates.filters.jobAria")}
                value={jobFilter}
                onChange={setJobFilter}
                options={jobFilterOptions}
                placeholder={t("candidates.filters.allJobs")}
                className="w-56"
                showSearch
                triggerClassName={cn(
                  "rounded-full",
                  jobFilter !== "ALL" &&
                    "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                )}
              />

              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-48"
                triggerClassName={cn(
                  "rounded-full",
                  statusFilter !== "ALL" &&
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
                  typeFilter !== "ALL" &&
                    "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                )}
              />

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border-slate-200 px-4 text-xs font-semibold text-slate-600 shadow-none hover:bg-slate-50"
                >
                  <X size={14} aria-hidden="true" />
                  <span>{locale === "vi" ? "Đặt lại" : "Reset"}</span>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Collapsible Mobile-only filters panel */}
          {showFiltersMobile && (
            <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-3 border-t border-slate-100 pt-3 duration-200 sm:hidden">
              <SelectFilter
                ariaLabel={t("candidates.filters.jobAria")}
                value={jobFilter}
                onChange={setJobFilter}
                options={jobFilterOptions}
                placeholder={t("candidates.filters.allJobs")}
                className="w-full"
                showSearch
                triggerClassName={cn(
                  "rounded-full",
                  jobFilter !== "ALL" &&
                    "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                )}
              />

              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-full"
                triggerClassName={cn(
                  "rounded-full",
                  statusFilter !== "ALL" &&
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
                  typeFilter !== "ALL" &&
                    "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50/10",
                )}
              />

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border-slate-200 px-4 text-xs font-semibold text-slate-600 shadow-none hover:bg-slate-50"
                >
                  <X size={14} aria-hidden="true" />
                  <span>{locale === "vi" ? "Đặt lại" : "Reset"}</span>
                </Button>
              ) : null}
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
          totalItems={filteredInterviews.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          emptyState={
            filteredInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center">
                <Image
                  src="/assets/recruiter/icon/icon_cv.png"
                  alt="Empty"
                  width={200}
                  height={150}
                  unoptimized
                  className="mx-auto h-auto w-[200px] max-w-full object-contain select-none"
                />
                <span className="mt-2 text-sm font-medium text-slate-600">
                  {(interviews ?? []).length === 0
                    ? locale === "vi"
                      ? "Hiện tại chưa có lịch phỏng vấn nào"
                      : "No interviews scheduled yet"
                    : locale === "vi"
                      ? "Không tìm thấy lịch phỏng vấn phù hợp"
                      : "No matching interviews found"}
                </span>
              </div>
            ) : null
          }
          actionBar={
            <Button
              onClick={() => setScheduleDialogOpen(true)}
              className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-none bg-emerald-600 px-4 text-xs font-semibold text-white shadow-none hover:bg-emerald-700"
            >
              <Plus size={16} weight="bold" />
              <span>{t("interviews.scheduleBtn")}</span>
            </Button>
          }
        >
          <thead>
            <tr className="border-b border-slate-300 bg-slate-200">
              <th
                className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0"
                scope="col"
              >
                {t("interviews.table.candidate")}
              </th>
              <th
                className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0"
                scope="col"
              >
                {t("interviews.table.job")}
              </th>
              <th
                className="w-16 border-r border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-900 last:border-r-0"
                scope="col"
              >
                {t("interviews.table.round")}
              </th>
              <th
                className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0"
                scope="col"
              >
                {t("interviews.table.type")}
              </th>
              <th
                className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0"
                scope="col"
              >
                {t("interviews.table.schedule")}
              </th>
              <th
                className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0"
                scope="col"
              >
                {t("interviews.table.status")}
              </th>
              <th
                className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0"
                scope="col"
              >
                {t("interviews.table.result")}
              </th>
              <th
                className="border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0"
                scope="col"
              >
                {t("interviews.table.interviewer")}
              </th>
              <th
                className="w-24 px-4 py-3 text-right text-xs font-bold text-slate-900"
                scope="col"
              >
                {t("interviews.table.actions")}
              </th>
            </tr>
          </thead>
          {filteredInterviews.length > 0 ? (
            <tbody className="divide-y divide-slate-100">
              {paginatedInterviews.map((interview) => (
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
                    <Link
                      href={`/recruiter/interviews/${interview.id}`}
                      className="cursor-pointer text-xs font-bold text-[#5d87ff] hover:underline"
                    >
                      {t("interviews.actions.viewDetail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : null}
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
        onScheduled={() => {
          setCurrentPage(1);
          setSearch("");
          setStatusFilter("ALL");
          setTypeFilter("ALL");
          setJobFilter("ALL");
          void refetch();
        }}
      />
    </div>
  );
}
