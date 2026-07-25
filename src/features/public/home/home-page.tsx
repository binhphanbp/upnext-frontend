"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { ApplyModal } from "@/features/public/jobs/components/apply-modal";
import { useRouter } from "@/i18n/navigation";
import { removeVietnameseAccents } from "@/shared/utils/natural-search";

import { PublicFooter } from "../shared/public-footer";
import { PublicHeader } from "../shared/public-header";
import { getPublicCompanies, getPublicJobs } from "./api";
import { FeaturedCompanies } from "./featured-companies";
import { FeaturedJobs } from "./featured-jobs";
import { HomeActionToast, type HomeActionFeedback } from "./home-action-toast";
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
  MapPin,
  Search,
  Sparkles,
  UsersRound,
} from "./marketing-icons";
import { getPopularKeywordsForLocale } from "./popular-keywords";

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

const trustedCompanies = [
  ["FPT", "Software"],
  ["VNG", ""],
  ["viettel", "solutions"],
  ["tiki", ""],
  ["momo", ""],
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
  if (!city) return "Việt Nam";
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

const urgentJobs = [
  {
    id: "brighttech-frontend",
    logo: "",
    title: "Frontend Developer",
    company: "BrightTech",
    salary: "18 - 25 triệu",
    location: "Hà Nội",
    mode: "Hybrid",
    tags: ["React", "TypeScript", "Next.js"],
    deadline: "Còn 3 ngày",
    deadlineTone: "red",
    applicants: "12 ứng viên",
    views: "185 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Junior",
    bgClass: "bg-slate-800",
  },
  {
    id: "novalabs-backend",
    logo: "",
    title: "Backend Developer",
    company: "Nova Labs",
    salary: "20 - 30 triệu",
    location: "TP.HCM",
    mode: "Remote",
    tags: ["Node.js", "PostgreSQL", "Docker"],
    deadline: "Còn 5 ngày",
    deadlineTone: "red",
    applicants: "18 ứng viên",
    views: "245 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Middle",
    bgClass: "bg-purple-600",
  },
  {
    id: "skysoft-data",
    logo: "",
    title: "Data Engineer",
    company: "SkySoft",
    salary: "22 - 35 triệu",
    location: "Đà Nẵng",
    mode: "Onsite",
    tags: ["Python", "SQL", "Airflow"],
    deadline: "Còn 2 ngày",
    deadlineTone: "red",
    applicants: "9 ứng viên",
    views: "112 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Middle",
    bgClass: "bg-sky-500",
  },
  {
    id: "pixelworks-uiux",
    logo: "",
    title: "UI/UX Designer",
    company: "Pixel Works",
    salary: "15 - 22 triệu",
    location: "Hà Nội",
    mode: "Hybrid",
    tags: ["Figma", "Design System", "UX Research"],
    deadline: "Còn 4 ngày",
    deadlineTone: "red",
    applicants: "14 ứng viên",
    views: "192 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Junior",
    bgClass: "bg-rose-500",
  },
  {
    id: "fpt-devops-cloud",
    logo: "",
    title: "DevOps Cloud Infrastructure Engineer",
    company: "FPT Software",
    salary: "40 - 70 triệu",
    location: "Hà Nội",
    mode: "Hybrid",
    tags: ["AWS", "Kubernetes", "Docker"],
    deadline: "Còn 7 ngày",
    deadlineTone: "red",
    applicants: "15 ứng viên",
    views: "210 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Senior",
    bgClass: "bg-slate-800",
  },
  {
    id: "vng-mobile-engineer",
    logo: "",
    title: "Mobile Engineer (React Native)",
    company: "VNG Corporation",
    salary: "22 - 40 triệu",
    location: "TP.HCM",
    mode: "Hybrid",
    tags: ["React Native", "iOS", "Android"],
    deadline: "Còn 10 ngày",
    deadlineTone: "red",
    applicants: "20 ứng viên",
    views: "310 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Middle",
    bgClass: "bg-purple-600",
  },
  {
    id: "luvina-bridge-engineer",
    logo: "",
    title: "Bridge System Engineer (BrSE)",
    company: "Luvina Software",
    salary: "22 - 40 triệu",
    location: "Hà Nội",
    mode: "Onsite",
    tags: ["Japanese", "Java", "System Design"],
    deadline: "Còn 12 ngày",
    deadlineTone: "red",
    applicants: "8 ứng viên",
    views: "150 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Middle",
    bgClass: "bg-sky-500",
  },
  {
    id: "misa-product-designer",
    logo: "",
    title: "Product Designer - Business Software",
    company: "MISA",
    salary: "22 - 40 triệu",
    location: "Hà Nội",
    mode: "Hybrid",
    tags: ["Figma", "UI/UX", "User Research"],
    deadline: "Còn 15 ngày",
    deadlineTone: "red",
    applicants: "16 ứng viên",
    views: "230 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Middle",
    bgClass: "bg-rose-500",
  },
  {
    id: "cmc-data-engineer",
    logo: "",
    title: "Senior Data Engineer",
    company: "CMC Global",
    salary: "22 - 40 triệu",
    location: "Hà Nội",
    mode: "Hybrid",
    tags: ["Python", "Spark", "PostgreSQL"],
    deadline: "Còn 18 ngày",
    deadlineTone: "red",
    applicants: "11 ứng viên",
    views: "175 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Senior",
    bgClass: "bg-slate-800",
  },
  {
    id: "mw-product-manager",
    logo: "",
    title: "Product Manager - Retail Technology",
    company: "Mobile World Investment",
    salary: "40 - 70 triệu",
    location: "TP.HCM",
    mode: "Onsite",
    tags: ["Product Strategy", "Agile", "E-commerce"],
    deadline: "Còn 22 ngày",
    deadlineTone: "red",
    applicants: "14 ứng viên",
    views: "190 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Lead",
    bgClass: "bg-purple-600",
  },
  {
    id: "viettel-security-engineer",
    logo: "",
    title: "Cyber Security Specialist",
    company: "Viettel Solutions",
    salary: "30 - 55 triệu",
    location: "Đà Nẵng",
    mode: "Onsite",
    tags: ["Pentest", "SIEM", "Cloud Security"],
    deadline: "Còn 25 ngày",
    deadlineTone: "red",
    applicants: "7 ứng viên",
    views: "140 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Senior",
    bgClass: "bg-sky-500",
  },
  {
    id: "sepay-fullstack-dev",
    logo: "",
    title: "Fullstack Engineer (React/Node)",
    company: "SePay Vietnam",
    salary: "25 - 45 triệu",
    location: "TP.HCM",
    mode: "Hybrid",
    tags: ["React", "Node.js", "PostgreSQL"],
    deadline: "Còn 28 ngày",
    deadlineTone: "red",
    applicants: "19 ứng viên",
    views: "280 lượt xem",
    competition: "Mới mở · ít ứng viên",
    progress: 25,
    level: "Middle",
    bgClass: "bg-rose-500",
  },
];

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
    statsMatches: "Hồ sơ được kết nối",
    statsCandidates: "Ứng viên đã tin tưởng",
    trustedBy: "Được tin tưởng bởi các công ty công nghệ hàng đầu",
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
    statsMatches: "Profiles matched",
    statsCandidates: "Trusted candidates",
    trustedBy: "Trusted by leading technology companies",
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
  const [actionFeedback, setActionFeedback] = useState<HomeActionFeedback | null>(null);

  const copy = locale === "en" ? homeCopy.en : homeCopy.vi;
  const popularKeywords = useMemo(
    () => getPopularKeywordsForLocale(locale === "en" ? "en" : "vi"),
    [locale],
  );
  const heroPopularKeywords = popularKeywords.slice(0, 6);

  const searchCardRef = useRef<HTMLElement | null>(null);
  const dismissActionFeedback = useCallback(() => setActionFeedback(null), []);

  const { data: apiJobsData } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
  });

  const { data: apiCompaniesData } = useQuery({
    queryKey: ["public-companies"],
    queryFn: getPublicCompanies,
  });

  const jobsCount = useMemo(() => apiJobsData?.length || 0, [apiJobsData]);
  const companiesCount = useMemo(
    () => apiCompaniesData?.meta?.total || apiCompaniesData?.items?.length || 0,
    [apiCompaniesData],
  );
  // Estimate candidates count starting from 50,000 plus dynamic variation
  const candidatesCount = useMemo(
    () => 50000 + jobsCount * 15 + companiesCount * 40,
    [jobsCount, companiesCount],
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
      candidates: formatStatNumber(candidatesCount),
    };
  }, [jobsCount, companiesCount, candidatesCount, locale]);

  const urgentJobsList = useMemo(() => {
    if (!apiJobsData || apiJobsData.length === 0) return urgentJobs;

    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    // Filter active jobs expiring within 30 days (0 < remainingTime <= 30 days)
    const validJobs = apiJobsData.filter((job) => {
      if (!job.expiredAt) return false;
      const expirationTime = new Date(job.expiredAt).getTime();
      const remainingTime = expirationTime - now;
      return remainingTime > 0 && remainingTime <= THIRTY_DAYS_MS;
    });

    // Sort by nearest deadline first (expiredAt ASC)
    const sorted = [...validJobs].sort((a, b) => {
      const timeA = new Date(a.expiredAt!).getTime();
      const timeB = new Date(b.expiredAt!).getTime();
      return timeA - timeB;
    });

    // Fallback if less than 3 jobs match strictly 30 days: take any unexpired job sorted by deadline
    const listSource =
      sorted.length >= 3
        ? sorted
        : apiJobsData
            .filter((job) => {
              if (!job.expiredAt) return true;
              return new Date(job.expiredAt).getTime() > now;
            })
            .sort((a, b) => {
              const timeA = a.expiredAt ? new Date(a.expiredAt).getTime() : Infinity;
              const timeB = b.expiredAt ? new Date(b.expiredAt).getTime() : Infinity;
              return timeA - timeB;
            });

    const mapped = listSource.map((job, index) => {
      const isUrgent = index % 2 === 0;
      return {
        id: job.id,
        logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
        title: job.title,
        company: job.company?.name || "UpNext Partner",
        salary:
          job.salaryIsVisible && job.salaryMin && job.salaryMax
            ? `${Math.round(job.salaryMin / 1000000)} - ${Math.round(job.salaryMax / 1000000)} triệu`
            : "Thỏa thuận",
        location: formatCompactLocation(job.jobPostLocations?.[0]?.jobLocation?.city),
        mode: job.employmentType?.name || "Full-time",
        tags:
          job.jobPostSkills && job.jobPostSkills.length > 0
            ? job.jobPostSkills.map((s) => s.skill.name)
            : ([job.jobCategory?.name, job.employmentType?.name, job.experienceLevel?.name].filter(
                Boolean,
              ) as string[]),
        deadline: formatDeadlineWithDate(job.expiredAt),
        deadlineTone: isUrgent ? "red" : "amber",
        applicants: "12 ứng viên",
        views: "185 lượt xem",
        competition: "Mới mở · ít ứng viên",
        progress: 25,
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

    return mapped;
  }, [apiJobsData]);

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
                <strong>{formattedStats.jobs}</strong>
                <span>{copy.statsJobs}</span>
              </p>
            </article>
            <article>
              <i>
                <Building2 size={25} />
              </i>
              <p>
                <strong>{formattedStats.companies}</strong>
                <span>{copy.statsCompanies}</span>
              </p>
            </article>
            <article>
              <i>
                <UsersRound size={25} />
              </i>
              <p>
                <strong>{formattedStats.candidates}</strong>
                <span>{copy.statsCandidates}</span>
              </p>
            </article>
          </div>

          <div className="marketing-home-trusted">
            <span>{copy.trustedBy}</span>
            <div className="marketing-home-marquee">
              <div className="marketing-home-marquee-track" aria-hidden="true">
                {trustedCompanies.map(([name, suffix]) => (
                  <b className={`marketing-home-company marketing-home-company-${name}`} key={name}>
                    {name}
                    <small>{suffix}</small>
                  </b>
                ))}
                {/* Duplicate set creates the seamless loop; hidden when motion is reduced. */}
                {trustedCompanies.map(([name, suffix]) => (
                  <b
                    className={`marketing-home-company marketing-home-company-clone marketing-home-company-${name}`}
                    key={`${name}-clone`}
                  >
                    {name}
                    <small>{suffix}</small>
                  </b>
                ))}
              </div>
            </div>
          </div>
        </section>

        <UrgentJobsSection navigate={navigate} urgentJobs={urgentJobsList} onApply={setApplyJob} />

        <FeaturedJobs navigate={navigate} onApply={setApplyJob} onFeedback={setActionFeedback} />
        <FeaturedCompanies navigate={navigate} onFeedback={setActionFeedback} />
        <JobMarket navigate={navigate} />
        <InsightsCarousel />

        <PublicFooter navigate={navigate} />

        {applyJob && (
          <ApplyModal isOpen={!!applyJob} onClose={() => setApplyJob(null)} job={applyJob} />
        )}
        <HomeActionToast feedback={actionFeedback} onDismiss={dismissActionFeedback} />
      </section>
    </main>
  );
}

function UrgentJobsSection({
  navigate,
  urgentJobs,
  onApply,
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
    deadlineTone: string;
    applicants: string;
    views: string;
    competition: string;
    progress: number;
    level: string;
    bgClass: string;
    description?: string;
    address?: string;
  }>;
}) {
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => new Set());
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<number | null>(null);
  const previewCloseTimerRef = useRef<number | null>(null);
  const pageSize = 9;

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

  function openPreview(jobId: string) {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
      previewCloseTimerRef.current = null;
    }
    setPreviewJobId(jobId);
  }

  function schedulePreviewClose() {
    if (previewCloseTimerRef.current !== null) {
      window.clearTimeout(previewCloseTimerRef.current);
    }
    previewCloseTimerRef.current = window.setTimeout(() => {
      setPreviewJobId(null);
      previewCloseTimerRef.current = null;
    }, 140);
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

  function toggleSavedJob(jobId: string) {
    setSavedJobIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
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

  return (
    <section
      className={`marketing-home-urgent${previewJob ? " is-previewing" : ""}`}
      aria-label="Việc cần tuyển gấp"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <header className="marketing-home-urgent-head">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <h2 className="m-0 text-2xl font-bold tracking-tight text-slate-900">
              Việc cần tuyển gấp
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Các vị trí đang cần tuyển gấp – nộp hồ sơ ngay để không bỏ lỡ cơ hội nghề nghiệp tốt.
          </p>
        </div>
        <button
          type="button"
          className="marketing-home-urgent-all"
          onClick={() => navigate("/jobs")}
        >
          Xem tất cả <ChevronRight size={16} />
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
                {slideJobs.map((job) => (
                  <article className="urgent-job-card group" key={job.id}>
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
                              onMouseEnter={() => openPreview(job.id)}
                              onMouseLeave={schedulePreviewClose}
                              onFocus={() => openPreview(job.id)}
                              onBlur={schedulePreviewClose}
                              onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  closePreviewAndRestoreFocus();
                                }
                              }}
                              aria-controls="urgent-job-preview"
                              aria-expanded={previewJobId === job.id}
                              title={job.title}
                            >
                              {job.title}
                            </button>
                          </h3>
                          <button
                            type="button"
                            className="urgent-job-save"
                            aria-label={
                              savedJobIds.has(job.id)
                                ? `Bỏ lưu công việc ${job.title}`
                                : `Lưu công việc ${job.title}`
                            }
                            aria-pressed={savedJobIds.has(job.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSavedJob(job.id);
                            }}
                          >
                            <Bookmark
                              size={20}
                              weight={savedJobIds.has(job.id) ? "fill" : "regular"}
                            />
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
                      <span className="urgent-job-deadline-badge flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                        {job.deadline}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewJob && (
        <dialog
          open
          id="urgent-job-preview"
          className="urgent-job-preview"
          aria-labelledby="urgent-job-preview-title"
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
            <button
              type="button"
              className="urgent-job-preview-save"
              aria-label={
                savedJobIds.has(previewJob.id)
                  ? `Bỏ lưu công việc ${previewJob.title}`
                  : `Lưu công việc ${previewJob.title}`
              }
              aria-pressed={savedJobIds.has(previewJob.id)}
              onClick={() => toggleSavedJob(previewJob.id)}
            >
              <Bookmark size={21} weight={savedJobIds.has(previewJob.id) ? "fill" : "regular"} />
            </button>
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
        <nav className="urgent-jobs-pagination" aria-label="Phân trang việc tuyển gấp">
          <button
            type="button"
            className="urgent-jobs-nav-btn"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Trang trước"
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
            aria-label="Trang sau"
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
