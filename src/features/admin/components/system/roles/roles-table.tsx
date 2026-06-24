"use client";

import { DotsThree, MagnifyingGlass } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

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
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

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
  {
    id: "ROLE-CUSTOM-02",
    name: "Cộng tác viên Nội dung",
    description: "Tạo bài viết nháp.",
    userCount: 12,
    type: "Tùy chỉnh",
    status: "Kích hoạt",
  },
  {
    id: "ROLE-CUSTOM-03",
    name: "Tuyển dụng nội bộ",
    description: "Quản lý quy trình tuyển dụng nội bộ.",
    userCount: 4,
    type: "Tùy chỉnh",
    status: "Kích hoạt",
  },
  {
    id: "ROLE-CUSTOM-04",
    name: "Chuyên viên Phân tích",
    description: "Xem báo cáo dữ liệu.",
    userCount: 6,
    type: "Tùy chỉnh",
    status: "Vô hiệu hóa",
  },
  {
    id: "ROLE-CUSTOM-05",
    name: "Kế toán viên",
    description: "Quản lý hóa đơn và thanh toán.",
    userCount: 3,
    type: "Tùy chỉnh",
    status: "Kích hoạt",
  },
  {
    id: "ROLE-CUSTOM-06",
    name: "Chăm sóc Khách hàng VIP",
    description: "Hỗ trợ riêng cho tài khoản doanh nghiệp VIP.",
    userCount: 2,
    type: "Tùy chỉnh",
    status: "Kích hoạt",
  },
  {
    id: "ROLE-CUSTOM-07",
    name: "Quản trị viên IT",
    description: "Bảo trì hệ thống nội bộ.",
    userCount: 5,
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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <Input
            placeholder="Tìm kiếm theo tên vai trò..."
            className="rounded-xl bg-white pl-10 lg:max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full rounded-xl bg-white sm:w-[200px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Kích hoạt">Kích hoạt</SelectItem>
            <SelectItem value="Vô hiệu hóa">Vô hiệu hóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
