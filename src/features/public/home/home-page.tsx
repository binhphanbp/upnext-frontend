"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { getCandidateSession } from "@/features/candidate/session";
import { ApplyModal } from "@/features/public/jobs/components/apply-modal";
import { useRouter } from "@/i18n/navigation";

import { PublicFooter } from "../shared/public-footer";
import { PublicHeader } from "../shared/public-header";
import { getPublicCompanies, getPublicJobs } from "./api";
import { FeaturedCompanies } from "./featured-companies";
import { FeaturedJobs } from "./featured-jobs";
import { JobMarket } from "./job-market";
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  UsersRound,
  User,
  Globe,
  Cloud,
} from "./marketing-icons";
import { buildPopularKeywordSlides, getPopularKeywordsForLocale } from "./popular-keywords";
import { TechOrbit } from "./tech-orbit";

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
];

const homeCopy = {
  vi: {
    employerSmall: "Dành cho",
    employerLabel: "Nhà Tuyển Dụng",
    languageLabel: "Chọn ngôn ngữ",
    login: "Đăng nhập",
    register: "Đăng ký",
    eyebrow: "Nền tảng tuyển dụng IT hàng đầu",
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
    submit: "Tìm việc",
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
    eyebrow: "Leading IT recruitment platform",
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

  const copy = locale === "en" ? homeCopy.en : homeCopy.vi;
  const popularKeywords = useMemo(
    () => getPopularKeywordsForLocale(locale === "en" ? "en" : "vi"),
    [locale],
  );
  const popularKeywordSlides = useMemo(
    () => buildPopularKeywordSlides(popularKeywords, { itemsPerSlide: 6 }),
    [popularKeywords],
  );

  const searchCardRef = useRef<HTMLElement | null>(null);

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
    const mapped = apiJobsData.slice(0, 4).map((job, index) => {
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
        location: job.jobPostLocations?.[0]?.jobLocation?.city || "Việt Nam",
        mode: job.employmentType?.name || "Full-time",
        tags: [job.jobCategory?.name, job.employmentType?.name, job.experienceLevel?.name].filter(
          Boolean,
        ) as string[],
        deadline: "Còn 15 ngày",
        deadlineTone: isUrgent ? "red" : "amber",
        applicants: "12 ứng viên",
        views: "185 lượt xem",
        competition: "Mới mở · ít ứng viên",
        progress: 25,
        level: job.experienceLevel?.name || "Junior",
        bgClass:
          index === 0
            ? "bg-slate-800"
            : index === 1
              ? "bg-purple-600"
              : index === 2
                ? "bg-sky-500"
                : "bg-rose-500",
      };
    });

    if (mapped.length < 4) {
      return [...mapped, ...urgentJobs.slice(0, 4 - mapped.length)];
    }
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
    const source = query
      ? keywordSuggestions.filter((item) => item.toLowerCase().includes(query))
      : keywordSuggestions;
    return source.slice(0, 6);
  }, [keyword]);

  function runSearch(overrides?: { keyword?: string }) {
    const params = new URLSearchParams();
    const term = (overrides?.keyword ?? keyword).trim();
    if (term) params.set("keyword", term);
    if (location) params.set("location", location);
    setOpenField(null);
    const query = params.toString();
    navigate(query ? `/jobs?${query}` : "/jobs");
  }

  function toggleField(field: FieldKey) {
    setOpenField((current) => (current === field ? null : field));
  }

  return (
    <main className="marketing-home-page">
      <PublicHeader navigate={navigate} />

      <section className="marketing-home-content">
        <section className="marketing-home-hero">
          <div className="marketing-home-copy">
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
              <form
                className="marketing-home-search-grid"
                onSubmit={(event) => {
                  event.preventDefault();
                  runSearch();
                }}
              >
                <div
                  className={`marketing-home-field marketing-home-field-keyword${openField === "keyword" ? " is-open" : ""}`}
                >
                  <div className="marketing-home-control">
                    <Search size={20} />
                    <input
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

                <button type="submit" className="marketing-home-search-submit">
                  <Search size={19} /> {copy.submit}
                </button>
              </form>
            </section>

            <div className="marketing-home-popular">
              <span>{copy.popular}</span>
              <div className="marketing-home-popular-viewport">
                <div className="marketing-home-popular-track">
                  {popularKeywordSlides.map((group, index) => (
                    <div
                      className="marketing-home-popular-row"
                      key={`${group.map((keyword) => keyword.query).join("-")}-${index}`}
                      aria-hidden={index === popularKeywordSlides.length - 1 ? "true" : undefined}
                    >
                      {group.map((keyword) => (
                        <button
                          key={keyword.query}
                          type="button"
                          title={keyword.label}
                          aria-label={keyword.label}
                          tabIndex={index === popularKeywordSlides.length - 1 ? -1 : undefined}
                          onClick={() => {
                            setKeyword(keyword.query);
                            runSearch({ keyword: keyword.query });
                          }}
                        >
                          {keyword.shortLabel ?? keyword.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="marketing-home-visual" aria-label="Ứng viên IT trên nền tảng UpNext">
            <div className="marketing-home-stage">
              <svg
                className="marketing-home-stage-bg"
                viewBox="0 0 600 600"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <linearGradient id="v2blobA" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#d6f5e6" />
                    <stop offset="1" stopColor="#eafaf2" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="v2blobB" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#c7f0de" stopOpacity="0.7" />
                    <stop offset="1" stopColor="#eafaf2" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Large soft organic blobs flowing in from the right. */}
                <path
                  d="M392 60c70-26 150-8 178 64 30 74-6 150-58 196-56 50-58 118-126 140-64 20-150 6-198-48-44-50-36-118 0-176 40-64 26-140 92-178 36-22 76-22 112-2z"
                  fill="url(#v2blobA)"
                />
                <path
                  d="M470 360c54-8 104 22 116 74 12 50-14 104-64 124-46 18-104 4-130-40-24-42-12-100 28-130 16-12 32-26 50-28z"
                  fill="url(#v2blobB)"
                />

                {/* Thin concentric connector arcs centered behind the figure. */}
                <circle
                  cx="300"
                  cy="300"
                  r="210"
                  stroke="#bfe9d6"
                  strokeWidth="1.5"
                  strokeDasharray="2 9"
                />
                <circle cx="300" cy="300" r="262" stroke="#d6efe3" strokeWidth="1.5" />

                {/* Connector dots sitting on the arcs near the tech bubbles. */}
                <circle cx="455" cy="150" r="6" fill="#10b981" />
                <circle cx="520" cy="300" r="5" fill="#34d399" />
                <circle cx="250" cy="120" r="5" fill="#10b981" opacity="0.7" />
                <circle cx="150" cy="430" r="6" fill="#10b981" />
              </svg>
              <span
                className="marketing-home-stage-dot marketing-home-stage-dot-1"
                aria-hidden="true"
              />
              <span
                className="marketing-home-stage-dot marketing-home-stage-dot-2"
                aria-hidden="true"
              />

              <Image
                className="marketing-home-hero-banner"
                src="/assets/marketing/home/hero-banner.png"
                alt="Ứng viên IT đang làm việc trên nền tảng UpNext"
                width={720}
                height={520}
                draggable={false}
                priority
              />

              {/* Floating job card */}
              <div className="marketing-home-float marketing-home-float-job" aria-hidden="true">
                <div className="float-job-head">
                  <span className="float-job-badge">
                    <Sparkles size={12} /> Nổi bật
                  </span>
                  <Bookmark size={16} />
                </div>
                <b className="float-job-title">Senior Frontend Developer</b>
                <span className="float-job-company">
                  <Building2 size={13} /> UpNext • Hà Nội
                </span>
                <div className="float-job-tags">
                  <i>React</i>
                  <i>TypeScript</i>
                  <i>Tailwind</i>
                </div>
                <strong className="float-job-salary">25 - 40 triệu VND</strong>
              </div>

              {/* Interactive orbit of tech skills — drag to spin. */}
              <TechOrbit />

              {/* Salary insight card */}
              <div className="marketing-home-float marketing-home-float-salary" aria-hidden="true">
                <span className="float-salary-label">Mức lương trung bình</span>
                <span className="float-salary-role">Frontend Developer</span>
                <strong className="float-salary-value">24.5 triệu</strong>
                <span className="float-salary-trend">
                  <TrendingUp size={13} /> 12% so với tháng trước
                </span>
                <span className="float-salary-spark" aria-hidden="true">
                  <i style={{ height: "38%" }} />
                  <i style={{ height: "54%" }} />
                  <i style={{ height: "46%" }} />
                  <i style={{ height: "70%" }} />
                  <i style={{ height: "60%" }} />
                  <i style={{ height: "88%" }} />
                </span>
              </div>

              {/* Profile suggestion pill */}
              <div className="marketing-home-float marketing-home-float-match" aria-hidden="true">
                <span className="float-match-icon">
                  <Check size={16} />
                </span>
                <span className="float-match-text">
                  <b>Phù hợp với bạn</b>
                  <small>Gợi ý theo kỹ năng &amp; kinh nghiệm đã chọn</small>
                </span>
                <ChevronRight size={18} />
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

        <FeaturedJobs navigate={navigate} onApply={setApplyJob} />
        <FeaturedCompanies navigate={navigate} />
        <JobMarket navigate={navigate} />

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
}: {
  navigate: (path: string) => void;
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
  }>;
  onApply: (job: { id: string; title: string; company: string }) => void;
}) {
  return (
    <section className="marketing-home-urgent" aria-label="Việc cần tuyển gấp">
      <header className="marketing-home-urgent-head">
        <div>
          <h2>Việc cần tuyển gấp</h2>
          <p>Các vị trí đang đóng đơn sớm - nộp hồ sơ ngay để không bỏ lỡ cơ hội.</p>
        </div>
        <button
          type="button"
          className="marketing-home-urgent-all"
          onClick={() => navigate("/jobs")}
        >
          Xem tất cả <ChevronRight size={16} />
        </button>
      </header>

      <div className="marketing-home-urgent-grid">
        {urgentJobs.map((job) => (
          <article className="urgent-job-card" key={job.id}>
            <div className="urgent-job-top">
              <span className={`urgent-job-logo ${job.bgClass || "bg-emerald-600"}`}>
                {job.logo ? (
                  <img
                    src={job.logo}
                    alt={`Logo ${job.company}`}
                    width={46}
                    height={46}
                    className="rounded-lg object-contain p-1"
                  />
                ) : job.company === "SkySoft" ? (
                  <span className="flex size-full items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <Cloud size={24} weight="fill" />
                  </span>
                ) : (
                  <span className="flex size-full items-center justify-center rounded-lg text-lg font-bold text-white">
                    {job.company.charAt(0)}
                  </span>
                )}
              </span>
              <span className={`urgent-job-deadline is-${job.deadlineTone}`}>
                <Clock size={13} />
                {job.deadline}
              </span>
            </div>

            <h3>
              <button
                type="button"
                className="urgent-job-title"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                {job.title}
              </button>
            </h3>
            <strong className="urgent-job-company">{job.company}</strong>

            <div className="urgent-job-meta">
              <span className="urgent-job-salary">
                <Coins size={15} />
                {job.salary}
              </span>
              <span className="urgent-job-loc-mode">
                <MapPin size={14} />
                {job.location}
                <span className="mx-1.5 text-slate-300">•</span>
                {job.mode === "Remote" ? <Globe size={14} /> : <Building2 size={14} />}
                {job.mode}
              </span>
            </div>

            <div className="urgent-job-tags">
              {job.tags.map((tag) => (
                <i key={tag}>{tag}</i>
              ))}
            </div>

            <div className="urgent-job-footer">
              <span className="urgent-job-level">
                <User size={14} />
                {job.level}
              </span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span className="urgent-job-applicants">
                <UsersRound size={14} />
                {job.applicants}
              </span>
            </div>

            <button
              type="button"
              className="urgent-job-apply"
              onClick={() => {
                const session = getCandidateSession();
                if (session) {
                  onApply(job);
                } else {
                  navigate(`/register?job=${job.id}`);
                }
              }}
            >
              Ứng tuyển ngay <ChevronRight size={16} />
            </button>
          </article>
        ))}
      </div>
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
