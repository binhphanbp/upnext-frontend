"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { Breadcrumb } from "@/shared/ui/breadcrumb";

import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Coins,
  Facebook,
  Github,
  Linkedin,
  MapPin,
  MapTrifold,
  Medal,
  PaperPlaneTilt,
  Plus,
  Star,
  TrendingUp,
  UsersRound,
  X,
  Youtube,
} from "../../home/marketing-icons";
import { PublicFooter } from "../../shared/public-footer";
import { PublicHeader } from "../../shared/public-header";
import { CompanyGalleryDialog } from "./company-gallery-dialog";

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
  websiteLabel: "https://fptsoftware.com",
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

const cultureImages = [
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
  "/assets/marketing/home/covers/fpt.jpg",
  "/assets/marketing/home/covers/vnpay.jpg",
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

const openJobs = [
  {
    id: "senior-backend-java",
    title: "Senior Backend Developer (Java)",
    salary: "20 - 40 triệu",
    location: "Hà Nội",
    tags: ["Java", "Spring Boot", "AWS"],
    posted: "1 giờ trước",
    hot: true,
  },
  {
    id: "frontend-react",
    title: "Frontend Developer (React)",
    salary: "18 - 32 triệu",
    location: "TP. Hồ Chí Minh",
    tags: ["React", "TypeScript", "Tailwind"],
    posted: "2 giờ trước",
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    salary: "25 - 45 triệu",
    location: "Hà Nội",
    tags: ["AWS", "Docker", "Kubernetes"],
    posted: "3 giờ trước",
  },
  {
    id: "ai-engineer-nlp",
    title: "AI Engineer (NLP)",
    salary: "30 - 50 triệu",
    location: "Đà Nẵng",
    tags: ["Python", "PyTorch", "NLP"],
    posted: "5 giờ trước",
  },
];

const socials = [
  { icon: <Linkedin size={18} />, href: "https://www.linkedin.com/", label: "LinkedIn" },
  { icon: <Facebook size={18} />, href: "https://www.facebook.com/", label: "Facebook" },
  { icon: <Youtube size={18} />, href: "https://www.youtube.com/", label: "YouTube" },
  { icon: <Github size={18} />, href: "https://github.com/", label: "GitHub" },
];

const companyIntroParagraphs = [
  "FPT Software là công ty công nghệ hàng đầu thuộc Tập đoàn FPT, cung cấp các dịch vụ, giải pháp và sản phẩm công nghệ cho hơn 1.100 khách hàng tại 30 quốc gia. Chúng tôi đồng hành cùng các doanh nghiệp toàn cầu trong hành trình chuyển đổi số với năng lực vượt trội về kỹ thuật, tư duy đổi mới và cam kết chất lượng.",
  "Đội ngũ của FPT Software tập trung vào các lĩnh vực như cloud, AI, data engineering, automotive, low-code, enterprise platforms và các giải pháp vận hành số quy mô lớn. Môi trường làm việc khuyến khích mỗi cá nhân học hỏi liên tục, chủ động giải quyết vấn đề và tạo ra tác động thực tế cho khách hàng.",
  "Công ty xây dựng văn hóa cởi mở, minh bạch và tôn trọng sự khác biệt. Nhân viên được hỗ trợ phát triển qua chương trình đào tạo nội bộ, cơ hội tham gia dự án quốc tế, lộ trình nghề nghiệp rõ ràng và hệ sinh thái chuyên gia công nghệ rộng khắp.",
  "Với định hướng phát triển bền vững, FPT Software tiếp tục mở rộng quy mô tại Việt Nam và nhiều thị trường quốc tế, đồng thời đầu tư mạnh vào năng lực tư vấn, nghiên cứu công nghệ mới và các chương trình nâng cao trải nghiệm nhân viên.",
];

function CompanyLogo({ size = "normal" }: { size?: "normal" | "large" }) {
  const [failed, setFailed] = useState(false);
  const cls = `company-logo${size === "large" ? " is-large" : ""}`;

  if (!company.logo || failed) {
    return (
      <span className={`${cls} is-fallback`} style={{ color: company.logoColor }}>
        FPT
      </span>
    );
  }

  return (
    <span className={cls}>
      <Image
        src={company.logo}
        alt={`Logo ${company.name}`}
        width={size === "large" ? 96 : 48}
        height={size === "large" ? 96 : 48}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function PublicCompanyPage({ navigate }: PublicCompanyPageProps) {
  const [following, setFollowing] = useState(false);
  const [activeCultureImage, setActiveCultureImage] = useState<number | null>(null);
  const visibleCultureImages = cultureImages.slice(0, 3);
  const hiddenCultureImageCount = Math.max(cultureImages.length - visibleCultureImages.length, 0);

  return (
    <main className="company-page">
      <PublicHeader navigate={navigate} />

      <div className="company-shell">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: "Trang chủ", onClick: () => navigate("/") },
            { label: "Công ty", onClick: () => navigate("/companies") },
            { label: company.name },
          ]}
        />

        <section className="company-banner">
          <div className="company-banner-cover">
            <Image src={company.cover} alt="" width={1200} height={420} priority />
            <span className="company-banner-scrim" aria-hidden="true" />
          </div>

          <div className="company-banner-body">
            <div className="company-banner-main">
              <CompanyLogo size="large" />

              <div className="company-banner-info">
                <h1>
                  {company.name}
                  <BadgeCheck size={26} weight="fill" className="company-verified" />
                </h1>
                <p className="company-tagline">{company.tagline}</p>
                <div className="company-banner-meta">
                  <span>
                    <Briefcase size={16} /> {company.industry}
                  </span>
                  <i aria-hidden="true" />
                  <span>
                    <Building2 size={16} /> {company.type}
                  </span>
                </div>
                <div className="company-banner-actions">
                  <button
                    type="button"
                    className={`company-follow${following ? " is-following" : ""}`}
                    onClick={() => setFollowing((value) => !value)}
                    aria-pressed={following}
                  >
                    <span className="company-follow-icon" aria-hidden="true">
                      {following ? (
                        <Check size={18} weight="bold" />
                      ) : (
                        <Plus size={18} weight="bold" />
                      )}
                    </span>
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
            </div>

            <aside className="company-banner-badge">
              <span className="company-banner-badge-icon">
                <Star size={24} weight="fill" />
              </span>
              <div>
                <strong>Nhà tuyển dụng được yêu thích</strong>
                <small>
                  <b>Top 5%</b> công ty được theo dõi nhiều trên UpNext
                </small>
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
            <section className="company-profile-panel">
              <CompanySection title="Giới thiệu công ty">
                <ExpandableCompanyIntro paragraphs={companyIntroParagraphs} />
              </CompanySection>

              <CompanySection
                title="Văn hóa & môi trường làm việc"
                subtitle="Chúng tôi xây dựng môi trường làm việc cởi mở, minh bạch, nơi mỗi người được trao quyền để sáng tạo, dám nghĩ lớn và tạo ra giá trị khác biệt."
              >
                <div className={`company-gallery is-count-${Math.min(cultureImages.length, 3)}`}>
                  {visibleCultureImages.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      className="company-gallery-item"
                      onClick={() => setActiveCultureImage(index)}
                      aria-label={`Xem ảnh môi trường làm việc ${index + 1}`}
                    >
                      <Image
                        src={src}
                        alt={`Môi trường làm việc ${index + 1}`}
                        width={420}
                        height={260}
                      />
                      {index === 2 && hiddenCultureImageCount > 0 && (
                        <span className="company-gallery-more">+{hiddenCultureImageCount} ảnh</span>
                      )}
                    </button>
                  ))}
                </div>
              </CompanySection>

              <CompanySection title="Công nghệ & kỹ năng nổi bật">
                <ExpandableTagList tags={techStack} />
              </CompanySection>

              <CompanySection
                title="Văn phòng / địa điểm làm việc"
                action={
                  <button type="button" className="company-map-btn">
                    Xem bản đồ <MapTrifold size={15} />
                  </button>
                }
                isLast
              >
                <div className="company-offices">
                  {officeLocations.map((place, index) => (
                    <span key={place}>
                      {index < 3 && <MapPin size={15} weight={index === 0 ? "fill" : "regular"} />}
                      {place}
                    </span>
                  ))}
                  <span className="company-offices-more">+ 3 địa điểm khác</span>
                </div>
              </CompanySection>
            </section>

            <section className="company-jobs-section">
              <div className="company-jobs-head">
                <h2>Việc làm đang tuyển</h2>
                <button type="button" onClick={() => navigate("/jobs")}>
                  Xem tất cả (128) <ArrowRight size={14} weight="bold" />
                </button>
              </div>
              <div className="company-jobs">
                {openJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    className="company-job"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <h3>{job.title}</h3>
                    <span className="company-job-salary">
                      <Coins size={15} weight="fill" /> {job.salary}
                    </span>
                    <span className="company-job-loc">
                      <MapPin size={14} /> {job.location}
                    </span>
                    <div className="company-job-tags">
                      {job.tags.slice(0, 3).map((tag) => (
                        <i key={tag}>{tag}</i>
                      ))}
                      {job.tags.length > 3 && (
                        <i
                          className="company-job-tag-more text-slate-400"
                          title={job.tags.slice(3).join(", ")}
                        >
                          +{job.tags.length - 3}
                        </i>
                      )}
                    </div>
                    <small className="company-job-time">{job.posted}</small>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="company-aside">
            <SidebarCard title="Thông tin nhanh">
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
            </SidebarCard>

            <SidebarCard title="Quy mô & ngành nghề">
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
              <div className="company-field is-inline">
                <small>Quy mô công ty</small>
                <strong>{company.size}</strong>
              </div>
              <div className="company-field is-inline">
                <small>Văn phòng</small>
                <strong>{company.offices}</strong>
              </div>
            </SidebarCard>

            <SidebarCard title="Kết nối với chúng tôi">
              <div className="company-socials">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </SidebarCard>

            <section className="company-cta-card">
              <div>
                <h3>Không bỏ lỡ cơ hội từ {company.name}</h3>
                <p>
                  Theo dõi công ty để nhận thông báo về việc làm mới nhất và tin tức tuyển dụng.
                </p>
                <button
                  type="button"
                  className={`company-follow${following ? " is-following" : ""}`}
                  onClick={() => setFollowing((value) => !value)}
                  aria-pressed={following}
                >
                  <span className="company-follow-icon" aria-hidden="true">
                    {following ? (
                      <Check size={17} weight="bold" />
                    ) : (
                      <Plus size={17} weight="bold" />
                    )}
                  </span>
                  {following ? "Đang theo dõi" : "Theo dõi công ty"}
                </button>
                <span className="company-followers">12.3K người đã theo dõi</span>
              </div>
              <span className="company-cta-art" aria-hidden="true">
                <Medal size={84} weight="fill" />
              </span>
            </section>
          </aside>
        </div>
      </div>

      <section className="company-banner-strip">
        <div className="company-strip-inner">
          <span className="company-strip-icon">
            <PaperPlaneTilt size={26} weight="fill" />
          </span>
          <div>
            <strong>Ứng tuyển nhanh hơn với hồ sơ UpNext</strong>
            <p>Tạo hồ sơ một lần – Ứng tuyển dễ dàng – Nổi bật với nhà tuyển dụng</p>
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

      <CompanyGalleryDialog
        activeIndex={activeCultureImage}
        images={cultureImages}
        label="Ảnh môi trường làm việc"
        onActiveIndexChange={setActiveCultureImage}
      />

      <PublicFooter navigate={navigate} />
    </main>
  );
}

function CompanySection({
  title,
  subtitle,
  action,
  isLast,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`company-profile-section${isLast ? " is-last" : ""}`}>
      <div className="company-section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {subtitle && <p className="company-card-sub">{subtitle}</p>}
      {children}
    </section>
  );
}

function ExpandableCompanyIntro({ paragraphs }: { paragraphs: string[] }) {
  const initialVisibleLines = 6;
  const lineStep = 6;
  const copyRef = useRef<HTMLDivElement>(null);
  const [visibleLines, setVisibleLines] = useState(initialVisibleLines);
  const [introMeasure, setIntroMeasure] = useState({
    contentHeight: 0,
    lineHeight: 0,
  });
  const collapsedHeight = introMeasure.lineHeight * initialVisibleLines;
  const currentMaxHeight = introMeasure.lineHeight * visibleLines;
  const hasOverflow = introMeasure.contentHeight > collapsedHeight + 2;
  const canShowMore = hasOverflow && introMeasure.contentHeight > currentMaxHeight + 2;
  const canCollapse = hasOverflow && visibleLines > initialVisibleLines;

  useEffect(() => {
    const element = copyRef.current;

    if (!element) {
      return;
    }

    const currentElement = element;

    function measureIntro() {
      const computedStyle = window.getComputedStyle(currentElement);
      const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);
      const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : 24;

      setIntroMeasure({
        contentHeight: currentElement.scrollHeight,
        lineHeight,
      });
    }

    measureIntro();
    window.addEventListener("resize", measureIntro);

    return () => window.removeEventListener("resize", measureIntro);
  }, [paragraphs]);

  return (
    <div className={`company-intro-block${canShowMore ? " has-more" : ""}`}>
      <div
        ref={copyRef}
        className="company-intro-copy"
        style={{ "--company-intro-lines": visibleLines } as CSSProperties}
      >
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="company-intro">
            {paragraph}
          </p>
        ))}
      </div>
      {hasOverflow && (
        <div className="company-intro-actions">
          {canShowMore && (
            <button
              type="button"
              className="company-intro-more-btn"
              onClick={() => setVisibleLines((lines) => lines + lineStep)}
            >
              Xem thêm <ChevronDown size={14} weight="bold" />
            </button>
          )}
          {canCollapse && (
            <button
              type="button"
              className="company-intro-more-btn is-collapse"
              onClick={() => setVisibleLines(initialVisibleLines)}
            >
              Thu gọn <ChevronDown size={14} weight="bold" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExpandableTagList({ tags }: { tags: string[] }) {
  const featuredTagCount = 12;
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [query, setQuery] = useState("");
  const featuredTags = tags.slice(0, featuredTagCount);
  const hiddenTagCount = Math.max(tags.length - featuredTags.length, 0);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTags = normalizedQuery
    ? tags.filter((tag) => tag.toLowerCase().includes(normalizedQuery))
    : tags;

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPanelOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen]);

  return (
    <div className="company-tags-block">
      <div className="company-tags-summary">
        <div className="company-tags">
          {featuredTags.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
          {hiddenTagCount > 0 && (
            <button
              type="button"
              className="company-tags-more-chip"
              onClick={() => setIsPanelOpen(true)}
              aria-haspopup="dialog"
            >
              +{hiddenTagCount} kỹ năng
            </button>
          )}
        </div>
        <p>Các công nghệ thường gặp trong dự án và vị trí tuyển dụng tại {company.name}.</p>
      </div>

      {isPanelOpen && (
        <dialog open className="company-skills-dialog" aria-label="Tất cả công nghệ và kỹ năng">
          <button
            type="button"
            className="company-skills-backdrop"
            aria-label="Đóng danh sách kỹ năng"
            onClick={() => setIsPanelOpen(false)}
          />
          <section className="company-skills-panel">
            <header className="company-skills-head">
              <div>
                <span>{tags.length} kỹ năng</span>
                <h3>Công nghệ & kỹ năng nổi bật</h3>
              </div>
              <button
                type="button"
                className="company-skills-close"
                aria-label="Đóng danh sách kỹ năng"
                onClick={() => setIsPanelOpen(false)}
              >
                <X size={18} />
              </button>
            </header>

            <label className="company-skills-search">
              <span>Tìm kỹ năng</span>
              <input
                aria-label="Tìm kỹ năng"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm Java, React, Cloud..."
                autoFocus
              />
            </label>

            <div className="company-skills-grid">
              {filteredTags.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
            {filteredTags.length === 0 && (
              <p className="company-skills-empty">Không tìm thấy kỹ năng phù hợp.</p>
            )}
          </section>
        </dialog>
      )}
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="company-card is-compact">
      <div className="company-card-head">
        <h2>{title}</h2>
      </div>
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
