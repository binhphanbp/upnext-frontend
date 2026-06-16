"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

import { upnextLogo } from "./brand";
import { FeaturedCompanies } from "./featured-companies";
import { FeaturedJobs } from "./featured-jobs";
import { JobMarket } from "./job-market";
import { TechOrbit } from "./tech-orbit";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bookmark,
  Bot,
  Brain,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  Facebook,
  FileText,
  GraduationCap,
  Github,
  Landmark,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  MessagesSquare,
  Moon,
  Newspaper,
  Phone,
  Route,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  UsersRound,
  WalletCards,
  Youtube,
} from "./v2-icons";

type MenuItem = {
  label: string;
  desc: string;
  icon: ReactNode;
  path: string;
  badge?: string;
  iconClass: string;
};

type NavMenu = {
  key: string;
  label: string;
  eyebrow: string;
  tagline: string;
  /** Two columns look best for 4-6 items; one column for short lists. */
  columns: 1 | 2;
  items: MenuItem[];
};

const navMenus: NavMenu[] = [
  {
    key: "jobs",
    label: "Việc làm IT",
    eyebrow: "Khám phá việc làm",
    tagline: "Tìm đúng vị trí theo chuyên môn và định hướng của bạn.",
    columns: 2,
    items: [
      {
        label: "Frontend",
        desc: "React, Vue, Angular, UI Engineer.",
        icon: <Code2 size={20} />,
        path: "/jobs-v2?position=Frontend Developer",
        iconClass: "feat-icon-cv",
      },
      {
        label: "Backend",
        desc: "Java, Node.js, Go, .NET, PHP.",
        icon: <Layers size={20} />,
        path: "/jobs-v2?position=Backend Developer",
        iconClass: "feat-icon-ai",
      },
      {
        label: "Mobile",
        desc: "iOS, Android, Flutter, React Native.",
        icon: <Smartphone size={20} />,
        path: "/jobs-v2?position=Mobile Developer",
        iconClass: "feat-icon-community",
      },
      {
        label: "Data & AI",
        desc: "Data Engineer, ML, AI Engineer.",
        icon: <Brain size={20} />,
        path: "/jobs-v2?position=AI%2FML Engineer",
        iconClass: "feat-icon-path",
      },
      {
        label: "DevOps & Cloud",
        desc: "AWS, Kubernetes, CI/CD, SRE.",
        icon: <ShieldCheck size={20} />,
        path: "/jobs-v2?position=DevOps Engineer",
        iconClass: "feat-icon-salary",
      },
      {
        label: "Tất cả việc làm",
        desc: "Duyệt toàn bộ tin tuyển dụng IT.",
        icon: <BriefcaseBusiness size={20} />,
        path: "/jobs-v2",
        iconClass: "feat-icon-learn",
      },
    ],
  },
  {
    key: "companies",
    label: "Công ty IT",
    eyebrow: "Nhà tuyển dụng",
    tagline: "Tìm hiểu công ty uy tín trước khi ứng tuyển.",
    columns: 1,
    items: [
      {
        label: "Top công ty công nghệ",
        desc: "Bảng xếp hạng theo điểm uy tín và đánh giá.",
        icon: <Building2 size={20} />,
        path: "/candidate/companies",
        iconClass: "feat-icon-cv",
      },
      {
        label: "Công ty đánh giá cao",
        desc: "Môi trường, phúc lợi và văn hóa nổi bật.",
        icon: <Star size={20} />,
        path: "/candidate/companies",
        iconClass: "feat-icon-salary",
      },
      {
        label: "Big Tech & Tập đoàn",
        desc: "FPT, Viettel, VNG, MoMo, ngân hàng số.",
        icon: <Landmark size={20} />,
        path: "/candidate/companies",
        iconClass: "feat-icon-ai",
      },
    ],
  },
  {
    key: "blog",
    label: "Bài viết",
    eyebrow: "Kiến thức & insight",
    tagline: "Cập nhật xu hướng và kinh nghiệm nghề nghiệp IT.",
    columns: 1,
    items: [
      {
        label: "Tin tức công nghệ",
        desc: "Xu hướng, công nghệ mới và thị trường tuyển dụng.",
        icon: <Newspaper size={20} />,
        path: "/candidate/salary",
        iconClass: "feat-icon-community",
      },
      {
        label: "Cẩm nang nghề nghiệp",
        desc: "Hướng dẫn CV, phỏng vấn và phát triển sự nghiệp.",
        icon: <Compass size={20} />,
        path: "/candidate/salary",
        iconClass: "feat-icon-path",
      },
      {
        label: "Báo cáo lương IT",
        desc: "Số liệu lương theo vị trí, level và khu vực.",
        icon: <TrendingUp size={20} />,
        path: "/candidate/salary",
        iconClass: "feat-icon-salary",
      },
    ],
  },
  {
    key: "features",
    label: "Tính năng",
    eyebrow: "Công cụ cho ứng viên IT",
    tagline: "Mọi thứ bạn cần để tìm việc có chiến lược, không rải CV.",
    columns: 2,
    items: [
      {
        label: "Tạo CV chuẩn IT",
        desc: "Mẫu CV tối ưu ATS, chấm điểm và gợi ý cải thiện theo JD.",
        icon: <FileText size={20} />,
        path: "/candidate/profile",
        iconClass: "feat-icon-cv",
      },
      {
        label: "Phỏng vấn AI",
        desc: "Luyện phỏng vấn với bộ câu hỏi theo CV, JD và level mục tiêu.",
        icon: <Bot size={20} />,
        path: "/candidate/ai",
        badge: "Mới",
        iconClass: "feat-icon-ai",
      },
      {
        label: "Lộ trình IT",
        desc: "Bản đồ nghề nghiệp từ Fresher đến Lead theo từng stack.",
        icon: <Route size={20} />,
        path: "/candidate/ai",
        iconClass: "feat-icon-path",
      },
      {
        label: "Cẩm nang lương",
        desc: "Dữ liệu lương theo vị trí, kinh nghiệm và khu vực.",
        icon: <WalletCards size={20} />,
        path: "/candidate/salary",
        iconClass: "feat-icon-salary",
      },
      {
        label: "Cộng đồng & Mentor",
        desc: "Hỏi đáp, review CV và kết nối mentor trong ngành.",
        icon: <MessagesSquare size={20} />,
        path: "/candidate/messages",
        iconClass: "feat-icon-community",
      },
      {
        label: "Học tập & Sự kiện",
        desc: "Workshop, livestream và khóa học kỹ năng cho dev.",
        icon: <GraduationCap size={20} />,
        path: "/candidate/ai",
        iconClass: "feat-icon-learn",
      },
    ],
  },
];

type MarketingHomeExperienceProps = {
  navigate: (path: string) => void;
};

type FieldKey = "keyword" | "location";

const popularSearches = ["Frontend", "Backend", "DevOps", "AI Engineer", "Data", "UI/UX"];

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

type Language = {
  code: "VI" | "EN";
  locale: "vi" | "en";
  label: string;
  flagLabel: string;
};

// Add new languages here — the switch UI scales automatically.
const languages: Language[] = [
  { code: "VI", locale: "vi", label: "Tiếng Việt", flagLabel: "Việt Nam" },
  { code: "EN", locale: "en", label: "English", flagLabel: "English" },
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

const footerQuickLinks = [
  { label: "Tìm việc IT", path: "/jobs-v2" },
  { label: "Công ty công nghệ", path: "/candidate/companies" },
  { label: "Tạo hồ sơ", path: "/candidate/profile" },
  { label: "Cẩm nang nghề nghiệp", path: "/candidate/salary" },
  { label: "Đăng tuyển dụng", path: "/employer/jobs" },
  { label: "Tìm hồ sơ", path: "/employer/candidates" },
  { label: "Giải pháp tuyển dụng", path: "/employer" },
  { label: "Bảng giá", path: "/employer/billing" },
  { label: "Blog", path: "/candidate/salary" },
  { label: "Hướng dẫn", path: "/candidate/ai" },
  { label: "Chính sách bảo mật", path: "/candidate/profile" },
  { label: "Điều khoản sử dụng", path: "/candidate/profile" },
];

const footerSocials = [
  { label: "LinkedIn", icon: <Linkedin size={19} />, href: "https://www.linkedin.com/" },
  { label: "Facebook", icon: <Facebook size={19} />, href: "https://www.facebook.com/" },
  { label: "GitHub", icon: <Github size={19} />, href: "https://github.com/" },
  { label: "YouTube", icon: <Youtube size={19} />, href: "https://www.youtube.com/" },
];

const enNavCopy: Record<string, { label: string; eyebrow: string; tagline: string }> = {
  jobs: {
    label: "IT Jobs",
    eyebrow: "Explore jobs",
    tagline: "Find roles by specialty, stack, and career direction.",
  },
  companies: {
    label: "IT Companies",
    eyebrow: "Employers",
    tagline: "Research trusted companies before applying.",
  },
  blog: {
    label: "Articles",
    eyebrow: "Knowledge & insights",
    tagline: "Follow IT career advice and hiring market trends.",
  },
  features: {
    label: "Features",
    eyebrow: "Tools for IT talent",
    tagline: "Everything you need to search strategically, not spam applications.",
  },
};

function FlagIcon({ code, label }: { code: Language["code"]; label?: string }) {
  return (
    <span
      className={`marketing-home-lang-flag marketing-home-lang-flag-${code.toLowerCase()}`}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {code === "VI" ? (
        <svg aria-hidden="true" viewBox="0 0 22 16">
          <rect width="22" height="16" fill="#DA251D" rx="3" />
          <path
            fill="#FFDE00"
            d="m11 3.2 1.13 3.48h3.66l-2.96 2.15 1.13 3.47L11 10.15 8.04 12.3l1.13-3.47-2.96-2.15h3.66L11 3.2Z"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 22 16">
          <clipPath id="upnext-en-flag-clip">
            <rect width="22" height="16" rx="3" />
          </clipPath>
          <g clipPath="url(#upnext-en-flag-clip)">
            <rect width="22" height="16" fill="#012169" />
            <path stroke="#fff" strokeWidth="3.2" d="m0 0 22 16M22 0 0 16" />
            <path stroke="#C8102E" strokeWidth="1.8" d="m0 0 22 16M22 0 0 16" />
            <path stroke="#fff" strokeWidth="5.2" d="M11 0v16M0 8h22" />
            <path stroke="#C8102E" strokeWidth="3.2" d="M11 0v16M0 8h22" />
          </g>
        </svg>
      )}
    </span>
  );
}

const homeCopy = {
  vi: {
    employerSmall: "Dành cho",
    employerLabel: "Nhà Tuyển Dụng",
    languageLabel: "Chọn ngôn ngữ",
    themeDark: "Chuyển sang chế độ tối",
    themeLight: "Chuyển sang chế độ sáng",
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
    themeDark: "Switch to dark mode",
    themeLight: "Switch to light mode",
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
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [openField, setOpenField] = useState<FieldKey | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const lang: Language["code"] = locale === "en" ? "EN" : "VI";
  const copy = locale === "en" ? homeCopy.en : homeCopy.vi;
  const langRef = useRef<HTMLDivElement | null>(null);

  const searchCardRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!openMenu) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!langOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!langRef.current?.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLangOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [langOpen]);

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
    navigate(query ? `/jobs-v2?${query}` : "/jobs-v2");
  }

  function toggleField(field: FieldKey) {
    setOpenField((current) => (current === field ? null : field));
  }

  function switchLanguage(language: Language) {
    setLangOpen(false);
    if (language.locale === locale) return;
    router.replace(pathname, { locale: language.locale });
  }

  return (
    <main className="marketing-home-page">
      <header className="marketing-home-header">
        <button
          className="marketing-home-logo"
          onClick={() => navigate("/")}
          aria-label="Trang chủ UpNext"
        >
          <img src={upnextLogo.wordmark} alt="UpNext" />
        </button>

        <nav className="marketing-home-nav" aria-label="Điều hướng chính" ref={navRef}>
          {navMenus.map((menu) => (
            <div
              key={menu.key}
              className={`marketing-home-nav-dd${openMenu === menu.key ? " is-open" : ""}`}
              onMouseEnter={() => setOpenMenu(menu.key)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              {(() => {
                const navCopy = locale === "en" ? enNavCopy[menu.key] : undefined;

                return (
                  <>
                    <button
                      type="button"
                      className="marketing-home-nav-trigger"
                      aria-haspopup="true"
                      aria-expanded={openMenu === menu.key}
                      onClick={() => setOpenMenu((open) => (open === menu.key ? null : menu.key))}
                    >
                      {navCopy?.label ?? menu.label}
                      <ChevronDown size={15} />
                    </button>

                    <div
                      className={`marketing-home-mega${menu.columns === 1 ? " is-single" : ""}`}
                      role="menu"
                    >
                      <div className="marketing-home-mega-head">
                        <span className="marketing-home-mega-eyebrow">
                          <Sparkles size={14} /> {navCopy?.eyebrow ?? menu.eyebrow}
                        </span>
                        <p>{navCopy?.tagline ?? menu.tagline}</p>
                      </div>
                      <div className="marketing-home-mega-grid">
                        {menu.items.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            className="marketing-home-mega-item"
                            onClick={() => {
                              setOpenMenu(null);
                              navigate(item.path);
                            }}
                          >
                            <i className={`marketing-home-mega-icon ${item.iconClass}`}>
                              {item.icon}
                            </i>
                            <span className="marketing-home-mega-text">
                              <b>
                                <span>{item.label}</span>
                                {item.badge && (
                                  <em className="marketing-home-mega-badge">{item.badge}</em>
                                )}
                              </b>
                              <small>{item.desc}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
        </nav>

        <div className="marketing-home-header-actions">
          <button className="marketing-home-employer" onClick={() => navigate("/employer")}>
            <span className="marketing-home-employer-text">
              <small>{copy.employerSmall}</small>
              <b>{copy.employerLabel}</b>
            </span>
            <ArrowUpRight className="marketing-home-employer-arrow" size={17} />
          </button>

          <span className="marketing-home-action-sep" aria-hidden="true" />

          <div className={`marketing-home-lang${langOpen ? " is-open" : ""}`} ref={langRef}>
            <button
              type="button"
              className="marketing-home-lang-trigger"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label={copy.languageLabel}
              onClick={() => setLangOpen((open) => !open)}
            >
              <FlagIcon code={lang} />
              <span>{lang}</span>
              <ChevronDown size={14} />
            </button>

            <ul className="marketing-home-lang-menu" role="listbox">
              {languages.map((item) => (
                <li key={item.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={lang === item.code}
                    className={`marketing-home-lang-option${lang === item.code ? " is-active" : ""}`}
                    onClick={() => switchLanguage(item)}
                  >
                    <FlagIcon code={item.code} label={item.flagLabel} />
                    <span className="marketing-home-lang-name">{item.label}</span>
                    {lang === item.code && <Check size={15} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="marketing-home-theme"
            aria-label={theme === "light" ? copy.themeDark : copy.themeLight}
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <span className="marketing-home-action-sep" aria-hidden="true" />

          <button className="marketing-home-login" onClick={() => navigate("/login")}>
            {copy.login}
          </button>
          <button className="marketing-home-register" onClick={() => navigate("/register")}>
            {copy.register}
          </button>
        </div>
      </header>

      <section className="marketing-home-content">
        <section className="marketing-home-hero">
          <div className="marketing-home-copy">
            <span className="marketing-home-eyebrow">
              <Sparkles size={16} /> {copy.eyebrow}
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
                    <ul
                      className="marketing-home-dropdown"
                      role="listbox"
                      aria-label="Gợi ý từ khóa"
                    >
                      {keywordMatches.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            className="marketing-home-option"
                            role="option"
                            aria-selected={keyword === item}
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
              <div>
                {popularSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setKeyword(item);
                      runSearch({ keyword: item });
                    }}
                  >
                    {item}
                  </button>
                ))}
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

              <img
                className="marketing-home-hero-banner"
                src="/assets/marketing/home/hero-banner.png"
                alt="Ứng viên IT đang làm việc trên nền tảng UpNext"
                draggable={false}
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
                <strong>2.500+</strong>
                <span>{copy.statsJobs}</span>
              </p>
            </article>
            <article>
              <i>
                <Building2 size={25} />
              </i>
              <p>
                <strong>1.000+</strong>
                <span>{copy.statsCompanies}</span>
              </p>
            </article>
            <article>
              <i>
                <UsersRound size={25} />
              </i>
              <p>
                <strong>50.000+</strong>
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

        <FeaturedJobs navigate={navigate} />
        <FeaturedCompanies navigate={navigate} />
        <JobMarket navigate={navigate} />

        <footer id="site-footer" className="marketing-home-footer" aria-label="Footer UpNext">
          <section
            className="marketing-home-footer-cta"
            aria-label="Bắt đầu hành trình sự nghiệp IT"
          >
            <span className="marketing-home-footer-cta-icon" aria-hidden="true">
              <BriefcaseBusiness size={34} />
            </span>
            <div className="marketing-home-footer-cta-copy">
              <h2>
                Hành trình sự nghiệp IT <span>tốt hơn</span> bắt đầu từ đây
              </h2>
              <p>Hàng nghìn cơ hội việc làm IT chất lượng đang chờ bạn khám phá.</p>
            </div>
            <div className="marketing-home-footer-cta-actions">
              <button
                type="button"
                className="marketing-home-footer-primary"
                onClick={() => navigate("/jobs-v2")}
              >
                {copy.footerPrimary} <ArrowRight size={19} />
              </button>
              <button
                type="button"
                className="marketing-home-footer-secondary"
                onClick={() => navigate("/candidate/profile")}
              >
                {copy.footerSecondary}
              </button>
            </div>
          </section>

          <section className="marketing-home-footer-main">
            <div className="marketing-home-footer-brand">
              <button
                type="button"
                className="marketing-home-footer-logo"
                onClick={() => navigate("/")}
                aria-label="Trang chủ UpNext"
              >
                <img src={upnextLogo.wordmark} alt="UpNext" />
              </button>
              <p>
                Nền tảng tuyển dụng IT kết nối ứng viên tài năng với các công ty công nghệ hàng đầu.
                Cơ hội phù hợp, sự nghiệp bứt phá.
              </p>
              <div className="marketing-home-footer-socials">
                {footerSocials.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>

            <nav className="marketing-home-footer-links" aria-label="Liên kết nhanh">
              <h3>Liên kết nhanh</h3>
              <div className="marketing-home-footer-link-grid">
                {footerQuickLinks.map((link) => (
                  <button key={link.label} type="button" onClick={() => navigate(link.path)}>
                    <span>{link.label}</span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            </nav>

            <div className="marketing-home-footer-contact">
              <h3>Liên hệ / Nhận tin</h3>
              <p>Nhận thông tin việc làm IT mới nhất và các bài viết hữu ích từ UpNext.</p>
              <form
                className="marketing-home-footer-newsletter"
                onSubmit={(event) => event.preventDefault()}
              >
                <input
                  type="email"
                  name="footer-email"
                  placeholder={copy.footerEmailPlaceholder}
                  aria-label={copy.footerEmailAria}
                  suppressHydrationWarning
                />
                <button type="submit">{copy.footerSubscribe}</button>
              </form>
              <ul className="marketing-home-footer-contact-list">
                <li>
                  <Mail size={18} />
                  <span>contact@upnext.works</span>
                </li>
                <li>
                  <Phone size={18} />
                  <span>028 7303 2468</span>
                </li>
                <li>
                  <MapPin size={18} />
                  <span>{copy.vietnamLocation}</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="marketing-home-footer-bottom">
            <p>{copy.copyright}</p>
            <div className="marketing-home-footer-bottom-actions">
              <button type="button" onClick={() => switchLanguage(languages[0]!)}>
                <FlagIcon code="VI" />
                {copy.vietnamese}
                <ChevronDown size={15} />
              </button>
              <span aria-hidden="true" />
              <button type="button" onClick={() => switchLanguage(languages[1]!)}>
                <FlagIcon code="EN" />
                {copy.english}
              </button>
              <span aria-hidden="true" />
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <ArrowUp size={18} />
                {copy.toTop}
              </button>
            </div>
          </section>
        </footer>
      </section>
    </main>
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
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onToggle}
      >
        {icon}
        <span className={value ? "has-value" : "is-placeholder"}>{value || placeholder}</span>
        <ChevronDown size={17} />
      </button>
      {open && (
        <ul className="marketing-home-dropdown" role="listbox" aria-label={label}>
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
                role="option"
                aria-selected={value === item}
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
