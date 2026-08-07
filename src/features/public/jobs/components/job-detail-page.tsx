"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useRef } from "react";
import type { ReactNode } from "react";

import { checkAppliedJob } from "@/features/candidate/api/profile";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";
import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { formatRelativeTime } from "@/shared/lib/date";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { toast } from "@/shared/ui/toast";

import { getPublicJobs, recordPublicJobView } from "../../home/api";
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
  Globe,
  Facebook,
  Linkedin,
  Mail,
  MapPin,
  Monitor,
  PaperPlaneTilt,
  ShareNetwork,
  ShieldCheck,
  Star,
  TrendingUp,
  UsersRound,
  WalletCards,
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

const responsibilities = [
  "Tham gia phát triển, bảo trì và tối ưu các ứng dụng Web/Mobile theo roadmap sản phẩm.",
  "Viết code sạch, có khả năng mở rộng và tuân thủ coding convention của dự án.",
  "Phối hợp với Product, Design, QA và Backend để hoàn thiện tính năng từ discovery đến release.",
  "Tham gia review code, viết unit test và xử lý lỗi phát sinh trong quá trình vận hành.",
  "Đề xuất cải tiến kỹ thuật để nâng chất lượng sản phẩm và hiệu suất hệ thống.",
];

const requirements = [
  "Nắm vững nền tảng lập trình, cấu trúc dữ liệu, OOP và quy trình phát triển phần mềm.",
  "Có kinh nghiệm thực tế với các công nghệ liên quan trong phần kỹ năng của tin tuyển dụng.",
  "Biết đọc hiểu tài liệu tiếng Anh chuyên ngành và chủ động trao đổi khi yêu cầu chưa rõ.",
  "Có tư duy sản phẩm, trách nhiệm với chất lượng đầu ra và khả năng làm việc nhóm tốt.",
  "Ưu tiên ứng viên từng làm việc với hệ thống có người dùng thật hoặc quy mô enterprise.",
];

const benefits = [
  {
    icon: <WalletCards size={20} />,
    desc: "Thu nhập cạnh tranh, thưởng hiệu quả 2 lần/năm",
  },
  {
    icon: <Monitor size={20} />,
    desc: "Làm việc linh hoạt: Hybrid, Remote hoặc tại văn phòng hiện đại",
  },
  {
    icon: <ShieldCheck size={20} />,
    desc: "Bảo hiểm sức khỏe cao cấp cho bản thân và gia đình",
  },
  {
    icon: <Globe size={20} />,
    desc: "Đào tạo & chứng chỉ quốc tế qua học viện nội bộ",
  },
  {
    icon: <TrendingUp size={20} />,
    desc: "Cơ hội thăng tiến và lộ trình phát triển rõ ràng",
  },
  {
    icon: <UsersRound size={20} />,
    desc: "Teambuilding, du lịch, thể thao và nhiều hoạt động nội bộ",
  },
];

const companyStats = [
  { value: "256", label: "Việc làm" },
  { value: "30.000+", label: "Nhân sự" },
  { value: "27+", label: "Quốc gia" },
];

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

export function PublicJobDetailPage({ path, navigate }: PublicJobDetailPageProps) {
  const locale = useLocale();
  const t = useTranslations("PublicJobs.share");
  const jobId = getJobId(path);
  const fallbackJob = jobs[0];
  if (!fallbackJob) {
    throw new Error("No jobs available for job detail page.");
  }

  const { data: apiJobsData } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
  });

  const jobsList = useMemo(() => {
    if (!apiJobsData) return jobs;

    const mapped: Job[] = apiJobsData.map((job) => {
      const isRemote =
        job.employmentType?.name.toLowerCase().includes("remote") ||
        job.title.toLowerCase().includes("remote");
      const isHighSalary =
        (job.salaryMin && job.salaryMin >= 30000000) ||
        (job.salaryMax && job.salaryMax >= 30000000);

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

      return {
        id: job.id,
        title: job.title,
        company: job.company?.name || "UpNext Partner",
        logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
        logoColor: "#10b981",
        verified: true,
        salary: formatJobSalaryDisplay(job),
        location: job.jobPostLocations?.[0]?.jobLocation?.city || "Việt Nam",
        mode: job.employmentType?.name || "Full-time",
        level: job.experienceLevel?.name || "Middle",
        type: job.employmentType?.name || "Full-time",
        posted:
          job.publishedAt || (job as any).createdAt
            ? formatRelativeTime(job.publishedAt || (job as any).createdAt, "vi")
            : "Mới đăng",
        applicants: (job as any).numberOfRecruits ?? 5,
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
    });

    return mapped;
  }, [apiJobsData]);

  const job = jobsList.find((item) => item.id === jobId) ?? fallbackJob;
  const hasResolvedRequestedJob = Boolean(apiJobsData?.some((item) => item.id === jobId));
  const deadlineInfo = formatJobDetailDeadline(job.expiredAt);
  const {
    isPending: isSavedJobPending,
    isSessionResolved: isSavedJobsSessionResolved,
    savedJobIds,
    toggleSaveJob,
  } = useCandidateSavedJobs();
  const { session } = useCandidateProfileWorkspace();
  const saved = savedJobIds.includes(job.id);

  const { data: appliedData } = useQuery({
    queryKey: ["check-applied-job", job.id, session?.user.id],
    queryFn: () => checkAppliedJob(session!.accessToken, job.id),
    enabled: Boolean(session && session.accessToken && job?.id),
  });

  const hasApplied = appliedData?.applied === true;
  const [isOpenApply, setIsOpenApply] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const shareTitle = t("message", { jobTitle: job.title, company: job.company });
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
      // Closing the native share sheet is a normal, silent cancellation.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(t("shareFailed"));
    }
  }

  useEffect(() => {
    // The page initially renders a visual fallback while its public job list
    // loads. Never attribute that fallback to a real job view.
    if (!hasResolvedRequestedJob || !job.id || recordedJobViews.has(job.id)) return;

    recordedJobViews.add(job.id);
    void recordPublicJobView(job.id, getOrCreateVisitorKey()).catch(() => {
      // View analytics are best-effort. A failed metric must not interrupt a
      // candidate who is reading or applying for a job.
      recordedJobViews.delete(job.id);
    });
  }, [hasResolvedRequestedJob, job.id]);

  function handleApply() {
    startJobApplication({
      jobId: job.id,
      locale,
      navigate,
      onAuthenticated: () => setIsOpenApply(true),
    });
  }

  const similarJobs = useMemo(() => {
    const others = jobsList.filter((item) => item.id !== job.id);

    // 1. Same categoryName (chuyên ngành) — highest priority
    const sameCategoryName = job.categoryName
      ? others.filter(
          (item) =>
            item.categoryName &&
            item.categoryName.toLowerCase() === job.categoryName!.toLowerCase(),
        )
      : [];

    if (sameCategoryName.length >= 4) return sameCategoryName.slice(0, 4);

    // 2. Fill with shared skills/tags
    const usedIds = new Set(sameCategoryName.map((j) => j.id));
    const bySkills = others.filter(
      (item) => !usedIds.has(item.id) && item.tags?.some((t) => job.tags?.includes(t)),
    );

    let result = [...sameCategoryName, ...bySkills];
    if (result.length >= 4) return result.slice(0, 4);

    // 3. Fill remaining with any other jobs
    const resultIds = new Set(result.map((j) => j.id));
    const remaining = others.filter((item) => !resultIds.has(item.id));
    result = [...result, ...remaining];

    return result.slice(0, 4);
  }, [job, jobsList]);

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
                    onClick={() => navigate("/companies/fpt-software")}
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

              <p className="job-detail-lead">{getCleanLeadText(job.description)}</p>

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
                  label="Ứng viên"
                  value={`${job.applicants} lượt`}
                />
                <InfoTile
                  icon={<Calendar size={20} />}
                  label="Trạng thái"
                  value="Đang nhận hồ sơ"
                />
              </div>

              <div className="job-detail-tags" aria-label="Kỹ năng liên quan">
                {job.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

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
              <div className="job-detail-card-head mb-6">
                <span>
                  <FileText size={18} />
                </span>
                <h2>Thông tin tuyển dụng</h2>
              </div>
              <div>
                {/* Mô tả công việc */}
                <div className="pb-5">
                  <h3 className="mb-3 text-base font-semibold text-slate-900">Mô tả công việc</h3>
                  {job.description && job.description.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text text-sm leading-relaxed text-slate-900"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.description) }}
                    />
                  ) : (
                    <div className="job-detail-rich-text text-sm leading-relaxed text-slate-900">
                      <BulletList items={responsibilities} />
                    </div>
                  )}
                </div>

                {/* Yêu cầu ứng viên */}
                <div className="border-t border-slate-100 py-5">
                  <h3 className="mb-3 text-base font-semibold text-slate-900">Yêu cầu ứng viên</h3>
                  {job.requirements &&
                  job.requirements.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text text-sm leading-relaxed text-slate-900"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.requirements) }}
                    />
                  ) : (
                    <div className="job-detail-rich-text text-sm leading-relaxed text-slate-900">
                      <BulletList items={requirements} />
                    </div>
                  )}
                </div>

                {/* Quyền lợi */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="mb-3 text-base font-semibold text-slate-900">Quyền lợi</h3>
                  {job.benefits && job.benefits.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text text-sm leading-relaxed text-slate-900"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.benefits) }}
                    />
                  ) : (
                    <div className="job-detail-rich-text text-sm leading-relaxed text-slate-900">
                      <BulletList items={benefits.map((b) => b.desc)} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <DetailSection title="Kỹ năng & công nghệ">
              <div className="job-detail-skill-cloud">
                {Array.from(
                  new Set([
                    ...job.tags,
                    "Next.js",
                    "TypeScript",
                    "JavaScript",
                    "HTML5",
                    "CSS3",
                    "React Query",
                    "Tailwind CSS",
                    "Git",
                    "RESTful API",
                    "Docker",
                  ]),
                ).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </DetailSection>

            <SimilarJobsSection
              similarJobs={similarJobs}
              navigate={navigate}
              onApply={handleApply}
            />
          </article>

          <aside className="job-detail-aside">
            <section className="job-detail-card job-detail-company-mini">
              <LogoMark job={job} />
              <div>
                <h2>{job.company}</h2>
                <p>Công nghệ thông tin & Dịch vụ phần mềm</p>
                <em>Top công ty</em>
              </div>
              <button type="button">
                <Bookmark size={15} /> Theo dõi công ty
              </button>
              <div className="job-detail-company-mini-stats">
                {companyStats.map((stat) => (
                  <span key={stat.label}>
                    <b>{stat.value}</b>
                    <small>{stat.label}</small>
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => navigate("/companies/fpt-software")}>
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="job-detail-bullet-list">
      {items.map((item) => (
        <li key={item}>
          <span aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
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

function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="job-detail-info-line">
      <div className="job-detail-info-icon">{icon}</div>
      <div className="job-detail-info-content items-start text-left">
        <span className="job-detail-info-label text-left">{label}</span>
        <b className="job-detail-info-value text-left">{value}</b>
      </div>
    </div>
  );
}

function SimilarJobsSection({
  similarJobs,
  navigate,
  onApply,
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
