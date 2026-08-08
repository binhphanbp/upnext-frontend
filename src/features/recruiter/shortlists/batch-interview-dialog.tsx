"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { getRecruiterJobPosts } from "@/features/recruiter/job-posts/api";
import {
  createBatchInterviews,
  type BatchInterviewResponse,
  type BatchSchedulingMode,
  type ShortlistEntry,
} from "@/features/recruiter/shortlists/api";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

type BatchInterviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  recruiterAccountId: string;
  /** The rows the recruiter ticked, in the order the slots should follow. */
  selected: ShortlistEntry[];
  onScheduled: () => void;
};

/** Formats a Date for `<input type="datetime-local">`, which wants local wall-clock time. */
function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function BatchInterviewDialog({
  open,
  onOpenChange,
  token,
  recruiterAccountId,
  selected,
  onScheduled,
}: BatchInterviewDialogProps) {
  const [jobPostId, setJobPostId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [gapMinutes, setGapMinutes] = useState(0);
  const [mode, setMode] = useState<BatchSchedulingMode>("SEQUENTIAL");
  const [type, setType] = useState<"ONLINE" | "ONSITE">("ONLINE");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [location, setLocation] = useState("");
  const [candidateNote, setCandidateNote] = useState("");
  const [outcome, setOutcome] = useState<BatchInterviewResponse | null>(null);

  const jobPostsQuery = useQuery({
    enabled: open,
    queryKey: ["recruiter-job-posts", recruiterAccountId],
    queryFn: () => getRecruiterJobPosts(token, recruiterAccountId),
  });

  // Only postings that can still receive applications are worth interviewing against.
  const openJobPosts = useMemo(
    () => (jobPostsQuery.data ?? []).filter((post) => post.status === "PUBLISHED"),
    [jobPostsQuery.data],
  );

  useEffect(() => {
    if (!open) return;
    setOutcome(null);
    setJobPostId("");
    setMode("SEQUENTIAL");
    setDurationMinutes(30);
    setGapMinutes(0);
    setType("ONLINE");
    setMeetingUrl("");
    setLocation("");
    setCandidateNote("");
    // Tomorrow at 09:00 is a saner default than "now", which is always already invalid.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setStartAt(toLocalInputValue(tomorrow));
  }, [open]);

  const schedulable = selected.filter((entry) => entry.latestCv);
  const blocked = selected.filter((entry) => !entry.latestCv);

  const slots = useMemo(() => {
    if (!startAt) return [];
    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) return [];
    const stepMs = (durationMinutes + gapMinutes) * 60_000;

    return schedulable.map((entry, index) => ({
      entry,
      at: new Date(start.getTime() + (mode === "SEQUENTIAL" ? index * stepMs : 0)),
    }));
  }, [startAt, durationMinutes, gapMinutes, mode, schedulable]);

  const submit = useMutation({
    mutationFn: () =>
      createBatchInterviews(token, {
        jobPostId,
        candidateProfileIds: schedulable.map((entry) => entry.candidateProfile.id),
        startAt: new Date(startAt).toISOString(),
        durationMinutes,
        gapMinutes,
        mode,
        type,
        ...(type === "ONLINE" && meetingUrl ? { meetingUrl } : {}),
        ...(type === "ONSITE" && location ? { location } : {}),
        ...(candidateNote ? { candidateNote } : {}),
      }),
    onSuccess: (response) => {
      // The request succeeds even with failed rows, so the result is shown rather than
      // closing on a green toast that would hide who was not booked.
      setOutcome(response);
      onScheduled();
    },
  });

  const canSubmit = Boolean(jobPostId) && Boolean(startAt) && schedulable.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Đặt lịch phỏng vấn cho {selected.length} ứng viên</DialogTitle>
          <DialogDescription>
            Mỗi ứng viên có một buổi phỏng vấn riêng. Ai chưa ứng tuyển tin này sẽ được tạo hồ sơ
            &ldquo;nhà tuyển dụng mời&rdquo;.
          </DialogDescription>
        </DialogHeader>

        {outcome ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Đã đặt {outcome.summary.scheduled}/{outcome.summary.requested} lịch phỏng vấn
              {outcome.summary.failed > 0
                ? `, ${outcome.summary.failed} ứng viên chưa đặt được`
                : ""}
              .
            </p>
            <ul className="space-y-1.5">
              {outcome.results.map((result) => {
                const entry = selected.find(
                  (item) => item.candidateProfile.id === result.candidateProfileId,
                );
                return (
                  <li
                    key={result.candidateProfileId}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {entry?.candidateProfile.account.fullName ?? result.candidateProfileId}
                    </span>
                    <span className={result.scheduled ? "text-emerald-600" : "text-error"}>
                      {result.scheduled
                        ? new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(result.scheduledStartAt!))
                        : result.error}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="batch-job-post">Tin tuyển dụng</Label>
              <Select value={jobPostId} onValueChange={setJobPostId}>
                <SelectTrigger id="batch-job-post">
                  <SelectValue placeholder="Chọn tin tuyển dụng" />
                </SelectTrigger>
                <SelectContent>
                  {openJobPosts.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {jobPostsQuery.isSuccess && openJobPosts.length === 0 ? (
                <p className="text-error text-xs">
                  Chưa có tin tuyển dụng nào đang hiển thị để gắn buổi phỏng vấn.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="batch-start">Bắt đầu slot đầu tiên</Label>
                <Input
                  id="batch-start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch-mode">Cách xếp lịch</Label>
                <Select
                  value={mode}
                  onValueChange={(value) => setMode(value as BatchSchedulingMode)}
                >
                  <SelectTrigger id="batch-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEQUENTIAL">Nối tiếp nhau</SelectItem>
                    <SelectItem value="SAME_SLOT">Cùng một giờ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch-duration">Mỗi buổi (phút)</Label>
                <Input
                  id="batch-duration"
                  type="number"
                  min={5}
                  max={480}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(Number(event.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch-gap">Nghỉ giữa hai buổi (phút)</Label>
                <Input
                  id="batch-gap"
                  type="number"
                  min={0}
                  max={240}
                  value={gapMinutes}
                  disabled={mode === "SAME_SLOT"}
                  onChange={(event) => setGapMinutes(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="batch-type">Hình thức</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as "ONLINE" | "ONSITE")}
                >
                  <SelectTrigger id="batch-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Trực tuyến</SelectItem>
                    <SelectItem value="ONSITE">Trực tiếp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                {type === "ONLINE" ? (
                  <>
                    <Label htmlFor="batch-meeting">Link phòng họp</Label>
                    <Input
                      id="batch-meeting"
                      placeholder="https://meet.google.com/..."
                      value={meetingUrl}
                      onChange={(event) => setMeetingUrl(event.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor="batch-location">Địa điểm</Label>
                    <Input
                      id="batch-location"
                      placeholder="Tầng 5, toà A..."
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch-note">Lời dặn gửi ứng viên</Label>
              <Textarea
                id="batch-note"
                rows={2}
                value={candidateNote}
                onChange={(event) => setCandidateNote(event.target.value)}
              />
            </div>

            {blocked.length > 0 ? (
              <Card className="border-warning/40 bg-warning/5 p-3 text-sm">
                <p className="font-medium text-slate-800">
                  {blocked.length} ứng viên chưa có CV nên sẽ bị bỏ qua:
                </p>
                <p className="mt-1 text-slate-600">
                  {blocked.map((entry) => entry.candidateProfile.account.fullName).join(", ")}
                </p>
              </Card>
            ) : null}

            {slots.length > 0 ? (
              <div className="space-y-1.5">
                <Label>Lịch dự kiến</Label>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {slots.map(({ entry, at }) => (
                    <li key={entry.id} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-slate-800">
                        {entry.candidateProfile.account.fullName}
                      </span>
                      <span className="text-slate-500">
                        {new Intl.DateTimeFormat("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {submit.isError ? (
              <p className="text-error text-sm">
                Không đặt được lịch phỏng vấn. Vui lòng kiểm tra lại thông tin.
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {outcome ? (
            <Button onClick={() => onOpenChange(false)}>Đóng</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button onClick={() => submit.mutate()} disabled={!canSubmit || submit.isPending}>
                {submit.isPending ? "Đang đặt lịch..." : `Đặt ${schedulable.length} lịch phỏng vấn`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
