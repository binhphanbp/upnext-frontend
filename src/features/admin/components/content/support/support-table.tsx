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

export type AdminSupportTicket = {
  id: string;
  subject: string;
  user: string;
  priority: "Cao" | "Trung bình" | "Thấp";
  status: "Mở" | "Đang xử lý" | "Đã đóng";
  createdDate: string;
};

const data: AdminSupportTicket[] = [
  {
    id: "TIC-1020",
    subject: "Lỗi không thể nạp tiền thanh toán gói Pro",
    user: "Công ty TNHH Giải pháp Phần mềm (Employer)",
    priority: "Cao",
    status: "Mở",
    createdDate: "24/06/2026 10:15",
  },
  {
    id: "TIC-1019",
    subject: "Ứng viên không nhận được email thông báo phỏng vấn",
    user: "Lê Thị B (Candidate)",
    priority: "Trung bình",
    status: "Đang xử lý",
    createdDate: "23/06/2026 14:30",
  },
  {
    id: "TIC-1015",
    subject: "Hướng dẫn tích hợp ATS API",
    user: "VNG HR Dept (Employer)",
    priority: "Thấp",
    status: "Đã đóng",
    createdDate: "20/06/2026 09:00",
  },
  {
    id: "TIC-1021",
    subject: "Tài khoản bị khóa không rõ lý do",
    user: "Nguyễn Văn C (Candidate)",
    priority: "Cao",
    status: "Mở",
    createdDate: "24/06/2026 11:45",
  },
];

export const columns: ColumnDef<AdminSupportTicket>[] = [
  {
    accessorKey: "subject",
    header: "Tiêu đề yêu cầu",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.subject}</p>
        <p className="text-muted-foreground text-xs">{row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "user",
    header: "Người dùng",
  },
  {
    accessorKey: "priority",
    header: "Mức độ ưu tiên",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      const tone = priority === "Cao" ? "error" : priority === "Trung bình" ? "warning" : "info";
      return <Badge tone={tone}>{priority}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone = status === "Mở" ? "error" : status === "Đang xử lý" ? "warning" : "success";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdDate",
    header: "Thời gian tạo",
    cell: ({ row }) => <div>{row.original.createdDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const ticket = row.original;

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
              <DropdownMenuItem>Xem chi tiết Ticket</DropdownMenuItem>
              <DropdownMenuItem>Xem thông tin User</DropdownMenuItem>
              <DropdownMenuSeparator />
              {ticket.status !== "Đã đóng" && (
                <>
                  <DropdownMenuItem className="text-brand">
                    Chuyển trạng thái: Đang xử lý
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-success">
                    Đóng Ticket (Đã xử lý xong)
                  </DropdownMenuItem>
                </>
              )}
              {ticket.status === "Đã đóng" && <DropdownMenuItem>Mở lại Ticket</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function SupportTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
