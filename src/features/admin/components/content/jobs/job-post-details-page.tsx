"use client";

import {
  ArrowLeft,
  BuildingOffice,
  MapPin,
  Money,
  Briefcase,
  CalendarBlank,
  Users,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";

import { getJobPostDetails } from "@/features/admin/api/job-posts";
import { getAdminSession, clearAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function JobPostDetailsPage({ id }: { id: string }) {
  const t = useTranslations("Admin.content.jobs.details");
  const router = useRouter();

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
      return getJobPostDetails(session.accessToken, id);
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
      } else if (error instanceof ApiError && error.status === 404) {
        // Not found
      }
    }
  }, [error, router]);

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

  if (error || !jobPost) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold">Không tìm thấy tin đăng</h2>
        <p className="text-muted-foreground">
          Tin đăng này có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Button onClick={() => router.push("/admin/content/jobs")} variant="outline">
          {t("back")}
        </Button>
      </div>
    );
  }

  let mappedStatus = "Đang hiển thị";
  let tone: "success" | "warning" | "neutral" | "error" = "success";
  if (jobPost.moderationStatus === "PENDING" || jobPost.status === "DRAFT") {
    mappedStatus = "Chờ duyệt";
    tone = "warning";
  } else if (jobPost.moderationStatus === "REJECTED") {
    mappedStatus = "Đã từ chối";
    tone = "error";
  } else if (jobPost.status === "CLOSED" || jobPost.status === "ARCHIVED") {
    mappedStatus = "Hết hạn";
    tone = "neutral";
  }

  let mappedType = "Khác";
  const rawType = jobPost.employmentType?.name || jobPost.type || "";
  if (rawType.includes("Toàn thời gian") || rawType.toLowerCase().includes("full"))
    mappedType = "Toàn thời gian";
  else if (rawType.includes("Bán thời gian") || rawType.toLowerCase().includes("part"))
    mappedType = "Bán thời gian";
  else if (rawType.includes("Thực tập") || rawType.toLowerCase().includes("intern"))
    mappedType = "Thực tập";

  const location =
    jobPost.jobPostLocations?.[0]?.jobLocation?.city || jobPost.location || "Chưa cập nhật";
  const postedDate = jobPost.publishedAt
    ? formatAppDate(jobPost.publishedAt)
    : formatAppDate(jobPost.createdAt);
  const salary = jobPost.salary || "Thỏa thuận";

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-foreground -ml-4"
        onClick={() => router.push("/admin/content/jobs")}
      >
        <ArrowLeft className="mr-2" size={16} />
        {t("back")}
      </Button>

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
                    <span className="font-medium">{jobPost.company?.name || "Chưa cập nhật"}</span>
                  </div>
                </div>
                <Badge tone={tone} className="w-fit text-sm">
                  {mappedStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <MapPin size={18} className="text-slate-400" />
                  {location}
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <Money size={18} className="text-slate-400" />
                  {salary}
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <Briefcase size={18} className="text-slate-400" />
                  {mappedType}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="space-y-8 pt-6">
              <div>
                <h3 className="mb-3 text-lg font-bold">{t("description")}</h3>
                <div
                  className="prose prose-sm max-w-none text-slate-600"
                  dangerouslySetInnerHTML={{
                    __html: jobPost.description || "<p>Chưa có mô tả chi tiết.</p>",
                  }}
                />
              </div>

              {jobPost.requirements && (
                <div>
                  <h3 className="mb-3 text-lg font-bold">{t("requirements")}</h3>
                  <div
                    className="prose prose-sm max-w-none text-slate-600"
                    dangerouslySetInnerHTML={{ __html: jobPost.requirements }}
                  />
                </div>
              )}

              {jobPost.benefits && (
                <div>
                  <h3 className="mb-3 text-lg font-bold">{t("benefits")}</h3>
                  <div
                    className="prose prose-sm max-w-none text-slate-600"
                    dangerouslySetInnerHTML={{ __html: jobPost.benefits }}
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
                <span className="font-medium">{postedDate}</span>
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

          {mappedStatus === "Chờ duyệt" && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="space-y-3 pt-6">
                <h3 className="text-warning-foreground font-bold">Hành động kiểm duyệt</h3>
                <p className="text-warning-foreground/80 text-sm">
                  Tin đăng này đang chờ quản trị viên phê duyệt để được hiển thị công khai trên nền
                  tảng.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button className="bg-success hover:bg-success/90 w-full text-white">
                    {t("approve")}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-error hover:bg-error/10 hover:text-error w-full"
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
  );
}
