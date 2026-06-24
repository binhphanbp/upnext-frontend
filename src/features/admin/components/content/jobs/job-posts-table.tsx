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
  // Add more items for pagination
  {
    id: "JOB-1031",
    title: "Backend Engineer (Go)",
    employer: "Momo",
    location: "Hồ Chí Minh",
    type: "Toàn thời gian",
    status: "Đang hiển thị",
    postedDate: "25/06/2026",
    applicants: 15,
  },
  {
    id: "JOB-1032",
    title: "QA Automation Engineer",
    employer: "Tiki",
    location: "Hà Nội",
    type: "Toàn thời gian",
    status: "Đang hiển thị",
    postedDate: "26/06/2026",
    applicants: 8,
  },
  {
    id: "JOB-1033",
    title: "System Administrator",
    employer: "Viettel",
    location: "Hà Nội",
    type: "Toàn thời gian",
    status: "Chờ duyệt",
    postedDate: "27/06/2026",
    applicants: 2,
  },
  {
    id: "JOB-1034",
    title: "DevOps Engineer",
    employer: "VNG Corporation",
    location: "Hồ Chí Minh",
    type: "Toàn thời gian",
    status: "Đang hiển thị",
    postedDate: "28/06/2026",
    applicants: 22,
  },
  {
    id: "JOB-1035",
    title: "React Native Developer",
    employer: "FPT Software",
    location: "Đà Nẵng",
    type: "Toàn thời gian",
    status: "Hết hạn",
    postedDate: "01/06/2026",
    applicants: 50,
  },
  {
    id: "JOB-1036",
    title: "Fake Job Scam",
    employer: "Scam Co",
    location: "Remote",
    type: "Thực tập",
    status: "Đã từ chối",
    postedDate: "29/06/2026",
    applicants: 0,
  },
  {
    id: "JOB-1037",
    title: "UI/UX Designer",
    employer: "Zalo",
    location: "Hồ Chí Minh",
    type: "Toàn thời gian",
    status: "Đang hiển thị",
    postedDate: "30/06/2026",
    applicants: 10,
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
            placeholder="Tìm theo tiêu đề, công ty..."
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Đang hiển thị">Đang hiển thị</SelectItem>
            <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
            <SelectItem value="Hết hạn">Hết hạn</SelectItem>
            <SelectItem value="Đã từ chối">Đã từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
