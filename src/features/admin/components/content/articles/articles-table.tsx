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

import { useTranslations } from "next-intl";

export const getColumns = (t: any): ColumnDef<AdminArticle>[] => [
  {
    accessorKey: "title",
    header: t("article"),
    cell: ({ row }) => {
      const category = row.original.category as string;
      const categoryKey =
        category === "Phát triển nghề nghiệp"
          ? "career"
          : category === "Góc kỹ thuật"
            ? "technical"
            : category === "Báo cáo thị trường"
              ? "market"
              : category === "Review công ty"
                ? "review"
                : category === "Tin tức"
                  ? "news"
                  : "blog";

      return (
        <div>
          <p className="text-foreground font-bold">{row.original.title}</p>
          <p className="text-muted-foreground text-xs">{t(`categoryOptions.${categoryKey}`)}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "author",
    header: t("author"),
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đã xuất bản" ? "success" : status === "Đang chờ duyệt" ? "warning" : "neutral";

      const statusKey =
        status === "Đã xuất bản" ? "published" : status === "Đang chờ duyệt" ? "pending" : "draft";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "views",
    header: () => <div className="text-right">{t("views")}</div>,
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
    header: t("date"),
    cell: ({ row }) => <div>{row.original.publishedDate || "—"}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
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
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem>{t("actionOptions.edit")}</DropdownMenuItem>
              <DropdownMenuItem>{t("actionOptions.viewPreview")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {article.status === "Đang chờ duyệt" && (
                <DropdownMenuItem className="text-success">
                  {t("actionOptions.approveAndPublish")}
                </DropdownMenuItem>
              )}
              {article.status === "Đã xuất bản" && (
                <DropdownMenuItem>{t("actionOptions.moveToDraft")}</DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-error">
                {t("actionOptions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function ArticlesTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const t = useTranslations("Admin.content.articles.table");

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
            <SelectItem value="Đã xuất bản">{t("statusOptions.published")}</SelectItem>
            <SelectItem value="Đang chờ duyệt">{t("statusOptions.pending")}</SelectItem>
            <SelectItem value="Bản nháp">{t("statusOptions.draft")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
