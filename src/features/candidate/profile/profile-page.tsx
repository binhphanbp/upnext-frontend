"use client";

import {
  Briefcase,
  Check,
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
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cvsQuery, isSessionResolved, mutateCvs, mutateProfile, profileQuery, session } =
    useCandidateProfileWorkspace();
  const [editor, setEditor] = useState<ProfileEditorState | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingControl, setPendingControl] = useState<"status" | "visibility" | null>(null);
  const [controlFeedback, setControlFeedback] = useState<string | null>(null);

  const sectionParam = searchParams.get("section");
  const activeSection: ProfileSectionId = isProfileSectionId(sectionParam)
    ? sectionParam
    : "overview";

  if (!isSessionResolved || (session && profileQuery.isLoading)) {
    return <CandidateProfileLoading />;
  }

  const isUnauthorized =
    profileQuery.error instanceof ApiError && profileQuery.error.status === 401;

  if (!session || isUnauthorized) {
    return (
      <ProfileState
        icon={<LockKey />}
        title={t("states.unauthenticatedTitle")}
        description={t("states.unauthenticatedDescription")}
        action={
          <Button asChild>
            <Link href="/login">{t("actions.signIn")}</Link>
          </Button>
        }
      />
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ProfileState
        icon={<WarningCircle />}
        title={t("states.errorTitle")}
        description={t("states.errorDescription")}
        action={<Button onClick={() => profileQuery.refetch()}>{t("actions.retry")}</Button>}
      />
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
      setControlFeedback(t("status.updateSuccess"));
    } catch {
      setControlFeedback(t("status.updateError"));
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
      setControlFeedback(t("visibility.updateSuccess"));
    } catch {
      setControlFeedback(t("visibility.updateError"));
    } finally {
      setPendingControl(null);
    }
  };

  return (
    <div className="pb-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-balance text-slate-950 sm:text-4xl">
            {t("page.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t("page.description")}</p>
        </div>
        <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
          <Eye aria-hidden="true" />
          {t("actions.previewAsRecruiter")}
        </Button>
      </div>

      <ProfileCommandHeader
        pendingControl={pendingControl}
        profile={profile}
        onEdit={() => setEditor({ kind: "profile" })}
        onStatusChange={updateStatus}
        onVisibilityChange={updateVisibility}
      />
      <p
        aria-live="polite"
        className="mt-2 min-h-5 text-right text-xs font-semibold text-slate-500"
      >
        {controlFeedback}
      </p>

      <div className="sticky top-20 z-20 mt-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
        <label
          className="block text-xs font-bold tracking-wide text-slate-500 uppercase"
          htmlFor="profile-mobile-section"
        >
          {t("navigation.mobileLabel")}
        </label>
        <select
          id="profile-mobile-section"
          value={activeSection}
          className="focus-visible:border-brand focus-visible:ring-brand/20 mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 focus-visible:ring-2 focus-visible:outline-none"
          onChange={(event) => {
            router.replace(`/candidate/profile?section=${event.target.value}`, { scroll: false });
          }}
        >
          {profileSectionIds.map((section) => (
            <option key={section} value={section}>
              {t(`sections.${section}.title`)}
            </option>
          ))}
        </select>
      </div>

      <MobileReadinessSummary readiness={readiness} />

      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[210px_minmax(0,1fr)_270px]">
        <ProfileNavigation activeSection={activeSection} counts={sectionCounts} />

        <div className="min-w-0 lg:min-h-[620px] lg:border-l lg:border-slate-200 lg:pl-8 xl:border-r xl:pr-8">
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
              candidateAccountId={profile.candidateAccountId}
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

        <ReadinessRail readiness={readiness} />
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

function ProfileCommandHeader({
  onEdit,
  onStatusChange,
  onVisibilityChange,
  pendingControl,
  profile,
}: Readonly<{
  onEdit: () => void;
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
    <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
      <div className="grid gap-7 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-bold sm:size-16 sm:text-xl">
            {getInitials(profile.account.fullName)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-[-0.025em] sm:text-2xl">
              {profile.account.fullName}
            </h2>
            <p
              className={cn(
                "mt-1 text-sm font-semibold",
                desiredPosition ? "text-emerald-300" : "text-slate-400",
              )}
            >
              {desiredPosition || t("header.headlineFallback")}
            </p>
            <p className="mt-2 truncate text-xs font-medium text-slate-400">
              {profile.address || t("header.locationFallback")} · {profile.account.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="w-fit border border-white/15 text-white hover:bg-white/10 hover:text-white"
        >
          <PencilSimple aria-hidden="true" />
          {t("actions.editProfile")}
        </Button>
      </div>

      <div className="grid border-t border-white/10 bg-white/[0.04] sm:grid-cols-2">
        <HeaderControl
          active={isOpenToWork}
          activeLabel={t("status.openToWork")}
          inactiveLabel={t("status.notLooking")}
          isPending={pendingControl === "status"}
          label={t("status.title")}
          onClick={onStatusChange}
        />
        <HeaderControl
          active={isPublic}
          activeLabel={t("visibility.public")}
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
  inactiveLabel,
  isPending,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  activeLabel: string;
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
      className="group flex items-center justify-between gap-4 border-white/10 px-5 py-4 text-left first:border-b hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-wait disabled:opacity-70 sm:px-7 sm:first:border-r sm:first:border-b-0"
    >
      <span>
        <span className="block text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
          {label}
        </span>
        <span className="mt-1 block text-sm font-bold text-white">
          {active ? activeLabel : inactiveLabel}
        </span>
      </span>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border",
          active
            ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
            : "border-white/15 bg-white/5 text-slate-400",
        )}
      >
        {isPending ? (
          <SpinnerGap aria-hidden="true" className="animate-spin" size={17} />
        ) : active ? (
          <Check aria-hidden="true" size={17} weight="bold" />
        ) : (
          <EyeSlash aria-hidden="true" size={17} />
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
    <aside className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pr-1 lg:block">
      <div className="mb-3 px-3">
        <p
          id="profile-navigation-title"
          className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase"
        >
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
                  className={cn(
                    "group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 shrink-0",
                      isActive ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-700",
                    )}
                    size={18}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-bold">
                      <span>{t(`sections.${section}.title`)}</span>
                      {typeof count === "number" && count > 0 && (
                        <span
                          className={cn(
                            "text-[11px] tabular-nums",
                            isActive ? "text-slate-300" : "text-slate-400",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "mt-1 block text-[11px] leading-4 font-medium",
                        isActive ? "text-slate-300" : "text-slate-500",
                      )}
                    >
                      {t(`sections.${section}.navDescription`)}
                    </span>
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

function ReadinessRail({ readiness }: Readonly<{ readiness: ProfileReadiness }>) {
  const t = useTranslations("CandidateProfile.content");
  const incompleteItems = readiness.items.filter((item) => !item.complete);
  const prioritizedItems = incompleteItems
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.section === item.section) === index,
    )
    .slice(0, 4);

  return (
    <aside className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pr-1 xl:block">
      <p className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
        {t("readiness.title")}
      </p>
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
      <div aria-hidden="true" className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-600"
          style={{ width: `${readiness.percentage}%` }}
        />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{t("readiness.description")}</p>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-bold text-slate-900">
          {prioritizedItems.length > 0
            ? t("readiness.nextActions.title")
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
                    className="focus-visible:outline-brand flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {t(`readiness.nextActions.${item.id}`)}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {t("readiness.nextActions.allDoneDescription")}
          </p>
        )}
      </div>
    </aside>
  );
}

function MobileReadinessSummary({ readiness }: Readonly<{ readiness: ProfileReadiness }>) {
  const t = useTranslations("CandidateProfile.content");
  const nextItem = readiness.items.find((item) => !item.complete);

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 xl:hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.13em] text-slate-500 uppercase">
            {t("readiness.title")}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {t("readiness.criteriaCount", {
              completed: readiness.completed,
              total: readiness.total,
            })}
          </p>
        </div>
        <p className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
          {readiness.percentage}%
        </p>
      </div>
      <progress
        className="sr-only"
        aria-label={t("readiness.completionLabel")}
        max={100}
        value={readiness.percentage}
      />
      {nextItem ? (
        <Link
          href={{ pathname: "/candidate/profile", query: { section: nextItem.section } }}
          className="focus-visible:outline-brand mt-3 flex items-center justify-between gap-3 rounded-lg text-xs font-bold text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-3"
        >
          {t(`readiness.nextActions.${nextItem.id}`)}
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          {t("readiness.nextActions.allDoneTitle")}
        </p>
      )}
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
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-5 w-full max-w-xl rounded" />
      </div>
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="grid gap-8 lg:grid-cols-[210px_1fr_270px]">
        <Skeleton className="hidden h-96 rounded-xl lg:block" />
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="hidden h-96 rounded-xl xl:block" />
      </div>
    </div>
  );
}

function ProfileState({
  action,
  description,
  icon,
  title,
}: Readonly<{ action: ReactNode; description: string; icon: ReactNode; title: string }>) {
  return (
    <div className="flex min-h-[65vh] items-center justify-center py-12">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 [&_svg]:size-7">
          {icon}
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.025em] text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex justify-center">{action}</div>
      </div>
    </div>
  );
}
