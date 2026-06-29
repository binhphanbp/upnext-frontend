"use client";

import { DotsThree, MagnifyingGlass } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { getAdminEmployers, type AdminCompanyResponse } from "@/features/admin/api/employers";
import { getAdminSession, clearAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { formatAppDate } from "@/shared/lib/date";
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
import { Skeleton } from "@/shared/ui/skeleton";

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

function mapToEmployer(apiCompany: AdminCompanyResponse): Employer {
  let mappedStatus: Employer["status"] = "Đã xác thực";
  if (apiCompany.status === "LOCKED") {
    mappedStatus = "Bị khóa";
  } else if (apiCompany.verificationStatus === "PENDING") {
    mappedStatus = "Chờ duyệt";
  } else if (apiCompany.verificationStatus === "UNVERIFIED") {
    mappedStatus = "Chờ duyệt";
  } else if (apiCompany.verificationStatus === "REJECTED") {
    mappedStatus = "Bị khóa";
  }

  return {
    id: apiCompany.id,
    companyName: apiCompany.name,
    representative: "Chưa cập nhật", // Fallback: API doesn't provide this yet
    email: apiCompany.email || "Chưa cập nhật",
    plan: "Free", // Fallback: API doesn't provide this yet
    status: mappedStatus,
    activeJobs: 0, // Fallback: API doesn't provide this yet
    joinDate: formatAppDate(apiCompany.createdAt),
  };
}

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
  const router = useRouter();

  const {
    data: apiCompanies = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminEmployers"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) {
        throw new Error("No session");
      }
      return getAdminEmployers(session.accessToken);
    },
    retry: false,
  });

  React.useEffect(() => {
    if (error) {
      if (error instanceof Error && error.message === "No session") {
        router.replace("/admin/login");
      } else if (error instanceof ApiError && error.status === 401) {
        clearAdminSession();
        router.replace("/admin/login");
      }
    }
  }, [error, router]);

  const data = React.useMemo(() => {
    return apiCompanies.map(mapToEmployer);
  }, [apiCompanies]);

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((item) => item.status === statusFilter);
  }, [statusFilter, data]);

  const columns = React.useMemo(() => getColumns(t), [t]);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full rounded-xl sm:w-[350px]" />
          <Skeleton className="h-10 w-full rounded-xl sm:w-[180px]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

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
