"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useRef } from "react";
import type { ReactNode } from "react";

import { checkAppliedJob } from "@/features/candidate/api/profile";
import { useCandidateCompanyFollows } from "@/features/candidate/company-follows";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";
import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { formatRelativeTime } from "@/shared/lib/date";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { toast } from "@/shared/ui/toast";

import {
  getPublicJobs,
  getPublicJobDetail,
  recordPublicJobView,
  type PublicJob,
} from "../../home/api";
import { getJobPreviewDescription } from "../../home/job-preview-description";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  Copy,
  FileText,
  Facebook,
  Linkedin,
  Mail,
  MapPin,
  Monitor,
  PaperPlaneTilt,
  ShareNetwork,
  ShieldCheck,
  Star,
  UsersRound,
} from "../../home/marketing-icons";
import { useAnchoredJobPreview } from "../../home/use-anchored-job-preview";
import { useJobPreviewDetail } from "../../home/use-job-preview-detail";
import { PublicFooter } from "../../shared/public-footer";
import { PublicHeader } from "../../shared/public-header";
import { startJobApplication } from "../start-job-application";
import { ApplyModal } from "./apply-modal";
import { jobs, type Job, formatJobSalaryDisplay } from "./jobs-page";

import "../jobs-page.css";

type PublicJobDetailPageProps = {
  path: string;
  navigate: (path: string) => void;
};

const visitorKeyStorageName = "upnext:visitor-key:v1";
const recordedJobViews = new Set<string>();

function getOrCreateVisitorKey() {
  if (typeof window === "undefined") return undefined;

  try {
    const existingKey = window.localStorage.getItem(visitorKeyStorageName);
    if (existingKey) return existingKey;

    const visitorKey =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(visitorKeyStorageName, visitorKey);
    return visitorKey;
  } catch {
    // Privacy mode or a blocked storage area should never prevent viewing a job.
    return undefined;
  }
}

function getCleanLeadText(html: string) {
  if (!html) return "";
  let text = html.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, "");
  text = text.replace(/<[^>]*>/gi, "");
  return text.replace(/\s+/g, " ").trim();
}
function getCleanHtml(html: string) {
  if (!html) return "";

  let cleaned = html
    .replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, "")
    .replace(/<details[^>]*>/gi, "")
    .replace(/<\/details>/gi, "");

  const headings = [
    "Mô tả công việc",
    "Yêu cầu công việc",
    "Yêu cầu ứng viên",
    "Quyền lợi",
    "Phúc lợi",
    "Quyền lợi / Phúc lợi",
  ];
  for (const h of headings) {
    cleaned = cleaned
      .replace(new RegExp(`<h[1-6][^>]*>\\s*${h}\\s*<\\/h[1-6]>`, "gi"), "")
      .replace(
        new RegExp(`<p[^>]*>\\s*(?:<strong[^>]*>)?\\s*${h}\\s*(?:<\\/strong>)?\\s*<\\/p>`, "gi"),
        "",
      )
      .replace(new RegExp(`<li[^>]*>\\s*${h}\\s*<\\/li>`, "gi"), "");
  }

  cleaned = cleaned.trim();
  if (!cleaned) return "";

  const hasHtmlTags = /<(?:p|ul|ol|li|div|h[1-6]|br)[^>]*>/i.test(cleaned);
  if (hasHtmlTags) {
    return cleaned;
  }

  const rawLines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (rawLines.length === 0) return "";

  let resultHtml = "";
  let inList = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]!;
    const isExplicitBullet = /^[-•*]\s+/.test(line);
    const isImplicitBullet =
      !isExplicitBullet &&
      (i > 0 || rawLines.length > 2) &&
      !line.endsWith(":") &&
      line.length > 5 &&
      !/^(mô tả|yêu cầu|quyền lợi)/i.test(line);

    if (isExplicitBullet || isImplicitBullet) {
      if (!inList) {
        resultHtml += "<ul>";
        inList = true;
      }
      const itemText = line.replace(/^[-•*]\s+/, "");
      resultHtml += `<li>${itemText}</li>`;
    } else {
      if (inList) {
        resultHtml += "</ul>";
        inList = false;
      }
      if (line.endsWith(":") || (line.length < 40 && !line.includes("."))) {
        resultHtml += `<h3>${line.replace(/:$/, "")}</h3>`;
      } else {
        resultHtml += `<p>${line}</p>`;
      }
    }
  }

  if (inList) {
    resultHtml += "</ul>";
  }

  return resultHtml;
}

function getJobId(path: string) {
  return decodeURIComponent(path.split("/").filter(Boolean)[1] ?? "");
}

function formatJobDetailDeadline(expiredAt?: string | null) {
  if (!expiredAt) {
    return { date: "Không giới hạn", remainingText: "Không giới hạn" };
  }

  const d = new Date(expiredAt);
  const time = d.getTime();
  if (Number.isNaN(time)) {
    return { date: "Chưa cập nhật", remainingText: "Chưa cập nhật" };
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  const remainingMs = time - Date.now();
  if (remainingMs < 0) {
    return { date: dateFormatted, remainingText: "Đã hết hạn" };
  }

  const days = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  return { date: dateFormatted, remainingText: `còn ${days} ngày` };
}

function LogoMark({ job, size = "normal" }: { job: Job; size?: "normal" | "large" }) {
  const [failed, setFailed] = useState(false);
  const className = `jobs-logo-mark${size === "large" ? " is-large" : ""}`;

  if (!job.logo || failed) {
    return (
      <span className={`${className} jobs-logo-fallback`} style={{ color: job.logoColor }}>
        {job.company.charAt(0)}
      </span>
    );
  }

  return (
    <span className={className}>
      <img
        src={job.logo}
        alt={`Logo ${job.company}`}
        width={size === "large" ? 72 : 48}
        height={size === "large" ? 72 : 48}
        className="size-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function mapPublicJobToJob(job: PublicJob): Job {
  const isRemote =
    job.employmentType?.name.toLowerCase().includes("remote") ||
    job.title.toLowerCase().includes("remote");
  const isHighSalary =
    (job.salaryMin && job.salaryMin >= 30000000) || (job.salaryMax && job.salaryMax >= 30000000);

  const categories: string[] = [];
  if (isRemote) categories.push("remote");
  if (isHighSalary) categories.push("high-salary");
  const categoryCode = job.jobCategory?.name.toLowerCase() || "";
  if (categoryCode.includes("frontend")) categories.push("frontend");
  if (categoryCode.includes("backend")) categories.push("backend");
  if (categoryCode.includes("mobile")) categories.push("mobile");
  if (categoryCode.includes("data") || categoryCode.includes("ai")) {
    categories.push("data-ai");
  }
  if (categoryCode.includes("devops")) categories.push("devops");
  if (categoryCode.includes("qa") || categoryCode.includes("test")) {
    categories.push("qa");
  }

  const realLocation =
    job.jobPostLocations?.[0]?.jobLocation?.city ||
    job.jobPostLocations?.[0]?.jobLocation?.address ||
    "Việt Nam";

  return {
    id: job.id,
    title: job.title,
    company: job.company?.name || "UpNext Partner",
    ...(job.company?.id ? { companyId: job.company.id } : {}),
    companySlug: job.company?.slug || job.company?.id || "",
    companySize: job.company?.companySize || "",
    companyAddress: job.company?.address || "",
    logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
    logoColor: "#10b981",
    verified: job.company?.verificationStatus === "VERIFIED",
    salary: formatJobSalaryDisplay(job),
    location: realLocation,
    mode:
      job.jobPostLocations?.[0]?.jobLocation?.workingModel ||
      job.employmentType?.name ||
      "Full-time",
    level: job.experienceLevel?.name || "Kinh nghiệm",
    type: job.employmentType?.name || "Full-time",
    posted:
      job.publishedAt || job.createdAt
        ? formatRelativeTime(job.publishedAt || job.createdAt, "vi")
        : "Mới đăng",
    applicants: job.vacanciesCount ?? (job as any).numberOfRecruits ?? 1,
    vacanciesCount: job.vacanciesCount ?? (job as any).numberOfRecruits ?? 1,
    tags:
      job.jobPostSkills && job.jobPostSkills.length > 0
        ? job.jobPostSkills.map((s) => s.skill.name)
        : ([job.jobCategory?.name, job.employmentType?.name, job.experienceLevel?.name].filter(
            Boolean,
          ) as string[]),
    description: job.description || "",
    categories,
    categoryName: job.jobCategory?.name,
    urgent: false,
    featured: false,
    requirements: job.requirements,
    benefits: job.benefits,
    expiredAt: job.expiredAt,
  };
}

export function PublicJobDetailPage({ path, navigate }: PublicJobDetailPageProps) {
  const locale = useLocale();
  const t = useTranslations("PublicJobs.share");
  const jobId = getJobId(path);

  const { data: singleJobDetail, isPending: isSingleJobPending } = useQuery({
    queryKey: ["public-job-detail", jobId],
    queryFn: () => getPublicJobDetail(jobId),
    enabled: Boolean(jobId),
  });

  const { data: apiJobsData, isPending: isJobsListPending } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
  });

  const jobsList = useMemo(() => {
    if (!apiJobsData) return [];
    return apiJobsData.map(mapPublicJobToJob);
  }, [apiJobsData]);

  const job = useMemo(() => {
    if (singleJobDetail) {
      return mapPublicJobToJob(singleJobDetail);
    }
    if (apiJobsData) {
      const found = jobsList.find((item) => item.id === jobId);
      if (found) return found;
    }
    const staticMatch = jobs.find((j) => j.id === jobId);
    if (staticMatch) return staticMatch;
    return null;
  }, [singleJobDetail, apiJobsData, jobsList, jobId]);

  const isDataLoading = (isSingleJobPending || isJobsListPending) && !job;
  const hasResolvedRequestedJob = Boolean(
    singleJobDetail || apiJobsData?.some((item) => item.id === jobId),
  );
  const deadlineInfo = formatJobDetailDeadline(job?.expiredAt);
  const {
    isPending: isSavedJobPending,
    isSessionResolved: isSavedJobsSessionResolved,
    savedJobIds,
    toggleSaveJob,
  } = useCandidateSavedJobs();
  const { session } = useCandidateProfileWorkspace();
  const {
    followedCompanyIds,
    isPending: isCompanyFollowPending,
    isSessionResolved: isCompanyFollowSessionResolved,
    setCompanyFollowing,
    toggleFollowCompany,
  } = useCandidateCompanyFollows();

  const companyId = singleJobDetail?.company?.id || job?.companyId;
  const isCompanyFollowed = companyId ? followedCompanyIds.includes(companyId) : false;
  const isFollowBusy = companyId ? isCompanyFollowPending(companyId) : false;

  function handleToggleFollowCompany() {
    if (!companyId) {
      toast.error("Không tìm thấy thông tin công ty.");
      return;
    }
    const companyName = job?.company || "công ty";
    const didStart = toggleFollowCompany(companyId, {
      onError: () => toast.error("Không thể cập nhật theo dõi. Vui lòng thử lại."),
      onSuccess: (isFollowing) => {
        const toastId = `follow-company-${companyId}`;
        toast.success(
          isFollowing ? `Đã theo dõi ${companyName}` : `Đã bỏ theo dõi ${companyName}`,
          {
            id: toastId,
            action: {
              label: "Hoàn tác",
              onClick: () => {
                toast.dismiss(toastId);
                setCompanyFollowing(companyId, !isFollowing, {
                  onError: () => toast.error("Không thể cập nhật theo dõi. Vui lòng thử lại."),
                });
              },
            },
          },
        );
      },
    });

    if (!didStart) {
      const redirectPath = (path || (jobId ? `/jobs/${jobId}` : "/jobs")).replace(
        /^\/(?:vi|en)(?=\/|$)/,
        "",
      );
      const redirect = `${redirectPath}${window.location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }

  const saved = Boolean(job && savedJobIds.includes(job.id));

  const { data: appliedData } = useQuery({
    queryKey: ["check-applied-job", job?.id, session?.user.id],
    queryFn: () => checkAppliedJob(session!.accessToken, job!.id),
    enabled: Boolean(session && session.accessToken && job?.id),
  });

  const hasApplied = appliedData?.applied === true;
  const [isOpenApply, setIsOpenApply] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const shareTitle = job ? t("message", { jobTitle: job.title, company: job.company }) : "";
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const encodedShareTitle = encodeURIComponent(shareTitle);

  async function copyJobLink() {
    const currentShareUrl = shareUrl || window.location.href;

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(currentShareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = currentShareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.append(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("Clipboard copy was rejected.");
      }
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  async function shareJob() {
    if (!job) return;
    const currentShareUrl = shareUrl || window.location.href;

    if (!navigator.share) {
      await copyJobLink();
      return;
    }

    try {
      await navigator.share({
        title: job.title,
        text: shareTitle,
        url: currentShareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(t("shareFailed"));
    }
  }

  useEffect(() => {
    if (!hasResolvedRequestedJob || !job?.id || recordedJobViews.has(job.id)) return;

    recordedJobViews.add(job.id);
    void recordPublicJobView(job.id, getOrCreateVisitorKey()).catch(() => {
      recordedJobViews.delete(job.id);
    });
  }, [hasResolvedRequestedJob, job?.id]);

  function handleApply() {
    if (!job) return;
    startJobApplication({
      jobId: job.id,
      locale,
      navigate,
      onAuthenticated: () => setIsOpenApply(true),
    });
  }

  const similarJobs = useMemo(() => {
    if (!job) return [];
    const others = jobsList.filter((item) => item.id !== job.id);

    const sameCategoryName = job.categoryName
      ? others.filter(
          (item) =>
            item.categoryName &&
            item.categoryName.toLowerCase() === job.categoryName!.toLowerCase(),
        )
      : [];

    if (sameCategoryName.length >= 4) return sameCategoryName.slice(0, 4);

    const usedIds = new Set(sameCategoryName.map((j) => j.id));
    const bySkills = others.filter(
      (item) => !usedIds.has(item.id) && item.tags?.some((t) => job.tags?.includes(t)),
    );

    let result = [...sameCategoryName, ...bySkills];
    if (result.length >= 4) return result.slice(0, 4);

    const resultIds = new Set(result.map((j) => j.id));
    const remaining = others.filter((item) => !resultIds.has(item.id));
    result = [...result, ...remaining];

    return result.slice(0, 4);
  }, [job, jobsList]);

  if (isDataLoading) {
    return (
      <main className="jobs-page job-detail-page">
        <PublicHeader navigate={navigate} />
        <section className="job-detail-shell flex min-h-[400px] flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="font-medium text-slate-600">Đang tải thông tin tin tuyển dụng...</p>
        </section>
        <PublicFooter navigate={navigate} />
      </main>
    );
  }

  if (!job) {
    return (
      <main className="jobs-page job-detail-page">
        <PublicHeader navigate={navigate} />
        <section className="job-detail-shell flex min-h-[400px] flex-col items-center justify-center py-20 text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">Không tìm thấy tin tuyển dụng</h1>
          <p className="mb-6 text-slate-600">
            Tin tuyển dụng này có thể đã hết hạn hoặc bị gỡ khỏi hệ thống.
          </p>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            onClick={() => navigate("/jobs")}
          >
            Quay lại danh sách việc làm
          </button>
        </section>
        <PublicFooter navigate={navigate} />
      </main>
    );
  }

  return (
    <main className="jobs-page job-detail-page">
      <PublicHeader navigate={navigate} />

      <section className="job-detail-shell">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: "Trang chủ", onClick: () => navigate("/") },
            { label: "Việc làm IT", onClick: () => navigate("/jobs") },
            { label: job.title },
          ]}
        />

        <section className="job-detail-layout">
          <article className="job-detail-main">
            <section className="job-detail-card job-detail-hero-card">
              <div className="job-detail-company-row">
                <LogoMark job={job} size="large" />
                <div>
                  <button
                    type="button"
                    className="job-detail-company-name"
                    onClick={() => {
                      if (job.companySlug) {
                        navigate(`/companies/${encodeURIComponent(job.companySlug)}`);
                      } else {
                        navigate("/companies");
                      }
                    }}
                  >
                    {job.company}
                  </button>
                  <p>
                    {job.categories
                      .filter((c) => c !== "high-salary" && c !== "remote")
                      .join(" • ") || "Công nghệ thông tin"}
                  </p>
                </div>
                {job.verified && (
                  <span className="job-detail-verified">
                    <ShieldCheck size={15} weight="fill" /> Đã xác thực
                  </span>
                )}
              </div>

              <div className="job-detail-title-row">
                <h1>{job.title}</h1>
                {(job.featured || job.urgent) && (
                  <span className={job.urgent ? "is-urgent" : ""}>
                    <Star size={14} weight="fill" />
                    {job.urgent ? "Tuyển gấp" : "Hot"}
                  </span>
                )}
              </div>

              {job.description && (
                <p className="job-detail-lead">{getCleanLeadText(job.description)}</p>
              )}

              <div className="job-detail-salary-row">
                <Coins size={24} weight="fill" />
                <strong>{job.salary}</strong>
                <i aria-hidden="true" />
                <span>Thỏa thuận theo năng lực</span>
              </div>

              <div className="job-detail-meta-grid">
                <InfoTile icon={<MapPin size={20} />} label="Địa điểm" value={job.location} />
                <InfoTile icon={<Monitor size={20} />} label="Hình thức" value={job.mode} />
                <InfoTile
                  icon={<BriefcaseBusiness size={20} />}
                  label="Cấp bậc"
                  value={job.level}
                />
                <InfoTile icon={<Clock size={20} />} label="Đăng tuyển" value={job.posted} />
                <InfoTile
                  icon={<UsersRound size={20} />}
                  label="Số lượng tuyển"
                  value={`Số lượng tuyển: ${job.vacanciesCount ?? job.applicants ?? 1}`}
                />
                <InfoTile
                  icon={<Calendar size={20} />}
                  label="Trạng thái"
                  value="Đang nhận hồ sơ"
                />
              </div>

              {job.tags && job.tags.length > 0 && (
                <div className="job-detail-tags" aria-label="Kỹ năng liên quan">
                  {job.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}

              <div className="job-detail-action-row">
                {hasApplied ? (
                  <button type="button" disabled className="is-applied">
                    <CheckCircle size={18} weight="fill" />
                    Đã ứng tuyển
                  </button>
                ) : (
                  <button type="button" onClick={handleApply}>
                    <PaperPlaneTilt size={18} />
                    Ứng tuyển ngay
                  </button>
                )}
                <button
                  type="button"
                  className={saved ? "is-saved" : ""}
                  onClick={() => {
                    if (!toggleSaveJob(job.id)) {
                      toast.info("Vui lòng đăng nhập để lưu công việc yêu thích.");
                      navigate(`/login?redirect=/jobs/${job.id}`);
                    }
                  }}
                  disabled={!isSavedJobsSessionResolved || isSavedJobPending(job.id)}
                  aria-pressed={saved}
                >
                  <Bookmark size={18} weight={saved ? "fill" : "regular"} />
                  {saved ? "Đã lưu" : "Lưu tin"}
                </button>
                <button type="button" onClick={() => void shareJob()}>
                  <ShareNetwork size={18} />
                  Chia sẻ
                </button>
              </div>
              <div className="job-detail-deadline job-detail-hero-deadline">
                <Calendar size={17} aria-hidden="true" />
                Hạn nộp hồ sơ: <b>{deadlineInfo.date}</b>{" "}
                <span>({deadlineInfo.remainingText})</span>
              </div>
            </section>

            <section className="job-detail-card job-detail-section">
              <div className="job-detail-card-head mb-4">
                <span>
                  <FileText size={18} />
                </span>
                <h2>Thông tin tuyển dụng</h2>
              </div>
              <div>
                {/* Mô tả công việc */}
                <div className="pb-3.5">
                  <h3 className="mb-2 text-base font-semibold text-slate-900">Mô tả công việc</h3>
                  {job.description && job.description.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text text-sm leading-snug text-slate-900"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.description) }}
                    />
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      Chưa có thông tin mô tả công việc.
                    </p>
                  )}
                </div>

                {/* Yêu cầu ứng viên */}
                <div className="border-t border-slate-100 py-3.5">
                  <h3 className="mb-2 text-base font-semibold text-slate-900">Yêu cầu ứng viên</h3>
                  {job.requirements &&
                  job.requirements.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text text-sm leading-snug text-slate-900"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.requirements) }}
                    />
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      Chưa có thông tin yêu cầu ứng viên.
                    </p>
                  )}
                </div>

                {/* Quyền lợi */}
                <div className="border-t border-slate-100 pt-3.5">
                  <h3 className="mb-2 text-base font-semibold text-slate-900">Quyền lợi</h3>
                  {job.benefits && job.benefits.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text text-sm leading-snug text-slate-900"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.benefits) }}
                    />
                  ) : (
                    <p className="text-sm text-slate-500 italic">Chưa có thông tin quyền lợi.</p>
                  )}
                </div>
              </div>
            </section>

            {job.tags && job.tags.length > 0 && (
              <DetailSection title="Kỹ năng & công nghệ">
                <div className="job-detail-skill-cloud">
                  {Array.from(new Set(job.tags)).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </DetailSection>
            )}

            {similarJobs.length > 0 && (
              <SimilarJobsSection
                similarJobs={similarJobs}
                navigate={navigate}
                onApply={handleApply}
              />
            )}
          </article>

          <aside className="job-detail-aside">
            <section className="job-detail-card job-detail-company-mini">
              <LogoMark job={job} />
              <div>
                <h2>{job.company}</h2>
                <p>{job.categoryName || "Công nghệ thông tin"}</p>
                {job.companyAddress && (
                  <small className="mt-1 block text-xs leading-snug text-slate-500">
                    {job.companyAddress}
                  </small>
                )}
                {job.verified && <em>Đã xác thực</em>}
              </div>
              <button
                type="button"
                disabled={isFollowBusy || !isCompanyFollowSessionResolved}
                aria-pressed={isCompanyFollowed}
                onClick={handleToggleFollowCompany}
                className={isCompanyFollowed ? "is-followed" : ""}
              >
                {isCompanyFollowed ? (
                  <>
                    <CheckCircle size={15} weight="fill" /> Đã theo dõi
                  </>
                ) : (
                  <>
                    <Bookmark size={15} /> Theo dõi công ty
                  </>
                )}
              </button>
              <div className="job-detail-company-mini-stats">
                <span>
                  <b>{jobsList.filter((item) => item.company === job.company).length || 1}</b>
                  <small>Việc làm</small>
                </span>
                <span>
                  <b>{job.companySize || "5000+"}</b>
                  <small>Nhân sự</small>
                </span>
                <span>
                  <b>1+</b>
                  <small>Quốc gia</small>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (job.companySlug) {
                    navigate(`/companies/${encodeURIComponent(job.companySlug)}`);
                  } else {
                    navigate("/companies");
                  }
                }}
              >
                Xem công ty <ArrowRight size={15} />
              </button>
            </section>

            <section className="job-detail-card job-detail-share-card">
              <h2>{t("heading")}</h2>
              <p>{t("description")}</p>
              <div className="job-detail-share-actions" aria-label={t("channelsLabel")}>
                <button
                  type="button"
                  className="job-detail-share-action is-copy"
                  aria-label={t("copyLink")}
                  data-tooltip={t("copyLink")}
                  onClick={() => void copyJobLink()}
                >
                  <Copy size={19} aria-hidden="true" />
                </button>
                <a
                  className="job-detail-share-action is-facebook"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("facebook")}
                  data-tooltip={t("facebook")}
                >
                  <Facebook size={19} aria-hidden="true" weight="fill" />
                </a>
                <a
                  className="job-detail-share-action is-linkedin"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("linkedIn")}
                  data-tooltip={t("linkedIn")}
                >
                  <Linkedin size={19} aria-hidden="true" weight="fill" />
                </a>
                <a
                  className="job-detail-share-action is-zalo"
                  href={`https://zalo.me/share?url=${encodedShareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("zalo")}
                  data-tooltip={t("zalo")}
                >
                  <span aria-hidden="true">Z</span>
                </a>
                <a
                  className="job-detail-share-action is-email"
                  href={`mailto:?subject=${encodedShareTitle}&body=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`}
                  aria-label={t("email")}
                  data-tooltip={t("email")}
                >
                  <Mail size={19} aria-hidden="true" />
                </a>
              </div>
            </section>
          </aside>
        </section>
      </section>

      <PublicFooter navigate={navigate} />

      {isOpenApply && (
        <ApplyModal isOpen={isOpenApply} onClose={() => setIsOpenApply(false)} job={job} />
      )}
    </main>
  );
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="job-detail-card job-detail-section">
      <div className="job-detail-card-head">
        {icon && <span>{icon}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="job-detail-info-tile">
      {icon}
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}

function SimilarJobsSection({
  similarJobs,
  navigate,
}: {
  similarJobs: Job[];
  navigate: (path: string) => void;
  onApply: () => void;
}) {
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const previewCloseTimerRef = useRef<number | null>(null);
  const {
    placement: previewPlacement,
    previewRef,
    previewStyle,
    setPreviewAnchor,
  } = useAnchoredJobPreview(previewJobId);

  const previewJob = similarJobs.find((j) => j.id === previewJobId) ?? null;
  const { data: previewJobDetail, isPending: isPreviewDescriptionLoading } = useJobPreviewDetail(
    previewJob?.id,
  );
  const previewDescription = getJobPreviewDescription(
    previewJobDetail?.description ?? previewJob?.description,
  );

  function openPreview(jobId: string, trigger?: HTMLElement) {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
      previewCloseTimerRef.current = null;
    }
    if (trigger) setPreviewAnchor(trigger, ".job-detail-similar-card");
    setPreviewJobId(jobId);
  }

  function schedulePreviewClose() {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
    }
    previewCloseTimerRef.current = window.setTimeout(() => {
      setPreviewJobId(null);
      previewCloseTimerRef.current = null;
    }, 220);
  }

  return (
    <section className="job-detail-card job-detail-similar-section">
      <div className="job-detail-card-head mb-6">
        <h2>Việc làm tương tự</h2>
      </div>
      <div className="job-detail-similar-grid">
        {similarJobs.map((item) => (
          <div
            key={item.id}
            className={`job-detail-similar-card${previewJobId === item.id ? " is-previewed" : ""}`}
            onMouseLeave={schedulePreviewClose}
          >
            <LogoMark job={item} />
            <div className="job-detail-similar-info">
              <h3>
                <button
                  type="button"
                  className="job-detail-similar-title-btn"
                  onClick={() => navigate(`/jobs/${item.id}`)}
                  onMouseEnter={(e) => openPreview(item.id, e.currentTarget)}
                  onFocus={(e) => openPreview(item.id, e.currentTarget)}
                  onBlur={schedulePreviewClose}
                  title={item.title}
                >
                  {item.title}
                </button>
              </h3>
              <p>{item.company}</p>
              <div className="job-detail-similar-meta">
                <span className="job-detail-similar-badge">{item.location}</span>
                <span className="job-detail-similar-badge is-salary">{item.salary}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewJob && (
        <dialog
          open
          ref={previewRef}
          id="similar-job-preview"
          className="urgent-job-preview"
          aria-labelledby="similar-job-preview-title"
          aria-modal="false"
          data-placement={previewPlacement}
          style={previewStyle}
          onMouseEnter={() => openPreview(previewJob.id)}
          onMouseLeave={schedulePreviewClose}
        >
          <div className="urgent-job-preview-head">
            <span className="urgent-job-preview-logo">
              <span aria-hidden="true">{previewJob.company.charAt(0)}</span>
              {previewJob.logo && (
                // oxlint-disable-next-line next/no-img-element
                <img
                  src={previewJob.logo}
                  alt=""
                  width={48}
                  height={48}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </span>
            <div>
              <h3 id="similar-job-preview-title">{previewJob.title}</h3>
              <strong>{previewJob.company}</strong>
              <p>
                <span>{previewJob.salary}</span>
                <i aria-hidden="true">•</i>
                {previewJob.level}
              </p>
            </div>
          </div>

          <p className="urgent-job-preview-address">
            <MapPin size={16} aria-hidden="true" />
            {previewJob.location}
          </p>

          <div className="urgent-job-preview-body">
            <strong>Mô tả công việc</strong>
            <section
              className="urgent-job-preview-description"
              aria-label={`Mô tả công việc ${previewJob.title}`}
            >
              {isPreviewDescriptionLoading
                ? "Đang tải mô tả đầy đủ…"
                : previewDescription || "Chưa có mô tả chi tiết."}
            </section>
            <div className="urgent-job-preview-tags">
              {previewJob.tags.slice(0, 4).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <button type="button" onClick={() => navigate(`/jobs/${previewJob.id}`)}>
              Xem chi tiết <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="urgent-job-preview-actions">
            <button
              type="button"
              className="urgent-job-preview-save"
              aria-label={`Lưu công việc ${previewJob.title}`}
            >
              <Bookmark size={21} weight="regular" />
            </button>
            <button
              type="button"
              className="urgent-job-preview-apply"
              onClick={() => navigate(`/jobs/${previewJob.id}`)}
            >
              <BriefcaseBusiness size={18} aria-hidden="true" />
              Ứng tuyển ngay
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}
