"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { upnextLogo } from "../../home/brand";
import {
  ArrowRight,
  ArrowUp,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Facebook,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Monitor,
  PaperPlaneTilt,
  Phone,
  ShareNetwork,
  ShieldCheck,
  Star,
  UsersRound,
  WalletCards,
  ChevronRight,
  Youtube,
} from "../../home/marketing-icons";
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

const benefits = [
  "Lương cạnh tranh theo năng lực, review định kỳ và thưởng theo hiệu quả dự án.",
  "Bảo hiểm, nghỉ phép, phụ cấp thiết bị và ngân sách học tập chuyên môn.",
  "Làm việc cùng đội ngũ kỹ thuật có kinh nghiệm, quy trình rõ ràng, tài liệu đầy đủ.",
  "Cơ hội tham gia dự án quốc tế hoặc sản phẩm có lượng người dùng lớn.",
];

const hiringSteps = ["Lọc CV", "Phỏng vấn kỹ thuật", "Trao đổi văn hóa", "Offer"];

const footerLinks = [
  { label: "Tìm việc IT", path: "/jobs" },
  { label: "Công ty công nghệ", path: "/companies" },
  { label: "Tạo hồ sơ", path: "/register" },
  { label: "Báo cáo lương", path: "/jobs" },
  { label: "Đăng tuyển dụng", path: "/register" },
  { label: "Giải pháp tuyển dụng", path: "/register" },
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

  const similarJobs = useMemo(
    () =>
      jobs
        .filter(
          (item) =>
            item.id !== job.id &&
            item.categories.some((category) => job.categories.includes(category)),
        )
        .slice(0, 4),
    [job],
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

        <button type="button" className="job-detail-back" onClick={() => navigate("/jobs")}>
          <ArrowRight size={16} />
          Quay lại danh sách
        </button>

        <section className="job-detail-hero">
          <div className="job-detail-cover" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="job-detail-title">
            <LogoMark job={job} size="large" />
            <div>
              <div className="job-detail-badges">
                {job.featured && (
                  <span>
                    <Star size={14} /> Nổi bật
                  </span>
                )}
                {job.urgent && <span className="is-urgent">Tuyển gấp</span>}
                {job.verified && (
                  <span>
                    <ShieldCheck size={14} /> Công ty đã xác thực
                  </span>
                )}
              </div>
              <h1>{job.title}</h1>
              <p>
                {job.company} · {job.location} · {job.posted}
              </p>
            </div>
          </div>
        </section>

        <section className="job-detail-layout">
          <article className="job-detail-main">
            <section className="job-detail-summary-grid">
              <InfoTile icon={<WalletCards size={20} />} label="Mức lương" value={job.salary} />
              <InfoTile icon={<MapPin size={20} />} label="Địa điểm" value={job.location} />
              <InfoTile icon={<Monitor size={20} />} label="Hình thức" value={job.mode} />
              <InfoTile icon={<BriefcaseBusiness size={20} />} label="Cấp bậc" value={job.level} />
            </section>

            <section className="job-detail-section">
              <h2>Mô tả công việc</h2>
              <p>{job.description}</p>
              <ul>
                {responsibilities.map((item) => (
                  <li key={item}>
                    <CheckCircle size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="job-detail-section">
              <h2>Yêu cầu ứng viên</h2>
              <ul>
                {requirements.map((item) => (
                  <li key={item}>
                    <CheckCircle size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="job-detail-section">
              <h2>Kỹ năng liên quan</h2>
              <div className="job-detail-tags">
                {job.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </section>

            <section className="job-detail-section">
              <h2>Quyền lợi</h2>
              <ul>
                {benefits.map((item) => (
                  <li key={item}>
                    <CheckCircle size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="job-detail-section">
              <h2>Quy trình tuyển dụng</h2>
              <div className="job-detail-steps">
                {hiringSteps.map((step, index) => (
                  <span key={step}>
                    <b>{index + 1}</b>
                    {step}
                  </span>
                ))}
              </div>
            </section>

            <section className="job-detail-company">
              <div>
                <LogoMark job={job} />
                <div>
                  <h2>{job.company}</h2>
                  <p>
                    Công ty công nghệ đang mở nhiều vị trí IT, ưu tiên ứng viên có tư duy sản phẩm,
                    kỹ năng kỹ thuật vững và khả năng phối hợp tốt trong môi trường phát triển
                    nhanh.
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => navigate("/companies")}>
                Xem công ty <ArrowRight size={16} />
              </button>
            </section>
          </article>

          <aside className="job-detail-aside">
            <section className="job-detail-apply-card">
              <div>
                <span>Ứng tuyển vị trí</span>
                <strong>{job.salary}</strong>
              </div>
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
                {saved ? "Đã lưu tin" : "Lưu tin"}
              </button>
              <button type="button">
                <ShareNetwork size={18} />
                Chia sẻ
              </button>
            </section>

            <section className="job-detail-company-card">
              <h2>Thông tin nhanh</h2>
              <InfoLine icon={<Clock size={17} />} label="Đăng tuyển" value={job.posted} />
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

            <section className="job-detail-similar">
              <h2>Việc làm tương tự</h2>
              {similarJobs.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate(`/jobs/${item.id}`)}>
                  <LogoMark job={item} />
                  <span>
                    <b>{item.title}</b>
                    <small>{item.company}</small>
                    <em>{item.salary}</em>
                  </span>
                </button>
              ))}
            </section>
          </aside>
        </section>
      </section>

      <footer className="jobs-footer" aria-label="Footer UpNext">
        <section className="jobs-footer-cta">
          <span>
            <BriefcaseBusiness size={30} />
          </span>
          <div>
            <h2>Muốn theo dõi thêm việc phù hợp?</h2>
            <p>Tạo hồ sơ miễn phí để lưu tin, ứng tuyển nhanh và nhận thông báo.</p>
          </div>
          <button type="button" onClick={() => navigate("/register")}>
            Tạo hồ sơ miễn phí <ArrowRight size={18} />
          </button>
        </section>

        <section className="jobs-footer-main">
          <div className="jobs-footer-brand">
            <Image src={upnextLogo.wordmark} alt="UpNext" width={154} height={37} />
            <p>
              UpNext kết nối ứng viên IT với công ty công nghệ uy tín, tập trung vào thông tin rõ
              ràng và trải nghiệm tìm việc thực tế.
            </p>
            <div>
              <a href="https://www.linkedin.com/" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="https://www.facebook.com/" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="https://github.com/" aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="https://www.youtube.com/" aria-label="YouTube">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          <nav className="jobs-footer-links" aria-label="Liên kết nhanh">
            {footerLinks.map((link) => (
              <button key={link.label} type="button" onClick={() => navigate(link.path)}>
                {link.label}
              </button>
            ))}
          </nav>

          <div className="jobs-footer-contact">
            <h2>Liên hệ</h2>
            <p>
              <Mail size={17} />
              contact@upnext.works
            </p>
            <p>
              <Phone size={17} />
              028 7303 2468
            </p>
            <p>
              <Globe size={17} />
              TP. Hồ Chí Minh, Việt Nam
            </p>
          </div>
        </section>

        <section className="jobs-footer-bottom">
          <p>© 2026 UpNext. Tất cả quyền được bảo lưu.</p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <ArrowUp size={17} />
            Lên đầu trang
          </button>
        </section>
      </footer>
    </main>
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
