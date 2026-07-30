"use client";

import {
  ArrowLeft,
  CalendarBlank,
  Flag,
  User,
  FileText,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import Swal from "sweetalert2";

import {
  type AdminReportStatus,
  getAdminReportDetails,
  updateAdminReportStatus,
} from "@/features/admin/api/reports";
import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export function ReportDetailsPage({ id }: { id: string }) {
  const t = useTranslations("Admin.content.moderation.details");
  const tTable = useTranslations("Admin.content.moderation.table");
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminReport", id],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) {
        throw new Error("No session");
      }
      return getAdminReportDetails(session.accessToken, id);
    },
    retry: false,
  });

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async (status: AdminReportStatus) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return updateAdminReportStatus(session.accessToken, id, { status });
    },
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ["adminReport", id] });
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

  const handleStatusChange = (status: AdminReportStatus) => {
    Swal.fire({
      title: "Xác nhận cập nhật",
      text: `Bạn có chắc muốn ${status === "RESOLVED" ? "Đánh dấu giải quyết" : "Từ chối"} báo cáo này?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        updateStatus(status);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold">{t("notFound")}</h2>
        <p className="text-muted-foreground">{t("notFoundDesc")}</p>
        <Button onClick={() => router.push("/admin/content/moderation")} variant="outline">
          {t("back")}
        </Button>
      </div>
    );
  }

  const tone =
    report.status === "RESOLVED"
      ? "success"
      : report.status === "PENDING"
        ? "warning"
        : report.status === "REVIEWING"
          ? "neutral"
          : "error";

  const statusKey =
    report.status === "RESOLVED"
      ? "resolved"
      : report.status === "PENDING"
        ? "pending"
        : report.status === "REVIEWING"
          ? "reviewing"
          : "dismissed";

  const reporterName =
    report.reporter?.profile?.fullName || report.reporter?.email || tTable("anonymous");
  const targetName = report.targetName || report.targetId;
  const reportedDate = report.createdAt ? formatAppDate(report.createdAt) : "—";

  const getTypeLabel = (type: string) => {
    const typeKey =
      type === "JOB_POST"
        ? "job"
        : type === "COMMENT"
          ? "comment"
          : type === "COMPANY"
            ? "review"
            : type === "CANDIDATE" || type === "USER"
              ? "profile"
              : "job";
    return tTable(`contentTypeOptions.${typeKey}`);
  };

  const getReasonLabel = (reason?: string) => {
    let reasonKey = "unknown";
    const normalizedReason = reason?.toUpperCase() || "";

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

    const translatedReason = tTable(`reasonOptions.${reasonKey}`);
    return reasonKey === "unknown" && reason ? reason : translatedReason;
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-foreground -ml-4"
        onClick={() => router.push("/admin/content/moderation")}
      >
        <ArrowLeft className="mr-2" size={16} />
        {t("back")}
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Header & Main Info */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone="neutral" className="bg-slate-50 font-medium text-slate-600">
                      {getTypeLabel(report.targetType)}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl leading-relaxed font-bold">
                    {getReasonLabel(report.reason)}
                  </CardTitle>
                </div>
                <Badge tone={tone} className="shrink-0 text-sm">
                  {tTable(`statusOptions.${statusKey}`)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Target Info */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <FileText size={18} className="text-primary" />
                  {t("targetInfo")}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      {t("targetName")}
                    </span>
                    <span className="line-clamp-2 font-medium text-slate-900" title={targetName}>
                      {targetName}
                    </span>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      {t("targetId")}
                    </span>
                    <span className="font-mono text-sm break-all text-slate-600">
                      {report.targetId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description Info */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <Flag size={18} className="text-error" />
                  {t("description")}
                </h3>
                <div className="min-h-[100px] rounded-xl border border-slate-200 bg-white p-4 whitespace-pre-wrap text-slate-700">
                  {report.description || (
                    <span className="text-slate-400 italic">{t("noDescription")}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">{t("stats")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="text-muted-foreground flex items-center gap-2">
                  <CalendarBlank size={18} />
                  <span className="text-sm">{t("reportedAt")}</span>
                </div>
                <span className="font-medium">{reportedDate}</span>
              </div>
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="text-muted-foreground flex items-center gap-2">
                  <User size={18} />
                  <span className="text-sm">{t("reporterInfo")}</span>
                </div>
                <span className="text-right font-medium break-all">{reporterName}</span>
              </div>
            </CardContent>
          </Card>

          {report.status === "PENDING" && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="space-y-3 pt-6">
                <h3 className="text-warning-foreground font-bold">{t("moderationActions")}</h3>
                <p className="text-warning-foreground/80 text-sm">{t("moderationDesc")}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    className="bg-success hover:bg-success/90 w-full text-white"
                    onClick={() => handleStatusChange("RESOLVED")}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="mr-2" size={18} />
                    {t("resolve")}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-error hover:bg-error/10 hover:text-error border-error/20 w-full"
                    onClick={() => handleStatusChange("REJECTED")}
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-2" size={18} />
                    {t("reject")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
