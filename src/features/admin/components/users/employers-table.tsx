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

export type Employer = {
  id: string;
  companyName: string;
  representative: string;
  email: string;
  plan: "Free" | "Pro" | "Premium";
  status: "Chờ duyệt" | "Đã xác thực" | "Bị khóa";
  activeJobs: number;
  joinDate: string;
};

const data: Employer[] = [
  {
    id: "1",
    companyName: "VNG Corporation",
    representative: "Nguyễn Văn A",
    email: "hr@vng.com.vn",
    plan: "Premium",
    status: "Đã xác thực",
    activeJobs: 15,
    joinDate: "12/05/2025",
  },
  {
    id: "2",
    companyName: "FPT Software",
    representative: "Trần Thị B",
    email: "tuyendung@fsoft.com.vn",
    plan: "Pro",
    status: "Đã xác thực",
    activeJobs: 42,
    joinDate: "01/03/2024",
  },
  {
    id: "3",
    companyName: "Tech Startup X",
    representative: "Lê Văn C",
    email: "contact@startupx.io",
    plan: "Free",
    status: "Chờ duyệt",
    activeJobs: 2,
    joinDate: "24/06/2026",
  },
  {
    id: "4",
    companyName: "Shopee Vietnam",
    representative: "Phạm D",
    email: "careers@shopee.vn",
    plan: "Premium",
    status: "Đã xác thực",
    activeJobs: 8,
    joinDate: "15/11/2023",
  },
  {
    id: "5",
    companyName: "Crypto Scam Co",
    representative: "John Doe",
    email: "admin@cryptoscam.net",
    plan: "Free",
    status: "Bị khóa",
    activeJobs: 0,
    joinDate: "20/06/2026",
  },
  // Add 10 more mock employers for pagination testing
  {
    id: "6",
    companyName: "Momo",
    representative: "Lê E",
    email: "hr@momo.vn",
    plan: "Premium",
    status: "Đã xác thực",
    activeJobs: 20,
    joinDate: "01/02/2025",
  },
  {
    id: "7",
    companyName: "ZaloPay",
    representative: "Trần F",
    email: "jobs@zalopay.vn",
    plan: "Pro",
    status: "Đã xác thực",
    activeJobs: 12,
    joinDate: "15/04/2025",
  },
  {
    id: "8",
    companyName: "Tiki",
    representative: "Phạm G",
    email: "tuyendung@tiki.vn",
    plan: "Pro",
    status: "Chờ duyệt",
    activeJobs: 5,
    joinDate: "10/06/2026",
  },
  {
    id: "9",
    companyName: "Be Group",
    representative: "Nguyễn H",
    email: "hr@be.com.vn",
    plan: "Free",
    status: "Đã xác thực",
    activeJobs: 3,
    joinDate: "22/07/2025",
  },
  {
    id: "10",
    companyName: "Grab Vietnam",
    representative: "Lý K",
    email: "careers@grab.com",
    plan: "Premium",
    status: "Đã xác thực",
    activeJobs: 30,
    joinDate: "05/01/2024",
  },
  {
    id: "11",
    companyName: "Gojek Vietnam",
    representative: "Đặng L",
    email: "jobs@gojek.com",
    plan: "Pro",
    status: "Bị khóa",
    activeJobs: 0,
    joinDate: "12/08/2025",
  },
  {
    id: "12",
    companyName: "VinAI",
    representative: "Hoàng M",
    email: "hr@vinai.io",
    plan: "Premium",
    status: "Đã xác thực",
    activeJobs: 18,
    joinDate: "09/09/2024",
  },
];

import { useTranslations } from "next-intl";

export const getColumns = (t: any): ColumnDef<Employer>[] => [
  {
    accessorKey: "companyName",
    header: t("company"),
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.companyName}</p>
        <p className="text-muted-foreground text-xs">
          {t("joined", { date: row.original.joinDate })}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "representative",
    header: t("representative"),
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.representative}</p>
        <p className="text-muted-foreground text-xs">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "plan",
    header: t("plan"),
    cell: ({ row }) => {
      const plan = row.getValue("plan") as string;
      const tone = plan === "Premium" ? "premium" : plan === "Pro" ? "brand" : "neutral";
      return <Badge tone={tone}>{plan}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đã xác thực" ? "success" : status === "Chờ duyệt" ? "warning" : "error";

      const statusKey =
        status === "Đã xác thực" ? "verified" : status === "Chờ duyệt" ? "pending" : "locked";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "activeJobs",
    header: () => <div className="text-right">{t("activeJobs")}</div>,
    cell: ({ row }) => {
      return <div className="text-right font-medium">{row.getValue("activeJobs")}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
    cell: ({ row }) => {
      const employer = row.original;

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(employer.id)}>
                {t("actionOptions.copyId")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{t("actionOptions.viewProfile")}</DropdownMenuItem>
              {employer.status === "Chờ duyệt" && (
                <DropdownMenuItem className="text-success">
                  {t("actionOptions.approve")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>{t("actionOptions.upgrade")}</DropdownMenuItem>
              {employer.status !== "Bị khóa" && (
                <DropdownMenuItem className="text-error">
                  {t("actionOptions.lock")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function EmployersTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const t = useTranslations("Admin.users.employers.table");

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
            <SelectItem value="Chờ duyệt">{t("statusOptions.pending")}</SelectItem>
            <SelectItem value="Đã xác thực">{t("statusOptions.verified")}</SelectItem>
            <SelectItem value="Bị khóa">{t("statusOptions.locked")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
