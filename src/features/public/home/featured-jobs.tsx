"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { formatJobSalaryDisplay } from "@/features/public/jobs/components/jobs-page";
import { toast } from "@/shared/ui/toast";

import type { PublicJob } from "./api";
import type { RecommendationReasonCode } from "./home-personalization";
import { getJobCities, getJobTags, selectLatestJobs } from "./home-section-selectors";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Eye,
  MapPin,
  Monitor,
  ShieldCheck,
  Sparkles,
} from "./marketing-icons";
import { useAnchoredJobPreview } from "./use-anchored-job-preview";

type FeaturedJobsProps = {
  navigate: (path: string) => void;
  onApply: (job: { id: string; title: string; company: string }) => void;
  jobs: PublicJob[] | undefined;
  excludedJobIds: ReadonlySet<string>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isRetrying: boolean;
  selectedJobs?: readonly PublicJob[] | undefined;
  matchReasons?: ReadonlyMap<string, readonly RecommendationReasonCode[]> | undefined;
  sectionTitle?: string | undefined;
  sectionDescription?: string | undefined;
};

type JobCard = {
  id: string;
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
  /** Optional source description shown in the hover/focus preview. */
  description?: string;
  /** Public aggregate from the API. Null means UpNext has no verified count to disclose. */
  viewCount: number | null;
  matchReasons: readonly RecommendationReasonCode[];
};

function getPlainText(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/\s+/gu, " ")
    .trim();
}

function getPreviewDescription(value: string | null | undefined) {
  return (
    getPlainText(value)
      .replace(/^(?:mô tả công việc|job description)\s*[:\-–—]?\s*/iu, "")
      .trim() || undefined
  );
}

const PAGE_SIZE = 6;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function formatApplicationDeadline(expiredAt: string | null | undefined, locale: string) {
  const isEnglish = locale === "en";
  if (!expiredAt) return isEnglish ? "No deadline" : "Không giới hạn";

  const expirationTime = new Date(expiredAt).getTime();
  if (Number.isNaN(expirationTime)) return isEnglish ? "Not updated" : "Chưa cập nhật";

  const remainingTime = expirationTime - Date.now();
  if (remainingTime < 0) return isEnglish ? "Expired" : "Đã hết hạn";

  const remainingDays = Math.max(1, Math.ceil(remainingTime / DAY_IN_MILLISECONDS));
  return isEnglish
    ? `${remainingDays} ${remainingDays === 1 ? "day" : "days"} left`
    : `Còn ${remainingDays} ngày`;
}

function normalizeViewCount(viewCount: number | null | undefined) {
  if (typeof viewCount !== "number" || !Number.isFinite(viewCount) || viewCount < 0) {
    return null;
  }

  return Math.floor(viewCount);
}

function formatJobLocation(job: PublicJob, locale: string) {
  const cities = getJobCities(job);

  if (cities.length === 0) return locale === "en" ? "Location pending" : "Chưa cập nhật địa điểm";
  if (cities.length === 1) return cities[0]!;

  return `${cities[0]} +${cities.length - 1}`;
}

function formatViewCount(viewCount: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN").format(viewCount);
}

const interestCopy = {
  vi: {
    title: "Việc làm mới nhất",
    description: "Các vị trí IT mới được đăng từ những nhà tuyển dụng đang hoạt động.",
    viewAll: "Xem tất cả việc làm",
    views: "lượt xem",
    loading: "Đang tải việc làm mới nhất…",
    error: "Không thể tải việc làm mới nhất.",
    retry: "Thử lại",
    retrying: "Đang thử lại…",
    empty: "Hiện chưa có việc làm phù hợp để hiển thị.",
  },
  en: {
    title: "Latest IT jobs",
    description: "New IT roles from employers currently hiring on UpNext.",
    viewAll: "View all jobs",
    views: "views",
    loading: "Loading latest jobs…",
    error: "Could not load the latest jobs.",
    retry: "Try again",
    retrying: "Trying again…",
    empty: "There are no jobs to show right now.",
  },
} as const;

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
      <Image
        src={src}
        alt={`Logo ${name}`}
        width={48}
        height={48}
        unoptimized
        className="size-full object-contain"
        onError={() => setFailed(true)}
      />
    </i>
  );
}

/** Verified company badge with a concise, API-backed trust tooltip. */
function VerifiedBadge({ locale }: { locale: string }) {
  const isEnglish = locale === "en";
  return (
    <span className="featured-job-verify">
      <button
        type="button"
        className="featured-job-verify-btn"
        aria-label={isEnglish ? "Verified employer" : "Nhà tuyển dụng đã được xác thực"}
        onClick={(event) => event.stopPropagation()}
      >
        <BadgeCheck size={15} />
      </button>
      <span className="featured-job-verify-pop" role="tooltip">
        <span className="featured-job-verify-head">
          <ShieldCheck size={15} />
          {isEnglish
            ? "Employer verified by UpNext"
            : "Nhà tuyển dụng đã được xác thực trên UpNext"}
        </span>
      </span>
    </span>
  );
}

function mapPublicJobToJobCard(
  job: PublicJob,
  matchReasons: readonly RecommendationReasonCode[] = [],
  locale = "vi",
): JobCard {
  const description = getPreviewDescription(job.description);

  return {
    id: job.id,
    company: job.company?.name || "UpNext Partner",
    verified: job.company?.verificationStatus?.toUpperCase() === "VERIFIED",
    logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
    logoColor: "#10b981",
    title: job.title,
    salary: formatJobSalaryDisplay(job, ""),
    location: formatJobLocation(job, locale),
    mode: job.employmentType?.name || "Full-time",
    experience: job.experienceLevel?.name || (locale === "en" ? "1 - 3 years" : "1 - 3 năm"),
    tags: getJobTags(job),
    deadline: formatApplicationDeadline(job.expiredAt, locale),
    ...(description ? { description } : {}),
    viewCount: normalizeViewCount(job.viewCount),
    matchReasons,
  };
}

export function FeaturedJobs({
  navigate,
  onApply,
  jobs: apiJobsData,
  excludedJobIds,
  isLoading,
  isError,
  onRetry,
  isRetrying,
  selectedJobs,
  matchReasons,
  sectionTitle,
  sectionDescription,
}: FeaturedJobsProps) {
  const locale = useLocale();
  const copy = locale === "en" ? interestCopy.en : interestCopy.vi;
  const previewCopy =
    locale === "en"
      ? {
          description: "Job description",
          details: "View details",
          save: (title: string) => `Save ${title}`,
          unsave: (title: string) => `Remove ${title} from saved jobs`,
          apply: "Apply now",
          fallback: (company: string, title: string) =>
            `Join ${company} as a ${title}. View the full job details to explore the requirements and benefits for candidates.`,
        }
      : {
          description: "Mô tả công việc",
          details: "Xem chi tiết",
          save: (title: string) => `Lưu tin ${title}`,
          unsave: (title: string) => `Bỏ lưu tin ${title}`,
          apply: "Ứng tuyển ngay",
          fallback: (company: string, title: string) =>
            `Cơ hội gia nhập ${company} ở vị trí ${title}. Xem chi tiết để khám phá yêu cầu công việc và quyền lợi dành cho ứng viên.`,
        };
  const notificationCopy =
    locale === "en"
      ? {
          saveError: "Could not update saved jobs. Please try again.",
          undo: "Undo",
          saved: (title: string) => `Saved ${title}`,
          unsaved: (title: string) => `Removed ${title} from saved jobs`,
          savedAgain: (title: string) => `Saved ${title} again`,
          undoSave: (title: string) => `Undid saving ${title}`,
        }
      : {
          saveError: "Không thể cập nhật việc làm đã lưu. Vui lòng thử lại.",
          undo: "Hoàn tác",
          saved: (title: string) => `Đã lưu ${title}`,
          unsaved: (title: string) => `Đã bỏ lưu ${title}`,
          savedAgain: (title: string) => `Đã lưu lại ${title}`,
          undoSave: (title: string) => `Đã hoàn tác lưu ${title}`,
        };
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [paused, setPaused] = useState(false);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const previewCloseTimerRef = useRef<number | null>(null);
  const {
    placement: previewPlacement,
    previewRef,
    previewStyle,
    setPreviewAnchor,
  } = useAnchoredJobPreview(previewJobId);
  const {
    error: savedJobsError,
    isAuthenticated,
    isPending: isSavedJobPending,
    isSessionResolved: isSavedJobsSessionResolved,
    setSavedJob,
    savedJobIds,
    toggleSaveJob,
  } = useCandidateSavedJobs();

  const jobs = useMemo(() => {
    const selected = selectedJobs ?? selectLatestJobs(apiJobsData, { excludedIds: excludedJobIds });
    return selected.map((job) => mapPublicJobToJobCard(job, matchReasons?.get(job.id), locale));
  }, [apiJobsData, excludedJobIds, locale, matchReasons, selectedJobs]);

  const displayTitle = sectionTitle ?? copy.title;
  const displayDescription = sectionDescription ?? copy.description;
  const reasonLabels: Record<RecommendationReasonCode, string> =
    locale === "en"
      ? {
          skill: "Matches your skills",
          position: "Matches your target role",
          workingModel: "Matches your work preference",
          level: "Matches your experience level",
          salary: "Within your salary range",
          followedCompany: "From a company you follow",
        }
      : {
          skill: "Khớp kỹ năng của bạn",
          position: "Khớp vị trí bạn quan tâm",
          workingModel: "Khớp mô hình làm việc",
          level: "Khớp cấp bậc kinh nghiệm",
          salary: "Trong khoảng lương mong muốn",
          followedCompany: "Từ công ty bạn đang theo dõi",
        };

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
  const previewJob = jobs.find((job) => job.id === previewJobId) ?? null;

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  useEffect(() => {
    return () => {
      if (previewCloseTimerRef.current !== null) {
        window.clearTimeout(previewCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (previewJobId && !jobs.some((job) => job.id === previewJobId)) {
      setPreviewJobId(null);
    }
  }, [jobs, previewJobId]);

  function openPreview(jobId: string, trigger?: HTMLElement) {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
      previewCloseTimerRef.current = null;
    }
    if (trigger) setPreviewAnchor(trigger, ".featured-job-card");
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

  function closePreviewAndRestoreFocus() {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
      previewCloseTimerRef.current = null;
    }
    const jobId = previewJobId;
    setPreviewJobId(null);
    if (jobId) {
      window.requestAnimationFrame(() => {
        document.getElementById(`featured-job-title-${jobId}`)?.focus();
      });
    }
  }

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
    toast.error(notificationCopy.saveError);
  }

  function handleSaveJob(job: JobCard) {
    const didStart = toggleSaveJob(job.id, {
      onError: showSaveError,
      onSuccess: (isSaved) => {
        const toastId = `save-job-${job.id}`;
        toast.success(
          isSaved ? notificationCopy.saved(job.title) : notificationCopy.unsaved(job.title),
          {
            action: {
              label: notificationCopy.undo,
              onClick: () => {
                toast.dismiss(toastId);
                const didUndoStart = setSavedJob(job.id, !isSaved, {
                  onError: showSaveError,
                  onSuccess: (restored) => {
                    toast.success(
                      restored
                        ? notificationCopy.savedAgain(job.title)
                        : notificationCopy.undoSave(job.title),
                    );
                  },
                });
                if (!didUndoStart) navigate("/login?redirect=/");
              },
            },
            duration: 8_000,
            id: toastId,
          },
        );
      },
    });

    if (!didStart) {
      toast.info(
        locale === "en"
          ? "Please log in to save this job."
          : "Vui lòng đăng nhập để lưu công việc yêu thích.",
      );
      navigate("/login?redirect=/");
    }
  }

  if (isLoading || isError || jobs.length === 0) {
    return (
      <section className="marketing-home-jobs" aria-label={displayTitle}>
        <header className="marketing-home-jobs-head">
          <div>
            <h2>{displayTitle}</h2>
            <p>{displayDescription}</p>
          </div>
        </header>
        {isLoading ? (
          <output className="marketing-home-section-skeleton" aria-live="polite">
            <span>{copy.loading}</span>
            <i />
            <i />
            <i />
          </output>
        ) : isError ? (
          <div className="marketing-home-action-state" role="alert">
            <p className="marketing-home-action-error">{copy.error}</p>
            <button
              type="button"
              className="marketing-home-action-retry"
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? copy.retrying : copy.retry}
            </button>
          </div>
        ) : (
          <output className="marketing-home-action-error">{copy.empty}</output>
        )}
      </section>
    );
  }

  return (
    <section
      className="marketing-home-jobs"
      aria-label={displayTitle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <header className="marketing-home-jobs-head">
        <div>
          <h2>{displayTitle}</h2>
          <p>{displayDescription}</p>
        </div>
        <button type="button" className="marketing-home-jobs-all" onClick={() => navigate("/jobs")}>
          {copy.viewAll} <ChevronRight size={16} />
        </button>
      </header>
      {savedJobsError && isAuthenticated ? (
        <p className="marketing-home-action-error" role="alert">
          {locale === "en"
            ? "Could not sync your saved jobs. Please try again."
            : "Không thể đồng bộ việc làm đã lưu. Vui lòng thử lại."}
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
                    <article
                      key={job.id}
                      className={`featured-job-card${
                        previewJobId === job.id ? " is-previewed" : ""
                      }`}
                      onMouseLeave={schedulePreviewClose}
                    >
                      <div className="featured-job-company" style={{ marginTop: 0 }}>
                        <CompanyLogo src={job.logo} name={job.company} color={job.logoColor} />
                        <span className="featured-job-company-row">
                          <span className="featured-job-company-name" title={job.company}>
                            {job.company}
                          </span>
                          {job.verified && <VerifiedBadge locale={locale} />}
                        </span>
                        <button
                          type="button"
                          className={`featured-job-save ml-auto${saved ? " is-saved" : ""}`}
                          aria-label={
                            saved ? previewCopy.unsave(job.title) : previewCopy.save(job.title)
                          }
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
                          id={`featured-job-title-${job.id}`}
                          title={job.title}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          onMouseEnter={(event) => openPreview(job.id, event.currentTarget)}
                          onFocus={(event) => openPreview(job.id, event.currentTarget)}
                          onBlur={schedulePreviewClose}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.preventDefault();
                              closePreviewAndRestoreFocus();
                            }
                          }}
                          aria-controls="featured-job-preview"
                          aria-expanded={previewJobId === job.id}
                          aria-haspopup="dialog"
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

                      {job.matchReasons.length > 0 && (
                        <p className="featured-job-match-reason">
                          <Sparkles size={13} aria-hidden="true" />
                          {reasonLabels[job.matchReasons[0]!]}
                        </p>
                      )}

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
                            onApply(job);
                          }}
                        >
                          {previewCopy.apply} <ArrowRight size={15} />
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

      {previewJob && (
        <dialog
          open
          ref={previewRef}
          id="featured-job-preview"
          className="urgent-job-preview featured-job-preview"
          aria-labelledby="featured-job-preview-title"
          aria-modal="false"
          data-placement={previewPlacement}
          style={previewStyle}
          onMouseEnter={() => openPreview(previewJob.id)}
          onMouseLeave={schedulePreviewClose}
          onFocusCapture={() => openPreview(previewJob.id)}
          onBlurCapture={schedulePreviewClose}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closePreviewAndRestoreFocus();
            }
          }}
        >
          <div className="urgent-job-preview-head">
            <CompanyLogo
              src={previewJob.logo}
              name={previewJob.company}
              color={previewJob.logoColor}
            />
            <div>
              <h3 id="featured-job-preview-title">{previewJob.title}</h3>
              <strong>{previewJob.company}</strong>
              <p>
                <span>{previewJob.salary}</span>
                <i aria-hidden="true">•</i>
                {previewJob.experience}
              </p>
            </div>
          </div>

          <p className="urgent-job-preview-address">
            <MapPin size={16} aria-hidden="true" />
            {previewJob.location}
          </p>

          <div className="urgent-job-preview-body">
            <strong>{previewCopy.description}</strong>
            <textarea
              className="urgent-job-preview-description"
              aria-label={`${previewCopy.description} ${previewJob.title}`}
              readOnly
              rows={7}
              value={
                previewJob.description || previewCopy.fallback(previewJob.company, previewJob.title)
              }
            />
            <div className="urgent-job-preview-tags">
              {previewJob.tags.slice(0, 4).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <button type="button" onClick={() => navigate(`/jobs/${previewJob.id}`)}>
              {previewCopy.details} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="urgent-job-preview-actions">
            {(() => {
              const isPreviewSaved = savedJobIds.includes(previewJob.id);
              const canPersistPreview = UUID_PATTERN.test(previewJob.id);
              const saveUnavailable = isAuthenticated && !canPersistPreview;
              return (
                <button
                  type="button"
                  className="urgent-job-preview-save"
                  aria-label={
                    isPreviewSaved
                      ? previewCopy.unsave(previewJob.title)
                      : previewCopy.save(previewJob.title)
                  }
                  aria-pressed={isPreviewSaved}
                  disabled={
                    !isSavedJobsSessionResolved ||
                    saveUnavailable ||
                    isSavedJobPending(previewJob.id)
                  }
                  title={
                    saveUnavailable
                      ? "Tin tuyển dụng này chưa đồng bộ với hệ thống lưu tin."
                      : undefined
                  }
                  onClick={() => handleSaveJob(previewJob)}
                >
                  <Bookmark size={19} weight={isPreviewSaved ? "fill" : "regular"} />
                </button>
              );
            })()}
            <button
              type="button"
              className="urgent-job-preview-apply"
              onClick={() => onApply(previewJob)}
            >
              {previewCopy.apply} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </dialog>
      )}

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
