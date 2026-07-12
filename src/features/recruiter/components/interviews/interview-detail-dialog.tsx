"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  cancelInterview,
  rescheduleInterview,
  updateInterviewResult,
  type InterviewResult,
} from "@/features/recruiter/api/interviews";
import { useRecruiterInterviewDetail } from "@/features/recruiter/hooks/use-recruiter-interviews";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

import { InterviewResultBadge, InterviewStatusBadge, InterviewTypeBadge } from "./interview-badges";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

type Mode = "view" | "reschedule" | "cancel" | "result";

type InterviewDetailDialogProps = Readonly<{
  interviewId: string | null;
  token: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleNextRound?: (applicationId: string, nextRound: number) => void;
}>;

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function InterviewDetailDialog({
  interviewId,
  token,
  open,
  onOpenChange,
  onScheduleNextRound,
}: InterviewDetailDialogProps) {
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("view");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [result, setResult] = useState<InterviewResult>("PASSED");
  const [feedbackNote, setFeedbackNote] = useState("");

  const { data: interview, isLoading } = useRecruiterInterviewDetail(
    token,
    open ? interviewId : null,
  );

  useEffect(() => {
    if (!open) return;
    setMode("view");
    setRescheduleNote("");
    setCancelNote("");
    setResult("PASSED");
    setFeedbackNote("");
  }, [open, interviewId]);

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

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!token || !interviewId) throw new Error("Missing token");
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
      setMode("view");
    },
    onError: () => {
      void toast.fire({ icon: "error", title: t("interviews.toasts.rescheduleError") });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!token || !interviewId) throw new Error("Missing token");
      return cancelInterview(interviewId, { note: cancelNote }, token);
    },
    onSuccess: () => {
      invalidateAll();
      void toast.fire({ icon: "success", title: t("interviews.toasts.cancelSuccess") });
      setMode("view");
    },
    onError: () => {
      void toast.fire({ icon: "error", title: t("interviews.toasts.cancelError") });
    },
  });

  const resultMutation = useMutation({
    mutationFn: async () => {
      if (!token || !interviewId) throw new Error("Missing token");
      return updateInterviewResult(
        interviewId,
        { result, ...(feedbackNote ? { feedbackNote } : {}) },
        token,
      );
    },
    onSuccess: () => {
      invalidateAll();
      void toast.fire({ icon: "success", title: t("interviews.toasts.resultSuccess") });
      setMode("view");
    },
    onError: () => {
      void toast.fire({ icon: "error", title: t("interviews.toasts.resultError") });
    },
  });

  const isClosed = interview?.status === "CANCELLED" || interview?.status === "COMPLETED";
  const rescheduleLimitReached = Boolean(
    interview && interview.rescheduleCount >= interview.maxRescheduleCount,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] max-w-xl flex-col overflow-hidden p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .popup-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .popup-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .popup-scrollbar::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 99px;
              }
              .popup-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `,
          }}
        />
        <DialogHeader className="shrink-0 border-b p-6 pb-4">
          <DialogTitle>{t("interviews.detail.title")}</DialogTitle>
        </DialogHeader>

        <div className="popup-scrollbar flex-1 space-y-4 overflow-y-auto p-6 pt-0">
          {isLoading || !interview ? (
            <div className="flex h-40 items-center justify-center text-sm font-medium text-slate-400">
              {t("onboarding.loading")}
            </div>
          ) : mode === "view" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {interview.application?.candidateProfile.account.fullName ?? "—"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {interview.application?.jobPost.title ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <InterviewStatusBadge status={interview.status} />
                  <InterviewResultBadge result={interview.result} />
                  <InterviewTypeBadge type={interview.type} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">
                    {t("interviews.table.schedule")}
                  </span>
                  <span className="font-medium text-slate-700">
                    {new Date(interview.scheduledStartAt).toLocaleString(
                      locale === "vi" ? "vi-VN" : "en-US",
                      { dateStyle: "medium", timeStyle: "short" },
                    )}
                    {" - "}
                    {new Date(interview.scheduledEndAt).toLocaleTimeString(
                      locale === "vi" ? "vi-VN" : "en-US",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">
                    {t("interviews.table.interviewer")}
                  </span>
                  <span className="font-medium text-slate-700">
                    {interview.recruiterProfile?.fullName ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">
                    {t("interviews.detail.roundLabel", { round: interview.interviewRound })}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">
                    {t("interviews.detail.rescheduleCount", {
                      count: interview.rescheduleCount,
                      max: interview.maxRescheduleCount,
                    })}
                  </span>
                </div>
                {interview.type === "ONLINE" && interview.meetingUrl ? (
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-semibold text-slate-400 uppercase">
                      {t("interviews.detail.meetingUrl")}
                    </span>
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium break-all text-emerald-600 hover:underline"
                    >
                      {interview.meetingUrl}
                    </a>
                  </div>
                ) : null}
                {interview.type === "ONSITE" && interview.location ? (
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-semibold text-slate-400 uppercase">
                      {t("interviews.detail.location")}
                    </span>
                    <span className="font-medium text-slate-700">{interview.location}</span>
                  </div>
                ) : null}
                {interview.recruiterNote ? (
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-semibold text-slate-400 uppercase">
                      {t("interviews.detail.recruiterNote")}
                    </span>
                    <p className="font-medium whitespace-pre-line text-slate-700">
                      {interview.recruiterNote}
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t("interviews.detail.logsTitle")}
                </h4>
                {interview.logs.length === 0 ? (
                  <p className="text-xs text-slate-400">{t("interviews.detail.noLogs")}</p>
                ) : (
                  <ul className="space-y-2">
                    {interview.logs.map((log) => (
                      <li
                        key={log.id}
                        className="rounded-lg border border-slate-100 bg-white p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-700">
                          <span>
                            {log.oldStatus ? `${log.oldStatus} → ${log.newStatus}` : log.newStatus}
                          </span>
                          <span className="font-normal text-slate-400">
                            {new Date(log.createdAt).toLocaleString(
                              locale === "vi" ? "vi-VN" : "en-US",
                              { dateStyle: "short", timeStyle: "short" },
                            )}
                          </span>
                        </div>
                        {log.note ? <p className="mt-1 text-slate-500">{log.note}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : mode === "reschedule" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reschedule-start">{t("interviews.rescheduleForm.startAt")}</Label>
                <Input
                  id="reschedule-start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-end">{t("interviews.rescheduleForm.endAt")}</Label>
                <Input
                  id="reschedule-end"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-note">{t("interviews.rescheduleForm.note")}</Label>
                <textarea
                  id="reschedule-note"
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  rows={3}
                  className="upnext-focus border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                />
              </div>
            </div>
          ) : mode === "cancel" ? (
            <div className="space-y-4">
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
            </div>
          ) : (
            <div className="space-y-4">
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
            </div>
          )}
        </div>

        {!isLoading && interview && (
          <DialogFooter className="shrink-0 gap-3 border-t p-6 pt-4">
            {mode === "view" ? (
              <>
                {isClosed && interview.result === "PASSED" && onScheduleNextRound && (
                  <Button
                    onClick={() => {
                      onScheduleNextRound(interview.applicationId, interview.interviewRound + 1);
                      onOpenChange(false);
                    }}
                    className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    {t("interviews.actions.scheduleNextRound")}
                  </Button>
                )}
                {!isClosed && (
                  <Button
                    variant="outline"
                    onClick={() => setMode("result")}
                    className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600"
                  >
                    {t("interviews.actions.updateResult")}
                  </Button>
                )}
                {!isClosed && (
                  <Button
                    variant="outline"
                    disabled={rescheduleLimitReached}
                    onClick={() => setMode("reschedule")}
                    className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600"
                  >
                    {t("interviews.actions.reschedule")}
                  </Button>
                )}
                {!isClosed && (
                  <Button
                    variant="destructive"
                    onClick={() => setMode("cancel")}
                    className="h-10 rounded-full px-4 text-sm font-bold"
                  >
                    {t("interviews.actions.cancel")}
                  </Button>
                )}
              </>
            ) : mode === "reschedule" ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setMode("view")}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600"
                >
                  {t("interviews.rescheduleForm.cancel")}
                </Button>
                <Button
                  onClick={() => rescheduleMutation.mutate()}
                  disabled={rescheduleMutation.isPending || !startAt || !endAt}
                  className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {t("interviews.rescheduleForm.submit")}
                </Button>
              </>
            ) : mode === "cancel" ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setMode("view")}
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
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setMode("view")}
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
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
