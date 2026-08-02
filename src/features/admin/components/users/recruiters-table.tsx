"use client";

import {
  ArrowsCounterClockwise,
  DotsThree,
  DownloadSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";

import { getAdminRecruiters, type AdminRecruiterResponse } from "@/features/admin/api/recruiters";
import { AdminTableLayout } from "@/features/admin/components/admin-table-layout";
import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
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

export type RecruiterAccount = {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  role: string;
  status: "Đang hoạt động" | "Chờ xác thực" | "Bị khóa";
  originalStatus: string;
  joinDate: string;
};

function mapToRecruiter(apiData: AdminRecruiterResponse): RecruiterAccount {
  let mappedStatus: RecruiterAccount["status"] = "Đang hoạt động";
  if (apiData.status === "BANNED") {
    mappedStatus = "Bị khóa";
  } else if (apiData.status === "PENDING_VERIFICATION") {
    mappedStatus = "Chờ xác thực";
  }

  return {
    id: apiData.id,
    email: apiData.email,
    fullName: apiData.profile?.fullName || "Chưa cập nhật",
    companyName: apiData.company?.name || "Chưa cập nhật",
    role: apiData.recruiterRole?.name || "Chưa phân quyền",
    status: mappedStatus,
    originalStatus: apiData.status,
    joinDate: formatAppDate(apiData.createdAt),
  };
}

export function RecruitersTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const t = useTranslations("Admin.users.recruiters.table");
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: apiRecruiters = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminRecruiters"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) {
        throw new Error("No session");
      }
      return getAdminRecruiters(session.accessToken);
    },
    retry: false,
  });

  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminRecruiters"] });
  }, [queryClient]);

  React.useEffect(() => {
    if (error) {
      if (error instanceof Error && error.message === "No session") {
        router.replace("/portal-access");
      } else if (error instanceof ApiError && error.status === 401) {
        clearAdminSession();
        router.replace("/portal-access");
      }
    }
  }, [error, router]);

  const data = React.useMemo(() => {
    return apiRecruiters.map(mapToRecruiter);
  }, [apiRecruiters]);

  const filteredData = React.useMemo(() => {
    let result = data;
    if (statusFilter !== "all") {
      result = result.filter((item) => item.originalStatus === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.fullName.toLowerCase().includes(lower) ||
          item.email.toLowerCase().includes(lower) ||
          item.companyName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [statusFilter, searchTerm, data]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const isAllPageSelected =
    paginatedData.length > 0 && paginatedData.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedData.map((item) => item.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedData.map((item) => item.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

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
    <div className="mt-6">
      <AdminTableLayout
        loading={isLoading}
        totalItems={filteredData.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        filterBar={
          <>
            <div className="relative w-full sm:w-[350px]">
              <MagnifyingGlass
                className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                className="border-input focus:border-primary h-10 w-full rounded-xl border bg-white pl-10 text-sm shadow-none focus:outline-none"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="ACTIVE">{t("statusOptions.active")}</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">{t("statusOptions.pending")}</SelectItem>
                <SelectItem value="BANNED">{t("statusOptions.banned")}</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        actionBar={
          <>
            <Button
              variant="outline"
              size="icon"
              className="flex h-10 w-10 items-center justify-center rounded-full border-slate-200 p-0 text-slate-600 shadow-none transition-all hover:bg-slate-50 hover:text-slate-800"
              onClick={handleRefresh}
              aria-label="Refresh list"
            >
              <ArrowsCounterClockwise size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-slate-200 p-0 text-slate-600 shadow-none transition-all hover:bg-slate-50 hover:text-slate-800 focus:ring-0 focus:ring-offset-0"
              aria-label="More options"
            >
              <DotsThree size={24} weight="bold" />
            </Button>
            <Button
              variant="outline"
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border-emerald-600 px-4 font-semibold text-emerald-600 shadow-none transition-all hover:bg-emerald-50/50"
            >
              <DownloadSimple size={18} />
              <span>{t("exportExcel")}</span>
            </Button>
          </>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 !bg-[#bfe9d6]">
            <th className="w-12 border-r border-slate-300 px-4 py-3 text-center last:border-r-0">
              <input
                type="checkbox"
                aria-label="Chọn tất cả"
                className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                checked={isAllPageSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("user")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("company")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("role")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("status")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-right font-semibold last:border-r-0">
              {t("joinedDate")}
            </th>
            <th className="px-4 py-3 text-right font-semibold">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <MagnifyingGlass size={32} />
                  <p>{t("empty")}</p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedData.map((item) => {
              const tone =
                item.status === "Đang hoạt động"
                  ? "success"
                  : item.status === "Chờ xác thực"
                    ? "warning"
                    : "error";

              return (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30",
                    selectedIds.includes(item.id) && "bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <td className="w-12 border-r border-slate-200 px-4 py-3 text-center last:border-r-0">
                    <input
                      type="checkbox"
                      aria-label={`Chọn ${item.fullName}`}
                      className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                    />
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                    <div>
                      <p className="text-foreground font-semibold">{item.fullName}</p>
                      <p className="text-muted-foreground text-xs">{item.email}</p>
                    </div>
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 font-medium last:border-r-0">
                    {item.companyName}
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                      {item.role}
                    </span>
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                    <Badge tone={tone}>{item.status}</Badge>
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 text-right font-medium text-slate-500 last:border-r-0">
                    {item.joinDate}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Mở menu thao tác</span>
                          <DotsThree size={20} weight="bold" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer">
                          {t("actionOptions.viewProfile")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {item.status !== "Bị khóa" && (
                          <DropdownMenuItem className="text-error cursor-pointer">
                            {t("actionOptions.ban")}
                          </DropdownMenuItem>
                        )}
                        {item.status === "Bị khóa" && (
                          <DropdownMenuItem className="text-success cursor-pointer">
                            {t("actionOptions.unban")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </AdminTableLayout>
    </div>
  );
}
