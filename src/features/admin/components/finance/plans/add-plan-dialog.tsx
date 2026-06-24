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

export function AddPlanDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          Tạo Gói Dịch Vụ Mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo Gói Dịch Vụ Mới</DialogTitle>
          <DialogDescription>
            Thiết lập thông tin cơ bản cho gói dịch vụ (Subscription/Credit) mới trên hệ thống.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="planName">Tên gói dịch vụ</Label>
            <Input id="planName" placeholder="VD: Employer Premium 2026" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="targetAudience">Đối tượng khách hàng</Label>
            <Select defaultValue="employer">
              <SelectTrigger>
                <SelectValue placeholder="Chọn đối tượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employer">Nhà tuyển dụng</SelectItem>
                <SelectItem value="candidate">Ứng viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="price">Đơn giá (VNĐ)</Label>
            <Input id="price" type="number" placeholder="VD: 2500000" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="billingCycle">Chu kỳ thanh toán</Label>
            <Select defaultValue="month">
              <SelectTrigger>
                <SelectValue placeholder="Chọn chu kỳ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Hàng tháng (Monthly)</SelectItem>
                <SelectItem value="year">Hàng năm (Yearly)</SelectItem>
                <SelectItem value="one-time">Gói tín dụng (One-time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Tạo bản nháp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
