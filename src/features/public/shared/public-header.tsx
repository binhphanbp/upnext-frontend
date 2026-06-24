"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

import { upnextLogo } from "../home/brand";
import {
  ArrowUpRight,
  Bot,
  Brain,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Code2,
  Compass,
  FileText,
  GraduationCap,
  Landmark,
  Layers,
  MessagesSquare,
  Moon,
  Newspaper,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  WalletCards,
} from "../home/marketing-icons";

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
  columns: 1 | 2;
  items: MenuItem[];
};

type Language = {
  code: "VI" | "EN";
  locale: "vi" | "en";
  label: string;
  flagLabel: string;
};

type PublicHeaderCopy = {
  employerSmall: string;
  employerLabel: string;
  languageLabel: string;
  themeDark: string;
  themeLight: string;
  login: string;
  register: string;
  homeLabel: string;
};

type PublicHeaderProps = {
  navigate: (path: string) => void;
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
        path: "/jobs?position=Frontend Developer",
        iconClass: "feat-icon-cv",
      },
      {
        label: "Backend",
        desc: "Java, Node.js, Go, .NET, PHP.",
        icon: <Layers size={20} />,
        path: "/jobs?position=Backend Developer",
        iconClass: "feat-icon-ai",
      },
      {
        label: "Mobile",
        desc: "iOS, Android, Flutter, React Native.",
        icon: <Smartphone size={20} />,
        path: "/jobs?position=Mobile Developer",
        iconClass: "feat-icon-community",
      },
      {
        label: "Data & AI",
        desc: "Data Engineer, ML, AI Engineer.",
        icon: <Brain size={20} />,
        path: "/jobs?position=AI%2FML Engineer",
        iconClass: "feat-icon-path",
      },
      {
        label: "DevOps & Cloud",
        desc: "AWS, Kubernetes, CI/CD, SRE.",
        icon: <ShieldCheck size={20} />,
        path: "/jobs?position=DevOps Engineer",
        iconClass: "feat-icon-salary",
      },
      {
        label: "Tất cả việc làm",
        desc: "Duyệt toàn bộ tin tuyển dụng IT.",
        icon: <BriefcaseBusiness size={20} />,
        path: "/jobs",
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
        path: "/companies",
        iconClass: "feat-icon-cv",
      },
      {
        label: "Công ty đánh giá cao",
        desc: "Môi trường, phúc lợi và văn hóa nổi bật.",
        icon: <Star size={20} />,
        path: "/companies",
        iconClass: "feat-icon-salary",
      },
      {
        label: "Big Tech & Tập đoàn",
        desc: "FPT, Viettel, VNG, MoMo, ngân hàng số.",
        icon: <Landmark size={20} />,
        path: "/companies",
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
        path: "/jobs",
        iconClass: "feat-icon-community",
      },
      {
        label: "Cẩm nang nghề nghiệp",
        desc: "Hướng dẫn CV, phỏng vấn và phát triển sự nghiệp.",
        icon: <Compass size={20} />,
        path: "/jobs",
        iconClass: "feat-icon-path",
      },
      {
        label: "Báo cáo lương IT",
        desc: "Số liệu lương theo vị trí, level và khu vực.",
        icon: <TrendingUp size={20} />,
        path: "/jobs",
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
        path: "/register",
        iconClass: "feat-icon-cv",
      },
      {
        label: "Phỏng vấn AI",
        desc: "Luyện phỏng vấn với bộ câu hỏi theo CV, JD và level mục tiêu.",
        icon: <Bot size={20} />,
        path: "/register",
        badge: "Mới",
        iconClass: "feat-icon-ai",
      },
      {
        label: "Lộ trình IT",
        desc: "Bản đồ nghề nghiệp từ Fresher đến Lead theo từng stack.",
        icon: <Route size={20} />,
        path: "/register",
        iconClass: "feat-icon-path",
      },
      {
        label: "Cẩm nang lương",
        desc: "Dữ liệu lương theo vị trí, kinh nghiệm và khu vực.",
        icon: <WalletCards size={20} />,
        path: "/jobs",
        iconClass: "feat-icon-salary",
      },
      {
        label: "Cộng đồng & Mentor",
        desc: "Hỏi đáp, review CV và kết nối mentor trong ngành.",
        icon: <MessagesSquare size={20} />,
        path: "/register",
        iconClass: "feat-icon-community",
      },
      {
        label: "Học tập & Sự kiện",
        desc: "Workshop, livestream và khóa học kỹ năng cho dev.",
        icon: <GraduationCap size={20} />,
        path: "/register",
        iconClass: "feat-icon-learn",
      },
    ],
  },
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

const languages: Language[] = [
  { code: "VI", locale: "vi", label: "Tiếng Việt", flagLabel: "Việt Nam" },
  { code: "EN", locale: "en", label: "English", flagLabel: "English" },
];

const copyByLocale: Record<"vi" | "en", PublicHeaderCopy> = {
  vi: {
    employerSmall: "Dành cho",
    employerLabel: "Nhà Tuyển Dụng",
    languageLabel: "Chọn ngôn ngữ",
    themeDark: "Chuyển sang chế độ tối",
    themeLight: "Chuyển sang chế độ sáng",
    login: "Đăng nhập",
    register: "Đăng ký",
    homeLabel: "Trang chủ UpNext",
  },
  en: {
    employerSmall: "Employer",
    employerLabel: "Hiring Hub",
    languageLabel: "Choose language",
    themeDark: "Switch to dark mode",
    themeLight: "Switch to light mode",
    login: "Log in",
    register: "Sign up",
    homeLabel: "UpNext homepage",
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
          <clipPath id="upnext-shared-en-flag-clip">
            <rect width="22" height="16" rx="3" />
          </clipPath>
          <g clipPath="url(#upnext-shared-en-flag-clip)">
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

export function PublicHeader({ navigate }: PublicHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navRef = useRef<HTMLElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);
  const currentLocale = locale === "en" ? "en" : "vi";
  const lang: Language["code"] = currentLocale === "en" ? "EN" : "VI";
  const copy = copyByLocale[currentLocale];

  useEffect(() => {
    if (!openMenu) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    function handleScroll() {
      setOpenMenu(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!langOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false);
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

  function switchLanguage(language: Language) {
    setLangOpen(false);
    if (language.locale === locale) return;
    router.replace(pathname, { locale: language.locale });
  }

  return (
    <header className="marketing-home-header">
      <button
        className="marketing-home-logo"
        onClick={() => navigate("/")}
        aria-label={copy.homeLabel}
      >
        <Image src={upnextLogo.wordmark} alt="UpNext" width={158} height={38} priority />
      </button>

      <nav className="marketing-home-nav" aria-label="Điều hướng chính" ref={navRef}>
        {navMenus.map((menu) => {
          const navCopy = currentLocale === "en" ? enNavCopy[menu.key] : undefined;

          return (
            <div
              key={menu.key}
              className={`marketing-home-nav-dd${openMenu === menu.key ? " is-open" : ""}`}
              onMouseEnter={() => setOpenMenu(menu.key)}
              onMouseLeave={() => setOpenMenu(null)}
            >
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
                      <i className={`marketing-home-mega-icon ${item.iconClass}`}>{item.icon}</i>
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
            </div>
          );
        })}
      </nav>

      <div className="marketing-home-header-actions">
        <button className="marketing-home-employer" onClick={() => navigate("/register")}>
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

          <ul className="marketing-home-lang-menu">
            {languages.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
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
  );
}
