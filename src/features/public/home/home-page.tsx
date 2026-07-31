"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { getPublicPosts } from "@/features/posts/api/posts";
import { ApplyModal } from "@/features/public/jobs/components/apply-modal";
import { formatJobSalaryDisplay } from "@/features/public/jobs/components/jobs-page";
import { useRouter } from "@/i18n/navigation";
import { toast } from "@/shared/ui/toast";
import { removeVietnameseAccents } from "@/shared/utils/natural-search";

import { PublicFooter } from "../shared/public-footer";
import { PublicHeader } from "../shared/public-header";
import { getAllActivePublicCompanies, getPublicJobs } from "./api";
import { FeaturedCompanies } from "./featured-companies";
import { FeaturedJobs } from "./featured-jobs";
import {
  getDeadlineTone,
  getDaysUntilExpiration,
  getJobTags,
  isPublicJobAvailable,
  selectExpiringJobs,
} from "./home-section-selectors";
import { InsightsCarousel } from "./insights-carousel";
import { JobMarket } from "./job-market";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Clock,
  MapPin,
  Search,
  Sparkles,
} from "./marketing-icons";
import { getPopularKeywordsForLocale } from "./popular-keywords";
import { useAnchoredJobPreview } from "./use-anchored-job-preview";

type MarketingHomeExperienceProps = {
  navigate: (path: string) => void;
};

type FieldKey = "keyword" | "location";

const locationOptions = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Bình Dương",
  "Cần Thơ",
  "Hải Phòng",
  "Remote",
  "Nước ngoài",
];

const keywordSuggestions = [
  "React",
  "Vue.js",
  "Angular",
  "Node.js",
  "Java",
  "Spring Boot",
  "Python",
  "Golang",
  ".NET",
  "PHP",
  "Flutter",
  "React Native",
  "AWS",
  "Kubernetes",
  "Docker",
  "Data Engineer",
  "AI Engineer",
  "Machine Learning",
  "QA Automation",
  "UI/UX Designer",
  "Product Manager",
  "Business Analyst",
];

function formatDeadlineWithDate(expiredAt: string | Date | null | undefined) {
  if (!expiredAt) return "Không giới hạn";

  const expirationTime = new Date(expiredAt).getTime();
  if (Number.isNaN(expirationTime)) return "Chưa cập nhật";

  const remainingTime = expirationTime - Date.now();
  if (remainingTime < 0) return "Đã hết hạn";

  const remainingDays = Math.max(1, Math.ceil(remainingTime / (24 * 60 * 60 * 1000)));
  return `Còn ${remainingDays} ngày`;
}

function formatCompactLocation(city?: string | null) {
  if (!city) return "Chưa cập nhật địa điểm";
  if (city.includes("Hồ Chí Minh") || city.includes("HCM") || city.includes("Hcm")) return "TP.HCM";
  if (city.includes("Hà Nội")) return "Hà Nội";
  if (city.includes("Đà Nẵng")) return "Đà Nẵng";
  return city;
}

function getCompanyInitials(companyName: string) {
  const ignoredWords = new Set([
    "công",
    "ty",
    "tnhh",
    "cổ",
    "phần",
    "trách",
    "nhiệm",
    "hữu",
    "hạn",
    "company",
    "joint",
    "stock",
    "co",
    "ltd",
  ]);
  const words = companyName
    .trim()
    .split(/\s+/)
    .filter((word) => word && !ignoredWords.has(word.toLocaleLowerCase("vi")));
  const source = words.length > 0 ? words : companyName.trim().split(/\s+/);

  return source
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toLocaleUpperCase("vi");
}

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

const homeCopy = {
  vi: {
    employerSmall: "Dành cho",
    employerLabel: "Nhà Tuyển Dụng",
    languageLabel: "Chọn ngôn ngữ",
    login: "Đăng nhập",
    register: "Đăng ký",
    eyebrow: "Nền tảng tuyển dụng IT hiện đại",
    titleLine1: "Tìm đúng việc IT.",
    titleLine2: "Bật tăng",
    titleAccent: "sự nghiệp.",
    descriptionLine1: "UpNext kết nối ứng viên IT với các công ty công nghệ uy tín.",
    descriptionLine2: "Tìm việc nhanh chóng, phù hợp kỹ năng và định hướng của bạn.",
    searchAria: "Tìm kiếm việc làm IT",
    keywordPlaceholder: "Nhập tên công việc, kỹ năng...",
    keywordAria: "Từ khóa tìm việc",
    locationLabel: "Địa điểm",
    locationPlaceholder: "Chọn tỉnh, thành phố",
    submit: "Tìm việc ngay",
    popular: "Tìm kiếm phổ biến:",
    statsJobs: "Việc làm IT đang tuyển",
    statsCompanies: "Công ty công nghệ",
    statsNewJobs: "Việc làm mới trong 7 ngày",
    trustedBy: "Nhà tuyển dụng đang hoạt động trên UpNext",
    footerPrimary: "Tìm việc ngay",
    footerSecondary: "Tạo hồ sơ miễn phí",
    footerEmailPlaceholder: "Nhập email của bạn",
    footerEmailAria: "Email nhận tin",
    footerSubscribe: "Đăng ký",
    vietnamLocation: "TP. Hồ Chí Minh, Việt Nam",
    vietnamese: "Tiếng Việt",
    english: "English",
    toTop: "Lên đầu trang",
    copyright: "© 2026 UpNext. Tất cả quyền được bảo lưu.",
  },
  en: {
    employerSmall: "Employer",
    employerLabel: "Hiring Hub",
    languageLabel: "Choose language",
    login: "Log in",
    register: "Sign up",
    eyebrow: "Modern IT recruitment platform",
    titleLine1: "Find the right IT job.",
    titleLine2: "Accelerate",
    titleAccent: "your career.",
    descriptionLine1: "UpNext connects IT talent with trusted technology companies.",
    descriptionLine2: "Search faster by skills, location, and career direction.",
    searchAria: "Search IT jobs",
    keywordPlaceholder: "Enter job title, skill...",
    keywordAria: "Job search keyword",
    locationLabel: "Location",
    locationPlaceholder: "Choose city or province",
    submit: "Search jobs",
    popular: "Popular searches:",
    statsJobs: "Open IT jobs",
    statsCompanies: "Tech companies",
    statsNewJobs: "Jobs posted in the last 7 days",
    trustedBy: "Employers hiring on UpNext",
    footerPrimary: "Find jobs now",
    footerSecondary: "Create free profile",
    footerEmailPlaceholder: "Enter your email",
    footerEmailAria: "Newsletter email",
    footerSubscribe: "Subscribe",
    vietnamLocation: "Ho Chi Minh City, Vietnam",
    vietnamese: "Tiếng Việt",
    english: "English",
    toTop: "Back to top",
    copyright: "© 2026 UpNext. All rights reserved.",
  },
} as const;

export function MarketingHomeExperience({ navigate }: MarketingHomeExperienceProps) {
  const locale = useLocale();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [openField, setOpenField] = useState<FieldKey | null>(null);
  const [applyJob, setApplyJob] = useState<{ id: string; title: string; company: string } | null>(
    null,
  );

  const copy = locale === "en" ? homeCopy.en : homeCopy.vi;
  const popularKeywords = useMemo(
    () => getPopularKeywordsForLocale(locale === "en" ? "en" : "vi"),
    [locale],
  );
  const heroPopularKeywords = popularKeywords.slice(0, 6);

  const searchCardRef = useRef<HTMLElement | null>(null);

  const {
    data: apiJobsData,
    isError: isJobsError,
    isFetching: isJobsFetching,
    isPending: isJobsPending,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
    staleTime: 60_000,
  });

  const {
    data: apiCompaniesData,
    isError: isCompaniesError,
    isFetching: isCompaniesFetching,
    isPending: isCompaniesPending,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["public-companies", "all-active"],
    queryFn: getAllActivePublicCompanies,
    staleTime: 60_000,
  });

  const { data: apiPostsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ["public-posts", { limit: 6, page: 1 }],
    queryFn: () => getPublicPosts({ limit: 6, page: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const [now] = useState(() => Date.now());
  const activeJobs = useMemo(
    () => (apiJobsData ?? []).filter((job) => isPublicJobAvailable(job, now)),
    [apiJobsData, now],
  );
  const jobsCount = activeJobs.length;
  const companiesCount = useMemo(
    () =>
      apiCompaniesData?.items.filter((company) => company.activeJobsCount > 0).length ??
      new Set(activeJobs.map((job) => job.company?.id).filter(Boolean)).size,
    [activeJobs, apiCompaniesData],
  );
  const newJobsCount = useMemo(
    () =>
      activeJobs.filter((job) => {
        const publishedTime = new Date(job.publishedAt ?? job.createdAt).getTime();
        return Number.isFinite(publishedTime) && now - publishedTime <= 7 * 24 * 60 * 60 * 1000;
      }).length,
    [activeJobs, now],
  );

  const formattedStats = useMemo(() => {
    function formatStatNumber(num: number) {
      if (num <= 0) return "0+";
      let rounded = num;
      if (num >= 1000) {
        rounded = Math.floor(num / 100) * 100;
      } else if (num >= 100) {
        rounded = Math.floor(num / 10) * 10;
      } else if (num >= 10) {
        rounded = Math.floor(num / 5) * 5;
      }
      const formatted = new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN").format(rounded);
      return `${formatted}+`;
    }

    return {
      jobs: formatStatNumber(jobsCount),
      companies: formatStatNumber(companiesCount),
      newJobs: formatStatNumber(newJobsCount),
    };
  }, [companiesCount, jobsCount, locale, newJobsCount]);

  const urgentJobsList = useMemo(() => {
    return selectExpiringJobs(apiJobsData, { now }).map((job, index) => {
      const daysUntilExpiration = getDaysUntilExpiration(job, now);
      return {
        id: job.id,
        logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
        title: job.title,
        company: job.company?.name || "UpNext Partner",
        salary: formatJobSalaryDisplay(job, ""),
        location: formatCompactLocation(job.jobPostLocations?.[0]?.jobLocation?.city),
        mode: job.employmentType?.name || "Full-time",
        tags: getJobTags(job),
        deadline: formatDeadlineWithDate(job.expiredAt),
        deadlineTone: getDeadlineTone(daysUntilExpiration),
        level: job.experienceLevel?.name || "Junior",
        description: getPlainText(job.description),
        address:
          job.jobPostLocations?.[0]?.jobLocation?.address ||
          job.jobPostLocations?.[0]?.jobLocation?.city ||
          "",
        bgClass:
          index % 4 === 0
            ? "bg-slate-800"
            : index % 4 === 1
              ? "bg-purple-600"
              : index % 4 === 2
                ? "bg-sky-500"
                : "bg-rose-500",
      };
    });
  }, [apiJobsData, now]);
  const urgentJobIds = useMemo(
    () => new Set(urgentJobsList.map((job) => job.id)),
    [urgentJobsList],
  );

  useEffect(() => {
    if (!openField) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!searchCardRef.current?.contains(event.target as Node)) {
        setOpenField(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenField(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openField]);

  const keywordMatches = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return keywordSuggestions.slice(0, 6);
    const unaccented = removeVietnameseAccents(query);
    return keywordSuggestions
      .filter((item) => removeVietnameseAccents(item.toLowerCase()).includes(unaccented))
      .slice(0, 6);
  }, [keyword]);

  function runSearch(overrides?: { keyword?: string }) {
    const params = new URLSearchParams();
    const term = (overrides?.keyword ?? keyword).trim();
    if (term) params.set("keyword", term);
    if (location) params.set("location", location);
    setOpenField(null);
    const query = params.toString();
    window.location.assign(`/${locale}/jobs${query ? `?${query}` : ""}`);
  }

  function toggleField(field: FieldKey) {
    setOpenField((current) => (current === field ? null : field));
  }

  return (
    <main className="marketing-home-page">
      <PublicHeader navigate={navigate} />

      <section className="marketing-home-content">
        <section className="marketing-home-hero">
          <span
            className="marketing-home-hero-orbit marketing-home-hero-orbit-left"
            aria-hidden="true"
          />
          <span
            className="marketing-home-hero-orbit marketing-home-hero-orbit-right"
            aria-hidden="true"
          />
          <div className="marketing-home-copy">
            <span className="marketing-home-eyebrow">
              <Sparkles size={15} weight="fill" />
              {copy.eyebrow}
            </span>
            <h1>
              {copy.titleLine1}
              <br />
              {copy.titleLine2} <span>{copy.titleAccent}</span>
            </h1>
            <p>
              {copy.descriptionLine1}
              <br />
              {copy.descriptionLine2}
            </p>

            <section
              className="marketing-home-search-card"
              aria-label={copy.searchAria}
              ref={searchCardRef}
            >
              <form className="marketing-home-search-grid" action={`/${locale}/jobs`} method="get">
                <div
                  className={`marketing-home-field marketing-home-field-keyword${openField === "keyword" ? " is-open" : ""}`}
                >
                  <div className="marketing-home-control">
                    <Search size={20} />
                    <input
                      name="keyword"
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      onFocus={() => setOpenField("keyword")}
                      placeholder={copy.keywordPlaceholder}
                      aria-label={copy.keywordAria}
                      autoComplete="off"
                    />
                  </div>
                  {openField === "keyword" && keywordMatches.length > 0 && (
                    <ul className="marketing-home-dropdown" aria-label="Gợi ý từ khóa">
                      {keywordMatches.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            className="marketing-home-option"
                            onClick={() => {
                              setKeyword(item);
                              runSearch({ keyword: item });
                            }}
                          >
                            <Search size={15} />
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <SelectField
                  label={copy.locationLabel}
                  icon={<MapPin size={19} />}
                  placeholder={copy.locationPlaceholder}
                  value={location}
                  options={locationOptions}
                  open={openField === "location"}
                  onToggle={() => toggleField("location")}
                  onSelect={(value) => {
                    setLocation(value);
                    setOpenField(null);
                  }}
                />

                <input type="hidden" name="location" value={location} />

                <button type="submit" className="marketing-home-search-submit">
                  {copy.submit} <ArrowRight size={19} />
                </button>
              </form>
            </section>

            <div className="marketing-home-popular">
              <span>{copy.popular}</span>
              <div className="marketing-home-popular-links">
                {heroPopularKeywords.map((keyword) => (
                  <a
                    key={keyword.query}
                    href={`/${locale}/jobs?keyword=${encodeURIComponent(keyword.query)}`}
                    title={keyword.label}
                    aria-label={keyword.label}
                  >
                    {keyword.shortLabel ?? keyword.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-home-trust-strip">
          <div className="marketing-home-stats">
            <article>
              <i>
                <BriefcaseBusiness size={25} />
              </i>
              <p>
                <strong>{isJobsPending ? "…" : formattedStats.jobs}</strong>
                <span>{copy.statsJobs}</span>
              </p>
            </article>
            <article>
              <i>
                <Building2 size={25} />
              </i>
              <p>
                <strong>{isCompaniesPending ? "…" : formattedStats.companies}</strong>
                <span>{copy.statsCompanies}</span>
              </p>
            </article>
            <article>
              <i>
                <Sparkles size={25} />
              </i>
              <p>
                <strong>{isJobsPending ? "…" : formattedStats.newJobs}</strong>
                <span>{copy.statsNewJobs}</span>
              </p>
            </article>
          </div>

          <div className="marketing-home-trusted">
            <span>{copy.trustedBy}</span>
            <div className="marketing-home-marquee">
              <div className="marketing-home-marquee-track" aria-hidden="true">
                {(apiCompaniesData?.items ?? []).slice(0, 8).map((company) => (
                  <b
                    className={`marketing-home-company marketing-home-company-${company.id}`}
                    key={company.id}
                  >
                    {company.name}
                  </b>
                ))}
                {/* Duplicate set creates the seamless loop; hidden when motion is reduced. */}
                {(apiCompaniesData?.items ?? []).slice(0, 8).map((company) => (
                  <b
                    className={`marketing-home-company marketing-home-company-clone marketing-home-company-${company.id}`}
                    key={`${company.id}-clone`}
                  >
                    {company.name}
                  </b>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FeaturedJobs
          navigate={navigate}
          onApply={setApplyJob}
          jobs={apiJobsData}
          excludedJobIds={urgentJobIds}
          isLoading={isJobsPending}
          isError={isJobsError && !apiJobsData}
          onRetry={() => void refetchJobs()}
          isRetrying={isJobsFetching}
        />
        <UrgentJobsSection
          navigate={navigate}
          urgentJobs={urgentJobsList}
          onApply={setApplyJob}
          isLoading={isJobsPending}
          isError={isJobsError && !apiJobsData}
          onRetry={() => void refetchJobs()}
          isRetrying={isJobsFetching}
        />
        <FeaturedCompanies
          navigate={navigate}
          companies={apiCompaniesData}
          isLoading={isCompaniesPending}
          isError={isCompaniesError && !apiCompaniesData}
          onRetry={() => void refetchCompanies()}
          isRetrying={isCompaniesFetching}
        />
        <JobMarket />
        <InsightsCarousel isLoading={isPostsLoading} posts={apiPostsData?.items ?? []} />

        <PublicFooter navigate={navigate} />

        {applyJob && (
          <ApplyModal isOpen={!!applyJob} onClose={() => setApplyJob(null)} job={applyJob} />
        )}
      </section>
    </main>
  );
}

function UrgentJobsSection({
  navigate,
  urgentJobs,
  onApply,
  isLoading,
  isError,
  onRetry,
  isRetrying,
}: {
  navigate: (path: string) => void;
  onApply: (job: { id: string; title: string; company: string }) => void;
  urgentJobs: Array<{
    id: string;
    logo: string;
    title: string;
    company: string;
    salary: string;
    location: string;
    mode: string;
    tags: string[];
    deadline: string;
    deadlineTone: "critical" | "warning" | "neutral";
    level: string;
    bgClass: string;
    description?: string;
    address?: string;
  }>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const {
    isPending: isSavedJobPending,
    isSessionResolved: isSavedJobsSessionResolved,
    setSavedJob,
    savedJobIds,
    toggleSaveJob,
  } = useCandidateSavedJobs();

  function handleSaveJob(jobId: string, jobTitle: string) {
    const didStart = toggleSaveJob(jobId, {
      onError: () => toast.error("Không thể cập nhật việc làm đã lưu. Vui lòng thử lại."),
      onSuccess: (isSaved) => {
        const toastId = `save-job-${jobId}`;
        toast.success(isSaved ? `Đã lưu ${jobTitle}` : `Đã bỏ lưu ${jobTitle}`, {
          action: {
            label: "Hoàn tác",
            onClick: () => {
              toast.dismiss(toastId);
              const didUndoStart = setSavedJob(jobId, !isSaved, {
                onError: () => toast.error("Không thể hoàn tác. Vui lòng thử lại."),
                onSuccess: (restored) => {
                  toast.success(
                    restored ? `Đã lưu lại ${jobTitle}` : `Đã hoàn tác lưu ${jobTitle}`,
                  );
                },
              });
              if (!didUndoStart) navigate("/login?redirect=/");
            },
          },
          duration: 8_000,
          id: toastId,
        });
      },
    });

    if (!didStart) {
      toast.info("Vui lòng đăng nhập để lưu công việc yêu thích.");
      const redirectPath = typeof window !== "undefined" ? window.location.pathname : "/";
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }

  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragStartRef = useRef<number | null>(null);
  const previewCloseTimerRef = useRef<number | null>(null);
  const {
    placement: previewPlacement,
    previewRef,
    previewStyle,
    setPreviewAnchor,
  } = useAnchoredJobPreview(previewJobId);

  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          ariaLabel: "Jobs closing soon",
          title: "Closing soon",
          description: "Open roles with an application deadline within the next 14 days.",
          viewAll: "View all jobs",
          loading: "Loading jobs closing soon…",
          error: "Could not load jobs closing soon.",
          retry: "Try again",
          retrying: "Trying again…",
          previous: "Previous page",
          next: "Next page",
        }
      : {
          ariaLabel: "Việc làm sắp hết hạn",
          title: "Sắp hết hạn ứng tuyển",
          description: "Các vị trí còn hạn nộp hồ sơ trong 14 ngày tới.",
          viewAll: "Xem tất cả việc làm",
          loading: "Đang tải việc làm sắp hết hạn…",
          error: "Không thể tải việc làm sắp hết hạn.",
          retry: "Thử lại",
          retrying: "Đang thử lại…",
          previous: "Trang trước",
          next: "Trang sau",
        };

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const pageSize = isMobile ? 4 : 9;

  const pages = useMemo(() => {
    const result: (typeof urgentJobs)[] = [];
    for (let i = 0; i < urgentJobs.length; i += pageSize) {
      result.push(urgentJobs.slice(i, i + pageSize));
    }
    return result.length ? result : [[]];
  }, [urgentJobs, pageSize]);

  const totalPages = pages.length;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const previewJob = urgentJobs.find((job) => job.id === previewJobId) ?? null;

  // Auto-advance urgent jobs every 6s unless paused or reduced-motion is enabled
  useEffect(() => {
    if (totalPages <= 1 || paused || isDragging) return undefined;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setPage((current) => (current + 1) % totalPages);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [totalPages, paused, isDragging]);

  useEffect(
    () => () => {
      if (previewCloseTimerRef.current !== null) {
        window.clearTimeout(previewCloseTimerRef.current);
      }
    },
    [],
  );

  function openPreview(jobId: string, trigger?: HTMLElement) {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
      previewCloseTimerRef.current = null;
    }
    if (trigger) setPreviewAnchor(trigger, ".urgent-job-card");
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
    const jobId = previewJobId;
    setPreviewJobId(null);
    if (jobId) {
      window.requestAnimationFrame(() => {
        document.getElementById(`urgent-job-title-${jobId}`)?.focus();
      });
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (totalPages <= 1) return;
    dragStartRef.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging || dragStartRef.current === null) return;
    const diff = e.clientX - dragStartRef.current;
    setDragOffset(diff);
  }

  function handlePointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > 60) {
      if (dragOffset < 0 && safePage < totalPages - 1) {
        setPage((p) => p + 1);
      } else if (dragOffset > 0 && safePage > 0) {
        setPage((p) => p - 1);
      }
    }
    setDragOffset(0);
    dragStartRef.current = null;
  }

  if (isLoading) {
    return (
      <section className="marketing-home-urgent" aria-label={copy.ariaLabel}>
        <output className="marketing-home-section-skeleton" aria-live="polite">
          <span>{copy.loading}</span>
          <i />
          <i />
          <i />
        </output>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="marketing-home-urgent" aria-label={copy.ariaLabel}>
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
      </section>
    );
  }

  if (urgentJobs.length === 0) return null;

  return (
    <section
      className="marketing-home-urgent"
      aria-label={copy.ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <header className="marketing-home-urgent-head">
        <div>
          <h2 className="m-0 inline-flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
            <Clock size={20} aria-hidden="true" className="text-emerald-600" />
            <span>{copy.title}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">{copy.description}</p>
        </div>
        <button
          type="button"
          className="marketing-home-urgent-all"
          onClick={() => navigate("/jobs")}
        >
          {copy.viewAll} <ChevronRight size={16} />
        </button>
      </header>

      <div
        className="marketing-home-urgent-viewport cursor-grab select-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className={`marketing-home-urgent-track${isDragging ? " is-dragging" : ""}`}
          style={{
            transform: `translateX(calc(${-safePage * 100}% + ${dragOffset}px))`,
            transition: isDragging ? "none" : "transform 620ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          }}
        >
          {pages.map((slideJobs, slideIdx) => (
            <div className="marketing-home-urgent-slide" key={slideIdx}>
              <div className="marketing-home-urgent-grid">
                {slideJobs.map((job) => {
                  const isSaved = savedJobIds.includes(job.id);
                  return (
                    <article
                      className={`urgent-job-card group${
                        previewJobId === job.id ? " is-previewed" : ""
                      }`}
                      key={job.id}
                      onMouseLeave={schedulePreviewClose}
                    >
                      <div className="urgent-job-main">
                        <span className={`urgent-job-logo ${job.bgClass || "bg-emerald-600"}`}>
                          <span className="urgent-job-logo-fallback" aria-hidden="true">
                            {getCompanyInitials(job.company)}
                          </span>
                          {job.logo && (
                            <Image
                              src={job.logo}
                              alt={`Logo ${job.company}`}
                              width={46}
                              height={46}
                              unoptimized
                              className="rounded-lg object-contain"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </span>

                        <div className="urgent-job-content">
                          <div className="urgent-job-heading">
                            <h3 className="urgent-job-title-wrapper">
                              <button
                                id={`urgent-job-title-${job.id}`}
                                type="button"
                                className="urgent-job-title group-hover:text-emerald-600"
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
                                aria-controls="urgent-job-preview"
                                aria-expanded={previewJobId === job.id}
                                aria-haspopup="dialog"
                                title={job.title}
                              >
                                {job.title}
                              </button>
                            </h3>
                            <button
                              type="button"
                              className="urgent-job-save"
                              aria-label={
                                isSaved
                                  ? `Bỏ lưu công việc ${job.title}`
                                  : `Lưu công việc ${job.title}`
                              }
                              aria-pressed={isSaved}
                              disabled={!isSavedJobsSessionResolved || isSavedJobPending(job.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveJob(job.id, job.title);
                              }}
                            >
                              <Bookmark size={20} weight={isSaved ? "fill" : "regular"} />
                            </button>
                          </div>
                          <strong className="urgent-job-company">{job.company}</strong>
                        </div>
                      </div>

                      <div className="urgent-job-compact-footer">
                        <div className="urgent-job-chips">
                          <span className="urgent-job-salary">
                            <Coins size={14} />
                            {job.salary}
                          </span>
                          <span className="urgent-job-location">
                            <MapPin size={14} />
                            {job.location}
                          </span>
                        </div>
                        <span
                          className={`urgent-job-deadline-badge is-${job.deadlineTone} flex items-center gap-1`}
                        >
                          <span className="urgent-job-deadline-dot" />
                          {job.deadline}
                        </span>
                      </div>
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
          id="urgent-job-preview"
          className="urgent-job-preview"
          aria-labelledby="urgent-job-preview-title"
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
            <span className={`urgent-job-preview-logo ${previewJob.bgClass || "bg-emerald-600"}`}>
              <span aria-hidden="true">{getCompanyInitials(previewJob.company)}</span>
              {previewJob.logo && (
                <Image
                  src={previewJob.logo}
                  alt=""
                  width={58}
                  height={58}
                  unoptimized
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </span>
            <div>
              <h3 id="urgent-job-preview-title">{previewJob.title}</h3>
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
            {previewJob.address || previewJob.location}
          </p>

          <div className="urgent-job-preview-body">
            <strong>Mô tả công việc</strong>
            <textarea
              className="urgent-job-preview-description"
              aria-label={`Mô tả đầy đủ công việc ${previewJob.title}`}
              readOnly
              rows={7}
              value={
                previewJob.description ||
                `Cơ hội gia nhập ${previewJob.company} ở vị trí ${previewJob.title}. Xem chi tiết để khám phá yêu cầu công việc và quyền lợi dành cho ứng viên.`
              }
            />
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
            {(() => {
              const isPreviewSaved = savedJobIds.includes(previewJob.id);
              return (
                <button
                  type="button"
                  className="urgent-job-preview-save"
                  aria-label={
                    isPreviewSaved
                      ? `Bỏ lưu công việc ${previewJob.title}`
                      : `Lưu công việc ${previewJob.title}`
                  }
                  aria-pressed={isPreviewSaved}
                  disabled={!isSavedJobsSessionResolved || isSavedJobPending(previewJob.id)}
                  onClick={() => handleSaveJob(previewJob.id, previewJob.title)}
                >
                  <Bookmark size={21} weight={isPreviewSaved ? "fill" : "regular"} />
                </button>
              );
            })()}
            <button
              type="button"
              className="urgent-job-preview-apply"
              onClick={() =>
                onApply({
                  id: previewJob.id,
                  title: previewJob.title,
                  company: previewJob.company,
                })
              }
            >
              <BriefcaseBusiness size={18} aria-hidden="true" />
              Ứng tuyển ngay
            </button>
          </div>
        </dialog>
      )}

      {totalPages > 1 && (
        <nav className="urgent-jobs-pagination" aria-label={copy.ariaLabel}>
          <button
            type="button"
            className="urgent-jobs-nav-btn"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label={copy.previous}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="urgent-jobs-dots">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`urgent-jobs-dot${idx === safePage ? " is-active" : ""}`}
                onClick={() => setPage(idx)}
                aria-label={`Trang ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="urgent-jobs-nav-btn"
            disabled={safePage === totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            aria-label={copy.next}
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </section>
  );
}

export function MarketingHomePage() {
  const router = useRouter();

  return <MarketingHomeExperience navigate={(path) => router.push(path)} />;
}

type SelectFieldProps = {
  label: string;
  icon: ReactNode;
  placeholder: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
};

function SelectField({
  label,
  icon,
  placeholder,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: SelectFieldProps) {
  return (
    <div className={`marketing-home-field${open ? " is-open" : ""}`}>
      <span className="marketing-home-field-label">{label}</span>
      <button
        type="button"
        className="marketing-home-control"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={onToggle}
      >
        {icon}
        <span className={value ? "has-value" : "is-placeholder"}>{value || placeholder}</span>
        <ChevronDown size={17} />
      </button>
      {open && (
        <ul className="marketing-home-dropdown" aria-label={label}>
          {value && (
            <li>
              <button
                type="button"
                className="marketing-home-option marketing-home-option-clear"
                onClick={() => onSelect("")}
              >
                {placeholder}
              </button>
            </li>
          )}
          {options.map((item) => (
            <li key={item}>
              <button
                type="button"
                className={`marketing-home-option${value === item ? " is-active" : ""}`}
                onClick={() => onSelect(item)}
              >
                {item}
                {value === item && <Check className="check" size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
