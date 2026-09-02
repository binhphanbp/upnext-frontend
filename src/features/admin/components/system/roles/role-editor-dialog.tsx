"use client";

import * as React from "react";
import { toast } from "sonner";

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

import type { AdminPermission } from "../../../api/permissions";
import { getAdminPermissions } from "../../../api/permissions";
import type { AdminRole } from "../../../api/roles";
import { createAdminRole, syncRolePermissions, updateAdminRole } from "../../../api/roles";
import { getAdminSession } from "../../../session";
import { PermissionMatrix } from "./permission-matrix";

export type RoleEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: AdminRole | null;
  onSuccess: () => void;
};

export function RoleEditorDialog({
  open,
  onOpenChange,
  role = null,
  onSuccess,
}: RoleEditorDialogProps) {
  const [permissions, setPermissions] = React.useState<AdminPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = React.useState(false);

  const [roleName, setRoleName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [selectedPermissionIds, setSelectedPermissionIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ roleName?: string }>({});

  const isEditing = Boolean(role);
  const isSuperAdminRole = role?.roleCode === "SUPER_ADMIN";

  // Load permissions when dialog opens
  React.useEffect(() => {
    if (open) {
      const session = getAdminSession();
      if (session?.accessToken) {
        setLoadingPermissions(true);
        getAdminPermissions(session.accessToken)
          .then((perms) => setPermissions(perms))
          .catch((err) => {
            console.error(err);
            toast.error("Không thể tải danh sách quyền hệ thống");
          })
          .finally(() => setLoadingPermissions(false));
      }

      if (role) {
        setRoleName(role.roleName);
        setDescription(role.description || "");
        setStatus(role.status);
        setSelectedPermissionIds(
          role.rolePermissions ? role.rolePermissions.map((rp) => rp.permissionId) : [],
        );
      } else {
        setRoleName("");
        setDescription("");
        setStatus("ACTIVE");
        setSelectedPermissionIds([]);
      }
      setErrors({});
    }
  }, [open, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setErrors({ roleName: "Tên vai trò không được để trống" });
      return;
    }

    const session = getAdminSession();
    if (!session?.accessToken) {
      toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && role) {
        // 1. Update basic info if not Super Admin
        if (!isSuperAdminRole) {
          await updateAdminRole(session.accessToken, role.id, {
            roleName: roleName.trim(),
            description: description.trim() || undefined,
            status,
          });
        }

        // 2. Sync permissions
        if (!isSuperAdminRole) {
          await syncRolePermissions(session.accessToken, role.id, selectedPermissionIds);
        }

        toast.success(`Cập nhật vai trò "${roleName}" thành công`);
      } else {
        // Create new role with permissions
        await createAdminRole(session.accessToken, {
          roleName: roleName.trim(),
          description: description.trim() || undefined,
          status,
          permissionIds: selectedPermissionIds,
        });

        toast.success(`Tạo vai trò "${roleName}" thành công`);
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Đã xảy ra lỗi khi lưu vai trò");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-h-[88vh] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl sm:max-w-[780px]">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white p-6 pb-4">
          <DialogTitle>
            {isEditing ? `Chỉnh sửa vai trò: ${role?.roleName}` : "Tạo vai trò quản trị mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin và ma trận phân quyền cho vai trò này."
              : "Khai báo tên vai trò và chọn các quyền hạn tương ứng theo từng module."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Scrollable Body */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-5">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="roleName" className="required">
                  Tên vai trò <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value);
                    if (errors.roleName) setErrors({});
                  }}
                  placeholder="Ví dụ: Kiểm duyệt viên Tin đăng"
                  disabled={isSuperAdminRole || isSubmitting}
                />
                {errors.roleName && (
                  <span className="text-destructive text-xs">{errors.roleName}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Trạng thái hoạt động</Label>
                <Select
                  value={status}
                  onValueChange={(val: "ACTIVE" | "INACTIVE") => setStatus(val)}
                  disabled={isSuperAdminRole || isSubmitting}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Kích hoạt (ACTIVE)</SelectItem>
                    <SelectItem value="INACTIVE">Vô hiệu hóa (INACTIVE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="description">Mô tả nhiệm vụ</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả phạm vi trách nhiệm và công việc của vai trò"
                  disabled={isSuperAdminRole || isSubmitting}
                />
              </div>
            </div>

            {/* Permission Matrix */}
            {loadingPermissions ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                Đang tải danh mục quyền hệ thống...
              </div>
            ) : (
              <PermissionMatrix
                permissions={permissions}
                selectedPermissionIds={selectedPermissionIds}
                onChange={setSelectedPermissionIds}
                disabled={isSuperAdminRole || isSubmitting}
              />
            )}
          </div>

          <DialogFooter className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || isSuperAdminRole}>
              {isSubmitting ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo vai trò"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
