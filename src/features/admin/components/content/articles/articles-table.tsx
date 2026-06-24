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
  // Add more items for pagination
  {
    id: "ART-5019",
    title: "Mẹo viết CV chuẩn ATS cho Developer",
    author: "Hoa Phượng",
    category: "Phát triển nghề nghiệp",
    status: "Đã xuất bản",
    views: 4200,
    publishedDate: "20/06/2026",
  },
  {
    id: "ART-5020",
    title: "Tương lai của AI trong lập trình",
    author: "Tiến Đạt",
    category: "Góc kỹ thuật",
    status: "Đang chờ duyệt",
    views: 0,
    publishedDate: null,
  },
  {
    id: "ART-5021",
    title: "Sự kiện Tech Summit 2026",
    author: "Ban Biên Tập",
    category: "Tin tức",
    status: "Bản nháp",
    views: 0,
    publishedDate: null,
  },
  {
    id: "ART-5022",
    title: "Top 5 công ty IT lương cao nhất HN",
    author: "Mai Lê",
    category: "Báo cáo thị trường",
    status: "Đã xuất bản",
    views: 15600,
    publishedDate: "22/06/2026",
  },
  {
    id: "ART-5023",
    title: "Hướng dẫn sử dụng Redux Toolkit",
    author: "Anh Trần",
    category: "Góc kỹ thuật",
    status: "Đã xuất bản",
    views: 3200,
    publishedDate: "23/06/2026",
  },
  {
    id: "ART-5024",
    title: "Tâm sự nghề Dev: Lúc buồn",
    author: "Khách mời",
    category: "Blog",
    status: "Đang chờ duyệt",
    views: 0,
    publishedDate: null,
  },
  {
    id: "ART-5025",
    title: "So sánh Vue và React năm 2026",
    author: "Bình Nguyễn",
    category: "Góc kỹ thuật",
    status: "Đã xuất bản",
    views: 5000,
    publishedDate: "24/06/2026",
  },
  {
    id: "ART-5026",
    title: "Cách đàm phán lương hiệu quả",
    author: "Hoa Phượng",
    category: "Phát triển nghề nghiệp",
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
            placeholder="Tìm theo tiêu đề, tác giả..."
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Đã xuất bản">Đã xuất bản</SelectItem>
            <SelectItem value="Đang chờ duyệt">Đang chờ duyệt</SelectItem>
            <SelectItem value="Bản nháp">Bản nháp</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
