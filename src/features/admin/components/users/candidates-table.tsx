"use client";

import {
  ArrowsCounterClockwise,
  DotsThree,
  DownloadSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import Swal from "sweetalert2";

import { AdminCandidateResponse, getAdminCandidates } from "@/features/admin/api/candidates";
import { AdminTableLayout } from "@/features/admin/components/admin-table-layout";
import { getAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
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

type MappedCandidate = {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: "ACTIVE" | "BANNED" | "PENDING_VERIFICATION";
  applications: number;
  joinDate: string;
};

function mapToCandidate(apiCandidate: AdminCandidateResponse): MappedCandidate {
  return {
    id: apiCandidate.id,
    name: apiCandidate.fullName,
    email: apiCandidate.email,
    specialty: "Chưa cập nhật", // Not available in CandidateAccount
    status: apiCandidate.candidateAccountStatus,
    applications: 0, // Not available in CandidateAccount
    joinDate: formatAppDate(apiCandidate.createdAt),
  };
}

export function CandidatesTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const router = useRouter();

  const t = useTranslations("Admin.users.candidates.table");

  const {
    data: apiData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["adminCandidates", { limit: 100 }],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminCandidates(session.accessToken, 100); // We'll just fetch a lot for client-side pagination for now
    },
  });

  const candidates: MappedCandidate[] = React.useMemo(() => {
    if (!apiData) return [];
    return apiData.map(mapToCandidate);
  }, [apiData]);

  const filteredData = React.useMemo(() => {
    let result = candidates;
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (searchTerm) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    return result;
  }, [candidates, statusFilter, searchTerm]);

  // Paginate data manually
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedData.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleRefresh = () => {
    setStatusFilter("all");
    setSearchTerm("");
    refetch();
  };

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-6 flex h-32 items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          <p>
            Đã xảy ra lỗi khi tải danh sách ứng viên:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}
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
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Chờ xác thực</SelectItem>
                <SelectItem value="BANNED">Bị khóa</SelectItem>
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
              <ArrowsCounterClockwise size={18} weight="bold" />
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-full border-slate-200 text-sm font-semibold text-slate-700 shadow-none transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <DownloadSimple size={18} weight="bold" className="mr-2" />
              Xuất Excel
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-slate-200 p-0 text-slate-600 shadow-none transition-all hover:bg-slate-50 hover:text-slate-800"
                >
                  <DotsThree size={24} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Tùy chọn hàng loạt</DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer" disabled={selectedIds.length === 0}>
                  Xóa ứng viên đã chọn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 !bg-[#bfe9d6]">
            <th className="w-12 border-r border-slate-300 px-4 py-3 text-center last:border-r-0">
              <input
                type="checkbox"
                className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Select all"
              />
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("candidate")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("specialty")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("status")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-right font-semibold last:border-r-0">
              {t("applications")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-right font-semibold last:border-r-0">
              {t("joinedDate")}
            </th>
            <th className="px-4 py-3 text-right font-semibold">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr
                key={index}
                className="border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50"
              >
                <td className="w-12 border-r border-slate-200 px-4 py-3 text-center last:border-r-0">
                  <Skeleton className="h-4 w-4" />
                </td>
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </td>
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <Skeleton className="h-5 w-[80px]" />
                </td>
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <Skeleton className="h-5 w-[60px]" />
                </td>
                <td className="border-r border-slate-200 px-4 py-3 text-right last:border-r-0">
                  <Skeleton className="ml-auto h-4 w-[20px]" />
                </td>
                <td className="border-r border-slate-200 px-4 py-3 text-right last:border-r-0">
                  <Skeleton className="ml-auto h-4 w-[80px]" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                </td>
              </tr>
            ))
          ) : paginatedData.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <MagnifyingGlass size={32} />
                  <p>Không tìm thấy ứng viên nào phù hợp</p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedData.map((candidate) => (
              <tr
                key={candidate.id}
                className={cn(
                  "border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30",
                  selectedIds.includes(candidate.id) && "bg-primary/5 hover:bg-primary/10",
                )}
              >
                <td className="w-12 border-r border-slate-200 px-4 py-3 text-center last:border-r-0">
                  <input
                    type="checkbox"
                    className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                    checked={selectedIds.includes(candidate.id)}
                    onChange={(e) => handleSelectRow(e.target.checked, candidate.id)}
                    aria-label="Select row"
                  />
                </td>
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <div>
                    <p className="text-foreground font-semibold">{candidate.name}</p>
                    <p className="text-muted-foreground text-xs">{candidate.email}</p>
                  </div>
                </td>
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <Badge tone="neutral" className="text-xs font-medium">
                    {candidate.specialty}
                  </Badge>
                </td>
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <Badge
                    tone={
                      candidate.status === "ACTIVE"
                        ? "success"
                        : candidate.status === "PENDING_VERIFICATION"
                          ? "warning"
                          : "error"
                    }
                  >
                    {candidate.status === "ACTIVE"
                      ? "Hoạt động"
                      : candidate.status === "PENDING_VERIFICATION"
                        ? "Chờ xác thực"
                        : "Bị khóa"}
                  </Badge>
                </td>
                <td className="border-r border-slate-200 px-4 py-3 text-right font-medium last:border-r-0">
                  {candidate.applications}
                </td>
                <td className="text-muted-foreground border-r border-slate-200 px-4 py-3 text-right last:border-r-0">
                  {candidate.joinDate}
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
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(candidate.id);
                          Swal.fire({
                            icon: "success",
                            title: "Đã copy ID",
                            toast: true,
                            position: "top-end",
                            showConfirmButton: false,
                            timer: 2000,
                          });
                        }}
                      >
                        {t("actionOptions.copyId")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/users/candidates/${candidate.id}`)}
                      >
                        {t("actionOptions.viewProfile")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        {t("actionOptions.viewApplications")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-error cursor-pointer">
                        {t("actionOptions.ban")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTableLayout>
    </div>
  );
}
