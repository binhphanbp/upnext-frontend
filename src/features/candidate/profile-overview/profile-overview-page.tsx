"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { upnextLogo } from "@/features/public/home/brand";

import { AlertsTab } from "./alerts-tab";
import { AppliedJobsTab } from "./applied-jobs-tab";
import { CompaniesTab } from "./companies-tab";
import { CompareTab } from "./compare-tab";
import { CvTab } from "./cv-tab";
import {
  ArrowRight,
  Bell,
  BellRinging,
  Briefcase,
  Building2,
  ChevronDown,
  FileText,
  GearSix,
  Heart,
  House,
  Mail,
  Medal,
  Target,
  UsersRound,
} from "./icons";
import { OverviewTab } from "./overview-tab";
import { profile } from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";
import { ProfileTab } from "./profile-tab";
import { SavedJobsTab } from "./saved-jobs-tab";
import { SettingsTab } from "./settings-tab";

import "./profile-overview.css";
import "./profile-tabs.css";

type CandidateProfileOverviewPageProps = {
  navigate: NavHandler;
};

type SidebarItem = {
  key: TabKey;
  label: string;
  icon: ReactNode;
  badge?: string;
};

const sidebarItems: SidebarItem[] = [
  { key: "overview", label: "Tổng quan", icon: <House size={18} /> },
  { key: "profile", label: "Hồ sơ của tôi", icon: <UsersRound size={18} /> },
  { key: "cv", label: "CV của tôi", icon: <FileText size={18} />, badge: "3" },
  { key: "saved", label: "Việc làm đã lưu", icon: <Heart size={18} />, badge: "28" },
  { key: "applied", label: "Việc đã ứng tuyển", icon: <Briefcase size={18} />, badge: "14" },
  { key: "companies", label: "Công ty đang theo dõi", icon: <Building2 size={18} />, badge: "9" },
  { key: "alerts", label: "Thông báo việc làm", icon: <BellRinging size={18} />, badge: "18" },
  { key: "compare", label: "So sánh CV với JD", icon: <Target size={18} /> },
  { key: "settings", label: "Cài đặt", icon: <GearSix size={18} /> },
];

const validTabs = new Set<TabKey>(sidebarItems.map((item) => item.key));

function normalizeTab(value: string | null): TabKey {
  return value && validTabs.has(value as TabKey) ? (value as TabKey) : "overview";
}

export function CandidateProfileOverviewPage({ navigate }: CandidateProfileOverviewPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = normalizeTab(searchParams.get("tab"));

  function goToTab(next: TabKey) {
    router.push(next === "overview" ? pathname : `${pathname}?tab=${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="profile-v2-page">
      <header className="profile-v2-topbar">
        <button
          type="button"
          className="profile-v2-brand"
          aria-label="Trang chủ UpNext"
          onClick={() => navigate("/")}
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

        <nav className="profile-v2-nav" aria-label="Điều hướng chính">
          <button type="button" onClick={() => navigate("/jobs")}>
            Tìm việc
          </button>
          <button type="button" onClick={() => navigate("/companies")}>
            Công ty
          </button>
          <button type="button" onClick={() => navigate("/")}>
            Bài viết
          </button>
          <button type="button" onClick={() => navigate("/employer")}>
            Bảng giá
          </button>
        </nav>

        <div className="profile-v2-top-actions">
          <button
            type="button"
            className="profile-v2-icon-btn"
            aria-label="Thông báo"
            onClick={() => goToTab("alerts")}
          >
            <Bell size={21} />
            <span>3</span>
          </button>
          <button type="button" className="profile-v2-icon-btn" aria-label="Tin nhắn">
            <Mail size={21} />
          </button>
          <span className="profile-v2-top-sep" aria-hidden="true" />
          <button type="button" className="profile-v2-account" onClick={() => goToTab("settings")}>
            <span className="profile-v2-avatar">BN</span>
            <span>
              <b>{profile.name}</b>
              <small>{profile.role}</small>
            </span>
            <ChevronDown size={16} />
          </button>
        </div>
      </header>

      <div className="profile-v2-layout">
        <aside className="profile-v2-sidebar">
          <nav aria-label="Hồ sơ ứng viên">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={tab === item.key ? "is-active" : ""}
                aria-current={tab === item.key ? "page" : undefined}
                onClick={() => goToTab(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && <em className="profile-v2-side-badge">{item.badge}</em>}
              </button>
            ))}
          </nav>

          <section className="profile-v2-upgrade">
            <span>
              <Medal size={18} />
            </span>
            <h3>Nâng cấp tài khoản</h3>
            <p>Tăng cơ hội được nhà tuyển dụng chú ý với gói Premium.</p>
            <button type="button" onClick={() => navigate("/employer")}>
              Nâng cấp ngay <ArrowRight size={15} />
            </button>
          </section>
        </aside>

        <section className="profile-v2-main" key={tab}>
          {tab === "overview" && <OverviewTab navigate={navigate} goToTab={goToTab} />}
          {tab === "profile" && <ProfileTab navigate={navigate} goToTab={goToTab} />}
          {tab === "cv" && <CvTab navigate={navigate} goToTab={goToTab} />}
          {tab === "saved" && <SavedJobsTab navigate={navigate} goToTab={goToTab} />}
          {tab === "applied" && <AppliedJobsTab navigate={navigate} goToTab={goToTab} />}
          {tab === "companies" && <CompaniesTab navigate={navigate} goToTab={goToTab} />}
          {tab === "alerts" && <AlertsTab navigate={navigate} goToTab={goToTab} />}
          {tab === "compare" && <CompareTab navigate={navigate} goToTab={goToTab} />}
          {tab === "settings" && <SettingsTab navigate={navigate} goToTab={goToTab} />}
        </section>
      </div>
    </main>
  );
}
