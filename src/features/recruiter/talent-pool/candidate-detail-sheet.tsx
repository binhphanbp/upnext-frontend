"use client";

import {
  Buildings,
  Download,
  EnvelopeSimple,
  GraduationCap,
  LockKey,
  Phone,
  Sparkle,
} from "@phosphor-icons/react";

import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Skeleton } from "@/shared/ui/skeleton";

import type { TalentPoolDetail } from "./api";

export type CandidateDetailSheetCopy = Readonly<{
  title: string;
  generalInfoHeading: string;
  addressLabel: string;
  birthdateLabel: string;
  desiredPositionLabel: string;
  workingModelLabel: string;
  desiredLevelLabel: string;
  maskedNotice: string;
  upgradeAction: string;
  downloadCv: string;
  downloading: string;
  noContactInfo: string;
  experienceHeading: string;
  educationHeading: string;
  projectsHeading: string;
  certificationsHeading: string;
  languagesHeading: string;
  noSourceFile: string;
  current: string;
}>;

export type CandidateDetailSheetProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: TalentPoolDetail | null;
  loading: boolean;
  copy: CandidateDetailSheetCopy;
  onUpgrade: () => void;
  onDownloadCv: () => void;
  downloadingCv: boolean;
}>;

/**
 * Chi tiết hồ sơ trong Kho CV.
 *
 * Chỉ `ContactBlock` (email/SĐT) phụ thuộc `detail.unlocked` -- mọi thứ khác
 * (`GeneralInfoBlock`, kinh nghiệm, học vấn, dự án...) luôn hiện, vì backend
 * luôn trả chúng bất kể gói. Component không tự suy luận che/hiện gì thêm,
 * chỉ render đúng những field mà server quyết định gửi hay để `null`.
 */
export function CandidateDetailSheet({
  open,
  onOpenChange,
  detail,
  loading,
  copy,
  onUpgrade,
  onDownloadCv,
  downloadingCv,
}: CandidateDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-3.5">
            {detail?.avatarUrl ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-200 shadow-xs">
                {/* oxlint-disable-next-line next/no-img-element */}
                <img
                  src={detail.avatarUrl}
                  alt={detail.fullName}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-left text-lg">
                {detail?.fullName ?? copy.title}
              </SheetTitle>
              {detail?.description ? (
                <SheetDescription className="line-clamp-2 text-left">
                  {detail.description}
                </SheetDescription>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        {loading || !detail ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <GeneralInfoBlock detail={detail} copy={copy} />
            <ContactBlock detail={detail} copy={copy} onUpgrade={onUpgrade} />

            {detail.unlocked ? (
              <Button
                size="sm"
                variant="outline"
                disabled={downloadingCv}
                onClick={onDownloadCv}
                className="w-full"
              >
                <Download size={16} aria-hidden />
                {downloadingCv ? copy.downloading : copy.downloadCv}
              </Button>
            ) : null}

            {detail.experiences.length > 0 ? (
              <Section heading={copy.experienceHeading} icon={<Buildings size={16} aria-hidden />}>
                <ul className="space-y-3">
                  {detail.experiences.map((row, index) => (
                    <li key={`${row.companyName}-${index}`} className="text-sm">
                      <p className="font-medium text-slate-900">
                        {row.positionTitle} · {row.companyName}
                        {row.isCurrent ? (
                          <Badge tone="success" className="ml-2 align-middle">
                            {copy.current}
                          </Badge>
                        ) : null}
                      </p>
                      {row.description ? (
                        <p className="mt-1 text-slate-600">{row.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {detail.educations.length > 0 ? (
              <Section
                heading={copy.educationHeading}
                icon={<GraduationCap size={16} aria-hidden />}
              >
                <ul className="space-y-2 text-sm">
                  {detail.educations.map((row, index) => (
                    <li key={`${row.schoolName}-${index}`}>
                      <p className="font-medium text-slate-900">
                        {row.schoolName}
                        {row.degree ? ` · ${row.degree}` : ""}
                      </p>
                      {row.major ? <p className="text-slate-600">{row.major}</p> : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {detail.projects.length > 0 ? (
              <Section heading={copy.projectsHeading} icon={<Sparkle size={16} aria-hidden />}>
                <ul className="space-y-2 text-sm">
                  {detail.projects.map((row, index) => (
                    <li key={`${row.name}-${index}`}>
                      <p className="font-medium text-slate-900">{row.name}</p>
                      {row.description ? <p className="text-slate-600">{row.description}</p> : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {detail.certifications.length > 0 ? (
              <Section heading={copy.certificationsHeading}>
                <ul className="flex flex-wrap gap-1.5">
                  {detail.certifications.map((row, index) => (
                    <li key={`${row.name}-${index}`}>
                      <Badge tone="info">{row.name}</Badge>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {detail.languages.length > 0 ? (
              <Section heading={copy.languagesHeading}>
                <ul className="flex flex-wrap gap-1.5">
                  {detail.languages.map((row) => (
                    <li key={row.language}>
                      <Badge tone="neutral">
                        {row.language} · {row.proficiency}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Thông tin chung -- LUÔN hiện, kể cả chưa mua gói. Địa chỉ, ngày sinh, mong
 * muốn nghề nghiệp không nằm trong tập bị che; chỉ hai kênh liên hệ trực tiếp
 * (email/SĐT) mới đổi tiền để xem, xử lý riêng ở `ContactBlock` bên dưới.
 */
function GeneralInfoBlock({
  detail,
  copy,
}: {
  detail: TalentPoolDetail;
  copy: CandidateDetailSheetCopy;
}) {
  const rows: ReadonlyArray<[string, string | null]> = [
    [copy.desiredPositionLabel, detail.jobPreference?.desiredPosition ?? null],
    [copy.workingModelLabel, detail.jobPreference?.workingModel ?? null],
    [copy.desiredLevelLabel, detail.jobPreference?.desiredLevel?.name ?? null],
    [copy.birthdateLabel, detail.birthdate ? formatAppDate(detail.birthdate) : null],
    [copy.addressLabel, detail.address],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  if (!rows.length) return null;

  return (
    <Section heading={copy.generalInfoHeading}>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="border-border flex justify-between gap-2 border-b pb-1.5">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function ContactBlock({
  detail,
  copy,
  onUpgrade,
}: {
  detail: TalentPoolDetail;
  copy: CandidateDetailSheetCopy;
  onUpgrade: () => void;
}) {
  if (!detail.unlocked) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
        <LockKey size={20} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm text-slate-700">{copy.maskedNotice}</p>
          <Button size="sm" className="mt-3" onClick={onUpgrade}>
            {copy.upgradeAction}
          </Button>
        </div>
      </div>
    );
  }

  const hasContact = detail.email || detail.phoneNumber;
  if (!hasContact) {
    return <p className="text-sm text-slate-500">{copy.noContactInfo}</p>;
  }

  return (
    <div className="space-y-1.5 rounded-xl bg-emerald-50 p-4">
      {detail.email ? (
        <p className="flex items-center gap-1.5 text-sm text-slate-700">
          <EnvelopeSimple size={14} aria-hidden />
          {detail.email}
        </p>
      ) : null}
      {detail.phoneNumber ? (
        <p className="flex items-center gap-1.5 text-sm text-slate-700">
          <Phone size={14} aria-hidden />
          {detail.phoneNumber}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  heading,
  icon,
  children,
}: {
  heading: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {icon}
        {heading}
      </h3>
      {children}
    </section>
  );
}
