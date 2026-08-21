"use client";

import {
  ArrowLeft,
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  CircleNotch,
  Clock,
  MapPin,
  Prohibit,
  User,
  UserMinus,
  VideoCamera,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  cancelInterview,
  markInterviewNoShow,
  rescheduleInterview,
  updateInterviewResult,
  type InterviewResult,
} from "@/features/recruiter/api/interviews";
import { updateApplicationStatus } from "@/features/recruiter/api/team";
import { SendOfferDialog } from "@/features/recruiter/components/send-offer-dialog";
import {
  useRecruiterInterviewDetail,
  useRecruiterInterviews,
} from "@/features/recruiter/hooks/use-recruiter-interviews";
import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";

import { InterviewResultBadge, InterviewStatusBadge, InterviewTypeBadge } from "./interview-badges";
import { ScheduleInterviewDialog } from "./schedule-interview-dialog";

type InterviewDetailPageProps = Readonly<{
  interviewId: string;
}>;

type ActionMode = "none" | "reschedule" | "cancel" | "no-show" | "result";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function InterviewDetailPage({ interviewId }: InterviewDetailPageProps) {
  const router = useRouter();
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [token, setToken] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("none");
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  // Form states
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [noShowNote, setNoShowNote] = useState("");
  const [result, setResult] = useState<InterviewResult>("PASSED");
  const [feedbackNote, setFeedbackNote] = useState("");

  useEffect(() => {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }
    setToken(session.accessToken);
    getRecruiterJobPosts(session.accessToken, session.user.id)
      .then(setJobs)
      .catch(() => {});
  }, [router]);

  const { data: interview, isLoading, isError } = useRecruiterInterviewDetail(token, interviewId);

  // Fetch sibling interviews for the same application to check if next round exists
  const { data: siblingInterviews } = useRecruiterInterviews(
    token,
    interview?.applicationId ? { applicationId: interview.applicationId } : undefined,
  );

  useEffect(() => {
    if (interview) {
      setStartAt(toDatetimeLocalValue(interview.scheduledStartAt));
      setEndAt(toDatetimeLocalValue(interview.scheduledEndAt));
    }
  }, [interview]);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["recruiter", "interviews"] });
    void queryClient.invalidateQueries({ queryKey: ["recruiter", "interview", interviewId] });
  };

  const resetActionMode = () => {
    setActionMode("none");
    setRescheduleNote("");
    setCancelNote("");
    setNoShowNote("");
    setResult("PASSED");
    setFeedbackNote("");
  };

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Missing token");
      return rescheduleInterview(
        interviewId,
        {
          scheduledStartAt: new Date(startAt).toISOString(),
          scheduledEndAt: new Date(endAt).toISOString(),
          ...(rescheduleNote ? { note: rescheduleNote } : {}),
        },
        token,
      );
    },
    onSuccess: () => {
      invalidateAll();
      void toast.fire({ icon: "success", title: t("interviews.toasts.rescheduleSuccess") });
      resetActionMode();
    },
    onError: () => {
      void toast.fire({ icon: "error", title: t("interviews.toasts.rescheduleError") });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Missing token");
      return cancelInterview(interviewId, { note: cancelNote }, token);
    },
    onSuccess: () => {
      invalidateAll();
      void toast.fire({ icon: "success", title: t("interviews.toasts.cancelSuccess") });
      resetActionMode();
    },
    onError: () => {
      void toast.fire({ icon: "error", title: t("interviews.toasts.cancelError") });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Missing token");
      return markInterviewNoShow(interviewId, { note: noShowNote }, token);
    },
    onSuccess: () => {
      invalidateAll();
      void toast.fire({
        icon: "success",
        title: locale === "vi" ? "Đã đánh dấu không có mặt" : "Marked as no-show",
      });
      resetActionMode();
    },
    onError: () => {
      void toast.fire({
        icon: "error",
        title: locale === "vi" ? "Không thể đánh dấu" : "Failed to mark as no-show",
      });
    },
  });

  const resultMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Missing token");
      return updateInterviewResult(
        interviewId,
        { result, ...(feedbackNote ? { feedbackNote } : {}) },
        token,
      );
    },
    onSuccess: () => {
      invalidateAll();
      void toast.fire({ icon: "success", title: t("interviews.toasts.resultSuccess") });
      resetActionMode();
    },
    onError: () => {
      void toast.fire({ icon: "error", title: t("interviews.toasts.resultError") });
    },
  });

  if (isLoading) {
    return (
      <output className="grid min-h-[420px] place-items-center" aria-live="polite">
        <span className="flex flex-col items-center gap-3 text-sm font-medium text-slate-600">
          <CircleNotch className="size-8 animate-spin text-emerald-600" aria-hidden="true" />
          {t("onboarding.loading")}
        </span>
      </output>
    );
  }

  if (isError || !interview) {
    return (
      <Card className="mx-auto max-w-2xl border-slate-200 shadow-none">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
          <span className="mb-4 grid size-14 place-items-center rounded-full bg-amber-50 text-amber-600">
            <WarningCircle size={28} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold text-slate-950">
            {locale === "vi" ? "Không tìm thấy phỏng vấn" : "Interview not found"}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            {locale === "vi"
              ? "Cuộc phỏng vấn này không tồn tại hoặc bạn không có quyền xem."
              : "This interview does not exist or you don't have access."}
          </p>
          <Button className="mt-6" onClick={() => router.push("/recruiter/interviews")}>
            <ArrowLeft aria-hidden="true" />
            {locale === "vi" ? "Quay lại danh sách" : "Back to list"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isClosed =
    interview.status === "CANCELLED" ||
    interview.status === "COMPLETED" ||
    interview.status === "NO_SHOW";
  const rescheduleLimitReached = interview.rescheduleCount >= interview.maxRescheduleCount;

  const candidateName = interview.application?.candidateProfile.account.fullName ?? "—";
  const jobTitle = interview.application?.jobPost.title ?? "—";
  const companyName = interview.application?.jobPost.company?.name ?? "";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl border-slate-200"
            aria-label={locale === "vi" ? "Quay lại danh sách" : "Back to list"}
            onClick={() => router.push("/recruiter/interviews")}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
              {t("interviews.detail.title")}
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-slate-950">{candidateName}</h1>
            <p className="mt-1 truncate text-sm text-slate-500">
              {jobTitle}
              {companyName ? ` — ${companyName}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
          <InterviewStatusBadge status={interview.status} />
          <InterviewResultBadge result={interview.result} />
          <InterviewTypeBadge type={interview.type} />
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Left Column — Content */}
        <section className="min-w-0 space-y-6" aria-label={t("interviews.detail.title")}>
          {/* Interview Info Card */}
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-950">
                {locale === "vi" ? "Thông tin phỏng vấn" : "Interview Information"}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<CalendarBlank size={16} className="text-emerald-600" />}
                  label={t("interviews.table.schedule")}
                  value={
                    <>
                      {new Date(interview.scheduledStartAt).toLocaleString(
                        locale === "vi" ? "vi-VN" : "en-US",
                        { dateStyle: "medium", timeStyle: "short" },
                      )}
                      {" — "}
                      {new Date(interview.scheduledEndAt).toLocaleTimeString(
                        locale === "vi" ? "vi-VN" : "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </>
                  }
                />
                <InfoRow
                  icon={<User size={16} className="text-emerald-600" />}
                  label={t("interviews.table.interviewer")}
                  value={interview.recruiterProfile?.fullName ?? "—"}
                />
                <InfoRow
                  icon={<Clock size={16} className="text-emerald-600" />}
                  label={locale === "vi" ? "Vòng phỏng vấn" : "Interview Round"}
                  value={`${locale === "vi" ? "Vòng" : "Round"} ${interview.interviewRound}`}
                />
                {interview.type === "ONLINE" && interview.meetingUrl ? (
                  <div className="sm:col-span-2">
                    <InfoRow
                      icon={<VideoCamera size={16} className="text-emerald-600" />}
                      label={t("interviews.detail.meetingUrl")}
                      value={
                        <a
                          href={interview.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium break-all text-emerald-600 hover:underline"
                        >
                          {interview.meetingUrl}
                        </a>
                      }
                    />
                  </div>
                ) : null}
                {interview.type === "ONSITE" && interview.location ? (
                  <div className="sm:col-span-2">
                    <InfoRow
                      icon={<MapPin size={16} className="text-emerald-600" />}
                      label={t("interviews.detail.location")}
                      value={interview.location}
                    />
                  </div>
                ) : null}
              </div>
              {interview.recruiterNote ? (
                <>
                  <Separator className="my-4" />
                  <div>
                    <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      {t("interviews.detail.recruiterNote")}
                    </span>
                    <p className="mt-1 text-sm font-medium whitespace-pre-line text-slate-700">
                      {interview.recruiterNote}
                    </p>
                  </div>
                </>
              ) : null}
              {interview.candidateNote ? (
                <>
                  <Separator className="my-4" />
                  <div>
                    <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      {locale === "vi" ? "Ghi chú cho ứng viên" : "Candidate Note"}
                    </span>
                    <p className="mt-1 text-sm font-medium whitespace-pre-line text-slate-700">
                      {interview.candidateNote}
                    </p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Action Form Card — only visible when an action is selected */}

          {actionMode === "cancel" && (
            <Card className="border-rose-200 shadow-none">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <h2 className="text-base font-semibold text-slate-950">
                  {t("interviews.actions.cancel")}
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="cancel-note">{t("interviews.cancelForm.note")}</Label>
                  <textarea
                    id="cancel-note"
                    value={cancelNote}
                    onChange={(e) => setCancelNote(e.target.value)}
                    rows={3}
                    placeholder={t("interviews.cancelForm.notePlaceholder")}
                    className="upnext-focus border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={resetActionMode}
                    className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600"
                  >
                    {t("interviews.cancelForm.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending || !cancelNote.trim()}
                    className="h-10 rounded-full px-4 text-sm font-bold"
                  >
                    {t("interviews.cancelForm.submit")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {actionMode === "no-show" && (
            <Card className="border-slate-300 shadow-none">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <h2 className="text-base font-semibold text-slate-950">
                  {locale === "vi" ? "Đánh dấu không có mặt" : "Mark as No-Show"}
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="noshow-note">
                    {locale === "vi" ? "Ghi chú / lý do" : "Note / reason"}
                  </Label>
                  <textarea
                    id="noshow-note"
                    value={noShowNote}
                    onChange={(e) => setNoShowNote(e.target.value)}
                    rows={3}
                    placeholder={
                      locale === "vi"
                        ? "Mô tả ngắn gọn lý do ứng viên không có mặt..."
                        : "Brief description of why the candidate didn't show up..."
                    }
                    className="upnext-focus border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={resetActionMode}
                    className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600"
                  >
                    {locale === "vi" ? "Hủy bỏ" : "Cancel"}
                  </Button>
                  <Button
                    onClick={() => noShowMutation.mutate()}
                    disabled={noShowMutation.isPending || !noShowNote.trim()}
                    className="h-10 rounded-lg bg-slate-700 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {locale === "vi" ? "Xác nhận không có mặt" : "Confirm No-Show"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {actionMode === "result" && (
            <Card className="border-blue-200 shadow-none">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <h2 className="text-base font-semibold text-slate-950">
                  {t("interviews.actions.updateResult")}
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="result-select">{t("interviews.resultForm.result")}</Label>
                  <Select value={result} onValueChange={(v) => setResult(v as InterviewResult)}>
                    <SelectTrigger id="result-select" className="shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSED">{t("interviews.result.PASSED")}</SelectItem>
                      <SelectItem value="FAILED">{t("interviews.result.FAILED")}</SelectItem>
                      <SelectItem value="UNDER_REVIEW">
                        {t("interviews.result.UNDER_REVIEW")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="result-feedback">{t("interviews.resultForm.feedbackNote")}</Label>
                  <textarea
                    id="result-feedback"
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    rows={3}
                    className="upnext-focus border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={resetActionMode}
                    className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600"
                  >
                    {t("interviews.resultForm.cancel")}
                  </Button>
                  <Button
                    onClick={() => resultMutation.mutate()}
                    disabled={resultMutation.isPending}
                    className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {t("interviews.resultForm.submit")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interview Logs Timeline */}
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-950">
                {t("interviews.detail.logsTitle")}
              </h2>
              {interview.logs.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">{t("interviews.detail.noLogs")}</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {interview.logs.map((log) => (
                    <li
                      key={log.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {log.oldStatus ? `${log.oldStatus} → ${log.newStatus}` : log.newStatus}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {new Date(log.createdAt).toLocaleString(
                            locale === "vi" ? "vi-VN" : "en-US",
                            { dateStyle: "short", timeStyle: "short" },
                          )}
                        </span>
                      </div>
                      {log.note ? (
                        <p className="mt-2 text-sm leading-6 text-slate-500">{log.note}</p>
                      ) : null}
                      {log.proposedStartAt ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {locale === "vi" ? "Thời gian đề xuất: " : "Proposed: "}
                          {new Date(log.proposedStartAt).toLocaleString(
                            locale === "vi" ? "vi-VN" : "en-US",
                            { dateStyle: "short", timeStyle: "short" },
                          )}
                          {log.proposedEndAt
                            ? ` — ${new Date(log.proposedEndAt).toLocaleTimeString(
                                locale === "vi" ? "vi-VN" : "en-US",
                                { hour: "2-digit", minute: "2-digit" },
                              )}`
                            : ""}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right Column — Sidebar */}
        <aside
          className="space-y-3 xl:sticky xl:top-4 xl:self-start"
          aria-label={locale === "vi" ? "Thao tác phỏng vấn" : "Interview Actions"}
        >
          {/* Status & Result Card */}
          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {locale === "vi" ? "Trạng thái" : "Status"}
                </p>
                <div className="mt-1">
                  <InterviewStatusBadge status={interview.status} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {locale === "vi" ? "Kết quả" : "Result"}
                </p>
                <div className="mt-1">
                  <InterviewResultBadge result={interview.result} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {locale === "vi" ? "Hình thức" : "Type"}
                </p>
                <div className="mt-1">
                  <InterviewTypeBadge type={interview.type} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Card */}
          {!isClosed ? (
            <Card className="border-slate-200 shadow-none">
              <CardContent className="space-y-2 p-5">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={actionMode === "result"}
                  onClick={() => setActionMode("result")}
                >
                  {t("interviews.actions.updateResult")}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={actionMode === "no-show"}
                  onClick={() => setActionMode("no-show")}
                >
                  {locale === "vi" ? "Không có mặt" : "No-Show"}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  disabled={actionMode === "cancel"}
                  onClick={() => setActionMode("cancel")}
                >
                  {t("interviews.actions.cancel")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-none">
              <CardContent className="flex items-start gap-3 p-5">
                <span
                  className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                    interview.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-600"
                      : interview.status === "CANCELLED"
                        ? "bg-rose-50 text-rose-500"
                        : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {interview.status === "COMPLETED" ? (
                    <CheckCircle size={18} weight="fill" />
                  ) : interview.status === "CANCELLED" ? (
                    <Prohibit size={18} weight="fill" />
                  ) : (
                    <UserMinus size={18} weight="fill" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {interview.status === "COMPLETED"
                      ? locale === "vi"
                        ? "Đã hoàn thành"
                        : "Completed"
                      : interview.status === "CANCELLED"
                        ? locale === "vi"
                          ? "Đã hủy"
                          : "Cancelled"
                        : locale === "vi"
                          ? "Không có mặt"
                          : "No-Show"}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-400">
                    {locale === "vi" ? "Không thể thực hiện thao tác." : "No actions available."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post-Interview Actions (Send Offer & Schedule Next Round) */}
          {isClosed &&
            interview.result === "PASSED" &&
            (() => {
              const nextRound = interview.interviewRound + 1;
              const nextRoundInterview = siblingInterviews?.find(
                (iv) => iv.interviewRound === nextRound && iv.status !== "CANCELLED",
              );
              return (
                <Card className="border-slate-200 bg-white shadow-none">
                  <CardContent className="space-y-2.5 p-4">
                    {/* Offer Button States */}
                    {interview.application?.status === "HIRED" ? (
                      <div className="flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-extrabold text-emerald-700">
                        <CheckCircle size={16} weight="bold" />
                        {locale === "vi" ? "Ứng viên đã nhận việc" : "Candidate Hired"}
                      </div>
                    ) : interview.application?.status === "OFFERED" ? (
                      <div className="flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 text-xs font-bold text-amber-800 opacity-90">
                        <CheckCircle size={16} className="text-amber-600" weight="bold" />
                        {locale === "vi" ? "Đã gửi đề nghị tuyển dụng" : "Offer Already Sent"}
                      </div>
                    ) : (
                      <Button
                        className="h-11 w-full rounded-full bg-amber-600 px-4 text-sm font-bold text-white shadow-none transition-colors hover:bg-amber-700"
                        onClick={() => setOfferOpen(true)}
                      >
                        {locale === "vi" ? "Gửi đề nghị việc làm" : "Send Job Offer"}
                      </Button>
                    )}
                    {!nextRoundInterview ? (
                      <Button
                        className="h-11 w-full rounded-full bg-emerald-600 px-4 text-sm font-bold text-white shadow-none transition-colors hover:bg-emerald-700"
                        onClick={() => setScheduleOpen(true)}
                      >
                        {t("interviews.actions.scheduleNextRound")}
                      </Button>
                    ) : (
                      <div className="space-y-2 border-t border-slate-100 pt-2">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                            <CalendarCheck size={16} weight="fill" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-slate-700">
                              {locale === "vi"
                                ? `Vòng ${nextRound} đã được lên lịch`
                                : `Round ${nextRound} scheduled`}
                            </p>
                            <p className="text-[11px] leading-4 text-slate-400">
                              {new Date(nextRoundInterview.scheduledStartAt).toLocaleString(
                                locale === "vi" ? "vi-VN" : "en-US",
                                { dateStyle: "medium", timeStyle: "short" },
                              )}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/recruiter/interviews/${nextRoundInterview.id}`}
                          className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          {locale === "vi"
                            ? `Đi đến vòng ${nextRound}`
                            : `Go to round ${nextRound}`}
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
        </aside>
      </div>

      <ScheduleInterviewDialog
        token={token}
        jobs={jobs}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        initialValues={{
          applicationId: interview.applicationId,
          interviewRound: interview.interviewRound + 1,
          jobId: interview.application?.jobPost.id,
        }}
        lockApplication
        onScheduled={() => {
          invalidateAll();
        }}
      />

      <SendOfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        applicationId={interview.applicationId}
        candidateName={candidateName}
        jobTitle={jobTitle}
        onConfirmOffer={async (appId, offerDetails) => {
          if (!token) return;
          await updateApplicationStatus(appId, "OFFERED", token, { offer: offerDetails });
          invalidateAll();
        }}
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="block text-xs font-semibold tracking-wide text-slate-400 uppercase">
          {label}
        </span>
        <span className="mt-0.5 block text-sm font-medium text-slate-700">{value}</span>
      </div>
    </div>
  );
}
