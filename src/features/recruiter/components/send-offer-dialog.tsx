"use client";

import {
  FileArrowUp,
  FileDoc,
  FilePdf,
  PaperPlaneRight,
  SpinnerGap,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { uploadFile } from "@/features/recruiter/api/onboarding";
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
  note?: string | undefined;
  offerLetterUrl?: string | undefined;
  attachmentName?: string | undefined;
};

type SendOfferDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName?: string | undefined;
  jobTitle?: string | undefined;
  applicationId: string | null;
  onConfirmOffer: (applicationId: string, offerDetails: OfferDetails) => Promise<void>;
}>;

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setSalaryOffer("");
      setStartDate("");
      setExpiryDays(7);
      setNote("");
      setOfferFile(null);
      setFileError(null);
      setIsPending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + expiryDays);
  const expiryDateText = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    deadlineDate,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setOfferFile(null);
      setFileError(null);
      return;
    }

    // Validate file size (Max 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const errorMsg =
        locale === "vi"
          ? `File "${file.name}" (${formatFileSize(file.size)}) vượt quá dung lượng cho phép (tối đa ${MAX_FILE_SIZE_MB}MB). Vui lòng chọn file khác.`
          : `File "${file.name}" (${formatFileSize(file.size)}) exceeds the maximum allowed size (${MAX_FILE_SIZE_MB}MB). Please select another file.`;
      setFileError(errorMsg);
      setOfferFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.error(errorMsg);
      return;
    }

    // Validate file extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      const errorMsg =
        locale === "vi"
          ? "Chỉ chấp nhận file tài liệu định dạng PDF, DOC hoặc DOCX."
          : "Only PDF, DOC, or DOCX document formats are allowed.";
      setFileError(errorMsg);
      setOfferFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.error(errorMsg);
      return;
    }

    setFileError(null);
    setOfferFile(file);
  };

  const handleRemoveFile = () => {
    setOfferFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;

    if (fileError) {
      toast.error(fileError);
      return;
    }

    if (offerFile && offerFile.size > MAX_FILE_SIZE_BYTES) {
      const errorMsg =
        locale === "vi"
          ? `File đính kèm vượt quá dung lượng cho phép (tối đa ${MAX_FILE_SIZE_MB}MB).`
          : `Attached file exceeds the maximum allowed size (${MAX_FILE_SIZE_MB}MB).`;
      toast.error(errorMsg);
      setFileError(errorMsg);
      return;
    }

    try {
      setIsPending(true);

      let offerLetterUrl: string | undefined = undefined;
      let attachmentName: string | undefined = undefined;

      if (offerFile) {
        const token = localStorage.getItem("upnext.recruiter.accessToken") || "";
        if (token) {
          try {
            const uploaded = await uploadFile(offerFile, "OTHER", "PUBLIC", token);
            offerLetterUrl = uploaded.file?.publicUrl;
            attachmentName = offerFile.name;
          } catch (uploadErr) {
            console.error("Error uploading offer letter attachment:", uploadErr);
          }
        }
      }

      await onConfirmOffer(applicationId, {
        salaryOffer,
        startDate,
        expiresAt: deadlineDate.toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(offerLetterUrl && attachmentName ? { offerLetterUrl, attachmentName } : {}),
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

          {/* Offer Letter File Attachment */}
          <div className="space-y-1.5">
            <Label htmlFor="offer-file-input" className="text-xs font-bold text-slate-700">
              {locale === "vi"
                ? "Đính kèm Thư nhận việc / Offer Letter (Tùy chọn)"
                : "Attach Offer Letter Document (Optional)"}
            </Label>

            <input
              ref={fileInputRef}
              id="offer-file-input"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />

            {!offerFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/75 p-3 text-left transition hover:border-amber-400 hover:bg-amber-50/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-xs">
                    <FileArrowUp size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {locale === "vi"
                        ? "Chọn file Offer Letter đính kèm"
                        : "Upload Offer Letter file"}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      PDF, DOC, DOCX • Tối đa {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                </div>
                <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-xs">
                  {locale === "vi" ? "Tải lên" : "Browse"}
                </span>
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-xs">
                    {offerFile.name.endsWith(".pdf") ? (
                      <FilePdf size={18} weight="fill" />
                    ) : (
                      <FileDoc size={18} weight="fill" />
                    )}
                  </span>
                  <div className="truncate">
                    <p className="truncate text-xs font-bold text-slate-800">{offerFile.name}</p>
                    <p className="text-[11px] font-semibold text-emerald-600">
                      {formatFileSize(offerFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title={locale === "vi" ? "Xóa file" : "Remove file"}
                  className="ml-2 flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 shadow-2xs transition hover:bg-white hover:text-rose-600"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>
            )}

            {fileError && (
              <div className="animate-in fade-in flex items-center gap-1.5 pt-1 text-xs font-medium text-rose-600 duration-200">
                <WarningCircle size={15} weight="fill" className="shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
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
              disabled={isPending || !!fileError}
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
