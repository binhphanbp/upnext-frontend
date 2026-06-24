"use client";

import { Plus } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export function AddRoleDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          Tạo Vai trò mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo Vai Trò Tùy Chỉnh</DialogTitle>
          <DialogDescription>
            Tạo một Role mới và sau đó bạn có thể cấu hình chi tiết phân quyền (Permissions).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="roleName">Tên vai trò</Label>
            <Input id="roleName" placeholder="VD: Kế toán (Accounting)" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="description">Mô tả ngắn</Label>
            <Input id="description" placeholder="VD: Chỉ được phép xem lịch sử giao dịch" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="cloneFrom">Kế thừa quyền từ (Tùy chọn)</Label>
            <Select defaultValue="none">
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò mẫu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Tạo quyền trống --</SelectItem>
                <SelectItem value="moderator">Kế thừa từ: Moderator</SelectItem>
                <SelectItem value="sales">Kế thừa từ: Sales</SelectItem>
                <SelectItem value="support">Kế thừa từ: Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Tạo vai trò
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
