"use client";

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarBlank,
  Check,
  CheckCircle,
  Clock,
  DownloadSimple,
  Eye,
  FileText,
  MapPin,
  PencilSimple,
  ShieldCheck,
  SpinnerGap,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState, type ReactNode } from "react";

import {
  downloadCandidateCvVersion,
  getCandidateApplication,
  respondCandidateOffer,
  type CandidateApplicationApi,
  withdrawCandidateApplication,
} from "@/features/candidate/api/profile";
import { CandidatePageHeader } from "@/features/candidate/candidate-page-header";
import { CvSnapshotPreviewDialog } from "@/features/candidate/cv-builder/cv-snapshot-preview-dialog";
import { parseCvSnapshot } from "@/features/candidate/cv-builder/store";
import type { CvData } from "@/features/candidate/cv-builder/types";
import {
  canChangeApplicationCv,
  canWithdrawApplication,
  formatJobSalary,
  getCompanyLogo,
  getJobLocation,
  getJobTags,
} from "@/features/candidate/job-activity-model";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";
import { Link } from "@/i18n/navigation";
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
import { toast } from "@/shared/ui/toast";

import { ApplicationStatusBadge } from "./application-status-badge";
import { ChangeCvDialog } from "./change-cv-dialog";

type CandidateApplicationDetailPageProps = Readonly<{ applicationId: string }>;

export function CandidateApplicationDetailPage({
  applicationId,
}: CandidateApplicationDetailPageProps) {
  const t = useTranslations("CandidateWorkspace");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isSessionResolved, session } = useCandidateProfileWorkspace();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [offerResponseAction, setOfferResponseAction] = useState<"ACCEPT" | "DECLINE" | null>(null);
  const [changeCvOpen, setChangeCvOpen] = useState(false);
  const [isViewingCv, setIsViewingCv] = useState(false);
  const [cvPreviewError, setCvPreviewError] = useState<string | null>(null);
  const [builderPreview, setBuilderPreview] = useState<{ title: string; cvData: CvData } | null>(
    null,
  );
  const detailQueryKey = ["candidate-application", session?.user.id, applicationId] as const;
  const applicationQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getCandidateApplication(session!.accessToken, applicationId),
    queryKey: detailQueryKey,
  });
  const withdrawMutation = useMutation({
    mutationFn: () => withdrawCandidateApplication(session!.accessToken, applicationId),
    onSuccess: async (updatedApplication) => {
      setWithdrawOpen(false);
      queryClient.setQueryData<CandidateApplicationApi>(detailQueryKey, (current) => {
        if (!current) return current;
        const availableActions = current.availableActions;

        return {
          ...current,
          ...updatedApplication,
          ...(availableActions
            ? {
                availableActions: {
                  ...availableActions,
                  canChangeCv: false,
                  canWithdraw: false,
                },
              }
            : {}),
        };
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["candidate-applications", session?.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["candidate-application-activity", session?.user.id],
        }),
        // The public job page caches whether this job was applied to. Without this the
        // job still reads "Đã ứng tuyển" after withdrawing until that cache expires.
        queryClient.invalidateQueries({ queryKey: ["check-applied-job"] }),
      ]);
    },
  });

  const respondOfferMutation = useMutation({
    mutationFn: (action: "ACCEPT" | "DECLINE") =>
      respondCandidateOffer(session!.accessToken, applicationId, action),
    onSuccess: async (updatedApplication, action) => {
      setOfferResponseAction(null);
      queryClient.setQueryData<CandidateApplicationApi>(detailQueryKey, (current) => {
        if (!current) return current;
        const availableActions = current.availableActions;
        return {
          ...current,
          ...updatedApplication,
          offerRespondedAt: updatedApplication.offerRespondedAt ?? new Date().toISOString(),
          offerResponse:
            updatedApplication.offerResponse ?? (action === "ACCEPT" ? "ACCEPTED" : "DECLINED"),
          ...(availableActions
            ? {
                availableActions: {
                  ...availableActions,
                  canRespondToOffer: false,
                  canWithdraw: false,
                },
              }
            : {}),
        };
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["candidate-applications", session?.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["candidate-application-activity", session?.user.id],
        }),
      ]);
      toast.success(
        action === "ACCEPT"
          ? t("applicationDetail.offer.acceptedToast")
          : t("applicationDetail.offer.declinedToast"),
      );
    },
    onError: () => {
      toast.error(t("applicationDetail.offer.responseError"));
    },
  });

  const handleViewCv = async (cvVersion: CandidateApplicationApi["cvVersion"]) => {
    if (!session) return;

    setCvPreviewError(null);
    if (cvVersion.cv?.source === "BUILDER") {
      const cvData = parseCvSnapshot(cvVersion.contentJson);
      if (cvData) {
        setBuilderPreview({ title: cvVersion.cv.title, cvData });
      } else {
        setCvPreviewError(t("applicationDetail.submission.viewCvUnavailable"));
      }
      return;
    }

    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      setCvPreviewError(t("applicationDetail.submission.viewCvUnavailable"));
      return;
    }
    previewWindow.opener = null;

    setIsViewingCv(true);
    try {
      const { blob } = await downloadCandidateCvVersion(session.accessToken, cvVersion.id, {
        fileName: cvVersion.fileName,
      });

      const objectUrl = URL.createObjectURL(blob);
      previewWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
    } catch {
      previewWindow.close();
      setCvPreviewError(t("applicationDetail.submission.viewCvUnavailable"));
    } finally {
      setIsViewingCv(false);
    }
  };

  const handleCvChanged = async () => {
    await queryClient.invalidateQueries({ queryKey: detailQueryKey });
    await queryClient.invalidateQueries({
      queryKey: ["candidate-applications", session?.user.id],
    });
  };

  const application = applicationQuery.data;
  const isUnauthorized =
    applicationQuery.error instanceof ApiError && applicationQuery.error.status === 401;
  const title = application?.jobPost.title ?? t("applicationDetail.page.fallbackTitle");
  const header = (
    <CandidatePageHeader
      breadcrumbItems={[
        { href: "/", label: t("common.home") },
        { href: "/candidate/applications", label: t("applications.page.title") },
        { label: title },
      ]}
      description={
        application?.jobPost.company.name ?? t("applicationDetail.page.fallbackDescription")
      }
      title={title}
      action={
        <Button asChild variant="outline" className="w-full rounded-xl bg-white sm:w-auto">
          <Link href="/candidate/applications">
            <ArrowLeft aria-hidden="true" />
            {t("applicationDetail.actions.back")}
          </Link>
        </Button>
      }
    />
  );

  if (!isSessionResolved || (session && applicationQuery.isLoading)) {
    return (
      <div className="space-y-7 pb-4">
        {header}
        <DetailLoading />
      </div>
    );
  }

  if (!session || isUnauthorized) {
    return (
      <div className="space-y-7 pb-4">
        {header}
        <DetailState
          icon={<ShieldCheck />}
          title={t("common.signInTitle")}
          description={t("common.signInDescription")}
          action={
            <Button asChild className="rounded-xl">
              <Link href="/login">{t("common.signIn")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (applicationQuery.isError || !application) {
    return (
      <div className="space-y-7 pb-4">
        {header}
        <DetailState
          tone="error"
          icon={<WarningCircle />}
          title={t("applicationDetail.states.errorTitle")}
          description={t("applicationDetail.states.errorDescription")}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => applicationQuery.refetch()}
              >
                {t("common.retry")}
              </Button>
              <Button asChild className="rounded-xl">
                <Link href="/candidate/applications">{t("applicationDetail.actions.back")}</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const logo = getCompanyLogo(application.jobPost);
  const location = getJobLocation(application.jobPost, t("common.locationFallback"));
  const tags = getJobTags(application.jobPost);
  const history = getApplicationHistory(application, locale, t);

  return (
    <div className="space-y-7 pb-4">
      {header}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-center">
          <span className="grid size-[72px] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-sm">
            {logo ? (
              <Image
                src={logo}
                alt=""
                width={72}
                height={72}
                unoptimized
                className="size-full object-contain p-3"
              />
            ) : (
              application.jobPost.company.name.slice(0, 2).toLocaleUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <ApplicationStatusBadge
              status={application.status}
              offerResponse={application.offerResponse}
              offerDeadlineAt={application.offerDeadlineAt}
            />
            <h2 className="mt-3 text-xl font-bold text-slate-950 sm:text-2xl">
              {application.jobPost.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {application.jobPost.company.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" size={15} />
                {location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase aria-hidden="true" size={15} />
                {formatJobSalary(application.jobPost, locale, {
                  hidden: t("common.salaryHidden"),
                  negotiable: t("common.salaryNegotiable"),
                })}
              </span>
            </div>
          </div>
          <Button asChild className="w-full rounded-xl lg:w-auto">
            <Link href={`/jobs/${application.jobPostId}`}>
              {t("applicationDetail.actions.viewJob")}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3 sm:px-6">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {application.interviews?.length ? (
            <InterviewSchedule application={application} locale={locale} />
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="bg-brand-muted text-accent-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                <Clock aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {t("applicationDetail.history.title")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {t("applicationDetail.history.description")}
                </p>
              </div>
            </div>
            <ol className="mt-6 space-y-0">
              {history.map((event, index) => (
                <li key={event.key} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                  <div className="relative flex justify-center">
                    <span
                      className={cn(
                        "z-10 mt-0.5 grid size-6 place-items-center rounded-full",
                        event.tone === "positive" && "bg-brand text-brand-foreground",
                        event.tone === "attention" && "bg-amber-100 text-amber-800",
                        event.tone === "negative" && "bg-rose-100 text-rose-700",
                      )}
                    >
                      {event.tone === "negative" ? (
                        <XCircle aria-hidden="true" size={13} weight="bold" />
                      ) : event.tone === "attention" ? (
                        <Clock aria-hidden="true" size={13} weight="bold" />
                      ) : (
                        <Check aria-hidden="true" size={13} weight="bold" />
                      )}
                    </span>
                    {index < history.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-7 bottom-0 w-px bg-slate-200"
                      />
                    ) : null}
                  </div>
                  <div className="pb-6">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-sm font-bold text-slate-900">{event.title}</h3>
                      <time
                        className="text-xs font-semibold text-slate-500"
                        dateTime={event.dateTime}
                      >
                        {event.date}
                      </time>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{event.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="bg-brand-muted text-accent-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                <FileText aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {t("applicationDetail.submission.title")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {t("applicationDetail.submission.description")}
                </p>
              </div>
            </div>
            <dl className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200">
              <DetailRow
                label={t("applicationDetail.submission.resume")}
                value={t("applicationDetail.submission.resumeVersion", {
                  version: application.cvVersion.versionNo,
                })}
              />
              <DetailRow
                label={t("applicationDetail.submission.submittedAt")}
                value={formatDateTime(application.submittedAt, locale)}
              />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={isViewingCv}
                onClick={() => handleViewCv(application.cvVersion)}
              >
                {isViewingCv ? (
                  <SpinnerGap aria-hidden="true" className="animate-spin" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
                {t("applicationDetail.submission.viewCv")}
              </Button>
              {(application.availableActions?.canChangeCv ??
              canChangeApplicationCv(application.status)) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setChangeCvOpen(true)}
                >
                  <PencilSimple aria-hidden="true" />
                  {t("applicationDetail.changeCv.action")}
                </Button>
              ) : null}
            </div>
            {application.coverLetter ? (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-slate-900">
                  {t("applicationDetail.submission.coverLetter")}
                </h3>
                <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-7 break-words whitespace-pre-wrap text-slate-600">
                  {application.coverLetter}
                </p>
              </div>
            ) : null}
            {cvPreviewError ? (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                {cvPreviewError}
              </p>
            ) : null}
            {session ? (
              <ChangeCvDialog
                open={changeCvOpen}
                onOpenChange={setChangeCvOpen}
                applicationId={applicationId}
                currentCvVersionId={application.cvVersion.id}
                accessToken={session.accessToken}
                onChanged={handleCvChanged}
              />
            ) : null}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24" aria-label={t("common.supportingInfo")}>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              {t("applicationDetail.current.title")}
            </p>
            <div className="mt-3">
              <ApplicationStatusBadge
                status={application.status}
                offerResponse={application.offerResponse}
                offerDeadlineAt={application.offerDeadlineAt}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {t(`applicationDetail.current.${application.status}.description`)}
            </p>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 font-semibold text-slate-600">
              {t(`applicationDetail.current.${application.status}.nextStep`)}
            </p>
          </section>

          {application.status === "OFFERED" ? (
            <OfferPanel
              application={application}
              locale={locale}
              onRespond={(action) => setOfferResponseAction(action)}
            />
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="text-base font-bold text-slate-950">
              {t("applicationDetail.job.title")}
            </h2>
            <dl className="mt-4 space-y-4">
              <InfoItem
                icon={<Briefcase />}
                label={t("applicationDetail.job.employmentType")}
                value={
                  application.jobPost.employmentType?.name ?? t("applicationDetail.job.unknown")
                }
              />
              <InfoItem
                icon={<MapPin />}
                label={t("applicationDetail.job.location")}
                value={location}
              />
              <InfoItem
                icon={<CalendarBlank />}
                label={t("applicationDetail.job.appliedAt")}
                value={formatDate(application.submittedAt, locale)}
              />
            </dl>
          </section>

          {(application.availableActions?.canWithdraw ??
          canWithdrawApplication(application.status)) ? (
            <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
              <h2 className="text-sm font-bold text-red-900">
                {t("applicationDetail.withdraw.title")}
              </h2>
              <p className="mt-2 text-xs leading-5 text-red-800">
                {t("applicationDetail.withdraw.description")}
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full rounded-xl border-red-200 bg-white text-red-700 hover:border-red-300 hover:text-red-800"
                onClick={() => setWithdrawOpen(true)}
              >
                {t("applicationDetail.withdraw.action")}
              </Button>
              <WithdrawDialog
                isPending={withdrawMutation.isPending}
                isError={withdrawMutation.isError}
                open={withdrawOpen}
                onConfirm={() => withdrawMutation.mutate()}
                onOpenChange={setWithdrawOpen}
              />
            </section>
          ) : null}
        </aside>
      </div>
      <CvSnapshotPreviewDialog
        open={Boolean(builderPreview)}
        onOpenChange={(open) => {
          if (!open) setBuilderPreview(null);
        }}
        title={builderPreview?.title ?? t("applicationDetail.submission.viewCv")}
        cvData={builderPreview?.cvData ?? null}
      />
      <OfferResponseDialog
        action={offerResponseAction}
        isPending={respondOfferMutation.isPending}
        onConfirm={() => {
          if (offerResponseAction) respondOfferMutation.mutate(offerResponseAction);
        }}
        onOpenChange={(open) => {
          if (!open && !respondOfferMutation.isPending) setOfferResponseAction(null);
        }}
      />
    </div>
  );
}

function WithdrawDialog({
  isError,
  isPending,
  onOpenChange,
  onConfirm,
  open,
}: Readonly<{
  isError: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>) {
  const t = useTranslations("CandidateWorkspace");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("applicationDetail.withdraw.cancel")} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("applicationDetail.withdraw.confirmTitle")}</DialogTitle>
          <DialogDescription className="pt-1 leading-6">
            {t("applicationDetail.withdraw.confirmDescription")}
          </DialogDescription>
        </DialogHeader>
        {isError ? (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {t("applicationDetail.withdraw.error")}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>
            {t("applicationDetail.withdraw.cancel")}
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? <SpinnerGap aria-hidden="true" className="animate-spin" /> : null}
            {isPending
              ? t("applicationDetail.withdraw.withdrawing")
              : t("applicationDetail.withdraw.confirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InterviewSchedule({
  application,
  locale,
}: Readonly<{ application: CandidateApplicationApi; locale: string }>) {
  const t = useTranslations("CandidateWorkspace");
  const upcoming = (application.interviews ?? []).filter((interview) =>
    ["SCHEDULED", "RESCHEDULED"].includes(interview.status),
  );
  if (!upcoming.length) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <CalendarBlank aria-hidden="true" size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {t("applicationDetail.interviews.title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {t("applicationDetail.interviews.description")}
          </p>
        </div>
      </div>
      <ol className="mt-5 space-y-3">
        {upcoming.map((interview) => (
          <li key={interview.id} className="rounded-xl border border-amber-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t("applicationDetail.interviews.round", { round: interview.interviewRound })}
                </p>
                <p className="mt-1 text-sm font-medium text-amber-900">
                  {formatDateTime(interview.scheduledStartAt, locale)}
                </p>
              </div>
              <span className="w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                {interview.type === "ONLINE"
                  ? t("applicationDetail.interviews.online")
                  : t("applicationDetail.interviews.onsite")}
              </span>
            </div>
            {interview.type === "ONLINE" && interview.meetingUrl ? (
              <Button asChild variant="outline" size="sm" className="mt-3 rounded-lg">
                <a href={interview.meetingUrl} target="_blank" rel="noreferrer">
                  {t("applicationDetail.interviews.joinMeeting")}
                  <ArrowRight aria-hidden="true" />
                </a>
              </Button>
            ) : interview.location ? (
              <p className="mt-3 flex items-start gap-1.5 text-sm leading-6 text-slate-600">
                <MapPin aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
                {interview.location}
              </p>
            ) : null}
            {interview.recruiterNote ? (
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">
                {interview.recruiterNote}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function OfferPanel({
  application,
  locale,
  onRespond,
}: Readonly<{
  application: CandidateApplicationApi;
  locale: string;
  onRespond: (action: "ACCEPT" | "DECLINE") => void;
}>) {
  const t = useTranslations("CandidateWorkspace");
  const deadlineIsPast =
    Boolean(application.offerDeadlineAt) &&
    new Date(application.offerDeadlineAt as string).getTime() <= Date.now();
  const pending =
    !deadlineIsPast &&
    (!application.offerResponse || application.offerResponse === "PENDING") &&
    Boolean(application.availableActions?.canRespondToOffer);
  const accepted = application.offerResponse === "ACCEPTED";
  const title = pending
    ? t("applicationDetail.offer.pendingTitle")
    : accepted
      ? t("applicationDetail.offer.acceptedTitle")
      : deadlineIsPast
        ? t("applicationDetail.offer.expiredTitle")
        : t("applicationDetail.offer.declinedTitle");
  const description = pending
    ? t("applicationDetail.offer.pendingDescription")
    : accepted
      ? t("applicationDetail.offer.acceptedDescription")
      : deadlineIsPast
        ? t("applicationDetail.offer.expiredDescription")
        : t("applicationDetail.offer.declinedDescription");

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        pending ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white",
      )}
      aria-labelledby="offer-decision-title"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            pending ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600",
          )}
        >
          {accepted ? <CheckCircle size={21} weight="fill" /> : <Briefcase size={20} />}
        </span>
        <div>
          <h2 id="offer-decision-title" className="text-base font-semibold text-slate-950">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      {application.offerDetails ? (
        <dl className="mt-4 divide-y divide-emerald-100 overflow-hidden rounded-xl border border-emerald-100 bg-white">
          <DetailRow
            label={t("applicationDetail.offer.salary")}
            value={application.offerDetails.salaryOffer}
          />
          <DetailRow
            label={t("applicationDetail.offer.startDate")}
            value={application.offerDetails.startDate}
          />
          {application.offerDetails.note ? (
            <DetailRow
              label={t("applicationDetail.offer.note")}
              value={application.offerDetails.note}
            />
          ) : null}
          {application.offerDetails.offerLetterUrl ? (
            <div className="flex items-center justify-between border-t border-emerald-100 bg-slate-50 px-4 py-3 text-xs">
              <span className="font-semibold text-slate-700">
                {locale === "vi" ? "File Offer đính kèm:" : "Attached Offer Letter:"}
              </span>
              <a
                href={application.offerDetails.offerLetterUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                <DownloadSimple size={15} weight="bold" />
                {application.offerDetails.attachmentName ||
                  (locale === "vi" ? "Tải xuống Offer Letter" : "Download Offer Letter")}
              </a>
            </div>
          ) : null}
        </dl>
      ) : null}
      {pending && application.offerDeadlineAt ? (
        <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-xs leading-5 font-medium text-emerald-900 ring-1 ring-emerald-100">
          {t("applicationDetail.offer.respondBy", {
            date: formatDateTime(application.offerDeadlineAt, locale),
          })}
        </p>
      ) : null}
      {pending ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button className="rounded-xl" onClick={() => onRespond("ACCEPT")}>
            <CheckCircle aria-hidden="true" weight="bold" />
            {t("applicationDetail.offer.accept")}
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
            onClick={() => onRespond("DECLINE")}
          >
            <XCircle aria-hidden="true" weight="bold" />
            {t("applicationDetail.offer.decline")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function OfferResponseDialog({
  action,
  isPending,
  onConfirm,
  onOpenChange,
}: Readonly<{
  action: "ACCEPT" | "DECLINE" | null;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}>) {
  const t = useTranslations("CandidateWorkspace");
  const accepting = action === "ACCEPT";
  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("applicationDetail.offer.cancel")} className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {accepting
              ? t("applicationDetail.offer.confirmAcceptTitle")
              : t("applicationDetail.offer.confirmDeclineTitle")}
          </DialogTitle>
          <DialogDescription className="pt-1 leading-6">
            {accepting
              ? t("applicationDetail.offer.confirmAcceptDescription")
              : t("applicationDetail.offer.confirmDeclineDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>
            {t("applicationDetail.offer.cancel")}
          </Button>
          <Button
            variant={accepting ? "primary" : "destructive"}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? <SpinnerGap aria-hidden="true" className="animate-spin" /> : null}
            {accepting
              ? t("applicationDetail.offer.confirmAcceptAction")
              : t("applicationDetail.offer.confirmDeclineAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ApplicationTimelineTone = "positive" | "attention" | "negative";

type ApplicationHistoryEvent = {
  key: string;
  dateTime: string;
  date: string;
  title: string;
  description: string;
  tone: ApplicationTimelineTone;
};

function getApplicationHistory(
  application: CandidateApplicationApi,
  locale: string,
  t: ReturnType<typeof useTranslations>,
): ApplicationHistoryEvent[] {
  if (application.statusLogs && application.statusLogs.length > 0) {
    return application.statusLogs.map((log) => {
      let title = t(`applications.status.${log.newStatus}.label`, { defaultValue: log.newStatus });
      let description = t(`applicationDetail.current.${log.newStatus}.description`, {
        defaultValue: log.note || "",
      });
      let tone = getApplicationTimelineTone(log.newStatus, log.note);

      if (log.newStatus === "SUBMITTED") {
        if (log.oldStatus === "WITHDRAWN") {
          title = t("applicationDetail.history.resubmitted");
          description = t("applicationDetail.history.resubmittedDescription");
        } else {
          title = t("applicationDetail.history.submitted");
          description = t("applicationDetail.history.submittedDescription");
        }
      } else if (log.newStatus === "WITHDRAWN") {
        title = t("applications.status.WITHDRAWN.label", { defaultValue: "Đã rút hồ sơ" });
        description = t("applicationDetail.current.WITHDRAWN.description", {
          defaultValue: "Bạn đã chủ động rút hồ sơ khỏi quy trình tuyển dụng.",
        });
      } else if (log.note === "OFFER_RESPONSE:ACCEPTED") {
        title = t("applicationDetail.history.offerAccepted");
        description = t("applicationDetail.history.offerAcceptedDescription");
        tone = "positive";
      } else if (log.note === "OFFER_RESPONSE:DECLINED") {
        title = t("applicationDetail.history.offerDeclined");
        description = t("applicationDetail.history.offerDeclinedDescription");
        tone = "negative";
      }

      return {
        key: log.id,
        dateTime: log.changedAt,
        date: formatDateTime(log.changedAt, locale),
        title,
        description,
        tone,
      };
    });
  }

  const events: Omit<ApplicationHistoryEvent, "date">[] = [
    {
      dateTime: application.submittedAt,
      description: t("applicationDetail.history.submittedDescription"),
      key: "submitted",
      title: t("applicationDetail.history.submitted"),
      tone: "positive",
    },
  ];

  if (application.viewedAt) {
    events.push({
      dateTime: application.viewedAt,
      description: t("applicationDetail.history.viewedDescription"),
      key: "viewed",
      title: t("applicationDetail.history.viewed"),
      tone: "positive",
    });
  }

  if (application.status !== "SUBMITTED" && application.status !== "VIEWED") {
    const eventDate = application.hiredAt ?? application.rejectedAt ?? application.updatedAt;
    events.push({
      dateTime: eventDate,
      description: t(`applicationDetail.current.${application.status}.description`),
      key: application.status,
      title: t(`applications.status.${application.status}.label`),
      tone: getApplicationTimelineTone(application.status),
    });
  }

  return events.map((event) => ({ ...event, date: formatDateTime(event.dateTime, locale) }));
}

function getApplicationTimelineTone(
  status: CandidateApplicationApi["status"],
  note?: string | null,
): ApplicationTimelineTone {
  if (status === "REJECTED" || status === "WITHDRAWN" || note === "OFFER_RESPONSE:DECLINED") {
    return "negative";
  }
  if (status === "INTERVIEWING" || status === "OFFERED") return "attention";
  return "positive";
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function DetailRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm font-bold text-slate-800 sm:text-right">{value}</dd>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: Readonly<{ icon: ReactNode; label: string; value: string }>) {
  return (
    <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-2.5">
      <span aria-hidden="true" className="text-brand mt-0.5 [&_svg]:size-[18px]">
        {icon}
      </span>
      <div>
        <dt className="text-xs font-semibold text-slate-500">{label}</dt>
        <dd className="mt-0.5 text-sm font-bold break-words text-slate-800">{value}</dd>
      </div>
    </div>
  );
}

function DetailLoading() {
  const t = useTranslations("CandidateWorkspace");

  return (
    <div aria-busy="true" className="space-y-5">
      <span className="sr-only">{t("common.loading")}</span>
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[440px] rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

function DetailState({
  action,
  description,
  icon,
  title,
  tone = "neutral",
}: Readonly<{
  action: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
  tone?: "error" | "neutral";
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className={cn(
          "mx-auto grid size-14 place-items-center rounded-2xl [&_svg]:size-7",
          tone === "error" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600",
        )}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 flex justify-center">{action}</div>
    </section>
  );
}
