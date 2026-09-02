"use client";

import {
  ArrowLeft,
  CalendarBlank,
  Eye,
  User,
  Tag,
  PencilSimple,
  Trash,
  PaperPlaneTilt,
  Archive,
  Globe,
  Copy,
  Check,
  Sparkle,
  Image as ImageIcon,
  Clock,
  Article,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import Swal from "sweetalert2";

import {
  archiveAdminPost,
  deleteAdminPost,
  getAdminPostDetails,
  publishAdminPost,
} from "@/features/admin/api/posts";
import { getAdminSession, clearAdminSession } from "@/features/admin/session";
import { Link, useRouter } from "@/i18n/navigation";
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

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ArticleDetailsPage({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copiedSlug, setCopiedSlug] = React.useState(false);

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

  const publishMutation = useMutation({
    mutationFn: async (expectedUpdatedAt: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return publishAdminPost(session.accessToken, id, expectedUpdatedAt);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPost", id] });
      void queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      void toast.fire({ icon: "success", title: "Đã xuất bản bài viết thành công!" });
    },
    onError: (err) => {
      void toast.fire({
        icon: "error",
        title: err instanceof ApiError ? err.message : "Xuất bản thất bại.",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (expectedUpdatedAt: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return archiveAdminPost(session.accessToken, id, expectedUpdatedAt);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPost", id] });
      void queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      void toast.fire({ icon: "success", title: "Đã chuyển bài viết vào kho lưu trữ." });
    },
    onError: (err) => {
      void toast.fire({
        icon: "error",
        title: err instanceof ApiError ? err.message : "Lưu trữ thất bại.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return deleteAdminPost(session.accessToken, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      void toast.fire({ icon: "success", title: "Đã xóa bài viết." });
      router.push("/admin/content/articles");
    },
    onError: (err) => {
      void toast.fire({
        icon: "error",
        title: err instanceof ApiError ? err.message : "Xóa bài viết thất bại.",
      });
    },
  });

  const handleDelete = () => {
    void Swal.fire({
      title: "Xóa bài viết này?",
      text: "Thao tác này sẽ xóa hoàn toàn bài viết và không thể khôi phục.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Xác nhận xóa",
      cancelButtonText: "Hủy bỏ",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate();
      }
    });
  };

  const handleCopySlug = () => {
    if (!article?.slug) return;
    const url = `${window.location.origin}/vi/blog/${article.slug}`;
    void navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
    void toast.fire({ icon: "success", title: "Đã sao chép liên kết bài viết!" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-[240px] w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[250px] w-full rounded-2xl" />
            <Skeleton className="h-[350px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài viết</h2>
        <p className="text-slate-500">
          Bài viết này có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Button onClick={() => router.push("/admin/content/articles")} variant="outline">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  let mappedStatus = "Bản nháp";
  let tone: "success" | "warning" | "neutral" | "error" = "warning";
  if (article.status === "PUBLISHED") {
    mappedStatus = "Đã xuất bản";
    tone = "success";
  } else if (article.status === "ARCHIVED") {
    mappedStatus = "Lưu trữ";
    tone = "neutral";
  }

  const authorName = article.admin?.fullName || article.admin?.email || "Quản trị viên";
  const authorAvatar = article.admin?.avatarUrl;
  const categoryName = article.category?.name || "Không phân loại";
  const typeLabel = article.type === "BLOG" ? "Blog" : article.type === "NEWS" ? "Tin tức" : "FAQ";
  const publishedDate = article.publishedAt
    ? formatAppDate(article.publishedAt)
    : article.createdAt
      ? formatAppDate(article.createdAt)
      : "—";
  const updatedDate = article.updatedAt ? formatAppDate(article.updatedAt) : "—";
  const tags = article.postTags?.map((pt) => pt.tag) || [];

  const plainContent = stripHtml(article.content || "");
  const wordCount = plainContent ? plainContent.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const bannerImage = article.coverImageFile?.publicUrl || article.thumbnailFile?.publicUrl;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Action & Navigation Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/content/articles">
            <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900">
              <ArrowLeft size={18} />
              Quay lại danh sách
            </Button>
          </Link>
          <div className="mt-1">
            <h1 className="text-2xl font-bold text-slate-900">Chi tiết bài viết</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Xem trước nội dung, thông số SEO và quản lý trạng thái bài viết.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone={tone} className="px-3 py-1 text-xs font-semibold">
            {mappedStatus}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(`/admin/content/articles/${article.id}/edit`)}
          >
            <PencilSimple size={16} />
            Chỉnh sửa
          </Button>

          {article.status !== "PUBLISHED" ? (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate(article.updatedAt)}
            >
              <PaperPlaneTilt size={16} />
              {publishMutation.isPending ? "Đang xuất bản..." : "Xuất bản"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-slate-600"
              disabled={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate(article.updatedAt)}
            >
              <Archive size={16} />
              {archiveMutation.isPending ? "Đang lưu trữ..." : "Lưu trữ"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            <Trash size={16} />
            Xóa
          </Button>
        </div>
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Main Article Details & Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Title & Classification Header Card */}
          <Card className="overflow-hidden border border-slate-200 shadow-xs">
            {bannerImage ? (
              <div className="relative h-64 w-full overflow-hidden bg-slate-900 sm:h-80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerImage} alt={article.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                <div className="absolute right-6 bottom-4 left-6 text-white">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-500/90 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-xs">
                      {typeLabel}
                    </span>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs">
                      {categoryName}
                    </span>
                  </div>
                  <h2 className="text-xl leading-snug font-bold drop-shadow-xs sm:text-2xl">
                    {article.title}
                  </h2>
                </div>
              </div>
            ) : null}

            <CardHeader className={bannerImage ? "pt-5 pb-4" : "pb-4"}>
              {!bannerImage ? (
                <div>
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      {typeLabel}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {categoryName}
                    </span>
                  </div>
                  <CardTitle className="text-2xl leading-relaxed font-bold text-slate-900">
                    {article.title}
                  </CardTitle>
                </div>
              ) : null}

              {/* Meta details bar */}
              <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User size={15} className="text-slate-400" />
                  <span className="font-medium text-slate-700">{authorName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarBlank size={15} className="text-slate-400" />
                  <span>Đăng ngày: {publishedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Article size={15} className="text-slate-400" />
                  <span>{wordCount} từ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="text-slate-400" />
                  <span>~{readingTime} phút đọc</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={15} className="text-slate-400" />
                  <span>{new Intl.NumberFormat("vi-VN").format(article.views || 0)} lượt xem</span>
                </div>
              </div>

              {/* Tags list */}
              {tags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                  <span className="mr-1 flex items-center gap-1 text-xs font-medium text-slate-400">
                    <Tag size={13} /> Thẻ:
                  </span>
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardHeader>
          </Card>

          {/* Article Body Content */}
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Article size={18} className="text-emerald-600" />
                Nội dung chi tiết
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                className="prose prose-slate max-w-none text-[15px] leading-7 text-slate-700 [&_a]:text-emerald-600 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-emerald-700 [&_blockquote]:my-4 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-emerald-50/40 [&_blockquote]:py-2 [&_blockquote]:pr-3 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-emerald-700 [&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-slate-100 [&_h2]:pb-1.5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 first:[&_h2]:mt-0 [&_h3]:mt-6 [&_h3]:mb-2.5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 first:[&_h3]:mt-0 [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-slate-900 first:[&_h4]:mt-0 [&_hr]:my-6 [&_hr]:border-slate-200 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_li]:mb-1.5 [&_p]:mb-4 last:[&_p]:mb-0 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-slate-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_li]:mb-1.5"
                dangerouslySetInnerHTML={{
                  __html:
                    article.content ||
                    "<p className='text-slate-400 italic'>Bài viết chưa có nội dung chi tiết.</p>",
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Meta, SEO, Image Previews, Audit Stats */}
        <div className="space-y-6">
          {/* Card 1: Quick Publishing & URL Information */}
          <Card className="space-y-4 border border-slate-200 p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Globe size={16} className="text-emerald-600" />
              Đường dẫn & Trạng thái
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="mb-1 block text-slate-500">Đường dẫn tĩnh (Slug):</span>
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono break-all text-emerald-800">
                  <span className="flex-1 truncate text-[11px]">{article.slug}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-slate-500 hover:text-slate-800"
                    onClick={handleCopySlug}
                    title="Sao chép liên kết"
                  >
                    {copiedSlug ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-slate-500">Trạng thái:</span>
                <Badge tone={tone} className="text-[11px]">
                  {mappedStatus}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-slate-500">Lượt xem bài:</span>
                <span className="font-semibold text-slate-800">
                  {new Intl.NumberFormat("vi-VN").format(article.views || 0)} lượt
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-slate-500">Cập nhật lần cuối:</span>
                <span className="font-medium text-slate-700">{updatedDate}</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Author & Admin Info */}
          <Card className="space-y-3 border border-slate-200 p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <User size={16} className="text-emerald-600" />
              Tác giả & Quản trị
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                {authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  authorName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{authorName}</p>
                <p className="truncate text-xs text-slate-400">
                  {article.admin?.email || "Admin hệ thống"}
                </p>
              </div>
            </div>
          </Card>

          {/* Card 3: SEO Meta Information & Google SERP Preview */}
          <Card className="space-y-4 border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkle size={16} className="text-emerald-600" />
                Thông tin SEO & Meta
              </h2>
            </div>

            {/* Google SERP Preview Snippet */}
            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                  U
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-[11px] font-medium text-slate-700">upnext.dev › blog</div>
                  <div className="truncate font-mono text-[10px] text-slate-400">
                    https://upnext.dev/vi/blog/{article.slug}
                  </div>
                </div>
              </div>

              <div className="line-clamp-2 cursor-pointer text-[14px] leading-snug font-medium text-[#1a0dab] hover:underline">
                {article.metaTitle || article.title}
              </div>

              <div className="line-clamp-2 text-[12px] leading-relaxed text-[#4d5156]">
                {article.metaDescription ||
                  (plainContent ? plainContent.slice(0, 150) + "..." : "Chưa có mô tả SEO.")}
              </div>
            </div>

            {/* SEO details */}
            <div className="space-y-2.5 text-xs">
              {article.focusKeyword ? (
                <div>
                  <span className="mb-0.5 block text-slate-500">Từ khóa chính:</span>
                  <span className="inline-block rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                    {article.focusKeyword}
                  </span>
                </div>
              ) : null}

              {article.metaTitle ? (
                <div>
                  <span className="mb-0.5 block text-slate-500">Meta Title:</span>
                  <span className="font-medium text-slate-700">{article.metaTitle}</span>
                </div>
              ) : null}

              {article.metaDescription ? (
                <div>
                  <span className="mb-0.5 block text-slate-500">Meta Description:</span>
                  <span className="leading-relaxed text-slate-700">{article.metaDescription}</span>
                </div>
              ) : null}

              {article.metaKeywords ? (
                <div>
                  <span className="mb-0.5 block text-slate-500">Meta Keywords:</span>
                  <span className="text-slate-600 italic">{article.metaKeywords}</span>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Card 4: Attached Images Previews */}
          <Card className="space-y-4 border border-slate-200 p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ImageIcon size={16} className="text-emerald-600" />
              Hình ảnh đính kèm
            </h2>

            <div className="space-y-3">
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Ảnh thumbnail đại diện:
                </span>
                {article.thumbnailFile?.publicUrl ? (
                  <div className="group relative overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.thumbnailFile.publicUrl}
                      alt="Thumbnail bài viết"
                      className="h-28 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                    Chưa có ảnh thumbnail
                  </div>
                )}
              </div>

              {article.coverImageFile?.publicUrl &&
              article.coverImageFile.publicUrl !== article.thumbnailFile?.publicUrl ? (
                <div>
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Ảnh bìa (Cover Image):
                  </span>
                  <div className="group relative overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.coverImageFile.publicUrl}
                      alt="Ảnh bìa bài viết"
                      className="h-28 w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
