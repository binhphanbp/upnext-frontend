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

import type { AdminAccount } from "../../../api/admin-users";
import { resetAdminPassword } from "../../../api/admin-users";
import { getAdminSession } from "../../../session";

export type ResetPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminAccount | null;
  onSuccess: () => void;
};

export function ResetPasswordDialog({
  open,
  onOpenChange,
  admin,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!newPassword) {
      errs.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 8) {
      errs.newPassword = "Mật khẩu mới phải có tối thiểu 8 ký tự";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !validate()) return;

    const session = getAdminSession();
    if (!session?.accessToken) {
      toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetAdminPassword(session.accessToken, admin.id, newPassword);
      toast.success(
        `Đã đặt lại mật khẩu cho tài khoản "${admin.fullName}". Toàn bộ phiên đăng nhập cũ đã được thu hồi.`,
      );
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu Quản trị viên</DialogTitle>
          <DialogDescription>
            Đặt mật khẩu mới cho tài khoản{" "}
            <strong className="text-foreground">{admin?.fullName}</strong> ({admin?.email}). Mọi
            phiên đăng nhập hiện tại của tài khoản này sẽ lập tức hết hạn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword" className="required">
              Mật khẩu mới <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: "" }));
              }}
              placeholder="Tối thiểu 8 ký tự"
              disabled={isSubmitting}
            />
            {errors.newPassword && (
              <span className="text-destructive text-xs">{errors.newPassword}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword" className="required">
              Xác nhận mật khẩu mới <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              placeholder="Nhập lại mật khẩu mới"
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <span className="text-destructive text-xs">{errors.confirmPassword}</span>
            )}
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
              {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
