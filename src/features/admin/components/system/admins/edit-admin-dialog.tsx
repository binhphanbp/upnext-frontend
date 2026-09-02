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

import type { AdminAccount } from "../../../api/admin-users";
import { updateAdminAccount } from "../../../api/admin-users";
import type { AdminRole } from "../../../api/roles";
import { getAdminSession } from "../../../session";

export type EditAdminDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminAccount | null;
  roles: AdminRole[];
  onSuccess: () => void;
};

export function EditAdminDialog({
  open,
  onOpenChange,
  admin,
  roles,
  onSuccess,
}: EditAdminDialogProps) {
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [roleId, setRoleId] = React.useState<string>("");
  const [status, setStatus] = React.useState<"ACTIVE" | "INACTIVE" | "LOCKED">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open && admin) {
      setFullName(admin.fullName);
      setPhone(admin.phone || "");
      setRoleId(admin.roleId || "");
      setStatus(admin.status);
      setErrors({});
    }
  }, [open, admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    if (!fullName.trim()) {
      setErrors({ fullName: "Họ và tên không được để trống" });
      return;
    }

    const session = getAdminSession();
    if (!session?.accessToken) {
      toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAdminAccount(session.accessToken, admin.id, {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        roleId: roleId || undefined,
        status,
      });

      toast.success(`Cập nhật tài khoản "${fullName}" thành công`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tài khoản Quản trị viên</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin định danh, vai trò hoặc trạng thái hoạt động của quản trị viên.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-email">Địa chỉ Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={admin?.email || ""}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-fullName" className="required">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors({});
              }}
              placeholder="Ví dụ: Nguyễn Văn A"
              disabled={isSubmitting}
            />
            {errors.fullName && <span className="text-destructive text-xs">{errors.fullName}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone">Số điện thoại</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-status">Trạng thái</Label>
              <Select
                value={status}
                onValueChange={(val: "ACTIVE" | "INACTIVE" | "LOCKED") => setStatus(val)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Kích hoạt (ACTIVE)</SelectItem>
                  <SelectItem value="LOCKED">Tạm khóa (LOCKED)</SelectItem>
                  <SelectItem value="INACTIVE">Vô hiệu hóa (INACTIVE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-roleId">Vai trò quản trị</Label>
            <Select value={roleId} onValueChange={(val) => setRoleId(val)} disabled={isSubmitting}>
              <SelectTrigger id="edit-roleId">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.roleName} ({role.roleCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
