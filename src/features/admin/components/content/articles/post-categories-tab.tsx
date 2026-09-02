"use client";

import {
  ArrowsCounterClockwise,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretLeft,
  CaretRight,
  CircleNotch,
  DotsThree,
  FolderSimple,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import Swal from "sweetalert2";

import {
  adminDeletePostCategory,
  adminGetPostCategories,
  type FullPostCategory,
} from "@/features/admin/api/posts";
import { getAdminSession } from "@/features/admin/session";
import { formatAppDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
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

import { PostCategoryFormDialog } from "./post-category-form-dialog";

export function PostCategoriesTab() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Modals
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<FullPostCategory | null>(null);

  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery<FullPostCategory[]>({
    queryKey: ["adminPostCategories"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return adminGetPostCategories(session.accessToken);
    },
  });

  // Client-side search & pagination
  const filteredData = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) => cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q),
    );
  }, [categories, searchTerm]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset page when search or pageSize changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (cat: FullPostCategory) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return adminDeletePostCategory(session.accessToken, cat.id);
    },
    onSuccess: () => {
      void Swal.fire({
        icon: "success",
        title: "Đã xóa",
        text: "Đã xóa danh mục bài viết",
        timer: 1500,
        showConfirmButton: false,
      });
      void queryClient.invalidateQueries({ queryKey: ["adminPostCategories"] });
    },
    onError: (err: any) => {
      void Swal.fire({
        icon: "error",
        title: "Không thể xóa",
        text: err?.message || "Có lỗi xảy ra khi xóa danh mục bài viết",
      });
    },
  });

  const handleDelete = async (cat: FullPostCategory) => {
    const postCount = cat._count?.posts ?? 0;

    const confirm = await Swal.fire({
      icon: "warning",
      title: `Xóa danh mục "${cat.name}"?`,
      html: `
        <div class="text-sm text-slate-600 text-left space-y-1">
          <p>• Số bài viết trực thuộc: <strong>${postCount} bài viết</strong></p>
          <p class="text-rose-600 mt-2">Hành động này sẽ xóa vĩnh viễn danh mục khỏi hệ thống.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Xác nhận xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
    });

    if (confirm.isConfirmed) {
      deleteMutation.mutate(cat);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── INLINE TOOLBAR ─── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-[280px] md:w-[320px]">
          <MagnifyingGlass
            className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 text-sm focus-visible:bg-white focus-visible:ring-emerald-500"
            placeholder="Tìm theo tên danh mục, slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
            onClick={() => void refetch()}
            title="Làm mới"
          >
            <ArrowsCounterClockwise size={18} />
          </Button>

          <Button
            className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
            onClick={() => {
              setEditingCategory(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} weight="bold" className="mr-1.5" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      {/* ─── TABLE CARD ─── */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2">
                <CircleNotch className="size-8 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600">Đang tải danh mục...</span>
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
                  <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Tên danh mục bài viết
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Đường dẫn tĩnh (Slug)
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Số bài viết
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Cập nhật lần cuối
                  </th>
                  <th className="w-[100px] min-w-[100px] px-5 py-3.5 text-right text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      Không tìm thấy danh mục nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((cat) => {
                    const postCount = cat._count?.posts ?? 0;

                    return (
                      <tr key={cat.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                              <FolderSimple size={18} weight="bold" />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                            /{cat.slug}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-slate-800">
                            {postCount.toLocaleString()}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">bài viết</span>
                        </td>

                        <td className="px-4 py-3.5 text-center text-xs text-slate-500">
                          {formatAppDate(cat.updatedAt)}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                              >
                                <span className="sr-only">Mở menu</span>
                                <DotsThree size={20} weight="bold" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel className="text-xs font-bold text-slate-500">
                                Thao tác
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setDialogOpen(true);
                                }}
                              >
                                <PencilSimple size={15} className="mr-2 text-slate-600" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer text-rose-600 focus:text-rose-600"
                                onClick={() => void handleDelete(cat)}
                              >
                                <Trash size={15} className="mr-2" />
                                Xóa danh mục
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── BOTTOM PAGINATION ─── */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
              <SelectTrigger className="h-8 w-[70px] rounded-lg border-slate-200 bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>
              trên tổng số <strong>{totalItems.toLocaleString()}</strong> danh mục
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage(1)}
              className="h-8 rounded-lg px-2 text-xs"
              title="Trang đầu"
            >
              <CaretDoubleLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 rounded-lg px-2.5 text-xs"
            >
              <CaretLeft size={14} className="mr-1" /> Trước
            </Button>
            <span className="px-2 text-xs font-semibold text-slate-800">
              Trang {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 rounded-lg px-2.5 text-xs"
            >
              Sau <CaretRight size={14} className="ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage(totalPages)}
              className="h-8 rounded-lg px-2 text-xs"
              title="Trang cuối"
            >
              <CaretDoubleRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Dialog Thêm / Sửa Danh mục */}
      <PostCategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSuccess={() => void refetch()}
      />
    </div>
  );
}
