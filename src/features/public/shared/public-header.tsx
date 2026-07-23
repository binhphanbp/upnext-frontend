"use client";

import {
  Bell,
  BookmarkSimple,
  ChatCircleText,
  FileText as FileTextIcon,
  House,
  PaperPlaneTilt,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useRouter as useNativeRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { getMyCandidateProfile } from "@/features/candidate/api/profile";
import { clearCandidateSession, getCandidateSession } from "@/features/candidate/session";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

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
  Newspaper,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
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
  login: string;
  register: string;
  homeLabel: string;
  accountLabel: string;
  messagesLabel: string;
  notificationsLabel: string;
  profileLabel: string;
  settingsLabel: string;
  workspaceLabel: string;
  logoutLabel: string;
  accountGroup: string;
  activityGroup: string;
  overviewLabel: string;
  resumesLabel: string;
  jobPreferencesLabel: string;
  applicationsLabel: string;
  recruiterChatLabel: string;
  savedJobsLabel: string;
};

type PublicHeaderProps = {
  navigate: (path: string) => void;
  viewer?: PublicHeaderViewer | null;
  hasNewRecruiterMessages?: boolean;
  onRecruiterChatViewed?: () => void;
};

export type PublicHeaderViewer = {
  email?: string | undefined;
  initials: string;
  name: string;
  roleLabel: string;
  workspaceHref: string;
  unreadMessages?: number;
  unreadNotifications?: number;
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
        label: "Blog UpNext",
        desc: "Tin tức công nghệ, sự kiện IT và báo cáo thị trường tuyển dụng.",
        icon: <Newspaper size={20} />,
        path: "/posts?category=blog-upnext",
        iconClass: "feat-icon-community",
      },
      {
        label: "Sự nghiệp IT",
        desc: "Lộ trình phát triển, cẩm nang phỏng vấn, đàm phán lương & kỹ năng mềm.",
        icon: <BriefcaseBusiness size={20} />,
        path: "/posts?category=su-nghiep-it",
        iconClass: "feat-icon-path",
      },
      {
        label: "Chuyên môn IT",
        desc: "Kiến thức AI & Data, Backend, DevOps, Cloud, Frontend & Mobile.",
        icon: <Code2 size={20} />,
        path: "/posts?category=chuyen-mon-it",
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

const demoAuthStorageKey = "upnext.demo.auth";
const demoAuthChangeEvent = "upnext-demo-auth-change";

const copyByLocale: Record<"vi" | "en", PublicHeaderCopy> = {
  vi: {
    employerSmall: "Dành cho",
    employerLabel: "Nhà Tuyển Dụng",
    languageLabel: "Chọn ngôn ngữ",
    login: "Đăng nhập",
    register: "Đăng ký",
    homeLabel: "Trang chủ UpNext",
    accountLabel: "Tài khoản",
    messagesLabel: "Tin nhắn",
    notificationsLabel: "Thông báo",
    profileLabel: "Hồ sơ",
    settingsLabel: "Cài đặt",
    workspaceLabel: "Vào workspace",
    logoutLabel: "Đăng xuất",
    accountGroup: "Tài khoản",
    activityGroup: "Hoạt động",
    overviewLabel: "Tổng quan",
    resumesLabel: "CV của tôi",
    jobPreferencesLabel: "Mong muốn việc làm",
    applicationsLabel: "Việc đã ứng tuyển",
    recruiterChatLabel: "Chat với nhà tuyển dụng",
    savedJobsLabel: "Việc đã lưu",
  },
  en: {
    employerSmall: "Employer",
    employerLabel: "Hiring Hub",
    languageLabel: "Choose language",
    login: "Log in",
    register: "Sign up",
    homeLabel: "UpNext homepage",
    accountLabel: "Account",
    messagesLabel: "Messages",
    notificationsLabel: "Notifications",
    profileLabel: "Profile",
    settingsLabel: "Settings",
    workspaceLabel: "Go to workspace",
    logoutLabel: "Log out",
    accountGroup: "Account",
    activityGroup: "My activity",
    overviewLabel: "Overview",
    resumesLabel: "Resumes",
    jobPreferencesLabel: "Job Preferences",
    applicationsLabel: "Applications",
    recruiterChatLabel: "Chat with recruiters",
    savedJobsLabel: "Saved Jobs",
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

type CandidateViewerSource = Readonly<{
  email?: string | undefined;
  fullName?: string | undefined;
}>;

function getCandidateInitials(source: CandidateViewerSource) {
  const nameParts = source.fullName?.trim().split(/\s+/u).filter(Boolean) ?? [];
  const fallback = source.email?.charAt(0) ?? "C";

  return (nameParts.at(-1)?.charAt(0) ?? fallback).toUpperCase();
}

function createCandidateViewer(
  locale: "vi" | "en",
  source: CandidateViewerSource = {},
): PublicHeaderViewer {
  const name = source.fullName || source.email || (locale === "en" ? "Candidate" : "Ứng viên");

  return {
    email: source.email,
    initials: getCandidateInitials(source),
    name,
    roleLabel: locale === "en" ? "Candidate" : "Ứng viên",
    workspaceHref: "/candidate/profile",
  };
}

export function PublicHeader({
  navigate,
  viewer,
  hasNewRecruiterMessages,
  onRecruiterChatViewed,
}: PublicHeaderProps) {
  const router = useRouter();
  const nativeRouter = useNativeRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [storedViewer, setStoredViewer] = useState<PublicHeaderViewer | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const currentLocale = locale === "en" ? "en" : "vi";
  const lang: Language["code"] = currentLocale === "en" ? "EN" : "VI";
  const copy = copyByLocale[currentLocale];
  const effectiveViewer = viewer === undefined ? storedViewer : viewer;
  const recruiterChatAvailable = !!effectiveViewer;
  const recruiterChatHasNewMessage =
    hasNewRecruiterMessages ?? Boolean(effectiveViewer?.unreadMessages);
  const isCandidatePathActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);
  const isJobPreferencesActive =
    accountOpen &&
    pathname === "/candidate/profile" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("section") === "preferences";

  useEffect(() => {
    if (!openMenu) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      const trigger = document.getElementById(`public-nav-${openMenu}-trigger`);
      setOpenMenu(null);
      trigger?.focus();
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

  useEffect(() => {
    if (!accountOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (viewer !== undefined) return undefined;
    let ignore = false;

    async function syncViewer() {
      const role = window.localStorage.getItem(demoAuthStorageKey);
      const session = getCandidateSession();

      if (role !== "candidate" && !session) {
        setStoredViewer(null);
        return;
      }

      const fallbackViewer = createCandidateViewer(currentLocale, {
        email: session?.user.email,
      });

      setStoredViewer(fallbackViewer);

      if (!session) return;

      try {
        const profile = await getMyCandidateProfile(session.accessToken);
        if (ignore) return;

        setStoredViewer(
          createCandidateViewer(currentLocale, {
            email: profile.account.email,
            fullName: profile.account.fullName,
          }),
        );
      } catch {
        if (!ignore) setStoredViewer(fallbackViewer);
      }
    }

    void syncViewer();
    window.addEventListener("storage", syncViewer);
    window.addEventListener(demoAuthChangeEvent, syncViewer);
    return () => {
      ignore = true;
      window.removeEventListener("storage", syncViewer);
      window.removeEventListener(demoAuthChangeEvent, syncViewer);
    };
  }, [currentLocale, viewer]);

  function switchLanguage(language: Language) {
    setLangOpen(false);
    if (language.locale === locale) return;
    router.replace(pathname, { locale: language.locale });
  }

  function openRecruiterChat() {
    setAccountOpen(false);
    onRecruiterChatViewed?.();
    nativeRouter.push("/conversations/chat");
  }

  return (
    <header className="marketing-home-header">
      <button
        className="marketing-home-logo"
        onClick={() => navigate("/")}
        aria-label={copy.homeLabel}
      >
        <Image
          src={upnextLogo.wordmark}
          alt="UpNext"
          width={158}
          height={38}
          priority
          style={{ height: "auto", width: "auto" }}
        />
      </button>

      <nav className="marketing-home-nav" aria-label="Điều hướng chính" ref={navRef}>
        {navMenus.map((menu) => {
          const navCopy = currentLocale === "en" ? enNavCopy[menu.key] : undefined;
          const triggerId = `public-nav-${menu.key}-trigger`;
          const panelId = `public-nav-${menu.key}-panel`;

          return (
            <div
              key={menu.key}
              className={`marketing-home-nav-dd${openMenu === menu.key ? " is-open" : ""}`}
              onMouseEnter={() => setOpenMenu(menu.key)}
              onMouseLeave={() => setOpenMenu(null)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null);
              }}
            >
              <button
                id={triggerId}
                type="button"
                className="marketing-home-nav-trigger"
                aria-controls={panelId}
                aria-expanded={openMenu === menu.key}
                onClick={() => setOpenMenu((open) => (open === menu.key ? null : menu.key))}
              >
                {navCopy?.label ?? menu.label}
                <ChevronDown size={15} aria-hidden="true" />
              </button>

              <div
                id={panelId}
                className={`marketing-home-mega${menu.columns === 1 ? " is-single" : ""}`}
                aria-labelledby={triggerId}
              >
                <div className="marketing-home-mega-head">
                  <span className="marketing-home-mega-eyebrow">
                    <Sparkles size={14} aria-hidden="true" /> {navCopy?.eyebrow ?? menu.eyebrow}
                  </span>
                  <p>{navCopy?.tagline ?? menu.tagline}</p>
                </div>
                <ul className="marketing-home-mega-grid">
                  {menu.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        className="marketing-home-mega-item"
                        href={item.path}
                        onClick={() => setOpenMenu(null)}
                        prefetch={openMenu === menu.key ? null : false}
                      >
                        <i
                          className={`marketing-home-mega-icon ${item.iconClass}`}
                          aria-hidden="true"
                        >
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
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="marketing-home-header-actions">
        <button className="marketing-home-employer" onClick={() => navigate("/recruiter/login")}>
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

        {effectiveViewer ? (
          <div className="marketing-home-auth">
            {effectiveViewer.unreadNotifications !== undefined && (
              <button
                type="button"
                className="marketing-home-auth-icon"
                aria-label={copy.notificationsLabel}
                onClick={() => navigate("/candidate/notifications")}
              >
                <Bell size={20} aria-hidden="true" />
                {effectiveViewer.unreadNotifications ? (
                  <span className="marketing-home-auth-badge">
                    {effectiveViewer.unreadNotifications}
                  </span>
                ) : null}
              </button>
            )}
            {recruiterChatAvailable ? (
              <button
                type="button"
                className="marketing-home-auth-icon"
                aria-label={copy.messagesLabel}
                onClick={openRecruiterChat}
              >
                <ChatCircleText size={20} aria-hidden="true" />
                {hasNewRecruiterMessages !== undefined && recruiterChatHasNewMessage ? (
                  <span className="marketing-home-new-message-dot" aria-label="Có tin nhắn mới" />
                ) : effectiveViewer.unreadMessages ? (
                  <span className="marketing-home-auth-badge">
                    {effectiveViewer.unreadMessages}
                  </span>
                ) : null}
              </button>
            ) : null}

            <div
              className={`marketing-home-account${accountOpen ? " is-open" : ""}`}
              ref={accountRef}
            >
              <button
                type="button"
                className="marketing-home-account-trigger"
                aria-label={copy.accountLabel}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="marketing-home-account-avatar">{effectiveViewer.initials}</span>
                <span className="marketing-home-account-copy">
                  <b>{effectiveViewer.name}</b>
                  <small>{effectiveViewer.roleLabel}</small>
                </span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>

              <div className="marketing-home-account-menu" role="menu">
                <div className="marketing-home-account-menu-profile">
                  <span className="marketing-home-account-menu-avatar">
                    {effectiveViewer.initials}
                  </span>
                  <span className="marketing-home-account-menu-identity">
                    <b>{effectiveViewer.name}</b>
                    <small>{effectiveViewer.email ?? effectiveViewer.name}</small>
                  </span>
                </div>

                <AccountMenuGroup label={copy.accountGroup}>
                  {effectiveViewer.workspaceHref !== "/candidate/profile" ? (
                    <AccountMenuItem
                      icon={<House size={18} aria-hidden="true" />}
                      label={copy.overviewLabel}
                      active={pathname === effectiveViewer.workspaceHref}
                      onClick={() => {
                        setAccountOpen(false);
                        navigate(effectiveViewer.workspaceHref);
                      }}
                    />
                  ) : null}
                  <AccountMenuItem
                    icon={<UserCircle size={18} aria-hidden="true" />}
                    label={copy.profileLabel}
                    active={isCandidatePathActive("/candidate/profile") && !isJobPreferencesActive}
                    onClick={() => {
                      setAccountOpen(false);
                      navigate("/candidate/profile");
                    }}
                  />
                  <AccountMenuItem
                    icon={<FileTextIcon size={18} aria-hidden="true" />}
                    label={copy.resumesLabel}
                    active={isCandidatePathActive("/candidate/cv-builder")}
                    onClick={() => {
                      setAccountOpen(false);
                      navigate("/candidate/cv-builder");
                    }}
                  />
                  <AccountMenuItem
                    icon={<BriefcaseBusiness size={18} aria-hidden="true" />}
                    label={copy.jobPreferencesLabel}
                    active={isJobPreferencesActive}
                    onClick={() => {
                      setAccountOpen(false);
                      navigate("/candidate/profile?section=preferences");
                    }}
                  />
                </AccountMenuGroup>

                <AccountMenuGroup label={copy.activityGroup}>
                  <AccountMenuItem
                    icon={<PaperPlaneTilt size={18} aria-hidden="true" />}
                    label={copy.applicationsLabel}
                    active={isCandidatePathActive("/candidate/applications")}
                    onClick={() => {
                      setAccountOpen(false);
                      navigate("/candidate/applications");
                    }}
                  />
                  <AccountMenuItem
                    icon={<ChatCircleText size={18} aria-hidden="true" />}
                    label={copy.recruiterChatLabel}
                    indicator={recruiterChatHasNewMessage}
                    onClick={openRecruiterChat}
                  />
                  <AccountMenuItem
                    icon={<BookmarkSimple size={18} aria-hidden="true" />}
                    label={copy.savedJobsLabel}
                    active={isCandidatePathActive("/candidate/saved-jobs")}
                    onClick={() => {
                      setAccountOpen(false);
                      navigate("/candidate/saved-jobs");
                    }}
                  />
                </AccountMenuGroup>

                <span className="marketing-home-account-menu-sep" aria-hidden="true" />
                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  onClick={() => {
                    setAccountOpen(false);
                    clearCandidateSession();
                    window.localStorage.removeItem(demoAuthStorageKey);
                    window.dispatchEvent(new Event(demoAuthChangeEvent));
                    navigate("/");
                  }}
                >
                  <SignOut size={18} aria-hidden="true" />
                  {copy.logoutLabel}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <button className="marketing-home-login" onClick={() => navigate("/login")}>
              {copy.login}
            </button>
            <button className="marketing-home-register" onClick={() => navigate("/register")}>
              {copy.register}
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function AccountMenuGroup({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <div className="marketing-home-account-menu-group">
      <span className="marketing-home-account-menu-label">{label}</span>
      {children}
    </div>
  );
}

function AccountMenuItem({
  icon,
  label,
  active = false,
  indicator = false,
  onClick,
}: Readonly<{
  icon: ReactNode;
  label: string;
  active?: boolean;
  indicator?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      role="menuitem"
      className={active ? "is-active" : undefined}
      onClick={onClick}
    >
      <span className="marketing-home-account-menu-icon">
        {icon}
        {indicator ? (
          <span className="marketing-home-menu-message-dot" aria-label="Có tin nhắn mới" />
        ) : null}
      </span>
      {label}
    </button>
  );
}
