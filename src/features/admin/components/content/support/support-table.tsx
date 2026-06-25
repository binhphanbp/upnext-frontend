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
  // Add more items for pagination
  {
    id: "TIC-1022",
    subject: "Quên mật khẩu tài khoản Admin",
    user: "admin02 (Admin)",
    priority: "Cao",
    status: "Mở",
    createdDate: "25/06/2026 08:20",
  },
  {
    id: "TIC-1023",
    subject: "Lỗi hiển thị logo công ty",
    user: "Tiki HR (Employer)",
    priority: "Thấp",
    status: "Đang xử lý",
    createdDate: "25/06/2026 09:10",
  },
  {
    id: "TIC-1024",
    subject: "Không nhận được mã OTP xác thực",
    user: "Hoàng Văn D (Candidate)",
    priority: "Trung bình",
    status: "Đã đóng",
    createdDate: "26/06/2026 14:00",
  },
  {
    id: "TIC-1025",
    subject: "Sai thông tin hóa đơn điện tử",
    user: "FPT Software (Employer)",
    priority: "Cao",
    status: "Mở",
    createdDate: "26/06/2026 16:30",
  },
  {
    id: "TIC-1026",
    subject: "Tính năng lọc CV bị chậm",
    user: "Momo Talent (Employer)",
    priority: "Trung bình",
    status: "Đang xử lý",
    createdDate: "27/06/2026 10:00",
  },
  {
    id: "TIC-1027",
    subject: "Hỏi về gói dịch vụ Premium",
    user: "Công ty ABC (Employer)",
    priority: "Thấp",
    status: "Mở",
    createdDate: "27/06/2026 11:15",
  },
  {
    id: "TIC-1028",
    subject: "Lỗi không tải được CV dạng PDF",
    user: "Phạm E (Candidate)",
    priority: "Cao",
    status: "Đã đóng",
    createdDate: "28/06/2026 09:45",
  },
  {
    id: "TIC-1029",
    subject: "Xin cấp lại quyền truy cập API",
    user: "ZaloPay Tech (Employer)",
    priority: "Trung bình",
    status: "Mở",
    createdDate: "28/06/2026 15:20",
  },
];

import { useTranslations } from "next-intl";

export const getColumns = (t: any): ColumnDef<AdminSupportTicket>[] => [
  {
    accessorKey: "subject",
    header: t("subject"),
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.subject}</p>
        <p className="text-muted-foreground text-xs">{row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "user",
    header: t("user"),
  },
  {
    accessorKey: "priority",
    header: t("priority"),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      const tone = priority === "Cao" ? "error" : priority === "Trung bình" ? "warning" : "info";

      const priorityKey =
        priority === "Cao" ? "high" : priority === "Trung bình" ? "medium" : "low";
      return <Badge tone={tone}>{t(`priorityOptions.${priorityKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone = status === "Mở" ? "error" : status === "Đang xử lý" ? "warning" : "success";

      const statusKey =
        status === "Mở" ? "open" : status === "Đang xử lý" ? "inProgress" : "closed";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "createdDate",
    header: t("createdDate"),
    cell: ({ row }) => <div>{row.original.createdDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
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
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem>{t("actionOptions.viewDetails")}</DropdownMenuItem>
              <DropdownMenuItem>{t("actionOptions.viewUser")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {ticket.status !== "Đã đóng" && (
                <>
                  <DropdownMenuItem className="text-brand">
                    {t("actionOptions.markInProgress")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-success">
                    {t("actionOptions.close")}
                  </DropdownMenuItem>
                </>
              )}
              {ticket.status === "Đã đóng" && (
                <DropdownMenuItem>{t("actionOptions.reopen")}</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function SupportTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const t = useTranslations("Admin.content.support.table");

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  const columns = React.useMemo(() => getColumns(t), [t]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-[350px]">
          <MagnifyingGlass
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={18}
          />
          <Input className="bg-muted h-10 rounded-xl pl-10" placeholder={t("searchPlaceholder")} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="Mở">{t("statusOptions.open")}</SelectItem>
            <SelectItem value="Đang xử lý">{t("statusOptions.inProgress")}</SelectItem>
            <SelectItem value="Đã đóng">{t("statusOptions.closed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
