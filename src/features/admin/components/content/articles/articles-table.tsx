"use client";

import {
  ArrowsCounterClockwise,
  DotsThree,
  DownloadSimple,
  MagnifyingGlass,
  PlusCircle,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import Swal from "sweetalert2";

import {
  archiveAdminPost,
  deleteAdminPost,
  getAdminPosts,
  publishAdminPost,
  updateAdminPost,
  type AdminPostResponse,
  type PostStatus,
} from "@/features/admin/api/posts";
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

export type AdminArticle = {
  id: string;
  title: string;
  author: string;
  category: string;
  status: "Đã xuất bản" | "Bản nháp" | "Lưu trữ";
  views: number;
  publishedDate: string | null;
};

function mapToAdminArticle(apiPost: AdminPostResponse): AdminArticle {
  let mappedStatus: AdminArticle["status"] = "Bản nháp";
  if (apiPost.status === "PUBLISHED") {
    mappedStatus = "Đã xuất bản";
  } else if (apiPost.status === "ARCHIVED") {
    mappedStatus = "Lưu trữ";
  }

  return {
    id: apiPost.id,
    title: apiPost.title,
    // The API returns a single `category` and the authoring `admin`; earlier code read
    // `categories[]`/`author`, which do not exist and always fell through to defaults.
    author: apiPost.admin?.fullName || apiPost.admin?.email || "Chưa cập nhật",
    category: apiPost.category?.name || "Khác",
    status: mappedStatus,
    views: apiPost.viewCount || 0,
    publishedDate: apiPost.createdAt ? formatAppDate(apiPost.createdAt) : null,
  };
}

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export function ArticlesTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const t = useTranslations("Admin.content.articles.table");
  const tPage = useTranslations("Admin.content.articles");
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: apiPosts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminPosts"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) {
        throw new Error("No session");
      }
      return getAdminPosts(session.accessToken);
    },
    retry: false,
  });

  const handleRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
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

  const rawPostMap = React.useMemo(() => {
    return new Map(apiPosts.map((p) => [p.id, p]));
  }, [apiPosts]);

  const { mutate: changePostStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PostStatus }) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      const post = rawPostMap.get(id);
      const expectedUpdatedAt = post?.updatedAt || new Date().toISOString();

      if (status === "PUBLISHED") {
        return publishAdminPost(session.accessToken, id, expectedUpdatedAt);
      }
      if (status === "ARCHIVED") {
        return archiveAdminPost(session.accessToken, id, expectedUpdatedAt);
      }
      return updateAdminPost(session.accessToken, id, {
        status,
        expectedUpdatedAt,
      });
    },
    onSuccess: (_, variables) => {
      const msg =
        variables.status === "PUBLISHED"
          ? "Đã xuất bản bài viết thành công!"
          : variables.status === "ARCHIVED"
            ? "Đã lưu trữ bài viết!"
            : "Đã chuyển bài viết thành bản nháp!";
      void toast.fire({ icon: "success", title: msg });
      handleRefresh();
    },
    onError: (err) => {
      let msg = "Có lỗi xảy ra khi cập nhật!";
      if (err instanceof ApiError) {
        if (err.payload && typeof err.payload === "object") {
          const d = err.payload as any;
          if (Array.isArray(d.message)) msg = d.message.join(", ");
          else if (typeof d.message === "string") msg = d.message;
        } else {
          msg = err.message;
        }
      }
      void toast.fire({ icon: "error", title: msg });
    },
  });

  const { mutate: deletePost } = useMutation({
    mutationFn: async (id: string) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return deleteAdminPost(session.accessToken, id);
    },
    onSuccess: () => {
      void toast.fire({ icon: "success", title: "Xóa bài viết thành công!" });
      handleRefresh();
    },
    onError: (err) => {
      void toast.fire({
        icon: "error",
        title: err instanceof ApiError ? err.message : "Có lỗi xảy ra khi xóa bài viết!",
      });
    },
  });

  const handleDelete = (id: string) => {
    void Swal.fire({
      title: "Xóa bài viết?",
      text: "Bạn có chắc chắn muốn xóa bài viết này không? Thao tác này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        deletePost(id);
      }
    });
  };

  const data = React.useMemo(() => {
    return apiPosts.map(mapToAdminArticle);
  }, [apiPosts]);

  const filteredData = React.useMemo(() => {
    let result = data;
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(lower) || item.author.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [statusFilter, searchTerm, data]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const isAllPageSelected =
    paginatedData.length > 0 && paginatedData.every((article) => selectedIds.includes(article.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedData.map((article) => article.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedData.map((article) => article.id);
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
                <SelectItem value="Đã xuất bản">{t("statusOptions.published")}</SelectItem>
                <SelectItem value="Bản nháp">{t("statusOptions.draft")}</SelectItem>
                <SelectItem value="Lưu trữ">{t("statusOptions.archived")}</SelectItem>
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
            <Button
              className="flex h-10 items-center gap-2 rounded-full px-4 font-semibold"
              onClick={() => router.push("/admin/content/articles/new")}
            >
              <PlusCircle size={18} />
              <span>{tPage("addArticle")}</span>
            </Button>
          </>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 !bg-[#bfe9d6]">
            <th className="w-12 border-r border-slate-300 px-4 py-3 text-center last:border-r-0">
              <input
                type="checkbox"
                aria-label="Chọn tất cả"
                className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                checked={isAllPageSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0">
              {t("article")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold whitespace-nowrap last:border-r-0">
              {t("author")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold whitespace-nowrap last:border-r-0">
              {t("status")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-right font-semibold whitespace-nowrap last:border-r-0">
              {t("views")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 font-semibold whitespace-nowrap last:border-r-0">
              {t("date")}
            </th>
            <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <MagnifyingGlass size={32} />
                  <p>Không tìm thấy bài viết nào phù hợp</p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedData.map((article) => {
              const tone =
                article.status === "Đã xuất bản"
                  ? "success"
                  : article.status === "Bản nháp"
                    ? "warning"
                    : "neutral";

              const statusKey =
                article.status === "Đã xuất bản"
                  ? "published"
                  : article.status === "Lưu trữ"
                    ? "archived"
                    : "draft";

              const categoryKey =
                article.category === "Phát triển nghề nghiệp" ||
                article.category.toLowerCase().includes("career")
                  ? "career"
                  : article.category === "Góc kỹ thuật" ||
                      article.category.toLowerCase().includes("tech")
                    ? "technical"
                    : article.category === "Báo cáo thị trường" ||
                        article.category.toLowerCase().includes("market")
                      ? "market"
                      : article.category === "Review công ty" ||
                          article.category.toLowerCase().includes("review")
                        ? "review"
                        : article.category === "Tin tức" ||
                            article.category.toLowerCase().includes("news")
                          ? "news"
                          : "blog";

              return (
                <tr
                  key={article.id}
                  className={cn(
                    "border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30",
                    selectedIds.includes(article.id) && "bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <td className="w-12 border-r border-slate-200 px-4 py-3 text-center last:border-r-0">
                    <input
                      type="checkbox"
                      aria-label={`Chọn ${article.title}`}
                      className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300"
                      checked={selectedIds.includes(article.id)}
                      onChange={(e) => handleSelectOne(article.id, e.target.checked)}
                    />
                  </td>
                  <td className="max-w-xs border-r border-slate-200 px-4 py-3 last:border-r-0 md:max-w-sm xl:max-w-md">
                    <div className="min-w-0">
                      <p
                        className="truncate font-semibold text-slate-900 transition-colors hover:text-emerald-700"
                        title={article.title}
                      >
                        {article.title}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {t(`categoryOptions.${categoryKey}`)}
                      </p>
                    </div>
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 font-medium whitespace-nowrap last:border-r-0">
                    {article.author}
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 whitespace-nowrap last:border-r-0">
                    <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 text-right font-medium whitespace-nowrap last:border-r-0">
                    {new Intl.NumberFormat("vi-VN").format(article.views)}
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 whitespace-nowrap last:border-r-0">
                    {article.publishedDate || "—"}
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
                          onClick={() => router.push(`/admin/content/articles/${article.id}/edit`)}
                        >
                          {t("actionOptions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/content/articles/${article.id}`)}
                        >
                          {t("actionOptions.viewPreview")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {(article.status === "Bản nháp" || article.status === "Lưu trữ") && (
                          <DropdownMenuItem
                            className="text-success cursor-pointer"
                            onClick={() =>
                              changePostStatus({ id: article.id, status: "PUBLISHED" })
                            }
                          >
                            {t("actionOptions.publish")}
                          </DropdownMenuItem>
                        )}
                        {article.status === "Đã xuất bản" && (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => changePostStatus({ id: article.id, status: "DRAFT" })}
                          >
                            {t("actionOptions.moveToDraft")}
                          </DropdownMenuItem>
                        )}
                        {article.status !== "Lưu trữ" && (
                          <DropdownMenuItem
                            className="cursor-pointer text-slate-600"
                            onClick={() => changePostStatus({ id: article.id, status: "ARCHIVED" })}
                          >
                            Lưu trữ bài viết
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-error cursor-pointer"
                          onClick={() => handleDelete(article.id)}
                        >
                          {t("actionOptions.delete")}
                        </DropdownMenuItem>
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
