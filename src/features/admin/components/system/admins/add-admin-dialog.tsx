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

import { createAdminAccount } from "../../../api/admin-users";
import type { AdminRole } from "../../../api/roles";
import { getAdminSession } from "../../../session";

export type AddAdminDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: AdminRole[];
  onSuccess: () => void;
};

export function AddAdminDialog({ open, onOpenChange, roles, onSuccess }: AddAdminDialogProps) {
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [roleId, setRoleId] = React.useState<string>("");
  const [status, setStatus] = React.useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setEmail("");
      setFullName("");
      setPhone("");
      setPassword("");
      setRoleId(roles[0]?.id || "");
      setStatus("ACTIVE");
      setErrors({});
    }
  }, [open, roles]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Định dạng email không hợp lệ";
    }

    if (!fullName.trim()) {
      errs.fullName = "Họ và tên không được để trống";
    }

    if (!password) {
      errs.password = "Mật khẩu không được để trống";
    } else if (password.length < 8) {
      errs.password = "Mật khẩu phải có tối thiểu 8 ký tự";
    }

    if (!roleId) {
      errs.roleId = "Vui lòng chọn vai trò cho quản trị viên";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const session = getAdminSession();
    if (!session?.accessToken) {
      toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminAccount(session.accessToken, {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        password,
        roleId,
        status,
      });

      toast.success(`Tạo tài khoản quản trị "${fullName}" thành công`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Không thể tạo tài khoản quản trị");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm tài khoản Quản trị viên mới</DialogTitle>
          <DialogDescription>
            Tạo thông tin đăng nhập và phân vai trò trực tiếp cho nhân viên quản trị.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="required">
              Địa chỉ Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="admin.ten@upnext.dev"
              disabled={isSubmitting}
            />
            {errors.email && <span className="text-destructive text-xs">{errors.email}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName" className="required">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
              }}
              placeholder="Ví dụ: Nguyễn Văn A"
              disabled={isSubmitting}
            />
            {errors.fullName && <span className="text-destructive text-xs">{errors.fullName}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={status}
                onValueChange={(val: "ACTIVE" | "INACTIVE") => setStatus(val)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Kích hoạt (ACTIVE)</SelectItem>
                  <SelectItem value="INACTIVE">Vô hiệu hóa (INACTIVE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="roleId" className="required">
              Vai trò quản trị <span className="text-destructive">*</span>
            </Label>
            <Select
              value={roleId}
              onValueChange={(val) => {
                setRoleId(val);
                if (errors.roleId) setErrors((prev) => ({ ...prev, roleId: "" }));
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="roleId">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {roles
                  .filter((r) => r.status === "ACTIVE")
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.roleName} ({role.roleCode})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.roleId && <span className="text-destructive text-xs">{errors.roleId}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="required">
              Mật khẩu khởi tạo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="Tối thiểu 8 ký tự"
              disabled={isSubmitting}
            />
            {errors.password && <span className="text-destructive text-xs">{errors.password}</span>}
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
              {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
