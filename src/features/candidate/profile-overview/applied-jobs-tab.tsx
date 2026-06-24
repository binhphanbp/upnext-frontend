import { useState } from "react";

import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Funnel,
  MapPin,
  ShieldCheck,
  XCircle,
} from "./icons";
import { EmptyState, Logo, TabHeader } from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";

type Stage = "submitted" | "reviewing" | "interview" | "offer" | "rejected";

type Application = {
  id: string;
  title: string;
  company: string;
  logo: string;
  fallback: string;
  location: string;
  salary: string;
  appliedAt: string;
  stage: Stage;
  lastUpdate: string;
};

const stageMeta: Record<Stage, { label: string; tone: string }> = {
  submitted: { label: "Đã nộp", tone: "slate" },
  reviewing: { label: "Đang xem xét", tone: "amber" },
  interview: { label: "Phỏng vấn", tone: "blue" },
  offer: { label: "Nhận offer", tone: "green" },
  rejected: { label: "Chưa phù hợp", tone: "red" },
};

const applications: Application[] = [
  {
    id: "a1",
    title: "Frontend Developer (ReactJS)",
    company: "FPT Software",
    logo: "/assets/marketing/home/companies/fpt.png",
    fallback: "FPT",
    location: "TP. Hồ Chí Minh",
    salary: "25 - 35 triệu",
    appliedAt: "08/05/2026",
    stage: "interview",
    lastUpdate: "Mời phỏng vấn vòng 1 • Hôm nay",
  },
  {
    id: "a2",
    title: "Mobile Developer React Native",
    company: "MoMo",
    logo: "/assets/marketing/home/companies/momo.png",
    fallback: "MoMo",
    location: "TP. Hồ Chí Minh",
    salary: "25 - 40 triệu",
    appliedAt: "06/05/2026",
    stage: "reviewing",
    lastUpdate: "Nhà tuyển dụng đã xem hồ sơ • Hôm qua",
  },
  {
    id: "a3",
    title: "Frontend Engineer ReactJS",
    company: "VNG Corporation",
    logo: "/assets/marketing/home/companies/vng.png",
    fallback: "VNG",
    location: "Hà Nội",
    salary: "22 - 35 triệu",
    appliedAt: "03/05/2026",
    stage: "submitted",
    lastUpdate: "Hồ sơ đã gửi thành công",
  },
  {
    id: "a4",
    title: "Senior Frontend Developer",
    company: "Tiki",
    logo: "/assets/marketing/home/companies/tiki.png",
    fallback: "Tiki",
    location: "Hà Nội",
    salary: "30 - 45 triệu",
    appliedAt: "28/04/2026",
    stage: "offer",
    lastUpdate: "Đã nhận thư mời nhận việc • 2 ngày trước",
  },
  {
    id: "a5",
    title: "QA Automation Engineer",
    company: "VNPAY",
    logo: "/assets/marketing/home/companies/vnpay.png",
    fallback: "VNP",
    location: "TP. Hồ Chí Minh",
    salary: "18 - 32 triệu",
    appliedAt: "20/04/2026",
    stage: "rejected",
    lastUpdate: "Vị trí đã tuyển đủ • 5 ngày trước",
  },
];

const stageOrder: Stage[] = ["submitted", "reviewing", "interview", "offer"];

const tabs: Array<{ key: "all" | Stage; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "submitted", label: "Đã nộp" },
  { key: "reviewing", label: "Đang xem xét" },
  { key: "interview", label: "Phỏng vấn" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Chưa phù hợp" },
];

type AppliedProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

export function AppliedJobsTab({ navigate }: AppliedProps) {
  const [filter, setFilter] = useState<"all" | Stage>("all");

  const counts = applications.reduce(
    (acc, app) => {
      acc[app.stage] = (acc[app.stage] ?? 0) + 1;
      return acc;
    },
    {} as Record<Stage, number>,
  );

  const visible =
    filter === "all" ? applications : applications.filter((app) => app.stage === filter);

  const summary = [
    {
      label: "Tổng ứng tuyển",
      value: applications.length,
      tone: "slate",
      icon: <Briefcase size={20} />,
    },
    {
      label: "Đang xử lý",
      value: (counts.reviewing ?? 0) + (counts.submitted ?? 0),
      tone: "amber",
      icon: <Clock size={20} />,
    },
    {
      label: "Phỏng vấn",
      value: counts.interview ?? 0,
      tone: "blue",
      icon: <CalendarCheck size={20} />,
    },
    { label: "Offer", value: counts.offer ?? 0, tone: "green", icon: <ShieldCheck size={20} /> },
  ];

  return (
    <>
      <TabHeader
        title="Việc đã ứng tuyển"
        subtitle="Theo dõi trạng thái và tiến trình từng đơn ứng tuyển của bạn."
        actions={
          <button
            type="button"
            className="profile-v2-btn-primary"
            onClick={() => navigate("/jobs")}
          >
            Ứng tuyển thêm <ArrowRight size={15} />
          </button>
        }
      />

      <section className="profile-v2-summary-row">
        {summary.map((item) => (
          <article
            key={item.label}
            className={`profile-v2-card profile-v2-summary-card is-${item.tone}`}
          >
            <span>{item.icon}</span>
            <div>
              <strong>{item.value}</strong>
              <small>{item.label}</small>
            </div>
          </article>
        ))}
      </section>

      <div className="profile-v2-chip-row profile-v2-chip-row-tabs">
        <span className="profile-v2-chip-label">
          <Funnel size={14} /> Lọc:
        </span>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`profile-v2-chip${filter === tab.key ? " is-active" : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            {tab.key !== "all" && counts[tab.key as Stage] ? (
              <em className="profile-v2-chip-count">{counts[tab.key as Stage]}</em>
            ) : null}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={26} />}
          title="Không có đơn ứng tuyển nào ở mục này"
          desc="Khi bạn ứng tuyển, trạng thái đơn sẽ xuất hiện tại đây."
          actionLabel="Tìm việc ngay"
          onAction={() => navigate("/jobs")}
        />
      ) : (
        <div className="profile-v2-applied-list">
          {visible.map((app) => {
            const meta = stageMeta[app.stage];
            const stepIndex = stageOrder.indexOf(app.stage);
            return (
              <article key={app.id} className="profile-v2-card profile-v2-applied-card">
                <div className="profile-v2-applied-head">
                  <Logo src={app.logo} fallback={app.fallback} />
                  <div className="profile-v2-applied-info">
                    <strong>{app.title}</strong>
                    <span>{app.company}</span>
                    <div className="profile-v2-saved-meta">
                      <em>
                        <MapPin size={13} /> {app.location}
                      </em>
                      <em>{app.salary}</em>
                      <em>Nộp ngày {app.appliedAt}</em>
                    </div>
                  </div>
                  <span className={`profile-v2-stage-badge is-${meta.tone}`}>{meta.label}</span>
                </div>

                {app.stage !== "rejected" ? (
                  <div className="profile-v2-stepper">
                    {stageOrder.map((stage, index) => (
                      <div
                        key={stage}
                        className={`profile-v2-step${index <= stepIndex ? " is-done" : ""}${index === stepIndex ? " is-current" : ""}`}
                      >
                        <span className="profile-v2-step-dot">
                          {index < stepIndex ? <Check size={12} weight="bold" /> : index + 1}
                        </span>
                        <small>{stageMeta[stage].label}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-v2-applied-rejected">
                    <XCircle size={16} weight="fill" /> {app.lastUpdate}
                  </div>
                )}

                <div className="profile-v2-applied-foot">
                  <small>
                    <Clock size={13} /> {app.lastUpdate}
                  </small>
                  <div>
                    <button
                      type="button"
                      className="profile-v2-btn-ghost profile-v2-btn-sm"
                      onClick={() => navigate(`/jobs`)}
                    >
                      <Eye size={14} /> Xem tin
                    </button>
                    <button type="button" className="profile-v2-link-strong">
                      Chi tiết đơn <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
