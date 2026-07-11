"use client";

import { Briefcase, EnvelopeSimple, Eye, LockKey, MapPin, Phone } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";

import type { CandidateProfileApi } from "@/features/candidate/api/profile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { getInitials, sortByOrder, splitTechnologies } from "./profile-model";

type ProfilePreviewProps = Readonly<{
  onOpenChange: (open: boolean) => void;
  open: boolean;
  profile: CandidateProfileApi;
}>;

export function ProfilePreview({ onOpenChange, open, profile }: ProfilePreviewProps) {
  const t = useTranslations("CandidateProfile.content");
  const locale = useLocale();
  const desiredPosition = profile.jobPreference?.desiredPosition;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={t("actions.close")}
        className="flex max-h-[92dvh] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0"
      >
        <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-14 sm:px-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-emerald-700 uppercase">
            <Eye aria-hidden="true" size={16} />
            {t("recruiterPreview.previewLabel")}
          </div>
          <DialogTitle className="mt-2 text-xl">{t("recruiterPreview.title")}</DialogTitle>
          <DialogDescription className="mt-1 max-w-2xl leading-6">
            {t("recruiterPreview.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-8 sm:py-7">
          {profile.profileVisibility === "PRIVATE" && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-900">
              <LockKey aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
              <div>
                <p className="text-sm font-bold">{t("recruiterPreview.privateNoticeTitle")}</p>
                <p className="mt-1 text-xs leading-5 font-medium text-amber-800">
                  {t("recruiterPreview.privateNoticeDescription")}
                </p>
              </div>
            </div>
          )}

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <header className="border-b border-slate-200 px-5 py-7 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-bold text-white">
                  {getInitials(profile.account.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold tracking-[-0.025em] text-slate-950">
                    {profile.account.fullName}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    {desiredPosition || t("header.headlineFallback")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                    {profile.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin aria-hidden="true" size={15} />
                        {profile.address}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <EnvelopeSimple aria-hidden="true" size={15} />
                      {profile.account.email}
                    </span>
                    {profile.phoneNumber && (
                      <span className="flex items-center gap-1.5">
                        <Phone aria-hidden="true" size={15} />
                        {profile.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div className="divide-y divide-slate-200 px-5 sm:px-8">
              <PreviewSection title={t("recruiterPreview.aboutTitle")}>
                <p className="text-sm leading-7 whitespace-pre-line text-slate-700">
                  {profile.description || t("recruiterPreview.noSummary")}
                </p>
              </PreviewSection>

              <PreviewSection title={t("sections.skills.title")}>
                {profile.skills.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <li
                        key={skill.id}
                        className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700"
                      >
                        {skill.skill.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <PreviewEmpty>{t("recruiterPreview.noSkills")}</PreviewEmpty>
                )}
              </PreviewSection>

              <PreviewSection title={t("sections.experience.title")}>
                {profile.experiences.length > 0 ? (
                  <div className="space-y-6">
                    {sortByOrder(profile.experiences).map((experience) => (
                      <div key={experience.id}>
                        <h4 className="font-bold text-slate-950">{experience.positionTitle}</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {experience.companyName}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {formatDateRange(
                            experience.startDate,
                            experience.endDate,
                            experience.isCurrent,
                            locale,
                          )}
                        </p>
                        {experience.description && (
                          <p className="mt-3 text-sm leading-6 whitespace-pre-line text-slate-600">
                            {experience.description}
                          </p>
                        )}
                        {experience.technologies && (
                          <p className="mt-3 text-xs font-semibold text-slate-500">
                            {splitTechnologies(experience.technologies).join(" · ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <PreviewEmpty>{t("recruiterPreview.noExperience")}</PreviewEmpty>
                )}
              </PreviewSection>

              <PreviewSection title={t("sections.projects.title")}>
                {profile.projects.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {sortByOrder(profile.projects).map((project) => (
                      <div key={project.id} className="rounded-xl border border-slate-200 p-4">
                        <h4 className="font-bold text-slate-950">{project.name}</h4>
                        {project.role && (
                          <p className="mt-1 text-xs font-bold text-emerald-700">{project.role}</p>
                        )}
                        {project.description && (
                          <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                            {project.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <PreviewEmpty>{t("recruiterPreview.noProjects")}</PreviewEmpty>
                )}
              </PreviewSection>

              <PreviewSection title={t("sections.education.title")}>
                {profile.educations.length > 0 ? (
                  <div className="space-y-5">
                    {sortByOrder(profile.educations).map((education) => (
                      <div key={education.id} className="flex items-start gap-3">
                        <Briefcase
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-slate-400"
                          size={18}
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-950">
                            {education.schoolName}
                          </h4>
                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            {[education.degree, education.major].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PreviewEmpty>{t("recruiterPreview.noEducation")}</PreviewEmpty>
                )}
              </PreviewSection>

              {profile.links.length > 0 && (
                <PreviewSection title={t("recruiterPreview.contactTitle")}>
                  <div className="flex flex-wrap gap-4">
                    {profile.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-visible:outline-brand rounded-md text-sm font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-3"
                      >
                        {link.type}
                      </a>
                    ))}
                  </div>
                </PreviewSection>
              )}
            </div>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewSection({
  children,
  title,
}: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <section className="grid gap-4 py-6 md:grid-cols-[150px_1fr]">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function PreviewEmpty({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="text-sm text-slate-500 italic">{children}</p>;
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
