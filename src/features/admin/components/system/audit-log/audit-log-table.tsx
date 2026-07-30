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
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export type AdminAuditLog = {
  id: string;
  timestamp: string;
  user: string;
  action: "Tạo mới" | "Cập nhật" | "Xóa" | "Đăng nhập" | "Khác";
  resource: string;
  ipAddress: string;
  status: "Thành công" | "Thất bại";
};

const data: AdminAuditLog[] = [
  {
    id: "LOG-09921",
    timestamp: "24/06/2026 14:15:22",
    user: "binh.nguyen@admin.com",
    action: "Cập nhật",
    resource: "Master Data: Kỹ năng",
    ipAddress: "192.168.1.104",
    status: "Thành công",
  },
  {
    id: "LOG-09920",
    timestamp: "24/06/2026 13:40:05",
    user: "mai.le@sales.com",
    action: "Đăng nhập",
    resource: "Hệ thống (Web)",
    ipAddress: "113.190.22.15",
    status: "Thất bại",
  },
  {
    id: "LOG-09919",
    timestamp: "24/06/2026 11:20:10",
    user: "system_cron",
    action: "Khác",
    resource: "Job: Auto-Expire Jobs",
    ipAddress: "127.0.0.1",
    status: "Thành công",
  },
  {
    id: "LOG-09918",
    timestamp: "23/06/2026 16:45:00",
    user: "anh.tran@mod.com",
    action: "Xóa",
    resource: "Bài viết #ART-5002",
    ipAddress: "14.232.112.99",
    status: "Thành công",
  },
  {
    id: "LOG-09915",
    timestamp: "23/06/2026 09:30:15",
    user: "admin_super",
    action: "Tạo mới",
    resource: "Vai trò: Thực tập sinh Marketing",
    ipAddress: "10.0.0.5",
    status: "Thành công",
  },
  {
    id: "LOG-09914",
    timestamp: "23/06/2026 08:15:00",
    user: "binh.nguyen@admin.com",
    action: "Cập nhật",
    resource: "Master Data: Địa điểm",
    ipAddress: "192.168.1.104",
    status: "Thành công",
  },
  {
    id: "LOG-09913",
    timestamp: "22/06/2026 22:10:05",
    user: "system_cron",
    action: "Khác",
    resource: "Job: Send Weekly Reports",
    ipAddress: "127.0.0.1",
    status: "Thành công",
  },
  {
    id: "LOG-09912",
    timestamp: "22/06/2026 15:45:22",
    user: "mai.le@sales.com",
    action: "Đăng nhập",
    resource: "Hệ thống (Web)",
    ipAddress: "113.190.22.15",
    status: "Thành công",
  },
  {
    id: "LOG-09911",
    timestamp: "22/06/2026 10:20:10",
    user: "anh.tran@mod.com",
    action: "Xóa",
    resource: "Ứng viên #CAN-992",
    ipAddress: "14.232.112.99",
    status: "Thất bại",
  },
  {
    id: "LOG-09910",
    timestamp: "21/06/2026 09:10:00",
    user: "admin_super",
    action: "Tạo mới",
    resource: "Gói dịch vụ: Premium Plus",
    ipAddress: "10.0.0.5",
    status: "Thành công",
  },
  {
    id: "LOG-09909",
    timestamp: "21/06/2026 08:05:15",
    user: "binh.nguyen@admin.com",
    action: "Đăng nhập",
    resource: "Hệ thống (Web)",
    ipAddress: "192.168.1.104",
    status: "Thành công",
  },
];

import { useTranslations } from "next-intl";

export const getColumns = (t: any): ColumnDef<AdminAuditLog>[] => [
  {
    accessorKey: "timestamp",
    header: t("timestamp"),
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.timestamp}</p>
        <p className="text-muted-foreground font-mono text-xs">{row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "user",
    header: t("user"),
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.user}</p>
        <p className="text-muted-foreground text-xs">IP: {row.original.ipAddress}</p>
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: t("action"),
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      const tone =
        action === "Tạo mới"
          ? "success"
          : action === "Cập nhật"
            ? "brand"
            : action === "Xóa"
              ? "error"
              : action === "Đăng nhập"
                ? "info"
                : "neutral";

      const actionKey =
        action === "Tạo mới"
          ? "create"
          : action === "Cập nhật"
            ? "update"
            : action === "Xóa"
              ? "delete"
              : action === "Đăng nhập"
                ? "login"
                : "other";
      return <Badge tone={tone}>{t(`actionOptions.${actionKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "resource",
    header: t("resource"),
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone = status === "Thành công" ? "success" : "error";
      const statusKey = status === "Thành công" ? "success" : "failed";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
    cell: () => {
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <DotsThree size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem>{t("actionMenuOptions.viewDetails")}</DropdownMenuItem>
              <DropdownMenuItem>{t("actionMenuOptions.viewHistory")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function AuditLogTable() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("all");
  const t = useTranslations("Admin.system.auditLog.table");

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resource.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = actionFilter === "all" || item.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [searchTerm, actionFilter]);

  const columns = React.useMemo(() => getColumns(t), [t]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <Input
            placeholder={t("searchPlaceholder")}
            className="rounded-xl bg-white pl-10 lg:max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full rounded-xl bg-white sm:w-[200px]">
            <SelectValue placeholder={t("allActions")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">{t("allActions")}</SelectItem>
            <SelectItem value="Tạo mới">{t("actionOptions.create")}</SelectItem>
            <SelectItem value="Cập nhật">{t("actionOptions.update")}</SelectItem>
            <SelectItem value="Xóa">{t("actionOptions.delete")}</SelectItem>
            <SelectItem value="Đăng nhập">{t("actionOptions.login")}</SelectItem>
            <SelectItem value="Khác">{t("actionOptions.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
