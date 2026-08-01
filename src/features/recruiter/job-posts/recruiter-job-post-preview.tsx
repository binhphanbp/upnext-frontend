import Image from "next/image";
import type { ReactNode } from "react";

import {
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  Coins,
  FileText,
  MapPin,
  Monitor,
  PaperPlaneTilt,
  ShareNetwork,
  ShieldCheck,
  UsersRound,
} from "@/features/public/home/marketing-icons";
import type {
  JobLocationOption,
  JobOption,
  JobPostCatalogs,
} from "@/features/recruiter/job-posts/api";

import "@/features/public/jobs/jobs-page.css";

export type JobPostPreviewValues = Readonly<{
  title?: string | undefined;
  description?: string | undefined;
  requirements?: string | undefined;
  benefits?: string | undefined;
  salaryMin?: unknown;
  salaryMax?: unknown;
  salaryIsNegotiable?: boolean | undefined;
  salaryIsVisible?: boolean | undefined;
  vacanciesCount?: unknown;
  jobCategoryId?: string | undefined;
  employmentTypeId?: string | undefined;
  experienceLevelId?: string | undefined;
  educationLevel?: string | undefined;
  jobLocationIds?: string[] | undefined;
  skillIds?: string[] | undefined;
  specializationIds?: string[] | undefined;
  workingDays?: string | undefined;
  expiredAt?: string | undefined;
}>;

type RecruiterJobPostPreviewProps = Readonly<{
  companyName: string;
  companyLogoUrl: string;
  companyVerified: boolean;
  values: JobPostPreviewValues;
  catalogs: JobPostCatalogs;
  locations: ReadonlyArray<JobLocationOption>;
}>;

export function RecruiterJobPostPreview({
  companyName,
  companyLogoUrl,
  companyVerified,
  values,
  catalogs,
  locations,
}: RecruiterJobPostPreviewProps) {
  const category = findOption(catalogs.categories, values.jobCategoryId);
  const employmentType = findOption(catalogs.employmentTypes, values.employmentTypeId);
  const experienceLevel = findOption(catalogs.experienceLevels, values.experienceLevelId);
  const educationLevel = EDUCATION_LABELS[values.educationLevel ?? "ANY"] ?? "Không yêu cầu";
  const selectedLocations = locations.filter((location) =>
    values.jobLocationIds?.includes(location.id),
  );
  const selectedSkills = catalogs.skills.filter((skill) => values.skillIds?.includes(skill.id));
  const selectedSpecializations = catalogs.specializations.filter((specialization) =>
    values.specializationIds?.includes(specialization.id),
  );
  const tags = [...selectedSkills, ...selectedSpecializations].map((option) => option.name);
  const locationLabel = formatLocationSummary(selectedLocations);
  const title = values.title?.trim() || "Chức danh tuyển dụng";
  const lead =
    getCleanText(removeDuplicateSectionHeadings(values.description ?? "")) ||
    "Mô tả ngắn của tin tuyển dụng sẽ hiển thị tại đây.";

  return (
    <section className="jobs-page job-detail-page overflow-hidden rounded-2xl border border-slate-200">
      <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
        <strong>Bản xem trước dành cho ứng viên.</strong> Các nút tương tác được tắt cho đến khi tin
        được đăng.
      </div>

      <div className="job-detail-shell" style={{ width: "100%", padding: "24px" }}>
        <section className="job-detail-layout">
          <article className="job-detail-main">
            <section className="job-detail-card job-detail-hero-card">
              <div className="job-detail-company-row">
                <CompanyLogo companyName={companyName} logoUrl={companyLogoUrl} />
                <div>
                  <span className="job-detail-company-name">{companyName}</span>
                  <p>{category?.name || "Ngành nghề chưa được chọn"}</p>
                </div>
                {companyVerified ? (
                  <span className="job-detail-verified">
                    <ShieldCheck size={15} weight="fill" /> Đã xác thực
                  </span>
                ) : null}
              </div>

              <div className="job-detail-title-row">
                <h1>{title}</h1>
              </div>
              <p className="job-detail-lead">{lead}</p>

              <div className="job-detail-salary-row">
                <Coins size={24} weight="fill" />
                <strong>{formatSalary(values)}</strong>
                <i aria-hidden="true" />
                <span>
                  {values.salaryIsNegotiable ? "Thỏa thuận theo năng lực" : "Mức lương dự kiến"}
                </span>
              </div>

              <div className="job-detail-meta-grid">
                <InfoTile icon={<MapPin size={20} />} label="Địa điểm" value={locationLabel} />
                <InfoTile
                  icon={<Monitor size={20} />}
                  label="Hình thức"
                  value={employmentType?.name || "Chưa chọn hình thức"}
                />
                <InfoTile
                  icon={<BriefcaseBusiness size={20} />}
                  label="Cấp bậc"
                  value={experienceLevel?.name || "Chưa chọn cấp bậc"}
                />
                <InfoTile
                  icon={<Calendar size={20} />}
                  label="Đăng tuyển"
                  value="Sau khi được duyệt"
                />
              </div>

              <div className="job-detail-tags" aria-label="Kỹ năng liên quan">
                {tags.length ? (
                  tags.map((tag) => <span key={tag}>{tag}</span>)
                ) : (
                  <span>Chưa chọn kỹ năng</span>
                )}
              </div>

              <div className="job-detail-action-row" aria-label="Thao tác minh họa">
                <PreviewAction icon={<PaperPlaneTilt size={18} />} label="Ứng tuyển ngay" />
                <PreviewAction icon={<Bookmark size={18} />} label="Lưu tin" />
                <PreviewAction icon={<ShareNetwork size={18} />} label="Chia sẻ" />
              </div>
            </section>

            <section className="job-detail-card job-detail-section">
              <div className="job-detail-card-head mb-6">
                <span>
                  <FileText size={18} />
                </span>
                <h2>Thông tin tuyển dụng</h2>
              </div>
              <PreviewRichText title="Mô tả công việc" html={values.description} />
              <PreviewRichText title="Yêu cầu ứng viên" html={values.requirements} separated />
              <PreviewRichText title="Quyền lợi" html={values.benefits} separated />
            </section>

            <section className="job-detail-card job-detail-section">
              <div className="job-detail-card-head">
                <h2>Kỹ năng & công nghệ</h2>
              </div>
              <div className="job-detail-skill-cloud">
                {tags.length ? (
                  tags.map((tag) => <span key={tag}>{tag}</span>)
                ) : (
                  <p className="text-sm text-slate-500">Chưa chọn kỹ năng hoặc chuyên ngành.</p>
                )}
              </div>
            </section>
          </article>

          <aside className="job-detail-aside">
            <section className="job-detail-card job-detail-ready-card">
              <h2>Sẵn sàng ứng tuyển?</h2>
              <p>Gia tăng cơ hội với hồ sơ nổi bật</p>
              <PreviewAction icon={<PaperPlaneTilt size={18} />} label="Ứng tuyển ngay" />
              <PreviewAction icon={<Coins size={18} />} label="Xem lương phù hợp" />
              <PreviewAction icon={<Bookmark size={18} />} label="Lưu tin" />
              <div className="job-detail-deadline">
                Hạn nộp hồ sơ: <b>{formatDate(values.expiredAt)}</b>
              </div>
            </section>

            <section className="job-detail-card job-detail-overview-card">
              <h2>Tổng quan công việc</h2>
              <InfoLine icon={<Coins size={17} />} label="Mức lương" value={formatSalary(values)} />
              <InfoLine icon={<MapPin size={17} />} label="Địa điểm" value={locationLabel} />
              <InfoLine
                icon={<BriefcaseBusiness size={17} />}
                label="Hình thức"
                value={employmentType?.name || "Chưa chọn"}
              />
              <InfoLine
                icon={<UsersRound size={17} />}
                label="Số lượng"
                value={`${toNumber(values.vacanciesCount) || 1} vị trí`}
              />
              <InfoLine icon={<Calendar size={17} />} label="Học vấn" value={educationLevel} />
              <InfoLine
                icon={<Calendar size={17} />}
                label="Thời gian"
                value={values.workingDays?.trim() || "Chưa cập nhật"}
              />
            </section>

            <section className="job-detail-card job-detail-company-mini">
              <CompanyLogo companyName={companyName} logoUrl={companyLogoUrl} size="normal" />
              <div>
                <h2>{companyName}</h2>
                <p>{category?.name || "Thông tin doanh nghiệp"}</p>
                {companyVerified ? <em>Công ty đã xác thực</em> : null}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </section>
  );
}

function PreviewRichText({
  title,
  html,
  separated = false,
}: Readonly<{
  title: string;
  html?: string | undefined;
  separated?: boolean | undefined;
}>) {
  const hasContent = Boolean(getCleanText(html ?? ""));
  return (
    <section className={separated ? "border-t border-slate-100 py-5" : "pb-5"}>
      <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
      {hasContent ? (
        <div
          className="job-detail-rich-text text-sm leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: getCleanHtml(html ?? "") }}
        />
      ) : (
        <p className="text-sm text-slate-500">Nội dung này chưa được nhập.</p>
      )}
    </section>
  );
}

function PreviewAction({ icon, label }: Readonly<{ icon: ReactNode; label: string }>) {
  return (
    <button type="button" disabled aria-label={`${label} (chỉ minh họa)`}>
      {icon}
      {label}
    </button>
  );
}

function CompanyLogo({
  companyName,
  logoUrl,
  size = "large",
}: Readonly<{ companyName: string; logoUrl: string; size?: "normal" | "large" }>) {
  const className = `jobs-logo-mark${size === "large" ? " is-large" : ""}`;

  if (logoUrl) {
    return (
      <span className={className}>
        <Image
          src={logoUrl}
          alt={`Logo ${companyName}`}
          width={size === "large" ? 72 : 48}
          height={size === "large" ? 72 : 48}
          unoptimized
          className="h-full w-full rounded-lg object-contain p-1"
        />
      </span>
    );
  }

  return (
    <span className={`${className} jobs-logo-fallback`} style={{ color: "#059669" }}>
      {(companyName.trim()[0] || "U").toLocaleUpperCase("vi")}
    </span>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: Readonly<{ icon: ReactNode; label: string; value: string }>) {
  return (
    <span className="job-detail-info-tile">
      {icon}
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: Readonly<{ icon: ReactNode; label: string; value: string }>) {
  return (
    <div className="job-detail-info-line">
      <div className="job-detail-info-icon">{icon}</div>
      <div className="job-detail-info-content">
        <span className="job-detail-info-label">{label}</span>
        <b className="job-detail-info-value">{value}</b>
      </div>
    </div>
  );
}

function findOption(options: ReadonlyArray<JobOption>, id?: string) {
  return options.find((option) => option.id === id);
}

function formatLocationSummary(locations: ReadonlyArray<JobLocationOption>) {
  const firstLocation = locations[0];
  if (!firstLocation) return "Chưa chọn địa điểm";
  const primary = firstLocation.city || firstLocation.district || "Địa điểm làm việc";
  return locations.length > 1 ? `${primary} +${locations.length - 1} địa điểm` : primary;
}

function formatSalary(values: JobPostPreviewValues) {
  if (values.salaryIsNegotiable) return "Thỏa thuận";
  if (values.salaryIsVisible === false) return "Không công khai";
  const minimum = toNumber(values.salaryMin);
  const maximum = toNumber(values.salaryMax);
  if (minimum && maximum) return `${formatMoney(minimum)} - ${formatMoney(maximum)}`;
  if (minimum) return `Từ ${formatMoney(minimum)}`;
  if (maximum) return `Đến ${formatMoney(maximum)}`;
  return "Chưa cập nhật";
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatDate(value?: string) {
  if (!value) return "Chưa chọn";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Chưa chọn" : date.toLocaleDateString("vi-VN");
}

function getCleanText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCleanHtml(html: string) {
  if (!html) return "";

  let cleaned = removeDuplicateSectionHeadings(html)
    .replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, "")
    .replace(/<details[^>]*>/gi, "")
    .replace(/<\/details>/gi, "")
    .trim();

  if (!cleaned) return "";

  const hasHtmlTags = /<(?:p|ul|ol|li|div|h[1-6]|br)[^>]*>/i.test(cleaned);
  if (hasHtmlTags) {
    return cleaned;
  }

  const rawLines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (rawLines.length === 0) return "";

  let resultHtml = "";
  let inList = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]!;
    const isExplicitBullet = /^[-•*]\s+/.test(line);
    const isImplicitBullet =
      !isExplicitBullet &&
      (i > 0 || rawLines.length > 2) &&
      !line.endsWith(":") &&
      line.length > 5 &&
      !/^(mô tả|yêu cầu|quyền lợi)/i.test(line);

    if (isExplicitBullet || isImplicitBullet) {
      if (!inList) {
        resultHtml += "<ul>";
        inList = true;
      }
      const itemText = line.replace(/^[-•*]\s+/, "");
      resultHtml += `<li>${itemText}</li>`;
    } else {
      if (inList) {
        resultHtml += "</ul>";
        inList = false;
      }
      if (line.endsWith(":") || (line.length < 40 && !line.includes("."))) {
        resultHtml += `<h3>${line.replace(/:$/, "")}</h3>`;
      } else {
        resultHtml += `<p>${line}</p>`;
      }
    }
  }

  if (inList) {
    resultHtml += "</ul>";
  }

  return resultHtml;
}

function removeDuplicateSectionHeadings(html: string) {
  const heading =
    "(?:Mô tả công việc|Yêu cầu công việc|Yêu cầu ứng viên|Quyền lợi|Phúc lợi|Quyền lợi / Phúc lợi)";
  return html
    .replace(new RegExp(`<h[1-6][^>]*>\\s*${heading}\\s*<\\/h[1-6]>`, "gi"), "")
    .replace(
      new RegExp(
        `<p[^>]*>\\s*(?:<strong[^>]*>)?\\s*${heading}\\s*(?:<\\/strong>)?\\s*<\\/p>`,
        "gi",
      ),
      "",
    )
    .replace(new RegExp(`<li[^>]*>\\s*${heading}\\s*<\\/li>`, "gi"), "");
}

const EDUCATION_LABELS: Readonly<Record<string, string>> = {
  ANY: "Không yêu cầu",
  HIGH_SCHOOL: "Trung học phổ thông",
  VOCATIONAL: "Trung cấp",
  COLLEGE: "Cao đẳng",
  BACHELOR: "Đại học",
  POSTGRADUATE: "Sau đại học",
};
