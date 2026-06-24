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

export function AddSalesLeadDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          Thêm Khách hàng mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm Khách hàng tiềm năng (Lead)</DialogTitle>
          <DialogDescription>
            Tạo mới hồ sơ khách hàng để theo dõi tiến trình bán hàng trong Pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="companyName">Tên công ty / Tổ chức</Label>
            <Input id="companyName" placeholder="VD: Công ty TNHH ABC" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="contactName">Người liên hệ</Label>
            <Input id="contactName" placeholder="VD: Nguyễn Văn A (HR Manager)" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="salesRep">Sales phụ trách</Label>
            <Select defaultValue="nhan_tran">
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhân viên Sales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nhan_tran">Trần Nhân</SelectItem>
                <SelectItem value="mai_linh">Mai Linh</SelectItem>
                <SelectItem value="nguyen_bao">Nguyễn Bảo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="dealValue">Giá trị hợp đồng dự kiến (VNĐ)</Label>
            <Input id="dealValue" type="number" placeholder="VD: 15000000" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="stage">Giai đoạn ban đầu</Label>
            <Select defaultValue="potential">
              <SelectTrigger>
                <SelectValue placeholder="Chọn giai đoạn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="potential">Tiềm năng (New)</SelectItem>
                <SelectItem value="contacted">Đã liên hệ (Contacted)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Thêm Khách hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
