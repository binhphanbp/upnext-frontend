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
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
