"use client";

import {
  ArrowsCounterClockwise,
  Briefcase,
  CaretDown,
  Check,
  CircleNotch,
  DotsThree,
  DownloadSimple,
  Envelope,
  Eye,
  FileArrowDown,
  GraduationCap,
  MagicWand,
  MagnifyingGlass,
  Phone,
  Printer,
  Sparkle,
  Brain,
  Sliders,
  CheckCircle,
  XCircle,
  Info,
  TrendUp,
  User,
  Users,
  X,
  WarningCircle,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import { authHeaders } from "@/features/recruiter/api/client";
import {
  getApplicationAiScore,
  getApplicationCvUrl,
  type ApplicationAiScoreResponse,
} from "@/features/recruiter/api/cv-screening-api";
import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  getCompanyApplications,
  isRecruiterMissingCompanyError,
  updateApplicationStatus,
  type Application,
} from "@/features/recruiter/api/team";
import { useCvScreening } from "@/features/recruiter/hooks/use-cv-screening";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

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
  const [missingCompany, setMissingCompany] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [jobPostId, setJobPostId] = useState(presetJobPostId);
  const [status, setStatus] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // AI CV Screening Tab States (preserved across tab switches & page navigation)
  const [activeTab, setActiveTab] = useState("candidates");

  const cvScreening = useCvScreening(token);

  // Load from sessionStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("upnext_activeTab");
      if (savedTab) setActiveTab(savedTab);
    }
  }, []);

  // Save changes to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("upnext_activeTab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const firstJob = jobs[0];
    if (firstJob && !cvScreening.selectedJobId) {
      cvScreening.setSelectedJobId(firstJob.id);
    }
  }, [jobs, cvScreening.selectedJobId, cvScreening.setSelectedJobId]);

  // Quick View CV State
  const [quickViewUrl, setQuickViewUrl] = useState<string | null>(null);
  const [quickViewTitle, setQuickViewTitle] = useState<string>("");
  const [quickViewBlobUrl, setQuickViewBlobUrl] = useState<string | null>(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [quickViewError, setQuickViewError] = useState<string | null>(null);

  useEffect(() => {
    if (!quickViewUrl) {
      if (quickViewBlobUrl) {
        URL.revokeObjectURL(quickViewBlobUrl);
        setQuickViewBlobUrl(null);
      }
      setQuickViewError(null);
      return;
    }

    let active = true;
    const fetchCv = async () => {
      setQuickViewLoading(true);
      setQuickViewError(null);
      try {
        const res = await fetch(quickViewUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        if (active) {
          const blobUrl = URL.createObjectURL(blob);
          setQuickViewBlobUrl(blobUrl);
        }
      } catch (err: any) {
        console.error("Quick view PDF load error:", err);
        if (active) {
          setQuickViewError(err.message || "Failed to load");
        }
      } finally {
        if (active) {
          setQuickViewLoading(false);
        }
      }
    };

    void fetchCv();

    return () => {
      active = false;
    };
  }, [quickViewUrl]);

  const handleDownloadCv = useCallback(async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = localUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error("Failed to download CV:", error);
      window.open(fileUrl, "_blank");
    }
  }, []);

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

        const jobPostsPromise = getRecruiterJobPosts(accessToken, nextAccountId);
        const applicationsPromise = getCompanyApplications(accessToken, queryParams);

        const [applicantsResult, jobPostsData] = await Promise.allSettled([
          applicationsPromise,
          jobPostsPromise,
        ] as const);

        if (jobPostsData.status === "fulfilled") {
          setJobs(jobPostsData.value);
        }

        if (applicantsResult.status === "fulfilled") {
          setMissingCompany(false);
          setCandidates(applicantsResult.value);
          return;
        }

        if (isRecruiterMissingCompanyError(applicantsResult.reason)) {
          setMissingCompany(true);
          setCandidates([]);
          return;
        }

        throw applicantsResult.reason;
      } catch (error) {
        if (isRecruiterMissingCompanyError(error)) {
          setMissingCompany(true);
          setCandidates([]);
          return;
        }

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
      setMissingCompany(false);
      setCandidates(applicantsData);
    } catch (error) {
      if (isRecruiterMissingCompanyError(error)) {
        setMissingCompany(true);
        setCandidates([]);
        return;
      }
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
      {/* <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </header> */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 flex h-auto w-full justify-start gap-3 rounded-none border-none bg-transparent p-0">
          <TabsTrigger
            value="candidates"
            className="cursor-pointer rounded-full bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700 shadow-none transition-all hover:bg-slate-200/80 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            {locale === "vi" ? "Danh sách ứng tuyển" : "Applications"}
          </TabsTrigger>
          <TabsTrigger
            value="cv-ranking"
            className="cursor-pointer rounded-full bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700 shadow-none transition-all hover:bg-slate-200/80 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            {locale === "vi" ? "AI lọc CV" : "AI CV Screening"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="mt-0">
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
                          {jobPostId === "" && (
                            <Check size={14} className="text-primary font-bold" />
                          )}
                        </button>
                        {jobs
                          .filter((job) =>
                            job.title.toLowerCase().includes(jobSearch.toLowerCase()),
                          )
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
                        {jobs.filter((job) =>
                          job.title.toLowerCase().includes(jobSearch.toLowerCase()),
                        ).length === 0 && (
                          <div className="py-6 text-center text-xs font-medium text-slate-400">
                            {locale === "vi"
                              ? "Không tìm thấy tin tuyển dụng nào."
                              : "No jobs found."}
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
                        <span
                          className={cn("size-2 rounded-full shrink-0", getStatusDotClass(st))}
                        />
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
                <th className="w-[160px] min-w-[150px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
                  {t("candidates.table.candidate")}
                </th>
                <th className="min-w-[200px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
                  {t("candidates.table.jobPost")}
                </th>
                <th className="w-[140px] min-w-[140px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
                  {t("candidates.table.submittedAt")}
                </th>
                <th className="w-[100px] min-w-[100px] border-r border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-900 last:border-r-0">
                  {t("candidates.table.cv")}
                </th>
                <th className="w-[145px] min-w-[145px] px-4 py-3 text-left text-xs font-bold text-slate-900">
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
                      {missingCompany ? (
                        <>
                          <span className="font-bold text-slate-800">
                            {locale === "vi" ? "Chưa có hồ sơ công ty" : "No company profile yet"}
                          </span>
                          <span className="mt-1 max-w-md text-sm font-medium text-slate-500">
                            {locale === "vi"
                              ? "Vui lòng cập nhật hồ sơ công ty trước khi xem danh sách ứng viên."
                              : "Please complete your company profile before viewing applications."}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-slate-500">
                          {t("candidates.table.empty")}
                        </span>
                      )}
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
                      <td className="w-[160px] min-w-[150px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                        <span className="text-sm font-semibold text-slate-800">{name}</span>
                      </td>
                      <td className="min-w-[200px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-800 last:border-r-0">
                        {app.jobPost.title}
                      </td>
                      <td className="w-[140px] min-w-[140px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-600 last:border-r-0">
                        {formatAppDateTime(app.submittedAt)}
                      </td>
                      <td className="w-[100px] min-w-[100px] border-r border-slate-100/50 px-2 py-2.5 last:border-r-0">
                        {app.cvVersion ? (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() =>
                                handleDownloadCv(app.cvVersion!.fileUrl, app.cvVersion!.fileName)
                              }
                              className="inline-flex cursor-pointer items-center justify-center text-emerald-600 transition-colors hover:text-emerald-700"
                              title={locale === "vi" ? "Tải xuống CV" : "Download CV"}
                            >
                              <FileArrowDown size={18} />
                            </button>
                            <span className="h-4 w-px bg-slate-200" />
                            <button
                              onClick={() => {
                                setQuickViewUrl(app.cvVersion!.fileUrl);
                                setQuickViewTitle(name);
                              }}
                              className="text-primary inline-flex cursor-pointer items-center justify-center transition-colors hover:text-emerald-700"
                              title={locale === "vi" ? "Xem nhanh CV" : "Quick View CV"}
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full text-center">
                            <span className="text-slate-400">—</span>
                          </div>
                        )}
                      </td>
                      <td className="w-[145px] min-w-[145px] px-4 py-2.5">
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
                            <span className="mr-1">
                              {t(`candidates.status.${app.status}` as any)}
                            </span>
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
        </TabsContent>

        <TabsContent value="cv-ranking" className="mt-0">
          <CvRankingTable
            jobs={jobs}
            t={t}
            locale={locale}
            saving={saving}
            onStatusChange={handleStatusChange}
            token={token}
            cvScreening={cvScreening}
          />
        </TabsContent>
      </Tabs>

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
          <div className="relative flex w-full flex-1 flex-col items-center justify-center bg-slate-100 p-6">
            {quickViewLoading && (
              <div className="flex flex-col items-center gap-3">
                <CircleNotch className="size-8 animate-spin text-emerald-600" />
                <span className="text-sm font-bold text-slate-500">Đang tải tài liệu...</span>
              </div>
            )}

            {quickViewError && (
              <div className="flex max-w-md flex-col items-center justify-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <WarningCircle size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Không thể xem trực tiếp</h4>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Cấu hình bảo mật trình duyệt chặn xem nhanh hoặc tệp tin không tồn tại.
                  </p>
                </div>
                <a
                  href={quickViewUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-none transition-colors hover:bg-emerald-700"
                >
                  <ArrowSquareOut size={14} />
                  Mở trực tiếp trong tab mới
                </a>
              </div>
            )}

            {!quickViewLoading && !quickViewError && quickViewBlobUrl && (
              <iframe
                src={`${quickViewBlobUrl}#toolbar=0&navpanes=0`}
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
  if (isRecruiterMissingCompanyError(error)) {
    return;
  }

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
  if (isRecruiterMissingCompanyError(error)) {
    return;
  }

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

function CvRankingTable({
  jobs,
  t,
  locale,
  saving,
  onStatusChange,
  token,
  cvScreening,
}: {
  jobs: RecruiterJobPost[];
  t: any;
  locale: string;
  saving: boolean;
  onStatusChange: (applicationId: string, nextStatus: string) => Promise<void>;
  token: string;
  cvScreening: ReturnType<typeof useCvScreening>;
}) {
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [aiScoreDetail, setAiScoreDetail] = useState<ApplicationAiScoreResponse | null>(null);
  const [loadingAiScore, setLoadingAiScore] = useState(false);

  // Dropdown states
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [limitDropdownOpen, setLimitDropdownOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");

  const {
    selectedJobId,
    setSelectedJobId,
    limit,
    setLimit,
    progress,
    results,
    isRunning,
    error,
    hasFiltered,
    startScreening,
  } = cvScreening;

  useEffect(() => {
    if (!activeApplicationId || !token) {
      setAiScoreDetail(null);
      return;
    }

    let active = true;
    const loadDetail = async () => {
      setLoadingAiScore(true);
      try {
        const data = await getApplicationAiScore(activeApplicationId, token);
        if (active) {
          setAiScoreDetail(data);
        }
      } catch (err) {
        console.error("Failed to load AI score detail:", err);
        void Swal.fire({
          icon: "error",
          title: locale === "vi" ? "Lỗi tải đánh giá" : "Failed to load evaluation",
          text:
            locale === "vi"
              ? "Không thể tải chi tiết đánh giá từ hệ thống."
              : "Could not fetch evaluation details.",
        });
        if (active) {
          setActiveApplicationId(null);
        }
      } finally {
        if (active) {
          setLoadingAiScore(false);
        }
      }
    };

    void loadDetail();
    return () => {
      active = false;
    };
  }, [activeApplicationId, token, locale]);

  const handleViewCv = async (applicationId: string, customCvUrl?: string | null) => {
    if (customCvUrl && !customCvUrl.includes("/applications/")) {
      window.open(customCvUrl, "_blank");
      return;
    }

    const url = getApplicationCvUrl(applicationId);
    try {
      const init: RequestInit = {};
      if (token) {
        init.headers = authHeaders(token);
      }
      const response = await fetch(url, init);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Không tìm thấy file CV của ứng viên này.");
        }
        throw new Error("Failed to fetch");
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || "Lỗi phản hồi từ máy chủ.");
        } catch {
          throw new Error("Không thể mở CV: Phản hồi lỗi cấu trúc từ máy chủ.");
        }
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Tệp tin CV của ứng viên này rỗng (0 bytes).");
      }
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const localUrl = URL.createObjectURL(pdfBlob);
      window.open(localUrl, "_blank");
    } catch (err: any) {
      console.error(err);
      void Swal.fire({
        icon: "error",
        title: locale === "vi" ? "Lỗi mở CV" : "Failed to open CV",
        text:
          err.message || (locale === "vi" ? "Không thể tải file CV." : "Could not load CV file."),
      });
    }
  };

  const handleAction = async (id: string, actionStatus: string) => {
    try {
      await onStatusChange(id, actionStatus);
      if (activeApplicationId === id) {
        setActiveApplicationId(null);
      }
    } catch {
      // Handled by parent
    }
  };

  const getRankBadgeClass = (index: number) => {
    switch (index) {
      case 0:
        return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      case 1:
        return "bg-slate-200 text-slate-800 border-slate-350 font-bold";
      case 2:
        return "bg-orange-100 text-orange-800 border-orange-300 font-bold";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200 font-medium";
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="space-y-4">
      <RecruiterTableLayout
        loading={false}
        filterBar={
          <>
            <div className="w-full sm:w-[280px]">
              <DropdownMenu open={jobDropdownOpen} onOpenChange={setJobDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    role="combobox"
                    aria-expanded={jobDropdownOpen}
                    disabled={isRunning}
                    className="upnext-focus border-input flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="truncate">
                      {jobs.find((j) => j.id === selectedJobId)?.title ??
                        (locale === "vi" ? "Chọn tin tuyển dụng..." : "Select job post...")}
                    </span>
                    <CaretDown size={16} className="ml-2 shrink-0 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="z-50 flex max-h-80 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                  style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                >
                  <div className="relative flex items-center px-1 py-1">
                    <MagnifyingGlass size={16} className="absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={locale === "vi" ? "Tìm tin tuyển dụng..." : "Search jobs..."}
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="focus:border-primary h-9 w-full rounded-lg border border-slate-200 pr-3 pl-9 text-xs font-semibold placeholder:text-slate-400 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto pr-0.5">
                    {jobs
                      .filter((job) => job.title.toLowerCase().includes(jobSearch.toLowerCase()))
                      .map((job) => (
                        <button
                          key={job.id}
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setJobDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors hover:bg-slate-50 flex items-center justify-between cursor-pointer",
                            selectedJobId === job.id
                              ? "text-primary bg-primary/10 font-bold"
                              : "text-slate-700",
                          )}
                        >
                          <span className="truncate pr-2">{job.title}</span>
                          {selectedJobId === job.id && (
                            <Check size={14} className="text-primary font-bold" />
                          )}
                        </button>
                      ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="w-full sm:w-[225px]">
              <DropdownMenu open={limitDropdownOpen} onOpenChange={setLimitDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    role="combobox"
                    aria-expanded={limitDropdownOpen}
                    disabled={isRunning}
                    className="upnext-focus border-input flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="truncate">
                      {limit === "ALL"
                        ? locale === "vi"
                          ? "Tất cả"
                          : "All"
                        : limit === "VACANCIES"
                          ? locale === "vi"
                            ? `Số lượng tuyển (${jobs.find((j) => j.id === selectedJobId)?.vacanciesCount || 0})`
                            : `Vacancies (${jobs.find((j) => j.id === selectedJobId)?.vacanciesCount || 0})`
                          : `Top ${limit}`}
                    </span>
                    <CaretDown size={16} className="ml-2 shrink-0 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="z-50 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                  style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                >
                  {[
                    { value: "ALL", label: locale === "vi" ? "Tất cả" : "All" },
                    { value: "10", label: "Top 10" },
                    { value: "20", label: "Top 20" },
                    {
                      value: "VACANCIES",
                      label:
                        locale === "vi"
                          ? `Số lượng tuyển (${jobs.find((j) => j.id === selectedJobId)?.vacanciesCount || 0})`
                          : `Vacancies (${jobs.find((j) => j.id === selectedJobId)?.vacanciesCount || 0})`,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setLimit(opt.value);
                        setLimitDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors hover:bg-slate-50 flex items-center justify-between cursor-pointer",
                        limit === opt.value
                          ? "text-primary bg-primary/10 font-bold"
                          : "text-slate-700",
                      )}
                    >
                      <span>{opt.label}</span>
                      {limit === opt.value && (
                        <Check size={14} className="text-primary font-bold" />
                      )}
                    </button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              onClick={startScreening}
              disabled={isRunning || !selectedJobId}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 font-bold text-white shadow-none hover:bg-emerald-700"
            >
              {isRunning ? (
                <>
                  <CircleNotch className="size-4 animate-spin" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkle size={16} />
                  <span>Lọc xếp hạng</span>
                </>
              )}
            </Button>
          </>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 bg-slate-200">
            <th className="w-16 border-r border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-900 last:border-r-0">
              {locale === "vi" ? "Hạng" : "Rank"}
            </th>
            <th className="w-[160px] min-w-[150px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {locale === "vi" ? "Ứng viên" : "Candidate"}
            </th>
            <th className="w-[200px] min-w-[180px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {locale === "vi" ? "Tin tuyển dụng" : "Job Post"}
            </th>
            <th className="min-w-[280px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {locale === "vi" ? "Lý do phù hợp / summary" : "Matching Summary"}
            </th>
            <th className="w-[120px] min-w-[120px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {locale === "vi" ? "Độ phù hợp" : "AI Score"}
            </th>
            <th className="w-20 min-w-[80px] px-4 py-3 text-center text-xs font-bold text-slate-900">
              {locale === "vi" ? "Thao tác" : "Actions"}
            </th>
          </tr>
        </thead>
        <tbody>
          {isRunning ? (
            <tr>
              <td colSpan={6} className="px-4 !py-16 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <CircleNotch className="size-10 animate-spin text-emerald-600" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">
                      {locale === "vi" ? "Đang phân tích hồ sơ..." : "Analyzing resumes..."}
                    </h4>
                    {progress ? (
                      <p className="text-xs font-semibold text-slate-400">
                        {locale === "vi"
                          ? `Đã xử lý ${progress.processedCount}/${progress.totalApplications} hồ sơ`
                          : `Processed ${progress.processedCount}/${progress.totalApplications} resumes`}
                      </p>
                    ) : (
                      <p className="text-slate-450 text-xs font-semibold">
                        {locale === "vi" ? "Khởi tạo tiến trình..." : "Initializing process..."}
                      </p>
                    )}
                  </div>
                  {progress && progress.failedCount > 0 && (
                    <div className="mx-auto max-w-sm rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                      {locale === "vi"
                        ? `Có ${progress.failedCount} hồ sơ xử lý lỗi. Kết quả còn lại vẫn được hiển thị.`
                        : `Failed to process ${progress.failedCount} resumes. The remaining results will still be shown.`}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={6} className="px-4 !py-16 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <WarningCircle size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {locale === "vi" ? "Lọc xếp hạng thất bại" : "Screening Failed"}
                  </h4>
                  <p className="mx-auto max-w-md text-xs leading-relaxed font-semibold text-slate-400">
                    {error}
                  </p>
                  <Button
                    onClick={startScreening}
                    className="mt-2 h-9 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Thử lại
                  </Button>
                </div>
              </td>
            </tr>
          ) : !hasFiltered ? (
            <tr>
              <td colSpan={6} className="px-4 !py-16 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <MagnifyingGlass size={28} />
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-slate-800">
                    {locale === "vi" ? "Chưa có kết quả" : "No results yet"}
                  </h4>
                  <p className="mx-auto max-w-sm text-xs leading-relaxed font-semibold text-slate-400">
                    {locale === "vi"
                      ? "Chưa có kết quả xếp hạng. Hãy chọn tin tuyển dụng và bấm “Lọc xếp hạng”."
                      : 'No matching results yet. Please select a job and click "Filter & Rank".'}
                  </p>
                </div>
              </td>
            </tr>
          ) : results.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 !py-12 text-center text-sm text-slate-500">
                {locale === "vi"
                  ? "Không tìm thấy ứng viên nào đạt điểm lọc."
                  : "No candidates found."}
              </td>
            </tr>
          ) : (
            results.map((cand, index) => (
              <tr
                key={cand.applicationId}
                className="border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30"
              >
                <td className="w-16 border-r border-slate-100/50 px-4 py-2.5 text-center last:border-r-0">
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full border text-[10px] tracking-tight",
                      getRankBadgeClass(index),
                    )}
                  >
                    #{index + 1}
                  </span>
                </td>
                <td className="w-[160px] min-w-[150px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                  <span className="text-sm font-semibold text-slate-800">{cand.candidateName}</span>
                </td>
                <td className="w-[200px] min-w-[180px] truncate border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-800 last:border-r-0">
                  {cand.jobTitle}
                </td>
                <td className="min-w-[280px] border-r border-slate-100/50 px-4 py-2.5 text-left last:border-r-0">
                  <div className="flex flex-col gap-1.5 whitespace-normal">
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {cand.summary}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {cand.matchedSkills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {cand.matchedSkills.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          +{cand.matchedSkills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="w-[120px] min-w-[120px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                  <div className="w-full space-y-1">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-md font-extrabold border text-[10px] leading-none shrink-0 inline-block",
                        getScoreColorClass(cand.finalScore),
                      )}
                    >
                      {cand.finalScore}%
                    </span>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          getProgressBarColor(cand.finalScore),
                        )}
                        style={{ width: `${cand.finalScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="w-20 min-w-[80px] px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveApplicationId(cand.applicationId)}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                      title="Xem đánh giá chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleViewCv(cand.applicationId, cand.cvFileUrl)}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-600 transition-colors hover:bg-slate-50 hover:text-emerald-700"
                      title="Xem CV"
                    >
                      <FileArrowDown size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </RecruiterTableLayout>

      <Dialog
        open={!!activeApplicationId}
        onOpenChange={(open) => !open && setActiveApplicationId(null)}
      >
        <DialogContent className="flex max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
          {loadingAiScore && (
            <div className="flex h-[40vh] flex-col items-center justify-center space-y-3">
              <CircleNotch className="size-8 animate-spin text-emerald-600" />
              <span className="text-sm font-bold text-slate-500">
                Đang tải đánh giá chi tiết...
              </span>
            </div>
          )}

          {!loadingAiScore && aiScoreDetail && (
            <div className="text-slate-655 max-h-[75vh] space-y-5 overflow-y-auto pr-2 text-left text-sm leading-relaxed">
              <DialogHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <DialogTitle className="text-lg font-extrabold text-slate-900">
                    Đánh giá mức độ phù hợp: {aiScoreDetail.candidateName}
                  </DialogTitle>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Vị trí ứng tuyển: {aiScoreDetail.jobTitle}
                  </p>
                </div>
                <div
                  className={cn(
                    "px-4 py-2 rounded-xl border text-center flex flex-col items-center justify-center shrink-0",
                    getScoreColorClass(aiScoreDetail.finalScore),
                  )}
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">
                    Độ phù hợp
                  </span>
                  <span className="text-xl font-black">{aiScoreDetail.finalScore}%</span>
                </div>
              </DialogHeader>

              <div className="space-y-1.5">
                <h4 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                  1. Tổng quan đánh giá
                </h4>
                <p className="text-slate-650 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-xs leading-relaxed font-semibold">
                  {aiScoreDetail.summary}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                  2. Tiêu chí chấm điểm
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
                    <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Kỹ năng
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {aiScoreDetail.skillScore}/40
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
                    <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Kinh nghiệm
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {aiScoreDetail.experienceScore}/30
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
                    <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Dự án liên quan
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {aiScoreDetail.projectScore}/20
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
                    <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Học vấn
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {aiScoreDetail.educationScore}/10
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                    3. Kỹ năng khớp
                  </h4>
                  <div className="flex min-h-11 flex-wrap gap-1.5 rounded-xl border border-emerald-100/50 bg-emerald-50/10 p-3">
                    {aiScoreDetail.matchedSkills.length > 0 ? (
                      aiScoreDetail.matchedSkills.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">Không có</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                    4. Kỹ năng còn thiếu
                  </h4>
                  <div className="flex min-h-11 flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                    {aiScoreDetail.missingSkills.length > 0 ? (
                      aiScoreDetail.missingSkills.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 line-through"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">Không có</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                    5. Điểm mạnh nổi bật
                  </h4>
                  <div className="min-h-[100px] rounded-xl border border-emerald-100 bg-emerald-50/10 p-3.5">
                    <ul className="text-slate-655 list-disc space-y-1.5 pl-4 text-xs font-semibold">
                      {aiScoreDetail.strengths.length > 0 ? (
                        aiScoreDetail.strengths.map((str: string, idx: number) => (
                          <li key={idx}>{str}</li>
                        ))
                      ) : (
                        <li className="list-none text-slate-400 italic">Không có</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                    6. Điểm hạn chế / cần lưu ý
                  </h4>
                  <div className="min-h-[100px] rounded-xl border border-rose-100 bg-rose-50/10 p-3.5">
                    <ul className="text-slate-655 list-disc space-y-1.5 pl-4 text-xs font-semibold">
                      {aiScoreDetail.weaknesses.length > 0 ? (
                        aiScoreDetail.weaknesses.map((weak: string, idx: number) => (
                          <li key={idx}>{weak}</li>
                        ))
                      ) : (
                        <li className="list-none text-slate-400 italic">Không có</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                  7. Khuyến nghị xử lý
                </h4>
                <p className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5 text-xs leading-relaxed font-bold text-indigo-900">
                  {aiScoreDetail.recommendation}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveApplicationId(null)}
                  className="h-10 cursor-pointer rounded-lg border-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleViewCv(aiScoreDetail.applicationId, aiScoreDetail.cvFileUrl)}
                  className="h-10 cursor-pointer rounded-lg border-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Xem CV
                </Button>
                <Button
                  onClick={() => handleAction(aiScoreDetail.applicationId, "REJECTED")}
                  disabled={saving}
                  className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 font-bold text-rose-700 hover:bg-rose-100"
                >
                  <XCircle size={16} />
                  Từ chối
                </Button>
                <Button
                  onClick={() => handleAction(aiScoreDetail.applicationId, "INTERVIEWING")}
                  disabled={saving}
                  className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 font-bold text-white shadow-none hover:bg-emerald-700"
                >
                  <CheckCircle size={16} />
                  Mời phỏng vấn
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
