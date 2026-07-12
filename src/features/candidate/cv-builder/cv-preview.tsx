import { EnvelopeSimple, Globe, MapPin, Phone } from "@phosphor-icons/react";
import { forwardRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import { toExternalHref, toPlainText } from "./logic";
import type { CvData, CvSectionKey, SkillLevel } from "./types";

const THEME_VALUES: Record<string, { accent: string; dark: string; soft: string }> = {
  emerald: { accent: "#0f9f74", dark: "#075e4b", soft: "#e8f8f2" },
  indigo: { accent: "#4f46e5", dark: "#312e81", soft: "#eef2ff" },
  teal: { accent: "#0f8c8c", dark: "#115e59", soft: "#ecfeff" },
  violet: { accent: "#7c3aed", dark: "#4c1d95", soft: "#f5f3ff" },
  slate: { accent: "#334155", dark: "#0f172a", soft: "#f1f5f9" },
};

const DEFAULT_THEME = { accent: "#0f9f74", dark: "#075e4b", soft: "#e8f8f2" };

const DEFAULT_HEADINGS: Record<"vi" | "en", Record<CvSectionKey, string>> = {
  vi: {
    personal: "Thông tin liên hệ",
    summary: "Tóm tắt chuyên môn",
    experience: "Kinh nghiệm làm việc",
    projects: "Dự án tiêu biểu",
    education: "Học vấn",
    skills: "Kỹ năng",
  },
  en: {
    personal: "Contact",
    summary: "Professional summary",
    experience: "Work experience",
    projects: "Selected projects",
    education: "Education",
    skills: "Skills",
  },
};

const LEVEL_LABELS: Record<"vi" | "en", Record<SkillLevel, string>> = {
  vi: {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Khá",
    ADVANCED: "Thành thạo",
    EXPERT: "Chuyên gia",
  },
  en: {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
    EXPERT: "Expert",
  },
};

type CvCssProperties = CSSProperties & {
  "--cv-accent": string;
  "--cv-accent-dark": string;
  "--cv-accent-soft": string;
};

function formatDate(value: string, language: CvData["cvLanguage"]) {
  if (!value) return "";
  if (["present", "hiện tại", "hiện nay"].includes(value.toLocaleLowerCase())) {
    return language === "en" ? "Present" : "Hiện tại";
  }
  const match = /^(\d{4})(?:-(\d{2}))?/.exec(value);
  if (!match) return value;
  const year = match[1];
  const month = match[2];
  if (!month) return year ?? value;
  if (language === "vi") return `${month}/${year}`;
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${year}-${month}-01T00:00:00Z`),
  );
}

function DateRange({
  end,
  isCurrent,
  language,
  start,
}: Readonly<{
  end: string;
  isCurrent: boolean;
  language: CvData["cvLanguage"];
  start: string;
}>) {
  const formattedStart = formatDate(start, language);
  const formattedEnd = isCurrent
    ? language === "en"
      ? "Present"
      : "Hiện tại"
    : formatDate(end, language);
  if (!formattedStart && !formattedEnd) return null;
  return (
    <span className="cv-document-date">
      {formattedStart || "—"} — {formattedEnd || "—"}
    </span>
  );
}

function TextContent({ fallback, value }: Readonly<{ fallback?: string; value: string }>) {
  const plainText = toPlainText(value);
  if (!plainText) return fallback ? <p className="cv-document-placeholder">{fallback}</p> : null;
  const lines = plainText.split("\n").filter((line) => line.trim());
  const bulletLines = lines.filter((line) => /^(?:[•*-]|\d+[.)])\s*/.test(line.trim()));

  if (bulletLines.length === lines.length && lines.length > 0) {
    return (
      <ul className="cv-document-list">
        {lines.map((line, index) => (
          <li key={`${line}-${index}`}>{line.replace(/^(?:[•*-]|\d+[.)])\s*/, "")}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="cv-document-copy">
      {lines.map((line, index) => (
        <p key={`${line}-${index}`}>{line.replace(/^[•*-]\s*/, "")}</p>
      ))}
    </div>
  );
}

function Section({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <section className="cv-document-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ContactItem({
  children,
  href,
  icon,
}: Readonly<{ children: ReactNode; href?: string | undefined; icon: ReactNode }>) {
  if (!children) return null;
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );
  return href ? (
    <a className="cv-document-contact-item" href={href} rel="noreferrer" target="_blank">
      {content}
    </a>
  ) : (
    <span className="cv-document-contact-item">{content}</span>
  );
}

export const CvPreview = forwardRef<
  HTMLDivElement,
  Readonly<{ activeSection?: CvSectionKey | undefined; cvData: CvData }>
>(function CvPreview({ activeSection, cvData }, ref) {
  const theme = cvData.style.themeColor.startsWith("#")
    ? {
        accent: cvData.style.themeColor,
        dark: cvData.style.themeColor,
        soft: `${cvData.style.themeColor}14`,
      }
    : (THEME_VALUES[cvData.style.themeColor] ?? DEFAULT_THEME);
  const language = cvData.cvLanguage;
  const headings = DEFAULT_HEADINGS[language];
  const hiddenSections = new Set(cvData.hiddenSections ?? []);
  const titleFor = (section: CvSectionKey) =>
    cvData.customSectionNames?.[section]?.trim() || headings[section];
  const personal = cvData.personalInfo;

  const sectionContent: Record<CvSectionKey, ReactNode> = {
    personal: null,
    summary: (
      <Section title={titleFor("summary")}>
        <TextContent
          fallback={
            language === "en"
              ? "Your professional summary will appear here."
              : "Tóm tắt chuyên môn sẽ hiển thị tại đây."
          }
          value={cvData.summary}
        />
      </Section>
    ),
    experience: (
      <Section title={titleFor("experience")}>
        {cvData.experiences.length > 0 ? (
          <div className="cv-document-stack">
            {cvData.experiences.map((experience) => (
              <article className="cv-document-entry" key={experience.id}>
                <div className="cv-document-entry-heading">
                  <div>
                    <h3>
                      {experience.positionTitle || (language === "en" ? "Job title" : "Chức danh")}
                    </h3>
                    <p className="cv-document-organization">{experience.companyName}</p>
                  </div>
                  <DateRange
                    end={experience.endDate}
                    isCurrent={experience.isCurrent}
                    language={language}
                    start={experience.startDate}
                  />
                </div>
                <TextContent value={experience.description} />
                {experience.technologies ? (
                  <p className="cv-document-tech">
                    <strong>{language === "en" ? "Technology:" : "Công nghệ:"}</strong>{" "}
                    {experience.technologies}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="cv-document-placeholder">
            {language === "en"
              ? "Add relevant work experience."
              : "Thêm kinh nghiệm làm việc phù hợp."}
          </p>
        )}
      </Section>
    ),
    projects: (
      <Section title={titleFor("projects")}>
        {cvData.projects.length > 0 ? (
          <div className="cv-document-stack">
            {cvData.projects.map((project) => (
              <article className="cv-document-entry" key={project.id}>
                <div className="cv-document-entry-heading">
                  <div>
                    <h3>{project.name || (language === "en" ? "Project name" : "Tên dự án")}</h3>
                    {project.role ? (
                      <p className="cv-document-organization">{project.role}</p>
                    ) : null}
                  </div>
                  <div className="cv-document-links">
                    {project.projectUrl ? (
                      <a href={toExternalHref(project.projectUrl)} rel="noreferrer" target="_blank">
                        Source
                      </a>
                    ) : null}
                    {project.deployUrl ? (
                      <a href={toExternalHref(project.deployUrl)} rel="noreferrer" target="_blank">
                        Demo
                      </a>
                    ) : null}
                  </div>
                </div>
                <TextContent value={project.description} />
                {project.technologies ? (
                  <p className="cv-document-tech">
                    <strong>{language === "en" ? "Technology:" : "Công nghệ:"}</strong>{" "}
                    {project.technologies}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="cv-document-placeholder">
            {language === "en"
              ? "Add a project that demonstrates your skills."
              : "Thêm dự án thể hiện năng lực của bạn."}
          </p>
        )}
      </Section>
    ),
    education: (
      <Section title={titleFor("education")}>
        {cvData.educations.length > 0 ? (
          <div className="cv-document-stack">
            {cvData.educations.map((education) => (
              <article className="cv-document-entry" key={education.id}>
                <div className="cv-document-entry-heading">
                  <div>
                    <h3>{education.schoolName || (language === "en" ? "School" : "Tên trường")}</h3>
                    <p className="cv-document-organization">
                      {[education.degree, education.major].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <DateRange
                    end={education.endDate}
                    isCurrent={education.isCurrent}
                    language={language}
                    start={education.startDate}
                  />
                </div>
                {education.gpa ? <p className="cv-document-gpa">GPA: {education.gpa}</p> : null}
                <TextContent value={education.description} />
              </article>
            ))}
          </div>
        ) : (
          <p className="cv-document-placeholder">
            {language === "en" ? "Add your education." : "Thêm thông tin học vấn."}
          </p>
        )}
      </Section>
    ),
    skills: (
      <Section title={titleFor("skills")}>
        {cvData.skills.some((skill) => skill.name.trim()) ? (
          <ul className="cv-document-skills">
            {cvData.skills
              .filter((skill) => skill.name.trim())
              .map((skill) => (
                <li key={skill.id}>
                  <span>{skill.name}</span>
                  <small>{LEVEL_LABELS[language][skill.level]}</small>
                </li>
              ))}
          </ul>
        ) : (
          <p className="cv-document-placeholder">
            {language === "en" ? "Add your core skills." : "Thêm các kỹ năng cốt lõi."}
          </p>
        )}
      </Section>
    ),
  };
  const hasSectionContent: Record<CvSectionKey, boolean> = {
    personal: true,
    summary: Boolean(toPlainText(cvData.summary)),
    experience: cvData.experiences.some(
      (item) =>
        Boolean(item.positionTitle.trim()) ||
        Boolean(item.companyName.trim()) ||
        Boolean(toPlainText(item.description)),
    ),
    projects: cvData.projects.some(
      (item) => Boolean(item.name.trim()) || Boolean(toPlainText(item.description)),
    ),
    education: cvData.educations.some(
      (item) => Boolean(item.schoolName.trim()) || Boolean(item.degree.trim()),
    ),
    skills: cvData.skills.some((item) => Boolean(item.name.trim())),
  };

  return (
    <article
      aria-label={language === "en" ? "CV preview" : "Bản xem trước CV"}
      className={cn(
        "cv-document print-area",
        `cv-document--${cvData.selectedTemplate}`,
        `cv-document--text-${cvData.style.textSize}`,
        `cv-document--margin-${cvData.style.marginSize}`,
        cvData.style.fontFamily,
      )}
      id="cv-print-area"
      ref={ref}
      data-active-section={activeSection}
      style={
        {
          "--cv-accent": theme.accent,
          "--cv-accent-dark": theme.dark,
          "--cv-accent-soft": theme.soft,
        } as CvCssProperties
      }
    >
      <header className="cv-document-header" data-cv-section="personal">
        <div className="cv-document-identity">
          <p className="cv-document-kicker">
            {language === "en" ? "Curriculum vitae" : "Hồ sơ ứng tuyển"}
          </p>
          <h1>{personal.fullName || (language === "en" ? "Your full name" : "Họ và tên")}</h1>
          <p className="cv-document-role">
            {personal.title || (language === "en" ? "Target position" : "Vị trí ứng tuyển")}
          </p>
        </div>
        <address className="cv-document-contact">
          <ContactItem
            href={personal.email ? `mailto:${personal.email}` : undefined}
            icon={<EnvelopeSimple />}
          >
            {personal.email}
          </ContactItem>
          <ContactItem
            href={personal.phoneNumber ? `tel:${personal.phoneNumber}` : undefined}
            icon={<Phone />}
          >
            {personal.phoneNumber}
          </ContactItem>
          <ContactItem icon={<MapPin />}>{personal.address}</ContactItem>
          <ContactItem
            href={personal.website ? toExternalHref(personal.website) : undefined}
            icon={<Globe />}
          >
            {personal.website}
          </ContactItem>
        </address>
      </header>

      <div className="cv-document-body">
        {cvData.sectionsOrder.map((section) =>
          section === "personal" ||
          hiddenSections.has(section) ||
          !hasSectionContent[section] ? null : (
            <div data-cv-section={section} key={section}>
              {sectionContent[section]}
            </div>
          ),
        )}
      </div>
    </article>
  );
});
