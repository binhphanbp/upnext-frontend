"use client";

import { ArrowsCounterClockwise, DotsThree, MagnifyingGlass } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import Swal from "sweetalert2";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

import {
  type AdminReportResponse,
  type AdminReportStatus,
  getAdminReports,
  updateAdminReportStatus,
} from "@/features/admin/api/reports";
import { AdminTableLayout } from "@/features/admin/components/admin-table-layout";
import { getAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
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

export function ModerationTable() {
  const t = useTranslations("Admin.content.moderation.table");
  const queryClient = useQueryClient();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [reporterFilter, setReporterFilter] = React.useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, reporterFilter, targetTypeFilter, debouncedQuery, pageSize]);

  const { data, isLoading, isError, refetch } = useQuery({
    // Every filter is applied server-side, so all of them belong in the key.
    queryKey: [
      "adminReports",
      currentPage,
      pageSize,
      statusFilter,
      reporterFilter,
      targetTypeFilter,
      debouncedQuery,
    ],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminReports(session.accessToken, {
        page: currentPage,
        limit: pageSize,
        q: debouncedQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        reporterRole: reporterFilter !== "all" ? reporterFilter : undefined,
        targetType: targetTypeFilter !== "all" ? targetTypeFilter : undefined,
      });
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminReportStatus }) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return updateAdminReportStatus(session.accessToken, id, { status });
    },
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      const statusTrans = updatedReport.status === "RESOLVED" ? "Đã giải quyết" : "Từ chối";
      void toast.fire({
        icon: "success",
        title: `Đã cập nhật trạng thái báo cáo thành: ${statusTrans}`,
      });
    },
    onError: () => {
      void toast.fire({ icon: "error", title: "Có lỗi xảy ra khi cập nhật trạng thái" });
    },
  });

  const handleStatusChange = (
    id: string,
    status: AdminReportStatus,
    targetType?: AdminReportResponse["targetType"],
  ) => {
    const hidesReview = targetType === "COMPANY_REVIEW" && status === "RESOLVED";
    Swal.fire({
      title: "Xác nhận cập nhật",
      text: hidesReview
        ? "Đánh giá này sẽ bị ẩn khỏi trang công ty. Bạn có chắc không?"
        : `Bạn có chắc muốn ${status === "RESOLVED" ? "Đánh dấu giải quyết" : "Từ chối"} báo cáo này?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        updateStatus({ id, status });
      }
    });
  };

  const handleRefresh = () => {
    void refetch();
    toast.fire({ icon: "success", title: "Đã làm mới dữ liệu" });
  };

  const items = data?.items || [];
  const totalItems = data?.meta?.total || 0;

  const isAllPageSelected =
    items.length > 0 && items.every((report) => selectedIds.includes(report.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = items.map((report) => report.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = items.map((report) => report.id);
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

  // Keyed off the values the backend actually writes. `COMPANY` used to be labelled
  // "Review công ty" and `POST` fell through to "Tin tuyển dụng" — both were wrong, and
  // COMPANY_REVIEW now needs that label for itself.
  const TARGET_TYPE_KEYS: Record<string, string> = {
    JOB_POST: "job",
    COMPANY: "company",
    COMPANY_REVIEW: "companyReview",
    CANDIDATE: "profile",
    POST: "post",
  };

  const getTypeLabel = (type: string) => {
    const typeKey = TARGET_TYPE_KEYS[type.toUpperCase()];
    return typeKey ? t(`contentTypeOptions.${typeKey}`) : type;
  };

  /** Bug fix: the old code read a `reporter` field the API never returns. */
  const getReporterLabel = (report: AdminReportResponse) => {
    if (report.reporterType === "RECRUITER") {
      return report.reporterRecruiterAccount?.email ?? t("anonymous");
    }
    return (
      report.reporterCandidate?.account?.fullName ??
      report.reporterCandidate?.account?.email ??
      t("anonymous")
    );
  };

  /** Bug fix: the old code read `targetName`, so every row showed a raw UUID. */
  const getTargetLabel = (report: AdminReportResponse) => {
    const details = report.targetDetails;
    if (!details) return report.targetId;

    if (report.targetType === "COMPANY_REVIEW") {
      const rating = details.overallRating ? `${details.overallRating}★` : "";
      const company = details.company?.name ?? "";
      return [company, rating, details.summary].filter(Boolean).join(" — ") || report.targetId;
    }

    return details.name ?? details.title ?? details.account?.fullName ?? report.targetId;
  };

  const getReasonLabel = (reason?: string) => {
    if (!reason) return t("unknownReason") || "Không rõ lý do";

    const lower = reason.toLowerCase();
    if (lower.includes("plagiarized directly") || lower.includes("plagiarized")) {
      return "Bài viết sao chép vi phạm bản quyền";
    }
    if (lower.includes("inappropriate language") && lower.includes("fake certificate")) {
      return "Hồ sơ chứa chứng chỉ giả mạo và từ ngữ không phù hợp";
    }
    if (lower.includes("misleading salary") || lower.includes("scam link")) {
      return "Tin đăng chứa thông tin lương sai lệch và link lừa đảo";
    }
    if (lower.includes("inappropriate language")) {
      return "Ngôn từ thô tục, không phù hợp chuẩn mực";
    }
    if (lower.includes("fake certificate") || lower.includes("fake info")) {
      return "Thông tin giả mạo hoặc sai sự thật";
    }

    let reasonKey = "unknown";
    const normalizedReason = reason.toUpperCase();

    if (normalizedReason.includes("SPAM")) reasonKey = "spam";
    else if (normalizedReason.includes("HATE")) reasonKey = "hateSpeech";
    else if (normalizedReason.includes("FAKE_INFO")) reasonKey = "fakeInfo";
    else if (normalizedReason.includes("LINK")) reasonKey = "suspiciousLink";
    else if (normalizedReason.includes("FEE")) reasonKey = "feeRequired";
    else if (normalizedReason.includes("GAMBLING")) reasonKey = "gambling";
    else if (normalizedReason.includes("AVATAR")) reasonKey = "inappropriateAvatar";
    else if (normalizedReason.includes("DEFAMATION")) reasonKey = "defamation";
    else if (normalizedReason.includes("FAKE_JOB")) reasonKey = "fakeJob";
    else if (normalizedReason.includes("PROFANITY")) reasonKey = "profanity";
    else if (normalizedReason.includes("FAKE_REVIEW")) reasonKey = "fakeReview";
    else if (normalizedReason.includes("NAME")) reasonKey = "invalidName";

    const translatedReason = t(`reasonOptions.${reasonKey}`);
    return reasonKey === "unknown" && reason ? reason : translatedReason;
  };

  React.useEffect(() => {
    if (isError) {
      void toast.fire({ icon: "error", title: "Có lỗi xảy ra khi tải danh sách báo cáo" });
    }
  }, [isError]);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full rounded-xl sm:w-[350px]" />
          <Skeleton className="h-10 w-full rounded-xl sm:w-[210px]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

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
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-[240px] lg:w-[260px]">
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
              <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[155px]">
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="PENDING">{t("statusOptions.pending")}</SelectItem>
                <SelectItem value="REVIEWING">{t("statusOptions.reviewing")}</SelectItem>
                <SelectItem value="RESOLVED">{t("statusOptions.resolved")}</SelectItem>
                <SelectItem value="REJECTED">{t("statusOptions.dismissed")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reporterFilter} onValueChange={setReporterFilter}>
              <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[160px]">
                <SelectValue placeholder={t("allReporters")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allReporters")}</SelectItem>
                <SelectItem value="CANDIDATE">{t("reporterOptions.candidate")}</SelectItem>
                <SelectItem value="RECRUITER">{t("reporterOptions.recruiter")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
              <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[165px]">
                <SelectValue placeholder={t("allContentTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allContentTypes")}</SelectItem>
                <SelectItem value="COMPANY">{t("contentTypeOptions.company")}</SelectItem>
                <SelectItem value="JOB_POST">{t("contentTypeOptions.job")}</SelectItem>
                <SelectItem value="COMPANY_REVIEW">
                  {t("contentTypeOptions.companyReview")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        actionBar={
          <div className="flex shrink-0 items-center gap-2">
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
          </div>
        }
      >
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
            <th className="w-12 px-4 py-3.5 text-center">
              <input
                type="checkbox"
                aria-label="Chọn tất cả"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                checked={isAllPageSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
              {t("contentType")}
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
              {t("reporter")}
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
              {t("reason")}
            </th>
            <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
              {t("status")}
            </th>
            <th className="px-4 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
              {t("reportedDate")}
            </th>
            <th className="px-4 py-3.5 text-right text-xs font-bold tracking-wider text-slate-600 uppercase">
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                Không tìm thấy báo cáo nào phù hợp.
              </td>
            </tr>
          ) : (
            items.map((report) => {
              const isSelected = selectedIds.includes(report.id);
              const targetName = getTargetLabel(report);
              const reporter = getReporterLabel(report);
              const isReviewReport = report.targetType === "COMPANY_REVIEW";

              const tone =
                report.status === "RESOLVED"
                  ? "success"
                  : report.status === "PENDING"
                    ? "warning"
                    : report.status === "REVIEWING"
                      ? "info"
                      : "neutral";

              const statusKey =
                report.status === "RESOLVED"
                  ? "resolved"
                  : report.status === "PENDING"
                    ? "pending"
                    : report.status === "REVIEWING"
                      ? "reviewing"
                      : "dismissed";

              return (
                <tr
                  key={report.id}
                  className={`transition-colors hover:bg-slate-50/80 ${isSelected ? "bg-emerald-50/30" : ""}`}
                >
                  <td className="px-4 py-3.5 text-center align-middle">
                    <input
                      type="checkbox"
                      aria-label={`Chọn báo cáo ${getTypeLabel(report.targetType)}`}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(report.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {getTypeLabel(report.targetType)}
                      </span>
                      <span
                        className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500"
                        title={targetName}
                      >
                        {targetName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{reporter}</td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <span
                      className="inline-block max-w-[280px] truncate lg:max-w-[340px]"
                      title={getReasonLabel(report.reason)}
                    >
                      {getReasonLabel(report.reason)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {report.createdAt ? formatAppDate(report.createdAt) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                        >
                          <span className="sr-only">Mở menu thao tác</span>
                          <DotsThree size={20} weight="bold" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/content/moderation/${report.id}`)}
                        >
                          {t("actionOptions.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {report.status === "PENDING" && (
                          <>
                            <DropdownMenuItem
                              className={
                                isReviewReport
                                  ? "text-error cursor-pointer"
                                  : "text-success cursor-pointer"
                              }
                              onClick={() =>
                                handleStatusChange(report.id, "RESOLVED", report.targetType)
                              }
                            >
                              {/* Resolving a review report hides the review, so say that. */}
                              {isReviewReport
                                ? t("actionOptions.hideReview")
                                : t("actionOptions.resolve")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-error cursor-pointer"
                              onClick={() => handleStatusChange(report.id, "REJECTED")}
                            >
                              {t("actionOptions.dismiss")}
                            </DropdownMenuItem>
                          </>
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
