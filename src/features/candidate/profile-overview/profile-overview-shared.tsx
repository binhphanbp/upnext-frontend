import Image from "next/image";
import type { ReactNode } from "react";

import { ArrowRight, CheckCircle } from "./icons";

/* ------------------------------------------------------------------ *
 * Shared types
 * ------------------------------------------------------------------ */

export type TabKey =
  | "overview"
  | "profile"
  | "cv"
  | "saved"
  | "applied"
  | "companies"
  | "alerts"
  | "compare"
  | "settings";

export type NavHandler = (path: string) => void;

/* ------------------------------------------------------------------ *
 * Profile data (mock)
 * ------------------------------------------------------------------ */

export const profile = {
  name: "Bình Nguyễn",
  firstName: "Bình",
  role: "Frontend Developer",
  level: "Middle • 3 năm kinh nghiệm",
  completion: 76,
  email: "binh.nguyen@gmail.com",
  phone: "0901 234 567",
  cv: "Binh_Nguyen_Resume.pdf",
  location: "Hà Nội",
  openToWork: true,
  expectedSalary: "25 - 32 triệu",
  title: "Frontend Developer (ReactJS / TypeScript)",
};

export type FollowedCompany = {
  name: string;
  logo: string;
  industry: string;
  size: string;
  openJobs: number;
  note: string;
  time: string;
};

export const followedCompanies: FollowedCompany[] = [
  {
    name: "FPT Software",
    logo: "/assets/marketing/home/companies/fpt.png",
    industry: "Outsourcing • Phần mềm",
    size: "10.000+ nhân viên",
    openJobs: 12,
    note: "Đăng 12 việc làm mới",
    time: "2 giờ trước",
  },
  {
    name: "VNG Corporation",
    logo: "/assets/marketing/home/companies/vng.png",
    industry: "Product • Internet",
    size: "3.000+ nhân viên",
    openJobs: 8,
    note: "Đăng 8 việc làm mới",
    time: "5 giờ trước",
  },
  {
    name: "Tiki",
    logo: "/assets/marketing/home/companies/tiki.png",
    industry: "E-commerce",
    size: "2.000+ nhân viên",
    openJobs: 5,
    note: "Đăng 5 việc làm mới",
    time: "1 ngày trước",
  },
  {
    name: "MoMo",
    logo: "/assets/marketing/home/companies/momo.png",
    industry: "Fintech",
    size: "1.500+ nhân viên",
    openJobs: 7,
    note: "Đăng 7 việc làm mới",
    time: "2 ngày trước",
  },
];

/* ------------------------------------------------------------------ *
 * Shared presentational components
 * ------------------------------------------------------------------ */

export function Logo({ src, fallback }: { src: string; fallback: string }) {
  if (!src) {
    return <span className="profile-v2-logo-fallback">{fallback}</span>;
  }
  return (
    <span className="profile-v2-logo">
      <Image src={src} alt="" width={44} height={44} />
    </span>
  );
}

export function ProgressRing({ value, size = 190 }: { value: number; size?: number }) {
  const stroke = size >= 150 ? 16 : 12;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div
      className="profile-v2-ring"
      style={{ width: size, height: size }}
      aria-label={`Hồ sơ hoàn thiện ${value}%`}
    >
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="track"
          style={{ strokeWidth: stroke }}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="value"
          style={{ strokeWidth: stroke }}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span>
        <strong>{value}%</strong>
        <small>Hoàn thiện</small>
      </span>
    </div>
  );
}

export function DashboardCard({
  title,
  action,
  onAction,
  className = "",
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article className={`profile-v2-card profile-v2-panel ${className}`}>
      <header>
        <h2>{title}</h2>
        {action && (
          <button type="button" onClick={onAction}>
            {action} <ArrowRight size={14} />
          </button>
        )}
      </header>
      {children}
    </article>
  );
}

/** Reusable page header shown at the top of every tab body. */
export function TabHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="profile-v2-tab-head">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="profile-v2-tab-head-actions">{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string | undefined;
}) {
  return (
    <div className="profile-v2-section-title">
      <h3>{children}</h3>
      {hint && <span>{hint}</span>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="profile-v2-empty">
      <span className="profile-v2-empty-icon">{icon}</span>
      <strong>{title}</strong>
      <p>{desc}</p>
      {actionLabel && (
        <button type="button" className="profile-v2-btn-primary" onClick={onAction}>
          {actionLabel} <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`profile-v2-toggle${checked ? " is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function Checklist({ tasks }: { tasks: Array<{ label: string; done: boolean }> }) {
  return (
    <div className="profile-v2-checklist">
      {tasks.map((task) => (
        <span key={task.label} className={task.done ? "is-done" : ""}>
          {task.label}
          {task.done ? <CheckCircle size={17} /> : <i />}
        </span>
      ))}
    </div>
  );
}
