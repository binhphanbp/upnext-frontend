"use client";

import { PaperPlaneRight, SpinnerGap } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

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

export type OfferDetails = {
  salaryOffer: string;
  startDate: string;
  expiryDays: number;
  expiryDateText: string;
  note: string;
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
  const [salaryOffer, setSalaryOffer] = useState("25000000");
  const [startDate, setStartDate] = useState("Theo trao đổi trực tiếp");
  const [expiryDays, setExpiryDays] = useState(7);
  const [note, setNote] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setSalaryOffer("25000000");
      setStartDate("Theo trao đổi trực tiếp");
      setExpiryDays(7);
      setNote("");
      setIsPending(false);
    }
  }, [open]);

  // Calculate deadline date text (e.g. "15 thg 8, 2026")
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + expiryDays);
  const expiryDateText = `${expiryDays} ngày (Hạn chót: ${deadlineDate.getDate()} thg ${deadlineDate.getMonth() + 1}, ${deadlineDate.getFullYear()})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;

    try {
      setIsPending(true);
      await onConfirmOffer(applicationId, {
        salaryOffer,
        startDate,
        expiryDays,
        expiryDateText,
        note,
      });
      onOpenChange(false);
      void Swal.fire({
        icon: "success",
        title: locale === "vi" ? "🎉 Đã gửi đề nghị việc làm!" : "🎉 Offer Sent Successfully!",
        text:
          locale === "vi"
            ? `Lời mời nhận việc cho vị trí ${jobTitle || "công việc"} đã được gửi tới ${candidateName}.`
            : `Job offer for ${jobTitle || "the position"} has been sent to ${candidateName}.`,
        confirmButtonColor: "#10b981",
      });
    } catch {
      void Swal.fire({
        icon: "error",
        title: locale === "vi" ? "Không thể gửi Offer" : "Failed to Send Offer",
        text:
          locale === "vi"
            ? "Đã có lỗi xảy ra. Vui lòng thử lại!"
            : "An error occurred. Please try again!",
        confirmButtonColor: "#ef4444",
      });
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
              {locale === "vi" ? "Gửi đề nghị tuyển dụng (Send Offer)" : "Send Job Offer"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-5 font-medium text-slate-500">
            {locale === "vi"
              ? `Xác nhận gửi thư mời nhận việc chính thức cho ứng viên ${candidateName} vị trí ${jobTitle}.`
              : `Confirm sending an official job offer to candidate ${candidateName} for ${jobTitle}.`}
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
                placeholder="25000000"
                value={salaryOffer}
                onChange={(e) => setSalaryOffer(e.target.value)}
                className="rounded-xl border-slate-200 font-semibold text-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-start-date" className="text-xs font-bold text-slate-700">
                {locale === "vi" ? "Ngày bắt đầu làm việc" : "Start Date"}
              </Label>
              <Input
                id="offer-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
              <span className="text-xs font-semibold text-slate-500">({expiryDateText})</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-note" className="text-xs font-bold text-slate-700">
              {locale === "vi"
                ? "Thư ngỏ / Lời nhắn từ Nhà tuyển dụng"
                : "Message / Note from Recruiter"}
            </Label>
            <textarea
              id="offer-note"
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
