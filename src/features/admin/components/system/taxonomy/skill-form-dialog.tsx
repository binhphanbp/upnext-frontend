"use client";

import * as React from "react";
import Swal from "sweetalert2";

import {
  createSkill,
  updateSkill,
  type SkillCategoryItem,
  type SkillItem,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

interface SkillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: SkillItem | null;
  categories: SkillCategoryItem[];
  onSuccess: () => void;
}

export function SkillFormDialog({
  open,
  onOpenChange,
  skill,
  categories,
  onSuccess,
}: SkillFormDialogProps) {
  const isEditing = Boolean(skill);

  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("none");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (skill) {
        setName(skill.name);
        setCategoryId(skill.categoryId || "none");
        setDescription(skill.description || "");
        setIsActive(skill.isActive);
      } else {
        setName("");
        setCategoryId("none");
        setDescription("");
        setIsActive(true);
      }
      setNameError(null);
    }
  }, [open, skill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Tên kỹ năng không được để trống");
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
        categoryId: categoryId !== "none" ? categoryId : undefined,
        description: description.trim() || undefined,
        isActive,
      };

      if (isEditing && skill) {
        await updateSkill(session.accessToken, skill.id, {
          ...payload,
          categoryId: categoryId !== "none" ? categoryId : null,
          description: description.trim() || null,
        });
        void Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã cập nhật kỹ năng "${trimmedName}"`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await createSkill(session.accessToken, payload);
        void Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã thêm kỹ năng "${trimmedName}" vào danh mục chuẩn`,
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
        text: err?.message || "Không thể lưu kỹ năng. Vui lòng kiểm tra lại tên trùng lặp.",
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
            {isEditing ? "Chỉnh sửa Kỹ năng chuẩn" : "Thêm Kỹ năng chuẩn mới"}
          </DialogTitle>
          <DialogDescription>
            Kỹ năng này sẽ được chuẩn hóa cho Nhà tuyển dụng chọn khi tạo JD và AI Matcher chấm điểm
            CV ứng viên.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="skill-name" className="text-sm font-semibold text-slate-800">
              Tên kỹ năng <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="skill-name"
              placeholder="VD: React, Python, Docker, Kubernetes..."
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
            <Label htmlFor="skill-category" className="text-sm font-semibold text-slate-800">
              Nhóm chuyên môn
            </Label>
            <Select value={categoryId} onValueChange={(val) => setCategoryId(val)}>
              <SelectTrigger id="skill-category" className="rounded-xl border-slate-200">
                <SelectValue placeholder="Chọn nhóm kỹ năng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Chưa phân nhóm —</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill-desc" className="text-sm font-semibold text-slate-800">
              Mô tả ngắn
            </Label>
            <Textarea
              id="skill-desc"
              rows={3}
              placeholder="Mô tả phạm vi ứng dụng hoặc công nghệ liên quan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-slate-200 text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Trạng thái kích hoạt</p>
              <p className="text-xs text-slate-500">
                Cho phép gợi ý khi tạo tin tuyển dụng và tìm kiếm
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
              {isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo kỹ năng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
