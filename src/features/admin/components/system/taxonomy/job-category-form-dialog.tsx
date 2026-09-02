"use client";

import * as React from "react";
import Swal from "sweetalert2";

import {
  createJobCategory,
  updateJobCategory,
  type JobCategoryItem,
} from "@/features/admin/api/taxonomy";
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
import { Textarea } from "@/shared/ui/textarea";

interface JobCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: JobCategoryItem | null;
  onSuccess: () => void;
}

export function JobCategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: JobCategoryFormDialogProps) {
  const isEditing = Boolean(category);

  const [name, setName] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState(0);
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setSortOrder(category.sortOrder);
        setDescription(category.description || "");
        setIsActive(category.isActive);
      } else {
        setName("");
        setSortOrder(0);
        setDescription("");
        setIsActive(true);
      }
      setNameError(null);
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Tên ngành nghề không được để trống");
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
        sortOrder: Number(sortOrder) || 0,
        description: description.trim() || undefined,
        isActive,
      };

      if (isEditing && category) {
        await updateJobCategory(session.accessToken, category.id, {
          ...payload,
          description: description.trim() || null,
        });
        void Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã cập nhật ngành nghề "${trimmedName}"`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await createJobCategory(session.accessToken, payload);
        void Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã thêm ngành nghề "${trimmedName}" vào danh mục tuyển dụng`,
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
        text: err?.message || "Không thể lưu ngành nghề. Vui lòng kiểm tra lại tên trùng lặp.",
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
            {isEditing ? "Chỉnh sửa Ngành nghề tuyển dụng" : "Thêm Ngành nghề tuyển dụng mới"}
          </DialogTitle>
          <DialogDescription>
            Ngành nghề này sẽ hiển thị trong bộ lọc tìm kiếm việc làm và form đăng tin của Nhà tuyển
            dụng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="category-name" className="text-sm font-semibold text-slate-800">
              Tên ngành nghề <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="category-name"
              placeholder="VD: Software Development, Data Science, AI & Machine Learning..."
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
            <Label htmlFor="category-order" className="text-sm font-semibold text-slate-800">
              Thứ tự hiển thị (Sort Order)
            </Label>
            <Input
              id="category-order"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category-desc" className="text-sm font-semibold text-slate-800">
              Mô tả ngắn
            </Label>
            <Textarea
              id="category-desc"
              rows={3}
              placeholder="Mô tả tóm tắt phạm vi ngành nghề..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-slate-200 text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Trạng thái kích hoạt</p>
              <p className="text-xs text-slate-500">
                Cho phép hiển thị trên trang tìm việc và đăng tin
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
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
              {isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo ngành nghề"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
