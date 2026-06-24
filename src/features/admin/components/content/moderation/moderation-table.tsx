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

export type AdminModerationReport = {
  id: string;
  contentType: "Tin tuyển dụng" | "Bình luận" | "Review công ty" | "Hồ sơ";
  targetName: string;
  reporter: string;
  reason: string;
  status: "Đang chờ xử lý" | "Đã giải quyết" | "Đã từ chối";
  reportedDate: string;
};

const data: AdminModerationReport[] = [
  {
    id: "REP-9921",
    contentType: "Tin tuyển dụng",
    targetName: "Spam Job Posting Demo",
    reporter: "user123@gmail.com",
    reason: "Tin rác, lừa đảo",
    status: "Đang chờ xử lý",
    reportedDate: "24/06/2026",
  },
  {
    id: "REP-9918",
    contentType: "Review công ty",
    targetName: "Công ty ABC",
    reporter: "Ẩn danh",
    reason: "Ngôn từ thù ghét, lăng mạ",
    status: "Đã giải quyết",
    reportedDate: "22/06/2026",
  },
  {
    id: "REP-9905",
    contentType: "Hồ sơ",
    targetName: "Nguyễn Văn Scam",
    reporter: "hr@company.com",
    reason: "Sử dụng thông tin giả mạo",
    status: "Đã từ chối",
    reportedDate: "18/06/2026",
  },
  {
    id: "REP-9922",
    contentType: "Bình luận",
    targetName: "Bài viết #ART-5012",
    reporter: "admin_bot",
    reason: "Chứa link đáng ngờ",
    status: "Đang chờ xử lý",
    reportedDate: "24/06/2026",
  },
  // Add more items for pagination
  {
    id: "REP-9923",
    contentType: "Tin tuyển dụng",
    targetName: "Trang lừa đảo tiền",
    reporter: "user99@gmail.com",
    reason: "Yêu cầu đóng phí",
    status: "Đang chờ xử lý",
    reportedDate: "25/06/2026",
  },
  {
    id: "REP-9924",
    contentType: "Bình luận",
    targetName: "Bài viết #ART-5015",
    reporter: "spam_hunter",
    reason: "Quảng cáo cá cược",
    status: "Đã giải quyết",
    reportedDate: "25/06/2026",
  },
  {
    id: "REP-9925",
    contentType: "Hồ sơ",
    targetName: "Clone Acc 1",
    reporter: "admin",
    reason: "Avatar phản cảm",
    status: "Đã giải quyết",
    reportedDate: "26/06/2026",
  },
  {
    id: "REP-9926",
    contentType: "Review công ty",
    targetName: "Công ty XYZ",
    reporter: "Ẩn danh",
    reason: "Bôi nhọ danh dự",
    status: "Đã từ chối",
    reportedDate: "26/06/2026",
  },
  {
    id: "REP-9927",
    contentType: "Tin tuyển dụng",
    targetName: "Việc nhẹ lương cao",
    reporter: "hr_fpt",
    reason: "Việc làm không có thật",
    status: "Đang chờ xử lý",
    reportedDate: "27/06/2026",
  },
  {
    id: "REP-9928",
    contentType: "Bình luận",
    targetName: "Bài viết #ART-5018",
    reporter: "user001",
    reason: "Ngôn từ thô tục",
    status: "Đang chờ xử lý",
    reportedDate: "27/06/2026",
  },
  {
    id: "REP-9929",
    contentType: "Review công ty",
    targetName: "Tech Startup X",
    reporter: "ceo_startup",
    reason: "Review giả mạo",
    status: "Đã giải quyết",
    reportedDate: "28/06/2026",
  },
  {
    id: "REP-9930",
    contentType: "Hồ sơ",
    targetName: "Fake Profile 2",
    reporter: "bot_scanner",
    reason: "Tên chứa ký tự lạ",
    status: "Đã từ chối",
    reportedDate: "28/06/2026",
  },
];

export const columns: ColumnDef<AdminModerationReport>[] = [
  {
    accessorKey: "contentType",
    header: "Loại nội dung",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.contentType}</p>
        <p className="text-muted-foreground text-xs">{row.original.targetName}</p>
      </div>
    ),
  },
  {
    accessorKey: "reporter",
    header: "Người báo cáo",
  },
  {
    accessorKey: "reason",
    header: "Lý do",
    cell: ({ row }) => <p className="max-w-[200px] truncate">{row.original.reason}</p>,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đã giải quyết"
          ? "success"
          : status === "Đang chờ xử lý"
            ? "warning"
            : "neutral";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    accessorKey: "reportedDate",
    header: "Ngày báo cáo",
    cell: ({ row }) => <div>{row.original.reportedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const report = row.original;

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
              <DropdownMenuItem>Xem chi tiết nội dung bị báo cáo</DropdownMenuItem>
              <DropdownMenuItem>Xem người báo cáo</DropdownMenuItem>
              <DropdownMenuSeparator />
              {report.status === "Đang chờ xử lý" && (
                <>
                  <DropdownMenuItem className="text-success">
                    Giải quyết (Xóa nội dung)
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-warning">
                    Khóa tài khoản vi phạm
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-neutral">
                    Từ chối báo cáo (Bỏ qua)
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function ModerationTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-[350px]">
          <MagnifyingGlass
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={18}
          />
          <Input
            className="bg-muted h-10 rounded-xl pl-10"
            placeholder="Tìm theo loại nội dung, mục tiêu..."
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Đang chờ xử lý">Đang chờ xử lý</SelectItem>
            <SelectItem value="Đã giải quyết">Đã giải quyết</SelectItem>
            <SelectItem value="Đã từ chối">Đã từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
