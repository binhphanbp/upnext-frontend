"use client";

import { PaperPlaneRight, SpinnerGap } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";
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
import { toast } from "@/shared/ui/toast";

export type OfferDetails = {
  salaryOffer: string;
  startDate: string;
  expiresAt: string;
  note?: string;
};

type SendOfferDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName?: string | undefined;
  jobTitle?: string | undefined;
  applicationId: string | null;
  onConfirmOffer: (applicationId: string, offerDetails: OfferDetails) => Promise<void>;
}>;

export function SendOfferDialog({
  open,
  onOpenChange,
  candidateName = "Ứng viên",
  jobTitle = "",
  applicationId,
  onConfirmOffer,
}: SendOfferDialogProps) {
  const locale = useLocale();
  const [salaryOffer, setSalaryOffer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDays, setExpiryDays] = useState(7);
  const [note, setNote] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setSalaryOffer("");
      setStartDate("");
      setExpiryDays(7);
      setNote("");
      setIsPending(false);
    }
  }, [open]);

  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + expiryDays);
  const expiryDateText = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    deadlineDate,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;

    try {
      setIsPending(true);
      await onConfirmOffer(applicationId, {
        salaryOffer,
        startDate,
        expiresAt: deadlineDate.toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      onOpenChange(false);
      toast.success(
        locale === "vi"
          ? `Đã gửi đề nghị đến ${candidateName}.`
          : `Offer sent to ${candidateName}.`,
      );
    } catch {
      toast.error(
        locale === "vi"
          ? "Chưa thể gửi đề nghị. Vui lòng kiểm tra thông tin và thử lại."
          : "The offer could not be sent. Check the details and try again.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <PaperPlaneRight size={20} weight="bold" />
            </span>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {locale === "vi" ? "Gửi đề nghị tuyển dụng" : "Send job offer"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-5 font-medium text-slate-500">
            {locale === "vi"
              ? `Điền đúng các điều khoản đã được phê duyệt trước khi gửi đến ${candidateName}.`
              : `Enter the approved terms before sending this offer to ${candidateName}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="offer-job-title" className="text-xs font-bold text-slate-700">
              {locale === "vi" ? "Vị trí tuyển dụng" : "Job Title"}
            </Label>
            <Input
              id="offer-job-title"
              value={jobTitle}
              disabled
              className="rounded-xl bg-slate-50 font-semibold text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="offer-salary" className="text-xs font-bold text-slate-700">
                {locale === "vi" ? "Mức lương đề xuất (VNĐ)" : "Offered Salary"}
              </Label>
              <Input
                id="offer-salary"
                placeholder={locale === "vi" ? "VD: 25.000.000 VNĐ/tháng" : "e.g. 2,000 USD/month"}
                value={salaryOffer}
                onChange={(e) => setSalaryOffer(e.target.value)}
                required
                className="rounded-xl border-slate-200 font-semibold text-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-start-date" className="text-xs font-bold text-slate-700">
                {locale === "vi" ? "Ngày bắt đầu làm việc" : "Start Date"}
              </Label>
              <Input
                id="offer-start-date"
                placeholder={locale === "vi" ? "VD: 01/09/2026" : "e.g. September 1, 2026"}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="rounded-xl border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-expiry-days" className="text-xs font-bold text-slate-700">
              {locale === "vi" ? "Hạn phản hồi Offer (Số ngày)" : "Offer Expiry (Days)"}
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="offer-expiry-days"
                type="number"
                min={1}
                max={30}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value) || 7)}
                className="w-24 rounded-xl border-slate-200 font-semibold text-rose-600"
              />
              <span className="text-xs font-semibold text-slate-500">
                {locale === "vi"
                  ? `Hạn phản hồi: ${expiryDateText}`
                  : `Response deadline: ${expiryDateText}`}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              id="offer-note-label"
              htmlFor="offer-note"
              className="text-xs font-bold text-slate-700"
            >
              {locale === "vi"
                ? "Thư ngỏ / Lời nhắn từ Nhà tuyển dụng"
                : "Message / Note from Recruiter"}
            </Label>
            <textarea
              id="offer-note"
              aria-labelledby="offer-note-label"
              rows={3}
              placeholder={
                locale === "vi"
                  ? "Chúc mừng bạn! Chúng tôi rất ấn tượng với năng lực và kinh nghiệm của bạn..."
                  : "Congratulations! We are impressed with your background..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-slate-600"
            >
              {locale === "vi" ? "Hủy" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-amber-600 font-bold text-white shadow-sm hover:bg-amber-700"
            >
              {isPending ? (
                <SpinnerGap className="mr-2 animate-spin" size={16} />
              ) : (
                <PaperPlaneRight className="mr-2" size={16} />
              )}
              {locale === "vi" ? "Xác nhận & Gửi Offer" : "Confirm & Send Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
