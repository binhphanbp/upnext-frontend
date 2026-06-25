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

import { useTranslations } from "next-intl";

export const getColumns = (t: any): ColumnDef<AdminModerationReport>[] => [
  {
    accessorKey: "contentType",
    header: t("contentType"),
    cell: ({ row }) => {
      const type = row.original.contentType as string;
      const typeKey =
        type === "Tin tuyển dụng"
          ? "job"
          : type === "Bình luận"
            ? "comment"
            : type === "Review công ty"
              ? "review"
              : type === "Hồ sơ"
                ? "profile"
                : "job"; // fallback

      return (
        <div>
          <p className="font-medium">{t(`contentTypeOptions.${typeKey}`)}</p>
          <p className="text-muted-foreground text-xs">{row.original.targetName}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "reporter",
    header: t("reporter"),
    cell: ({ row }) => {
      const reporter = row.original.reporter as string;
      return <p>{reporter === "Ẩn danh" ? t("anonymous") : reporter}</p>;
    },
  },
  {
    accessorKey: "reason",
    header: t("reason"),
    cell: ({ row }) => {
      const reason = row.original.reason as string;
      let reasonKey = "unknown";

      switch (reason) {
        case "Tin rác, lừa đảo":
          reasonKey = "spam";
          break;
        case "Ngôn từ thù ghét, lăng mạ":
          reasonKey = "hateSpeech";
          break;
        case "Sử dụng thông tin giả mạo":
          reasonKey = "fakeInfo";
          break;
        case "Chứa link đáng ngờ":
          reasonKey = "suspiciousLink";
          break;
        case "Yêu cầu đóng phí":
          reasonKey = "feeRequired";
          break;
        case "Quảng cáo cá cược":
          reasonKey = "gambling";
          break;
        case "Avatar phản cảm":
          reasonKey = "inappropriateAvatar";
          break;
        case "Bôi nhọ danh dự":
          reasonKey = "defamation";
          break;
        case "Việc làm không có thật":
          reasonKey = "fakeJob";
          break;
        case "Ngôn từ thô tục":
          reasonKey = "profanity";
          break;
        case "Review giả mạo":
          reasonKey = "fakeReview";
          break;
        case "Tên chứa ký tự lạ":
          reasonKey = "invalidName";
          break;
      }

      return <p className="max-w-[200px] truncate">{t(`reasonOptions.${reasonKey}`)}</p>;
    },
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đã giải quyết"
          ? "success"
          : status === "Đang chờ xử lý"
            ? "warning"
            : "neutral";

      const statusKey =
        status === "Đã giải quyết"
          ? "resolved"
          : status === "Đang chờ xử lý"
            ? "pending"
            : "dismissed";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "reportedDate",
    header: t("reportedDate"),
    cell: ({ row }) => <div>{row.original.reportedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
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
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem>{t("actionOptions.viewDetails")}</DropdownMenuItem>
              <DropdownMenuItem>{t("actionOptions.viewReporter")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {report.status === "Đang chờ xử lý" && (
                <>
                  <DropdownMenuItem className="text-success">
                    {t("actionOptions.resolveAndRemove")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-warning">
                    {t("actionOptions.banTarget")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-neutral">
                    {t("actionOptions.dismiss")}
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
  const t = useTranslations("Admin.content.moderation.table");

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
            <SelectItem value="Đang chờ xử lý">{t("statusOptions.pending")}</SelectItem>
            <SelectItem value="Đã giải quyết">{t("statusOptions.resolved")}</SelectItem>
            <SelectItem value="Đã từ chối">{t("statusOptions.dismissed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
