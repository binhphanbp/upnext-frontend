"use client";

import * as React from "react";
import Swal from "sweetalert2";

import {
  adminCreatePostCategory,
  adminUpdatePostCategory,
  type FullPostCategory,
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

interface PostCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: FullPostCategory | null;
  onSuccess: () => void;
}

export function PostCategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: PostCategoryFormDialogProps) {
  const isEditing = Boolean(category);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setSlug(category.slug);
      } else {
        setName("");
        setSlug("");
      }
      setNameError(null);
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Tên danh mục không được để trống");
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

      if (isEditing && category) {
        await adminUpdatePostCategory(session.accessToken, category.id, payload);
        void Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã cập nhật danh mục "${trimmedName}"`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await adminCreatePostCategory(session.accessToken, payload);
        void Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã tạo danh mục bài viết "${trimmedName}"`,
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
        text: err?.message || "Không thể lưu danh mục bài viết",
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
            {isEditing ? "Chỉnh sửa Danh mục bài viết" : "Tạo Danh mục bài viết mới"}
          </DialogTitle>
          <DialogDescription>
            Danh mục giúp phân loại các bài viết chuyên môn (VD: Bí quyết phỏng vấn, Xu hướng công
            nghệ, Cẩm nang nghề nghiệp...).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="category-name" className="text-sm font-semibold text-slate-800">
              Tên danh mục <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="category-name"
              placeholder="VD: Bí quyết phỏng vấn, Xu hướng công nghệ..."
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
            <Label htmlFor="category-slug" className="text-sm font-semibold text-slate-800">
              Đường dẫn tĩnh (Slug URL)
            </Label>
            <Input
              id="category-slug"
              placeholder="VD: bi-quyet-phong-van (để trống sẽ tự tạo)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="rounded-xl border-slate-200 font-mono text-xs"
            />
            <p className="text-xs text-slate-400">
              Nếu để trống, hệ thống sẽ tự động tạo slug chuẩn SEO từ tên danh mục.
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
              {isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo danh mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
