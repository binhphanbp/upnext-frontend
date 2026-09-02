"use client";

import * as React from "react";
import Swal from "sweetalert2";

import {
  adminCreatePostTag,
  adminUpdatePostTag,
  type FullPostTag,
} from "@/features/admin/api/posts";
import { getAdminSession } from "@/features/admin/session";
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

interface PostTagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: FullPostTag | null;
  onSuccess: () => void;
}

export function PostTagFormDialog({ open, onOpenChange, tag, onSuccess }: PostTagFormDialogProps) {
  const isEditing = Boolean(tag);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (tag) {
        setName(tag.name);
        setSlug(tag.slug);
      } else {
        setName("");
        setSlug("");
      }
      setNameError(null);
    }
  }, [open, tag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Tên thẻ không được để trống");
      return;
    }
    if (trimmedName.length > 120) {
      setNameError("Tối đa 120 ký tự");
      return;
    }

    const session = getAdminSession();
    if (!session) {
      void Swal.fire({ icon: "error", title: "Phiên làm việc hết hạn" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        slug: slug.trim() || undefined,
      };

      if (isEditing && tag) {
        await adminUpdatePostTag(session.accessToken, tag.id, payload);
        void Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã cập nhật thẻ "${trimmedName}"`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await adminCreatePostTag(session.accessToken, payload);
        void Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã tạo thẻ bài viết "${trimmedName}"`,
          timer: 2000,
          showConfirmButton: false,
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      void Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: err?.message || "Không thể lưu thẻ bài viết",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa Thẻ bài viết (Tag)" : "Tạo Thẻ bài viết mới"}
          </DialogTitle>
          <DialogDescription>
            Thẻ (Tag) giúp gắn nhãn chủ đề cho bài viết và cải thiện thứ hạng tìm kiếm SEO.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name" className="text-sm font-semibold text-slate-800">
              Tên thẻ <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="tag-name"
              placeholder="VD: ReactJS, AI, Tuyển dụng IT, Phỏng vấn..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              className="rounded-xl border-slate-200"
            />
            {nameError && <p className="text-xs font-medium text-rose-500">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tag-slug" className="text-sm font-semibold text-slate-800">
              Đường dẫn tĩnh (Slug URL)
            </Label>
            <Input
              id="tag-slug"
              placeholder="VD: reactjs (để trống sẽ tự tạo)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="rounded-xl border-slate-200 font-mono text-xs"
            />
            <p className="text-xs text-slate-400">
              Nếu để trống, hệ thống sẽ tự động tạo slug chuẩn SEO từ tên thẻ.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
            >
              {isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo thẻ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
