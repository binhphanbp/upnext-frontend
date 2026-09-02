"use client";

import {
  ArrowLeft,
  BookmarkSimple,
  Briefcase,
  Buildings,
  CalendarBlank,
  Check,
  CurrencyDollar,
  DownloadSimple,
  EnvelopeSimple,
  FilePdf,
  GraduationCap,
  LockKey,
  MapPin,
  PaperPlaneTilt,
  Phone,
  ShareNetwork,
  Sparkle,
  User,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import Swal from "sweetalert2";

import { Link, useRouter } from "@/i18n/navigation";
import { formatAppDate, formatRelativeTime } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

import { getRecruiterSession } from "../session";
import {
  getCvDownloadUrl,
  getTalentPoolCapabilities,
  viewTalentPoolDetail,
  type TalentPoolDetail,
} from "./api";
import { SendInvitationDialog } from "./send-invitation-dialog";

export function RecruiterCandidateDetailPage({
  candidateProfileId,
}: {
  candidateProfileId: string;
}) {
  const t = useTranslations("Recruiter.talentPool");
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 1. Quota & Capabilities
  const capabilitiesQuery = useQuery({
    queryKey: ["recruiter", "talent-pool", "capabilities"],
    queryFn: async () => {
      const session = getRecruiterSession();
      if (!session) throw new Error("No recruiter session");
      return getTalentPoolCapabilities(session.accessToken);
    },
    staleTime: 30_000,
  });

  // 2. Candidate Detail
  const detailQuery = useQuery({
    queryKey: ["recruiter", "talent-pool", "candidate", candidateProfileId],
    queryFn: async () => {
      const session = getRecruiterSession();
      if (!session) throw new Error("No recruiter session");
      const res = await viewTalentPoolDetail(candidateProfileId, session.accessToken);
      return res.data;
    },
  });

  // 3. CV Download Mutation
  const cvDownload = useMutation({
    mutationFn: async () => {
      const session = getRecruiterSession();
      if (!session) throw new Error("No recruiter session");
      return getCvDownloadUrl(candidateProfileId, session.accessToken);
    },
    onSuccess: (data) => {
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t("errors.generic");
      void Swal.fire({
        icon: "error",
        title: t("errors.downloadTitle"),
        text: message,
        confirmButtonColor: "#10a778",
      });
    },
  });

  const [hasSentInvite, setHasSentInvite] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const isInvited = Boolean(detailQuery.data?.hasInvited || hasSentInvite);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: t("detail.shareCopied"),
        showConfirmButton: false,
        timer: 2000,
      });
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    void Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: isSaved ? t("card.saveCandidate") : t("card.savedCandidate"),
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const handleInvite = () => {
    if (isInvited) return;
    setIsInviteDialogOpen(true);
  };

  const handleContactUnlock = () => {
    void Swal.fire({
      title: "Mở khoá thông tin liên hệ",
      html: `
        <p class="text-sm text-slate-600 mb-3">Xem đầy đủ số điện thoại, email và tải CV gốc của ứng viên này.</p>
        <div class="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-sm font-medium">Chi phí: 2 điểm hồ sơ / lượt xem</div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận mở khoá",
      cancelButtonText: "Huỷ",
      confirmButtonColor: "#10a778",
    }).then((result) => {
      if (result.isConfirmed) {
        void Swal.fire({
          icon: "info",
          title: "Nâng cấp gói dịch vụ",
          text: "Vui lòng nâng cấp gói tuyển dụng hoặc mua thêm điểm xem hồ sơ để thực hiện thao tác này.",
          confirmButtonText: t("detail.upgradeAction"),
          confirmButtonColor: "#10a778",
        }).then((res) => {
          if (res.isConfirmed) {
            router.push("/recruiter/pricing");
          }
        });
      }
    });
  };

  if (detailQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <Card className="h-64 animate-pulse bg-slate-100" />
        <Card className="h-96 animate-pulse bg-slate-100" />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-destructive mb-4 text-base font-medium">
          {detailQuery.error instanceof Error ? detailQuery.error.message : t("errors.generic")}
        </p>
        <Button onClick={() => router.push("/recruiter/talent-pool")} variant="outline">
          <ArrowLeft size={16} className="mr-2" />
          {t("detail.backToList")}
        </Button>
      </div>
    );
  }

  const detail: TalentPoolDetail = detailQuery.data;
  const capabilities = capabilitiesQuery.data;

  // Compute values
  const currentExp = detail.experiences[0];
  const headline = currentExp?.positionTitle || detail.description || "--";
  const experienceYears = computeTotalExperienceYears(detail.experiences);
  const formattedSalary = detail.jobPreference
    ? formatExpectedSalary(detail.jobPreference)
    : "Thoả thuận";
  const currentPosition = currentExp?.positionTitle || null;
  const desiredLevel = detail.jobPreference?.desiredLevel?.name || null;
  const workingModelText =
    detail.jobPreference?.workingModel === "REMOTE"
      ? "Làm việc từ xa (Remote)"
      : detail.jobPreference?.workingModel === "HYBRID"
        ? "Linh hoạt (Hybrid)"
        : detail.jobPreference?.workingModel === "ONSITE"
          ? "Tại văn phòng (Onsite)"
          : null;
  const birthdateText = detail.birthdate ? formatAppDate(detail.birthdate) : null;
  const genderText = detail.gender === "FEMALE" ? "Nữ" : detail.gender === "MALE" ? "Nam" : null;
  const addressText = detail.address || null;
  const preferredCityText = detail.city || null;
  const highestEdu = detail.educations[0];
  const educationText = highestEdu
    ? [highestEdu.degree, highestEdu.schoolName].filter(Boolean).join(" - ")
    : null;
  const languagesText =
    detail.languages.length > 0
      ? detail.languages
          .map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ""}`)
          .join(", ")
      : null;
  const remainingViews = capabilities?.view?.remaining ?? 72;

  return (
    <div className="space-y-6">
      {/* Back to talent pool link */}
      <div>
        <Link
          href="/recruiter/talent-pool"
          onClick={(e) => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              e.preventDefault();
              router.back();
            }
          }}
          className="group hover:text-brand inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors"
        >
          <ArrowLeft
            size={16}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />
          <span>{t("detail.backToList")}</span>
        </Link>
      </div>

      {/* Top Candidate Summary Card (Matching Image 1) */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Left: Avatar + Details */}
          <div className="flex flex-1 items-start gap-5">
            {/* Avatar */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-100 shadow-xs sm:h-24 sm:w-24">
              {detail.avatarUrl ? (
                <Image
                  src={detail.avatarUrl}
                  alt={detail.fullName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="text-brand flex h-full w-full items-center justify-center bg-emerald-50">
                  <User size={40} weight="bold" />
                </div>
              )}
            </div>

            {/* Candidate Title Info */}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {detail.fullName}
                </h1>
                {detail.isOpenToWork ? (
                  <Badge tone="success" className="font-semibold">
                    {t("card.activeSeeking")}
                  </Badge>
                ) : null}
              </div>

              {/* Subtitle / Headline */}
              <p className="text-base font-medium text-slate-600">{headline}</p>

              {/* Company / Locked Company Notice */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Buildings size={16} className="text-slate-400" />
                {detail.unlocked && currentExp?.companyName ? (
                  <span className="font-semibold text-slate-800">{currentExp.companyName}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span>Mua gói</span>
                    <Link
                      href="/recruiter/pricing"
                      className="text-brand font-semibold hover:underline"
                    >
                      Tìm kiếm ứng viên
                    </Link>
                    <span>để xem đầy đủ thông tin</span>
                  </span>
                )}
              </div>

              {/* Meta Highlights Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={16} className="text-slate-400" />
                  <span>
                    {experienceYears > 0
                      ? t("card.experienceYears", { years: experienceYears })
                      : t("card.noExperience")}
                  </span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-brand flex items-center gap-1.5 font-semibold">
                  <CurrencyDollar size={16} className="text-brand" />
                  <span>{formattedSalary}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-slate-400" />
                  <span>{detail.city || detail.address || "Việt Nam"}</span>
                </span>
              </div>

              {/* Last Updated */}
              <p className="text-xs text-slate-400">
                {t("card.lastUpdated", {
                  date: formatRelativeTime(new Date(Date.now() - 3600 * 1000 * 3)),
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Row (Matching Image 1) */}
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Primary Action: View Contact or Display Unlocked Contact */}
            {detail.unlocked ? (
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
                  <Phone size={16} className="text-emerald-700" />
                  <span>{detail.phoneNumber || "Chưa cập nhật SĐT"}</span>
                </span>
                <span className="text-emerald-300">|</span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
                  <EnvelopeSimple size={16} className="text-emerald-700" />
                  <span>{detail.email || "Chưa cập nhật email"}</span>
                </span>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleContactUnlock}
                className="h-auto cursor-pointer bg-[#ff5a36] px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#f04925]"
              >
                {t("detail.viewContactWithPoints")}
              </Button>
            )}

            {/* Secondary Action: Send Application Invitation */}
            <Button
              type="button"
              variant="outline"
              onClick={handleInvite}
              disabled={isInvited}
              className={`h-auto border-slate-300 px-5 py-2.5 text-sm font-semibold transition-colors ${
                isInvited
                  ? "cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "cursor-pointer text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isInvited ? (
                <>
                  <Check size={16} className="mr-2 text-emerald-600" />
                  {t("detail.invitationAlreadySent")}
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={16} className="mr-2 text-slate-500" />
                  {t("detail.inviteAction")}
                </>
              )}
            </Button>
          </div>

          {/* Right Action Icons: Share & Save */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                    className="h-10 w-10 cursor-pointer border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <ShareNetwork size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCopied ? t("detail.shareCopied") : t("detail.shareAction")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleToggleSave}
                    className={`h-10 w-10 cursor-pointer border-slate-200 transition-colors ${
                      isSaved
                        ? "border-amber-300 bg-amber-50 text-amber-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <BookmarkSimple size={18} weight={isSaved ? "fill" : "regular"} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isSaved ? t("card.savedCandidate") : t("card.saveCandidate")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Quota Trial Notice (Matching Image 1) */}
        <p className="mt-3 text-xs text-[#ff5a36]">
          {t("detail.quotaTrialNotice", { count: remainingViews })}
        </p>
      </Card>

      {/* General Information Section (Matching Image 1 Table) */}
      <Card className="border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
        <h2 className="mb-6 border-b border-slate-200 pb-3 text-lg font-bold text-slate-900">
          {t("detail.generalInfoHeading")}
        </h2>

        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-12">
          {/* Col 1 */}
          <div className="space-y-4">
            <InfoRow label={t("detail.currentPositionLabel")} value={currentPosition} />
            <InfoRow label={t("detail.desiredLevelLabel")} value={desiredLevel} />
            <InfoRow label={t("detail.workingModelLabel")} value={workingModelText} />
            <InfoRow label={t("detail.desiredSalaryLabel")} value={formattedSalary} highlight />
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <InfoRow label={t("detail.birthdateLabel")} value={birthdateText} />
            <InfoRow label={t("detail.genderLabel")} value={genderText} />
            <InfoRow label={t("detail.addressLabel")} value={addressText} />
            <InfoRow label={t("detail.preferredWorkLocationLabel")} value={preferredCityText} />
            <InfoRow label={t("detail.educationDegreeLabel")} value={educationText} />
            <InfoRow label={t("detail.languageSkillLabel")} value={languagesText} />
          </div>
        </div>
      </Card>

      {/* Attached CV Section (Matching Image 2 Embedded PDF Viewer) */}
      <Card className="border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t("detail.attachedCvHeading")}</h2>
          </div>

          {/* Download Original CV Button */}
          {detail.cvFile?.publicUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cvDownload.isPending}
              onClick={() => {
                if (!detail.unlocked) {
                  handleContactUnlock();
                  return;
                }
                cvDownload.mutate();
              }}
              className="border-brand/40 text-brand cursor-pointer hover:bg-emerald-50"
            >
              <DownloadSimple size={16} className="mr-1.5" />
              <span>{cvDownload.isPending ? t("detail.downloading") : t("detail.downloadCv")}</span>
            </Button>
          ) : null}
        </div>

        {/* Embedded PDF Viewer */}
        {detail.cvFile?.publicUrl ? (
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-900 shadow-inner">
            <iframe
              src={`${normalizePdfUrl(detail.cvFile.publicUrl)}#toolbar=1&navpanes=0`}
              title="CV Attachment Viewer"
              className="h-[850px] w-full border-0 bg-white"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            <FilePdf size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">{t("detail.noCvAttached")}</p>
          </div>
        )}
      </Card>

      {/* Career Details Section (Work Experience, Education, Projects, Skills) */}
      <div className="space-y-6">
        {/* Work Experience */}
        {detail.experiences.length > 0 ? (
          <Card className="border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-bold text-slate-900">
              <Briefcase size={20} className="text-brand" />
              <span>{t("detail.experienceHeading")}</span>
            </h2>
            <div className="space-y-6">
              {detail.experiences.map((exp, idx) => (
                <div key={idx} className="relative space-y-1 border-l-2 border-slate-200 pl-4">
                  <div className="border-brand absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 bg-white" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">{exp.positionTitle}</h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {exp.startDate ? formatAppDate(exp.startDate) : ""} -{" "}
                      {exp.isCurrent
                        ? t("detail.current")
                        : exp.endDate
                          ? formatAppDate(exp.endDate)
                          : ""}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {detail.unlocked ? exp.companyName : "Công ty bảo mật"}
                  </p>
                  {exp.description ? (
                    <p className="pt-1 text-sm whitespace-pre-line text-slate-600">
                      {exp.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Education */}
        {detail.educations.length > 0 ? (
          <Card className="border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-bold text-slate-900">
              <GraduationCap size={20} className="text-brand" />
              <span>{t("detail.educationHeading")}</span>
            </h2>
            <div className="space-y-6">
              {detail.educations.map((edu, idx) => (
                <div key={idx} className="relative space-y-1 border-l-2 border-slate-200 pl-4">
                  <div className="border-brand absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 bg-white" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">{edu.schoolName}</h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {edu.startDate ? formatAppDate(edu.startDate) : ""} -{" "}
                      {edu.isCurrent
                        ? t("detail.current")
                        : edu.endDate
                          ? formatAppDate(edu.endDate)
                          : ""}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {[edu.degree, edu.major].filter(Boolean).join(" • ")}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Skills */}
        {detail.skills.length > 0 ? (
          <Card className="border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3 text-lg font-bold text-slate-900">
              <Sparkle size={20} className="text-brand" />
              <span>Kỹ năng chuyên môn</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {detail.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
                >
                  {skill.name}
                  {skill.yearsOfExperience ? ` (${skill.yearsOfExperience} năm)` : ""}
                </span>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      <SendInvitationDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        candidateProfileId={candidateProfileId}
        candidateName={detail.fullName}
        onSuccess={() => setHasSentInvite(true)}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  if (!value || value === "--") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="w-48 shrink-0 text-slate-500">{label}</span>
      <span
        className={`flex-1 text-right font-medium ${
          highlight ? "text-brand font-bold" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function computeTotalExperienceYears(
  experiences: ReadonlyArray<{
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
  }>,
): number {
  let totalMonths = 0;
  for (const exp of experiences) {
    if (!exp.startDate) continue;
    const start = new Date(exp.startDate).getTime();
    const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
    const months = Math.max(1, Math.round((end - start) / (30.44 * 24 * 3600 * 1000)));
    totalMonths += months;
  }
  return totalMonths > 0 ? Math.max(1, Math.round(totalMonths / 12)) : 0;
}

function formatExpectedSalary(
  pref: {
    desiredSalaryMin?: number | string | null;
    desiredSalaryMax?: number | string | null;
    salaryCurrency?: string | null;
  } | null,
): string {
  if (!pref) return "Thoả thuận";
  const min = pref.desiredSalaryMin ? Number(pref.desiredSalaryMin) : null;
  const max = pref.desiredSalaryMax ? Number(pref.desiredSalaryMax) : null;
  const currency = pref.salaryCurrency || "VND";
  if (min && max) {
    if (currency === "USD") return `$${min} - $${max}`;
    return `${Math.round(min / 1_000_000)} - ${Math.round(max / 1_000_000)} triệu`;
  }
  if (min) {
    if (currency === "USD") return `$${min}`;
    return `${Math.round(min / 1_000_000)} triệu`;
  }
  return "Thoả thuận";
}

function normalizePdfUrl(url: string): string {
  try {
    if (url.includes("/uploads/")) {
      const pathIndex = url.indexOf("/uploads/");
      return url.slice(pathIndex);
    }
    return url;
  } catch {
    return url;
  }
}
