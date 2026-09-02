"use client";

import {
  ArrowsCounterClockwise,
  CaretDown,
  Check,
  CircleNotch,
  DownloadSimple,
  Eye,
  FileArrowDown,
  Funnel,
  Gear,
  MagnifyingGlass,
  Sparkle,
  CheckCircle,
  XCircle,
  Info,
  X,
  WarningCircle,
  ArrowSquareOut,
  Star,
  IdentificationCard,
  Envelope,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

import { authHeaders, RECRUITER_SESSION_REFRESHED_EVENT } from "@/features/recruiter/api/client";
import {
  getApplicationAiScore,
  getApplicationCvUrl,
  type ApplicationAiScoreResponse,
  type ScoreCriterionKey,
} from "@/features/recruiter/api/cv-screening-api";
import {
  getCvScreeningConfig,
  updateCvScreeningConfig,
} from "@/features/recruiter/api/cv-screening-config-api";
import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  addToShortlist,
  getRecruiterShortlist,
  removeFromShortlist,
  type ShortlistEntry,
} from "@/features/recruiter/api/shortlist";
import {
  getCompanyApplications,
  isRecruiterMissingCompanyError,
  markApplicationViewed,
  updateApplicationStatus,
  type Application,
  type ApplicationAiLabel,
} from "@/features/recruiter/api/team";
import { ScheduleInterviewDialog } from "@/features/recruiter/components/interviews/schedule-interview-dialog";
import { SearchInput } from "@/features/recruiter/components/interviews/search-input";
import {
  SelectFilter,
  type SelectFilterOption,
} from "@/features/recruiter/components/interviews/select-filter";
import { SendOfferDialog } from "@/features/recruiter/components/send-offer-dialog";
import { useCvScreening } from "@/features/recruiter/hooks/use-cv-screening";
import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { toDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { CandidateProfileDetailDialog } from "./candidate-profile-detail-dialog";
import { CoverLetterDialog } from "./cover-letter-dialog";
import {
  CvScreeningConfigForm,
  type CvScreeningConfigFormValues,
} from "./cv-screening-config-form";
import { PotentialCandidatesTab } from "./potential-candidates-tab";
import { RecruiterTableLayout } from "./recruiter-table-layout";
import { SavePotentialCandidateDialog } from "./save-potential-candidate-dialog";

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
  "WITHDRAWN",
  "REJECTED",
] as const;

// Chỉ cho đánh dấu "ứng viên tiềm năng" khi đơn ứng tuyển còn đang trong quy
// trình xử lý — HIRED/REJECTED/WITHDRAWN coi như đã kết thúc, không cần lưu
// thêm nữa (nhưng nếu đã lưu từ trước khi chuyển sang trạng thái này thì vẫn
// cho bỏ lưu bình thường, chỉ chặn lưu MỚI).
const SHORTLIST_ELIGIBLE_STATUSES = new Set([
  "SUBMITTED",
  "VIEWED",
  "SHORTLISTED",
  "INTERVIEWING",
  "OFFERED",
]);

const PIPELINE_STATUS_ORDER: Record<string, number> = {
  SUBMITTED: 0,
  VIEWED: 1,
  CONSIDERING: 1, // fallback for legacy data
  SHORTLISTED: 2,
  INTERVIEWING: 3,
  OFFERED: 4,
  HIRED: 5,
};

function isStatusTransitionAllowed(currentStatus: string, targetStatus: string): boolean {
  if (currentStatus === targetStatus) return true;
  // Các trạng thái kết thúc không được lùi hoặc thay đổi
  if (currentStatus === "HIRED" || currentStatus === "REJECTED" || currentStatus === "WITHDRAWN") {
    return false;
  }
  // Không cho phép chuyển tới WITHDRAWN (chỉ ứng viên) hoặc CONSIDERING (đã bỏ)
  if (targetStatus === "WITHDRAWN" || targetStatus === "CONSIDERING") {
    return false;
  }
  // Cho phép chuyển sang REJECTED (Chưa phù hợp) từ bất kỳ trạng thái đang xử lý nào
  if (targetStatus === "REJECTED") {
    return true;
  }
  const currentRank = PIPELINE_STATUS_ORDER[currentStatus];
  const targetRank = PIPELINE_STATUS_ORDER[targetStatus];
  if (currentRank !== undefined && targetRank !== undefined) {
    // Chỉ cho phép tiến về phía trước (cho phép nhảy cóc), tuyệt đối không cho phép lùi
    return targetRank > currentRank;
  }
  return false;
}

const AI_LABEL_OPTIONS = ["excellent", "good", "average", "low", "unscored"] as const;

function isKnownCandidatesTab(value: string | null): value is "cv-ranking" | "potential" {
  return value === "cv-ranking" || value === "potential";
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-sky-50 text-sky-700 hover:bg-sky-100/70 border border-sky-200/50";
    case "VIEWED":
      return "bg-blue-50 text-blue-700 hover:bg-blue-100/70 border border-blue-200/50";
    case "CONSIDERING":
      return "bg-orange-50 text-orange-700 hover:bg-orange-100/70 border border-orange-200/50";
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

export function getStatusDotClass(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-sky-500";
    case "VIEWED":
      return "bg-blue-500";
    case "CONSIDERING":
      return "bg-orange-500";
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
  // Dashboard trỏ sang đây kèm sẵn bộ lọc, ví dụ ?viewed=unviewed cho thẻ "Chưa xem".
  const presetViewed = searchParams?.get("viewed") === "unviewed" ? "unviewed" : "ALL";
  const presetStatusParam = searchParams?.get("status") ?? "";
  const presetStatus = (STATUS_OPTIONS as readonly string[]).includes(presetStatusParam)
    ? presetStatusParam
    : "ALL";

  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [missingCompany, setMissingCompany] = useState(false);

  // "Ứng viên tiềm năng": ứng viên đã nộp đơn được đánh dấu lưu lại xem sau
  // (RecruiterCandidateShortlist ở backend), độc lập với trạng thái pipeline.
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [shortlistPending, setShortlistPending] = useState<Set<string>>(new Set());
  // Ứng viên đang được bấm ⭐ để lưu — mở dialog nhập mức độ quan tâm/ghi chú
  // trước khi thật sự gọi API, thay vì lưu ngay một cú click.
  const [shortlistDialogApp, setShortlistDialogApp] = useState<Application | null>(null);

  // Popup "Xem chi tiết hồ sơ ứng viên" — id đơn ứng tuyển đang xem, null = đóng.
  const [profileDetailApplicationId, setProfileDetailApplicationId] = useState<string | null>(null);

  // Popup "Xem thư ứng tuyển" — tách riêng khỏi hồ sơ ứng viên vì đây là nội
  // dung của TỪNG đơn ứng tuyển, không phải hồ sơ cá nhân.
  const [coverLetterApplicationId, setCoverLetterApplicationId] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [jobPostId, setJobPostId] = useState(presetJobPostId || "ALL");
  const [status, setStatus] = useState(presetStatus);
  const [viewed, setViewed] = useState(presetViewed);
  const [aiLabel, setAiLabel] = useState("ALL");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Set when the recruiter picks "Hẹn phỏng vấn"; drives the schedule dialog.
  const [interviewSeed, setInterviewSeed] = useState<{
    applicationId: string;
    interviewRound: number;
  } | null>(null);

  // Set when the recruiter picks "Gửi đề nghị"; drives the offer dialog.
  const [offerSeed, setOfferSeed] = useState<{
    applicationId: string;
    candidateName?: string;
    jobTitle?: string;
  } | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // AI CV Screening Tab States (preserved across tab switches & page navigation)
  const requestedTab = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(() =>
    isKnownCandidatesTab(requestedTab) ? requestedTab : "candidates",
  );

  const handleScreeningUnauthorized = useCallback(() => {
    clearRecruiterSession();
    router.replace("/recruiter/login");
  }, [router]);

  const cvScreening = useCvScreening(token, handleScreeningUnauthorized);

  useEffect(() => {
    const handleSessionRefresh = (event: Event) => {
      const { accessToken } = (event as CustomEvent<{ accessToken: string }>).detail;
      setToken(accessToken);
    };

    window.addEventListener(RECRUITER_SESSION_REFRESHED_EVENT, handleSessionRefresh);
    return () =>
      window.removeEventListener(RECRUITER_SESSION_REFRESHED_EVENT, handleSessionRefresh);
  }, []);

  // Đồng bộ tab đang chọn với query `?tab=` mỗi khi nó đổi (vd. bấm mục con
  // trong sidebar). Chỉ khôi phục tab đã lưu ở sessionStorage lần đầu mount —
  // nếu dùng nó cho mọi lần đổi URL, bấm "Danh sách ứng tuyển" (không có
  // `?tab=`) sau khi đã từng ở tab khác sẽ bị kẹt lại tab cũ trong sessionStorage
  // thay vì quay về đúng tab mặc định mà đường link trỏ tới.
  const isFirstTabResolve = useRef(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isKnownCandidatesTab(requestedTab)) {
      setActiveTab(requestedTab);
    } else if (isFirstTabResolve.current) {
      const savedTab = sessionStorage.getItem("upnext_activeTab");
      if (savedTab) setActiveTab(savedTab);
    } else {
      setActiveTab("candidates");
    }
    isFirstTabResolve.current = false;
  }, [requestedTab]);

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
        const headers: Record<string, string> = {};
        if (token && (quickViewUrl.startsWith("/") || quickViewUrl.includes("/api/"))) {
          Object.assign(headers, authHeaders(token));
        }
        const res = await fetch(quickViewUrl, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        if (blob.size === 0) {
          throw new Error("CV file is empty (0 bytes)");
        }
        if (active) {
          const pdfBlob = new Blob([blob], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(pdfBlob);
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
  }, [quickViewUrl, token]);

  const handleDownloadCv = useCallback(
    async (fileUrl: string, fileName: string) => {
      try {
        const headers: Record<string, string> = {};
        if (token && (fileUrl.startsWith("/") || fileUrl.includes("/api/"))) {
          Object.assign(headers, authHeaders(token));
        }
        const response = await fetch(fileUrl, { headers });
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
    },
    [token],
  );

  /**
   * `cvVersion.fileUrl` is empty whenever the stored file has no public URL
   * (private storage, or a CV that was parsed without keeping the original).
   * Fall back to the authenticated stream endpoint instead of handing an empty
   * string to fetch -- an empty quick-view URL silently keeps the dialog shut.
   */
  const resolveCvUrl = useCallback(
    (app: Application) =>
      app.cvVersion?.fileUrl?.trim()
        ? app.cvVersion.fileUrl
        : getApplicationCvUrl(app.id, app.cvVersion?.id),
    [],
  );

  const handleQuickView = useCallback(
    (app: Application, title: string) => {
      setQuickViewUrl(resolveCvUrl(app));
      setQuickViewTitle(title);

      if (token) {
        const isSubmitted = app.status === "SUBMITTED";
        if (!app.viewedAt || isSubmitted) {
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === app.id
                ? {
                    ...c,
                    viewedAt: c.viewedAt ?? new Date().toISOString(),
                    status: isSubmitted ? "VIEWED" : c.status,
                  }
                : c,
            ),
          );
        }

        if (isSubmitted) {
          void updateApplicationStatus(app.id, "VIEWED", token).catch((error) => {
            console.error("Failed to update status to VIEWED:", error);
          });
        } else if (!app.viewedAt) {
          void markApplicationViewed(app.id, token).catch((error) => {
            console.error("Failed to mark application as viewed:", error);
          });
        }
      }
    },
    [token, resolveCvUrl],
  );

  const buildQueryParams = useCallback(() => {
    const queryParams: {
      jobPostId?: string;
      status?: string;
      search?: string;
      viewed?: "unviewed";
      aiLabel?: ApplicationAiLabel;
    } = {};
    if (jobPostId !== "ALL") queryParams.jobPostId = jobPostId;
    if (status !== "ALL") queryParams.status = status;
    if (search.trim()) queryParams.search = search.trim();
    if (viewed === "unviewed") queryParams.viewed = "unviewed";
    if (aiLabel !== "ALL") queryParams.aiLabel = aiLabel as ApplicationAiLabel;
    return queryParams;
  }, [jobPostId, status, search, viewed, aiLabel]);

  const loadCandidates = useCallback(
    async (nextAccountId: string, accessToken: string, isInitial = false) => {
      try {
        if (isInitial) {
          setInitialLoading(true);
        } else {
          setLoading(true);
        }
        await getRecruiterAccount(nextAccountId, accessToken);

        const queryParams = buildQueryParams();

        const jobPostsPromise = getRecruiterJobPosts(accessToken, nextAccountId);
        const applicationsPromise = getCompanyApplications(accessToken, queryParams);
        const shortlistPromise = getRecruiterShortlist(accessToken);

        const [applicantsResult, jobPostsData, shortlistResult] = await Promise.allSettled([
          applicationsPromise,
          jobPostsPromise,
          shortlistPromise,
        ] as const);

        if (jobPostsData.status === "fulfilled") {
          setJobs(jobPostsData.value);
        }

        if (shortlistResult.status === "fulfilled") {
          setShortlist(shortlistResult.value);
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
    [buildQueryParams, router, locale],
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

  // Reset to page 1 if the candidates list changes (due to filtering).
  //
  // Clearing the selection matters as much as the page reset: a filter change
  // can drop selected rows out of the visible list entirely, and the bulk bar
  // would still report them as selected. Changing status from there would move
  // -- and notify -- candidates the recruiter can no longer see, which is the
  // one outcome a bulk action must never have. Selection that spans *pages*
  // inside the same filter is kept on purpose (see handleSelectAll); only
  // switching filters resets it.
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, jobPostId, status, viewed, aiLabel]);

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

  async function applyStatusChange(
    applicationId: string,
    nextStatus: string,
    noteOrOptions?: Parameters<typeof updateApplicationStatus>[3],
  ) {
    try {
      setSaving(true);
      await updateApplicationStatus(applicationId, nextStatus, token, noteOrOptions);
      void toast.fire({ icon: "success", title: t("candidates.messages.statusUpdateSuccess") });
      // Reload candidates list
      const applicantsData = await getCompanyApplications(token, buildQueryParams());
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

  async function handleStatusChange(applicationId: string, nextStatus: string) {
    // Moving to "Hẹn phỏng vấn" should come with an actual interview slot, so
    // the schedule dialog opens first and the status only changes once the
    // recruiter either books a slot or explicitly skips scheduling.
    if (nextStatus === "INTERVIEWING") {
      setInterviewSeed({ applicationId, interviewRound: 1 });
      return;
    }

    if (nextStatus === "OFFERED") {
      const app = candidates.find((c) => c.id === applicationId);
      const name = app?.candidateProfile?.account?.fullName ?? "Ứng viên";
      const title = app?.jobPost?.title ?? "";
      setOfferSeed({ applicationId, candidateName: name, jobTitle: title });
      return;
    }

    await applyStatusChange(applicationId, nextStatus);
  }

  function shortlistKey(candidateProfileId: string, jobPostId: string | null) {
    return `${candidateProfileId}:${jobPostId ?? ""}`;
  }

  function findShortlistEntry(candidateProfileId: string, jobPostId: string) {
    return shortlist.find(
      (entry) => entry.candidateProfileId === candidateProfileId && entry.jobPostId === jobPostId,
    );
  }

  // Bấm ⭐ trong bảng "Danh sách ứng tuyển": nếu đã lưu rồi thì hỏi xác nhận rồi
  // bỏ lưu; nếu chưa thì mở dialog nhập ghi chú/mức độ quan tâm trước khi lưu —
  // không lưu ngay một cú click vì sẽ mất cơ hội ghi lại lý do quan tâm.
  function handleStarClick(app: Application) {
    const existing = findShortlistEntry(app.candidateProfile.id, app.jobPost.id);
    if (existing) {
      void handleRemoveShortlist(existing);
    } else {
      setShortlistDialogApp(app);
    }
  }

  async function handleConfirmSaveShortlist(
    app: Application,
    input: { note?: string | undefined; priority: number },
  ) {
    const key = shortlistKey(app.candidateProfile.id, app.jobPost.id);
    if (shortlistPending.has(key)) return;
    setShortlistPending((prev) => new Set(prev).add(key));
    try {
      const created = await addToShortlist(token, {
        candidateProfileId: app.candidateProfile.id,
        jobPostId: app.jobPost.id,
        note: input.note,
        priority: input.priority,
      });
      setShortlist((prev) => [created, ...prev]);
      setShortlistDialogApp(null);
      void toast.fire({
        icon: "success",
        title: locale === "vi" ? "Đã lưu vào ứng viên tiềm năng" : "Saved as a potential candidate",
      });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setShortlistPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  // Sửa ghi chú/mức độ quan tâm của một ứng viên tiềm năng đã lưu. Backend
  // không có API PATCH cho shortlist (chỉ POST/DELETE), nên "sửa" thực chất là
  // bỏ lưu rồi lưu lại với dữ liệu mới — id/ngày lưu sẽ đổi nhưng đó là giới
  // hạn thật của backend, không phải lựa chọn UI. Trả về true/false để dialog ở
  // component con biết có nên tự đóng lại hay không.
  async function handleEditShortlist(
    entry: ShortlistEntry,
    input: { note?: string | undefined; priority: number },
  ): Promise<boolean> {
    const key = shortlistKey(entry.candidateProfileId, entry.jobPostId);
    if (shortlistPending.has(key)) return false;
    setShortlistPending((prev) => new Set(prev).add(key));
    let removed = false;
    try {
      await removeFromShortlist(token, entry.id);
      removed = true;
      const created = await addToShortlist(token, {
        candidateProfileId: entry.candidateProfileId,
        jobPostId: entry.jobPostId ?? undefined,
        note: input.note,
        priority: input.priority,
      });
      setShortlist((prev) => [created, ...prev.filter((item) => item.id !== entry.id)]);
      void toast.fire({
        icon: "success",
        title: locale === "vi" ? "Đã cập nhật ứng viên tiềm năng" : "Potential candidate updated",
      });
      return true;
    } catch (error) {
      if (removed) {
        // Đã bỏ lưu thành công nhưng lưu lại thất bại — đồng bộ lại state theo
        // đúng thực tế (đã mất khỏi danh sách) và nói rõ để recruiter bấm ⭐
        // lưu lại, tránh hiển thị sai như thể ghi chú cũ vẫn còn.
        setShortlist((prev) => prev.filter((item) => item.id !== entry.id));
        void Swal.fire({
          icon: "error",
          title: locale === "vi" ? "Không thể lưu lại thay đổi" : "Could not save the changes",
          text:
            locale === "vi"
              ? "Ứng viên đã bị bỏ lưu do lỗi khi cập nhật. Vui lòng bấm ⭐ ở tab Danh sách ứng tuyển để lưu lại."
              : 'This candidate was removed from the list due to an error while saving changes. Please click ⭐ in the "Applications" tab to save them again.',
        });
      } else {
        showActionError(error, t);
      }
      return false;
    } finally {
      setShortlistPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  // Bỏ lưu ứng viên tiềm năng — dùng ở cả nút ⭐ (khi đã lưu) và nút "Bỏ lưu" ở
  // tab "Ứng viên tiềm năng". Hỏi xác nhận trước vì backend không có API sửa,
  // bỏ lưu rồi lưu lại sẽ mất ghi chú cũ.
  async function handleRemoveShortlist(entry: ShortlistEntry) {
    const result = await Swal.fire({
      icon: "warning",
      title: locale === "vi" ? "Bỏ ứng viên tiềm năng?" : "Remove potential candidate?",
      text:
        locale === "vi"
          ? "Ghi chú đã lưu cho ứng viên này sẽ bị xoá."
          : "The note saved for this candidate will be deleted.",
      showCancelButton: true,
      confirmButtonText: locale === "vi" ? "Bỏ lưu" : "Remove",
      cancelButtonText: locale === "vi" ? "Hủy" : "Cancel",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    const key = shortlistKey(entry.candidateProfileId, entry.jobPostId);
    if (shortlistPending.has(key)) return;
    setShortlistPending((prev) => new Set(prev).add(key));
    try {
      await removeFromShortlist(token, entry.id);
      setShortlist((prev) => prev.filter((item) => item.id !== entry.id));
      void toast.fire({
        icon: "success",
        title: locale === "vi" ? "Đã bỏ đánh dấu tiềm năng" : "Removed from potential candidates",
      });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setShortlistPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  // Mỗi lượt đổi trạng thái tạo một thông báo gửi tới ứng viên (xem
  // ApplicationsService.updateStatus ở backend) — đổi hàng loạt vẫn đi qua
  // đúng endpoint đơn lẻ đã kiểm quyền/kiểm nghiệp vụ, chỉ gọi song song, để
  // không phải viết lại logic phân quyền đã có sẵn cho một endpoint bulk mới.
  async function handleBulkStatusChange(nextStatus: string) {
    if (selectedIds.length === 0) return;

    const statusLabel = t(`candidates.status.${nextStatus}` as any);
    const result = await Swal.fire({
      icon: "warning",
      title: t("candidates.bulk.confirmTitle", { count: selectedIds.length }),
      text: t("candidates.bulk.confirmText", { status: statusLabel }),
      showCancelButton: true,
      confirmButtonText: t("candidates.bulk.confirmButton"),
      cancelButtonText: t("candidates.bulk.cancelButton"),
      confirmButtonColor: "#059669",
    });
    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      const targetIds = [...selectedIds];
      const results = await Promise.allSettled(
        targetIds.map((id) => updateApplicationStatus(id, nextStatus, token)),
      );
      const failedCount = results.filter((item) => item.status === "rejected").length;
      const successCount = targetIds.length - failedCount;

      const applicantsData = await getCompanyApplications(token, buildQueryParams());
      setMissingCompany(false);
      setCandidates(applicantsData);
      setSelectedIds([]);

      if (failedCount === 0) {
        void toast.fire({
          icon: "success",
          title: t("candidates.bulk.successAll", { count: successCount }),
        });
      } else {
        void Swal.fire({
          icon: successCount > 0 ? "warning" : "error",
          title: t("candidates.bulk.successPartial", {
            success: successCount,
            total: targetIds.length,
          }),
        });
      }
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

    const excelData = candidatesToExport.map((app, index) => {
      const name =
        app.candidateProfile?.account?.fullName ||
        (locale === "vi" ? "Chưa cập nhật" : "Not specified");
      const email = app.candidateProfile?.account?.email || "—";
      const phone = app.candidateProfile?.phoneNumber || "—";
      const jobTitle = app.jobPost?.title || "—";
      const submittedAt = formatAppDateTime(app.submittedAt);
      const cvName = app.cvVersion?.fileName || "—";
      const statusText = t(`candidates.status.${app.status}` as any);

      if (locale === "vi") {
        return {
          STT: index + 1,
          "Họ và tên": name,
          Email: email,
          "Số điện thoại": phone,
          "Vị trí ứng tuyển": jobTitle,
          "Ngày nộp": submittedAt,
          "Tên file CV": cvName,
          "Trạng thái": statusText,
        };
      }

      return {
        "No.": index + 1,
        "Full Name": name,
        Email: email,
        "Phone Number": phone,
        "Job Post": jobTitle,
        "Submitted At": submittedAt,
        "CV Filename": cvName,
        Status: statusText,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set custom column widths for clear, readable Excel presentation
    worksheet["!cols"] = [
      { wch: 6 }, // STT
      { wch: 25 }, // Họ và tên
      { wch: 28 }, // Email
      { wch: 18 }, // Số điện thoại
      { wch: 32 }, // Vị trí ứng tuyển
      { wch: 22 }, // Ngày nộp
      { wch: 32 }, // Tên file CV
      { wch: 18 }, // Trạng thái
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      locale === "vi" ? "Danh sách ứng viên" : "Candidates",
    );

    const today = new Date().toISOString().split("T")[0];
    const filename = `UpNext_Candidates_${today}.xlsx`;

    XLSX.writeFile(workbook, filename);

    void toast.fire({
      icon: "success",
      title:
        locale === "vi"
          ? "Xuất file Excel (.xlsx) thành công!"
          : "Excel file exported successfully!",
    });
  };

  function handleClearFilters() {
    setSearch("");
    setJobPostId("ALL");
    setStatus("ALL");
    setViewed("ALL");
    setAiLabel("ALL");
  }

  if (initialLoading) {
    return (
      <div className="flex h-80 items-center justify-center text-sm font-bold text-slate-500">
        <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
        {t("shell.loading")}
      </div>
    );
  }

  const jobFilterOptions: SelectFilterOption[] = [
    { value: "ALL", label: t("candidates.filters.allJobs") },
    ...jobs.map((job) => ({ value: job.id, label: job.title })),
  ];
  const statusFilterOptions: SelectFilterOption[] = [
    { value: "ALL", label: t("candidates.filters.allStatuses") },
    ...STATUS_OPTIONS.map((st) => ({ value: st, label: t(`candidates.status.${st}` as any) })),
  ];
  const viewedFilterOptions: SelectFilterOption[] = [
    { value: "ALL", label: t("candidates.filters.viewedAll") },
    { value: "unviewed", label: t("candidates.filters.viewedUnviewed") },
  ];
  const aiLabelFilterOptions: SelectFilterOption[] = [
    { value: "ALL", label: t("candidates.filters.aiLabelAll") },
    ...AI_LABEL_OPTIONS.map((label) => ({
      value: label,
      label: t(`candidates.filters.aiLabel.${label}` as any),
    })),
  ];
  const activeFiltersCount = [
    jobPostId !== "ALL",
    status !== "ALL",
    viewed !== "ALL",
    aiLabel !== "ALL",
  ].filter(Boolean).length;
  const hasActiveFilters = search.trim().length > 0 || activeFiltersCount > 0;

  const renderFilterControls = () => (
    <div className="contents">
      <SelectFilter
        ariaLabel={t("candidates.filters.jobAria")}
        value={jobPostId}
        onChange={setJobPostId}
        options={jobFilterOptions}
        placeholder={t("candidates.filters.allJobs")}
        className="w-full lg:w-56"
        showSearch
        triggerClassName={cn(
          "rounded-full",
          jobPostId !== "ALL" && "border-emerald-500 bg-emerald-50/10 font-medium text-emerald-600",
        )}
      />
      <SelectFilter
        ariaLabel={t("candidates.filters.statusAria")}
        value={status}
        onChange={setStatus}
        options={statusFilterOptions}
        placeholder={t("candidates.filters.allStatuses")}
        className="w-full lg:w-48"
        triggerClassName={cn(
          "rounded-full",
          status !== "ALL" && "border-emerald-500 bg-emerald-50/10 font-medium text-emerald-600",
        )}
      />
      <SelectFilter
        ariaLabel={t("candidates.filters.viewedAria")}
        value={viewed}
        onChange={setViewed}
        options={viewedFilterOptions}
        placeholder={t("candidates.filters.viewedAll")}
        className="w-full lg:w-44"
        triggerClassName={cn(
          "rounded-full",
          viewed !== "ALL" && "border-emerald-500 bg-emerald-50/10 font-medium text-emerald-600",
        )}
      />
      <SelectFilter
        ariaLabel={t("candidates.filters.aiLabelAria")}
        value={aiLabel}
        onChange={setAiLabel}
        options={aiLabelFilterOptions}
        placeholder={t("candidates.filters.aiLabelAll")}
        className="w-full lg:w-44"
        triggerClassName={cn(
          "rounded-full",
          aiLabel !== "ALL" && "border-emerald-500 bg-emerald-50/10 font-medium text-emerald-600",
        )}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClearFilters}
        disabled={!hasActiveFilters}
        className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-slate-200 px-4 text-xs font-semibold text-slate-600 shadow-none hover:bg-slate-50"
      >
        <X size={14} aria-hidden="true" />
        {t("candidates.filters.clear")}
      </Button>
    </div>
  );

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

      {activeTab === "candidates" ? (
        <section
          aria-label={t("candidates.filters.sectionAria")}
          className="sticky top-[-16px] z-30 -mx-4 -mt-4 border-y border-slate-200 bg-white px-4 py-4 md:top-[-32px] md:-mx-8 md:-mt-8 md:px-8"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="hidden shrink-0 text-xs font-semibold text-slate-500 md:inline">
                {t("candidates.filters.label")}
              </span>
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder={t("candidates.filters.searchPlaceholder")}
                  inputClassName="rounded-full"
                />
              </div>

              <button
                type="button"
                aria-expanded={showMobileFilters}
                aria-controls="candidate-mobile-filters"
                aria-label={
                  showMobileFilters
                    ? t("candidates.filters.hideAria")
                    : t("candidates.filters.showAria")
                }
                onClick={() => setShowMobileFilters((visible) => !visible)}
                className={cn(
                  "relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 lg:hidden",
                  (showMobileFilters || activeFiltersCount > 0) &&
                    "border-emerald-500 bg-emerald-50/10 text-emerald-600",
                )}
              >
                <Funnel
                  size={18}
                  weight={showMobileFilters || activeFiltersCount > 0 ? "bold" : "regular"}
                  aria-hidden="true"
                />
                {activeFiltersCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                    {activeFiltersCount}
                  </span>
                ) : null}
              </button>

              <div className="hidden items-center gap-2 lg:flex">{renderFilterControls()}</div>
            </div>

            {showMobileFilters ? (
              <div
                id="candidate-mobile-filters"
                className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-3 border-t border-slate-100 pt-3 duration-200 lg:hidden"
              >
                {renderFilterControls()}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="candidates">{t("nav.applicationsTab")}</TabsTrigger>
            <TabsTrigger value="cv-ranking">{t("nav.aiCvScreeningTab")}</TabsTrigger>
            <TabsTrigger value="potential">{t("nav.potentialCandidatesTab")}</TabsTrigger>
          </TabsList>

          {activeTab === "candidates" ? (
            <div className="flex shrink-0 items-center justify-end gap-2">
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
              {/* Export Excel Button */}
              <Button
                variant="outline"
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border-emerald-600 px-4 font-bold text-emerald-600 shadow-none transition-all hover:bg-emerald-50/50"
                onClick={handleExportExcel}
              >
                <DownloadSimple size={18} />
                <span>{locale === "vi" ? "Xuất Excel" : "Export Excel"}</span>
              </Button>
            </div>
          ) : null}
        </div>

        <TabsContent value="candidates" className="mt-0">
          {selectedIds.length > 0 ? (
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5">
              <span className="text-sm font-semibold text-emerald-800">
                {t("candidates.bulk.selectedCount", { count: selectedIds.length })}
              </span>

              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <Select
                  disabled={saving}
                  value=""
                  onValueChange={(nextStatus) => void handleBulkStatusChange(nextStatus)}
                >
                  <SelectTrigger
                    aria-label={t("candidates.bulk.changeStatus")}
                    className="h-9 w-fit rounded-full border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700 shadow-none focus:ring-0"
                  >
                    <span>{t("candidates.bulk.changeStatus")}</span>
                  </SelectTrigger>
                  <SelectContent align="end">
                    {STATUS_OPTIONS.filter((st) => st !== "WITHDRAWN" && st !== "INTERVIEWING").map(
                      (st) => (
                        <SelectItem key={st} value={st}>
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
                      ),
                    )}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-full border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700 shadow-none hover:bg-emerald-50"
                  onClick={handleExportExcel}
                >
                  <DownloadSimple size={14} />
                  {t("candidates.bulk.exportSelected")}
                </Button>

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="h-9 cursor-pointer rounded-full px-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  {t("candidates.bulk.clear")}
                </button>
              </div>
            </div>
          ) : null}

          <RecruiterTableLayout
            loading={loading}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
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
                <th className="w-12 border-r border-slate-300 px-2 py-3 text-center last:border-r-0">
                  <span className="sr-only">
                    {locale === "vi" ? "Ứng viên tiềm năng" : "Potential candidate"}
                  </span>
                  <Star size={16} className="mx-auto text-slate-400" />
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
                  <td colSpan={7} className="px-4 !py-12 text-center text-sm text-slate-500">
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
                      <td className="w-12 border-r border-slate-100/50 px-2 py-2.5 text-center last:border-r-0">
                        {(() => {
                          const existingEntry = findShortlistEntry(
                            app.candidateProfile.id,
                            app.jobPost.id,
                          );
                          const canStartNewShortlist = SHORTLIST_ELIGIBLE_STATUSES.has(app.status);
                          const locked = !existingEntry && !canStartNewShortlist;
                          return (
                            <button
                              type="button"
                              onClick={() => handleStarClick(app)}
                              disabled={
                                locked ||
                                shortlistPending.has(
                                  shortlistKey(app.candidateProfile.id, app.jobPost.id),
                                )
                              }
                              aria-label={
                                existingEntry
                                  ? locale === "vi"
                                    ? "Bỏ đánh dấu ứng viên tiềm năng"
                                    : "Remove from potential candidates"
                                  : locale === "vi"
                                    ? "Đánh dấu ứng viên tiềm năng"
                                    : "Mark as a potential candidate"
                              }
                              title={
                                locked
                                  ? locale === "vi"
                                    ? "Đơn ứng tuyển đã kết thúc (đã tuyển/từ chối/rút đơn), không thể đánh dấu tiềm năng mới"
                                    : "This application has ended (hired/rejected/withdrawn) — can't mark it as potential"
                                  : undefined
                              }
                              className={cn(
                                "inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                                existingEntry
                                  ? "text-amber-500"
                                  : "text-slate-300 hover:text-amber-500",
                              )}
                            >
                              <Star size={18} weight={existingEntry ? "fill" : "regular"} />
                            </button>
                          );
                        })()}
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
                      <td className="w-[145px] min-w-[145px] border-r border-slate-100/50 px-2 py-2.5 last:border-r-0">
                        <div className="flex items-center justify-center gap-3">
                          {app.cvVersion ? (
                            <>
                              <button
                                onClick={() =>
                                  handleDownloadCv(resolveCvUrl(app), app.cvVersion!.fileName)
                                }
                                className="inline-flex cursor-pointer items-center justify-center text-emerald-600 transition-colors hover:text-emerald-700"
                                title={locale === "vi" ? "Tải xuống CV" : "Download CV"}
                              >
                                <FileArrowDown size={18} />
                              </button>
                              <button
                                onClick={() => handleQuickView(app, name)}
                                className="text-primary inline-flex cursor-pointer items-center justify-center transition-colors hover:text-emerald-700"
                                title={locale === "vi" ? "Xem nhanh CV" : "Quick View CV"}
                              >
                                <Eye size={18} />
                              </button>
                              <span className="h-4 w-px bg-slate-200" />
                            </>
                          ) : null}
                          <button
                            onClick={() => setProfileDetailApplicationId(app.id)}
                            className="inline-flex cursor-pointer items-center justify-center text-slate-500 transition-colors hover:text-emerald-700"
                            title={
                              locale === "vi" ? "Xem hồ sơ ứng viên" : "View candidate profile"
                            }
                          >
                            <IdentificationCard size={18} />
                          </button>
                          <button
                            onClick={() => setCoverLetterApplicationId(app.id)}
                            className="inline-flex cursor-pointer items-center justify-center text-slate-500 transition-colors hover:text-emerald-700"
                            title={locale === "vi" ? "Xem thư ứng tuyển" : "View cover letter"}
                          >
                            <Envelope size={18} />
                          </button>
                        </div>
                      </td>
                      <td className="w-[145px] min-w-[145px] px-4 py-2.5">
                        <Select
                          value={app.status}
                          disabled={
                            saving ||
                            app.status === "WITHDRAWN" ||
                            app.status === "HIRED" ||
                            app.status === "REJECTED"
                          }
                          onValueChange={(nextStatus) => handleStatusChange(app.id, nextStatus)}
                        >
                          <SelectTrigger
                            aria-label="Application Status Update"
                            className={cn(
                              "h-7 text-xs font-medium px-2.5 border shadow-none focus:ring-0 w-fit rounded-full flex items-center justify-start gap-1 cursor-pointer transition-colors",
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
                            {STATUS_OPTIONS.map((st) => {
                              const isAllowed = isStatusTransitionAllowed(app.status, st);
                              const isCurrent = app.status === st;
                              return (
                                <SelectItem key={st} value={st} disabled={!isAllowed && !isCurrent}>
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
                              );
                            })}
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
            onUnauthorized={handleScreeningUnauthorized}
          />
        </TabsContent>

        <TabsContent value="potential" className="mt-0">
          <PotentialCandidatesTab
            token={token}
            locale={locale}
            t={t}
            shortlist={shortlist}
            pendingKeys={shortlistPending}
            onRemove={(entry) => void handleRemoveShortlist(entry)}
            onEdit={handleEditShortlist}
            resolveCvUrl={resolveCvUrl}
            onDownloadCv={handleDownloadCv}
            onQuickView={handleQuickView}
          />
        </TabsContent>
      </Tabs>

      {/* Schedule interview dialog, opened by moving a candidate to "Hẹn phỏng vấn" */}
      <ScheduleInterviewDialog
        token={token}
        jobs={jobs}
        open={interviewSeed !== null}
        onOpenChange={(open) => {
          if (!open) setInterviewSeed(null);
        }}
        initialValues={interviewSeed}
        lockApplication
        onScheduled={(applicationId) => {
          void applyStatusChange(applicationId, "INTERVIEWING");
        }}
        onSkipSchedule={() => {
          if (interviewSeed) {
            void applyStatusChange(interviewSeed.applicationId, "INTERVIEWING");
          }
        }}
      />

      {/* Send Job Offer Dialog, opened by moving a candidate to "Gửi đề nghị" */}
      <SendOfferDialog
        open={offerSeed !== null}
        onOpenChange={(open) => {
          if (!open) setOfferSeed(null);
        }}
        applicationId={offerSeed?.applicationId ?? null}
        candidateName={offerSeed?.candidateName}
        jobTitle={offerSeed?.jobTitle}
        onConfirmOffer={async (appId, offerDetails) => {
          await applyStatusChange(appId, "OFFERED", { offer: offerDetails });
        }}
      />

      {/* Lưu ứng viên tiềm năng, mở khi bấm ⭐ trên một đơn ứng tuyển chưa lưu */}
      <SavePotentialCandidateDialog
        open={shortlistDialogApp !== null}
        onOpenChange={(open) => {
          if (!open) setShortlistDialogApp(null);
        }}
        candidateName={
          shortlistDialogApp?.candidateProfile.account.fullName ??
          (locale === "vi" ? "Ẩn danh" : "Anonymous")
        }
        jobTitle={shortlistDialogApp?.jobPost.title ?? ""}
        locale={locale}
        submitting={
          shortlistDialogApp
            ? shortlistPending.has(
                shortlistKey(shortlistDialogApp.candidateProfile.id, shortlistDialogApp.jobPost.id),
              )
            : false
        }
        onConfirm={(input) => {
          if (shortlistDialogApp) void handleConfirmSaveShortlist(shortlistDialogApp, input);
        }}
      />

      {/* Xem chi tiết hồ sơ ứng viên (không chỉ CV) */}
      <CandidateProfileDetailDialog
        applicationId={profileDetailApplicationId}
        onOpenChange={(open) => {
          if (!open) setProfileDetailApplicationId(null);
        }}
        token={token}
        locale={locale}
        resolveCvUrl={resolveCvUrl}
        onDownloadCv={handleDownloadCv}
        onQuickView={handleQuickView}
      />

      {/* Xem thư ứng tuyển */}
      <CoverLetterDialog
        applicationId={coverLetterApplicationId}
        onOpenChange={(open) => {
          if (!open) setCoverLetterApplicationId(null);
        }}
        token={token}
        locale={locale}
      />

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
                <button
                  type="button"
                  onClick={() => {
                    if (quickViewBlobUrl) {
                      window.open(quickViewBlobUrl, "_blank", "noopener,noreferrer");
                    } else if (quickViewUrl) {
                      void handleDownloadCv(quickViewUrl, `${quickViewTitle || "CV"}.pdf`);
                    }
                  }}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-none transition-colors hover:bg-emerald-700"
                >
                  <ArrowSquareOut size={14} />
                  Mở trực tiếp trong tab mới
                </button>
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
  locale,
  saving,
  onStatusChange,
  token,
  cvScreening,
  onUnauthorized,
}: {
  jobs: RecruiterJobPost[];
  t: any;
  locale: string;
  saving: boolean;
  onStatusChange: (applicationId: string, nextStatus: string) => Promise<void>;
  token: string;
  cvScreening: ReturnType<typeof useCvScreening>;
  onUnauthorized: () => void;
}) {
  const router = useRouter();
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [aiScoreDetail, setAiScoreDetail] = useState<ApplicationAiScoreResponse | null>(null);
  const [loadingAiScore, setLoadingAiScore] = useState(false);
  const [selectedScoreCriterion, setSelectedScoreCriterion] = useState<ScoreCriterionKey>("skills");
  const [rubricOpen, setRubricOpen] = useState(false);
  const rubricCloseTimer = useRef<number | null>(null);

  // Dropdown states
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  /** "Top N": ranks by embedding similarity to the JD first, then only AI-scores
   * that shortlist -- both cheaper (fewer AI_CV_MATCHING credits) and much
   * faster than scoring every applicant. */
  const [scoreLimit, setScoreLimit] = useState<10 | 20>(10);

  // Per-company AI screening config, organized by the same 4 rubric groups
  // shown in an AI score's breakdown (skills/experience/projects/education)
  // -- editable right here via the gear button so recruiters don't have to
  // leave this screen to go to Cài đặt. Shape/behaviour shared with the
  // Cài đặt tab via CvScreeningConfigForm so the two never drift apart.
  const [aiConfigDialogOpen, setAiConfigDialogOpen] = useState(false);
  const [aiConfigSaving, setAiConfigSaving] = useState(false);
  const [aiConfigValues, setAiConfigValues] = useState<CvScreeningConfigFormValues>({
    skillsInstructions: null,
    experienceInstructions: null,
    projectsInstructions: null,
    ignoreEducationRequirement: false,
    defaultTopN: null,
    minSimilarityScore: null,
  });

  const loadAiConfig = useCallback(async () => {
    if (!token) return;
    try {
      const config = await getCvScreeningConfig(token);
      setAiConfigValues(config);
      // Pre-fill the Top 10/Top 20 run toggle from the company default so
      // recruiters don't have to reselect it every run. Only 10/20 fit this
      // screen's two-button toggle -- a default of 50/"Tất cả" only applies
      // when `limit` is omitted entirely (handled server-side).
      if (config.defaultTopN === 10 || config.defaultTopN === 20) {
        setScoreLimit(config.defaultTopN);
      }
    } catch {
      // Non-critical: the hardcoded defaults still work fine.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    void loadAiConfig();
  }, [loadAiConfig]);

  const handleSaveAiConfig = async () => {
    if (!token) return;
    setAiConfigSaving(true);
    try {
      const saved = await updateCvScreeningConfig(
        {
          skillsInstructions: aiConfigValues.skillsInstructions?.trim() || null,
          experienceInstructions: aiConfigValues.experienceInstructions?.trim() || null,
          projectsInstructions: aiConfigValues.projectsInstructions?.trim() || null,
          ignoreEducationRequirement: aiConfigValues.ignoreEducationRequirement,
          defaultTopN: aiConfigValues.defaultTopN,
          minSimilarityScore: aiConfigValues.minSimilarityScore,
        },
        token,
      );
      setAiConfigValues(saved);
      if (saved.defaultTopN === 10 || saved.defaultTopN === 20) {
        setScoreLimit(saved.defaultTopN);
      }
      setAiConfigDialogOpen(false);
      void Swal.fire({
        icon: "success",
        title: "Đã lưu cấu hình AI lọc CV!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err: any) {
      const isForbidden = err instanceof ApiError && err.status === 403;
      void Swal.fire({
        icon: "error",
        title: isForbidden ? "Không đủ quyền" : "Lỗi lưu cấu hình",
        text: isForbidden
          ? "Chỉ quản trị viên công ty mới có quyền chỉnh cấu hình AI lọc CV."
          : "Không thể lưu cấu hình. Vui lòng thử lại.",
      });
    } finally {
      setAiConfigSaving(false);
    }
  };

  const {
    selectedJobId,
    setSelectedJobId,
    progress,
    results,
    isRunning,
    isCancelling,
    error,
    hasFiltered,
    startScreening,
    cancelScreening,
  } = cvScreening;

  useEffect(() => {
    if (rubricCloseTimer.current !== null) {
      window.clearTimeout(rubricCloseTimer.current);
      rubricCloseTimer.current = null;
    }
    setSelectedScoreCriterion("skills");
    setRubricOpen(false);
  }, [activeApplicationId]);

  const openRubric = () => {
    if (rubricCloseTimer.current !== null) {
      window.clearTimeout(rubricCloseTimer.current);
      rubricCloseTimer.current = null;
    }
    setRubricOpen(true);
  };

  const scheduleRubricClose = () => {
    if (rubricCloseTimer.current !== null) {
      window.clearTimeout(rubricCloseTimer.current);
    }
    rubricCloseTimer.current = window.setTimeout(() => {
      setRubricOpen(false);
      rubricCloseTimer.current = null;
    }, 120);
  };

  useEffect(
    () => () => {
      if (rubricCloseTimer.current !== null) {
        window.clearTimeout(rubricCloseTimer.current);
      }
    },
    [],
  );

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
        if (err instanceof ApiError && err.status === 401) {
          if (active) {
            setActiveApplicationId(null);
            onUnauthorized();
          }
          return;
        }

        console.error("Failed to load AI score detail:", err);
        if (active) {
          setActiveApplicationId(null);
          window.setTimeout(() => {
            void Swal.fire({
              icon: "error",
              title: locale === "vi" ? "Lỗi tải đánh giá" : "Failed to load evaluation",
              text:
                locale === "vi"
                  ? "Không thể tải chi tiết đánh giá từ hệ thống."
                  : "Could not fetch evaluation details.",
            });
          }, 0);
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
  }, [activeApplicationId, token, locale, onUnauthorized]);

  const handleViewCv = async (applicationId: string, customCvUrl?: string | null) => {
    if (token) {
      void onStatusChange(applicationId, "VIEWED");
    }

    if (customCvUrl) {
      const isApiUrl = customCvUrl.startsWith("/") || customCvUrl.includes("/api/");
      if (!isApiUrl) {
        window.open(customCvUrl, "_blank");
        return;
      }
    }

    const url = customCvUrl || getApplicationCvUrl(applicationId);
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

  const scoreMetrics = aiScoreDetail
    ? [
        {
          key: "skills" as const,
          label: "Kỹ năng",
          score: aiScoreDetail.skillScore,
          maximum: 40,
        },
        {
          key: "experience" as const,
          label: "Kinh nghiệm",
          score: aiScoreDetail.experienceScore,
          maximum: 30,
        },
        {
          key: "projects" as const,
          label: "Dự án liên quan",
          score: aiScoreDetail.projectScore,
          maximum: 20,
        },
        {
          key: "education" as const,
          label: "Học vấn",
          score: aiScoreDetail.educationScore,
          maximum: 10,
        },
      ]
    : [];
  const selectedMetric = scoreMetrics.find((metric) => metric.key === selectedScoreCriterion);
  const selectedBreakdown = aiScoreDetail?.criteriaBreakdown?.find(
    (criterion) => criterion.key === selectedScoreCriterion,
  );
  const selectedRubric = aiScoreDetail?.evaluationRubric?.find(
    (criterion) => criterion.key === selectedScoreCriterion,
  );

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
                      aria-label={locale === "vi" ? "Tìm tin tuyển dụng" : "Search jobs"}
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

            {/* Embedding pre-filter shortlist size: ranks all applicants by CV/JD
                similarity first, then only sends this many to the slow, metered AI
                scorer. */}
            <div
              className="flex h-11 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-1"
              role="group"
              aria-label="Số lượng ứng viên chấm điểm"
            >
              {(
                [
                  { value: 10 as const, label: "Top 10" },
                  { value: 20 as const, label: "Top 20" },
                ] satisfies Array<{ value: 10 | 20; label: string }>
              ).map((option) => (
                <button
                  key={option.label}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setScoreLimit(option.value)}
                  className={cn(
                    "h-full cursor-pointer rounded-md px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    scoreLimit === option.value
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label="Cấu hình AI lọc CV"
              title="Cấu hình AI lọc CV"
              onClick={() => setAiConfigDialogOpen(true)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <Gear size={18} />
            </button>

            <Button
              onClick={() => void startScreening(scoreLimit)}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void cancelScreening()}
                    disabled={isCancelling}
                    className="cursor-pointer border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCancelling ? (
                      <>
                        <CircleNotch className="mr-1.5 size-4 animate-spin" />
                        {locale === "vi" ? "Đang hủy..." : "Cancelling..."}
                      </>
                    ) : locale === "vi" ? (
                      "Hủy lọc CV"
                    ) : (
                      "Cancel"
                    )}
                  </Button>
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
                    onClick={() => void startScreening(scoreLimit)}
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
                      onClick={() =>
                        router.push(`/recruiter/candidates/${cand.applicationId}/evaluation`)
                      }
                      aria-label="Xem đánh giá chi tiết"
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                      title="Xem đánh giá chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleViewCv(cand.applicationId, cand.cvFileUrl)}
                      aria-label="Xem CV"
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
        <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[850px] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-xl">
          {loadingAiScore && (
            <output
              className="flex min-h-[360px] flex-col items-center justify-center gap-3"
              aria-live="polite"
            >
              <CircleNotch className="size-7 animate-spin text-emerald-600" aria-hidden="true" />
              <span className="text-sm font-medium text-slate-500">
                Đang tải đánh giá chi tiết...
              </span>
            </output>
          )}

          {!loadingAiScore && aiScoreDetail && (
            <>
              <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-5 pr-14 text-left">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-xl font-semibold text-slate-950">
                      Đánh giá ứng viên
                    </DialogTitle>
                    <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="font-medium text-slate-700">
                        {aiScoreDetail.candidateName}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        •
                      </span>
                      <span>{aiScoreDetail.jobTitle}</span>
                    </DialogDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <details
                      open={rubricOpen}
                      className="relative"
                      aria-label="Điều khiển tiêu chí đánh giá"
                    >
                      <summary
                        className="upnext-focus inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors marker:hidden hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        aria-label="Xem toàn bộ tiêu chí đánh giá"
                        aria-haspopup="dialog"
                        aria-expanded={rubricOpen}
                        aria-controls="evaluation-rubric-panel"
                        onClick={(event) => {
                          event.preventDefault();
                          setRubricOpen((open) => !open);
                        }}
                        onMouseEnter={openRubric}
                        onMouseLeave={scheduleRubricClose}
                        onFocus={openRubric}
                        onBlur={scheduleRubricClose}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            setRubricOpen(false);
                          }
                        }}
                      >
                        <Info size={19} aria-hidden="true" />
                      </summary>

                      {rubricOpen && (
                        <dialog
                          open
                          id="evaluation-rubric-panel"
                          aria-label="Toàn bộ tiêu chí đánh giá"
                          className="absolute top-11 right-0 z-[120] max-h-[62vh] w-[min(34rem,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xl"
                          onMouseEnter={openRubric}
                          onMouseLeave={scheduleRubricClose}
                          onFocus={openRubric}
                          onBlur={scheduleRubricClose}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setRubricOpen(false);
                            }
                          }}
                        >
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-950">
                                Tiêu chí đánh giá CV
                              </h3>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Tổng 100 điểm. Không có bằng chứng trong CV thì không cộng điểm.
                              </p>
                            </div>
                            <button
                              type="button"
                              className="upnext-focus -mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              aria-label="Đóng tiêu chí đánh giá"
                              onClick={() => setRubricOpen(false)}
                            >
                              <X size={16} aria-hidden="true" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            {aiScoreDetail.evaluationRubric?.map((criterion) => (
                              <section
                                key={criterion.key}
                                aria-labelledby={`rubric-${criterion.key}`}
                              >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <h4
                                    id={`rubric-${criterion.key}`}
                                    className="text-xs font-semibold text-slate-900"
                                  >
                                    {criterion.label}
                                  </h4>
                                  <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                                    {criterion.maxScore} điểm
                                  </span>
                                </div>
                                <ul className="space-y-2">
                                  {criterion.criteria.map((item) => (
                                    <li
                                      key={item.key}
                                      className="rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <span className="text-xs font-medium text-slate-800">
                                          {item.label}
                                        </span>
                                        <span className="shrink-0 text-xs font-semibold text-emerald-700 tabular-nums">
                                          Tối đa {item.maxScore} điểm
                                        </span>
                                      </div>
                                      <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                        {item.description}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            ))}
                          </div>
                        </dialog>
                      )}
                    </details>

                    <Badge
                      tone="neutral"
                      className={cn(
                        "w-fit rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums",
                        getScoreColorClass(aiScoreDetail.finalScore),
                      )}
                      aria-label={`Độ phù hợp ${aiScoreDetail.finalScore}%`}
                    >
                      {aiScoreDetail.finalScore}% phù hợp
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="h-0 min-h-0 flex-1" data-testid="evaluation-scroll-area">
                <div className="space-y-6 p-5 sm:p-6">
                  <section aria-labelledby="evaluation-overview-heading" className="space-y-3">
                    <h3
                      id="evaluation-overview-heading"
                      className="text-sm font-semibold text-slate-950"
                    >
                      Tổng quan
                    </h3>
                    <p className="text-sm leading-6 text-slate-600">{aiScoreDetail.summary}</p>
                  </section>

                  <Separator />

                  <section aria-labelledby="evaluation-score-heading" className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <h3
                        id="evaluation-score-heading"
                        className="text-sm font-semibold text-slate-950"
                      >
                        Chi tiết điểm
                      </h3>
                      <span className="text-xs text-slate-500">Tổng trọng số 100 điểm</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {scoreMetrics.map((metric) => {
                        const percentage = Math.round((metric.score / metric.maximum) * 100);
                        const selected = selectedScoreCriterion === metric.key;

                        return (
                          <Card
                            key={metric.key}
                            className={cn(
                              "overflow-hidden shadow-none transition-colors",
                              selected ? "border-emerald-400 bg-emerald-50/40" : "border-slate-200",
                            )}
                          >
                            <button
                              type="button"
                              className="upnext-focus block w-full rounded-xl text-left"
                              aria-pressed={selected}
                              aria-controls="score-criterion-explanation"
                              onClick={() => setSelectedScoreCriterion(metric.key)}
                            >
                              <CardContent className="space-y-3 p-4">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-xs font-medium text-slate-500">
                                    {metric.label}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                    {metric.score}
                                    <span className="font-normal text-slate-400">
                                      /{metric.maximum}
                                    </span>
                                  </span>
                                </div>
                                <progress
                                  className="sr-only"
                                  aria-label={`${metric.label}: ${metric.score} trên ${metric.maximum} điểm`}
                                  max={metric.maximum}
                                  value={metric.score}
                                />
                                <div
                                  className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                                  aria-hidden="true"
                                >
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      getProgressBarColor(percentage),
                                    )}
                                    style={{
                                      width: `${Math.min(100, Math.max(0, percentage))}%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={cn(
                                    "block text-[11px] font-medium",
                                    selected ? "text-emerald-700" : "text-slate-400",
                                  )}
                                >
                                  {selected ? "Đang xem lý do" : "Xem lý do chấm điểm"}
                                </span>
                              </CardContent>
                            </button>
                          </Card>
                        );
                      })}
                    </div>

                    <div
                      id="score-criterion-explanation"
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                      aria-live="polite"
                    >
                      {selectedBreakdown && selectedMetric ? (
                        <div className="space-y-4">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-950">
                                Vì sao {selectedMetric.label.toLocaleLowerCase("vi")} được{" "}
                                {selectedMetric.score}/{selectedMetric.maximum} điểm?
                              </h4>
                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                {selectedBreakdown.summary}
                              </p>
                            </div>
                            <Badge
                              tone="neutral"
                              className="w-fit shrink-0 rounded-md tabular-nums"
                            >
                              Trừ {Math.max(0, selectedMetric.maximum - selectedMetric.score)} điểm
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {selectedBreakdown.items.map((item) => {
                              const rubricItem = selectedRubric?.criteria.find(
                                (criterion) => criterion.key === item.key,
                              );
                              const maximum = rubricItem?.maxScore ?? item.awardedScore;
                              const deduction = Math.max(
                                0,
                                Math.round((maximum - item.awardedScore) * 100) / 100,
                              );

                              return (
                                <article
                                  key={item.key}
                                  className="rounded-lg border border-slate-200 bg-white p-3.5"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                      <h5 className="text-xs font-semibold text-slate-900">
                                        {rubricItem?.label ?? item.key}
                                      </h5>
                                      <span className="mt-1 block text-xs text-slate-500 tabular-nums">
                                        Đạt {item.awardedScore}/{maximum} điểm
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "rounded-md border px-2 py-1 text-xs font-semibold tabular-nums",
                                        deduction > 0
                                          ? "border-rose-200 bg-rose-50 text-rose-700"
                                          : "border-emerald-200 bg-emerald-50 text-emerald-700",
                                      )}
                                    >
                                      {deduction > 0 ? `-${deduction} điểm` : "Không bị trừ"}
                                    </span>
                                  </div>
                                  <p className="mt-3 text-xs leading-5 text-slate-700">
                                    <span className="font-semibold text-slate-900">Lý do: </span>
                                    {item.reason}
                                  </p>
                                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                                    <span className="font-semibold text-slate-700">
                                      Bằng chứng CV:{" "}
                                    </span>
                                    {item.evidence}
                                  </p>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <Info className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                              Chưa có giải thích chi tiết
                            </h4>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              Kết quả này được tạo bằng phiên bản chấm điểm cũ. Hãy chạy “Lọc xếp
                              hạng” lại để xem lý do cộng và trừ điểm cho từng hạng mục.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <section
                    aria-labelledby="evaluation-skills-heading"
                    className="grid gap-3 md:grid-cols-2"
                  >
                    <h3 id="evaluation-skills-heading" className="sr-only">
                      Đối chiếu kỹ năng
                    </h3>
                    <Card className="border-slate-200 shadow-none">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">Kỹ năng phù hợp</h4>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {aiScoreDetail.matchedSkills.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {aiScoreDetail.matchedSkills.length > 0 ? (
                            aiScoreDetail.matchedSkills.map((skill) => (
                              <Badge key={skill} tone="success" className="rounded-md px-2.5 py-1">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">Chưa ghi nhận</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-none">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold text-slate-900">
                            Kỹ năng cần bổ sung
                          </h4>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {aiScoreDetail.missingSkills.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {aiScoreDetail.missingSkills.length > 0 ? (
                            aiScoreDetail.missingSkills.map((skill) => (
                              <Badge key={skill} tone="neutral" className="rounded-md px-2.5 py-1">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">Không có</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  <section className="grid gap-3 md:grid-cols-2" aria-label="Nhận xét chi tiết">
                    <Card className="border-slate-200 shadow-none">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <CheckCircle
                            className="size-5 text-emerald-600"
                            weight="fill"
                            aria-hidden="true"
                          />
                          <h3 className="text-sm font-semibold text-slate-900">Điểm mạnh</h3>
                        </div>
                        {aiScoreDetail.strengths.length > 0 ? (
                          <ul className="space-y-2 pl-5 text-sm leading-5 text-slate-600 marker:text-slate-300">
                            {aiScoreDetail.strengths.map((strength) => (
                              <li key={strength} className="list-disc pl-1">
                                {strength}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500">Chưa ghi nhận</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-none">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <WarningCircle
                            className="size-5 text-amber-600"
                            weight="fill"
                            aria-hidden="true"
                          />
                          <h3 className="text-sm font-semibold text-slate-900">Điểm cần lưu ý</h3>
                        </div>
                        {aiScoreDetail.weaknesses.length > 0 ? (
                          <ul className="space-y-2 pl-5 text-sm leading-5 text-slate-600 marker:text-slate-300">
                            {aiScoreDetail.weaknesses.map((weakness) => (
                              <li key={weakness} className="list-disc pl-1">
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500">Không có</p>
                        )}
                      </CardContent>
                    </Card>
                  </section>

                  <Card className="border-indigo-100 bg-indigo-50/40 shadow-none">
                    <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                      <Badge tone="premium" className="w-fit shrink-0 rounded-md px-2.5 py-1">
                        Khuyến nghị
                      </Badge>
                      <p className="text-sm leading-6 font-medium text-slate-800">
                        {aiScoreDetail.recommendation}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>

              <DialogFooter className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex sm:px-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveApplicationId(null)}
                  className="rounded-lg px-4 font-medium"
                >
                  Đóng
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewCv(aiScoreDetail.applicationId, aiScoreDetail.cvFileUrl)}
                  className="rounded-lg border-slate-200 px-4 font-medium"
                >
                  <FileArrowDown aria-hidden="true" />
                  Xem CV
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction(aiScoreDetail.applicationId, "REJECTED")}
                  disabled={saving}
                  className="rounded-lg px-4"
                >
                  <XCircle aria-hidden="true" />
                  Từ chối
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction(aiScoreDetail.applicationId, "INTERVIEWING")}
                  disabled={saving}
                  className="rounded-lg px-4"
                >
                  <CheckCircle aria-hidden="true" />
                  Mời phỏng vấn
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI CV screening config -- same fields as Cài đặt > Cấu hình AI lọc
          CV, editable right here so recruiters don't have to leave this
          screen. */}
      <Dialog open={aiConfigDialogOpen} onOpenChange={setAiConfigDialogOpen}>
        <DialogContent className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Cấu hình AI lọc CV
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Thang điểm chấm luôn cố định (tổng 100đ: kỹ năng 40, kinh nghiệm 30, dự án 20, học vấn
              10) -- các thiết lập dưới đây chỉ bổ sung thêm bối cảnh và mặc định cho mỗi lượt lọc
              của công ty bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <CvScreeningConfigForm
              idPrefix="cv_ranking_ai"
              values={aiConfigValues}
              onChange={(patch) => setAiConfigValues((prev) => ({ ...prev, ...patch }))}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAiConfigDialogOpen(false)}
              disabled={aiConfigSaving}
              className="rounded-lg px-4"
            >
              Hủy
            </Button>
            <Button
              onClick={() => void handleSaveAiConfig()}
              disabled={aiConfigSaving}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700"
            >
              {aiConfigSaving && <CircleNotch className="size-4 animate-spin" />}
              Lưu cấu hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
