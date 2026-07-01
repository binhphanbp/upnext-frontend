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

import { getAdminJobPosts, type AdminJobPostResponse } from "@/features/admin/api/job-posts";
import { getAdminSession, clearAdminSession } from "@/features/admin/session";
import { RecruiterTableLayout } from "@/features/recruiter/components/recruiter-table-layout";
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

export type AdminJobPost = {
  id: string;
  title: string;
  employer: string;
  companyId: string | null;
  location: string;
  type: string;
  status: "Đang hiển thị" | "Chờ duyệt" | "Hết hạn" | "Đã từ chối";
  postedDate: string;
  applicants: number;
};

function mapToAdminJobPost(apiPost: AdminJobPostResponse): AdminJobPost {
  let mappedStatus: AdminJobPost["status"] = "Đang hiển thị";
  if (apiPost.moderationStatus === "PENDING" || apiPost.status === "DRAFT") {
    mappedStatus = "Chờ duyệt";
  } else if (apiPost.moderationStatus === "REJECTED") {
    mappedStatus = "Đã từ chối";
  } else if (apiPost.status === "CLOSED" || apiPost.status === "ARCHIVED") {
    mappedStatus = "Hết hạn";
  }

  let mappedType = "Khác";
  const rawType = apiPost.employmentType?.name || apiPost.type || "";
  if (rawType.includes("Toàn thời gian") || rawType.toLowerCase().includes("full"))
    mappedType = "Toàn thời gian";
  else if (rawType.includes("Bán thời gian") || rawType.toLowerCase().includes("part"))
    mappedType = "Bán thời gian";
  else if (rawType.includes("Thực tập") || rawType.toLowerCase().includes("intern"))
    mappedType = "Thực tập";

  return {
    id: apiPost.id,
    title: apiPost.title,
    employer: apiPost.company?.name || "Chưa cập nhật",
    companyId: apiPost.company?.id || null,
    location:
      apiPost.jobPostLocations?.[0]?.jobLocation?.city || apiPost.location || "Chưa cập nhật",
    type: mappedType,
    status: mappedStatus,
    postedDate: apiPost.publishedAt
      ? formatAppDate(apiPost.publishedAt)
      : formatAppDate(apiPost.createdAt),
    applicants: apiPost._count?.applications || apiPost.applicants || 0,
  };
}

export function JobPostsTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const t = useTranslations("Admin.content.jobs.table");
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: apiJobs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminJobPosts"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) {
        throw new Error("No session");
      }
      return getAdminJobPosts(session.accessToken);
    },
    retry: false,
  });

  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminJobPosts"] });
  }, [queryClient]);

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
    return apiJobs.map(mapToAdminJobPost);
  }, [apiJobs]);

  const filteredData = React.useMemo(() => {
    let result = data;
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(lower) || item.employer.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [statusFilter, searchTerm, data]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const isAllPageSelected =
    paginatedData.length > 0 && paginatedData.every((job) => selectedIds.includes(job.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedData.map((job) => job.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedData.map((job) => job.id);
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
      <RecruiterTableLayout
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
                <SelectItem value="Đang hiển thị">{t("statusOptions.active")}</SelectItem>
                <SelectItem value="Chờ duyệt">{t("statusOptions.pending")}</SelectItem>
                <SelectItem value="Hết hạn">{t("statusOptions.expired")}</SelectItem>
                <SelectItem value="Đã từ chối">{t("statusOptions.rejected")}</SelectItem>
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
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border-emerald-600 px-4 font-bold text-emerald-600 shadow-none transition-all hover:bg-emerald-50/50"
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
                className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                checked={isAllPageSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-bold last:border-r-0">
              {t("job")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-bold last:border-r-0">
              {t("locationAndType")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-bold last:border-r-0">
              {t("status")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-right font-bold last:border-r-0">
              {t("applicants")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-bold last:border-r-0">
              {t("postedDate")}
            </th>
            <th className="px-4 py-3 text-right font-bold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <MagnifyingGlass size={32} />
                  <p>Không tìm thấy tin đăng nào phù hợp</p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedData.map((job) => {
              const tone =
                job.status === "Đang hiển thị"
                  ? "success"
                  : job.status === "Chờ duyệt"
                    ? "warning"
                    : job.status === "Hết hạn"
                      ? "neutral"
                      : "error";

              const statusKey =
                job.status === "Đang hiển thị"
                  ? "active"
                  : job.status === "Chờ duyệt"
                    ? "pending"
                    : job.status === "Hết hạn"
                      ? "expired"
                      : "rejected";

              const typeKey =
                job.type === "Toàn thời gian"
                  ? "fullTime"
                  : job.type === "Bán thời gian"
                    ? "partTime"
                    : job.type === "Thực tập"
                      ? "internship"
                      : "other";

              return (
                <tr
                  key={job.id}
                  className={cn(
                    "border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30",
                    selectedIds.includes(job.id) && "bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <td className="w-12 border-r border-slate-200 px-4 py-3 text-center last:border-r-0">
                    <input
                      type="checkbox"
                      className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                      checked={selectedIds.includes(job.id)}
                      onChange={(e) => handleSelectOne(job.id, e.target.checked)}
                    />
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                    <div>
                      <p className="text-foreground font-bold">{job.title}</p>
                      <p className="text-muted-foreground text-xs">{job.employer}</p>
                    </div>
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                    <div>
                      <p className="font-medium">{job.location}</p>
                      <p className="text-muted-foreground text-xs">{t(`typeOptions.${typeKey}`)}</p>
                    </div>
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                    <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 text-right font-medium last:border-r-0">
                    {job.applicants}
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                    {job.postedDate}
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
                          onClick={() => router.push(`/admin/content/jobs/${job.id}`)}
                        >
                          {t("actionOptions.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          disabled={!job.companyId}
                          onClick={() =>
                            job.companyId && router.push(`/admin/users/employers/${job.companyId}`)
                          }
                        >
                          {t("actionOptions.goToCompany")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === "Chờ duyệt" && (
                          <>
                            <DropdownMenuItem className="text-success">
                              {t("actionOptions.approve")}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-error">
                              {t("actionOptions.reject")}
                            </DropdownMenuItem>
                          </>
                        )}
                        {job.status === "Đang hiển thị" && (
                          <DropdownMenuItem className="text-error">
                            {t("actionOptions.remove")}
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
      </RecruiterTableLayout>
    </div>
  );
}
