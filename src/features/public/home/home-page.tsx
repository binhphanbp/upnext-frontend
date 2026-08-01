"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { getCandidateSession, type CandidateSession } from "@/features/candidate/session";
import { ApplyModal } from "@/features/public/jobs/components/apply-modal";
import { formatJobSalaryDisplay } from "@/features/public/jobs/components/jobs-page";
import { useRouter } from "@/i18n/navigation";
import { toast } from "@/shared/ui/toast";
import { removeVietnameseAccents } from "@/shared/utils/natural-search";

import { PublicFooter } from "../shared/public-footer";
import { PublicHeader } from "../shared/public-header";
import {
  getHomeData,
  mapHomeCompanies,
  mapHomeJobCard,
  mapHomePost,
  type HomeAction,
  type HomeRecommendationReasonCode,
} from "./api";
import { FeaturedCompanies } from "./featured-companies";
import { FeaturedJobs } from "./featured-jobs";
import { selectPrimaryHomeAction } from "./home-actions";
import type { RecommendationReasonCode } from "./home-personalization";
import {
  getDeadlineTone,
  getDaysUntilExpiration,
  getJobTags,
  isPublicJobAvailable,
  selectExpiringJobs,
  selectLatestJobs,
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

function formatDeadlineWithDate(expiredAt: string | Date | null | undefined, locale: string) {
  const isEnglish = locale === "en";
  if (!expiredAt) return isEnglish ? "No deadline" : "Không giới hạn";

  const expirationTime = new Date(expiredAt).getTime();
  if (Number.isNaN(expirationTime)) return isEnglish ? "Not updated" : "Chưa cập nhật";

  const remainingTime = expirationTime - Date.now();
  if (remainingTime < 0) return isEnglish ? "Expired" : "Đã hết hạn";

  const remainingDays = Math.max(1, Math.ceil(remainingTime / (24 * 60 * 60 * 1000)));
  return isEnglish
    ? `${remainingDays} ${remainingDays === 1 ? "day" : "days"} left`
    : `Còn ${remainingDays} ngày`;
}

function formatCompactLocation(city: string | null | undefined, locale: string) {
  if (!city) return locale === "en" ? "Location pending" : "Chưa cập nhật địa điểm";
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
    latestJobsTitle: "Việc làm mới nhất",
    latestJobsDescription: "Các vị trí IT mới được đăng từ những nhà tuyển dụng đang hoạt động.",
    recommendedJobsTitle: "Gợi ý phù hợp với bạn",
    recommendedJobsDescription:
      "Các vị trí được chọn dựa trên kỹ năng và ưu tiên việc làm của bạn.",
    guestPromptTitle: "Nhận gợi ý việc làm phù hợp hơn",
    guestPromptDescription:
      "Đăng nhập và cập nhật sở thích để UpNext ưu tiên những cơ hội sát với mục tiêu của bạn.",
    guestPromptCta: "Đăng nhập",
    profileActionTitle: "Hoàn thiện hồ sơ để nhận gợi ý phù hợp",
    profileActionDescription:
      "Thêm kỹ năng và ưu tiên việc làm để UpNext hiểu rõ hướng đi của bạn hơn.",
    profileActionCta: "Cập nhật hồ sơ",
    cvActionTitle: "Thêm CV để sẵn sàng ứng tuyển",
    cvActionDescription: "Một CV hoàn chỉnh giúp bạn ứng tuyển nhanh hơn khi gặp cơ hội phù hợp.",
    cvActionCta: "Quản lý CV",
    followedJobsActionTitle: "Công ty bạn theo dõi vừa có việc mới",
    followedJobsActionDescription: "Xem những cơ hội mới được đăng trong 7 ngày qua.",
    followedJobsActionCta: "Xem việc làm",
    applicationActionTitle: "Hồ sơ ứng tuyển của bạn vừa được cập nhật",
    applicationActionDescription: "Kiểm tra trạng thái mới và chuẩn bị cho bước tiếp theo.",
    applicationActionCta: "Xem tiến trình",
    savedJobActionTitle: "Việc làm bạn đã lưu sắp hết hạn",
    savedJobActionDescription: "Xem lại cơ hội này trước khi thời hạn ứng tuyển kết thúc.",
    savedJobActionCta: "Xem việc làm",
    homeDataErrorTitle: "Chưa thể tải nội dung trang chủ",
    homeDataErrorDescription: "Vui lòng thử lại để xem các việc làm và xu hướng mới nhất.",
    homeDataRetry: "Thử lại",
    homeDataRetrying: "Đang thử lại…",
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
    latestJobsTitle: "Latest IT jobs",
    latestJobsDescription: "New IT roles from employers currently hiring on UpNext.",
    recommendedJobsTitle: "Recommended for you",
    recommendedJobsDescription: "Roles selected from your skills and job preferences.",
    guestPromptTitle: "Get more relevant job recommendations",
    guestPromptDescription:
      "Log in and update your preferences so UpNext can prioritize opportunities aligned with your goals.",
    guestPromptCta: "Log in",
    profileActionTitle: "Complete your profile for better matches",
    profileActionDescription:
      "Add skills and job preferences so UpNext can tailor opportunities to you.",
    profileActionCta: "Update profile",
    cvActionTitle: "Add a CV before you apply",
    cvActionDescription: "A complete CV helps you apply faster when the right opportunity appears.",
    cvActionCta: "Manage CVs",
    followedJobsActionTitle: "A followed company just posted new jobs",
    followedJobsActionDescription: "Explore roles published in the last seven days.",
    followedJobsActionCta: "View jobs",
    applicationActionTitle: "Your application status was updated",
    applicationActionDescription: "Review the latest status and prepare for the next step.",
    applicationActionCta: "View progress",
    savedJobActionTitle: "A saved job is closing soon",
    savedJobActionDescription: "Review this opportunity before the application deadline.",
    savedJobActionCta: "View job",
    homeDataErrorTitle: "We could not load the homepage",
    homeDataErrorDescription: "Try again to see the latest jobs and hiring trends.",
    homeDataRetry: "Try again",
    homeDataRetrying: "Trying again…",
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

const recommendationReasonMap: Record<HomeRecommendationReasonCode, RecommendationReasonCode> = {
  SKILL_MATCH: "skill",
  POSITION_MATCH: "position",
  WORKING_MODEL_MATCH: "workingModel",
  LEVEL_MATCH: "level",
  SALARY_OVERLAP: "salary",
  FOLLOWED_COMPANY: "followedCompany",
};

function isHomeRecommendationReasonCode(value: string): value is HomeRecommendationReasonCode {
  return Object.hasOwn(recommendationReasonMap, value);
}

export function MarketingHomeExperience({ navigate }: MarketingHomeExperienceProps) {
  const locale = useLocale();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [openField, setOpenField] = useState<FieldKey | null>(null);
  const [applyJob, setApplyJob] = useState<{ id: string; title: string; company: string } | null>(
    null,
  );

  const copy = locale === "en" ? homeCopy.en : homeCopy.vi;
  const [candidateSession, setCandidateSession] = useState<CandidateSession | null | undefined>(
    undefined,
  );
  const popularKeywords = useMemo(
    () => getPopularKeywordsForLocale(locale === "en" ? "en" : "vi"),
    [locale],
  );
  const heroPopularKeywords = popularKeywords.slice(0, 6);

  const searchCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setCandidateSession(getCandidateSession());
  }, []);

  const {
    data: homeData,
    dataUpdatedAt: homeDataUpdatedAt,
    isError: isHomeError,
    isFetching: isHomeFetching,
    isPending: isHomePending,
    refetch: refetchHome,
  } = useQuery({
    enabled: candidateSession !== undefined,
    queryKey: ["home", candidateSession?.user.id ?? "guest"],
    queryFn: () => getHomeData(candidateSession?.accessToken),
    staleTime: 60_000,
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);
  const candidateState = useMemo(() => {
    if (candidateSession === undefined || isHomePending) return "resolving" as const;
    if (isHomeError) return "unavailable" as const;
    if (!candidateSession) return "guest" as const;

    switch (homeData?.personalization?.state) {
      case "ELIGIBLE":
        return "ready" as const;
      case "INSUFFICIENT":
        return "profile-incomplete" as const;
      case "NOT_LOOKING":
        return "not-looking" as const;
      default:
        return "unavailable" as const;
    }
  }, [candidateSession, homeData?.personalization?.state, isHomeError, isHomePending]);

  const urgentJobs = useMemo(
    () =>
      selectExpiringJobs((homeData?.jobsSection.expiring.items ?? []).map(mapHomeJobCard), { now }),
    [homeData?.jobsSection.expiring.items, now],
  );
  const urgentJobIds = useMemo(() => new Set(urgentJobs.map((job) => job.id)), [urgentJobs]);
  const latestJobs = useMemo(
    () =>
      selectLatestJobs((homeData?.jobsSection.latest.items ?? []).map(mapHomeJobCard), {
        now,
        excludedIds: urgentJobIds,
      }),
    [homeData?.jobsSection.latest.items, now, urgentJobIds],
  );
  const personalizedRecommendations = useMemo(
    () =>
      (homeData?.recommendations?.title === "RECOMMENDED" ? homeData.recommendations.items : [])
        .map((item) => ({
          job: mapHomeJobCard(item.job),
          reasonCodes: item.reasonCodes.flatMap((reason) => {
            return isHomeRecommendationReasonCode(reason) ? [recommendationReasonMap[reason]] : [];
          }),
        }))
        .filter(
          (item) =>
            !urgentJobIds.has(item.job.id) &&
            isPublicJobAvailable(item.job, now) &&
            item.reasonCodes.length > 0,
        ),
    [homeData?.recommendations, now, urgentJobIds],
  );
  const showRecommendations = candidateState === "ready" && personalizedRecommendations.length >= 6;
  const primaryJobSelection = useMemo(
    () => (showRecommendations ? personalizedRecommendations.map((item) => item.job) : latestJobs),
    [latestJobs, personalizedRecommendations, showRecommendations],
  );
  const recommendationReasons = useMemo(
    () =>
      new Map(personalizedRecommendations.map((item) => [item.job.id, item.reasonCodes] as const)),
    [personalizedRecommendations],
  );
  const primaryExcludedJobIds = urgentJobIds;
  const apiJobsData = useMemo(
    () => [...primaryJobSelection, ...urgentJobs],
    [primaryJobSelection, urgentJobs],
  );
  const apiCompaniesData = useMemo(
    () => (homeData ? mapHomeCompanies(homeData) : undefined),
    [homeData],
  );
  const apiPostsData = useMemo(
    () => homeData?.latestPosts.map(mapHomePost) ?? [],
    [homeData?.latestPosts],
  );
  const trustCompanies = useMemo(
    () => homeData?.topCompanies.filter((company) => company.activeJobsCount > 0) ?? [],
    [homeData?.topCompanies],
  );

  const formattedStats = useMemo(() => {
    function formatStatNumber(num: number) {
      return new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN").format(Math.max(0, num));
    }

    return {
      jobs: formatStatNumber(homeData?.stats.openJobsCount ?? 0),
      companies: formatStatNumber(homeData?.stats.activeEmployersCount ?? 0),
      newJobs: formatStatNumber(homeData?.stats.newJobs7dCount ?? 0),
    };
  }, [homeData?.stats, locale]);
  const homeHasFatalError = isHomeError && !homeData;
  const allowApplicationCtas = candidateState !== "not-looking";

  const urgentJobsList = useMemo(() => {
    return urgentJobs.map((job, index) => {
      const daysUntilExpiration = getDaysUntilExpiration(job, now);
      return {
        id: job.id,
        logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
        title: job.title,
        company: job.company?.name || "UpNext Partner",
        salary: formatJobSalaryDisplay(job, ""),
        location: formatCompactLocation(job.jobPostLocations?.[0]?.jobLocation?.city, locale),
        mode: job.employmentType?.name || "Full-time",
        tags: getJobTags(job),
        deadline: formatDeadlineWithDate(job.expiredAt, locale),
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
  }, [locale, urgentJobs, now]);

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
                <strong>
                  {isHomePending ? "…" : homeHasFatalError ? "—" : formattedStats.jobs}
                </strong>
                <span>{copy.statsJobs}</span>
              </p>
            </article>
            <article>
              <i>
                <Building2 size={25} />
              </i>
              <p>
                <strong>
                  {isHomePending ? "…" : homeHasFatalError ? "—" : formattedStats.companies}
                </strong>
                <span>{copy.statsCompanies}</span>
              </p>
            </article>
            <article>
              <i>
                <Sparkles size={25} />
              </i>
              <p>
                <strong>
                  {isHomePending ? "…" : homeHasFatalError ? "—" : formattedStats.newJobs}
                </strong>
                <span>{copy.statsNewJobs}</span>
              </p>
            </article>
          </div>

          {isHomePending ? (
            <div className="marketing-home-trusted" aria-hidden="true">
              <span>{copy.trustedBy}</span>
              <div className="marketing-home-marquee">
                <div className="marketing-home-marquee-track">
                  <b className="marketing-home-company">•••</b>
                  <b className="marketing-home-company">•••</b>
                  <b className="marketing-home-company">•••</b>
                </div>
              </div>
            </div>
          ) : trustCompanies.length > 0 ? (
            <div className="marketing-home-trusted">
              <span>{copy.trustedBy}</span>
              <div className="marketing-home-marquee">
                <div className="marketing-home-marquee-track" aria-hidden="true">
                  {trustCompanies.map((company) => (
                    <b
                      className={`marketing-home-company marketing-home-company-${company.id}`}
                      key={company.id}
                    >
                      {company.name}
                    </b>
                  ))}
                  {/* Duplicate set creates the seamless loop; hidden when motion is reduced. */}
                  {trustCompanies.map((company) => (
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
          ) : null}
        </section>

        {homeHasFatalError ? (
          <section
            className="marketing-home-jobs"
            aria-labelledby="home-data-error-title"
            role="alert"
          >
            <header className="marketing-home-jobs-head">
              <div>
                <h2 id="home-data-error-title">{copy.homeDataErrorTitle}</h2>
                <p>{copy.homeDataErrorDescription}</p>
              </div>
            </header>
            <div className="marketing-home-action-state">
              <button
                type="button"
                className="marketing-home-action-retry"
                onClick={() => void refetchHome()}
                disabled={isHomeFetching}
              >
                {isHomeFetching ? copy.homeDataRetrying : copy.homeDataRetry}
              </button>
            </div>
          </section>
        ) : (
          <>
            <HomeCandidateActionPanel
              navigate={navigate}
              copy={copy}
              candidateState={candidateState}
              actions={homeData?.actions ?? []}
            />
            <FeaturedJobs
              navigate={navigate}
              onApply={setApplyJob}
              allowApply={allowApplicationCtas}
              jobs={apiJobsData}
              excludedJobIds={primaryExcludedJobIds}
              selectedJobs={primaryJobSelection}
              matchReasons={showRecommendations ? recommendationReasons : undefined}
              sectionTitle={showRecommendations ? copy.recommendedJobsTitle : copy.latestJobsTitle}
              sectionDescription={
                showRecommendations ? copy.recommendedJobsDescription : copy.latestJobsDescription
              }
              isLoading={isHomePending}
              isError={false}
              onRetry={() => void refetchHome()}
              isRetrying={isHomeFetching}
            />
            <HomeGuestRecommendationPrompt
              navigate={navigate}
              copy={copy}
              candidateState={candidateState}
            />
            <UrgentJobsSection
              navigate={navigate}
              urgentJobs={urgentJobsList}
              onApply={setApplyJob}
              allowApply={allowApplicationCtas}
              isLoading={isHomePending}
              isError={false}
              onRetry={() => void refetchHome()}
              isRetrying={isHomeFetching}
            />
            <FeaturedCompanies
              navigate={navigate}
              companies={apiCompaniesData}
              isLoading={isHomePending}
              isError={false}
              onRetry={() => void refetchHome()}
              isRetrying={isHomeFetching}
            />
            <JobMarket
              {...(homeData?.marketInsight ? { insight: homeData.marketInsight } : {})}
              updatedAt={homeDataUpdatedAt}
              isLoading={isHomePending}
              isError={!homeData?.marketInsight && !isHomePending}
              onRetry={() => void refetchHome()}
              isRetrying={isHomeFetching}
            />
            <InsightsCarousel isLoading={isHomePending} posts={apiPostsData} />
          </>
        )}

        <PublicFooter navigate={navigate} />

        {applyJob && (
          <ApplyModal isOpen={!!applyJob} onClose={() => setApplyJob(null)} job={applyJob} />
        )}
      </section>
    </main>
  );
}

function HomeGuestRecommendationPrompt({
  navigate,
  copy,
  candidateState,
}: {
  navigate: (path: string) => void;
  copy: (typeof homeCopy)["vi"] | (typeof homeCopy)["en"];
  candidateState:
    | "resolving"
    | "guest"
    | "profile-incomplete"
    | "ready"
    | "not-looking"
    | "unavailable";
}) {
  if (candidateState !== "guest") return null;

  return (
    <section
      className="marketing-home-candidate-action"
      aria-labelledby="home-guest-recommendation-title"
    >
      <span className="marketing-home-candidate-action-icon" aria-hidden="true">
        <Sparkles size={18} />
      </span>
      <div>
        <h2 id="home-guest-recommendation-title">{copy.guestPromptTitle}</h2>
        <p>{copy.guestPromptDescription}</p>
      </div>
      <button type="button" onClick={() => navigate("/login")}>
        {copy.guestPromptCta} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </section>
  );
}

function HomeCandidateActionPanel({
  navigate,
  copy,
  candidateState,
  actions,
}: {
  navigate: (path: string) => void;
  copy: (typeof homeCopy)["vi"] | (typeof homeCopy)["en"];
  candidateState:
    | "resolving"
    | "guest"
    | "profile-incomplete"
    | "ready"
    | "not-looking"
    | "unavailable";
  actions: readonly HomeAction[];
}) {
  if (
    candidateState === "guest" ||
    candidateState === "resolving" ||
    candidateState === "not-looking" ||
    candidateState === "unavailable"
  ) {
    return null;
  }

  const action =
    selectPrimaryHomeAction(actions) ??
    (candidateState === "profile-incomplete" ? ({ type: "MISSING_PREFERENCES" } as const) : null);
  if (!action) return null;

  const content = (() => {
    switch (action.type) {
      case "APPLICATION_UPDATED":
        return {
          title: copy.applicationActionTitle,
          description: copy.applicationActionDescription,
          cta: copy.applicationActionCta,
          href: action.applicationId
            ? `/candidate/applications/${action.applicationId}`
            : "/candidate/applications",
          icon: <BriefcaseBusiness size={18} />,
        };
      case "SAVED_JOB_EXPIRING":
        return {
          title: copy.savedJobActionTitle,
          description: copy.savedJobActionDescription,
          cta: copy.savedJobActionCta,
          href: action.jobId ? `/jobs/${action.jobId}` : "/candidate/saved-jobs",
          icon: <Clock size={18} />,
        };
      case "FOLLOWED_COMPANY_NEW_JOB":
        return {
          title: copy.followedJobsActionTitle,
          description: copy.followedJobsActionDescription,
          cta: copy.followedJobsActionCta,
          href: action.jobId ? `/jobs/${action.jobId}` : "/jobs",
          icon: <Sparkles size={18} />,
        };
      case "MISSING_CV":
        return {
          title: copy.cvActionTitle,
          description: copy.cvActionDescription,
          cta: copy.cvActionCta,
          href: "/candidate/profile?section=documents",
          icon: <BriefcaseBusiness size={18} />,
        };
      case "MISSING_PREFERENCES":
        return {
          title: copy.profileActionTitle,
          description: copy.profileActionDescription,
          cta: copy.profileActionCta,
          href: "/candidate/profile",
          icon: <Sparkles size={18} />,
        };
    }
  })();

  return (
    <section className="marketing-home-candidate-action" aria-labelledby="home-action-title">
      <span className="marketing-home-candidate-action-icon" aria-hidden="true">
        {content.icon}
      </span>
      <div>
        <h2 id="home-action-title">{content.title}</h2>
        <p>{content.description}</p>
      </div>
      <button type="button" onClick={() => navigate(content.href)}>
        {content.cta} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </section>
  );
}

function UrgentJobsSection({
  navigate,
  urgentJobs,
  onApply,
  allowApply,
  isLoading,
  isError,
  onRetry,
  isRetrying,
}: {
  navigate: (path: string) => void;
  onApply: (job: { id: string; title: string; company: string }) => void;
  allowApply: boolean;
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
      onError: () =>
        toast.error(
          locale === "en"
            ? "Could not update saved jobs. Please try again."
            : "Không thể cập nhật việc làm đã lưu. Vui lòng thử lại.",
        ),
      onSuccess: (isSaved) => {
        const toastId = `save-job-${jobId}`;
        toast.success(
          locale === "en"
            ? isSaved
              ? `Saved ${jobTitle}`
              : `Removed ${jobTitle} from saved jobs`
            : isSaved
              ? `Đã lưu ${jobTitle}`
              : `Đã bỏ lưu ${jobTitle}`,
          {
            action: {
              label: locale === "en" ? "Undo" : "Hoàn tác",
              onClick: () => {
                toast.dismiss(toastId);
                const didUndoStart = setSavedJob(jobId, !isSaved, {
                  onError: () =>
                    toast.error(
                      locale === "en"
                        ? "Could not undo this change. Please try again."
                        : "Không thể hoàn tác. Vui lòng thử lại.",
                    ),
                  onSuccess: (restored) => {
                    toast.success(
                      locale === "en"
                        ? restored
                          ? `Saved ${jobTitle} again`
                          : `Undid saving ${jobTitle}`
                        : restored
                          ? `Đã lưu lại ${jobTitle}`
                          : `Đã hoàn tác lưu ${jobTitle}`,
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
          save: (title: string) => `Save ${title}`,
          unsave: (title: string) => `Remove ${title} from saved jobs`,
          descriptionTitle: "Job description",
          descriptionAria: (title: string) => `Full job description for ${title}`,
          fallbackDescription: (company: string, title: string) =>
            `Join ${company} as a ${title}. View the full job details to explore the requirements and benefits.`,
          details: "View details",
          apply: "Apply now",
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
          save: (title: string) => `Lưu công việc ${title}`,
          unsave: (title: string) => `Bỏ lưu công việc ${title}`,
          descriptionTitle: "Mô tả công việc",
          descriptionAria: (title: string) => `Mô tả đầy đủ công việc ${title}`,
          fallbackDescription: (company: string, title: string) =>
            `Cơ hội gia nhập ${company} ở vị trí ${title}. Xem chi tiết để khám phá yêu cầu công việc và quyền lợi dành cho ứng viên.`,
          details: "Xem chi tiết",
          apply: "Ứng tuyển ngay",
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
                              aria-label={isSaved ? copy.unsave(job.title) : copy.save(job.title)}
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
            <strong>{copy.descriptionTitle}</strong>
            <textarea
              className="urgent-job-preview-description"
              aria-label={copy.descriptionAria(previewJob.title)}
              readOnly
              rows={7}
              value={
                previewJob.description ||
                copy.fallbackDescription(previewJob.company, previewJob.title)
              }
            />
            <div className="urgent-job-preview-tags">
              {previewJob.tags.slice(0, 4).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <button type="button" onClick={() => navigate(`/jobs/${previewJob.id}`)}>
              {copy.details} <ArrowRight size={15} aria-hidden="true" />
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
                    isPreviewSaved ? copy.unsave(previewJob.title) : copy.save(previewJob.title)
                  }
                  aria-pressed={isPreviewSaved}
                  disabled={!isSavedJobsSessionResolved || isSavedJobPending(previewJob.id)}
                  onClick={() => handleSaveJob(previewJob.id, previewJob.title)}
                >
                  <Bookmark size={21} weight={isPreviewSaved ? "fill" : "regular"} />
                </button>
              );
            })()}
            {allowApply ? (
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
                {copy.apply}
              </button>
            ) : null}
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
