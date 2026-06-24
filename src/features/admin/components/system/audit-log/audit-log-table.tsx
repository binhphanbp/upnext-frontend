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
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export type AdminAuditLog = {
  id: string;
  timestamp: string;
  user: string;
  action: "Tạo mới" | "Cập nhật" | "Xóa" | "Đăng nhập" | "Khác";
  resource: string;
  ipAddress: string;
  status: "Thành công" | "Thất bại";
};

const data: AdminAuditLog[] = [
  {
    id: "LOG-09921",
    timestamp: "24/06/2026 14:15:22",
    user: "binh.nguyen@admin.com",
    action: "Cập nhật",
    resource: "Master Data: Kỹ năng",
    ipAddress: "192.168.1.104",
    status: "Thành công",
  },
  {
    id: "LOG-09920",
    timestamp: "24/06/2026 13:40:05",
    user: "mai.le@sales.com",
    action: "Đăng nhập",
    resource: "Hệ thống (Web)",
    ipAddress: "113.190.22.15",
    status: "Thất bại",
  },
  {
    id: "LOG-09919",
    timestamp: "24/06/2026 11:20:10",
    user: "system_cron",
    action: "Khác",
    resource: "Job: Auto-Expire Jobs",
    ipAddress: "127.0.0.1",
    status: "Thành công",
  },
  {
    id: "LOG-09918",
    timestamp: "23/06/2026 16:45:00",
    user: "anh.tran@mod.com",
    action: "Xóa",
    resource: "Bài viết #ART-5002",
    ipAddress: "14.232.112.99",
    status: "Thành công",
  },
  {
    id: "LOG-09915",
    timestamp: "23/06/2026 09:30:15",
    user: "admin_super",
    action: "Tạo mới",
    resource: "Vai trò: Thực tập sinh Marketing",
    ipAddress: "10.0.0.5",
    status: "Thành công",
  },
];

export const columns: ColumnDef<AdminAuditLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Thời gian",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.timestamp}</p>
        <p className="text-muted-foreground font-mono text-xs">{row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "user",
    header: "Người dùng (Actor)",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.user}</p>
        <p className="text-muted-foreground text-xs">IP: {row.original.ipAddress}</p>
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Loại thao tác",
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      const tone =
        action === "Tạo mới"
          ? "success"
          : action === "Cập nhật"
            ? "brand"
            : action === "Xóa"
              ? "error"
              : action === "Đăng nhập"
                ? "info"
                : "neutral";
      return <Badge tone={tone}>{action}</Badge>;
    },
  },
  {
    accessorKey: "resource",
    header: "Đối tượng (Resource)",
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone = status === "Thành công" ? "success" : "error";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Chi tiết</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <DotsThree size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem>Xem dữ liệu chi tiết (JSON)</DropdownMenuItem>
              <DropdownMenuItem>Xem lịch sử User này</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function AuditLogTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
