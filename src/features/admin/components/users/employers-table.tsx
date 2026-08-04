"use client";

import {
  ArrowsCounterClockwise,
  DotsThree,
  DownloadSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import Swal from "sweetalert2";

import {
  getAdminEmployers,
  getAdminCompanyDetails,
  verifyCompany,
  type AdminCompanyResponse,
} from "@/features/admin/api/employers";
import { AdminTableLayout } from "@/features/admin/components/admin-table-layout";
import { getAdminSession, clearAdminSession } from "@/features/admin/session";
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

export type Employer = {
  id: string;
  companyName: string;
  representative: string;
  email: string;
  plan: "Free" | "Pro" | "Premium";
  status: "Chờ duyệt" | "Đã xác thực" | "Bị khóa";
  activeJobs: number;
  joinDate: string;
  lockedAt?: string;
};

function mapToEmployer(apiCompany: AdminCompanyResponse): Employer {
  let mappedStatus: Employer["status"] = "Đã xác thực";
  if (apiCompany.status === "LOCKED") {
    mappedStatus = "Bị khóa";
  } else if (apiCompany.verificationStatus !== "VERIFIED") {
    mappedStatus = "Chờ duyệt";
  }

  let representative = "Chưa cập nhật";
  if (apiCompany.members && apiCompany.members.length > 0) {
    // Try to find the OWNER, if not fallback to the first member
    const owner = apiCompany.members.find((m: any) => m.role?.code === "OWNER");
    const member = owner || apiCompany.members[0];
    representative =
      member.recruiterAccount?.profile?.fullName ||
      member.recruiterAccount?.email ||
      member.invitedEmail ||
      "Chưa cập nhật";
  } else if (apiCompany.recruiterAccounts && apiCompany.recruiterAccounts.length > 0) {
    const recruiter = apiCompany.recruiterAccounts[0];
    representative = recruiter.profile?.fullName || recruiter.email || "Chưa cập nhật";
  }

  const employer: Employer = {
    id: apiCompany.id,
    companyName: apiCompany.name,
    representative,
    email: apiCompany.email || "Chưa cập nhật",
    plan: "Free", // API doesn't provide plan info yet
    status: mappedStatus,
    activeJobs: apiCompany._count?.jobPosts || 0,
    joinDate: formatAppDate(apiCompany.createdAt),
  };

  if (apiCompany.lockedAt) {
    employer.lockedAt = formatAppDate(apiCompany.lockedAt);
  }

  return employer;
}

function EmployerRow({
  employer,
  selected,
  onSelect,
  onVerify,
  tone,
}: {
  employer: Employer;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onVerify: (id: string, status: "VERIFIED" | "REJECTED") => void;
  tone: "success" | "warning" | "error";
}) {
  const t = useTranslations("Admin.users.employers.table");
  const router = useRouter();

  const { data: details } = useQuery({
    queryKey: ["adminCompanyDetails", employer.id],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminCompanyDetails(session.accessToken, employer.id);
    },
    staleTime: 5 * 60 * 1000,
  });

  let representative = employer.representative;
  let activeJobs = employer.activeJobs;

  if (details) {
    if (details.members && details.members.length > 0) {
      const owner = details.members.find((m: any) => m.role?.code === "OWNER");
      const member = owner || details.members[0];
      representative =
        member.recruiterAccount?.email ||
        member.invitedEmail ||
        member.recruiterAccount?.profile?.fullName ||
        "Chưa cập nhật";
    } else if (details.recruiterAccounts && details.recruiterAccounts.length > 0) {
      const recruiter = details.recruiterAccounts[0];
      representative = recruiter.email || recruiter.profile?.fullName || "Chưa cập nhật";
    }

    if (details.jobPosts) {
      activeJobs = details.jobPosts.length;
    }
  }

  return (
    <tr
      className={cn(
        "border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30",
        selected && "bg-primary/5 hover:bg-primary/10",
      )}
    >
      <td className="w-12 border-r border-slate-200 px-4 py-3 text-center last:border-r-0">
        <input
          type="checkbox"
          aria-label={`Chọn ${employer.companyName}`}
          className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
          checked={selected}
          onChange={(e) => onSelect(employer.id, e.target.checked)}
        />
      </td>
      <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
        <div>
          <p className="text-foreground font-semibold">{employer.companyName}</p>
          <p className="text-muted-foreground text-xs">{employer.email}</p>
        </div>
      </td>
      <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">{representative}</td>
      <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
          {employer.plan}
        </span>
      </td>
      <td className="border-r border-slate-200 px-4 py-3 text-sm last:border-r-0">
        {employer.joinDate}
      </td>
      <td className="border-r border-slate-200 px-4 py-3 text-sm last:border-r-0">
        {employer.lockedAt || "-"}
      </td>
      <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
        <Badge tone={tone}>{employer.status}</Badge>
      </td>
      <td className="border-r border-slate-200 px-4 py-3 text-right font-medium last:border-r-0">
        {activeJobs}
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              aria-label={`Mở menu thao tác cho ${employer.companyName}`}
            >
              <DotsThree size={20} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(`/admin/users/employers/${employer.id}`)}
            >
              Chi tiết hồ sơ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {employer.status === "Chờ duyệt" && (
              <DropdownMenuItem
                className="text-success cursor-pointer"
                onClick={() => onVerify(employer.id, "VERIFIED")}
              >
                {t("actionOptions.approve")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>{t("actionOptions.upgrade")}</DropdownMenuItem>
            {employer.status !== "Bị khóa" && (
              <DropdownMenuItem className="text-error">{t("actionOptions.lock")}</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

export function EmployersTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const t = useTranslations("Admin.users.employers.table");
  const router = useRouter();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "VERIFIED" | "REJECTED" }) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return verifyCompany(session.accessToken, id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminEmployers"] });
      void Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true,
        icon: "success",
        title: "Cập nhật trạng thái thành công",
      });
    },
  });

  const handleVerify = React.useCallback(
    (id: string, status: "VERIFIED" | "REJECTED") => {
      verifyMutation.mutate({ id, status });
    },
    [verifyMutation],
  );

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

  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminEmployers"] });
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
    return apiCompanies.map(mapToEmployer);
  }, [apiCompanies]);

  const filteredData = React.useMemo(() => {
    let result = data;
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.companyName.toLowerCase().includes(lower) ||
          item.email.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [statusFilter, searchTerm, data]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const isAllPageSelected =
    paginatedData.length > 0 && paginatedData.every((app) => selectedIds.includes(app.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedData.map((app) => app.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedData.map((app) => app.id);
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
                <SelectItem value="Đã xác thực">{t("statusOptions.verified")}</SelectItem>
                <SelectItem value="Chờ duyệt">{t("statusOptions.pending")}</SelectItem>
                <SelectItem value="Bị khóa">{t("statusOptions.locked")}</SelectItem>
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
              <span>Xuất Excel</span>
            </Button>
          </>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 !bg-[#bfe9d6]">
            <th className="w-12 border-r border-slate-300 px-4 py-3 text-center last:border-r-0">
              <input
                type="checkbox"
                aria-label="Chọn tất cả công ty trên trang này"
                className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                checked={isAllPageSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("company")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              Đại diện liên hệ
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              Gói dịch vụ
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              Ngày tạo
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              Ngày đóng
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("status")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-right font-semibold last:border-r-0">
              {t("activeJobs")}
            </th>
            <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 text-center">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <MagnifyingGlass size={32} />
                  <p>Không tìm thấy công ty nào phù hợp</p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedData.map((employer) => {
              const tone =
                employer.status === "Đã xác thực"
                  ? "success"
                  : employer.status === "Chờ duyệt"
                    ? "warning"
                    : "error";

              return (
                <EmployerRow
                  key={employer.id}
                  employer={employer}
                  selected={selectedIds.includes(employer.id)}
                  onSelect={handleSelectOne}
                  onVerify={handleVerify}
                  tone={tone}
                />
              );
            })
          )}
        </tbody>
      </AdminTableLayout>
    </div>
  );
}
