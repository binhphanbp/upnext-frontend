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

export type AdminJobPost = {
  id: string;
  title: string;
  employer: string;
  location: string;
  type: string;
  status: "Đang hiển thị" | "Chờ duyệt" | "Hết hạn" | "Đã từ chối";
  postedDate: string;
  applicants: number;
};

const data: AdminJobPost[] = [
  {
    id: "JOB-1029",
    title: "Senior Frontend Engineer (React/Next.js)",
    employer: "VNG Corporation",
    location: "Hồ Chí Minh",
    type: "Toàn thời gian",
    status: "Đang hiển thị",
    postedDate: "24/06/2026",
    applicants: 45,
  },
  {
    id: "JOB-1030",
    title: "Blockchain Smart Contract Developer",
    employer: "Crypto Scam Co",
    location: "Remote",
    type: "Toàn thời gian",
    status: "Chờ duyệt",
    postedDate: "24/06/2026",
    applicants: 0,
  },
  {
    id: "JOB-1025",
    title: "Product Designer (UI/UX)",
    employer: "FPT Software",
    location: "Hà Nội",
    type: "Toàn thời gian",
    status: "Đang hiển thị",
    postedDate: "20/06/2026",
    applicants: 12,
  },
  {
    id: "JOB-0980",
    title: "Data Analyst",
    employer: "Shopee Vietnam",
    location: "Hồ Chí Minh",
    type: "Bán thời gian",
    status: "Hết hạn",
    postedDate: "01/05/2026",
    applicants: 120,
  },
  {
    id: "JOB-1028",
    title: "Spam Job Posting Demo",
    employer: "Spammer Inc",
    location: "Đà Nẵng",
    type: "Khác",
    status: "Đã từ chối",
    postedDate: "23/06/2026",
    applicants: 0,
  },
];

export const columns: ColumnDef<AdminJobPost>[] = [
  {
    accessorKey: "title",
    header: "Công việc",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.title}</p>
        <p className="text-muted-foreground text-xs">{row.original.employer}</p>
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: "Khu vực & Loại hình",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.location}</p>
        <p className="text-muted-foreground text-xs">{row.original.type}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đang hiển thị"
          ? "success"
          : status === "Chờ duyệt"
            ? "warning"
            : status === "Hết hạn"
              ? "neutral"
              : "error";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    accessorKey: "applicants",
    header: () => <div className="text-right">Ứng tuyển</div>,
    cell: ({ row }) => {
      return <div className="text-right font-medium">{row.getValue("applicants")}</div>;
    },
  },
  {
    accessorKey: "postedDate",
    header: "Ngày đăng",
    cell: ({ row }) => <div>{row.original.postedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const job = row.original;

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
              <DropdownMenuItem>Xem chi tiết tin</DropdownMenuItem>
              <DropdownMenuItem>Chuyển đến công ty</DropdownMenuItem>
              <DropdownMenuSeparator />
              {job.status === "Chờ duyệt" && (
                <>
                  <DropdownMenuItem className="text-success">Duyệt tin đăng</DropdownMenuItem>
                  <DropdownMenuItem className="text-error">Từ chối (Kèm lý do)</DropdownMenuItem>
                </>
              )}
              {job.status === "Đang hiển thị" && (
                <DropdownMenuItem className="text-error">Gỡ tin (Ẩn khỏi site)</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function JobPostsTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
