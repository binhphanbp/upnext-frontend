"use client";

import {
  ArrowsCounterClockwise,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretLeft,
  CaretRight,
  CheckCircle,
  CircleNotch,
  DotsThree,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash,
  XCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import Swal from "sweetalert2";

import {
  deleteJobCategory,
  getJobCategories,
  updateJobCategory,
  type JobCategoryItem,
} from "@/features/admin/api/taxonomy";
import { getAdminSession } from "@/features/admin/session";
import { Badge } from "@/shared/ui/badge";
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

import { JobCategoryFormDialog } from "./job-category-form-dialog";

export function JobCategoriesTab({ onStatsChange }: { onStatsChange?: () => void }) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Modals
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<JobCategoryItem | null>(null);

  const {
    data: allCategories = [],
    isLoading,
    refetch,
  } = useQuery<JobCategoryItem[]>({
    queryKey: ["jobCategories"],
    queryFn: async () => {
      return getJobCategories();
    },
  });

  // Client-side filtering & pagination for 31 categories
  const filteredData = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allCategories.filter((cat) => {
      if (q && !cat.name.toLowerCase().includes(q)) {
        return false;
      }
      if (statusFilter === "ACTIVE" && !cat.isActive) return false;
      if (statusFilter === "INACTIVE" && cat.isActive) return false;
      return true;
    });
  }, [allCategories, searchTerm, statusFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: async (cat: JobCategoryItem) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return updateJobCategory(session.accessToken, cat.id, {
        isActive: !cat.isActive,
      });
    },
    onSuccess: (updated) => {
      void Swal.fire({
        icon: "success",
        title: updated.isActive ? "Đã kích hoạt" : "Đã tạm dừng",
        text: `Ngành nghề "${updated.name}" hiện ${updated.isActive ? "đang hoạt động" : "đã tạm ẩn"}`,
        timer: 1500,
        showConfirmButton: false,
      });
      void queryClient.invalidateQueries({ queryKey: ["jobCategories"] });
      onStatsChange?.();
    },
    onError: (err: any) => {
      void Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.message || "Không thể cập nhật trạng thái",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (cat: JobCategoryItem) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return deleteJobCategory(session.accessToken, cat.id);
    },
    onSuccess: () => {
      void Swal.fire({
        icon: "success",
        title: "Đã xóa",
        timer: 1500,
        showConfirmButton: false,
      });
      void queryClient.invalidateQueries({ queryKey: ["jobCategories"] });
      onStatsChange?.();
    },
    onError: (err: any) => {
      void Swal.fire({
        icon: "error",
        title: "Không thể xóa ngành nghề",
        text:
          err?.message ||
          "Ngành nghề này đang có tin tuyển dụng trực thuộc. Vui lòng chuyển sang Tạm ẩn thay vì xóa.",
      });
    },
  });

  const handleDelete = async (cat: JobCategoryItem) => {
    const jobCount = cat._count?.jobPosts ?? 0;

    const confirm = await Swal.fire({
      icon: "warning",
      title: `Xóa ngành nghề "${cat.name}"?`,
      html: `
        <div class="text-sm text-slate-600 text-left space-y-1">
          <p>• Tin tuyển dụng trực thuộc: <strong>${jobCount}</strong></p>
          <p class="text-rose-600 mt-2">Hành động này sẽ xóa ngành nghề khỏi danh mục tuyển dụng hệ thống.</p>
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

  const handleRefresh = () => {
    void refetch();
    onStatsChange?.();
  };

  return (
    <div className="space-y-4">
      {/* ─── INLINE TOOLBAR (RESPONSIVE & CLEAN) ─── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Bộ lọc bên trái */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-[260px] md:w-[280px]">
            <MagnifyingGlass
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 text-sm focus-visible:bg-white focus-visible:ring-emerald-500"
              placeholder="Tìm theo tên ngành nghề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm sm:w-[170px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Tạm ngừng dùng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nút tác vụ bên phải */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
            onClick={handleRefresh}
            title="Làm mới dữ liệu"
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
            Thêm ngành nghề
          </Button>
        </div>
      </div>

      {/* ─── TABLE CONTAINER (CARD + HORIZONTAL SCROLL) ─── */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2">
                <CircleNotch className="size-8 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600">Đang tải dữ liệu...</span>
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
                  <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Tên ngành nghề tuyển dụng
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Thứ tự hiển thị
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Tin tuyển dụng liên kết
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Trạng thái
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
                      Không tìm thấy ngành nghề nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((cat) => {
                    const jobCount = cat._count?.jobPosts ?? 0;

                    return (
                      <tr key={cat.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                            {cat.description ? (
                              <span className="mt-0.5 max-w-[320px] truncate text-xs text-slate-400">
                                {cat.description}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
                            #{cat.sortOrder}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-slate-800">
                            {jobCount.toLocaleString()}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">tin đăng</span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {cat.isActive ? (
                            <Badge tone="success" className="font-bold">
                              <CheckCircle size={12} weight="fill" className="mr-1" /> Hoạt động
                            </Badge>
                          ) : (
                            <Badge tone="neutral" className="font-bold">
                              <XCircle size={12} weight="fill" className="mr-1" /> Tạm ngừng
                            </Badge>
                          )}
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
                            <DropdownMenuContent align="end" className="w-44">
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
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => toggleMutation.mutate(cat)}
                              >
                                {cat.isActive ? (
                                  <>
                                    <XCircle size={15} className="mr-2 text-amber-600" />
                                    Tạm ngừng dùng
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={15} className="mr-2 text-emerald-600" />
                                    Kích hoạt lại
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer text-rose-600 focus:text-rose-600"
                                onClick={() => void handleDelete(cat)}
                              >
                                <Trash size={15} className="mr-2" />
                                Xóa ngành nghề
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
              trên tổng số <strong>{totalItems.toLocaleString()}</strong> ngành nghề
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

      {/* Dialog Thêm/Sửa ngành nghề */}
      <JobCategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSuccess={() => {
          void refetch();
          onStatsChange?.();
        }}
      />
    </div>
  );
}
