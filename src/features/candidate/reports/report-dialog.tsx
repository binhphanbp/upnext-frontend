"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  createReport,
  uploadReportEvidence,
  type CandidateReportTargetType,
} from "@/features/candidate/reports/api";
import { getCandidateSession } from "@/features/candidate/session";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "@/shared/ui/toast";

/**
 * Codes, not free prose, because the admin table groups reports by matching keywords in
 * `reason` — a hand-typed sentence would land in "Khác".
 */
const REASONS: Record<CandidateReportTargetType, Array<{ code: string; label: string }>> = {
  COMPANY: [
    { code: "SCAM_FEE", label: "Yêu cầu nộp tiền / phí" },
    { code: "FAKE_INFO", label: "Thông tin công ty sai sự thật" },
    { code: "DEFAMATION", label: "Xúc phạm, quấy rối ứng viên" },
    { code: "GAMBLING", label: "Hoạt động phi pháp, cờ bạc" },
    { code: "OTHER", label: "Lý do khác" },
  ],
  JOB_POST: [
    { code: "FAKE_JOB", label: "Tin tuyển dụng giả mạo" },
    { code: "SCAM_FEE", label: "Yêu cầu nộp tiền / phí" },
    { code: "FAKE_INFO", label: "Mô tả sai lệch so với thực tế" },
    { code: "SPAM", label: "Spam, đăng lại nhiều lần" },
    { code: "SUSPICIOUS_LINK", label: "Chứa liên kết đáng ngờ" },
    { code: "OTHER", label: "Lý do khác" },
  ],
};

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: CandidateReportTargetType;
  targetId: string;
  /** Name of the company or job post, shown so the user knows what they are reporting. */
  targetName: string;
};

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
}: ReportDialogProps) {
  const reasons = REASONS[targetType];
  const [reasonCode, setReasonCode] = useState(reasons[0]!.code);
  const [detail, setDetail] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setReasonCode(reasons[0]!.code);
    setDetail("");
    setEvidence(null);
  }, [open, reasons]);

  const queryClient = useQueryClient();
  const submit = useMutation({
    mutationFn: async () => {
      const session = getCandidateSession();
      if (!session) throw new ApiError(401, "Chưa đăng nhập", null);

      const evidenceFileId = evidence
        ? (await uploadReportEvidence(evidence, session.accessToken)).file.id
        : undefined;

      return createReport(
        {
          targetType,
          targetId,
          // The code drives the admin grouping; the detail is what a human reads.
          reason: detail.trim() ? `${reasonCode}: ${detail.trim()}` : reasonCode,
          ...(evidenceFileId ? { evidenceFileId } : {}),
        },
        session.accessToken,
      );
    },
    onSuccess: () => {
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["candidate-report-status"] });
      toast.success("Đã gửi báo cáo tới quản trị viên. Cảm ơn bạn!");
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.status === 401
          ? "Vui lòng đăng nhập để gửi báo cáo."
          : "Không gửi được báo cáo. Vui lòng thử lại.";
      toast.error(message);
    },
  });

  function handleEvidenceChange(file: File | null) {
    if (file && file.size > MAX_EVIDENCE_BYTES) {
      toast.error("Ảnh tối đa 5MB.");
      return;
    }
    setEvidence(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Báo cáo vi phạm</DialogTitle>
          <DialogDescription>
            Bạn đang báo cáo{" "}
            <strong>
              {targetType === "COMPANY" ? "công ty" : "tin tuyển dụng"} {targetName}
            </strong>
            . Quản trị viên sẽ xem xét và phản hồi qua email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="report-reason">Lý do báo cáo</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger id="report-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.code} value={reason.code}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-detail">Mô tả chi tiết</Label>
            <Textarea
              id="report-detail"
              rows={4}
              maxLength={1000}
              placeholder="Mô tả cụ thể điều bạn gặp phải, càng chi tiết càng dễ xử lý."
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-evidence">Ảnh bằng chứng (không bắt buộc)</Label>
            <input
              id="report-evidence"
              aria-label="Ảnh bằng chứng"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="text-muted-foreground file:bg-muted file:text-foreground w-full text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
              onChange={(event) => handleEvidenceChange(event.target.files?.[0] ?? null)}
            />
            {evidence ? (
              <p className="text-muted-foreground text-xs">Đã chọn: {evidence.name}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Đang gửi..." : "Gửi báo cáo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
