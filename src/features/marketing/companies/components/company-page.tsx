"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";

import { upnextLogo } from "../../home/brand";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Coins,
  Facebook,
  Github,
  Globe,
  GraduationCap,
  Heart,
  IdentificationCard,
  Linkedin,
  MapPin,
  MapTrifold,
  Medal,
  PaperPlaneTilt,
  Plus,
  Scales,
  Sparkles,
  Star,
  TrendingUp,
  UsersRound,
  Youtube,
} from "../../home/marketing-icons";
import { jobs } from "../../jobs/components/jobs-page";
import { PublicHeader } from "../../shared/public-header";

import "../company-page.css";

type PublicCompanyPageProps = {
  navigate: (path: string) => void;
};

const company = {
  name: "FPT Software",
  tagline: "Kiến tạo giải pháp công nghệ – Tăng tốc chuyển đổi số toàn cầu",
  logo: "/assets/marketing/home/companies/fpt.png",
  logoColor: "#2563eb",
  cover: "/assets/marketing/home/covers/fpt.jpg",
  industry: "Công nghệ thông tin & Dịch vụ phần mềm",
  type: "Công ty cổ phần",
  website: "https://fptsoftware.com",
  websiteLabel: "fptsoftware.com",
  email: "recruitment@fpt.com",
  phone: "(024) 7300 7300",
  legalName: "Công ty Cổ phần FPT",
  taxCode: "0101778163",
  founded: "13/01/1999",
  size: "10.000+ nhân viên",
  offices: "8 văn phòng tại 5 quốc gia",
};

const stats = [
  { icon: <Briefcase size={20} />, value: "128", label: "Việc làm đang tuyển" },
  { icon: <UsersRound size={20} />, value: "10.000+", label: "Nhân viên" },
  { icon: <MapPin size={20} />, value: "8", label: "Văn phòng (5 quốc gia)" },
  { icon: <Calendar size={20} />, value: "1999", label: "Năm thành lập" },
  { icon: <TrendingUp size={20} />, value: "97%", label: "Tỷ lệ phản hồi" },
];

const reasons = [
  {
    icon: <Globe size={22} />,
    title: "Cơ hội phát triển toàn cầu",
    desc: "Làm việc với khách hàng quốc tế, dự án đa dạng.",
  },
  {
    icon: <GraduationCap size={22} />,
    title: "Học tập không giới hạn",
    desc: "Ngân sách đào tạo lên đến 10+ ngày/năm.",
  },
  {
    icon: <Coins size={22} />,
    title: "Thu nhập cạnh tranh",
    desc: "Phúc lợi hấp dẫn, thưởng hiệu quả & dự án.",
  },
  {
    icon: <Sparkles size={22} />,
    title: "Môi trường mở",
    desc: "Văn hóa tôn trọng, sáng tạo và đề cao con người.",
  },
  {
    icon: <Scales size={22} />,
    title: "Cân bằng cuộc sống",
    desc: "Linh hoạt thời gian, chăm sóc sức khỏe toàn diện.",
  },
];

const cultureImages = [
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
];

const techStack = [
  "Java",
  ".NET",
  "Python",
  "C#",
  "C++",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Angular",
  "AWS",
  "Azure",
  "Salesforce",
  "DevOps",
  "Mobile (iOS/Android)",
  "AI/ML",
  "Data Engineering",
  "Cloud",
  "RPA",
  "UI/UX Design",
];

const officeLocations = ["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh", "Cần Thơ", "Quy Nhơn"];

const fields = ["Phần mềm", "Chuyển đổi số", "Cloud", "AI/ML", "Tư vấn công nghệ"];

const socials = [
  { icon: <Linkedin size={18} />, href: "https://www.linkedin.com/" },
  { icon: <Facebook size={18} />, href: "https://www.facebook.com/" },
  { icon: <Youtube size={18} />, href: "https://www.youtube.com/" },
  { icon: <Github size={18} />, href: "https://github.com/" },
  { icon: <Globe size={18} />, href: "https://fptsoftware.com" },
];

const footerColumns = [
  {
    title: "Liên kết nhanh",
    links: [
      { label: "Tìm việc IT", path: "/jobs" },
      { label: "Công ty công nghệ", path: "/companies" },
      { label: "Top hồ sơ", path: "/register" },
      { label: "Tính năng", path: "/" },
      { label: "Bảng giá", path: "/register" },
      { label: "Blog", path: "/jobs" },
    ],
  },
  {
    title: "Nhà tuyển dụng",
    links: [
      { label: "Đăng tin tuyển dụng", path: "/register" },
      { label: "Tìm hồ sơ", path: "/register" },
      { label: "Giải pháp tuyển dụng", path: "/register" },
      { label: "Bảng giá", path: "/register" },
      { label: "Liên hệ", path: "/register" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp", path: "/jobs" },
      { label: "Hướng dẫn sử dụng", path: "/jobs" },
      { label: "Chính sách bảo mật", path: "/jobs" },
      { label: "Điều khoản sử dụng", path: "/jobs" },
    ],
  },
];

function CompanyLogo({ size = "normal" }: { size?: "normal" | "large" }) {
  const [failed, setFailed] = useState(false);
  const cls = `company-logo${size === "large" ? " is-large" : ""}`;
  if (!company.logo || failed) {
    return (
      <span className={`${cls} is-fallback`} style={{ color: company.logoColor }}>
        {company.name.charAt(0)}
      </span>
    );
  }
  return (
    <span className={cls}>
      <Image
        src={company.logo}
        alt={`Logo ${company.name}`}
        width={size === "large" ? 72 : 48}
        height={size === "large" ? 72 : 48}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function PublicCompanyPage({ navigate }: PublicCompanyPageProps) {
  const [following, setFollowing] = useState(false);
  const openJobs = jobs.slice(0, 4);

  return (
    <main className="company-page">
      <PublicHeader navigate={navigate} />

      <div className="company-shell">
        <nav className="company-breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={() => navigate("/")}>
            Trang chủ
          </button>
          <ChevronRight size={14} />
          <button type="button" onClick={() => navigate("/companies")}>
            Công ty
          </button>
          <ChevronRight size={14} />
          <span>{company.name}</span>
        </nav>

        <section className="company-banner">
          <div className="company-banner-cover">
            <Image src={company.cover} alt="" width={1200} height={420} priority />
            <span className="company-banner-scrim" aria-hidden="true" />
          </div>

          <div className="company-banner-body">
            <CompanyLogo size="large" />

            <div className="company-banner-info">
              <h1>
                {company.name}
                <BadgeCheck size={26} weight="fill" className="company-verified" />
              </h1>
              <p className="company-tagline">{company.tagline}</p>
              <div className="company-banner-meta">
                <span>
                  <Building2 size={16} /> {company.industry}
                </span>
                <span>
                  <IdentificationCard size={16} /> {company.type}
                </span>
              </div>
              <div className="company-banner-actions">
                <button
                  type="button"
                  className={`company-follow${following ? " is-following" : ""}`}
                  onClick={() => setFollowing((value) => !value)}
                >
                  {following ? <Heart size={18} weight="fill" /> : <Plus size={18} />}
                  {following ? "Đang theo dõi" : "Theo dõi công ty"}
                </button>
                <a
                  className="company-website"
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Xem website <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            <aside className="company-banner-badge">
              <span className="company-banner-badge-icon">
                <Medal size={22} weight="fill" />
              </span>
              <div>
                <strong>Nhà tuyển dụng được yêu thích</strong>
                <small>Top 5% công ty được theo dõi nhiều trên UpNext</small>
              </div>
            </aside>
          </div>
        </section>

        <section className="company-stats" aria-label="Số liệu công ty">
          {stats.map((stat) => (
            <div className="company-stat" key={stat.label}>
              <span className="company-stat-icon">{stat.icon}</span>
              <div>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </div>
            </div>
          ))}
        </section>

        <div className="company-layout">
          <div className="company-main">
            <Card title="Giới thiệu công ty">
              <p className="company-intro">
                FPT Software là công ty công nghệ hàng đầu thuộc Tập đoàn FPT, cung cấp các dịch vụ,
                giải pháp và sản phẩm công nghệ cho hơn 1.100 khách hàng tại 30 quốc gia. Chúng tôi
                đồng hành cùng các doanh nghiệp toàn cầu trong hành trình chuyển đổi số với năng lực
                vượt trội về kỹ thuật, tư duy đổi mới và cam kết chất lượng.
              </p>
              <p className="company-intro">
                Đội ngũ hơn 30.000 kỹ sư làm việc tại 5 quốc gia, tập trung vào các lĩnh vực chuyển
                đổi số, Cloud, AI/Machine Learning và phát triển phần mềm cho khách hàng doanh
                nghiệp toàn cầu. Tại đây, mỗi kỹ sư đều có lộ trình phát triển rõ ràng cùng cơ hội
                tham gia các dự án quy mô quốc tế.
              </p>
            </Card>

            <Card title="Vì sao nên làm việc tại đây">
              <div className="company-reasons">
                {reasons.map((reason) => (
                  <div className="company-reason" key={reason.title}>
                    <span>{reason.icon}</span>
                    <strong>{reason.title}</strong>
                    <small>{reason.desc}</small>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Văn hóa & môi trường làm việc"
              subtitle="Chúng tôi xây dựng môi trường làm việc cởi mở, minh bạch, nơi mỗi người được trao quyền để sáng tạo, dám nghĩ lớn và tạo ra giá trị khác biệt."
            >
              <div className="company-gallery">
                {cultureImages.map((src, index) => (
                  <span key={index} className="company-gallery-item">
                    <Image
                      src={src}
                      alt={`Môi trường làm việc ${index + 1}`}
                      width={480}
                      height={320}
                    />
                  </span>
                ))}
              </div>
            </Card>

            <Card title="Công nghệ & kỹ năng nổi bật">
              <div className="company-tags">
                {techStack.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
            </Card>

            <Card
              title="Văn phòng / địa điểm làm việc"
              action={
                <button type="button" className="company-map-btn">
                  <MapTrifold size={16} /> Xem bản đồ
                </button>
              }
            >
              <div className="company-offices">
                {officeLocations.map((place) => (
                  <span key={place}>
                    <MapPin size={15} /> {place}
                  </span>
                ))}
                <span className="company-offices-more">+ 3 địa điểm khác</span>
              </div>
            </Card>

            <Card
              title="Việc làm đang tuyển"
              action={
                <button
                  type="button"
                  className="company-link company-link-inline"
                  onClick={() => navigate("/jobs")}
                >
                  Xem tất cả (128) <ArrowRight size={15} />
                </button>
              }
            >
              <div className="company-jobs">
                {openJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    className="company-job"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="company-job-head">
                      {job.featured && (
                        <span className="company-job-badge">
                          <Star size={12} weight="fill" /> Hot
                        </span>
                      )}
                      <h3>{job.title}</h3>
                    </div>
                    <span className="company-job-salary">
                      <Coins size={15} /> {job.salary}
                    </span>
                    <span className="company-job-loc">
                      <MapPin size={15} /> {job.location}
                    </span>
                    <div className="company-job-tags">
                      {job.tags.slice(0, 3).map((tag) => (
                        <i key={tag}>{tag}</i>
                      ))}
                    </div>
                    <small className="company-job-time">{job.posted}</small>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <aside className="company-aside">
            <Card title="Thông tin nhanh" compact>
              <dl className="company-info">
                <InfoRow label="Tên công ty" value={company.legalName} />
                <InfoRow label="Mã số thuế" value={company.taxCode} />
                <InfoRow label="Thành lập" value={company.founded} />
                <InfoRow
                  label="Website"
                  value={
                    <a href={company.website} target="_blank" rel="noreferrer">
                      {company.websiteLabel} <ArrowUpRight size={13} />
                    </a>
                  }
                />
                <InfoRow
                  label="Email"
                  value={<a href={`mailto:${company.email}`}>{company.email}</a>}
                />
                <InfoRow label="Điện thoại" value={company.phone} />
                <InfoRow label="Quy mô" value={company.size} />
              </dl>
            </Card>

            <Card title="Quy mô & ngành nghề" compact>
              <div className="company-field">
                <small>Ngành nghề chính</small>
                <strong>{company.industry}</strong>
              </div>
              <div className="company-field">
                <small>Lĩnh vực hoạt động</small>
                <div className="company-chips">
                  {fields.map((field) => (
                    <span key={field}>{field}</span>
                  ))}
                </div>
              </div>
              <div className="company-field">
                <small>Quy mô công ty</small>
                <strong>{company.size}</strong>
              </div>
              <div className="company-field">
                <small>Văn phòng</small>
                <strong>{company.offices}</strong>
              </div>
            </Card>

            <Card title="Kết nối với chúng tôi" compact>
              <div className="company-socials">
                {socials.map((social, index) => (
                  <a key={index} href={social.href} target="_blank" rel="noreferrer">
                    {social.icon}
                  </a>
                ))}
              </div>
            </Card>

            <section className="company-cta-card">
              <span className="company-cta-art" aria-hidden="true">
                <PaperPlaneTilt size={26} />
              </span>
              <h3>Không bỏ lỡ cơ hội từ {company.name}</h3>
              <p>Theo dõi công ty để nhận thông báo về việc làm mới nhất và tin tức tuyển dụng.</p>
              <button
                type="button"
                className={`company-follow${following ? " is-following" : ""}`}
                onClick={() => setFollowing((value) => !value)}
              >
                {following ? <Heart size={18} weight="fill" /> : <Plus size={18} />}
                {following ? "Đang theo dõi" : "Theo dõi công ty"}
              </button>
              <span className="company-followers">12.3K người đã theo dõi</span>
            </section>
          </aside>
        </div>
      </div>

      <section className="company-banner-strip">
        <div className="company-strip-inner">
          <span className="company-strip-icon">
            <PaperPlaneTilt size={26} />
          </span>
          <div>
            <strong>Ứng tuyển nhanh hơn với hồ sơ UpNext</strong>
            <p>Tạo hồ sơ một lần · Ứng tuyển dễ dàng · Nổi bật với nhà tuyển dụng</p>
          </div>
          <div className="company-strip-actions">
            <button
              type="button"
              className="company-strip-primary"
              onClick={() => navigate("/register")}
            >
              Tạo hồ sơ miễn phí
            </button>
            <button
              type="button"
              className="company-strip-ghost"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </section>

      <footer className="company-footer">
        <div className="company-footer-main">
          <div className="company-footer-brand">
            <Image src={upnextLogo.wordmark} alt="UpNext" width={140} height={33} />
            <p>
              Nền tảng tuyển dụng IT kết nối ứng viên tài năng với các công ty công nghệ hàng đầu.
              Cơ hội phù hợp, sự nghiệp bứt phá.
            </p>
            <div className="company-footer-social">
              {socials.slice(0, 4).map((social, index) => (
                <a key={index} href={social.href} target="_blank" rel="noreferrer">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h4>{column.title}</h4>
              {column.links.map((link) => (
                <button key={link.label} type="button" onClick={() => navigate(link.path)}>
                  {link.label}
                </button>
              ))}
            </nav>
          ))}

          <div className="company-footer-news">
            <h4>Nhận thông tin việc làm IT mới nhất</h4>
            <p>Đăng ký nhận email để không bỏ lỡ cơ hội việc làm phù hợp với bạn.</p>
            <form className="company-news-form" onSubmit={(event) => event.preventDefault()}>
              <input type="email" placeholder="Nhập email của bạn" aria-label="Email" />
              <button type="submit">Đăng ký</button>
            </form>
          </div>
        </div>

        <div className="company-footer-bottom">
          <p>© 2026 UpNext. Tất cả quyền được bảo lưu.</p>
          <div>
            <button type="button">Tiếng Việt</button>
            <button type="button">English</button>
            <button type="button">Điều khoản</button>
            <button type="button">Bảo mật</button>
          </div>
        </div>
      </footer>

      <button
        type="button"
        className="company-top"
        aria-label="Lên đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp size={18} />
      </button>
    </main>
  );
}

function Card({
  title,
  subtitle,
  action,
  compact,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`company-card${compact ? " is-compact" : ""}`}>
      <div className="company-card-head">
        <h2>{title}</h2>
        {action}
      </div>
      {subtitle && <p className="company-card-sub">{subtitle}</p>}
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="company-info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
