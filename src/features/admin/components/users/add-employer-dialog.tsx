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

export function AddEmployerDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          Thêm nhà tuyển dụng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm Nhà Tuyển Dụng</DialogTitle>
          <DialogDescription>
            Điền thông tin cơ bản để tạo tài khoản doanh nghiệp mới trên hệ thống.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Tên công ty</Label>
            <Input id="companyName" placeholder="VD: VNG Corporation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="representative">Người đại diện</Label>
            <Input id="representative" placeholder="VD: Nguyễn Văn A" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email liên hệ</Label>
            <Input id="email" type="email" placeholder="VD: hr@congty.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Gói dịch vụ mặc định</Label>
            <Select defaultValue="Free">
              <SelectTrigger>
                <SelectValue placeholder="Chọn gói dịch vụ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Gói Cơ bản (Free)</SelectItem>
                <SelectItem value="Pro">Gói Nâng cao (Pro)</SelectItem>
                <SelectItem value="Premium">Gói Cao cấp (Premium)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Tạo tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
