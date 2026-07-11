"use client";

import {
  ArrowSquareOut,
  Briefcase,
  CalendarBlank,
  Certificate,
  Code,
  EnvelopeSimple,
  GithubLogo,
  Globe,
  GraduationCap,
  LinkSimple,
  LinkedinLogo,
  MapPin,
  PencilSimple,
  Phone,
  Plus,
  Sparkle,
  Trash,
  Translate,
  User,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type {
  CandidateCertificationApi,
  CandidateEducationApi,
  CandidateExperienceApi,
  CandidateLanguageApi,
  CandidateProfileApi,
  CandidateProjectApi,
  CandidateSkillApi,
} from "@/features/candidate/api/profile";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import type { ProfileEditorState } from "./profile-editor";
import { sortByOrder, splitTechnologies } from "./profile-model";

export type DeleteProfileRecordRequest =
  | Readonly<{ id: string; kind: "experience"; label: string }>
  | Readonly<{ id: string; kind: "project"; label: string }>
  | Readonly<{ id: string; kind: "education"; label: string }>
  | Readonly<{ id: string; kind: "certification"; label: string }>
  | Readonly<{ id: string; kind: "skill"; label: string }>
  | Readonly<{ id: string; kind: "language"; label: string }>
  | Readonly<{ id: string; kind: "link"; label: string }>;

type SectionProps = Readonly<{
  onDelete: (request: DeleteProfileRecordRequest) => void;
  onEdit: (editor: ProfileEditorState) => void;
  profile: CandidateProfileApi;
}>;

export function OverviewSection({ onDelete, onEdit, profile }: SectionProps) {
  const t = useTranslations("CandidateProfile.content");
  const contactItems = [
    { href: `mailto:${profile.account.email}`, icon: EnvelopeSimple, label: profile.account.email },
    ...(profile.phoneNumber
      ? [{ href: `tel:${profile.phoneNumber}`, icon: Phone, label: profile.phoneNumber }]
      : []),
    ...(profile.address ? [{ icon: MapPin, label: profile.address }] : []),
  ];

  return (
    <SectionFrame
      action={
        <Button variant="outline" size="sm" onClick={() => onEdit({ kind: "profile" })}>
          <PencilSimple aria-hidden="true" />
          {t("actions.editProfile")}
        </Button>
      }
      description={t("sections.overview.description")}
      title={t("sections.overview.title")}
    >
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        <ProfileBlock icon={<User />} title={t("forms.profile.summarySection")}>
          {profile.description ? (
            <p className="max-w-3xl text-[15px] leading-7 whitespace-pre-line text-slate-700">
              {profile.description}
            </p>
          ) : (
            <InlineEmpty
              description={t("sections.overview.emptyDescription")}
              actionLabel={t("actions.editProfile")}
              onAction={() => onEdit({ kind: "profile" })}
            />
          )}
        </ProfileBlock>
        <ProfileBlock icon={<Phone />} title={t("forms.profile.contactSection")}>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {contactItems.map(({ href, icon: Icon, label }) => {
              const content = (
                <span className="flex min-w-0 items-center gap-3 text-sm font-semibold text-slate-700">
                  <Icon aria-hidden="true" className="shrink-0 text-slate-400" size={18} />
                  <span className="truncate">{label}</span>
                </span>
              );
              return href ? (
                <a
                  key={label}
                  href={href}
                  className="focus-visible:outline-brand rounded-md hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  {content}
                </a>
              ) : (
                <div key={label}>{content}</div>
              );
            })}
            {!profile.phoneNumber && (
              <MissingValue icon={<Phone />} label={t("forms.profile.fields.phoneNumber.label")} />
            )}
            {!profile.address && (
              <MissingValue icon={<MapPin />} label={t("forms.profile.fields.address.label")} />
            )}
          </div>
        </ProfileBlock>
        <ProfileBlock
          icon={<LinkSimple />}
          title={t("sections.overview.linksTitle")}
          action={
            <Button variant="ghost" size="sm" onClick={() => onEdit({ kind: "link" })}>
              <Plus aria-hidden="true" />
              {t("actions.addLink")}
            </Button>
          }
        >
          {profile.links.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {profile.links.map((link) => (
                <li
                  key={link.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-visible:outline-brand flex min-w-0 items-center gap-3 rounded-md text-sm font-semibold text-slate-700 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <LinkTypeIcon type={link.type} />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold tracking-wide text-slate-500 uppercase">
                        {formatLinkType(link.type, t)}
                      </span>
                      <span className="block truncate">{link.url}</span>
                    </span>
                    <ArrowSquareOut
                      aria-hidden="true"
                      className="shrink-0 text-slate-400"
                      size={16}
                    />
                  </a>
                  <RecordActions
                    label={link.url}
                    onDelete={() => onDelete({ id: link.id, kind: "link", label: link.url })}
                    onEdit={() => onEdit({ item: link, kind: "link" })}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <InlineEmpty
              description={t("forms.link.description")}
              actionLabel={t("actions.addLink")}
              onAction={() => onEdit({ kind: "link" })}
            />
          )}
        </ProfileBlock>
      </div>
    </SectionFrame>
  );
}

export function ExperienceSection({ onDelete, onEdit, profile }: SectionProps) {
  const t = useTranslations("CandidateProfile.content");
  const locale = useLocale();
  const experiences = sortByOrder(profile.experiences);

  return (
    <SectionFrame
      action={
        <AddButton
          label={t("actions.addExperience")}
          onClick={() => onEdit({ kind: "experience" })}
        />
      }
      description={t("sections.experience.description")}
      title={t("sections.experience.title")}
    >
      {experiences.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title={t("sections.experience.emptyTitle")}
          description={t("sections.experience.emptyDescription")}
          actionLabel={t("actions.addExperience")}
          onAction={() => onEdit({ kind: "experience" })}
        />
      ) : (
        <ol className="relative ml-2 border-l border-slate-200">
          {experiences.map((experience, index) => (
            <ExperienceRow
              key={experience.id}
              experience={experience}
              isLast={index === experiences.length - 1}
              locale={locale}
              onDelete={() =>
                onDelete({ id: experience.id, kind: "experience", label: experience.positionTitle })
              }
              onEdit={() => onEdit({ item: experience, kind: "experience" })}
            />
          ))}
        </ol>
      )}
    </SectionFrame>
  );
}

function ExperienceRow({
  experience,
  isLast,
  locale,
  onDelete,
  onEdit,
}: Readonly<{
  experience: CandidateExperienceApi;
  isLast: boolean;
  locale: string;
  onDelete: () => void;
  onEdit: () => void;
}>) {
  const technologies = splitTechnologies(experience.technologies);

  return (
    <li className={cn("relative ml-7 pb-9", isLast && "pb-0")}>
      <span className="absolute top-1.5 -left-[34px] size-3 rounded-full border-2 border-white bg-emerald-600 ring-1 ring-emerald-200" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-[-0.01em] text-slate-950">
            {experience.positionTitle}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {experience.companyName}
            {experience.employmentType ? ` · ${experience.employmentType}` : ""}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <CalendarBlank aria-hidden="true" size={15} />
            {formatDateRange(
              experience.startDate,
              experience.endDate,
              experience.isCurrent,
              locale,
            )}
          </p>
        </div>
        <RecordActions label={experience.positionTitle} onDelete={onDelete} onEdit={onEdit} />
      </div>
      {experience.description && (
        <p className="mt-4 max-w-3xl text-sm leading-6 whitespace-pre-line text-slate-600">
          {experience.description}
        </p>
      )}
      {technologies.length > 0 && <TechnologyList values={technologies} />}
    </li>
  );
}

export function ProjectsSection({ onDelete, onEdit, profile }: SectionProps) {
  const t = useTranslations("CandidateProfile.content");
  const locale = useLocale();
  const projects = sortByOrder(profile.projects);

  return (
    <SectionFrame
      action={
        <AddButton label={t("actions.addProject")} onClick={() => onEdit({ kind: "project" })} />
      }
      description={t("sections.projects.description")}
      title={t("sections.projects.title")}
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={<Code />}
          title={t("sections.projects.emptyTitle")}
          description={t("sections.projects.emptyDescription")}
          actionLabel={t("actions.addProject")}
          onAction={() => onEdit({ kind: "project" })}
        />
      ) : (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              locale={locale}
              onDelete={() => onDelete({ id: project.id, kind: "project", label: project.name })}
              onEdit={() => onEdit({ item: project, kind: "project" })}
            />
          ))}
        </div>
      )}
    </SectionFrame>
  );
}

function ProjectRow({
  locale,
  onDelete,
  onEdit,
  project,
}: Readonly<{
  locale: string;
  onDelete: () => void;
  onEdit: () => void;
  project: CandidateProjectApi;
}>) {
  const t = useTranslations("CandidateProfile.content");
  const technologies = splitTechnologies(project.technologies);
  return (
    <article className="py-6 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{project.name}</h3>
          {project.role && (
            <p className="mt-1 text-sm font-semibold text-emerald-700">{project.role}</p>
          )}
          {(project.startDate || project.endDate) && (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {formatDateRange(project.startDate, project.endDate, false, locale)}
            </p>
          )}
        </div>
        <RecordActions label={project.name} onDelete={onDelete} onEdit={onEdit} />
      </div>
      {project.description && (
        <p className="mt-4 max-w-3xl text-sm leading-6 whitespace-pre-line text-slate-600">
          {project.description}
        </p>
      )}
      {technologies.length > 0 && <TechnologyList values={technologies} />}
      {(project.projectUrl || project.deployUrl) && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-emerald-700">
          {project.projectUrl && (
            <ExternalLink
              href={project.projectUrl}
              label={t("forms.project.fields.projectUrl.label")}
            />
          )}
          {project.deployUrl && (
            <ExternalLink
              href={project.deployUrl}
              label={t("forms.project.fields.deployUrl.label")}
            />
          )}
        </div>
      )}
    </article>
  );
}

export function EducationSection({ onDelete, onEdit, profile }: SectionProps) {
  const t = useTranslations("CandidateProfile.content");
  const locale = useLocale();
  const educations = sortByOrder(profile.educations);

  return (
    <SectionFrame
      action={
        <AddButton
          label={t("actions.addEducation")}
          onClick={() => onEdit({ kind: "education" })}
        />
      }
      description={t("sections.education.description")}
      title={t("sections.education.title")}
    >
      {educations.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title={t("sections.education.emptyTitle")}
          description={t("sections.education.emptyDescription")}
          actionLabel={t("actions.addEducation")}
          onAction={() => onEdit({ kind: "education" })}
        />
      ) : (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {educations.map((education) => (
            <EducationRow
              key={education.id}
              education={education}
              locale={locale}
              onDelete={() =>
                onDelete({ id: education.id, kind: "education", label: education.schoolName })
              }
              onEdit={() => onEdit({ item: education, kind: "education" })}
            />
          ))}
        </div>
      )}
    </SectionFrame>
  );
}

function EducationRow({
  education,
  locale,
  onDelete,
  onEdit,
}: Readonly<{
  education: CandidateEducationApi;
  locale: string;
  onDelete: () => void;
  onEdit: () => void;
}>) {
  return (
    <article className="flex items-start gap-4 py-6 first:pt-0 last:pb-0">
      <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:flex">
        <GraduationCap aria-hidden="true" size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-950">{education.schoolName}</h3>
            {(education.degree || education.major) && (
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {[education.degree, education.major].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {formatDateRange(education.startDate, education.endDate, education.isCurrent, locale)}
            </p>
          </div>
          <RecordActions label={education.schoolName} onDelete={onDelete} onEdit={onEdit} />
        </div>
        {education.gpa !== null && (
          <p className="mt-3 text-sm font-semibold text-slate-600">GPA: {education.gpa}</p>
        )}
        {education.description && (
          <p className="mt-3 text-sm leading-6 whitespace-pre-line text-slate-600">
            {education.description}
          </p>
        )}
      </div>
    </article>
  );
}

export function SkillsSection({ onDelete, onEdit, profile }: SectionProps) {
  const t = useTranslations("CandidateProfile.content");
  const skills = sortByOrder(profile.skills);

  return (
    <SectionFrame
      action={<AddButton label={t("actions.addSkill")} onClick={() => onEdit({ kind: "skill" })} />}
      description={t("sections.skills.description")}
      title={t("sections.skills.title")}
    >
      {skills.length === 0 ? (
        <EmptyState
          icon={<Sparkle />}
          title={t("sections.skills.emptyTitle")}
          description={t("sections.skills.emptyDescription")}
          actionLabel={t("actions.addSkill")}
          onAction={() => onEdit({ kind: "skill" })}
        />
      ) : (
        <ul className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          {skills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              onDelete={() => onDelete({ id: skill.id, kind: "skill", label: skill.skill.name })}
              onEdit={() => onEdit({ item: skill, kind: "skill" })}
            />
          ))}
        </ul>
      )}
    </SectionFrame>
  );
}

function SkillRow({
  onDelete,
  onEdit,
  skill,
}: Readonly<{
  onDelete: () => void;
  onEdit: () => void;
  skill: CandidateSkillApi;
}>) {
  const t = useTranslations("CandidateProfile.content");
  return (
    <li className="flex items-center justify-between gap-4 bg-white px-4 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{skill.skill.name}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {t(`options.skillProficiency.${skill.proficiencyLevel}`)}
          {skill.yearsOfExperience !== null
            ? ` · ${t("forms.skill.yearsValue", { count: skill.yearsOfExperience })}`
            : ""}
        </p>
      </div>
      <RecordActions label={skill.skill.name} onDelete={onDelete} onEdit={onEdit} />
    </li>
  );
}

export function CredentialsSection({ onDelete, onEdit, profile }: SectionProps) {
  const t = useTranslations("CandidateProfile.content");
  const locale = useLocale();
  const certifications = sortByOrder(profile.certifications);

  return (
    <SectionFrame
      description={t("sections.credentials.description")}
      title={t("sections.credentials.title")}
    >
      <div className="space-y-10">
        <SubsectionHeader
          title={t("sections.credentials.certificationsTitle")}
          actionLabel={t("actions.addCertification")}
          onAction={() => onEdit({ kind: "certification" })}
        />
        {certifications.length > 0 ? (
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {certifications.map((certification) => (
              <CertificationRow
                key={certification.id}
                certification={certification}
                locale={locale}
                onDelete={() =>
                  onDelete({
                    id: certification.id,
                    kind: "certification",
                    label: certification.name,
                  })
                }
                onEdit={() => onEdit({ item: certification, kind: "certification" })}
              />
            ))}
          </div>
        ) : (
          <InlineEmpty
            description={t("sections.credentials.emptyDescription")}
            actionLabel={t("actions.addCertification")}
            onAction={() => onEdit({ kind: "certification" })}
          />
        )}
        <div className="border-t border-slate-200 pt-8">
          <SubsectionHeader
            title={t("sections.credentials.languagesTitle")}
            actionLabel={t("actions.addLanguage")}
            onAction={() => onEdit({ kind: "language" })}
          />
          {profile.languages.length > 0 ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {profile.languages.map((language) => (
                <LanguageRow
                  key={language.id}
                  language={language}
                  onDelete={() =>
                    onDelete({ id: language.id, kind: "language", label: language.language })
                  }
                  onEdit={() => onEdit({ item: language, kind: "language" })}
                />
              ))}
            </ul>
          ) : (
            <div className="mt-5">
              <InlineEmpty
                description={t("sections.credentials.emptyDescription")}
                actionLabel={t("actions.addLanguage")}
                onAction={() => onEdit({ kind: "language" })}
              />
            </div>
          )}
        </div>
      </div>
    </SectionFrame>
  );
}

function CertificationRow({
  certification,
  locale,
  onDelete,
  onEdit,
}: Readonly<{
  certification: CandidateCertificationApi;
  locale: string;
  onDelete: () => void;
  onEdit: () => void;
}>) {
  return (
    <article className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
        <Certificate aria-hidden="true" size={21} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-950">{certification.name}</h3>
            {certification.organization && (
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {certification.organization}
              </p>
            )}
            {certification.issuedDate && (
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {formatDateRange(
                  certification.issuedDate,
                  certification.expiredDate,
                  false,
                  locale,
                )}
              </p>
            )}
          </div>
          <RecordActions label={certification.name} onDelete={onDelete} onEdit={onEdit} />
        </div>
        {certification.credentialUrl && (
          <div className="mt-3">
            <ExternalLink href={certification.credentialUrl} label={certification.credentialUrl} />
          </div>
        )}
      </div>
    </article>
  );
}

function LanguageRow({
  language,
  onDelete,
  onEdit,
}: Readonly<{
  language: CandidateLanguageApi;
  onDelete: () => void;
  onEdit: () => void;
}>) {
  const t = useTranslations("CandidateProfile.content");
  const normalized = language.proficiency.toUpperCase();
  const proficiency = ["BASIC", "INTERMEDIATE", "PROFESSIONAL", "FLUENT", "NATIVE"].includes(
    normalized,
  )
    ? t(`options.languageProficiency.${normalized}`)
    : language.proficiency;
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Translate aria-hidden="true" className="shrink-0 text-slate-400" size={20} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{language.language}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{proficiency}</p>
        </div>
      </div>
      <RecordActions label={language.language} onDelete={onDelete} onEdit={onEdit} />
    </li>
  );
}

export function PreferencesSection({ onEdit, profile }: SectionProps) {
  const t = useTranslations("CandidateProfile.content");
  const locale = useLocale();
  const preference = profile.jobPreference;

  return (
    <SectionFrame
      action={
        <Button variant="outline" size="sm" onClick={() => onEdit({ kind: "preferences" })}>
          <PencilSimple aria-hidden="true" />
          {t("actions.editPreferences")}
        </Button>
      }
      description={t("sections.preferences.description")}
      title={t("sections.preferences.title")}
    >
      {!preference ? (
        <EmptyState
          icon={<Briefcase />}
          title={t("sections.preferences.emptyTitle")}
          description={t("sections.preferences.emptyDescription")}
          actionLabel={t("actions.editPreferences")}
          onAction={() => onEdit({ kind: "preferences" })}
        />
      ) : (
        <dl className="grid overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-2">
          <DefinitionItem
            label={t("forms.preferences.fields.desiredPosition.label")}
            value={preference.desiredPosition}
          />
          <DefinitionItem
            label={t("forms.preferences.fields.workingModel.label")}
            value={
              preference.workingModel ? t(`options.workingModel.${preference.workingModel}`) : null
            }
          />
          <DefinitionItem
            label={t("forms.preferences.salarySection")}
            value={formatSalaryRange(
              preference.desiredSalaryMin,
              preference.desiredSalaryMax,
              preference.salaryCurrency,
              locale,
            )}
          />
          <DefinitionItem
            label={t("forms.preferences.fields.noticePeriodDays.label")}
            value={
              preference.noticePeriodDays === null ? null : String(preference.noticePeriodDays)
            }
          />
          <DefinitionItem
            label={t("forms.preferences.fields.isRelocate.label")}
            value={preference.isRelocate ? "✓" : "—"}
          />
          <DefinitionItem
            label={t("forms.preferences.fields.desiredLevelId.label")}
            value={preference.desiredLevel?.name ?? null}
          />
        </dl>
      )}
    </SectionFrame>
  );
}

function SectionFrame({
  action,
  children,
  description,
  title,
}: Readonly<{
  action?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <section aria-labelledby="profile-section-title" className="min-w-0">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2
            id="profile-section-title"
            className="text-2xl font-bold tracking-[-0.025em] text-slate-950"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {action}
      </div>
      <div className="pt-7">{children}</div>
    </section>
  );
}

function ProfileBlock({
  action,
  children,
  icon,
  title,
}: Readonly<{
  action?: ReactNode;
  children: ReactNode;
  icon: ReactNode;
  title: string;
}>) {
  return (
    <div className="grid gap-4 py-7 first:pt-0 last:pb-0 md:grid-cols-[180px_1fr]">
      <div>
        <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
          <span className="text-slate-400 [&_svg]:size-[18px]">{icon}</span>
          {title}
        </div>
        {action && <div className="mt-3">{action}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function EmptyState({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: Readonly<{
  actionLabel: string;
  description: string;
  icon: ReactNode;
  onAction: () => void;
  title: string;
}>) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 [&_svg]:size-6">
        {icon}
      </span>
      <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      <Button size="sm" className="mt-5" onClick={onAction}>
        <Plus aria-hidden="true" />
        {actionLabel}
      </Button>
    </div>
  );
}

function InlineEmpty({
  actionLabel,
  description,
  onAction,
}: Readonly<{
  actionLabel: string;
  description: string;
  onAction: () => void;
}>) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-4">
      <p className="text-sm leading-6 text-slate-600">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="focus-visible:outline-brand mt-2 rounded-md text-sm font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-3"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function MissingValue({ icon, label }: Readonly<{ icon: ReactNode; label: string }>) {
  return (
    <span className="flex items-center gap-3 text-sm font-medium text-slate-400">
      <span className="[&_svg]:size-[18px]">{icon}</span>
      {label}: —
    </span>
  );
}

function AddButton({ label, onClick }: Readonly<{ label: string; onClick: () => void }>) {
  return (
    <Button size="sm" onClick={onClick}>
      <Plus aria-hidden="true" />
      {label}
    </Button>
  );
}

function RecordActions({
  label,
  onDelete,
  onEdit,
}: Readonly<{ label: string; onDelete: () => void; onEdit: () => void }>) {
  const t = useTranslations("CandidateProfile.content");
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`${t("actions.edit")}: ${label}`}
        className="focus-visible:outline-brand rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <PencilSimple aria-hidden="true" size={17} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`${t("actions.delete")}: ${label}`}
        className="focus-visible:outline-brand rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Trash aria-hidden="true" size={17} />
      </button>
    </div>
  );
}

function TechnologyList({ values }: Readonly<{ values: string[] }>) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {values.map((value) => (
        <li
          key={value}
          className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
        >
          {value}
        </li>
      ))}
    </ul>
  );
}

function ExternalLink({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="focus-visible:outline-brand inline-flex max-w-full items-center gap-1.5 rounded-md text-sm font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-3"
    >
      <span className="truncate">{label}</span>
      <ArrowSquareOut aria-hidden="true" className="shrink-0" size={16} />
    </a>
  );
}

function SubsectionHeader({
  actionLabel,
  onAction,
  title,
}: Readonly<{ actionLabel: string; onAction: () => void; title: string }>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <Button variant="ghost" size="sm" onClick={onAction}>
        <Plus aria-hidden="true" />
        {actionLabel}
      </Button>
    </div>
  );
}

function DefinitionItem({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return (
    <div className="border-b border-slate-200 px-5 py-5 last:border-b-0 odd:sm:border-r sm:[&:nth-last-child(-n+2)]:border-b-0">
      <dt className="text-xs font-bold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className={cn("mt-2 text-sm font-bold", value ? "text-slate-900" : "text-slate-400")}>
        {value || "—"}
      </dd>
    </div>
  );
}

function LinkTypeIcon({ type }: Readonly<{ type: string }>) {
  const normalized = type.toUpperCase();
  const Icon =
    normalized === "GITHUB"
      ? GithubLogo
      : normalized === "LINKEDIN"
        ? LinkedinLogo
        : normalized === "WEBSITE"
          ? Globe
          : LinkSimple;
  return <Icon aria-hidden="true" className="shrink-0 text-slate-400" size={20} />;
}

function formatLinkType(type: string, t: ReturnType<typeof useTranslations>) {
  const normalized = type.toUpperCase();
  return ["WEBSITE", "PORTFOLIO", "LINKEDIN", "GITHUB", "OTHER"].includes(normalized)
    ? t(`options.linkType.${normalized}`)
    : type;
}

function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
  locale: string,
) {
  const formatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    year: "numeric",
  });
  const start = startDate ? formatter.format(new Date(startDate)) : "—";
  const end = isCurrent
    ? locale === "vi"
      ? "Hiện nay"
      : "Present"
    : endDate
      ? formatter.format(new Date(endDate))
      : "—";
  return `${start} – ${end}`;
}

function formatSalaryRange(
  minimum: string | number | null,
  maximum: string | number | null,
  currency: string,
  locale: string,
) {
  if (minimum === null && maximum === null) return null;
  const formatter = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: 0,
  });
  const min = minimum === null ? "—" : formatter.format(Number(minimum));
  const max = maximum === null ? "—" : formatter.format(Number(maximum));
  return `${min} – ${max} ${currency}`;
}
