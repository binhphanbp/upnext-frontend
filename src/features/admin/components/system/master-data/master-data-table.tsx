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

export type AdminMasterData = {
  id: string;
  name: string;
  category: "Ngành nghề" | "Kỹ năng" | "Địa điểm" | "Cấp bậc" | "Loại hình";
  itemCount: number;
  status: "Đang hoạt động" | "Ngừng sử dụng";
  lastUpdated: string;
};

const data: AdminMasterData[] = [
  {
    id: "MD-001",
    name: "Danh sách Ngành nghề IT",
    category: "Ngành nghề",
    itemCount: 45,
    status: "Đang hoạt động",
    lastUpdated: "12/06/2026",
  },
  {
    id: "MD-002",
    name: "Bộ kỹ năng Lập trình (Skills)",
    category: "Kỹ năng",
    itemCount: 320,
    status: "Đang hoạt động",
    lastUpdated: "20/06/2026",
  },
  {
    id: "MD-003",
    name: "Tỉnh/Thành phố Việt Nam",
    category: "Địa điểm",
    itemCount: 63,
    status: "Đang hoạt động",
    lastUpdated: "01/01/2026",
  },
  {
    id: "MD-004",
    name: "Cấp bậc vị trí (Levels)",
    category: "Cấp bậc",
    itemCount: 8,
    status: "Đang hoạt động",
    lastUpdated: "15/05/2026",
  },
  {
    id: "MD-005",
    name: "Danh sách Kỹ năng cũ (Deprecated)",
    category: "Kỹ năng",
    itemCount: 120,
    status: "Ngừng sử dụng",
    lastUpdated: "10/12/2025",
  },
  {
    id: "MD-006",
    name: "Danh sách Ngôn ngữ Lập trình",
    category: "Ngành nghề",
    itemCount: 45,
    status: "Đang hoạt động",
    lastUpdated: "12/06/2026",
  },
  {
    id: "MD-007",
    name: "Chứng chỉ Công nghệ (Certificates)",
    category: "Kỹ năng",
    itemCount: 85,
    status: "Đang hoạt động",
    lastUpdated: "18/06/2026",
  },
  {
    id: "MD-008",
    name: "Các Quận/Huyện tại TP.HCM",
    category: "Địa điểm",
    itemCount: 24,
    status: "Đang hoạt động",
    lastUpdated: "05/01/2026",
  },
  {
    id: "MD-009",
    name: "Các Quận/Huyện tại Hà Nội",
    category: "Địa điểm",
    itemCount: 30,
    status: "Đang hoạt động",
    lastUpdated: "05/01/2026",
  },
  {
    id: "MD-010",
    name: "Hình thức làm việc (Work Types)",
    category: "Loại hình",
    itemCount: 6,
    status: "Đang hoạt động",
    lastUpdated: "15/05/2026",
  },
  {
    id: "MD-011",
    name: "Quy mô công ty (Company Size)",
    category: "Loại hình",
    itemCount: 7,
    status: "Đang hoạt động",
    lastUpdated: "20/05/2026",
  },
  {
    id: "MD-012",
    name: "Danh sách Ngành nghề cũ (2020)",
    category: "Ngành nghề",
    itemCount: 38,
    status: "Ngừng sử dụng",
    lastUpdated: "01/12/2021",
  },
];

import { useTranslations } from "next-intl";

export const getColumns = (t: any): ColumnDef<AdminMasterData>[] => [
  {
    accessorKey: "name",
    header: t("name"),
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-semibold">{row.original.name}</p>
        <p className="text-muted-foreground text-xs">{row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: t("category"),
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      const tone =
        category === "Ngành nghề"
          ? "brand"
          : category === "Kỹ năng"
            ? "premium"
            : category === "Địa điểm"
              ? "info"
              : "neutral";

      const categoryKey =
        category === "Ngành nghề"
          ? "industry"
          : category === "Kỹ năng"
            ? "skill"
            : category === "Địa điểm"
              ? "location"
              : category === "Cấp bậc"
                ? "level"
                : "type";
      return <Badge tone={tone}>{t(`categoryOptions.${categoryKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "itemCount",
    header: () => <div className="text-right">{t("itemCount")}</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat("vi-VN").format(row.original.itemCount)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone = status === "Đang hoạt động" ? "success" : "neutral";

      const statusKey = status === "Đang hoạt động" ? "active" : "inactive";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "lastUpdated",
    header: t("lastUpdated"),
    cell: ({ row }) => <div>{row.original.lastUpdated}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
    cell: ({ row }) => {
      const record = row.original;

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
              <DropdownMenuItem>{t("actionOptions.export")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {record.status === "Đang hoạt động" && (
                <DropdownMenuItem className="text-warning">
                  {t("actionOptions.deactivate")}
                </DropdownMenuItem>
              )}
              {record.status === "Ngừng sử dụng" && (
                <DropdownMenuItem className="text-success">
                  {t("actionOptions.reactivate")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function MasterDataTable() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const t = useTranslations("Admin.system.masterData.table");

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full rounded-xl bg-white sm:w-[200px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="Đang hoạt động">{t("statusOptions.active")}</SelectItem>
            <SelectItem value="Ngừng sử dụng">{t("statusOptions.inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
