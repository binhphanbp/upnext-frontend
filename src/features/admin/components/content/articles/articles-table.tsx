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

export type AdminArticle = {
  id: string;
  title: string;
  author: string;
  category: string;
  status: "Đã xuất bản" | "Bản nháp" | "Đang chờ duyệt";
  views: number;
  publishedDate: string | null;
};

const data: AdminArticle[] = [
  {
    id: "ART-5012",
    title: "10 Kỹ năng mềm lập trình viên cần có năm 2026",
    author: "Bình Nguyễn",
    category: "Phát triển nghề nghiệp",
    status: "Đã xuất bản",
    views: 12500,
    publishedDate: "15/06/2026",
  },
  {
    id: "ART-5015",
    title: "Hướng dẫn React 19 và Server Components",
    author: "Anh Trần",
    category: "Góc kỹ thuật",
    status: "Đang chờ duyệt",
    views: 0,
    publishedDate: null,
  },
  {
    id: "ART-5010",
    title: "Lương IT năm 2026 có biến động như thế nào?",
    author: "Mai Lê",
    category: "Báo cáo thị trường",
    status: "Đã xuất bản",
    views: 8400,
    publishedDate: "10/06/2026",
  },
  {
    id: "ART-5018",
    title: "Review môi trường làm việc tại các công ty Outsource",
    author: "Khách mời",
    category: "Review công ty",
    status: "Bản nháp",
    views: 0,
    publishedDate: null,
  },
];

export const columns: ColumnDef<AdminArticle>[] = [
  {
    accessorKey: "title",
    header: "Tiêu đề",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.title}</p>
        <p className="text-muted-foreground text-xs">{row.original.category}</p>
      </div>
    ),
  },
  {
    accessorKey: "author",
    header: "Tác giả",
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đã xuất bản" ? "success" : status === "Đang chờ duyệt" ? "warning" : "neutral";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    accessorKey: "views",
    header: () => <div className="text-right">Lượt xem</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat("vi-VN").format(row.original.views)}
        </div>
      );
    },
  },
  {
    accessorKey: "publishedDate",
    header: "Ngày xuất bản",
    cell: ({ row }) => <div>{row.original.publishedDate || "—"}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const article = row.original;

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
              <DropdownMenuItem>Chỉnh sửa bài viết</DropdownMenuItem>
              <DropdownMenuItem>Xem trước</DropdownMenuItem>
              <DropdownMenuSeparator />
              {article.status === "Đang chờ duyệt" && (
                <DropdownMenuItem className="text-success">Duyệt và xuất bản</DropdownMenuItem>
              )}
              {article.status === "Đã xuất bản" && (
                <DropdownMenuItem>Chuyển thành bản nháp</DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-error">Xóa bài viết</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function ArticlesTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
