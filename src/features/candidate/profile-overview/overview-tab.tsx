import { useState } from "react";

import {
  ArrowRight,
  BellRinging,
  Bookmark,
  Building2,
  Calendar,
  ChevronRight,
  DotsThreeVertical,
  DownloadSimple,
  Eye,
  FileText,
  MapPin,
  NotePencil,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "./icons";
import { profileJobs } from "./profile-jobs-data";
import {
  Checklist,
  DashboardCard,
  Logo,
  ProgressRing,
  followedCompanies,
  profile,
} from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";

const completionTasks = [
  { label: "Thông tin cá nhân", done: true },
  { label: "Kỹ năng", done: true },
  { label: "Kinh nghiệm làm việc", done: true },
  { label: "Dự án", done: true },
  { label: "CV đính kèm", done: true },
  { label: "Mức lương mong muốn", done: false },
];

const metricCards = [
  {
    key: "cv" as TabKey,
    label: "CV của tôi",
    value: "3",
    icon: <FileText size={21} />,
    tone: "blue",
  },
  {
    key: "saved" as TabKey,
    label: "Việc làm đã lưu",
    value: "28",
    icon: <Bookmark size={21} />,
    tone: "amber",
  },
  {
    key: "applied" as TabKey,
    label: "Đã ứng tuyển",
    value: "14",
    icon: <ShieldCheck size={21} />,
    tone: "violet",
  },
  {
    key: "companies" as TabKey,
    label: "Công ty theo dõi",
    value: "9",
    icon: <Building2 size={21} />,
    tone: "green",
  },
];

const activities = [
  {
    time: "Hôm nay, 10:24",
    text: "Bạn đã ứng tuyển vị trí Frontend Developer tại FPT Software",
    logo: "/assets/marketing/home/companies/fpt.png",
    fallback: "FPT",
  },
  {
    time: "Hôm qua, 15:43",
    text: "Nhà tuyển dụng của VNG đã xem hồ sơ của bạn",
    logo: "/assets/marketing/home/companies/vng.png",
    fallback: "VNG",
  },
  {
    time: "02/05, 09:12",
    text: "Bạn đã lưu vị trí Senior Frontend Developer tại Tiki",
    logo: "/assets/marketing/home/companies/tiki.png",
    fallback: "Tiki",
  },
  { time: "30/04, 14:30", text: "Bạn đã cập nhật kinh nghiệm làm việc", logo: "", fallback: "CV" },
];

const pipeline = [
  { label: "Đã nộp", desc: "Hồ sơ đã gửi thành công", value: 14, tone: "green" },
  { label: "Đang xem xét", desc: "Nhà tuyển dụng đang xem hồ sơ", value: 6, tone: "amber" },
  { label: "Phỏng vấn", desc: "Đã mời phỏng vấn", value: 2, tone: "coral" },
  { label: "Đã phản hồi", desc: "Đã có kết quả từ nhà tuyển dụng", value: 3, tone: "violet" },
];

const reminders = [
  {
    icon: <WalletCards size={17} />,
    title: "Bổ sung mức lương mong muốn",
    desc: "Tăng cơ hội nhận việc phù hợp hơn",
    action: "Bổ sung",
    tone: "amber",
  },
  {
    icon: <Sparkles size={17} />,
    title: "Hoàn thiện kỹ năng",
    desc: "Nhà tuyển dụng quan tâm đến kỹ năng của bạn",
    action: "Cập nhật",
    tone: "green",
  },
  {
    icon: <Calendar size={17} />,
    title: "1 việc làm sắp hết hạn ứng tuyển",
    desc: "Hạn chót: 05/05/2026",
    action: "Xem ngay",
    tone: "orange",
  },
];

const quickSettings = [
  { label: "Thông báo việc làm", desc: "Nhận việc mới phù hợp qua email", status: "Đã bật" },
  { label: "Tìm kiếm đã lưu", desc: "Quản lý bộ lọc tìm kiếm của bạn", status: "3 bộ lọc" },
  { label: "Khu vực mong muốn", desc: profile.location, status: "" },
];

type OverviewProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

export function OverviewTab({ navigate, goToTab }: OverviewProps) {
  const suggestedJobs = profileJobs.slice(0, 3);
  const [reminderList, setReminderList] = useState(reminders);

  return (
    <>
      <div className="profile-v2-welcome">
        <div>
          <span className="profile-v2-welcome-eyebrow">
            <Sparkles size={14} /> Bảng điều khiển ứng viên
          </span>
          <h1>Chào {profile.firstName}, chúc một ngày tốt lành</h1>
          <p>
            Hành trình tìm việc của bạn đang đi rất tốt. Hãy hoàn thiện nốt hồ sơ để mở khóa thêm
            nhiều cơ hội phù hợp.
          </p>
        </div>
        <button type="button" className="profile-v2-btn-ghost" onClick={() => goToTab("settings")}>
          <NotePencil size={17} />
          Tùy chỉnh trang
        </button>
      </div>

      <section className="profile-v2-hero-grid">
        <article className="profile-v2-card profile-v2-completion">
          <ProgressRing value={profile.completion} />
          <div className="profile-v2-completion-copy">
            <h2>
              Hồ sơ đã hoàn thiện <span>{profile.completion}%</span>
            </h2>
            <p>Hoàn thiện các mục còn thiếu để tăng cơ hội được nhà tuyển dụng chủ động liên hệ.</p>
            <Checklist tasks={completionTasks} />
            <button
              type="button"
              className="profile-v2-btn-primary"
              onClick={() => goToTab("profile")}
            >
              Hoàn thiện hồ sơ <ArrowRight size={16} />
            </button>
          </div>
        </article>

        <div className="profile-v2-metrics">
          {metricCards.map((card) => (
            <button
              key={card.label}
              type="button"
              className="profile-v2-card profile-v2-metric"
              onClick={() => goToTab(card.key)}
            >
              <span className={`profile-v2-metric-icon is-${card.tone}`}>{card.icon}</span>
              <div>
                <strong>{card.value}</strong>
                <small>{card.label}</small>
              </div>
              <em>
                Xem chi tiết <ArrowRight size={14} />
              </em>
            </button>
          ))}
          <button
            type="button"
            className="profile-v2-card profile-v2-wide-metric"
            onClick={() => goToTab("alerts")}
          >
            <span className="profile-v2-metric-icon is-blue">
              <BellRinging size={21} />
            </span>
            <div>
              <strong>18</strong>
              <small>Thông báo việc làm mới phù hợp</small>
            </div>
            <em>
              Xem chi tiết <ArrowRight size={14} />
            </em>
          </button>
        </div>
      </section>

      <section className="profile-v2-two-col">
        <DashboardCard title="Hoạt động gần đây" action="Xem tất cả">
          <div className="profile-v2-activity">
            {activities.map((activity) => (
              <div key={`${activity.time}-${activity.text}`} className="profile-v2-activity-row">
                <span className="profile-v2-activity-dot" />
                <div>
                  <small>{activity.time}</small>
                  <p>{activity.text}</p>
                </div>
                <Logo src={activity.logo} fallback={activity.fallback} />
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Tiến trình ứng tuyển"
          action="Xem tất cả"
          onAction={() => goToTab("applied")}
        >
          <div className="profile-v2-pipeline">
            {pipeline.map((item) => (
              <div key={item.label} className="profile-v2-pipeline-row">
                <span className={`profile-v2-pipeline-icon is-${item.tone}`}>
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </div>
                <b>{item.value}</b>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>

      <section className="profile-v2-content-grid">
        <DashboardCard
          title="Việc làm gợi ý cho bạn"
          action="Xem tất cả"
          onAction={() => navigate("/jobs")}
          className="profile-v2-suggested"
        >
          <div className="profile-v2-job-grid">
            {suggestedJobs.map((job) => (
              <button
                type="button"
                key={job.id}
                className="profile-v2-job-card"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <Logo src={job.logo} fallback={job.company.slice(0, 3)} />
                <h3>{job.title}</h3>
                <p>{job.company}</p>
                <strong>{job.salary}</strong>
                <span>
                  <MapPin size={13} /> {job.location}
                </span>
                <div>
                  {job.tags.slice(0, 2).map((tag) => (
                    <em key={tag}>{tag}</em>
                  ))}
                </div>
                <small>{job.posted}</small>
              </button>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="CV mặc định"
          action="Quản lý CV"
          onAction={() => goToTab("cv")}
          className="profile-v2-cv"
        >
          <div className="profile-v2-cv-file">
            <span>
              <FileText size={26} />
            </span>
            <div>
              <strong>{profile.cv}</strong>
              <small>Cập nhật: 02/05/2026</small>
              <small>Dung lượng: 1.2 MB</small>
            </div>
            <em>Mặc định</em>
          </div>
          <div className="profile-v2-cv-actions">
            <button type="button">
              <Eye size={16} /> Xem CV
            </button>
            <button type="button">
              <DownloadSimple size={16} /> Tải xuống
            </button>
            <button type="button" aria-label="Tùy chọn CV">
              <DotsThreeVertical size={18} />
            </button>
          </div>
        </DashboardCard>
      </section>

      <section className="profile-v2-three-col">
        <DashboardCard
          title="Công ty đang theo dõi"
          action="Xem tất cả"
          onAction={() => goToTab("companies")}
        >
          <div className="profile-v2-company-list">
            {followedCompanies.slice(0, 3).map((company) => (
              <button key={company.name} type="button" onClick={() => goToTab("companies")}>
                <Logo src={company.logo} fallback={company.name.slice(0, 3)} />
                <span>
                  <strong>{company.name}</strong>
                  <small>{company.note}</small>
                </span>
                <em>{company.time}</em>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Nhắc bạn">
          <div className="profile-v2-reminders">
            {reminderList.map((item) => (
              <div key={item.title} className="profile-v2-reminder">
                <span className={`is-${item.tone}`}>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setReminderList((list) => list.filter((r) => r.title !== item.title))
                  }
                >
                  {item.action}
                </button>
              </div>
            ))}
            {reminderList.length === 0 && (
              <p className="profile-v2-reminders-empty">
                Bạn đã xử lý hết các nhắc nhở. Tuyệt vời!
              </p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Thiết lập nhanh">
          <div className="profile-v2-settings">
            {quickSettings.map((item) => (
              <button key={item.label} type="button" onClick={() => goToTab("settings")}>
                <span>
                  <NotePencil size={17} />
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </div>
                {item.status && <em>{item.status}</em>}
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </DashboardCard>
      </section>

      <section className="profile-v2-bottom-cta">
        <span>
          <Sparkles size={22} />
        </span>
        <div>
          <h2>Bạn muốn nổi bật hơn với nhà tuyển dụng?</h2>
          <p>Nâng cấp tài khoản để hiển thị hồ sơ nổi bật và nhận nhiều cơ hội hơn.</p>
        </div>
        <button
          type="button"
          className="profile-v2-btn-primary"
          onClick={() => navigate("/employer")}
        >
          Nâng cấp ngay <ArrowRight size={16} />
        </button>
      </section>
    </>
  );
}
