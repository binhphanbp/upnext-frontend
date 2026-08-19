"use client";

import {
  ArrowSquareOut,
  Briefcase,
  CircleNotch,
  DownloadSimple,
  Envelope,
  Eye,
  FileText,
  GraduationCap,
  IdentificationCard,
  MapPin,
  Phone,
  Sparkle,
  Target,
  Translate,
  WarningCircle,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { type ReactNode, useEffect, useState } from "react";

import {
  getApplicationDetail,
  type Application,
  type ApplicationDetail,
} from "@/features/recruiter/api/team";
import type { Locale } from "@/i18n/routing";
import { toDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

const GENDER_LABEL: Record<string, { vi: string; en: string }> = {
  MALE: { vi: "Nam", en: "Male" },
  FEMALE: { vi: "Nữ", en: "Female" },
};

const JOB_SEARCH_STATUS_LABEL: Record<string, { vi: string; en: string }> = {
  OPEN_TO_WORK: { vi: "Sẵn sàng nhận cơ hội", en: "Open to work" },
  NOT_LOOKING: { vi: "Không tìm việc", en: "Not looking" },
};

const PROFILE_VISIBILITY_LABEL: Record<string, { vi: string; en: string }> = {
  PUBLIC: { vi: "Công khai với nhà tuyển dụng", en: "Public to recruiters" },
  PRIVATE: { vi: "Riêng tư", en: "Private" },
};

const PROFICIENCY_LABEL: Record<string, { vi: string; en: string }> = {
  BEGINNER: { vi: "Mới bắt đầu", en: "Beginner" },
  INTERMEDIATE: { vi: "Trung bình", en: "Intermediate" },
  ADVANCED: { vi: "Khá", en: "Advanced" },
  EXPERT: { vi: "Chuyên gia", en: "Expert" },
};

const WORKING_MODEL_LABEL: Record<string, { vi: string; en: string }> = {
  ONSITE: { vi: "Làm tại văn phòng", en: "On-site" },
  REMOTE: { vi: "Làm từ xa", en: "Remote" },
  HYBRID: { vi: "Kết hợp", en: "Hybrid" },
};

function pickLabel(
  map: Record<string, { vi: string; en: string }>,
  key: string | null,
  vi: boolean,
) {
  if (!key) return "—";
  const entry = map[key];
  if (!entry) return key;
  return vi ? entry.vi : entry.en;
}

function formatMonthYear(value: string | null) {
  if (!value) return "";
  try {
    return format(toDate(value), "MM/yyyy");
  } catch {
    return "";
  }
}

function formatFullDate(value: string | null) {
  if (!value) return null;
  try {
    return format(toDate(value), "dd/MM/yyyy");
  } catch {
    return null;
  }
}

function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
  vi: boolean,
) {
  const start = formatMonthYear(startDate);
  const end = isCurrent ? (vi ? "Hiện tại" : "Present") : formatMonthYear(endDate);
  if (!start && !end) return null;
  return `${start || "—"} — ${end || "—"}`;
}

function formatMoney(value: string | number | null) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return null;
  return num.toLocaleString("vi-VN");
}

/** Luôn hiện tiêu đề mục dù rỗng — khớp cách trang "Hồ sơ" của ứng viên luôn
 * hiện đủ 8 mục ở sidebar kể cả chưa có dữ liệu, để recruiter biết chắc mục đó
 * ứng viên chưa điền chứ không phải do popup này thiếu. */
function Section({
  title,
  icon,
  isEmpty,
  emptyText = "",
  children,
}: {
  title: string;
  icon: ReactNode;
  isEmpty: boolean;
  emptyText?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">
        {icon}
        {title}
      </h4>
      {isEmpty ? <p className="text-sm text-slate-400 italic">{emptyText}</p> : children}
    </section>
  );
}

type CandidateProfileDetailDialogProps = Readonly<{
  applicationId: string | null;
  onOpenChange: (open: boolean) => void;
  token: string;
  locale: Locale;
  resolveCvUrl: (app: Application) => string;
  onDownloadCv: (fileUrl: string, fileName: string) => void;
  onQuickView: (app: Application, title: string) => void;
}>;

/**
 * Popup "Xem chi tiết hồ sơ ứng viên" — cấu trúc mục khớp với trang "Hồ sơ" của
 * chính ứng viên (Tổng quan / Kinh nghiệm / Dự án / Học vấn / Kỹ năng /
 * Chứng chỉ & ngôn ngữ / CV & tài liệu / Mong muốn việc làm), luôn hiện đủ các
 * mục kể cả rỗng để không bị hiểu nhầm là thiếu dữ liệu. Lấy từ
 * `GET /applications/:id`, endpoint duy nhất trả đủ các trường này cho
 * recruiter (đã bổ sung ở backend).
 */
export function CandidateProfileDetailDialog({
  applicationId,
  onOpenChange,
  token,
  locale,
  resolveCvUrl,
  onDownloadCv,
  onQuickView,
}: CandidateProfileDetailDialogProps) {
  const vi = locale === "vi";
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) {
      setDetail(null);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    getApplicationDetail(token, applicationId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active) {
          setError(
            vi
              ? "Không tải được hồ sơ ứng viên. Vui lòng thử lại."
              : "Could not load the candidate profile. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applicationId, token, vi]);

  const profile = detail?.candidateProfile;
  const name = profile?.account.fullName ?? (vi ? "Ẩn danh" : "Anonymous");
  const jobPreference = profile?.jobPreference;
  const hasJobPreference =
    !!jobPreference &&
    (jobPreference.desiredPosition ||
      formatMoney(jobPreference.desiredSalaryMin) ||
      formatMoney(jobPreference.desiredSalaryMax) ||
      jobPreference.workingModel ||
      jobPreference.desiredLevel ||
      jobPreference.noticePeriodDays !== null);

  return (
    <Dialog open={applicationId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5 pr-8">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <IdentificationCard size={20} weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base font-bold text-slate-900">
                {name}
              </DialogTitle>
              <p className="truncate text-xs font-medium text-slate-500">{detail?.jobPost.title}</p>
            </div>
            {profile ? (
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <Badge tone={profile.jobSearchStatus === "OPEN_TO_WORK" ? "success" : "neutral"}>
                  {pickLabel(JOB_SEARCH_STATUS_LABEL, profile.jobSearchStatus, vi)}
                </Badge>
                <Badge tone="info">
                  {pickLabel(PROFILE_VISIBILITY_LABEL, profile.profileVisibility, vi)}
                </Badge>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm font-bold text-slate-500">
              <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
              {vi ? "Đang tải..." : "Loading..."}
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
              <WarningCircle size={28} className="text-rose-500" />
              <p className="text-sm font-semibold text-slate-700">{error}</p>
            </div>
          ) : detail && profile ? (
            <div className="space-y-6">
              {/* Tổng quan: liên hệ + giới thiệu + liên kết — khớp mục "Tổng quan"
                  đầu tiên của trang hồ sơ ứng viên. */}
              <Section
                title={vi ? "Tổng quan" : "Overview"}
                icon={<IdentificationCard size={14} />}
                isEmpty={false}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Envelope size={16} className="text-slate-400" />
                      {profile.account.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Phone size={16} className="text-slate-400" />
                      {profile.phoneNumber || (vi ? "Chưa cập nhật SĐT" : "No phone number")}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <MapPin size={16} className="text-slate-400" />
                      {profile.address || (vi ? "Chưa cập nhật địa điểm" : "No location")}
                    </span>
                    {profile.gender ? (
                      <span className="text-sm font-medium text-slate-700">
                        {pickLabel(GENDER_LABEL, profile.gender, vi)}
                      </span>
                    ) : null}
                    {formatFullDate(profile.birthdate) ? (
                      <span className="text-sm font-medium text-slate-700">
                        {vi ? "Sinh: " : "Born: "}
                        {formatFullDate(profile.birthdate)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm break-words whitespace-pre-wrap text-slate-700">
                    {profile.description || (
                      <span className="text-slate-400 italic">
                        {vi
                          ? "Ứng viên chưa viết phần giới thiệu bản thân."
                          : "No self-introduction provided."}
                      </span>
                    )}
                  </p>
                  {profile.links.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {profile.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline"
                        >
                          {link.type} <ArrowSquareOut size={12} />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      {vi ? "Chưa có liên kết nghề nghiệp." : "No professional links."}
                    </p>
                  )}
                </div>
              </Section>

              <Section
                title={vi ? "Kinh nghiệm làm việc" : "Work experience"}
                icon={<Briefcase size={14} />}
                isEmpty={profile.experiences.length === 0}
                emptyText={vi ? "Chưa có kinh nghiệm làm việc." : "No work experience added."}
              >
                <div className="space-y-3">
                  {profile.experiences.map((exp) => (
                    <div key={exp.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800">
                          {exp.positionTitle} — {exp.companyName}
                        </p>
                        <span className="text-xs font-medium text-slate-500">
                          {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent, vi)}
                        </span>
                      </div>
                      {exp.description ? (
                        <p className="mt-1 text-sm break-words whitespace-pre-wrap text-slate-600">
                          {exp.description}
                        </p>
                      ) : null}
                      {exp.technologies ? (
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {exp.technologies}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title={vi ? "Dự án" : "Projects"}
                icon={<Sparkle size={14} />}
                isEmpty={profile.projects.length === 0}
                emptyText={vi ? "Chưa có dự án." : "No projects added."}
              >
                <div className="space-y-3">
                  {profile.projects.map((project) => (
                    <div key={project.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800">
                          {project.name}
                          {project.role ? ` — ${project.role}` : ""}
                        </p>
                        <span className="text-xs font-medium text-slate-500">
                          {formatDateRange(project.startDate, project.endDate, false, vi)}
                        </span>
                      </div>
                      {project.description ? (
                        <p className="mt-1 text-sm break-words whitespace-pre-wrap text-slate-600">
                          {project.description}
                        </p>
                      ) : null}
                      {project.technologies ? (
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {project.technologies}
                        </p>
                      ) : null}
                      <div className="mt-1 flex gap-3">
                        {project.projectUrl ? (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                          >
                            {vi ? "Xem dự án" : "View project"} <ArrowSquareOut size={12} />
                          </a>
                        ) : null}
                        {project.deployUrl ? (
                          <a
                            href={project.deployUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                          >
                            Demo <ArrowSquareOut size={12} />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title={vi ? "Học vấn" : "Education"}
                icon={<GraduationCap size={14} />}
                isEmpty={profile.educations.length === 0}
                emptyText={vi ? "Chưa có học vấn." : "No education added."}
              >
                <div className="space-y-3">
                  {profile.educations.map((edu) => (
                    <div key={edu.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800">
                          {edu.schoolName}
                          {edu.major ? ` — ${edu.major}` : ""}
                        </p>
                        <span className="text-xs font-medium text-slate-500">
                          {formatDateRange(edu.startDate, edu.endDate, edu.isCurrent, vi)}
                        </span>
                      </div>
                      {edu.degree ? (
                        <p className="text-xs font-semibold text-slate-500">{edu.degree}</p>
                      ) : null}
                      {edu.gpa ? (
                        <p className="text-xs font-semibold text-slate-500">GPA: {edu.gpa}</p>
                      ) : null}
                      {edu.description ? (
                        <p className="mt-1 text-sm break-words whitespace-pre-wrap text-slate-600">
                          {edu.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title={vi ? "Kỹ năng" : "Skills"}
                icon={<Sparkle size={14} />}
                isEmpty={profile.skills.length === 0}
                emptyText={vi ? "Chưa có kỹ năng." : "No skills added."}
              >
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((item) => (
                    <Badge key={item.id} tone="neutral">
                      {item.skill.name} · {pickLabel(PROFICIENCY_LABEL, item.proficiencyLevel, vi)}
                      {item.yearsOfExperience
                        ? ` · ${Number(item.yearsOfExperience)} ${vi ? "năm" : "yrs"}`
                        : ""}
                    </Badge>
                  ))}
                </div>
              </Section>

              {/* Chứng chỉ & ngôn ngữ — gộp chung khớp mục tương ứng ở trang hồ sơ. */}
              <Section
                title={vi ? "Chứng chỉ & ngôn ngữ" : "Certifications & languages"}
                icon={<Translate size={14} />}
                isEmpty={profile.certifications.length === 0 && profile.languages.length === 0}
                emptyText={
                  vi ? "Chưa có chứng chỉ hoặc ngôn ngữ." : "No certifications or languages."
                }
              >
                <div className="space-y-3">
                  {profile.certifications.length > 0 ? (
                    <div className="space-y-2">
                      {profile.certifications.map((cert) => (
                        <div key={cert.id} className="text-sm text-slate-700">
                          <span className="font-bold text-slate-800">{cert.name}</span>
                          {cert.organization ? ` — ${cert.organization}` : ""}
                          {cert.issuedDate ? ` (${formatMonthYear(cert.issuedDate)})` : ""}
                          {cert.credentialUrl ? (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                            >
                              {vi ? "Xem" : "View"} <ArrowSquareOut size={12} />
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      {vi ? "Chưa có chứng chỉ." : "No certifications."}
                    </p>
                  )}
                  {profile.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.languages.map((lang) => (
                        <Badge key={lang.id} tone="neutral">
                          {lang.language} · {lang.proficiency}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      {vi ? "Chưa có ngôn ngữ." : "No languages."}
                    </p>
                  )}
                </div>
              </Section>

              <Section
                title={vi ? "CV & tài liệu" : "CV & documents"}
                icon={<FileText size={14} />}
                isEmpty={!detail.cvVersion}
                emptyText={
                  vi ? "Ứng viên chưa nộp CV cho đơn này." : "No CV submitted for this application."
                }
              >
                {detail.cvVersion ? (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {detail.cvVersion.fileName}
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        onClick={() =>
                          onDownloadCv(resolveCvUrl(detail), detail.cvVersion.fileName)
                        }
                        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        <DownloadSimple size={16} />
                        {vi ? "Tải" : "Download"}
                      </button>
                      <span className="h-4 w-px bg-slate-300" />
                      <button
                        onClick={() => onQuickView(detail, name)}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        <Eye size={16} />
                        {vi ? "Xem nhanh" : "Quick view"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </Section>

              <Section
                title={vi ? "Mong muốn việc làm" : "Job preferences"}
                icon={<Target size={14} />}
                isEmpty={!hasJobPreference}
                emptyText={
                  vi ? "Ứng viên chưa thiết lập mong muốn việc làm." : "No job preferences set."
                }
              >
                {jobPreference ? (
                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {jobPreference.desiredPosition ? (
                      <p>
                        <span className="font-semibold">{vi ? "Vị trí: " : "Position: "}</span>
                        {jobPreference.desiredPosition}
                      </p>
                    ) : null}
                    {formatMoney(jobPreference.desiredSalaryMin) ||
                    formatMoney(jobPreference.desiredSalaryMax) ? (
                      <p>
                        <span className="font-semibold">{vi ? "Mức lương: " : "Salary: "}</span>
                        {formatMoney(jobPreference.desiredSalaryMin) ?? "?"} –{" "}
                        {formatMoney(jobPreference.desiredSalaryMax) ?? "?"}{" "}
                        {jobPreference.salaryCurrency}
                      </p>
                    ) : null}
                    {jobPreference.workingModel ? (
                      <p>
                        <span className="font-semibold">
                          {vi ? "Hình thức làm việc: " : "Working model: "}
                        </span>
                        {pickLabel(WORKING_MODEL_LABEL, jobPreference.workingModel, vi)}
                      </p>
                    ) : null}
                    {jobPreference.desiredLevel ? (
                      <p>
                        <span className="font-semibold">{vi ? "Cấp bậc: " : "Level: "}</span>
                        {jobPreference.desiredLevel.name}
                      </p>
                    ) : null}
                    {jobPreference.noticePeriodDays !== null ? (
                      <p>
                        <span className="font-semibold">
                          {vi ? "Thời gian báo trước: " : "Notice period: "}
                        </span>
                        {jobPreference.noticePeriodDays} {vi ? "ngày" : "days"}
                      </p>
                    ) : null}
                    <p>
                      <span className="font-semibold">
                        {vi ? "Sẵn sàng chuyển chỗ ở: " : "Open to relocate: "}
                      </span>
                      {jobPreference.isRelocate ? (vi ? "Có" : "Yes") : vi ? "Không" : "No"}
                    </p>
                  </div>
                ) : null}
              </Section>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
