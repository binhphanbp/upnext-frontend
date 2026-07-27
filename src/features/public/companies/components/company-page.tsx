"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";

import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { toast } from "@/shared/ui/toast";

import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  Coins,
  MapPin,
  PaperPlaneTilt,
  UsersRound,
} from "../../home/marketing-icons";
import { PublicFooter } from "../../shared/public-footer";
import { PublicHeader } from "../../shared/public-header";
import { getPublicCompanyProfile, type PublicCompanyProfile } from "../api";
import { CompanyGalleryDialog } from "./company-gallery-dialog";

import "../company-page.css";

type PublicCompanyPageProps = {
  slug: string;
  navigate: (path: string) => void;
};

const COMPANY_TYPE_LABELS: Record<string, string> = {
  OUTSOURCING: "Công ty dịch vụ / gia công phần mềm",
  PRODUCT: "Công ty sản phẩm",
  STARTUP: "Công ty khởi nghiệp",
  OTHER: "Doanh nghiệp",
};

const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string) {
  const cached = CURRENCY_FORMATTERS.get(currency);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat("vi-VN", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  });
  CURRENCY_FORMATTERS.set(currency, formatter);
  return formatter;
}

function formatSalary(job: PublicCompanyProfile["jobPosts"][number]) {
  if (!job.salaryIsVisible) return "Thỏa thuận";
  if (job.salaryIsNegotiable && job.salaryMin === null && job.salaryMax === null) {
    return "Thỏa thuận";
  }

  if (job.salaryCurrency === "VND") {
    const formatMillions = (value: string | number) =>
      new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
        Number(value) / 1_000_000,
      );

    if (job.salaryMin !== null && job.salaryMax !== null) {
      return `${formatMillions(job.salaryMin)} - ${formatMillions(job.salaryMax)} triệu`;
    }
    if (job.salaryMin !== null) return `Từ ${formatMillions(job.salaryMin)} triệu`;
    if (job.salaryMax !== null) return `Đến ${formatMillions(job.salaryMax)} triệu`;
    return "Thỏa thuận";
  }

  const formatter = getCurrencyFormatter(job.salaryCurrency);
  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `${formatter.format(Number(job.salaryMin))} – ${formatter.format(Number(job.salaryMax))}`;
  }
  if (job.salaryMin !== null) return `Từ ${formatter.format(Number(job.salaryMin))}`;
  if (job.salaryMax !== null) return `Đến ${formatter.format(Number(job.salaryMax))}`;
  return "Thỏa thuận";
}

function getActiveJobs(company: PublicCompanyProfile) {
  const now = Date.now();

  return company.jobPosts.filter((job) => {
    const expiryTime = job.expiredAt ? new Date(job.expiredAt).getTime() : null;
    return (
      job.status === "PUBLISHED" &&
      job.moderationStatus === "APPROVED" &&
      !job.isHidden &&
      (expiryTime === null || Number.isNaN(expiryTime) || expiryTime > now)
    );
  });
}

function getLocations(company: PublicCompanyProfile) {
  const locations = new Map<string, string>();

  for (const job of company.jobPosts) {
    for (const relation of job.jobPostLocations ?? []) {
      const location = relation.jobLocation;
      const label =
        [location.city, location.district].filter(Boolean).join(", ") || location.address;
      if (label) locations.set(label, label);
    }
  }

  if (locations.size === 0 && company.address) {
    locations.set(company.address, company.address);
  }

  return [...locations.values()];
}

function getSkills(company: PublicCompanyProfile) {
  const skills = new Map<string, string>();

  for (const job of company.jobPosts) {
    for (const relation of job.jobPostSkills ?? []) {
      if (relation.skill.name) skills.set(relation.skill.id, relation.skill.name);
    }
  }

  return [...skills.values()];
}

function CompanyLogo({ company }: { company: PublicCompanyProfile }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = company.logoFile?.publicUrl ?? company.logoUrl;

  if (!logoUrl || failed) {
    return (
      <span className="company-logo is-large is-fallback" aria-label={`Logo ${company.name}`}>
        {company.name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className="company-logo is-large">
      {/* The URL is supplied by the backend and can use any configured storage provider. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={`Logo ${company.name}`} onError={() => setFailed(true)} />
    </span>
  );
}

export function PublicCompanyPage({ slug, navigate }: PublicCompanyPageProps) {
  const companyQuery = useQuery({
    queryKey: ["public-company-profile", slug],
    queryFn: () => getPublicCompanyProfile(slug),
    retry: false,
  });

  if (companyQuery.isPending) {
    return (
      <PageFrame navigate={navigate}>
        <CompanyPageState title="Đang tải thông tin công ty…" />
      </PageFrame>
    );
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <PageFrame navigate={navigate}>
        <CompanyPageState
          title="Không thể tải thông tin công ty"
          description="Công ty không tồn tại hoặc máy chủ đang tạm thời không phản hồi."
          action={
            <button type="button" onClick={() => companyQuery.refetch()}>
              Thử lại
            </button>
          }
        />
      </PageFrame>
    );
  }

  return <CompanyProfile company={companyQuery.data} navigate={navigate} />;
}

function CompanyProfile({
  company,
  navigate,
}: {
  company: PublicCompanyProfile;
  navigate: (path: string) => void;
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const {
    isPending: isSavedJobPending,
    isSessionResolved: isSavedJobsSessionResolved,
    savedJobIds,
    toggleSaveJob,
  } = useCandidateSavedJobs();
  const activeJobs = getActiveJobs(company);
  const locations = getLocations(company);
  const skills = getSkills(company);
  const photos = (company.photos ?? []).flatMap((photo) =>
    photo.publicUrl ? [photo.publicUrl] : [],
  );
  const visiblePhotos = photos.slice(0, 3);
  const typeLabel = COMPANY_TYPE_LABELS[company.type] ?? company.type;
  const joinedAt = new Date(company.createdAt);
  const joinedAtLabel = Number.isNaN(joinedAt.getTime())
    ? null
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(joinedAt);
  const benefits = company.benefits
    ?.split(";")
    .map((benefit) => benefit.trim())
    .filter(Boolean);
  const companyLogoUrl = company.logoFile?.publicUrl ?? company.logoUrl ?? null;
  const coverImageUrl = company.coverFile?.publicUrl ?? photos[0] ?? null;

  function handleSaveJob(jobId: string) {
    const didStart = toggleSaveJob(jobId, {
      onError: () => toast.error("Không thể cập nhật việc làm đã lưu. Vui lòng thử lại."),
    });

    if (!didStart) {
      navigate(`/login?redirect=/companies/${encodeURIComponent(company.slug)}`);
    }
  }

  const stats = [
    {
      icon: <Briefcase size={20} />,
      label: "Việc làm đang tuyển",
      value: String(activeJobs.length),
    },
    ...(company.companySize
      ? [{ icon: <UsersRound size={20} />, label: "Quy mô nhân sự", value: company.companySize }]
      : []),
    ...(locations.length > 0
      ? [
          {
            icon: <MapPin size={20} />,
            label: "Địa điểm làm việc",
            value: String(locations.length),
          },
        ]
      : []),
    ...(joinedAtLabel
      ? [{ icon: <Calendar size={20} />, label: "Tham gia UpNext", value: joinedAtLabel }]
      : []),
  ];

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
            {coverImageUrl ? (
              <Image src={coverImageUrl} alt="" width={1200} height={420} priority unoptimized />
            ) : null}
            <span className="company-banner-scrim" aria-hidden="true" />
          </div>

          <div className="company-banner-body">
            <div className="company-banner-main">
              <CompanyLogo company={company} />
              <div className="company-banner-info">
                <h1>
                  {company.name}
                  {company.verificationStatus === "VERIFIED" ? (
                    <BadgeCheck
                      size={26}
                      weight="fill"
                      className="company-verified"
                      aria-label="Đã xác minh"
                    />
                  ) : null}
                </h1>
                {company.description ? (
                  <p className="company-tagline">{company.description.split(/[.!?]/u)[0]}</p>
                ) : null}
                <div className="company-banner-meta">
                  <span>
                    <Building2 size={16} /> {typeLabel}
                  </span>
                  {company.address ? (
                    <>
                      <i aria-hidden="true" />
                      <span>
                        <MapPin size={16} /> {company.address}
                      </span>
                    </>
                  ) : null}
                </div>
                {company.website ? (
                  <div className="company-banner-actions">
                    <a
                      className="company-website"
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Xem website <ArrowUpRight size={16} />
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {stats.length > 0 ? (
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
        ) : null}

        <div className="company-layout">
          <div className="company-main">
            <section className="company-profile-panel">
              {company.description ? (
                <CompanySection title="Giới thiệu công ty">
                  <p className="company-intro">{company.description}</p>
                </CompanySection>
              ) : null}

              {benefits?.length ? (
                <CompanySection title="Phúc lợi & môi trường làm việc">
                  <ul className="company-benefits-list">
                    {benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </CompanySection>
              ) : null}

              {photos.length > 0 ? (
                <CompanySection title="Hình ảnh môi trường làm việc">
                  <div className={`company-gallery is-count-${Math.min(photos.length, 3)}`}>
                    {visiblePhotos.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        className="company-gallery-item"
                        onClick={() => setActivePhotoIndex(index)}
                        aria-label={`Xem ảnh công ty ${index + 1}`}
                      >
                        <Image src={src} alt="" width={420} height={260} unoptimized />
                        {index === 2 && photos.length > 3 ? (
                          <span className="company-gallery-more">+{photos.length - 3} ảnh</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </CompanySection>
              ) : null}

              {skills.length > 0 ? (
                <CompanySection title="Công nghệ & kỹ năng đang tuyển">
                  <div className="company-tags">
                    {skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </CompanySection>
              ) : null}

              {locations.length > 0 ? (
                <CompanySection title="Văn phòng / địa điểm làm việc" isLast>
                  <div className="company-offices">
                    {locations.map((location) => (
                      <span key={location}>
                        <MapPin size={15} /> {location}
                      </span>
                    ))}
                  </div>
                </CompanySection>
              ) : null}
            </section>
          </div>

          <aside className="company-aside">
            <SidebarCard title="Thông tin công ty">
              <dl className="company-info-list">
                <InfoRow label="Tên công ty" value={company.name} />
                {company.taxCode ? <InfoRow label="Mã số thuế" value={company.taxCode} /> : null}
                <InfoRow label="Loại hình" value={typeLabel} />
                {company.website ? (
                  <InfoRow
                    label="Website"
                    value={
                      <a href={company.website} target="_blank" rel="noreferrer">
                        {company.website} <ArrowUpRight size={13} />
                      </a>
                    }
                  />
                ) : null}
                {company.email ? (
                  <InfoRow
                    label="Email"
                    value={<a href={`mailto:${company.email}`}>{company.email}</a>}
                  />
                ) : null}
                {company.phone ? (
                  <InfoRow
                    label="Điện thoại"
                    value={<a href={`tel:${company.phone}`}>{company.phone}</a>}
                  />
                ) : null}
                {company.companySize ? (
                  <InfoRow label="Quy mô" value={company.companySize} />
                ) : null}
                {company.workingDays ? (
                  <InfoRow label="Ngày làm việc" value={company.workingDays} />
                ) : null}
              </dl>
            </SidebarCard>
          </aside>
        </div>

        <div className="company-jobs-row">
          <CompanyJobsSection
            companyId={company.id}
            companyLogoUrl={companyLogoUrl}
            companyName={company.name}
            isSavePending={isSavedJobPending}
            isSaveSessionResolved={isSavedJobsSessionResolved}
            jobs={activeJobs}
            navigate={navigate}
            onSave={handleSaveJob}
            savedJobIds={savedJobIds}
          />
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
        activeIndex={activePhotoIndex}
        images={photos}
        label="Ảnh công ty"
        onActiveIndexChange={setActivePhotoIndex}
      />

      <PublicFooter navigate={navigate} />
    </main>
  );
}

function PageFrame({
  navigate,
  children,
}: {
  navigate: (path: string) => void;
  children: ReactNode;
}) {
  return (
    <main className="company-page">
      <PublicHeader navigate={navigate} />
      <div className="company-shell">{children}</div>
      <PublicFooter navigate={navigate} />
    </main>
  );
}

function CompanyPageState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="company-page-state" aria-live="polite">
      <Building2 size={40} />
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {action}
    </section>
  );
}

function CompanySection({
  title,
  isLast,
  children,
}: {
  title: string;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`company-profile-section${isLast ? " is-last" : ""}`}>
      <div className="company-section-head">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CompanyJobsSection({
  companyId,
  companyLogoUrl,
  companyName,
  isSavePending,
  isSaveSessionResolved,
  jobs,
  navigate,
  onSave,
  savedJobIds,
}: {
  companyId: string;
  companyLogoUrl: string | null;
  companyName: string;
  isSavePending: (jobId: string) => boolean;
  isSaveSessionResolved: boolean;
  jobs: PublicCompanyProfile["jobPosts"];
  navigate: (path: string) => void;
  onSave: (jobId: string) => void;
  savedJobIds: string[];
}) {
  return (
    <section className="company-jobs-section">
      <div className="company-jobs-head">
        <h2>Việc làm đang tuyển</h2>
        <button type="button" onClick={() => navigate(`/jobs?company=${companyId}`)}>
          Xem tất cả ({jobs.length}) <ArrowRight size={14} weight="bold" />
        </button>
      </div>
      {jobs.length > 0 ? (
        <div className="company-jobs">
          {jobs.slice(0, 4).map((job) => {
            const location = job.jobPostLocations?.[0]?.jobLocation;
            const locationLabel =
              [location?.city, location?.district].filter(Boolean).join(", ") || location?.address;
            const saved = savedJobIds.includes(job.id);

            return (
              <article key={job.id} className="company-job">
                <button
                  type="button"
                  className="company-job-main"
                  onClick={() => navigate(`/jobs/${job.slug}`)}
                >
                  <CompanyJobLogo companyName={companyName} logoUrl={companyLogoUrl} />
                  <span className="company-job-copy">
                    <h3>{job.title}</h3>
                    <span className="company-job-company">{companyName}</span>
                  </span>
                </button>

                <div className="company-job-footer">
                  <span className="company-job-salary">
                    <Coins size={15} weight="fill" /> {formatSalary(job)}
                  </span>
                  {locationLabel ? (
                    <span className="company-job-loc">
                      <MapPin size={15} /> {locationLabel}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={`company-job-save${saved ? " is-saved" : ""}`}
                    aria-label={saved ? `Bỏ lưu ${job.title}` : `Lưu ${job.title}`}
                    aria-pressed={saved}
                    disabled={!isSaveSessionResolved || isSavePending(job.id)}
                    onClick={() => onSave(job.id)}
                  >
                    <Bookmark size={19} weight={saved ? "fill" : "regular"} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="company-empty-copy">Công ty hiện chưa có vị trí đang tuyển.</p>
      )}
    </section>
  );
}

function CompanyJobLogo({ companyName, logoUrl }: { companyName: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="company-job-logo">
      {logoUrl && !failed ? (
        // The backend may return logos from different configured storage providers.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <span>{companyName.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
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
