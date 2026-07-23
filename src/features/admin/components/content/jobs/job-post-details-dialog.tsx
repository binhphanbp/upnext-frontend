"use client";

import {
  BuildingOffice,
  MapPin,
  Money,
  Briefcase,
  CalendarBlank,
  Users,
} from "@phosphor-icons/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import Swal from "sweetalert2";

import { getJobPostDetails, rejectJobPost, approveJobPost } from "@/features/admin/api/job-posts";
import { getAdminSession, clearAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

function getCleanHtml(html: string | null | undefined) {
  if (!html) return "";
  let cleaned = html.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, "");
  cleaned = cleaned.replace(/<details[^>]*>/gi, "").replace(/<\/details>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Mô tả công việc\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Yêu cầu ứng viên\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Quyền lợi\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Mô tả công việc\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Yêu cầu ứng viên\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Quyền lợi\s*<\/p>/gi, "");
  return cleaned.trim();
}

export function JobPostDetailsDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Admin.content.jobs.details");
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: jobPost,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminJobPost", id],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) {
        throw new Error("No session");
      }
      return getJobPostDetails(session.accessToken, id!);
    },
    enabled: !!id && open,
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

  const { mutate: rejectPost, isPending: isRejecting } = useMutation({
    mutationFn: async (reason: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return rejectJobPost(session.accessToken, id!, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminJobPost", id] });
      queryClient.invalidateQueries({ queryKey: ["adminJobPosts"] });
      void toast.fire({
        icon: "success",
        title: "Đã từ chối tin đăng thành công",
      });
      onOpenChange(false);
    },
    onError: () => {
      void toast.fire({ icon: "error", title: "Có lỗi xảy ra khi từ chối tin đăng" });
    },
  });

  const { mutate: approvePost, isPending: isApproving } = useMutation({
    mutationFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return approveJobPost(session.accessToken, id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminJobPost", id] });
      queryClient.invalidateQueries({ queryKey: ["adminJobPosts"] });
      void toast.fire({
        icon: "success",
        title: "Đã duyệt tin đăng thành công",
      });
      onOpenChange(false);
    },
    onError: () => {
      void toast.fire({ icon: "error", title: "Có lỗi xảy ra khi duyệt tin đăng" });
    },
  });

  const handleApprove = () => {
    Swal.fire({
      title: "Duyệt tin đăng",
      text: "Bạn có chắc muốn duyệt tin đăng này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Duyệt",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        approvePost();
      }
    });
  };

  const handleReject = () => {
    Swal.fire({
      title: "Từ chối tin đăng",
      text: "Vui lòng nhập lý do từ chối (bắt buộc):",
      input: "textarea",
      inputPlaceholder: "Nhập lý do...",
      inputAttributes: {
        "aria-label": "Nhập lý do từ chối",
      },
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      preConfirm: (reason) => {
        if (!reason || reason.trim() === "") {
          Swal.showValidationMessage("Bạn phải nhập lý do từ chối");
        }
        return reason;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        rejectPost(result.value);
      }
    });
  };

  if (!id) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogTitle className="sr-only">Chi tiết tin tuyển dụng</DialogTitle>
        <DialogDescription className="sr-only">
          Thông tin chi tiết và hành động kiểm duyệt
        </DialogDescription>

        {isLoading ? (
          <div className="space-y-6 pt-4">
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
        ) : error || !jobPost ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-xl font-bold">Không tìm thấy tin đăng</h2>
            <p className="text-muted-foreground">
              Tin đăng này có thể đã bị xóa hoặc bạn không có quyền truy cập.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Đóng
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {/* Header Info */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <CardTitle className="text-2xl font-bold">{jobPost.title}</CardTitle>
                        <div className="text-muted-foreground mt-2 flex items-center gap-2">
                          <BuildingOffice size={18} />
                          <span className="font-medium">
                            {jobPost.company?.name || "Chưa cập nhật"}
                          </span>
                        </div>
                      </div>
                      <Badge
                        tone={
                          jobPost.moderationStatus === "REJECTED"
                            ? "error"
                            : jobPost.status === "CLOSED" || jobPost.status === "ARCHIVED"
                              ? "neutral"
                              : jobPost.moderationStatus === "PENDING"
                                ? "warning"
                                : "success"
                        }
                        className="w-fit text-sm"
                      >
                        {jobPost.moderationStatus === "REJECTED"
                          ? "Đã từ chối"
                          : jobPost.status === "CLOSED" || jobPost.status === "ARCHIVED"
                            ? "Hết hạn"
                            : jobPost.moderationStatus === "PENDING"
                              ? "Chờ duyệt"
                              : "Đang hiển thị"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <MapPin size={18} className="text-slate-400" />
                        {jobPost.jobPostLocations?.[0]?.jobLocation?.city ||
                          jobPost.location ||
                          "Chưa cập nhật"}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <Money size={18} className="text-slate-400" />
                        {jobPost.salary || "Thỏa thuận"}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <Briefcase size={18} className="text-slate-400" />
                        {(() => {
                          const rawType = jobPost.employmentType?.name || jobPost.type || "";
                          if (
                            rawType.includes("Toàn thời gian") ||
                            rawType.toLowerCase().includes("full")
                          )
                            return "Toàn thời gian";
                          if (
                            rawType.includes("Bán thời gian") ||
                            rawType.toLowerCase().includes("part")
                          )
                            return "Bán thời gian";
                          if (
                            rawType.includes("Thực tập") ||
                            rawType.toLowerCase().includes("intern")
                          )
                            return "Thực tập";
                          return "Khác";
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {jobPost.moderationStatus === "REJECTED" && (
                  <Card className="border-error bg-error/5">
                    <CardContent className="pt-6">
                      <h3 className="text-error-foreground mb-2 font-bold">Lý do từ chối</h3>
                      <p className="text-error-foreground/90 text-sm">
                        {jobPost.reason || jobPost.moderationNote || "Không có lý do cụ thể."}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Details */}
                <Card>
                  <CardContent className="space-y-8 pt-6">
                    <div>
                      <h3 className="mb-3 text-lg font-bold">{t("description")}</h3>
                      <div
                        className="prose prose-sm max-w-none text-slate-600"
                        dangerouslySetInnerHTML={{
                          __html:
                            getCleanHtml(jobPost.description) || "<p>Chưa có mô tả chi tiết.</p>",
                        }}
                      />
                    </div>

                    {jobPost.requirements && (
                      <div>
                        <h3 className="mb-3 text-lg font-bold">{t("requirements")}</h3>
                        <div
                          className="prose prose-sm max-w-none text-slate-600"
                          dangerouslySetInnerHTML={{ __html: getCleanHtml(jobPost.requirements) }}
                        />
                      </div>
                    )}

                    {jobPost.benefits && (
                      <div>
                        <h3 className="mb-3 text-lg font-bold">{t("benefits")}</h3>
                        <div
                          className="prose prose-sm max-w-none text-slate-600"
                          dangerouslySetInnerHTML={{ __html: getCleanHtml(jobPost.benefits) }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Thông tin quản lý</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <CalendarBlank size={18} />
                        <span className="text-sm">{t("postedDate")}</span>
                      </div>
                      <span className="font-medium">
                        {jobPost.publishedAt
                          ? formatAppDate(jobPost.publishedAt)
                          : formatAppDate(jobPost.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Users size={18} />
                        <span className="text-sm">{t("applicants")}</span>
                      </div>
                      <span className="font-medium">
                        {jobPost._count?.applications || jobPost.applicants || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {jobPost.moderationStatus === "PENDING" && (
                  <Card className="border-warning bg-warning/5">
                    <CardContent className="space-y-3 pt-6">
                      <h3 className="text-warning-foreground font-bold">Hành động kiểm duyệt</h3>
                      <p className="text-warning-foreground/80 text-sm">
                        Tin đăng này đang chờ quản trị viên phê duyệt để được hiển thị công khai
                        trên nền tảng.
                      </p>
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          className="bg-success hover:bg-success/90 w-full cursor-pointer text-white"
                          onClick={handleApprove}
                          disabled={isApproving}
                        >
                          {t("approve")}
                        </Button>
                        <Button
                          variant="outline"
                          className="text-error hover:bg-error/10 hover:text-error w-full cursor-pointer"
                          onClick={handleReject}
                          disabled={isRejecting}
                        >
                          {t("reject")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
