"use client";

import { DotsThree, MagnifyingGlass } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { getAdminJobPosts, type AdminJobPostResponse } from "@/features/admin/api/job-posts";
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

export type AdminJobPost = {
  id: string;
  title: string;
  employer: string;
  location: string;
  type: string;
  status: "Đang hiển thị" | "Chờ duyệt" | "Hết hạn" | "Đã từ chối";
  postedDate: string;
  applicants: number;
};

function mapToAdminJobPost(apiPost: AdminJobPostResponse): AdminJobPost {
  // Determine status mapping based on typical combinations of status & moderationStatus
  let mappedStatus: AdminJobPost["status"] = "Đang hiển thị";
  if (apiPost.moderationStatus === "PENDING" || apiPost.status === "DRAFT") {
    mappedStatus = "Chờ duyệt";
  } else if (apiPost.moderationStatus === "REJECTED") {
    mappedStatus = "Đã từ chối";
  } else if (apiPost.status === "CLOSED" || apiPost.status === "ARCHIVED") {
    mappedStatus = "Hết hạn";
  }

  // Handle employment types mapped from strings
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

export const getColumns = (t: any): ColumnDef<AdminJobPost>[] => [
  {
    accessorKey: "title",
    header: t("job"),
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.title}</p>
        <p className="text-muted-foreground text-xs">{row.original.employer}</p>
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: t("locationAndType"),
    cell: ({ row }) => {
      const type = row.original.type as string;
      const typeKey =
        type === "Toàn thời gian"
          ? "fullTime"
          : type === "Bán thời gian"
            ? "partTime"
            : type === "Thực tập"
              ? "internship"
              : "other";

      return (
        <div>
          <p className="font-medium">{row.original.location}</p>
          <p className="text-muted-foreground text-xs">{t(`typeOptions.${typeKey}`)}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đang hiển thị"
          ? "success"
          : status === "Chờ duyệt"
            ? "warning"
            : status === "Hết hạn"
              ? "neutral"
              : "error";

      const statusKey =
        status === "Đang hiển thị"
          ? "active"
          : status === "Chờ duyệt"
            ? "pending"
            : status === "Hết hạn"
              ? "expired"
              : "rejected";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "applicants",
    header: () => <div className="text-right">{t("applicants")}</div>,
    cell: ({ row }) => {
      return <div className="text-right font-medium">{row.getValue("applicants")}</div>;
    },
  },
  {
    accessorKey: "postedDate",
    header: t("postedDate"),
    cell: ({ row }) => <div>{row.original.postedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
    cell: ({ row }) => {
      const job = row.original;

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
              <DropdownMenuItem>{t("actionOptions.goToCompany")}</DropdownMenuItem>
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
        </div>
      );
    },
  },
];

export function JobPostsTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const t = useTranslations("Admin.content.jobs.table");
  const router = useRouter();

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
            <SelectItem value="Đang hiển thị">{t("statusOptions.active")}</SelectItem>
            <SelectItem value="Chờ duyệt">{t("statusOptions.pending")}</SelectItem>
            <SelectItem value="Hết hạn">{t("statusOptions.expired")}</SelectItem>
            <SelectItem value="Đã từ chối">{t("statusOptions.rejected")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
