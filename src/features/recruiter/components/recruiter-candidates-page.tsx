"use client";

import {
  ArrowsCounterClockwise,
  CaretDown,
  Check,
  CircleNotch,
  DotsThree,
  DownloadSimple,
  Eye,
  FileArrowDown,
  MagnifyingGlass,
  Users,
  X,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  getCompanyApplications,
  updateApplicationStatus,
  type Application,
} from "@/features/recruiter/api/team";
import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { toDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { FormInput } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select";

import { RecruiterTableLayout } from "./recruiter-table-layout";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

const STATUS_OPTIONS = [
  "SUBMITTED",
  "VIEWED",
  "SHORTLISTED",
  "INTERVIEWING",
  "OFFERED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
] as const;

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-sky-50 text-sky-700 hover:bg-sky-100/70 border border-sky-200/50";
    case "VIEWED":
      return "bg-blue-50 text-blue-700 hover:bg-blue-100/70 border border-blue-200/50";
    case "SHORTLISTED":
      return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100/70 border border-indigo-200/50";
    case "INTERVIEWING":
      return "bg-purple-50 text-purple-700 hover:bg-purple-100/70 border border-purple-200/50";
    case "OFFERED":
      return "bg-amber-50 text-amber-700 hover:bg-amber-100/70 border border-amber-200/50";
    case "HIRED":
      return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 border border-emerald-200/50";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 hover:bg-rose-100/70 border border-rose-200/50";
    case "WITHDRAWN":
      return "bg-slate-50 text-slate-700 hover:bg-slate-100/70 border border-slate-200/50 opacity-60";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200";
  }
}

function getStatusDotClass(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-sky-500";
    case "VIEWED":
      return "bg-blue-500";
    case "SHORTLISTED":
      return "bg-indigo-500";
    case "INTERVIEWING":
      return "bg-purple-500";
    case "OFFERED":
      return "bg-amber-500";
    case "HIRED":
      return "bg-emerald-500";
    case "REJECTED":
      return "bg-rose-500";
    case "WITHDRAWN":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
  }
}

export function RecruiterCandidatesPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");
  const locale = useLocale() as Locale;

  const searchParams = useSearchParams();
  const presetJobPostId = searchParams?.get("jobPostId") ?? "";

  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [jobPostId, setJobPostId] = useState(presetJobPostId);
  const [status, setStatus] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Quick View CV State
  const [quickViewUrl, setQuickViewUrl] = useState<string | null>(null);
  const [quickViewTitle, setQuickViewTitle] = useState<string>("");

  // Searchable Job Dropdown States
  const [jobSearch, setJobSearch] = useState("");
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);

  const loadCandidates = useCallback(
    async (nextAccountId: string, accessToken: string, isInitial = false) => {
      try {
        if (isInitial) {
          setInitialLoading(true);
        } else {
          setLoading(true);
        }
        await getRecruiterAccount(nextAccountId, accessToken);

        const queryParams: { jobPostId?: string; status?: string; search?: string } = {};
        if (jobPostId) queryParams.jobPostId = jobPostId;
        if (status) queryParams.status = status;
        if (search.trim()) queryParams.search = search.trim();

        const [applicantsData, jobPostsData] = await Promise.all([
          getCompanyApplications(accessToken, queryParams),
          getRecruiterJobPosts(accessToken, nextAccountId),
        ]);

        setCandidates(applicantsData);
        setJobs(jobPostsData);
      } catch (error) {
        handleAuthError(error, router, locale);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    },
    [jobPostId, status, search, router, locale],
  );

  const handleRefresh = useCallback(async () => {
    const session = getRecruiterSession();
    if (session) {
      await loadCandidates(session.user.id, session.accessToken);
    }
  }, [loadCandidates]);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    const session = getRecruiterSession();

    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setToken(session.accessToken);
    const isFirstTime = isFirstLoad.current;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
    void loadCandidates(session.user.id, session.accessToken, isFirstTime);
  }, [loadCandidates, router]);

  const totalItems = candidates.length;

  // Reset to page 1 if the candidates list changes (due to filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [search, jobPostId, status]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCandidates = candidates.slice(startIndex, startIndex + pageSize);

  const isAllPageSelected =
    paginatedCandidates.length > 0 &&
    paginatedCandidates.every((app) => selectedIds.includes(app.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedCandidates.map((app) => app.id);
      setSelectedIds((prev) => {
        const next = [...prev];
        pageIds.forEach((id) => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    } else {
      const pageIds = paginatedCandidates.map((app) => app.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const formatAppDateTime = (value: Date | number | string) => {
    try {
      return format(toDate(value), "dd/MM/yyyy HH:mm");
    } catch {
      return "—";
    }
  };

  async function handleStatusChange(applicationId: string, nextStatus: string) {
    try {
      setSaving(true);
      await updateApplicationStatus(applicationId, nextStatus, token);
      void toast.fire({ icon: "success", title: t("candidates.messages.statusUpdateSuccess") });
      // Reload candidates list
      const queryParams: { jobPostId?: string; status?: string; search?: string } = {};
      if (jobPostId) queryParams.jobPostId = jobPostId;
      if (status) queryParams.status = status;
      if (search.trim()) queryParams.search = search.trim();

      const applicantsData = await getCompanyApplications(token, queryParams);
      setCandidates(applicantsData);
    } catch (error) {
      showActionError(error, t);
    } finally {
      setSaving(false);
    }
  }

  const handleExportExcel = () => {
    const candidatesToExport =
      selectedIds.length > 0 ? candidates.filter((c) => selectedIds.includes(c.id)) : candidates;

    if (candidatesToExport.length === 0) {
      void toast.fire({
        icon: "warning",
        title: locale === "vi" ? "Không có dữ liệu để xuất!" : "No data to export!",
      });
      return;
    }

    const headers =
      locale === "vi"
        ? ["Họ và tên", "Tin tuyển dụng", "Ngày nộp", "Tên file CV", "Trạng thái"]
        : ["Full Name", "Job Post", "Submitted At", "CV Filename", "Status"];

    const rows = candidatesToExport.map((app) => {
      const name =
        app.candidateProfile.account.fullName ?? (locale === "vi" ? "Ẩn danh" : "Anonymous");
      const jobTitle = app.jobPost.title;
      const submittedAt = formatAppDateTime(app.submittedAt);
      const cvName = app.cvVersion?.fileName ?? "—";
      const statusText = t(`candidates.status.${app.status}` as any);

      return [name, jobTitle, submittedAt, cvName, statusText].map((val) => {
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `UpNext_Candidates_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    void toast.fire({
      icon: "success",
      title: locale === "vi" ? "Xuất dữ liệu thành công!" : "Data exported successfully!",
    });
  };

  function handleClearFilters() {
    setSearch("");
    setJobPostId("");
    setStatus("");
  }

  if (initialLoading) {
    return (
      <div className="flex h-80 items-center justify-center text-sm font-bold text-slate-500">
        <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
        {t("shell.loading")}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{t("candidates.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("candidates.subtitle")}</p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50/60 px-4 py-2 text-sm font-bold text-teal-800">
            <Users size={16} className="text-teal-600" />
            {candidates.length} {t("nav.candidates").toLowerCase()}
          </span>
        </div>
      </header>

      <RecruiterTableLayout
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        filterBar={
          <>
            {/* Search Input */}
            <div className="w-full min-w-[280px] sm:max-w-sm sm:flex-1">
              <FormInput
                id="candidate-search"
                placeholder={t("candidates.filters.searchPlaceholder")}
                suffix={<MagnifyingGlass className="text-slate-400" size={18} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Job Post Select */}
            <div className="w-full min-w-[280px] sm:max-w-sm sm:flex-1">
              <DropdownMenu open={jobDropdownOpen} onOpenChange={setJobDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    role="combobox"
                    aria-expanded={jobDropdownOpen}
                    className="upnext-focus border-input flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50/50 focus:outline-none"
                  >
                    <span className="truncate">
                      {jobs.find((j) => j.id === jobPostId)?.title ??
                        t("candidates.filters.allJobs")}
                    </span>
                    <CaretDown size={16} className="ml-2 shrink-0 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="z-50 flex max-h-80 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                  style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                >
                  {/* Search Input Box */}
                  <div className="relative flex items-center px-1 py-1">
                    <MagnifyingGlass size={16} className="absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={locale === "vi" ? "Tìm tin tuyển dụng..." : "Search jobs..."}
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="focus:border-primary h-9 w-full rounded-lg border border-slate-200 pr-3 pl-9 text-xs font-semibold placeholder:text-slate-400 focus:outline-none"
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

                  {/* Scrollable list of jobs */}
                  <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto pr-0.5">
                    <button
                      onClick={() => {
                        setJobPostId("");
                        setJobSearch("");
                        setJobDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors hover:bg-slate-50 flex items-center justify-between cursor-pointer",
                        jobPostId === ""
                          ? "text-primary bg-primary/10 font-bold"
                          : "text-slate-700",
                      )}
                    >
                      <span>{t("candidates.filters.allJobs")}</span>
                      {jobPostId === "" && <Check size={14} className="text-primary font-bold" />}
                    </button>
                    {jobs
                      .filter((job) => job.title.toLowerCase().includes(jobSearch.toLowerCase()))
                      .map((job) => (
                        <button
                          key={job.id}
                          onClick={() => {
                            setJobPostId(job.id);
                            setJobSearch("");
                            setJobDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors hover:bg-slate-50 flex items-center justify-between cursor-pointer",
                            jobPostId === job.id
                              ? "text-primary bg-primary/10 font-bold"
                              : "text-slate-700",
                          )}
                        >
                          <span className="truncate pr-2">{job.title}</span>
                          {jobPostId === job.id && (
                            <Check size={14} className="text-primary font-bold" />
                          )}
                        </button>
                      ))}
                    {jobs.filter((job) => job.title.toLowerCase().includes(jobSearch.toLowerCase()))
                      .length === 0 && (
                      <div className="py-6 text-center text-xs font-medium text-slate-400">
                        {locale === "vi" ? "Không tìm thấy tin tuyển dụng nào." : "No jobs found."}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Clear Filters Button */}
            {(search || jobPostId || status) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-11 gap-1.5 text-slate-500 hover:text-slate-900"
                onClick={handleClearFilters}
              >
                <X size={16} />
                {t("candidates.filters.clear")}
              </Button>
            )}
          </>
        }
        actionBar={
          <>
            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              className="flex h-10 w-10 items-center justify-center rounded-full border-slate-200 p-0 text-slate-600 shadow-none transition-all hover:bg-slate-50 hover:text-slate-800"
              onClick={handleRefresh}
              aria-label="Refresh list"
            >
              <ArrowsCounterClockwise size={18} />
            </Button>
            {/* Status Dropdown Triggered by ... Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-slate-200 p-0 text-slate-600 shadow-none transition-all hover:bg-slate-50 hover:text-slate-800 focus:ring-0 focus:ring-offset-0"
                  aria-label="Filter status dropdown"
                >
                  <DotsThree size={24} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-50 w-[200px] rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl"
              >
                <DropdownMenuItem
                  onClick={() => setStatus("")}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors hover:bg-slate-50",
                    status === "" ? "text-primary bg-slate-50/80 font-bold" : "text-slate-700",
                  )}
                >
                  <span className="size-2 shrink-0 rounded-full bg-slate-400" />
                  <span>{t("candidates.filters.allStatuses")}</span>
                </DropdownMenuItem>
                {STATUS_OPTIONS.map((st) => (
                  <DropdownMenuItem
                    key={st}
                    onClick={() => setStatus(st)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors hover:bg-slate-50",
                      status === st ? "text-primary bg-primary/10 font-bold" : "text-slate-700",
                    )}
                  >
                    <span className={cn("size-2 rounded-full shrink-0", getStatusDotClass(st))} />
                    <span>{t(`candidates.status.${st}` as any)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Export Excel Button */}
            <Button
              variant="outline"
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border-emerald-600 px-4 font-bold text-emerald-600 shadow-none transition-all hover:bg-emerald-50/50"
              onClick={handleExportExcel}
            >
              <DownloadSimple size={18} />
              <span>{locale === "vi" ? "Xuất Excel" : "Export Excel"}</span>
            </Button>
          </>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 bg-slate-200">
            <th className="w-12 border-r border-slate-300 px-4 py-3 text-center last:border-r-0">
              <input
                type="checkbox"
                checked={isAllPageSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="text-primary accent-primary focus:ring-primary size-4 cursor-pointer rounded border border-slate-300 focus:ring-offset-0"
                aria-label="Select all candidates on this page"
              />
            </th>
            <th className="w-[220px] min-w-[200px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("candidates.table.candidate")}
            </th>
            <th className="min-w-[320px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("candidates.table.jobPost")}
            </th>
            <th className="w-[170px] min-w-[170px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("candidates.table.submittedAt")}
            </th>
            <th className="w-[180px] min-w-[180px] border-r border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-900 last:border-r-0">
              {t("candidates.table.cv")}
            </th>
            <th className="w-[155px] min-w-[155px] px-4 py-3 text-left text-xs font-bold text-slate-900">
              {t("candidates.table.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 !py-12 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <Image
                    src="/assets/icons/empty-state.png"
                    alt="Empty"
                    width={120}
                    height={120}
                    priority
                    style={{ height: "auto", width: "auto" }}
                    className="opacity-90"
                  />
                  <span className="font-medium text-slate-500">{t("candidates.table.empty")}</span>
                </div>
              </td>
            </tr>
          ) : (
            paginatedCandidates.map((app) => {
              const name =
                app.candidateProfile.account.fullName ??
                (locale === "vi" ? "Ẩn danh" : "Anonymous");

              return (
                <tr
                  key={app.id}
                  className={cn(
                    "border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30",
                    selectedIds.includes(app.id) && "bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <td className="w-12 border-r border-slate-100/50 px-4 py-2.5 text-center last:border-r-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app.id)}
                      onChange={(e) => handleSelectOne(app.id, e.target.checked)}
                      className="text-primary accent-primary focus:ring-primary size-4 cursor-pointer rounded border border-slate-300 focus:ring-offset-0"
                      aria-label={`Select candidate ${name}`}
                    />
                  </td>
                  <td className="w-[220px] min-w-[200px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                    <span className="text-sm font-semibold text-slate-800">{name}</span>
                  </td>
                  <td className="min-w-[320px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-800 last:border-r-0">
                    {app.jobPost.title}
                  </td>
                  <td className="w-[170px] min-w-[170px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-600 last:border-r-0">
                    {formatAppDateTime(app.submittedAt)}
                  </td>
                  <td className="w-[180px] min-w-[180px] border-r border-slate-100/50 px-4 py-2.5 text-center text-sm last:border-r-0">
                    {app.cvVersion ? (
                      <div className="flex items-center justify-center gap-3">
                        <a
                          href={app.cvVersion.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          <FileArrowDown size={18} />
                          <span className="max-w-[160px] truncate">{app.cvVersion.fileName}</span>
                        </a>
                        <button
                          onClick={() => {
                            setQuickViewUrl(app.cvVersion!.fileUrl);
                            setQuickViewTitle(name);
                          }}
                          className="text-primary inline-flex cursor-pointer items-center justify-center border-l border-slate-200 pl-3 transition-colors hover:text-emerald-700"
                          title={locale === "vi" ? "Xem nhanh CV" : "Quick View CV"}
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="w-[155px] min-w-[155px] px-4 py-2.5">
                    <Select
                      value={app.status}
                      disabled={saving || app.status === "WITHDRAWN"}
                      onValueChange={(nextStatus) => handleStatusChange(app.id, nextStatus)}
                    >
                      <SelectTrigger
                        aria-label="Application Status Update"
                        className={cn(
                          "h-7 text-xs font-semibold px-2.5 border shadow-none focus:ring-0 w-fit rounded-full flex items-center justify-start gap-1 cursor-pointer transition-colors",
                          getStatusBadgeClass(app.status),
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0 mr-1",
                            getStatusDotClass(app.status),
                          )}
                        />
                        <span className="mr-1">{t(`candidates.status.${app.status}` as any)}</span>
                      </SelectTrigger>
                      <SelectContent align="end">
                        {STATUS_OPTIONS.map((st) => (
                          <SelectItem key={st} value={st} disabled={st === "WITHDRAWN"}>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "size-1.5 rounded-full shrink-0",
                                  getStatusDotClass(st),
                                )}
                              />
                              <span>{t(`candidates.status.${st}` as any)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </RecruiterTableLayout>

      {/* CV Quick View Dialog Popup */}
      <Dialog open={!!quickViewUrl} onOpenChange={(open) => !open && setQuickViewUrl(null)}>
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl">
          <DialogHeader className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <DialogTitle className="truncate pr-10 text-base font-extrabold text-slate-900">
              {locale === "vi"
                ? `Xem nhanh CV: ${quickViewTitle}`
                : `Resume Preview: ${quickViewTitle}`}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full flex-1 bg-slate-100">
            {quickViewUrl && (
              <iframe
                src={`${quickViewUrl}#toolbar=0&navpanes=0`}
                className="h-full w-full border-none"
                title="CV Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function showActionError(error: unknown, t: any) {
  void Swal.fire({
    icon: "error",
    title: t("team.messages.errorTitle"),
    text: getTeamErrorMessage(error, t),
  });
}

function getTeamErrorMessage(error: unknown, t: any) {
  if (error instanceof ApiError) {
    const payload = error.payload as any;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.message)) {
        return payload.message.join(", ");
      }
      if (typeof payload.message === "string") {
        return payload.message;
      }
    }
    if (error.message && !error.message.startsWith("Request failed with status")) {
      return error.message;
    }

    if (error.status === 400) return t("onboarding.companyProfile.errors.badData");
    if (error.status === 401) return t("onboarding.companyProfile.errors.sessionExpired");
    if (error.status === 403) return t("onboarding.companyProfile.errors.forbidden");
    if (error.status === 404) return t("onboarding.companyProfile.errors.notFound");
    if (error.status === 409) return t("onboarding.companyProfile.errors.unknown");
  }

  return t("onboarding.companyProfile.errors.unknown");
}

function handleAuthError(error: unknown, router: ReturnType<typeof useRouter>, locale: string) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    clearRecruiterSession();
    router.replace("/recruiter/login");
    return;
  }

  void Swal.fire({
    icon: "error",
    title: locale === "vi" ? "Lỗi hệ thống" : "System Error",
    text:
      locale === "vi"
        ? "Hệ thống gặp sự cố. Vui lòng thử lại sau."
        : "System encountered an error. Please try again later.",
  });
}
