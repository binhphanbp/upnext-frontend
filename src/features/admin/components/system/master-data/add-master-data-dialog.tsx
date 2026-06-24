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

export function AddMasterDataDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          Tạo bộ dữ liệu mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo Bộ Dữ Liệu Gốc (Master Data)</DialogTitle>
          <DialogDescription>
            Thiết lập danh mục lõi mới để sử dụng trong toàn bộ hệ thống nền tảng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="datasetName">Tên bộ dữ liệu</Label>
            <Input id="datasetName" placeholder="VD: Danh sách Bằng cấp" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="category">Phân loại (Category)</Label>
            <Select defaultValue="nganh_nghe">
              <SelectTrigger>
                <SelectValue placeholder="Chọn phân loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nganh_nghe">Ngành nghề</SelectItem>
                <SelectItem value="ky_nang">Kỹ năng (Skills)</SelectItem>
                <SelectItem value="dia_diem">Địa điểm</SelectItem>
                <SelectItem value="cap_bac">Cấp bậc</SelectItem>
                <SelectItem value="loai_hinh">Loại hình công việc</SelectItem>
                <SelectItem value="khac">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="dataCode">Mã tham chiếu (Code)</Label>
            <Input id="dataCode" placeholder="VD: DEGREE_LIST" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="description">Mô tả ngắn gọn</Label>
            <Input id="description" placeholder="VD: Dùng cho dropdown Bằng cấp ở hồ sơ" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Khởi tạo dữ liệu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
