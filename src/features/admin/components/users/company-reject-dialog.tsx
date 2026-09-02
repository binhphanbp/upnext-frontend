"use client";

import { ImageSquare, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { MAX_VERIFICATION_EVIDENCE_FILES } from "@/features/admin/api/employers";
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
import { Textarea } from "@/shared/ui/textarea";

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const MAX_REASON_LENGTH = 500;
const MAX_GUIDANCE_LENGTH = 1000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type CompanyRejectInput = {
  reason: string;
  guidance: string;
  evidence: File[];
};

type PickedImage = { id: string; file: File; previewUrl: string };

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Từ chối hồ sơ xác thực doanh nghiệp: lý do bắt buộc, hướng dẫn tùy chọn, kèm tối đa
 * 5 ảnh minh chứng có preview. Cả ba thứ đi vào email gửi cho nhà tuyển dụng, ảnh được
 * đính kèm thẳng vào email đó — nên đây là nơi duy nhất họ nhận được giải thích.
 */
export function CompanyRejectDialog({
  open,
  onOpenChange,
  companyName,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  isSubmitting: boolean;
  onSubmit: (input: CompanyRejectInput) => Promise<unknown>;
}) {
  const [reason, setReason] = useState("");
  const [guidance, setGuidance] = useState("");
  const [images, setImages] = useState<PickedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mỗi preview là một blob URL, phải revoke để không rò bộ nhớ khi đóng dialog.
  useEffect(() => {
    if (open) return;
    setReason("");
    setGuidance("");
    setError(null);
    setIsDraggingOver(false);
    setImages((current) => {
      for (const image of current) URL.revokeObjectURL(image.previewUrl);
      return [];
    });
  }, [open]);

  function addFiles(incoming: FileList | File[] | null) {
    if (!incoming) return;
    const files = Array.from(incoming);
    if (files.length === 0) return;

    const accepted: PickedImage[] = [];
    const problems: string[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        problems.push(`"${file.name}" không phải ảnh JPG, PNG, WEBP hay GIF.`);
        continue;
      }
      if (file.size > MAX_EVIDENCE_BYTES) {
        problems.push(`"${file.name}" nặng ${formatSize(file.size)}, tối đa 5MB.`);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setImages((current) => {
      const room = MAX_VERIFICATION_EVIDENCE_FILES - current.length;
      const kept = accepted.slice(0, Math.max(room, 0));
      // Ảnh vượt hạn mức bị bỏ ngay tại đây nên phải revoke, chúng không vào state.
      for (const dropped of accepted.slice(kept.length)) URL.revokeObjectURL(dropped.previewUrl);
      if (kept.length < accepted.length) {
        problems.push(`Chỉ gửi được tối đa ${MAX_VERIFICATION_EVIDENCE_FILES} ảnh.`);
      }
      setError(problems.length > 0 ? problems.join(" ") : null);
      return [...current, ...kept];
    });
  }

  function removeImage(id: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== id);
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Vui lòng nhập lý do từ chối — lý do này được gửi cho nhà tuyển dụng.");
      return;
    }

    setError(null);
    await onSubmit({
      reason: trimmedReason,
      guidance: guidance.trim(),
      evidence: images.map((image) => image.file),
    });
  }

  const isFull = images.length >= MAX_VERIFICATION_EVIDENCE_FILES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WarningCircle size={20} className="text-error shrink-0" />
            Từ chối hồ sơ xác thực
          </DialogTitle>
          <DialogDescription>
            {companyName
              ? `Từ chối hồ sơ của ${companyName}. Nhà tuyển dụng sẽ nhận email kèm lý do và ảnh minh chứng bạn gửi.`
              : "Nhà tuyển dụng sẽ nhận email kèm lý do và ảnh minh chứng bạn gửi."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="company-reject-reason">Lý do từ chối *</Label>
            <Textarea
              id="company-reject-reason"
              rows={3}
              maxLength={MAX_REASON_LENGTH}
              value={reason}
              placeholder="Ví dụ: Ảnh tải lên không phải giấy chứng nhận đăng ký doanh nghiệp."
              onChange={(event) => setReason(event.target.value)}
            />
            <span className="self-end text-xs text-slate-400 tabular-nums">
              {reason.length}/{MAX_REASON_LENGTH}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="company-reject-guidance">
              Hướng dẫn khắc phục{" "}
              <span className="font-normal text-slate-400">(không bắt buộc)</span>
            </Label>
            <Textarea
              id="company-reject-guidance"
              rows={3}
              maxLength={MAX_GUIDANCE_LENGTH}
              value={guidance}
              placeholder="Nêu rõ doanh nghiệp cần bổ sung hoặc chỉnh sửa gì để gửi lại hồ sơ."
              onChange={(event) => setGuidance(event.target.value)}
            />
            <span className="self-end text-xs text-slate-400 tabular-nums">
              {guidance.length}/{MAX_GUIDANCE_LENGTH}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              Ảnh minh chứng{" "}
              <span className="font-normal text-slate-400">
                (không bắt buộc · {images.length}/{MAX_VERIFICATION_EVIDENCE_FILES})
              </span>
            </Label>

            {images.length > 0 ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((image) => (
                  <li
                    key={image.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {/* Blob URL chỉ sống trong trình duyệt tới khi gửi, next/image không tối ưu được. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.previewUrl}
                      alt={image.file.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Xóa ảnh ${image.file.name}`}
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-slate-900/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash size={14} />
                    </button>
                  </li>
                ))}

                {!isFull ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-600"
                    >
                      <Plus size={20} />
                      <span className="text-xs">Thêm</span>
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingOver(false);
                  addFiles(event.dataTransfer.files);
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors ${
                  isDraggingOver
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-300 text-slate-500 hover:border-slate-400"
                }`}
              >
                <ImageSquare size={26} />
                <span className="text-sm font-medium">Chọn hoặc kéo ảnh vào đây</span>
                <span className="text-xs text-slate-400">
                  JPG, PNG, WEBP, GIF · tối đa {MAX_VERIFICATION_EVIDENCE_FILES} ảnh, mỗi ảnh 5MB
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              aria-label="Chọn ảnh minh chứng"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              hidden
              onChange={(event) => {
                addFiles(event.target.files);
                // Cho phép chọn lại đúng file vừa xóa.
                event.target.value = "";
              }}
            />
          </div>

          {error ? (
            <p className="text-error flex items-start gap-1.5 text-sm">
              <WarningCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi…" : "Từ chối & gửi email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
