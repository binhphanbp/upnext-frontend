"use client";

import { CircleNotch, Envelope, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { getApplicationDetail, type ApplicationDetail } from "@/features/recruiter/api/team";
import type { Locale } from "@/i18n/routing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

type CoverLetterDialogProps = Readonly<{
  applicationId: string | null;
  onOpenChange: (open: boolean) => void;
  token: string;
  locale: Locale;
}>;

/**
 * Popup riêng cho "Thư ứng tuyển" — tách khỏi popup hồ sơ ứng viên vì đây là
 * nội dung gắn với TỪNG đơn ứng tuyển (Application.coverLetter), không phải
 * một phần hồ sơ cá nhân của ứng viên. Dùng lại `getApplicationDetail` vì đó
 * là endpoint duy nhất trả field này cho recruiter.
 */
export function CoverLetterDialog({
  applicationId,
  onOpenChange,
  token,
  locale,
}: CoverLetterDialogProps) {
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
              ? "Không tải được thư ứng tuyển. Vui lòng thử lại."
              : "Could not load the cover letter. Please try again.",
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

  const name = detail?.candidateProfile.account.fullName ?? (vi ? "Ẩn danh" : "Anonymous");

  return (
    <Dialog open={applicationId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5 pr-8">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Envelope size={20} weight="bold" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-slate-900">
                {vi ? "Thư ứng tuyển" : "Cover letter"}
              </DialogTitle>
              <DialogDescription className="truncate text-xs font-medium text-slate-500">
                {name}
                {detail ? ` — ${detail.jobPost.title}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex h-24 items-center justify-center text-sm font-bold text-slate-500">
              <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
              {vi ? "Đang tải..." : "Loading..."}
            </div>
          ) : error ? (
            <div className="flex h-24 flex-col items-center justify-center gap-2 text-center">
              <WarningCircle size={28} className="text-rose-500" />
              <p className="text-sm font-semibold text-slate-700">{error}</p>
            </div>
          ) : detail?.coverLetter ? (
            <p className="text-sm break-words whitespace-pre-wrap text-slate-700">
              {detail.coverLetter}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">
              {vi
                ? "Ứng viên không gửi thư ứng tuyển cho đơn này."
                : "No cover letter submitted for this application."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
