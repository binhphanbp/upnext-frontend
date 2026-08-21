"use client";

import { CircleNotch, PencilSimple, Star } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import type { Locale } from "@/i18n/routing";
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

const NOTE_MAX = 1000;

export const SHORTLIST_PRIORITY_OPTIONS = [
  { value: "0", vi: "Bình thường", en: "Normal" },
  { value: "1", vi: "Quan tâm", en: "Interested" },
  { value: "2", vi: "Ưu tiên cao", en: "High priority" },
];

type SavePotentialCandidateDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  jobTitle: string;
  locale: Locale;
  submitting: boolean;
  /** "edit" khi sửa ghi chú/mức độ quan tâm của một ứng viên đã lưu sẵn. */
  mode?: "create" | "edit";
  initialNote?: string | undefined;
  initialPriority?: number | undefined;
  onConfirm: (input: { note?: string | undefined; priority: number }) => void;
}>;

/**
 * Mở khi recruiter bấm ⭐ để lưu một ứng viên đã nộp đơn thành "ứng viên tiềm
 * năng", hoặc bấm "Sửa" để cập nhật lại ghi chú/mức độ quan tâm đã lưu — thu
 * thập đúng những gì backend (RecruiterCandidateShortlist) thực sự lưu được:
 * `priority` (ảnh hưởng thứ tự hiển thị ở tab Ứng viên tiềm năng) và `note`.
 * Không có trường nào khác vì CreateShortlistDto không nhận thêm gì.
 */
export function SavePotentialCandidateDialog({
  open,
  onOpenChange,
  candidateName,
  jobTitle,
  locale,
  submitting,
  mode = "create",
  initialNote,
  initialPriority,
  onConfirm,
}: SavePotentialCandidateDialogProps) {
  const vi = locale === "vi";
  const isEdit = mode === "edit";
  const [note, setNote] = useState(initialNote ?? "");
  const [priority, setPriority] = useState(String(initialPriority ?? 0));

  // Nạp lại giá trị ban đầu mỗi khi dialog mở — cần cho cả 2 chế độ: reset
  // trắng khi mở để lưu mới, và nạp đúng note/priority đang có khi mở để sửa.
  useEffect(() => {
    if (open) {
      setNote(initialNote ?? "");
      setPriority(String(initialPriority ?? 0));
    }
  }, [open, initialNote, initialPriority]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              {isEdit ? <PencilSimple size={20} weight="bold" /> : <Star size={20} weight="fill" />}
            </span>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {isEdit
                ? vi
                  ? "Sửa ứng viên tiềm năng"
                  : "Edit potential candidate"
                : vi
                  ? "Lưu ứng viên tiềm năng"
                  : "Save as a potential candidate"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-5 font-medium text-slate-500">
            {isEdit
              ? vi
                ? `${candidateName} — ${jobTitle}. Cập nhật mức độ quan tâm hoặc ghi chú cho ứng viên này.`
                : `${candidateName} — ${jobTitle}. Update the interest level or note for this candidate.`
              : vi
                ? `${candidateName} — ${jobTitle}. Bạn có thể xem lại ứng viên này ở tab "Ứng viên tiềm năng" bất cứ lúc nào.`
                : `${candidateName} — ${jobTitle}. You can review this candidate anytime from the "Potential Candidates" tab.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="shortlist-priority" className="text-xs font-bold text-slate-700">
              {vi ? "Mức độ quan tâm" : "Interest level"}
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger
                id="shortlist-priority"
                className="rounded-xl border-slate-200 font-semibold text-slate-800"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHORTLIST_PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {vi ? option.vi : option.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              id="shortlist-note-label"
              htmlFor="shortlist-note"
              className="text-xs font-bold text-slate-700"
            >
              {vi ? "Ghi chú (tuỳ chọn)" : "Note (optional)"}
            </Label>
            <textarea
              id="shortlist-note"
              aria-labelledby="shortlist-note-label"
              rows={4}
              maxLength={NOTE_MAX}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                vi
                  ? "Vì sao bạn muốn lưu ứng viên này lại? Ví dụ: kỹ năng phù hợp cho vị trí khác, cần trao đổi thêm về mức lương..."
                  : "Why save this candidate? e.g. good fit for a different role, need to discuss salary further..."
              }
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <div className="text-right text-[11px] font-medium text-slate-400">
              {note.length}/{NOTE_MAX}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold text-slate-600"
          >
            {vi ? "Hủy" : "Cancel"}
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() =>
              onConfirm({ note: note.trim() || undefined, priority: Number(priority) })
            }
            className="gap-2 rounded-xl bg-amber-600 font-bold text-white shadow-sm hover:bg-amber-700"
          >
            {submitting ? (
              <CircleNotch className="animate-spin" size={16} />
            ) : isEdit ? (
              <PencilSimple size={16} weight="bold" />
            ) : (
              <Star size={16} weight="fill" />
            )}
            {isEdit
              ? vi
                ? "Lưu thay đổi"
                : "Save changes"
              : vi
                ? "Lưu ứng viên"
                : "Save candidate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
