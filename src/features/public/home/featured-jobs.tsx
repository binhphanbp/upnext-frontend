"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { getCandidateSession } from "@/features/candidate/session";

import { getPublicJobs, type PublicJob } from "./api";
import type { HomeActionFeedback } from "./home-action-toast";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Eye,
  MapPin,
  Monitor,
  ShieldCheck,
} from "./marketing-icons";

type FeaturedJobsProps = {
  navigate: (path: string) => void;
  onApply: (job: { id: string; title: string; company: string }) => void;
  onFeedback: (feedback: HomeActionFeedback) => void;
};

type BadgeTone = "featured" | "new" | "urgent" | "remote" | "salary";
type FilterKey = "remote" | "high-salary" | "newest";

type JobCard = {
  id: string;
  badge: { label: string; tone: BadgeTone };
  company: string;
  verified: boolean;
  /** Logo file under /public/assets/marketing/home/companies, or '' for a monogram. */
  logo: string;
  /** Monogram tint, used when there is no logo image. */
  logoColor: string;
  title: string;
  salary: string;
  location: string;
  mode: string;
  experience: string;
  tags: string[];
  deadline: string;
  /** Public aggregate from the API. Null means UpNext has no verified count to disclose. */
  viewCount: number | null;
  filters: FilterKey[];
};

const PAGE_SIZE = 6;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function formatApplicationDeadline(expiredAt: string | null | undefined) {
  if (!expiredAt) return "Không giới hạn";

  const expirationTime = new Date(expiredAt).getTime();
  if (Number.isNaN(expirationTime)) return "Chưa cập nhật";

  const remainingTime = expirationTime - Date.now();
  if (remainingTime < 0) return "Đã hết hạn";

  const remainingDays = Math.max(1, Math.ceil(remainingTime / DAY_IN_MILLISECONDS));
  return `Còn ${remainingDays} ngày`;
}

function normalizeViewCount(viewCount: number | null | undefined) {
  if (typeof viewCount !== "number" || !Number.isFinite(viewCount) || viewCount < 0) {
    return null;
  }

  return Math.floor(viewCount);
}

function formatViewCount(viewCount: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN").format(viewCount);
}

const interestCopy = {
  vi: { views: "lượt xem" },
  en: { views: "views" },
} as const;

const verifyPoints = [
  "Đã xác thực email tên miền công ty",
  "Đã xác thực số điện thoại",
  "Đã duyệt giấy phép kinh doanh",
  "Tài khoản được tạo tối thiểu 6 tháng",
  "Chưa có lịch sử bị báo cáo tin đăng",
];

/** Logo image with a colored-monogram fallback. */
function CompanyLogo({ src, name, color }: { src: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <i className="featured-job-logo featured-job-logo-mono" style={{ background: color }}>
        {name.charAt(0)}
      </i>
    );
  }

  return (
    <i className="featured-job-logo">
      <img
        src={src}
        alt={`Logo ${name}`}
        width={48}
        height={48}
        className="size-full object-contain"
        onError={() => setFailed(true)}
      />
    </i>
  );
}

/** Verified company badge with an on-hover/focus trust tooltip. */
function VerifiedBadge() {
  return (
    <span className="featured-job-verify">
      <button
        type="button"
        className="featured-job-verify-btn"
        aria-label="Nhà tuyển dụng đã được xác thực"
        onClick={(event) => event.stopPropagation()}
      >
        <BadgeCheck size={15} />
      </button>
      <span className="featured-job-verify-pop" role="tooltip">
        <span className="featured-job-verify-head">
          <ShieldCheck size={15} />
          Nhà tuyển dụng đã được xác thực
        </span>
        <ul>
          {verifyPoints.map((point) => (
            <li key={point}>
              <Check size={13} />
              {point}
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
}

const logo = (file: string) => `/assets/marketing/home/companies/${file}`;

// Six curated edge-case jobs sit first so they're visible on page 1:
// long title, very long company name, many tags, minimal tags, short name.
const curatedJobs: JobCard[] = [
  {
    id: "sepay-fullstack",
    badge: { label: "Nổi bật", tone: "featured" },
    company: "CÔNG TY CỔ PHẦN GIẢI PHÁP CÔNG NGHỆ TÀI CHÍNH SEPAY VIỆT NAM",
    verified: true,
    logo: logo("fpt.png"),
    logoColor: "#2563eb",
    title:
      "Senior Fullstack Developer (ReactJS/NodeJS) - Thu Nhập Hấp Dẫn Lên Đến 60 Triệu Kèm Thưởng Dự Án",
    salary: "Thỏa thuận",
    location: "Hồ Chí Minh",
    mode: "Hybrid",
    experience: "3 - 5 năm",
    tags: ["ReactJS", "NodeJS", "TypeScript", "PostgreSQL", "Docker", "AWS", "Redis", "GraphQL"],
    deadline: "Còn 18 ngày để nộp",
    viewCount: null,
    filters: ["high-salary"],
  },
  {
    id: "vng-backend",
    badge: { label: "Mới đăng", tone: "new" },
    company: "VNG",
    verified: true,
    logo: logo("vng.png"),
    logoColor: "#1a8cff",
    title: "Backend Developer",
    salary: "25 - 40 triệu",
    location: "Hồ Chí Minh",
    mode: "Hybrid",
    experience: "2 - 4 năm",
    tags: ["Java", "Spring Boot"],
    deadline: "Còn 2 ngày để nộp",
    viewCount: null,
    filters: ["newest"],
  },
  {
    id: "viettel-devops",
    badge: { label: "Tuyển gấp", tone: "urgent" },
    company: "Viettel Solutions",
    verified: true,
    logo: logo("viettel.png"),
    logoColor: "#ee0033",
    title: "DevOps Engineer (Kubernetes/Terraform)",
    salary: "28 - 50 triệu",
    location: "Đà Nẵng",
    mode: "Onsite",
    experience: "3 - 6 năm",
    tags: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Ansible"],
    deadline: "Còn 1 ngày để nộp",
    viewCount: null,
    filters: ["high-salary"],
  },
  {
    id: "momo-data",
    badge: { label: "Remote", tone: "remote" },
    company: "MoMo",
    verified: true,
    logo: logo("momo.png"),
    logoColor: "#a50064",
    title: "Data Engineer",
    salary: "27 - 45 triệu",
    location: "Remote",
    mode: "Remote",
    experience: "2 - 5 năm",
    tags: ["Python", "Spark", "Snowflake", "Airflow"],
    deadline: "Còn 5 ngày để nộp",
    viewCount: null,
    filters: ["remote", "high-salary"],
  },
  {
    id: "tiki-mobile",
    badge: { label: "Lương tốt", tone: "salary" },
    company: "Tiki",
    verified: false,
    logo: logo("tiki.png"),
    logoColor: "#1a94ff",
    title: "Mobile Developer (Flutter)",
    salary: "22 - 38 triệu",
    location: "Hà Nội",
    mode: "Hybrid",
    experience: "1 - 3 năm",
    tags: ["Flutter", "Dart", "Firebase"],
    deadline: "Còn 6 ngày để nộp",
    viewCount: null,
    filters: ["newest"],
  },
  {
    id: "vnpay-qa",
    badge: { label: "Nổi bật", tone: "featured" },
    company: "VNPAY",
    verified: true,
    logo: logo("vnpay.png"),
    logoColor: "#005baa",
    title: "QA Automation Engineer (Selenium / Cypress / Playwright) Cho Hệ Thống Thanh Toán",
    salary: "18 - 30 triệu",
    location: "Hồ Chí Minh",
    mode: "Hybrid",
    experience: "2 - 4 năm",
    tags: ["Selenium", "Cypress", "Playwright", "API Testing", "JIRA"],
    deadline: "Còn 8 ngày để nộp",
    viewCount: null,
    filters: ["newest"],
  },
];

// --- Pools used to synthesise the remaining jobs for pagination testing. ---
const companyPool = [
  { name: "FPT Software", file: "fpt.png", color: "#2563eb" },
  { name: "VNG Corporation", file: "vng.png", color: "#1a8cff" },
  { name: "Viettel Solutions", file: "viettel.png", color: "#ee0033" },
  { name: "MoMo", file: "momo.png", color: "#a50064" },
  { name: "Tiki", file: "tiki.png", color: "#1a94ff" },
  { name: "VNPAY", file: "vnpay.png", color: "#005baa" },
  { name: "KMS Technology", file: "", color: "#0aa56f" },
  { name: "NashTech Vietnam", file: "", color: "#db2777" },
  { name: "Axon Active Vietnam", file: "", color: "#7c3aed" },
  { name: "Got It AI", file: "", color: "#d97706" },
  {
    name: "CÔNG TY TNHH GIẢI PHÁP PHẦN MỀM VÀ DỊCH VỤ CÔNG NGHỆ CAO SAO BẮC ĐẨU",
    file: "",
    color: "#0891b2",
  },
  { name: "Zalo", file: "", color: "#0068ff" },
];

const rolePool: Array<{ title: string; tags: string[]; filter: FilterKey }> = [
  {
    title: "Frontend Developer (ReactJS)",
    tags: ["React", "TypeScript", "Redux", "Vite", "Tailwind CSS", "Jest"],
    filter: "newest",
  },
  {
    title: "Senior Backend Engineer (Golang)",
    tags: ["Go", "gRPC", "PostgreSQL", "Kafka", "Docker"],
    filter: "high-salary",
  },
  {
    title: "Fullstack Developer (NodeJS/ReactJS)",
    tags: ["Node.js", "React", "MongoDB", "AWS"],
    filter: "newest",
  },
  {
    title: "AI/ML Engineer",
    tags: ["Python", "PyTorch", "LLM", "MLOps", "Kubernetes"],
    filter: "high-salary",
  },
  {
    title: "Cloud Engineer (AWS)",
    tags: ["AWS", "Terraform", "Lambda", "CloudFormation"],
    filter: "high-salary",
  },
  {
    title: "UI/UX Designer",
    tags: ["Figma", "Design System", "Prototyping"],
    filter: "newest",
  },
  {
    title: "Business Analyst (IT)",
    tags: ["SQL", "BPMN", "Agile"],
    filter: "newest",
  },
  {
    title: "Embedded Software Engineer (C/C++)",
    tags: ["C", "C++", "RTOS", "ARM", "Linux Kernel"],
    filter: "high-salary",
  },
  {
    title: "Security Engineer (Pentest)",
    tags: ["Pentest", "OWASP", "Burp Suite", "Python"],
    filter: "high-salary",
  },
  {
    title: "Mobile Developer (React Native)",
    tags: ["React Native", "TypeScript", "Redux"],
    filter: "newest",
  },
  {
    title: "Database Administrator (Oracle/PostgreSQL)",
    tags: ["Oracle", "PostgreSQL", "Tuning", "Backup"],
    filter: "newest",
  },
  {
    title: "Solution Architect",
    tags: ["Microservices", "AWS", "System Design", "Kafka", "DDD"],
    filter: "high-salary",
  },
];

const badgePool: Array<{ label: string; tone: BadgeTone }> = [
  { label: "Nổi bật", tone: "featured" },
  { label: "Mới đăng", tone: "new" },
  { label: "Tuyển gấp", tone: "urgent" },
  { label: "Remote", tone: "remote" },
  { label: "Lương tốt", tone: "salary" },
];

const locationPool = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Remote", "Cần Thơ", "Bình Dương"];
const modePool = ["Hybrid", "Onsite", "Remote"];
const expPool = ["Dưới 1 năm", "1 - 3 năm", "2 - 4 năm", "3 - 5 năm", "5+ năm"];
const salaryPool = [
  "Thỏa thuận",
  "15 - 25 triệu",
  "20 - 35 triệu",
  "25 - 40 triệu",
  "30 - 50 triệu",
  "40 - 60 triệu",
];

function buildJobs(): JobCard[] {
  const generated: JobCard[] = [];
  const target = 40 - curatedJobs.length;

  for (let i = 0; i < target; i += 1) {
    const role = rolePool[i % rolePool.length]!;
    const company = companyPool[i % companyPool.length]!;
    const mode = modePool[i % modePool.length]!;
    const location = mode === "Remote" ? "Remote" : locationPool[i % locationPool.length]!;
    const salary = salaryPool[i % salaryPool.length]!;

    const filters: FilterKey[] = [];
    if (mode === "Remote" || location === "Remote") filters.push("remote");
    if (role.filter === "high-salary" || salary === "40 - 60 triệu") {
      filters.push("high-salary");
    }
    if (i % 2 === 0) filters.push("newest");

    generated.push({
      id: `gen-${i}`,
      badge: badgePool[i % badgePool.length]!,
      company: company.name,
      verified: i % 4 !== 0,
      logo: company.file ? logo(company.file) : "",
      logoColor: company.color,
      title: role.title,
      salary,
      location,
      mode,
      experience: expPool[i % expPool.length]!,
      tags: role.tags,
      deadline: `Còn ${((i * 3) % 29) + 1} ngày để nộp`,
      viewCount: null,
      filters: Array.from(new Set(filters)),
    });
  }

  return [...curatedJobs, ...generated];
}

const staticJobs = buildJobs();

function mapPublicJobToJobCard(job: PublicJob, index: number): JobCard {
  const isRemote =
    job.employmentType?.name.toLowerCase().includes("remote") ||
    job.title.toLowerCase().includes("remote");
  const isHighSalary =
    (job.salaryMin && job.salaryMin >= 30000000) || (job.salaryMax && job.salaryMax >= 30000000);

  const filters: FilterKey[] = [];
  if (isRemote) filters.push("remote");
  if (isHighSalary) filters.push("high-salary");
  filters.push("newest");

  const tones: BadgeTone[] = ["featured", "new", "urgent", "remote", "salary"];
  const tone = tones[index % tones.length]!;
  const labelMap: Record<BadgeTone, string> = {
    featured: "Nổi bật",
    new: "Mới đăng",
    urgent: "Tuyển gấp",
    remote: "Remote",
    salary: "Lương tốt",
  };

  return {
    id: job.id,
    badge: { label: labelMap[tone], tone },
    company: job.company?.name || "UpNext Partner",
    verified: true,
    logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
    logoColor: "#10b981",
    title: job.title,
    salary:
      job.salaryIsVisible && job.salaryMin && job.salaryMax
        ? `${Math.round(job.salaryMin / 1000000)} - ${Math.round(job.salaryMax / 1000000)} triệu`
        : "Thỏa thuận",
    location: "Việt Nam",
    mode: job.employmentType?.name || "Full-time",
    experience: job.experienceLevel?.name || "1 - 3 năm",
    tags:
      job.jobPostSkills && job.jobPostSkills.length > 0
        ? job.jobPostSkills.map((s) => s.skill.name)
        : ([job.jobCategory?.name, job.employmentType?.name, job.experienceLevel?.name].filter(
            Boolean,
          ) as string[]),
    deadline: formatApplicationDeadline(job.expiredAt),
    viewCount: normalizeViewCount(job.viewCount),
    filters: Array.from(new Set(filters)),
  };
}

export function FeaturedJobs({ navigate, onApply, onFeedback }: FeaturedJobsProps) {
  const locale = useLocale();
  const copy = locale === "en" ? interestCopy.en : interestCopy.vi;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [paused, setPaused] = useState(false);
  const {
    error: savedJobsError,
    isAuthenticated,
    isPending: isSavedJobPending,
    isSessionResolved: isSavedJobsSessionResolved,
    setSavedJob,
    savedJobIds,
    toggleSaveJob,
  } = useCandidateSavedJobs();

  const { data: apiJobsData } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
  });

  const jobs = useMemo(() => {
    if (!apiJobsData || apiJobsData.length === 0) return staticJobs;
    const mapped = apiJobsData.map((job, idx) => mapPublicJobToJobCard(job, idx));
    return mapped;
  }, [apiJobsData]);

  // Split into pages of PAGE_SIZE, then append a clone of page 1 at the end so
  // the loop from last → first slides FORWARD seamlessly instead of rewinding.
  const pages = useMemo(() => {
    const result: JobCard[][] = [];
    for (let i = 0; i < jobs.length; i += PAGE_SIZE) {
      result.push(jobs.slice(i, i + PAGE_SIZE));
    }
    return result.length ? result : [[]];
  }, [jobs]);

  const totalPages = pages.length;
  const hasLoop = totalPages > 1;
  const slides = hasLoop ? [...pages, pages[0]!] : pages;
  const displayPage = (index % totalPages) + 1;

  // Auto-advance every 2s, looping forward. Pauses on hover/focus and respects
  // reduced-motion so it never fights the user.
  useEffect(() => {
    if (!hasLoop || paused) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setAnimate(true);
      setIndex((i) => (i >= totalPages ? i : i + 1));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hasLoop, totalPages, paused]);

  // When the slide INTO the clone finishes, snap back to the real first slide
  // with no transition — invisible because the clone shows identical content.
  function handleTransitionEnd() {
    if (index >= totalPages) {
      setAnimate(false);
      setIndex(0);
    }
  }

  function goNext() {
    if (!hasLoop) return;
    setAnimate(true);
    setIndex((i) => (i >= totalPages ? i : i + 1));
  }

  function goPrev() {
    if (!hasLoop) return;
    if (index <= 0) {
      // Jump (no anim) to the clone position, then slide back to the last page.
      setAnimate(false);
      setIndex(totalPages);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          setIndex(totalPages - 1);
        });
      });
    } else {
      setAnimate(true);
      setIndex((i) => i - 1);
    }
  }

  function showSaveError() {
    onFeedback({
      id: `save-job-error-${Date.now()}`,
      message: "Không thể cập nhật việc làm đã lưu. Vui lòng thử lại.",
      tone: "error",
    });
  }

  function handleSaveJob(job: JobCard) {
    const didStart = toggleSaveJob(job.id, {
      onError: showSaveError,
      onSuccess: (isSaved) => {
        onFeedback({
          actionLabel: "Hoàn tác",
          id: `save-job-${job.id}-${Date.now()}`,
          message: isSaved ? `Đã lưu ${job.title}` : `Đã bỏ lưu ${job.title}`,
          onAction: () => {
            const didUndoStart = setSavedJob(job.id, !isSaved, {
              onError: showSaveError,
              onSuccess: (restored) => {
                onFeedback({
                  id: `undo-save-job-${job.id}-${Date.now()}`,
                  message: restored ? `Đã lưu lại ${job.title}` : `Đã hoàn tác lưu ${job.title}`,
                  tone: "success",
                });
              },
            });
            if (!didUndoStart) navigate("/login?redirect=/");
          },
          tone: "success",
        });
      },
    });

    if (!didStart) navigate("/login?redirect=/");
  }

  return (
    <section
      className="marketing-home-jobs"
      aria-label="Cơ hội đang được quan tâm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <header className="marketing-home-jobs-head">
        <div>
          <h2>Cơ hội đang được quan tâm</h2>
          <p>Những vị trí IT nổi bật từ các công ty uy tín, được cập nhật liên tục.</p>
        </div>
        <button type="button" className="marketing-home-jobs-all" onClick={() => navigate("/jobs")}>
          Xem tất cả <ChevronRight size={16} />
        </button>
      </header>
      {savedJobsError ? (
        <p className="marketing-home-action-error" role="alert">
          Không thể đồng bộ việc làm đã lưu. Vui lòng thử lại.
        </p>
      ) : null}

      <div className={`marketing-home-jobs-viewport${animate ? " is-animating" : ""}`}>
        <div
          className={`marketing-home-jobs-track${animate ? "" : " no-anim"}`}
          style={{ transform: `translateX(${-index * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((slideJobs, slideIndex) => (
            <div
              className={`marketing-home-jobs-slide${slideIndex === index ? " is-active" : ""}`}
              key={slideIndex}
              aria-hidden={slideIndex !== index}
            >
              <div className="marketing-home-jobs-grid">
                {slideJobs.map((job) => {
                  const saved = savedJobIds.includes(job.id);
                  const canPersist = UUID_PATTERN.test(job.id);
                  const saveUnavailable = isAuthenticated && !canPersist;
                  const maxTags = 3;
                  const maxChars = 22;
                  const shownTags: string[] = [];
                  let currentChars = 0;
                  for (const tag of job.tags) {
                    if (shownTags.length >= maxTags) break;
                    if (shownTags.length >= 1 && currentChars + tag.length > maxChars) {
                      break;
                    }
                    shownTags.push(tag);
                    currentChars += tag.length;
                  }
                  const extraTags = job.tags.length - shownTags.length;

                  return (
                    <article key={job.id} className="featured-job-card">
                      <div className="featured-job-company" style={{ marginTop: 0 }}>
                        <CompanyLogo src={job.logo} name={job.company} color={job.logoColor} />
                        <span className="featured-job-company-row">
                          <span className="featured-job-company-name" title={job.company}>
                            {job.company}
                          </span>
                          {job.verified && <VerifiedBadge />}
                        </span>
                        <button
                          type="button"
                          className={`featured-job-save ml-auto${saved ? " is-saved" : ""}`}
                          aria-label={saved ? `Bỏ lưu tin ${job.title}` : `Lưu tin ${job.title}`}
                          aria-pressed={saved}
                          disabled={
                            !isSavedJobsSessionResolved ||
                            saveUnavailable ||
                            isSavedJobPending(job.id)
                          }
                          title={
                            saveUnavailable
                              ? "Tin tuyển dụng này chưa đồng bộ với hệ thống lưu tin."
                              : undefined
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSaveJob(job);
                          }}
                        >
                          <Bookmark size={18} weight={saved ? "fill" : "regular"} />
                        </button>
                      </div>

                      <h3>
                        <button
                          type="button"
                          className="featured-job-title"
                          title={job.title}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          {job.title}
                        </button>
                      </h3>

                      <div className="featured-job-salary">
                        <Coins size={16} />
                        {job.salary}
                      </div>

                      <div className="featured-job-meta">
                        <span>
                          <MapPin size={15} />
                          {job.location}
                        </span>
                        <span>
                          <Monitor size={15} />
                          {job.mode}
                        </span>
                        <span>
                          <Briefcase size={15} />
                          {job.experience}
                        </span>
                      </div>

                      <div className="featured-job-tags">
                        {shownTags.map((tag) => (
                          <i key={tag}>{tag}</i>
                        ))}
                        {extraTags > 0 && (
                          <i
                            className="featured-job-tag-more"
                            title={job.tags.slice(shownTags.length).join(", ")}
                          >
                            +{extraTags}
                          </i>
                        )}
                      </div>

                      <footer className="featured-job-foot">
                        {job.viewCount === null ? (
                          <span className="featured-job-deadline">
                            <Clock size={14} aria-hidden="true" />
                            {job.deadline}
                          </span>
                        ) : (
                          <span className="featured-job-interest">
                            <Eye size={14} aria-hidden="true" />
                            {formatViewCount(job.viewCount, locale)} {copy.views}
                          </span>
                        )}
                        <button
                          type="button"
                          className="featured-job-apply"
                          onClick={(event) => {
                            event.stopPropagation();
                            const session = getCandidateSession();
                            if (session) {
                              onApply(job);
                            } else {
                              navigate(`/register?job=${job.id}`);
                            }
                          }}
                        >
                          Ứng tuyển <ArrowRight size={15} />
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="marketing-home-jobs-pager" aria-label="Phân trang">
        <button type="button" aria-label="Trang trước" disabled={!hasLoop} onClick={goPrev}>
          <ChevronLeft size={18} />
        </button>
        <span>
          <b>{displayPage}</b> / {totalPages} trang
        </span>
        <button type="button" aria-label="Trang sau" disabled={!hasLoop} onClick={goNext}>
          <ChevronRight size={18} />
        </button>
      </nav>
    </section>
  );
}
