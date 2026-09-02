"use client";

import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import * as React from "react";
import Swal from "sweetalert2";

import {
  createSkillCategory,
  deleteSkillCategory,
  updateSkillCategory,
  type SkillCategoryItem,
} from "@/features/admin/api/taxonomy";
import { getAdminSession } from "@/features/admin/session";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

interface SkillCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: SkillCategoryItem[];
  onRefresh: () => void;
}

export function SkillCategoriesDialog({
  open,
  onOpenChange,
  categories,
  onRefresh,
}: SkillCategoriesDialogProps) {
  const [newCatName, setNewCatName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreate = async () => {
    if (!newCatName.trim()) return;

    const session = getAdminSession();
    if (!session) return;

    setIsSubmitting(true);
    try {
      await createSkillCategory(session.accessToken, {
        name: newCatName.trim(),
        sortOrder: categories.length,
        isActive: true,
      });
      setNewCatName("");
      void Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã thêm nhóm kỹ năng mới",
        timer: 1500,
        showConfirmButton: false,
      });
      onRefresh();
    } catch (err: any) {
      void Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.message || "Không thể tạo nhóm kỹ năng",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;

    const session = getAdminSession();
    if (!session) return;

    setIsSubmitting(true);
    try {
      await updateSkillCategory(session.accessToken, id, {
        name: editingName.trim(),
        sortOrder: 0,
        isActive: true,
      });
      setEditingId(null);
      void Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã cập nhật tên nhóm kỹ năng",
        timer: 1500,
        showConfirmButton: false,
      });
      onRefresh();
    } catch (err: any) {
      void Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.message || "Không thể cập nhật nhóm",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: SkillCategoryItem) => {
    const skillCount = cat._count?.skills ?? 0;
    const confirm = await Swal.fire({
      icon: "warning",
      title: `Xóa nhóm "${cat.name}"?`,
      text:
        skillCount > 0
          ? `Nhóm này đang có ${skillCount} kỹ năng trực thuộc. Các kỹ năng sẽ chuyển sang trạng thái Chưa phân nhóm.`
          : "Hành động này không thể hoàn tác.",
      showCancelButton: true,
      confirmButtonText: "Xác nhận xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
    });

    if (!confirm.isConfirmed) return;

    const session = getAdminSession();
    if (!session) return;

    try {
      await deleteSkillCategory(session.accessToken, cat.id);
      void Swal.fire({
        icon: "success",
        title: "Đã xóa",
        timer: 1500,
        showConfirmButton: false,
      });
      onRefresh();
    } catch (err: any) {
      void Swal.fire({
        icon: "error",
        title: "Không thể xóa",
        text: err?.message || "Có lỗi xảy ra",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Quản lý Nhóm Kỹ năng chuyên môn</DialogTitle>
          <DialogDescription>
            Phân loại kỹ năng theo các mảng công nghệ (Frontend, Backend, AI/ML, DevOps...).
          </DialogDescription>
        </DialogHeader>

        {/* Add new category inline */}
        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Tên nhóm mới (VD: Cybersecurity, Game Dev...)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreate();
              }
            }}
            className="rounded-xl border-slate-200"
          />
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!newCatName.trim() || isSubmitting}
            className="shrink-0 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
          >
            <Plus size={16} weight="bold" className="mr-1" /> Thêm
          </Button>
        </div>

        {/* Category list table */}
        <div className="mt-4 max-h-[350px] overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold tracking-wider text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-2.5 text-left">Tên nhóm</th>
                <th className="px-4 py-2.5 text-center">Số kỹ năng</th>
                <th className="px-4 py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          size={1}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 rounded-lg text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 px-2 text-xs text-white"
                          onClick={() => void handleUpdate(cat.id)}
                        >
                          Lưu
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge tone="neutral" className="font-bold">
                      {cat._count?.skills ?? 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-500 hover:text-slate-800"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                      >
                        <PencilSimple size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-500 hover:text-rose-700"
                        onClick={() => void handleDelete(cat)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
