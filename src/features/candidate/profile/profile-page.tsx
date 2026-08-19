"use client";

import {
  Briefcase,
  CheckCircle,
  Code,
  Eye,
  EyeSlash,
  FileText,
  GraduationCap,
  IdentificationCard,
  LockKey,
  PencilSimple,
  ShieldCheck,
  Sparkle,
  SpinnerGap,
  Translate,
  WarningCircle,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  getCandidateEmailVerificationStatus,
  requestCandidateEmailVerification,
} from "@/features/candidate/api/auth";
import {
  type CandidateCvApi,
  deleteCandidateCertification,
  deleteCandidateCv,
  deleteCandidateEducation,
  deleteCandidateExperience,
  deleteCandidateLanguage,
  deleteCandidateLink,
  deleteCandidateProject,
  deleteCandidateSkill,
  updateMyCandidateProfile,
} from "@/features/candidate/api/profile";
import { CandidatePageHeader } from "@/features/candidate/candidate-page-header";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";

import { ProfileDocuments } from "./profile-documents";
import type { ProfileEditorState } from "./profile-editor";
import {
  getInitials,
  getProfileReadiness,
  isProfileSectionId,
  profileSectionIds,
  type ProfileReadiness,
  type ProfileSectionId,
} from "./profile-model";
import {
  CredentialsSection,
  EducationSection,
  ExperienceSection,
  OverviewSection,
  PreferencesSection,
  ProjectsSection,
  SkillsSection,
  type DeleteProfileRecordRequest,
} from "./profile-sections";
import { useCandidateProfileWorkspace } from "./use-candidate-profile";

const ProfileEditor = dynamic(
  () => import("./profile-editor").then((module) => module.ProfileEditor),
  { ssr: false },
);
const ProfilePreview = dynamic(
  () => import("./profile-preview").then((module) => module.ProfilePreview),
  { ssr: false },
);

type DeleteRequest =
  | DeleteProfileRecordRequest
  | Readonly<{ cv: CandidateCvApi; id: string; kind: "cv"; label: string }>;

type ControlFeedback = Readonly<{
  message: string;
  tone: "error" | "success";
}> | null;

const sectionIcons: Record<ProfileSectionId, typeof IdentificationCard> = {
  credentials: Translate,
  documents: FileText,
  education: GraduationCap,
  experience: Briefcase,
  overview: IdentificationCard,
  preferences: ShieldCheck,
  projects: Code,
  skills: Sparkle,
};

export function CandidateProfilePage() {
  const t = useTranslations("CandidateProfile.content");
  const workspaceT = useTranslations("CandidateWorkspace");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cvsQuery, isSessionResolved, mutateCvs, mutateProfile, profileQuery, session } =
    useCandidateProfileWorkspace();
  const [editor, setEditor] = useState<ProfileEditorState | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingControl, setPendingControl] = useState<"status" | "visibility" | null>(null);
  const [controlFeedback, setControlFeedback] = useState<ControlFeedback>(null);

  const pageHeader = (
    <CandidatePageHeader
      breadcrumbItems={[
        { href: "/", label: workspaceT("common.home") },
        { label: t("page.title") },
      ]}
      description={t("page.description")}
      descriptionClassName="hidden sm:block"
      title={t("page.title")}
      action={
        <Button
          variant="outline"
          className="w-full rounded-xl bg-white sm:w-auto"
          onClick={() => setIsPreviewOpen(true)}
        >
          <Eye aria-hidden="true" />
          {t("actions.previewAsRecruiter")}
        </Button>
      }
      actionClassName="hidden sm:block"
    />
  );

  const sectionParam = searchParams.get("section");
  const activeSection: ProfileSectionId = isProfileSectionId(sectionParam)
    ? sectionParam
    : "overview";
  const previousSectionRef = useRef(activeSection);

  useEffect(() => {
    if (previousSectionRef.current === activeSection) return;
    previousSectionRef.current = activeSection;

    const frame = window.requestAnimationFrame(() => {
      const heading = document.getElementById("profile-section-title");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeSection]);

  if (!isSessionResolved || (session && profileQuery.isLoading)) {
    return <CandidateProfileLoading />;
  }

  const isUnauthorized =
    profileQuery.error instanceof ApiError && profileQuery.error.status === 401;

  if (!session || isUnauthorized) {
    return (
      <div className="space-y-7 pb-12">
        {pageHeader}
        <ProfileState
          icon={<LockKey />}
          title={t("states.unauthenticatedTitle")}
          description={t("states.unauthenticatedDescription")}
          action={
            <Button asChild className="candidate-profile-primary-action">
              <Link href="/login">{t("actions.signIn")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="space-y-7 pb-12">
        {pageHeader}
        <ProfileState
          tone="error"
          icon={<WarningCircle />}
          title={t("states.errorTitle")}
          description={t("states.errorDescription")}
          action={
            <Button
              className="candidate-profile-primary-action"
              onClick={() => profileQuery.refetch()}
            >
              {t("actions.retry")}
            </Button>
          }
        />
      </div>
    );
  }

  const profile = profileQuery.data;
  const cvs = cvsQuery.data?.items ?? [];
  const readiness = getProfileReadiness(
    profile,
    cvs.some((cv) => cv.isDefault),
  );
  const sectionCounts: Partial<Record<ProfileSectionId, number>> = {
    credentials: profile.certifications.length + profile.languages.length,
    ...(cvsQuery.isSuccess ? { documents: cvs.length } : {}),
    education: profile.educations.length,
    experience: profile.experiences.length,
    projects: profile.projects.length,
    skills: profile.skills.length,
  };

  const updateStatus = async () => {
    setPendingControl("status");
    setControlFeedback(null);
    try {
      const nextStatus =
        profile.jobSearchStatus === "OPEN_TO_WORK" ? "NOT_LOOKING" : "OPEN_TO_WORK";
      await mutateProfile((token) =>
        updateMyCandidateProfile(token, { jobSearchStatus: nextStatus }),
      );
      setControlFeedback({ message: t("status.updateSuccess"), tone: "success" });
    } catch {
      setControlFeedback({ message: t("status.updateError"), tone: "error" });
    } finally {
      setPendingControl(null);
    }
  };

  const updateVisibility = async () => {
    setPendingControl("visibility");
    setControlFeedback(null);
    try {
      const nextVisibility = profile.profileVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
      await mutateProfile((token) =>
        updateMyCandidateProfile(token, { profileVisibility: nextVisibility }),
      );
      setControlFeedback({ message: t("visibility.updateSuccess"), tone: "success" });
    } catch {
      setControlFeedback({ message: t("visibility.updateError"), tone: "error" });
    } finally {
      setPendingControl(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {pageHeader}

      <EmailVerificationBanner email={profile.account.email} />

      <div className="relative">
        <ProfileCommandHeader
          pendingControl={pendingControl}
          profile={profile}
          onEdit={() => setEditor({ kind: "profile" })}
          onPreview={() => setIsPreviewOpen(true)}
          onStatusChange={updateStatus}
          onVisibilityChange={updateVisibility}
        />
        <div
          aria-live="polite"
          className="pointer-events-none absolute right-1 -bottom-4 z-10 flex max-w-[calc(100%-0.5rem)] justify-end sm:-bottom-5"
        >
          {controlFeedback ? (
            <p
              className={cn(
                "inline-flex items-center gap-1.5 truncate text-xs font-semibold",
                controlFeedback.tone === "success" ? "text-emerald-700" : "text-red-700",
              )}
            >
              {controlFeedback.tone === "success" ? (
                <CheckCircle aria-hidden="true" size={15} weight="fill" />
              ) : (
                <WarningCircle aria-hidden="true" size={15} weight="fill" />
              )}
              {controlFeedback.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="sticky top-16 z-20 mt-4 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:top-20 sm:mt-5 sm:p-3 lg:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <label
              className="sr-only text-xs font-bold tracking-wide text-slate-500 uppercase sm:not-sr-only sm:block"
              htmlFor="profile-mobile-section"
            >
              {t("navigation.mobileLabel")}
            </label>
            <select
              id="profile-mobile-section"
              value={activeSection}
              className="focus-visible:border-brand focus-visible:ring-brand/20 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 focus-visible:ring-2 focus-visible:outline-none sm:mt-1"
              onChange={(event) => {
                router.replace(`/candidate/profile?section=${event.target.value}`, {
                  scroll: false,
                });
              }}
            >
              {profileSectionIds.map((section) => (
                <option key={section} value={section}>
                  {t(`sections.${section}.title`)}
                </option>
              ))}
            </select>
          </div>
          <MobileReadinessSummary embedded readiness={readiness} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_260px] 2xl:grid-cols-[240px_minmax(0,1fr)_275px]">
        <ProfileNavigation activeSection={activeSection} counts={sectionCounts} />

        <div className="min-w-0 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-6">
          {activeSection === "overview" && (
            <OverviewSection profile={profile} onDelete={setDeleteRequest} onEdit={setEditor} />
          )}
          {activeSection === "experience" && (
            <ExperienceSection profile={profile} onDelete={setDeleteRequest} onEdit={setEditor} />
          )}
          {activeSection === "projects" && (
            <ProjectsSection profile={profile} onDelete={setDeleteRequest} onEdit={setEditor} />
          )}
          {activeSection === "education" && (
            <EducationSection profile={profile} onDelete={setDeleteRequest} onEdit={setEditor} />
          )}
          {activeSection === "skills" && (
            <SkillsSection profile={profile} onDelete={setDeleteRequest} onEdit={setEditor} />
          )}
          {activeSection === "credentials" && (
            <CredentialsSection profile={profile} onDelete={setDeleteRequest} onEdit={setEditor} />
          )}
          {activeSection === "documents" && (
            <ProfileDocuments
              accessToken={session.accessToken}
              cvs={cvs}
              isError={cvsQuery.isError}
              isLoading={cvsQuery.isLoading}
              mutateCvs={mutateCvs}
              onDelete={(cv) => setDeleteRequest({ cv, id: cv.id, kind: "cv", label: cv.title })}
              onRetry={() => void cvsQuery.refetch()}
            />
          )}
          {activeSection === "preferences" && (
            <PreferencesSection profile={profile} onDelete={setDeleteRequest} onEdit={setEditor} />
          )}
        </div>

        <ReadinessRail activeSection={activeSection} readiness={readiness} />
      </div>

      {editor && (
        <ProfileEditor
          editor={editor}
          mutateProfile={mutateProfile}
          profile={profile}
          onClose={() => setEditor(null)}
        />
      )}
      {isPreviewOpen && <ProfilePreview open profile={profile} onOpenChange={setIsPreviewOpen} />}
      <DeleteConfirmation
        mutateCvs={mutateCvs}
        mutateProfile={mutateProfile}
        request={deleteRequest}
        onOpenChange={(open) => {
          if (!open) setDeleteRequest(null);
        }}
      />
    </div>
  );
}

/**
 * Nộp đơn ứng tuyển bị backend chặn nếu email chưa xác thực
 * (`applications.service.ts` — `Please verify your email before applying to jobs`), nhưng
 * trước đây không có nơi nào trên frontend để ứng viên biết và tự xác thực. Banner này tự
 * kiểm tra trạng thái (không gửi email, chỉ đọc) và chỉ hiện khi thực sự chưa xác thực.
 */
function EmailVerificationBanner({ email }: Readonly<{ email: string }>) {
  const t = useTranslations("CandidateProfile.content");
  const locale = useLocale();
  const [status, setStatus] = useState<"checking" | "verified" | "unverified">("checking");
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState<ControlFeedback>(null);

  useEffect(() => {
    let active = true;
    getCandidateEmailVerificationStatus(email)
      .then((result) => {
        if (active) setStatus(result.emailVerified ? "verified" : "unverified");
      })
      .catch(() => {
        // Không chặn/hù nhầm ứng viên nếu bản thân việc kiểm tra bị lỗi.
        if (active) setStatus("verified");
      });
    return () => {
      active = false;
    };
  }, [email]);

  if (status !== "unverified") return null;

  async function handleResend() {
    setResending(true);
    setFeedback(null);
    try {
      await requestCandidateEmailVerification(email, locale);
      setFeedback({ tone: "success", message: t("emailVerification.resendSuccessDescription") });
    } catch {
      setFeedback({ tone: "error", message: t("emailVerification.resendErrorDescription") });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <WarningCircle
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-amber-600"
          size={20}
          weight="fill"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900">{t("emailVerification.title")}</p>
          <p className="mt-0.5 text-xs font-medium text-amber-700">
            {t("emailVerification.description", { email })}
          </p>
          {feedback ? (
            <p
              className={cn(
                "mt-1 text-xs font-semibold",
                feedback.tone === "success" ? "text-emerald-700" : "text-red-700",
              )}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={resending}
        onClick={() => void handleResend()}
        className="shrink-0 border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
      >
        {resending ? t("emailVerification.resending") : t("emailVerification.resendButton")}
      </Button>
    </div>
  );
}

function ProfileCommandHeader({
  onEdit,
  onPreview,
  onStatusChange,
  onVisibilityChange,
  pendingControl,
  profile,
}: Readonly<{
  onEdit: () => void;
  onPreview: () => void;
  onStatusChange: () => void;
  onVisibilityChange: () => void;
  pendingControl: "status" | "visibility" | null;
  profile: NonNullable<ReturnType<typeof useCandidateProfileWorkspace>["profileQuery"]["data"]>;
}>) {
  const t = useTranslations("CandidateProfile.content");
  const desiredPosition = profile.jobPreference?.desiredPosition;
  const isOpenToWork = profile.jobSearchStatus === "OPEN_TO_WORK";
  const isPublic = profile.profileVisibility === "PUBLIC";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4 py-4 sm:items-center sm:gap-5 sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-5">
          <span className="border-brand/20 bg-brand-muted text-accent-foreground flex size-12 shrink-0 items-center justify-center rounded-xl border text-base font-bold sm:size-16 sm:rounded-2xl sm:text-xl">
            {getInitials(profile.account.fullName)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-[-0.025em] text-slate-950 sm:text-2xl">
              {profile.account.fullName}
            </h2>
            <p
              className={cn(
                "mt-1 text-sm font-semibold",
                desiredPosition ? "text-slate-700" : "text-slate-500",
              )}
            >
              {desiredPosition || t("header.headlineFallback")}
            </p>
            <p className="mt-1.5 truncate text-xs font-medium text-slate-500 sm:mt-2">
              {profile.address || t("header.locationFallback")} · {profile.account.email}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("actions.previewAsRecruiter")}
            onClick={onPreview}
            className="bg-white sm:hidden"
          >
            <Eye aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="hover:border-accent-foreground hover:text-accent-foreground w-fit"
          >
            <PencilSimple aria-hidden="true" />
            <span className="hidden sm:inline">{t("actions.editProfile")}</span>
            <span className="sr-only sm:hidden">{t("actions.editProfile")}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-slate-200 bg-slate-50/70">
        <HeaderControl
          active={isOpenToWork}
          activeLabel={t("status.openToWork")}
          icon={<Briefcase weight={isOpenToWork ? "fill" : "regular"} />}
          inactiveLabel={t("status.notLooking")}
          isPending={pendingControl === "status"}
          label={t("status.title")}
          onClick={onStatusChange}
        />
        <HeaderControl
          active={isPublic}
          activeLabel={t("visibility.public")}
          icon={isPublic ? <Eye /> : <EyeSlash />}
          inactiveLabel={t("visibility.private")}
          isPending={pendingControl === "visibility"}
          label={t("visibility.title")}
          onClick={onVisibilityChange}
        />
      </div>
    </section>
  );
}

function HeaderControl({
  active,
  activeLabel,
  icon,
  inactiveLabel,
  isPending,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  activeLabel: string;
  icon: ReactNode;
  inactiveLabel: string;
  isPending: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={isPending}
      onClick={onClick}
      className="group hover:bg-brand-muted/60 focus-visible:outline-brand flex min-w-0 items-start justify-between gap-2 border-slate-200 px-4 py-3 text-left first:border-r focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-wait disabled:opacity-70 sm:items-center sm:gap-4 sm:px-6 sm:py-3.5"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold tracking-[0.02em] text-slate-500">
          {label}
        </span>
        <span
          className={cn(
            "mt-1 block text-xs leading-4 font-bold sm:text-sm sm:leading-5",
            active ? "text-accent-foreground" : "text-slate-800",
          )}
        >
          {active ? activeLabel : inactiveLabel}
        </span>
      </span>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border sm:size-9",
          active
            ? "border-brand/25 bg-brand-muted text-accent-foreground"
            : "border-slate-200 bg-white text-slate-500",
        )}
      >
        {isPending ? (
          <SpinnerGap aria-hidden="true" className="animate-spin" size={17} />
        ) : (
          <span aria-hidden="true" className="[&_svg]:size-[17px]">
            {icon}
          </span>
        )}
      </span>
    </button>
  );
}

function ProfileNavigation({
  activeSection,
  counts,
}: Readonly<{
  activeSection: ProfileSectionId;
  counts: Partial<Record<ProfileSectionId, number | undefined>>;
}>) {
  const t = useTranslations("CandidateProfile.content");
  return (
    <aside className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] shrink-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2.5 lg:block">
      <div className="mb-2 px-2.5 pt-2">
        <p id="profile-navigation-title" className="text-xs font-semibold text-slate-500">
          {t("navigation.title")}
        </p>
        <p id="profile-navigation-description" className="sr-only">
          {t("navigation.description")}
        </p>
      </div>
      <nav
        aria-labelledby="profile-navigation-title"
        aria-describedby="profile-navigation-description"
      >
        <ul className="space-y-1">
          {profileSectionIds.map((section) => {
            const Icon = sectionIcons[section];
            const isActive = activeSection === section;
            const count = counts[section];
            return (
              <li key={section}>
                <Link
                  href={{ pathname: "/candidate/profile", query: { section } }}
                  aria-current={isActive ? "page" : undefined}
                  scroll={false}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg border px-2.5 py-2.5 transition-colors before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    isActive
                      ? "border-brand/20 bg-brand-muted text-slate-950 before:bg-brand"
                      : "border-transparent text-slate-600 before:bg-transparent hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "shrink-0",
                      isActive
                        ? "text-accent-foreground"
                        : "text-slate-500 group-hover:text-slate-700",
                    )}
                    size={18}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-bold">
                      <span>{t(`sections.${section}.title`)}</span>
                      {typeof count === "number" && count > 0 && (
                        <>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "text-[11px] tabular-nums",
                              isActive ? "text-accent-foreground" : "text-slate-500",
                            )}
                          >
                            {count}
                          </span>
                          <span className="sr-only">{t("navigation.itemCount", { count })}</span>
                        </>
                      )}
                    </span>
                    <span className="sr-only">{t(`sections.${section}.navDescription`)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function ReadinessRail({
  activeSection,
  readiness,
}: Readonly<{ activeSection: ProfileSectionId; readiness: ProfileReadiness }>) {
  const t = useTranslations("CandidateProfile.content");
  const incompleteItems = readiness.items.filter(
    (item) => !item.complete && item.section !== activeSection,
  );
  const prioritizedItems = incompleteItems
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.section === item.section) === index,
    )
    .slice(0, 4);
  const isProfileIncomplete = readiness.completed < readiness.total;

  return (
    <aside className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] shrink-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4.5 xl:block">
      <p className="text-xs font-semibold text-slate-500">{t("readiness.title")}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
          {readiness.percentage}%
        </p>
        <p className="pb-1 text-xs font-semibold text-slate-500">
          {t("readiness.criteriaCount", { completed: readiness.completed, total: readiness.total })}
        </p>
      </div>
      <progress
        className="sr-only"
        aria-label={t("readiness.completionLabel")}
        max={100}
        value={readiness.percentage}
      />
      <div aria-hidden="true" className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="bg-brand h-full rounded-full"
          style={{ width: `${readiness.percentage}%` }}
        />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{t("readiness.description")}</p>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-bold text-slate-900">
          {prioritizedItems.length > 0
            ? t("readiness.nextActions.title")
            : isProfileIncomplete
              ? t("readiness.nextActions.currentSectionTitle")
              : t("readiness.nextActions.allDoneTitle")}
        </h3>
        {prioritizedItems.length > 0 ? (
          <>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {t("readiness.nextActions.description")}
            </p>
            <ul className="mt-3 space-y-2">
              {prioritizedItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={{ pathname: "/candidate/profile", query: { section: item.section } }}
                    scroll={false}
                    className="focus-visible:outline-brand hover:border-brand/20 hover:bg-brand-muted hover:text-accent-foreground group flex items-center justify-between gap-2.5 rounded-xl border border-transparent bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <span className="min-w-0 flex-1 leading-snug">
                      {t(`readiness.nextActions.${item.id}`)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="group-hover:text-accent-foreground shrink-0 text-slate-400 transition-colors"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : isProfileIncomplete ? (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {t("readiness.nextActions.currentSectionDescription")}
          </p>
        ) : (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {t("readiness.nextActions.allDoneDescription")}
          </p>
        )}
      </div>
    </aside>
  );
}

function MobileReadinessSummary({
  activeSection,
  embedded = false,
  readiness,
}: Readonly<{
  activeSection?: ProfileSectionId;
  embedded?: boolean;
  readiness: ProfileReadiness;
}>) {
  const t = useTranslations("CandidateProfile.content");
  const nextItem = readiness.items.find((item) => !item.complete && item.section !== activeSection);
  const isProfileIncomplete = readiness.completed < readiness.total;

  if (embedded) {
    return (
      <div className="bg-brand-muted flex h-11 min-w-20 flex-col items-end justify-center rounded-lg px-3">
        <span className="text-accent-foreground text-[10px] font-bold tracking-wide uppercase">
          {t("readiness.shortTitle")}
        </span>
        <span className="text-accent-foreground text-sm font-bold tabular-nums">
          {readiness.percentage}%
        </span>
        <progress
          className="sr-only"
          aria-label={t("readiness.completionLabel")}
          max={100}
          value={readiness.percentage}
        />
      </div>
    );
  }

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 2xl:hidden">
      <div className="flex items-center gap-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500">{t("readiness.title")}</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900">
            {t("readiness.criteriaCount", {
              completed: readiness.completed,
              total: readiness.total,
            })}
          </p>
        </div>
        {nextItem ? (
          <Link
            href={{ pathname: "/candidate/profile", query: { section: nextItem.section } }}
            scroll={false}
            className="focus-visible:outline-brand text-accent-foreground ml-auto flex items-center gap-2 text-xs font-bold hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-3"
          >
            {t(`readiness.nextActions.${nextItem.id}`)}
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <p className="text-accent-foreground ml-auto text-xs font-semibold">
            {isProfileIncomplete
              ? t("readiness.nextActions.currentSectionTitle")
              : t("readiness.nextActions.allDoneTitle")}
          </p>
        )}
        <p className="text-accent-foreground ml-auto text-2xl font-bold tracking-[-0.04em] xl:ml-0">
          {readiness.percentage}%
        </p>
      </div>
      <progress
        className="sr-only"
        aria-label={t("readiness.completionLabel")}
        max={100}
        value={readiness.percentage}
      />
    </section>
  );
}

function DeleteConfirmation({
  mutateCvs,
  mutateProfile,
  onOpenChange,
  request,
}: Readonly<{
  mutateCvs: ReturnType<typeof useCandidateProfileWorkspace>["mutateCvs"];
  mutateProfile: ReturnType<typeof useCandidateProfileWorkspace>["mutateProfile"];
  onOpenChange: (open: boolean) => void;
  request: DeleteRequest | null;
}>) {
  const t = useTranslations("CandidateProfile.content");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const confirmDelete = async () => {
    if (!request) return;
    setIsDeleting(true);
    setDeleteError(false);
    try {
      if (request.kind === "cv") {
        await mutateCvs((token) => deleteCandidateCv(token, request.id));
      } else {
        await mutateProfile((token) => {
          switch (request.kind) {
            case "experience":
              return deleteCandidateExperience(token, request.id);
            case "project":
              return deleteCandidateProject(token, request.id);
            case "education":
              return deleteCandidateEducation(token, request.id);
            case "certification":
              return deleteCandidateCertification(token, request.id);
            case "skill":
              return deleteCandidateSkill(token, request.id);
            case "language":
              return deleteCandidateLanguage(token, request.id);
            case "link":
              return deleteCandidateLink(token, request.id);
          }
        });
      }
      onOpenChange(false);
    } catch {
      setDeleteError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const key = request?.kind ?? "experience";
  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("actions.close")} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`deleteConfirmations.${key}.title`)}</DialogTitle>
          <DialogDescription className="pt-1 leading-6">
            {t(`deleteConfirmations.${key}.description`)}
          </DialogDescription>
        </DialogHeader>
        {request && (
          <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-800">
            {request.label}
          </p>
        )}
        {deleteError && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {t("feedback.failed")}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" disabled={isDeleting} onClick={() => onOpenChange(false)}>
            {t("deleteConfirmations.cancelAction")}
          </Button>
          <Button variant="destructive" disabled={isDeleting} onClick={confirmDelete}>
            {isDeleting && <SpinnerGap aria-hidden="true" className="animate-spin" />}
            {isDeleting ? t("actions.deleting") : t("deleteConfirmations.deleteAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CandidateProfileLoading() {
  return (
    <div aria-busy="true" className="space-y-7 pb-12">
      <div className="space-y-3">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-5 w-full max-w-xl rounded" />
      </div>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[200px_1fr] 2xl:grid-cols-[200px_minmax(680px,1fr)_252px]">
        <Skeleton className="hidden h-96 rounded-2xl lg:block" />
        <Skeleton className="h-[440px] rounded-2xl" />
        <Skeleton className="hidden h-80 rounded-2xl 2xl:block" />
      </div>
    </div>
  );
}

function ProfileState({
  action,
  description,
  icon,
  tone = "neutral",
  title,
}: Readonly<{
  action: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
  tone?: "error" | "neutral";
}>) {
  return (
    <div className="flex min-h-[65vh] items-center justify-center py-12">
      <div className="max-w-lg text-center">
        <span
          aria-hidden="true"
          className={cn(
            "mx-auto flex size-14 items-center justify-center rounded-2xl border [&_svg]:size-7",
            tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-white text-slate-500",
          )}
        >
          {icon}
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-[-0.025em] text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex justify-center">{action}</div>
      </div>
    </div>
  );
}
