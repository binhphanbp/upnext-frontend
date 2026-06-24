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

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  userCount: number;
  type: "Hệ thống" | "Tùy chỉnh";
  status: "Kích hoạt" | "Vô hiệu hóa";
};

const data: AdminRole[] = [
  {
    id: "ROLE-ADMIN",
    name: "Quản trị viên cấp cao (Super Admin)",
    description: "Toàn quyền truy cập tất cả tính năng của hệ thống.",
    userCount: 2,
    type: "Hệ thống",
    status: "Kích hoạt",
  },
  {
    id: "ROLE-MODERATOR",
    name: "Người kiểm duyệt (Moderator)",
    description: "Kiểm duyệt nội dung, báo cáo, tin tuyển dụng.",
    userCount: 8,
    type: "Hệ thống",
    status: "Kích hoạt",
  },
  {
    id: "ROLE-SALES",
    name: "Nhân viên Kinh doanh (Sales)",
    description: "Quản lý khách hàng, gói dịch vụ và xem báo cáo kinh doanh.",
    userCount: 15,
    type: "Hệ thống",
    status: "Kích hoạt",
  },
  {
    id: "ROLE-SUPPORT",
    name: "Hỗ trợ Khách hàng (Customer Support)",
    description: "Xử lý ticket và hỗ trợ người dùng.",
    userCount: 5,
    type: "Hệ thống",
    status: "Kích hoạt",
  },
  {
    id: "ROLE-CUSTOM-01",
    name: "Thực tập sinh Marketing",
    description: "Chỉ được xem và đăng bài viết PR.",
    userCount: 3,
    type: "Tùy chỉnh",
    status: "Vô hiệu hóa",
  },
];

export const columns: ColumnDef<AdminRole>[] = [
  {
    accessorKey: "name",
    header: "Vai trò",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.name}</p>
        <p className="text-muted-foreground text-xs">{row.original.description}</p>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Loại vai trò",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const tone = type === "Hệ thống" ? "info" : "neutral";
      return <Badge tone={tone}>{type}</Badge>;
    },
  },
  {
    accessorKey: "userCount",
    header: () => <div className="text-right">Số người dùng</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat("vi-VN").format(row.original.userCount)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone = status === "Kích hoạt" ? "success" : "error";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const role = row.original;

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
              <DropdownMenuItem>Chỉnh sửa quyền hạn (Permissions)</DropdownMenuItem>
              <DropdownMenuItem>Xem danh sách tài khoản</DropdownMenuItem>
              <DropdownMenuSeparator />
              {role.type === "Tùy chỉnh" && (
                <>
                  {role.status === "Kích hoạt" ? (
                    <DropdownMenuItem className="text-warning">Vô hiệu hóa</DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="text-success">Kích hoạt lại</DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-error">Xóa vai trò</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function RolesTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
