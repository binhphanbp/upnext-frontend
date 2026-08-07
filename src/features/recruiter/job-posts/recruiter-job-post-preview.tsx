"use client";

import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const category = findOption(catalogs.categories, values.jobCategoryId);
  const employmentType = findOption(catalogs.employmentTypes, values.employmentTypeId);
  const experienceLevel = findOption(catalogs.experienceLevels, values.experienceLevelId);
  const educationLevel = getEducationLabel(t, values.educationLevel);
  const selectedLocations = locations.filter((location) =>
    values.jobLocationIds?.includes(location.id),
  );
  const selectedSkills = catalogs.skills.filter((skill) => values.skillIds?.includes(skill.id));
  const selectedSpecializations = catalogs.specializations.filter((specialization) =>
    values.specializationIds?.includes(specialization.id),
  );
  const tags = [...selectedSkills, ...selectedSpecializations].map((option) => option.name);
  const locationLabel = formatLocationSummary(t, selectedLocations);
  const title = values.title?.trim() || t("jobPostsPage.preview.titleFallback");
  const lead =
    getCleanText(removeDuplicateSectionHeadings(values.description ?? "")) ||
    t("jobPostsPage.preview.leadFallback");

  return (
    <section className="jobs-page job-detail-page overflow-hidden rounded-2xl border border-slate-200">
      <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
        <strong>{t("jobPostsPage.preview.bannerBold")}</strong>
        {t("jobPostsPage.preview.bannerText")}
      </div>

      <div className="job-detail-shell" style={{ width: "100%", padding: "24px" }}>
        <section className="job-detail-layout">
          <article className="job-detail-main">
            <section className="job-detail-card job-detail-hero-card">
              <div className="job-detail-company-row">
                <CompanyLogo companyName={companyName} logoUrl={companyLogoUrl} />
                <div>
                  <span className="job-detail-company-name">{companyName}</span>
                  <p>{category?.name || t("jobPostsPage.preview.categoryUnset")}</p>
                </div>
                {companyVerified ? (
                  <span className="job-detail-verified">
                    <ShieldCheck size={15} weight="fill" />{" "}
                    {t("jobPostsPage.preview.verifiedBadge")}
                  </span>
                ) : null}
              </div>

              <div className="job-detail-title-row">
                <h1>{title}</h1>
              </div>
              <p className="job-detail-lead">{lead}</p>

              <div className="job-detail-salary-row">
                <Coins size={24} weight="fill" />
                <strong>{formatSalary(t, values, locale)}</strong>
                <i aria-hidden="true" />
                <span>
                  {values.salaryIsNegotiable
                    ? t("jobPostsPage.preview.salaryNegotiableNote")
                    : t("jobPostsPage.preview.salaryEstimatedNote")}
                </span>
              </div>

              <div className="job-detail-meta-grid">
                <InfoTile
                  icon={<MapPin size={20} />}
                  label={t("jobPostsPage.preview.locationLabel")}
                  value={locationLabel}
                />
                <InfoTile
                  icon={<Monitor size={20} />}
                  label={t("jobPostsPage.preview.employmentTypeLabel")}
                  value={employmentType?.name || t("jobPostsPage.preview.employmentTypeFallback")}
                />
                <InfoTile
                  icon={<BriefcaseBusiness size={20} />}
                  label={t("jobPostsPage.preview.experienceLevelLabel")}
                  value={experienceLevel?.name || t("jobPostsPage.preview.experienceLevelFallback")}
                />
                <InfoTile
                  icon={<Calendar size={20} />}
                  label={t("jobPostsPage.preview.postedLabel")}
                  value={t("jobPostsPage.preview.postedValue")}
                />
              </div>

              <div className="job-detail-tags" aria-label={t("jobPostsPage.preview.skillsAria")}>
                {tags.length ? (
                  tags.map((tag) => <span key={tag}>{tag}</span>)
                ) : (
                  <span>{t("jobPostsPage.preview.noSkillsSelected")}</span>
                )}
              </div>

              <div
                className="job-detail-action-row"
                aria-label={t("jobPostsPage.preview.actionsAria")}
              >
                <PreviewAction
                  icon={<PaperPlaneTilt size={18} />}
                  label={t("jobPostsPage.preview.applyNow")}
                />
                <PreviewAction
                  icon={<Bookmark size={18} />}
                  label={t("jobPostsPage.preview.saveJob")}
                />
                <PreviewAction
                  icon={<ShareNetwork size={18} />}
                  label={t("jobPostsPage.preview.share")}
                />
              </div>
            </section>

            <section className="job-detail-card job-detail-section">
              <div className="job-detail-card-head mb-6">
                <span>
                  <FileText size={18} />
                </span>
                <h2>{t("jobPostsPage.preview.jobInfoTitle")}</h2>
              </div>
              <PreviewRichText
                title={t("jobPostsPage.detail.descriptionTitle")}
                html={values.description}
              />
              <PreviewRichText
                title={t("jobPostsPage.preview.requirementsTitle")}
                html={values.requirements}
                separated
              />
              <PreviewRichText
                title={t("jobPostsPage.preview.benefitsTitle")}
                html={values.benefits}
                separated
              />
            </section>

            <section className="job-detail-card job-detail-section">
              <div className="job-detail-card-head">
                <h2>{t("jobPostsPage.preview.skillsSectionTitle")}</h2>
              </div>
              <div className="job-detail-skill-cloud">
                {tags.length ? (
                  tags.map((tag) => <span key={tag}>{tag}</span>)
                ) : (
                  <p className="text-sm text-slate-500">
                    {t("jobPostsPage.preview.noSkillsOrSpecializations")}
                  </p>
                )}
              </div>
            </section>
          </article>

          <aside className="job-detail-aside">
            <section className="job-detail-card job-detail-ready-card">
              <h2>{t("jobPostsPage.preview.readyTitle")}</h2>
              <p>{t("jobPostsPage.preview.readySubtitle")}</p>
              <PreviewAction
                icon={<PaperPlaneTilt size={18} />}
                label={t("jobPostsPage.preview.applyNow")}
              />
              <PreviewAction
                icon={<Coins size={18} />}
                label={t("jobPostsPage.preview.viewSalaryMatch")}
              />
              <PreviewAction
                icon={<Bookmark size={18} />}
                label={t("jobPostsPage.preview.saveJob")}
              />
              <div className="job-detail-deadline">
                {t("jobPostsPage.preview.deadlineLabel")}
                <b>{formatDate(t, values.expiredAt, locale)}</b>
              </div>
            </section>

            <section className="job-detail-card job-detail-overview-card">
              <h2>{t("jobPostsPage.preview.overviewTitle")}</h2>
              <InfoLine
                icon={<Coins size={17} />}
                label={t("jobPostsPage.detail.salary")}
                value={formatSalary(t, values, locale)}
              />
              <InfoLine
                icon={<MapPin size={17} />}
                label={t("jobPostsPage.preview.locationLabel")}
                value={locationLabel}
              />
              <InfoLine
                icon={<BriefcaseBusiness size={17} />}
                label={t("jobPostsPage.preview.employmentTypeLabel")}
                value={employmentType?.name || t("jobPostsPage.notUpdated")}
              />
              <InfoLine
                icon={<UsersRound size={17} />}
                label={t("jobPostsPage.preview.vacanciesLabel")}
                value={t("jobPostsPage.preview.vacanciesUnit", {
                  count: toNumber(values.vacanciesCount) || 1,
                })}
              />
              <InfoLine
                icon={<Calendar size={17} />}
                label={t("jobPostsPage.preview.educationLabel")}
                value={educationLevel}
              />
              <InfoLine
                icon={<Calendar size={17} />}
                label={t("jobPostsPage.preview.workingDaysLabel")}
                value={values.workingDays?.trim() || t("jobPostsPage.notUpdated")}
              />
            </section>

            <section className="job-detail-card job-detail-company-mini">
              <CompanyLogo companyName={companyName} logoUrl={companyLogoUrl} size="normal" />
              <div>
                <h2>{companyName}</h2>
                <p>{category?.name || t("jobPostsPage.preview.companyInfoFallback")}</p>
                {companyVerified ? <em>{t("jobPostsPage.preview.companyVerifiedTag")}</em> : null}
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
  const t = useTranslations("Recruiter");
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
        <p className="text-sm text-slate-500">{t("jobPostsPage.preview.richTextEmpty")}</p>
      )}
    </section>
  );
}

function PreviewAction({ icon, label }: Readonly<{ icon: ReactNode; label: string }>) {
  const t = useTranslations("Recruiter");
  return (
    <button
      type="button"
      disabled
      aria-label={`${label}${t("jobPostsPage.preview.previewActionSuffix")}`}
    >
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
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const className = `jobs-logo-mark${size === "large" ? " is-large" : ""}`;

  if (logoUrl) {
    return (
      <span className={className}>
        <Image
          src={logoUrl}
          alt={t("jobPostsPage.preview.logoAlt", { name: companyName })}
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
      {(companyName.trim()[0] || "U").toLocaleUpperCase(locale)}
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

function formatLocationSummary(
  t: ReturnType<typeof useTranslations>,
  locations: ReadonlyArray<JobLocationOption>,
) {
  const firstLocation = locations[0];
  if (!firstLocation) return t("jobPostsPage.preview.locationUnset");
  const primary =
    firstLocation.city || firstLocation.district || t("jobPostsPage.preview.locationFallback");
  return locations.length > 1
    ? `${primary}${t("jobPostsPage.preview.locationCountSuffix", { count: locations.length - 1 })}`
    : primary;
}

function formatSalary(
  t: ReturnType<typeof useTranslations>,
  values: JobPostPreviewValues,
  locale: string,
) {
  if (values.salaryIsNegotiable) return t("jobPostsPage.preview.salaryNegotiable");
  if (values.salaryIsVisible === false) return t("jobPostsPage.preview.salaryHidden");
  const minimum = toNumber(values.salaryMin);
  const maximum = toNumber(values.salaryMax);
  if (minimum && maximum)
    return `${formatMoney(minimum, locale)} - ${formatMoney(maximum, locale)}`;
  if (minimum)
    return t("jobPostsPage.preview.salaryFrom", { amount: formatMoney(minimum, locale) });
  if (maximum) return t("jobPostsPage.preview.salaryTo", { amount: formatMoney(maximum, locale) });
  return t("jobPostsPage.notUpdated");
}

function formatMoney(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale).format(value)} VND`;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatDate(
  t: ReturnType<typeof useTranslations>,
  value: string | undefined,
  locale: string,
) {
  if (!value) return t("jobPostsPage.preview.dateUnset");
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? t("jobPostsPage.preview.dateUnset")
    : date.toLocaleDateString(locale);
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

function getEducationLabel(t: ReturnType<typeof useTranslations>, level?: string) {
  switch (level) {
    case "HIGH_SCHOOL":
      return t("jobPostsPage.education.highSchool");
    case "VOCATIONAL":
      return t("jobPostsPage.education.vocational");
    case "COLLEGE":
      return t("jobPostsPage.education.college");
    case "BACHELOR":
      return t("jobPostsPage.education.bachelor");
    case "POSTGRADUATE":
      return t("jobPostsPage.education.postgraduate");
    default:
      return t("jobPostsPage.education.any");
  }
}
