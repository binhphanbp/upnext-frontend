"use client";

import { ArrowLeft, CalendarBlank, Eye, User, Tag } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { getAdminPostDetails } from "@/features/admin/api/posts";
import { getAdminSession, clearAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function ArticleDetailsPage({ id }: { id: string }) {
  const router = useRouter();

  const {
    data: article,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminPost", id],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) {
        throw new Error("No session");
      }
      return getAdminPostDetails(session.accessToken, id);
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

  if (error || !article) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold">Không tìm thấy bài viết</h2>
        <p className="text-muted-foreground">
          Bài viết này có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Button onClick={() => router.push("/admin/content/articles")} variant="outline">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  let mappedStatus = "Bản nháp";
  let tone: "success" | "warning" | "neutral" | "error" = "neutral";
  if (article.status === "PUBLISHED" || article.status === "ACTIVE") {
    mappedStatus = "Đã xuất bản";
    tone = "success";
  } else if (article.status === "PENDING") {
    mappedStatus = "Đang chờ duyệt";
    tone = "warning";
  }

  const authorName = article.author?.profile?.fullName || article.author?.email || "Chưa cập nhật";
  const categoryName = article.categories?.[0]?.postCategory?.name || "Khác";
  const publishedDate = article.publishedAt
    ? formatAppDate(article.publishedAt)
    : article.createdAt
      ? formatAppDate(article.createdAt)
      : "—";

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-foreground -ml-4"
        onClick={() => router.push("/admin/content/articles")}
      >
        <ArrowLeft className="mr-2" size={16} />
        Quay lại danh sách
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Header Info */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <CardTitle className="text-2xl leading-relaxed font-bold">
                    {article.title}
                  </CardTitle>
                  <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <User size={16} />
                      <span className="font-medium">{authorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag size={16} />
                      <span>{categoryName}</span>
                    </div>
                  </div>
                </div>
                <Badge tone={tone} className="shrink-0 text-sm">
                  {mappedStatus}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="pt-6">
              <div
                className="prose prose-slate prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline max-w-none"
                dangerouslySetInnerHTML={{
                  __html:
                    article.content ||
                    "<p className='text-muted-foreground'>Bài viết chưa có nội dung chi tiết.</p>",
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Thông tin thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="text-muted-foreground flex items-center gap-2">
                  <CalendarBlank size={18} />
                  <span className="text-sm">Ngày đăng</span>
                </div>
                <span className="font-medium">{publishedDate}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="text-muted-foreground flex items-center gap-2">
                  <Eye size={18} />
                  <span className="text-sm">Lượt xem</span>
                </div>
                <span className="font-medium">
                  {new Intl.NumberFormat("vi-VN").format(article.views || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {mappedStatus === "Đang chờ duyệt" && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="space-y-3 pt-6">
                <h3 className="text-warning-foreground font-bold">Hành động kiểm duyệt</h3>
                <p className="text-warning-foreground/80 text-sm">
                  Bài viết này đang chờ quản trị viên phê duyệt để được xuất bản.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button className="bg-success hover:bg-success/90 w-full text-white">
                    Duyệt & Xuất bản
                  </Button>
                  <Button
                    variant="outline"
                    className="text-error hover:bg-error/10 hover:text-error w-full"
                  >
                    Từ chối
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
