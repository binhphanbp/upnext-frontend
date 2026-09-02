"use client";

import { ImageSquare, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

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

/** Khớp với `MAX_REPORT_EVIDENCE_FILES` ở backend. */
export const MAX_EVIDENCE_FILES = 5;
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const MAX_REASON_LENGTH = 1000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type ReviewReportInput = { reason: string; evidence: File[] };

type PickedImage = { id: string; file: File; previewUrl: string };

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Báo cáo một đánh giá: 1 ô lý do + tối đa 5 ảnh bằng chứng có preview.
 *
 * Trước đây đây là một `Swal.fire` với HTML thô nên không preview được ảnh và chỉ nhận
 * một file. Dùng chung cho trang công ty (công khai) và trang đánh giá của nhà tuyển dụng
 * — cả hai chỗ chỉ nhà tuyển dụng của công ty bị đánh giá mới thấy nút báo cáo.
 */
export function ReviewReportDialog({
  open,
  onOpenChange,
  reviewerName,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tên người viết đánh giá, để nhà tuyển dụng biết đang báo cáo đúng đánh giá nào. */
  reviewerName?: string | undefined;
  isSubmitting: boolean;
  onSubmit: (input: ReviewReportInput) => Promise<unknown>;
}) {
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<PickedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mỗi preview là một blob URL, phải revoke để không rò bộ nhớ khi đóng dialog.
  useEffect(() => {
    if (open) return;
    setReason("");
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
      const room = MAX_EVIDENCE_FILES - current.length;
      const kept = accepted.slice(0, Math.max(room, 0));
      // Ảnh vượt hạn mức bị bỏ ngay tại đây nên phải revoke, chúng không vào state.
      for (const dropped of accepted.slice(kept.length)) URL.revokeObjectURL(dropped.previewUrl);
      if (kept.length < accepted.length) {
        problems.push(`Chỉ gửi được tối đa ${MAX_EVIDENCE_FILES} ảnh.`);
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
      setError("Vui lòng nhập lý do báo cáo.");
      return;
    }

    setError(null);
    await onSubmit({ reason: trimmedReason, evidence: images.map((image) => image.file) });
  }

  const isFull = images.length >= MAX_EVIDENCE_FILES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WarningCircle size={20} className="text-error shrink-0" />
            Báo cáo đánh giá
          </DialogTitle>
          <DialogDescription>
            {reviewerName
              ? `Báo cáo đánh giá của ${reviewerName}. Quản trị viên sẽ xem xét trước khi ẩn đánh giá.`
              : "Quản trị viên sẽ xem xét báo cáo của bạn trước khi ẩn đánh giá."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="review-report-reason">Lý do báo cáo *</Label>
            <Textarea
              id="review-report-reason"
              rows={4}
              maxLength={MAX_REASON_LENGTH}
              value={reason}
              placeholder="Vì sao bạn cho rằng đánh giá này không phù hợp? Nêu càng cụ thể càng dễ xử lý."
              onChange={(event) => setReason(event.target.value)}
            />
            <span className="self-end text-xs text-slate-400 tabular-nums">
              {reason.length}/{MAX_REASON_LENGTH}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              Ảnh bằng chứng{" "}
              <span className="font-normal text-slate-400">
                (không bắt buộc · {images.length}/{MAX_EVIDENCE_FILES})
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
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${
                  isDraggingOver
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-300 text-slate-500 hover:border-slate-400"
                }`}
              >
                <ImageSquare size={28} />
                <span className="text-sm font-medium">Chọn hoặc kéo ảnh vào đây</span>
                <span className="text-xs text-slate-400">
                  JPG, PNG, WEBP, GIF · tối đa {MAX_EVIDENCE_FILES} ảnh, mỗi ảnh 5MB
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              aria-label="Chọn ảnh bằng chứng"
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
            <p className="text-destructive flex items-start gap-1.5 text-sm">
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
              {isSubmitting ? "Đang gửi…" : "Gửi báo cáo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
