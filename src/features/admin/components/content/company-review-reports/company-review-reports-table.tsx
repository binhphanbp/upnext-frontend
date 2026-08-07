"use client";

import { ArrowsCounterClockwise, DotsThree } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import Swal from "sweetalert2";

import {
  dismissCompanyReviewReport,
  getAdminCompanyReviewReports,
  hideReportedCompanyReview,
  type AdminCompanyReviewReportStatus,
} from "@/features/admin/api/company-review-reports";
import { AdminTableLayout } from "@/features/admin/components/admin-table-layout";
import { getAdminSession } from "@/features/admin/session";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const STATUS_LABEL: Record<AdminCompanyReviewReportStatus, string> = {
  PENDING: "Chờ xử lý",
  REVIEWING: "Đang xem xét",
  RESOLVED: "Đã ẩn đánh giá",
  REJECTED: "Đã bỏ qua",
};

const STATUS_TONE: Record<
  AdminCompanyReviewReportStatus,
  "warning" | "neutral" | "error" | "success"
> = {
  PENDING: "warning",
  REVIEWING: "neutral",
  RESOLVED: "success",
  REJECTED: "error",
};

export function CompanyReviewReportsTable() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageSize]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminCompanyReviewReports", currentPage, pageSize, statusFilter],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminCompanyReviewReports(session.accessToken, {
        page: currentPage,
        limit: pageSize,
        status:
          statusFilter !== "all" ? (statusFilter as AdminCompanyReviewReportStatus) : undefined,
      });
    },
  });

  const { mutate: hideReview } = useMutation({
    mutationFn: async (reportId: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return hideReportedCompanyReview(session.accessToken, reportId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCompanyReviewReports"] });
      void toast.fire({ icon: "success", title: "Đã ẩn đánh giá bị báo cáo" });
    },
    onError: () => {
      void toast.fire({ icon: "error", title: "Có lỗi xảy ra khi ẩn đánh giá" });
    },
  });

  const { mutate: dismissReport } = useMutation({
    mutationFn: async (reportId: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return dismissCompanyReviewReport(session.accessToken, reportId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminCompanyReviewReports"] });
      void toast.fire({ icon: "success", title: "Đã bỏ qua báo cáo" });
    },
    onError: () => {
      void toast.fire({ icon: "error", title: "Có lỗi xảy ra khi bỏ qua báo cáo" });
    },
  });

  function confirmHide(reportId: string) {
    void Swal.fire({
      title: "Ẩn đánh giá này?",
      text: "Đánh giá sẽ không còn hiển thị công khai trên trang công ty.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ẩn đánh giá",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) hideReview(reportId);
    });
  }

  function confirmDismiss(reportId: string) {
    void Swal.fire({
      title: "Bỏ qua báo cáo này?",
      text: "Đánh giá sẽ tiếp tục hiển thị công khai.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Bỏ qua",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) dismissReport(reportId);
    });
  }

  React.useEffect(() => {
    if (isError)
      void toast.fire({ icon: "error", title: "Có lỗi xảy ra khi tải danh sách báo cáo" });
  }, [isError]);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <Skeleton className="h-10 w-full rounded-xl sm:w-[220px]" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const totalItems = data?.total ?? 0;

  return (
    <div className="mt-6">
      <AdminTableLayout
        loading={isLoading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        filterBar={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[200px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ xử lý</SelectItem>
              <SelectItem value="RESOLVED">Đã ẩn đánh giá</SelectItem>
              <SelectItem value="REJECTED">Đã bỏ qua</SelectItem>
            </SelectContent>
          </Select>
        }
        actionBar={
          <Button
            variant="outline"
            size="icon"
            className="flex h-10 w-10 items-center justify-center rounded-full border-slate-200 p-0 text-slate-600 shadow-none hover:bg-slate-50"
            onClick={() => void refetch()}
            aria-label="Làm mới"
          >
            <ArrowsCounterClockwise size={18} />
          </Button>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 !bg-[#bfe9d6] text-slate-900">
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold last:border-r-0">
              Công ty
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold last:border-r-0">
              Đánh giá bị báo cáo
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold last:border-r-0">
              Lý do báo cáo
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold last:border-r-0">
              Người báo cáo
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-center font-semibold last:border-r-0">
              Trạng thái
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold last:border-r-0">
              Ngày báo cáo
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-right font-semibold last:border-r-0">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                Không có báo cáo nào phù hợp.
              </td>
            </tr>
          ) : (
            items.map((report) => (
              <tr key={report.id} className="transition-colors hover:bg-slate-50">
                <td className="border-r border-slate-200 px-4 py-3 font-semibold text-slate-900">
                  {report.companyReview.company.name}
                </td>
                <td className="border-r border-slate-200 px-4 py-3">
                  <span
                    className="inline-block max-w-[240px] truncate"
                    title={report.companyReview.summary ?? ""}
                  >
                    {report.companyReview.overallRating}★ —{" "}
                    {report.companyReview.summary || "(không có nhận xét)"}
                  </span>
                </td>
                <td className="border-r border-slate-200 px-4 py-3">
                  <span className="inline-block max-w-[220px] truncate" title={report.reason}>
                    {report.reason}
                  </span>
                </td>
                <td className="border-r border-slate-200 px-4 py-3">
                  {report.reporterRecruiterAccount.email}
                </td>
                <td className="border-r border-slate-200 px-4 py-3 text-center">
                  <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status]}</Badge>
                </td>
                <td className="border-r border-slate-200 px-4 py-3">
                  {formatAppDate(report.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {report.status === "PENDING" || report.status === "REVIEWING" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Mở menu thao tác</span>
                          <DotsThree size={20} weight="bold" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="text-error cursor-pointer"
                          onClick={() => confirmHide(report.id)}
                        >
                          Ẩn đánh giá
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => confirmDismiss(report.id)}
                        >
                          Bỏ qua báo cáo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-slate-400">Đã xử lý</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTableLayout>
    </div>
  );
}
