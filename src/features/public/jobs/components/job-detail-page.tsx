"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Eye,
  MapPin,
  Monitor,
  PaperPlaneTilt,
  Plus,
  Search,
  ShareNetwork,
  ShieldCheck,
  Star,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
} from "../../home/marketing-icons";
import { PublicFooter } from "../../shared/public-footer";
import { PublicHeader } from "../../shared/public-header";
import { jobs, type Job } from "./jobs-page";

import "../jobs-page.css";

type PublicJobDetailPageProps = {
  path: string;
  navigate: (path: string) => void;
};

const responsibilities = [
  "Tham gia phát triển, bảo trì và tối ưu các ứng dụng Web/Mobile theo roadmap sản phẩm.",
  "Viết code sạch, có khả năng mở rộng và tuân thủ coding convention của dự án.",
  "Phối hợp với Product, Design, QA và Backend để hoàn thiện tính năng từ discovery đến release.",
  "Tham gia review code, viết unit test và xử lý lỗi phát sinh trong quá trình vận hành.",
  "Đề xuất cải tiến kỹ thuật để nâng chất lượng sản phẩm và hiệu suất hệ thống.",
];

const requirements = [
  "Nắm vững nền tảng lập trình, cấu trúc dữ liệu, OOP và quy trình phát triển phần mềm.",
  "Có kinh nghiệm thực tế với các công nghệ liên quan trong phần kỹ năng của tin tuyển dụng.",
  "Biết đọc hiểu tài liệu tiếng Anh chuyên ngành và chủ động trao đổi khi yêu cầu chưa rõ.",
  "Có tư duy sản phẩm, trách nhiệm với chất lượng đầu ra và khả năng làm việc nhóm tốt.",
  "Ưu tiên ứng viên từng làm việc với hệ thống có người dùng thật hoặc quy mô enterprise.",
];

const benefitParagraphs = [
  "FPT Software xây dựng gói đãi ngộ theo năng lực, hiệu quả công việc và mức độ đóng góp trong dự án. Ứng viên được trao đổi rõ về lương, thưởng, phúc lợi và mô hình làm việc trong quá trình phỏng vấn.",
];

const benefitItems = [
  "Thu nhập cạnh tranh, xét tăng lương định kỳ và thưởng hiệu quả theo chính sách công ty.",
  "Mô hình làm việc linh hoạt theo tính chất dự án: tại văn phòng, hybrid hoặc remote theo thỏa thuận.",
  "Bảo hiểm sức khỏe, chương trình chăm sóc đời sống nhân viên và các hoạt động nội bộ.",
  "Ngân sách đào tạo, chứng chỉ chuyên môn và cơ hội tham gia dự án quốc tế.",
  "Lộ trình phát triển nghề nghiệp rõ ràng, có mentor và cơ hội thăng tiến theo năng lực.",
];

const hiringSteps = [
  { title: "Ứng tuyển", desc: "Gửi CV ứng tuyển qua UpNext" },
  { title: "Sàng lọc hồ sơ", desc: "Nhà tuyển dụng xem xét và phản hồi" },
  { title: "Phỏng vấn", desc: "1-2 vòng chuyên môn & văn hóa" },
  { title: "Offer & Onboard", desc: "Nhận offer và hoàn tất thủ tục" },
];

const companyStats = [
  { value: "256", label: "Việc làm" },
  { value: "30.000+", label: "Nhân sự" },
  { value: "27+", label: "Quốc gia" },
];

function getJobId(path: string) {
  return decodeURIComponent(path.split("/").filter(Boolean)[1] ?? "");
}

function LogoMark({ job, size = "normal" }: { job: Job; size?: "normal" | "large" }) {
  const [failed, setFailed] = useState(false);
  const className = `jobs-logo-mark${size === "large" ? " is-large" : ""}`;

  if (!job.logo || failed) {
    return (
      <span className={`${className} jobs-logo-fallback`} style={{ color: job.logoColor }}>
        {job.company.charAt(0)}
      </span>
    );
  }

  return (
    <span className={className}>
      <Image
        src={job.logo}
        alt={`Logo ${job.company}`}
        width={size === "large" ? 72 : 48}
        height={size === "large" ? 72 : 48}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function PublicJobDetailPage({ path, navigate }: PublicJobDetailPageProps) {
  const jobId = getJobId(path);
  const fallbackJob = jobs[0];
  if (!fallbackJob) {
    throw new Error("No jobs available for job detail page.");
  }
  const job = jobs.find((item) => item.id === jobId) ?? fallbackJob;
  const [saved, setSaved] = useState(false);
  const [showAllSimilarJobs, setShowAllSimilarJobs] = useState(false);

  const similarJobs = useMemo(
    () =>
      jobs.filter(
        (item) =>
          item.id !== job.id &&
          item.categories.some((category) => job.categories.includes(category)),
      ),
    [job],
  );
  const visibleSimilarJobs = showAllSimilarJobs ? similarJobs : similarJobs.slice(0, 4);
  const hiddenSimilarJobCount = similarJobs.length - visibleSimilarJobs.length;
  const skillTags = useMemo(
    () =>
      Array.from(
        new Set([
          ...job.tags,
          "Next.js",
          "TypeScript",
          "JavaScript",
          "HTML5",
          "CSS3",
          "React Query",
          "Tailwind CSS",
          "Git",
          "RESTful API",
          "Docker",
          "CI/CD",
          "Microservices",
        ]),
      ),
    [job.tags],
  );

  return (
    <main className="jobs-page job-detail-page">
      <PublicHeader navigate={navigate} />

      <section className="job-detail-shell">
        <nav className="job-detail-breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={() => navigate("/")}>
            Trang chủ
          </button>
          <ChevronRight size={14} />
          <button type="button" onClick={() => navigate("/jobs")}>
            Việc làm IT
          </button>
          <ChevronRight size={14} />
          <span>{job.title}</span>
        </nav>

        <section className="job-detail-layout">
          <article className="job-detail-main">
            <section className="job-detail-card job-detail-hero-card">
              <div className="job-detail-company-row">
                <LogoMark job={job} size="large" />
                <div>
                  <button
                    type="button"
                    className="job-detail-company-name"
                    onClick={() => navigate("/companies/fpt-software")}
                  >
                    {job.company}
                  </button>
                  <p>{job.categories.join(" • ")}</p>
                </div>
                {job.verified && (
                  <span className="job-detail-verified">
                    <ShieldCheck size={15} weight="fill" /> Đã xác thực
                  </span>
                )}
              </div>

              <div className="job-detail-title-row">
                <h1>{job.title}</h1>
                {(job.featured || job.urgent) && (
                  <span className={job.urgent ? "is-urgent" : ""}>
                    <Star size={14} weight="fill" />
                    {job.urgent ? "Tuyển gấp" : "Hot"}
                  </span>
                )}
              </div>

              <p className="job-detail-lead">{job.description}</p>

              <div className="job-detail-salary-row">
                <Coins size={24} weight="fill" />
                <strong>{job.salary}</strong>
                <i aria-hidden="true" />
                <span>Thỏa thuận theo năng lực</span>
              </div>

              <div className="job-detail-meta-grid">
                <InfoTile icon={<MapPin size={20} />} label="Địa điểm" value={job.location} />
                <InfoTile icon={<Monitor size={20} />} label="Hình thức" value={job.mode} />
                <InfoTile
                  icon={<BriefcaseBusiness size={20} />}
                  label="Cấp bậc"
                  value={job.level}
                />
                <InfoTile icon={<Clock size={20} />} label="Đăng tuyển" value={job.posted} />
              </div>

              <div className="job-detail-tags" aria-label="Kỹ năng liên quan">
                {job.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="job-detail-action-row">
                <button type="button" onClick={() => navigate(`/register?job=${job.id}`)}>
                  <PaperPlaneTilt size={18} />
                  Ứng tuyển ngay
                </button>
                <button
                  type="button"
                  className={saved ? "is-saved" : ""}
                  onClick={() => setSaved((current) => !current)}
                >
                  <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
                  {saved ? "Đã lưu" : "Lưu tin"}
                </button>
                <button type="button">
                  <ShareNetwork size={18} />
                  Chia sẻ
                </button>
              </div>
            </section>

            <section className="job-detail-card job-detail-description-card">
              <JobContentBlock title="Mô tả công việc">
                <p>{job.description}</p>
                <BulletList items={responsibilities} />
              </JobContentBlock>

              <JobContentBlock title="Yêu cầu ứng viên">
                <BulletList items={requirements} />
              </JobContentBlock>

              <JobContentBlock title="Quyền lợi">
                {benefitParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <BulletList items={benefitItems} />
              </JobContentBlock>
            </section>

            <DetailSection icon={<TrendingUp size={18} />} title="Quy trình tuyển dụng">
              <div className="job-detail-process">
                {hiringSteps.map((step, index) => (
                  <span key={step.title}>
                    <b>{index + 1}</b>
                    <strong>{step.title}</strong>
                    <small>{step.desc}</small>
                  </span>
                ))}
              </div>
            </DetailSection>

            <DetailSection icon={<BriefcaseBusiness size={18} />} title="Kỹ năng & công nghệ">
              <JobSkillCloud tags={skillTags} />
            </DetailSection>

            <section className="job-detail-card job-detail-similar-section">
              <div className="job-detail-card-head">
                <span>
                  <BriefcaseBusiness size={18} />
                </span>
                <h2>Việc làm tương tự</h2>
              </div>
              <div className="job-detail-similar-list">
                {visibleSimilarJobs.map((item) => (
                  <button key={item.id} type="button" onClick={() => navigate(`/jobs/${item.id}`)}>
                    <LogoMark job={item} />
                    <span>
                      <b>{item.title}</b>
                      <small>{item.company}</small>
                    </span>
                    <em>{item.salary}</em>
                  </button>
                ))}
              </div>
              {similarJobs.length > 4 && (
                <div className="job-detail-similar-actions">
                  <button
                    type="button"
                    className="job-detail-similar-more"
                    onClick={() => setShowAllSimilarJobs((current) => !current)}
                  >
                    {showAllSimilarJobs
                      ? "Thu gọn"
                      : `Xem thêm ${hiddenSimilarJobCount} việc tương tự`}
                    <ChevronDown size={15} />
                  </button>
                </div>
              )}
            </section>
          </article>

          <aside className="job-detail-aside">
            <section className="job-detail-card job-detail-ready-card">
              <h2>Sẵn sàng ứng tuyển?</h2>
              <p>Gia tăng cơ hội với hồ sơ nổi bật</p>
              <button type="button" onClick={() => navigate(`/register?job=${job.id}`)}>
                <PaperPlaneTilt size={18} />
                Ứng tuyển ngay
              </button>
              <button type="button">
                <Coins size={18} />
                Xem lương phù hợp
              </button>
              <button
                type="button"
                className={saved ? "is-saved" : ""}
                onClick={() => setSaved((current) => !current)}
              >
                <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
                {saved ? "Đã lưu tin" : "So sánh CV với JD"}
              </button>
              <div className="job-detail-deadline">
                Hạn nộp hồ sơ: <b>15/06/2025</b> <span>(còn 13 ngày)</span>
              </div>
              <div className="job-detail-verified-box">
                <ShieldCheck size={20} weight="fill" />
                <span>
                  <b>Tin tuyển dụng đã xác thực</b>
                  <small>Thông tin được kiểm duyệt bởi UpNext</small>
                </span>
              </div>
            </section>

            <section className="job-detail-card job-detail-overview-card">
              <h2>Tổng quan công việc</h2>
              <InfoLine icon={<WalletCards size={17} />} label="Mức lương" value={job.salary} />
              <InfoLine icon={<MapPin size={17} />} label="Địa điểm" value={job.location} />
              <InfoLine icon={<Monitor size={17} />} label="Hình thức" value={job.mode} />
              <InfoLine
                icon={<UsersRound size={17} />}
                label="Ứng viên"
                value={`${job.applicants} lượt`}
              />
              <InfoLine icon={<Calendar size={17} />} label="Trạng thái" value="Đang nhận hồ sơ" />
              <InfoLine
                icon={<Eye size={17} />}
                label="Ưu tiên"
                value={job.featured ? "Tin nổi bật" : "Tin thường"}
              />
            </section>

            <section className="job-detail-card job-detail-company-mini">
              <LogoMark job={job} />
              <div>
                <h2>{job.company}</h2>
                <p>Công nghệ thông tin & Dịch vụ phần mềm</p>
                <em>Top công ty</em>
              </div>
              <button type="button" className="job-detail-company-follow">
                <Plus size={16} /> Theo dõi công ty
              </button>
              <div className="job-detail-company-mini-stats">
                {companyStats.map((stat) => (
                  <span key={stat.label}>
                    <b>{stat.value}</b>
                    <small>{stat.label}</small>
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="job-detail-company-link"
                onClick={() => navigate("/companies/fpt-software")}
              >
                Xem trang công ty <ArrowRight size={15} />
              </button>
            </section>

            <section className="job-detail-card job-detail-share-card">
              <h2>Chia sẻ công việc</h2>
              <p>Giới thiệu công việc hấp dẫn này đến bạn bè của bạn.</p>
              <div>
                <button type="button" aria-label="Sao chép liên kết">
                  <ShareNetwork size={17} />
                </button>
                <button type="button" aria-label="Chia sẻ qua Facebook">
                  f
                </button>
                <button type="button" aria-label="Chia sẻ qua LinkedIn">
                  in
                </button>
                <button type="button" aria-label="Chia sẻ qua Zalo">
                  Zalo
                </button>
                <button type="button" aria-label="Chia sẻ qua email">
                  @
                </button>
              </div>
            </section>
          </aside>
        </section>
      </section>

      <PublicFooter navigate={navigate} />
    </main>
  );
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="job-detail-card job-detail-section">
      <div className="job-detail-card-head">
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function JobContentBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="job-detail-content-block">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="job-detail-bullet-list">
      {items.map((item) => (
        <li key={item}>
          <span aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function JobSkillCloud({ tags }: { tags: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visibleTags = tags.slice(0, 10);
  const hiddenCount = tags.length - visibleTags.length;
  const filteredTags = tags.filter((tag) => tag.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="job-detail-skill-block">
      <div className="job-detail-skill-cloud" aria-label="Kỹ năng và công nghệ nổi bật">
        {visibleTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
        {hiddenCount > 0 && (
          <button type="button" className="job-detail-skill-more" onClick={() => setOpen(true)}>
            +{hiddenCount} kỹ năng
          </button>
        )}
      </div>
      <p className="job-detail-skill-note">
        Các công nghệ thường gặp trong dự án và vị trí tuyển dụng này.
      </p>

      {open && (
        <dialog
          open
          className="job-detail-skill-dialog"
          aria-labelledby="job-detail-skill-dialog-title"
        >
          <button
            type="button"
            className="job-detail-skill-backdrop"
            aria-label="Đóng danh sách kỹ năng"
            onClick={() => setOpen(false)}
          />
          <div className="job-detail-skill-panel">
            <div className="job-detail-skill-dialog-head">
              <div>
                <h3 id="job-detail-skill-dialog-title">Kỹ năng & công nghệ</h3>
                <p>{tags.length} kỹ năng liên quan đến vị trí này</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <label className="job-detail-skill-search">
              <Search size={18} />
              <input
                aria-label="Tìm kỹ năng"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kỹ năng"
              />
            </label>

            <div className="job-detail-skill-dialog-grid">
              {filteredTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
              {filteredTags.length === 0 && (
                <p className="job-detail-skill-empty">Không tìm thấy kỹ năng phù hợp.</p>
              )}
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="job-detail-info-tile">
      {icon}
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}

function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <p className="job-detail-info-line">
      {icon}
      <span>{label}</span>
      <b>{value}</b>
    </p>
  );
}
