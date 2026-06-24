"use client";

import { DotsThree } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export type AdminMasterData = {
  id: string;
  name: string;
  category: "Ngành nghề" | "Kỹ năng" | "Địa điểm" | "Cấp bậc" | "Loại hình";
  itemCount: number;
  status: "Đang hoạt động" | "Ngừng sử dụng";
  lastUpdated: string;
};

const data: AdminMasterData[] = [
  {
    id: "MD-001",
    name: "Danh sách Ngành nghề IT",
    category: "Ngành nghề",
    itemCount: 45,
    status: "Đang hoạt động",
    lastUpdated: "12/06/2026",
  },
  {
    id: "MD-002",
    name: "Bộ kỹ năng Lập trình (Skills)",
    category: "Kỹ năng",
    itemCount: 320,
    status: "Đang hoạt động",
    lastUpdated: "20/06/2026",
  },
  {
    id: "MD-003",
    name: "Tỉnh/Thành phố Việt Nam",
    category: "Địa điểm",
    itemCount: 63,
    status: "Đang hoạt động",
    lastUpdated: "01/01/2026",
  },
  {
    id: "MD-004",
    name: "Cấp bậc vị trí (Levels)",
    category: "Cấp bậc",
    itemCount: 8,
    status: "Đang hoạt động",
    lastUpdated: "15/05/2026",
  },
  {
    id: "MD-005",
    name: "Danh sách Kỹ năng cũ (Deprecated)",
    category: "Kỹ năng",
    itemCount: 120,
    status: "Ngừng sử dụng",
    lastUpdated: "10/12/2025",
  },
];

export const columns: ColumnDef<AdminMasterData>[] = [
  {
    accessorKey: "name",
    header: "Tên tập dữ liệu",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.name}</p>
        <p className="text-muted-foreground text-xs">{row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Phân loại",
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      const tone =
        category === "Ngành nghề"
          ? "brand"
          : category === "Kỹ năng"
            ? "premium"
            : category === "Địa điểm"
              ? "info"
              : "neutral";
      return <Badge tone={tone}>{category}</Badge>;
    },
  },
  {
    accessorKey: "itemCount",
    header: () => <div className="text-right">Số lượng Record</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat("vi-VN").format(row.original.itemCount)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone = status === "Đang hoạt động" ? "success" : "neutral";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    accessorKey: "lastUpdated",
    header: "Cập nhật lần cuối",
    cell: ({ row }) => <div>{row.original.lastUpdated}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const record = row.original;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu thao tác</span>
                <DotsThree size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem>Chỉnh sửa dữ liệu</DropdownMenuItem>
              <DropdownMenuItem>Xuất Excel / CSV</DropdownMenuItem>
              <DropdownMenuSeparator />
              {record.status === "Đang hoạt động" && (
                <DropdownMenuItem className="text-warning">Ngừng sử dụng</DropdownMenuItem>
              )}
              {record.status === "Ngừng sử dụng" && (
                <DropdownMenuItem className="text-success">Kích hoạt lại</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function MasterDataTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
