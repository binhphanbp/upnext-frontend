"use client";

import {
  Bell,
  BookmarkSimple,
  Briefcase,
  Buildings,
  ChatCircleText,
  Code,
  FileText as FileTextIcon,
  House,
  List,
  MapPin,
  PaperPlaneTilt,
  SignOut,
  SquaresFour,
  User,
  UserCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useRouter as useNativeRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

import { getMyCandidateProfile } from "@/features/candidate/api/profile";
import { clearCandidateSession, getCandidateSession } from "@/features/candidate/session";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { getPublicJobs } from "../home/api";
import type { PublicJob } from "../home/api";
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
  FileText,
  GraduationCap,
  Landmark,
  Layers,
  MessagesSquare,
  Newspaper,
  Route,
  ShieldCheck,
  Smartphone,
  Star,
  WalletCards,
} from "../home/marketing-icons";

type MenuItem = {
  label: LocalizedText;
  desc: LocalizedText;
  icon: ReactNode;
  path: string;
  badge?: LocalizedText;
  iconClass: string;
};

type LocalizedText = {
  vi: string;
  en: string;
};

type CandidateUtilityItem = {
  label: LocalizedText;
  href?: string;
  comingSoon?: boolean;
};

type CompactNavigationLink = {
  label: LocalizedText;
  href: string;
  employer?: boolean;
};

type NavMenu = {
  key: string;
  label: LocalizedText;
  items: MenuItem[];
  overview: {
    label: LocalizedText;
    description: LocalizedText;
    path: string;
  };
};

function localized(vi: string, en: string): LocalizedText {
  return { vi, en };
}

type Language = {
  code: "VI" | "EN";
  locale: "vi" | "en";
  label: string;
  flagLabel: LocalizedText;
};

type LocalizedLabel = {
  vi: string;
  en: string;
};

type JobsMenuCategory = {
  key: JobsMenuTab;
  label: LocalizedLabel;
  icon: ReactNode;
};

type JobsMenuTab = "all" | "skills" | "titles" | "expertise" | "companies" | "cities";

type JobsMenuEntry = {
  label: string;
  path: string;
  count: number;
};

type PublicHeaderCopy = {
  utilityNavigationLabel: string;
  utilityGuestLabel: string;
  utilityCandidateLabel: string;
  comingSoonLabel: string;
  compactMenuLabel: string;
  compactNavigationLabel: string;
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
    label: localized("Việc làm IT", "IT Jobs"),
    items: [
      {
        label: localized("Frontend", "Frontend"),
        desc: localized("React, Vue, Angular, UI Engineer.", "React, Vue, Angular, UI Engineer."),
        icon: <Code2 size={20} />,
        path: "/jobs?position=Frontend Developer",
        iconClass: "feat-icon-cv",
      },
      {
        label: localized("Backend", "Backend"),
        desc: localized("Java, Node.js, Go, .NET, PHP.", "Java, Node.js, Go, .NET, PHP."),
        icon: <Layers size={20} />,
        path: "/jobs?position=Backend Developer",
        iconClass: "feat-icon-ai",
      },
      {
        label: localized("Mobile", "Mobile"),
        desc: localized(
          "iOS, Android, Flutter, React Native.",
          "iOS, Android, Flutter, React Native.",
        ),
        icon: <Smartphone size={20} />,
        path: "/jobs?position=Mobile Developer",
        iconClass: "feat-icon-community",
      },
      {
        label: localized("Data & AI", "Data & AI"),
        desc: localized("Data Engineer, ML, AI Engineer.", "Data Engineer, ML, AI Engineer."),
        icon: <Brain size={20} />,
        path: "/jobs?position=AI%2FML Engineer",
        iconClass: "feat-icon-path",
      },
      {
        label: localized("DevOps & Cloud", "DevOps & Cloud"),
        desc: localized("AWS, Kubernetes, CI/CD, SRE.", "AWS, Kubernetes, CI/CD, SRE."),
        icon: <ShieldCheck size={20} />,
        path: "/jobs?position=DevOps Engineer",
        iconClass: "feat-icon-salary",
      },
      {
        label: localized("Tất cả việc làm", "All jobs"),
        desc: localized("Duyệt toàn bộ tin tuyển dụng IT.", "Browse all IT job openings."),
        icon: <BriefcaseBusiness size={20} />,
        path: "/jobs",
        iconClass: "feat-icon-learn",
      },
    ],
    overview: {
      label: { vi: "Xem tất cả việc làm", en: "View all jobs" },
      description: {
        vi: "Khám phá các cơ hội IT phù hợp với bạn",
        en: "Explore IT opportunities that fit you",
      },
      path: "/jobs",
    },
  },
  {
    key: "companies",
    label: localized("Công ty IT", "IT Companies"),
    items: [
      {
        label: localized("Top công ty công nghệ", "Top technology companies"),
        desc: localized(
          "Bảng xếp hạng theo điểm uy tín và đánh giá.",
          "Ranked by reputation and candidate reviews.",
        ),
        icon: <Building2 size={20} />,
        path: "/companies",
        iconClass: "feat-icon-cv",
      },
      {
        label: localized("Công ty đánh giá cao", "Top-rated companies"),
        desc: localized(
          "Môi trường, phúc lợi và văn hóa nổi bật.",
          "Notable culture, benefits, and workplace experience.",
        ),
        icon: <Star size={20} />,
        path: "/companies",
        iconClass: "feat-icon-salary",
      },
      {
        label: localized("Big Tech & tập đoàn", "Big Tech & enterprises"),
        desc: localized(
          "FPT, Viettel, VNG, MoMo, ngân hàng số.",
          "FPT, Viettel, VNG, MoMo, and digital banks.",
        ),
        icon: <Landmark size={20} />,
        path: "/companies",
        iconClass: "feat-icon-ai",
      },
    ],
    overview: {
      label: { vi: "Xem tất cả công ty", en: "View all companies" },
      description: {
        vi: "Khám phá nhà tuyển dụng đang hoạt động",
        en: "Explore companies that are actively hiring",
      },
      path: "/companies",
    },
  },
  {
    key: "blog",
    label: localized("Bài viết", "Articles"),
    items: [
      {
        label: localized("Blog UpNext", "UpNext Blog"),
        desc: localized(
          "Tin tức công nghệ, sự kiện IT và báo cáo thị trường tuyển dụng.",
          "Technology news, IT events, and hiring market reports.",
        ),
        icon: <Newspaper size={20} />,
        path: "/posts?category=blog-upnext",
        iconClass: "feat-icon-community",
      },
      {
        label: localized("Sự nghiệp IT", "IT Careers"),
        desc: localized(
          "Lộ trình phát triển, cẩm nang phỏng vấn, đàm phán lương & kỹ năng mềm.",
          "Career paths, interviews, salary negotiation, and soft skills.",
        ),
        icon: <BriefcaseBusiness size={20} />,
        path: "/posts?category=su-nghiep-it",
        iconClass: "feat-icon-path",
      },
      {
        label: localized("Chuyên môn IT", "IT Expertise"),
        desc: localized(
          "Kiến thức AI & Data, Backend, DevOps, Cloud, Frontend & Mobile.",
          "AI & Data, Backend, DevOps, Cloud, Frontend, and Mobile knowledge.",
        ),
        icon: <Code2 size={20} />,
        path: "/posts?category=chuyen-mon-it",
        iconClass: "feat-icon-salary",
      },
    ],
    overview: {
      label: { vi: "Xem tất cả bài viết", en: "View all articles" },
      description: {
        vi: "Cập nhật kiến thức và xu hướng nghề nghiệp IT",
        en: "Stay current with IT career knowledge and trends",
      },
      path: "/posts",
    },
  },
  {
    key: "features",
    label: localized("Tính năng", "Features"),
    items: [
      {
        label: localized("Tạo CV chuẩn IT", "ATS-ready IT CV"),
        desc: localized(
          "Mẫu CV tối ưu ATS, chấm điểm và gợi ý cải thiện theo JD.",
          "ATS-ready templates, scoring, and job-description guidance.",
        ),
        icon: <FileText size={20} />,
        path: "/register",
        iconClass: "feat-icon-cv",
      },
      {
        label: localized("Phỏng vấn AI", "AI interviews"),
        desc: localized(
          "Luyện phỏng vấn với bộ câu hỏi theo CV, JD và level mục tiêu.",
          "Practice questions tailored to your CV, role, and seniority.",
        ),
        icon: <Bot size={20} />,
        path: "/register",
        badge: localized("Mới", "New"),
        iconClass: "feat-icon-ai",
      },
      {
        label: localized("Lộ trình IT", "IT career roadmap"),
        desc: localized(
          "Bản đồ nghề nghiệp từ Fresher đến Lead theo từng stack.",
          "Career maps from Fresher to Lead for each technology stack.",
        ),
        icon: <Route size={20} />,
        path: "/register",
        iconClass: "feat-icon-path",
      },
      {
        label: localized("Cẩm nang lương", "Salary guide"),
        desc: localized(
          "Dữ liệu lương theo vị trí, kinh nghiệm và khu vực.",
          "Salary data by role, experience, and location.",
        ),
        icon: <WalletCards size={20} />,
        path: "/jobs",
        iconClass: "feat-icon-salary",
      },
      {
        label: localized("Cộng đồng & mentor", "Community & mentors"),
        desc: localized(
          "Hỏi đáp, review CV và kết nối mentor trong ngành.",
          "Get answers, CV feedback, and connect with industry mentors.",
        ),
        icon: <MessagesSquare size={20} />,
        path: "/register",
        iconClass: "feat-icon-community",
      },
      {
        label: localized("Học tập & sự kiện", "Learning & events"),
        desc: localized(
          "Workshop, livestream và khóa học kỹ năng cho dev.",
          "Workshops, livestreams, and skill-building courses for developers.",
        ),
        icon: <GraduationCap size={20} />,
        path: "/register",
        iconClass: "feat-icon-learn",
      },
    ],
    overview: {
      label: { vi: "Khám phá các tính năng", en: "Explore features" },
      description: {
        vi: "Trang bị công cụ để tìm việc có chiến lược hơn",
        en: "Use the tools that make your job search more strategic",
      },
      path: "/register",
    },
  },
];

const jobsMenuCategories: JobsMenuCategory[] = [
  {
    key: "all",
    label: { vi: "Tất cả danh mục", en: "All categories" },
    icon: <SquaresFour size={27} weight="regular" />,
  },
  {
    key: "skills",
    label: { vi: "Theo kỹ năng", en: "By skills" },
    icon: <Code size={29} weight="regular" />,
  },
  {
    key: "titles",
    label: { vi: "Theo chức danh", en: "By job title" },
    icon: <Briefcase size={29} weight="regular" />,
  },
  {
    key: "expertise",
    label: { vi: "Theo chuyên môn", en: "By specialization" },
    icon: <User size={29} weight="regular" />,
  },
  {
    key: "companies",
    label: { vi: "Theo công ty", en: "By company" },
    icon: <Buildings size={29} weight="regular" />,
  },
  {
    key: "cities",
    label: { vi: "Theo địa điểm", en: "By city" },
    icon: <MapPin size={29} weight="regular" />,
  },
];

const jobsMenuFilterParam: Record<JobsMenuTab, string> = {
  all: "jobCategory",
  skills: "skill",
  titles: "title",
  expertise: "expertise",
  companies: "company",
  cities: "location",
};

function createJobsFilterPath(param: string, value: string) {
  const search = new URLSearchParams({ [param]: value });
  return `/jobs?${search.toString()}`;
}

function createJobsMenuEntries(jobs: PublicJob[], tab: JobsMenuTab): JobsMenuEntry[] {
  const values =
    tab === "skills"
      ? jobs.flatMap((job) => job.jobPostSkills?.map((item) => item.skill.name) ?? [])
      : tab === "titles"
        ? jobs.map((job) => job.title)
        : tab === "expertise"
          ? jobs.flatMap(
              (job) => job.jobPostSpecializations?.map((item) => item.specialization.name) ?? [],
            )
          : tab === "companies"
            ? jobs.map((job) => job.company?.name)
            : tab === "cities"
              ? jobs.flatMap(
                  (job) => job.jobPostLocations?.map((item) => item.jobLocation.city) ?? [],
                )
              : jobs.map((job) => job.jobCategory?.name);

  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value?.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const param = jobsMenuFilterParam[tab];
  return Array.from(counts, ([label, count]) => ({
    label,
    count,
    path: createJobsFilterPath(param, label),
  }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "vi"))
    .slice(0, 16);
}

const languages: Language[] = [
  {
    code: "VI",
    locale: "vi",
    label: "Tiếng Việt",
    flagLabel: localized("Cờ Việt Nam", "Vietnamese flag"),
  },
  {
    code: "EN",
    locale: "en",
    label: "English",
    flagLabel: localized("Cờ Vương quốc Anh", "United Kingdom flag"),
  },
];

const guestCandidateUtilityItems: CandidateUtilityItem[] = [
  { label: localized("Tạo CV chuẩn ATS", "Build an ATS-ready CV"), href: "/register" },
  { label: localized("Gợi ý việc theo hồ sơ", "Personalized job matches"), href: "/register" },
  { label: localized("AI Interview", "AI Interview"), comingSoon: true },
];

const signedInCandidateUtilityItems: CandidateUtilityItem[] = [
  { label: localized("Cập nhật hồ sơ", "Update your profile"), href: "/candidate/profile" },
  { label: localized("CV của tôi", "My CV"), href: "/candidate/cv-builder" },
  { label: localized("AI Interview", "AI Interview"), comingSoon: true },
];

const compactNavigationLinks: CompactNavigationLink[] = [
  { label: localized("Việc làm IT", "IT Jobs"), href: "/jobs" },
  { label: localized("Công ty IT", "IT Companies"), href: "/companies" },
  { label: localized("Bài viết", "Articles"), href: "/posts" },
  { label: localized("Tạo hồ sơ", "Create profile"), href: "/register" },
  { label: localized("Đăng nhập", "Log in"), href: "/login" },
  {
    label: localized("Nhà tuyển dụng", "Employers"),
    href: "/recruiter/login",
    employer: true,
  },
];

const demoAuthStorageKey = "upnext.demo.auth";
const demoAuthChangeEvent = "upnext-demo-auth-change";
const menuCloseDelayMs = 260;

const copyByLocale: Record<"vi" | "en", PublicHeaderCopy> = {
  vi: {
    utilityNavigationLabel: "Công cụ dành cho ứng viên",
    utilityGuestLabel: "Bắt đầu sự nghiệp",
    utilityCandidateLabel: "Tối ưu hồ sơ",
    comingSoonLabel: "Sắp ra mắt",
    compactMenuLabel: "Mở menu",
    compactNavigationLabel: "Điều hướng chính",
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
    utilityNavigationLabel: "Candidate tools",
    utilityGuestLabel: "Build your career",
    utilityCandidateLabel: "Strengthen your profile",
    comingSoonLabel: "Coming soon",
    compactMenuLabel: "Open menu",
    compactNavigationLabel: "Primary navigation",
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
  const [jobsMegaLeft, setJobsMegaLeft] = useState<number | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [compactMenuOpen, setCompactMenuOpen] = useState(false);
  const [storedViewer, setStoredViewer] = useState<PublicHeaderViewer | null>(null);
  const menuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const compactMenuRef = useRef<HTMLDivElement | null>(null);
  const currentLocale = locale === "en" ? "en" : "vi";
  const lang: Language["code"] = currentLocale === "en" ? "EN" : "VI";
  const copy = copyByLocale[currentLocale];
  const effectiveViewer = viewer === undefined ? storedViewer : viewer;
  const candidateUtilityItems = effectiveViewer
    ? signedInCandidateUtilityItems
    : guestCandidateUtilityItems;
  const candidateUtilityLabel = effectiveViewer
    ? copy.utilityCandidateLabel
    : copy.utilityGuestLabel;
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

  function clearMenuCloseTimer() {
    if (menuCloseTimerRef.current === null) return;
    clearTimeout(menuCloseTimerRef.current);
    menuCloseTimerRef.current = null;
  }

  function alignJobsMegaMenu(menuKey: string) {
    if (menuKey !== "jobs") return;

    const trigger = document.getElementById(`public-nav-${menuKey}-trigger`);
    if (!trigger) return;

    const panelWidth = Math.min(1000, window.innerWidth - 40);
    const maxLeft = Math.max(20, window.innerWidth - panelWidth - 20);
    setJobsMegaLeft(Math.max(20, Math.min(trigger.getBoundingClientRect().left, maxLeft)));
  }

  function openMenuFromPointer(menuKey: string) {
    clearMenuCloseTimer();
    alignJobsMegaMenu(menuKey);
    setOpenMenu(menuKey);
  }

  function scheduleMenuClose() {
    clearMenuCloseTimer();
    menuCloseTimerRef.current = setTimeout(() => {
      menuCloseTimerRef.current = null;
      setOpenMenu(null);
    }, menuCloseDelayMs);
  }

  useEffect(
    () => () => {
      clearMenuCloseTimer();
    },
    [],
  );

  useEffect(() => {
    if (openMenu !== "jobs") return undefined;

    function handleResize() {
      alignJobsMegaMenu("jobs");
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [openMenu]);

  useEffect(() => {
    if (!openMenu) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      const trigger = document.getElementById(`public-nav-${openMenu}-trigger`);
      clearMenuCloseTimer();
      setOpenMenu(null);
      trigger?.focus();
    }
    function handleScroll() {
      clearMenuCloseTimer();
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
    if (!compactMenuOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!compactMenuRef.current?.contains(event.target as Node)) setCompactMenuOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCompactMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [compactMenuOpen]);

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
      <div className="marketing-home-utility-bar">
        <div className="marketing-home-utility-content">
          <nav aria-label={copy.utilityNavigationLabel}>
            <span className="marketing-home-utility-label">{candidateUtilityLabel}</span>
            {candidateUtilityItems.map((item) => (
              <span key={item.label[currentLocale]} className="marketing-home-utility-item">
                {item.href ? (
                  <Link className="marketing-home-utility-link" href={item.href}>
                    {item.label[currentLocale]}
                  </Link>
                ) : (
                  <span
                    className="marketing-home-utility-coming-soon"
                    aria-label={`${item.label[currentLocale]} — ${copy.comingSoonLabel}`}
                  >
                    <span>{item.label[currentLocale]}</span>
                    <small>{copy.comingSoonLabel}</small>
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="marketing-home-header-main">
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

        <nav
          className="marketing-home-nav"
          aria-label={currentLocale === "en" ? "Primary navigation" : "Điều hướng chính"}
          ref={navRef}
        >
          {navMenus.map((menu) => {
            const triggerId = `public-nav-${menu.key}-trigger`;
            const panelId = `public-nav-${menu.key}-panel`;

            return (
              <div
                key={menu.key}
                className={`marketing-home-nav-dd${openMenu === menu.key ? " is-open" : ""}`}
                onMouseEnter={() => openMenuFromPointer(menu.key)}
                onMouseLeave={scheduleMenuClose}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    clearMenuCloseTimer();
                    setOpenMenu(null);
                  }
                }}
              >
                <button
                  id={triggerId}
                  type="button"
                  className="marketing-home-nav-trigger"
                  aria-controls={panelId}
                  aria-expanded={openMenu === menu.key}
                  onClick={(event) => {
                    clearMenuCloseTimer();
                    alignJobsMegaMenu(menu.key);
                    if (event.detail > 0) {
                      setOpenMenu(menu.key);
                      return;
                    }

                    setOpenMenu((open) => (open === menu.key ? null : menu.key));
                  }}
                >
                  {menu.label[currentLocale]}
                  <ChevronDown size={15} aria-hidden="true" />
                </button>

                <div
                  id={panelId}
                  className={`marketing-home-mega${
                    menu.key === "jobs"
                      ? " marketing-home-jobs-mega"
                      : " marketing-home-directory-mega"
                  }`}
                  aria-labelledby={triggerId}
                  onMouseEnter={clearMenuCloseTimer}
                  style={
                    menu.key === "jobs" && jobsMegaLeft !== null
                      ? { left: jobsMegaLeft }
                      : undefined
                  }
                >
                  {menu.key === "jobs" ? (
                    <JobsMegaMenu
                      locale={currentLocale}
                      isOpen={openMenu === menu.key}
                      onNavigate={() => setOpenMenu(null)}
                    />
                  ) : (
                    <DirectoryMegaMenu
                      menu={menu}
                      locale={currentLocale}
                      label={menu.label[currentLocale]}
                      isOpen={openMenu === menu.key}
                      onNavigate={() => setOpenMenu(null)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="marketing-home-header-actions">
          <div
            className={`marketing-home-compact-menu${compactMenuOpen ? " is-open" : ""}`}
            ref={compactMenuRef}
          >
            <button
              type="button"
              className="marketing-home-compact-menu-trigger"
              aria-controls="public-compact-navigation"
              aria-expanded={compactMenuOpen}
              aria-label={copy.compactMenuLabel}
              onClick={() => setCompactMenuOpen((open) => !open)}
            >
              <List size={20} aria-hidden="true" />
            </button>

            <nav
              id="public-compact-navigation"
              className="marketing-home-compact-menu-panel"
              aria-label={copy.compactNavigationLabel}
            >
              {compactNavigationLinks.map((item) => (
                <Link
                  key={item.href}
                  className={item.employer ? "is-employer" : undefined}
                  href={item.href}
                  onClick={() => setCompactMenuOpen(false)}
                >
                  {item.label[currentLocale]}
                </Link>
              ))}
            </nav>
          </div>

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
                    <FlagIcon code={item.code} label={item.flagLabel[currentLocale]} />
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
                      active={
                        isCandidatePathActive("/candidate/profile") && !isJobPreferencesActive
                      }
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
      </div>
    </header>
  );
}

function DirectoryMegaMenu({
  menu,
  locale,
  label,
  isOpen,
  onNavigate,
}: Readonly<{
  menu: NavMenu;
  locale: "vi" | "en";
  label: string;
  isOpen: boolean;
  onNavigate: () => void;
}>) {
  const overview = menu.overview;

  return (
    <>
      <div className="marketing-home-directory-body">
        <ul className="marketing-home-directory-items" aria-label={label}>
          {menu.items.map((item) => (
            <li key={item.label.vi}>
              <Link
                className="marketing-home-directory-item"
                href={item.path}
                onClick={onNavigate}
                prefetch={isOpen ? null : false}
              >
                <span className="marketing-home-directory-text">
                  <b>
                    <span>{item.label[locale]}</span>
                    {item.badge ? <em>{item.badge[locale]}</em> : null}
                  </b>
                  <small>{item.desc[locale]}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link
        className="marketing-home-directory-footer"
        href={overview.path}
        aria-label={overview.label[locale]}
        onClick={onNavigate}
        prefetch={isOpen ? null : false}
      >
        <span className="marketing-home-directory-footer-icon" aria-hidden="true">
          <ArrowUpRight size={21} />
        </span>
        <span>
          <b>{overview.label[locale]}</b>
          <small>{overview.description[locale]}</small>
        </span>
        <ChevronDown
          className="marketing-home-directory-footer-arrow"
          size={18}
          aria-hidden="true"
        />
      </Link>
    </>
  );
}

function JobsMegaMenu({
  locale,
  isOpen,
  onNavigate,
}: Readonly<{
  locale: "vi" | "en";
  isOpen: boolean;
  onNavigate: () => void;
}>) {
  const [activeTab, setActiveTab] = useState<JobsMenuTab>("expertise");
  const {
    data: jobs = [],
    isError,
    isPending,
  } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
  });
  const entries = useMemo(() => createJobsMenuEntries(jobs, activeTab), [activeTab, jobs]);
  const middle = Math.ceil(entries.length / 2);
  const columns = [entries.slice(0, middle), entries.slice(middle)];
  const activeCategory = jobsMenuCategories.find((category) => category.key === activeTab);
  function handleTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, currentTab: JobsMenuTab) {
    const currentIndex = jobsMenuCategories.findIndex((category) => category.key === currentTab);
    const lastIndex = jobsMenuCategories.length - 1;
    const nextIndex =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? (currentIndex + 1) % jobsMenuCategories.length
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? (currentIndex - 1 + jobsMenuCategories.length) % jobsMenuCategories.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null;

    if (nextIndex === null) return;
    event.preventDefault();
    document.getElementById(`jobs-menu-tab-${jobsMenuCategories[nextIndex]?.key}`)?.focus();
  }
  const footerTitle =
    activeTab === "all"
      ? locale === "en"
        ? "View all job categories"
        : "Xem tất cả danh mục"
      : locale === "en"
        ? `View all ${activeCategory?.label.en.toLowerCase() ?? "IT jobs"}`
        : `Xem tất cả ${activeCategory?.label.vi.replace(/^Theo /u, "").toLowerCase() ?? "việc làm IT"}`;
  const footerDescription =
    locale === "en"
      ? `${jobs.length} open jobs from live hiring data`
      : `${jobs.length} việc làm đang tuyển từ dữ liệu thực tế`;

  return (
    <>
      <div className="marketing-home-jobs-body">
        <ul
          className="marketing-home-jobs-categories"
          aria-label={locale === "en" ? "Job categories" : "Danh mục việc làm"}
          role="tablist"
        >
          {jobsMenuCategories.map((category) => (
            <li key={category.label.en} role="presentation">
              <button
                id={`jobs-menu-tab-${category.key}`}
                type="button"
                role="tab"
                className={activeTab === category.key ? "is-active" : undefined}
                aria-selected={activeTab === category.key}
                aria-controls="jobs-menu-tabpanel"
                tabIndex={activeTab === category.key ? 0 : -1}
                onClick={() => setActiveTab(category.key)}
                onFocus={() => setActiveTab(category.key)}
                onMouseEnter={() => setActiveTab(category.key)}
                onKeyDown={(event) => handleTabKeyDown(event, category.key)}
              >
                <span aria-hidden="true">{category.icon}</span>
                <span>{category.label[locale]}</span>
              </button>
            </li>
          ))}
        </ul>

        <div
          id="jobs-menu-tabpanel"
          className="marketing-home-jobs-roles"
          role="tabpanel"
          aria-labelledby={`jobs-menu-tab-${activeTab}`}
          aria-live="polite"
        >
          {isPending ? (
            <p className="marketing-home-jobs-state">
              {locale === "en" ? "Loading hiring data…" : "Đang tải dữ liệu tuyển dụng…"}
            </p>
          ) : isError ? (
            <p className="marketing-home-jobs-state is-error">
              {locale === "en" ? "Hiring data is unavailable." : "Chưa thể tải dữ liệu tuyển dụng."}
            </p>
          ) : entries.length === 0 ? (
            <p className="marketing-home-jobs-state">
              {locale === "en" ? "No matching data yet." : "Chưa có dữ liệu phù hợp."}
            </p>
          ) : (
            columns.map((column, columnIndex) => (
              <ul
                key={columnIndex}
                aria-label={
                  activeCategory?.label[locale] ?? (locale === "en" ? "IT jobs" : "Việc làm IT")
                }
              >
                {column.map((entry) => (
                  <li key={entry.label}>
                    <Link href={entry.path} onClick={onNavigate} prefetch={isOpen ? null : false}>
                      <span>{entry.label}</span>
                      <small className="marketing-home-jobs-role-count">{entry.count}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            ))
          )}
        </div>
      </div>

      <Link
        className="marketing-home-jobs-footer"
        href="/jobs"
        aria-label={footerTitle}
        onClick={onNavigate}
        prefetch={isOpen ? null : false}
      >
        <span className="marketing-home-jobs-footer-icon" aria-hidden="true">
          <ArrowUpRight size={21} />
        </span>
        <span>
          <b>{footerTitle}</b>
          <small>{footerDescription}</small>
        </span>
        <ChevronDown className="marketing-home-jobs-footer-arrow" size={18} aria-hidden="true" />
      </Link>
    </>
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
