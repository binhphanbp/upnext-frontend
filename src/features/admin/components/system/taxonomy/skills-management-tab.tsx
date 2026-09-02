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
  FolderSimple,
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
  deleteSkill,
  getAdminSkills,
  getSkillCategories,
  updateSkill,
  type SkillCategoryItem,
  type SkillItem,
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

import { SkillCategoriesDialog } from "./skill-categories-dialog";
import { SkillFormDialog } from "./skill-form-dialog";

export function SkillsManagementTab({ onStatsChange }: { onStatsChange?: () => void }) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Modals state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingSkill, setEditingSkill] = React.useState<SkillItem | null>(null);
  const [catDialogOpen, setCatDialogOpen] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, categoryFilter, statusFilter, pageSize]);

  // Fetch skill categories for filter dropdown
  const { data: categories = [], refetch: refetchCategories } = useQuery<SkillCategoryItem[]>({
    queryKey: ["skillCategories"],
    queryFn: async () => {
      return getSkillCategories();
    },
  });

  // Fetch paginated admin skills
  const {
    data: skillsData,
    isLoading,
    refetch: refetchSkills,
  } = useQuery({
    queryKey: ["adminSkills", currentPage, pageSize, debouncedQuery, categoryFilter, statusFilter],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");

      return getAdminSkills(session.accessToken, {
        page: currentPage,
        limit: pageSize,
        q: debouncedQuery.trim() || undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        isActive:
          statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : undefined,
      });
    },
  });

  const skills = skillsData?.items ?? [];
  const totalItems = skillsData?.total ?? 0;
  const totalPages = skillsData?.totalPages ?? 1;

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: async (skill: SkillItem) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return updateSkill(session.accessToken, skill.id, {
        isActive: !skill.isActive,
      });
    },
    onSuccess: (updated) => {
      void Swal.fire({
        icon: "success",
        title: updated.isActive ? "Đã kích hoạt" : "Đã tạm dừng",
        text: `Kỹ năng "${updated.name}" hiện ${updated.isActive ? "đang hoạt động" : "đã tạm ẩn"}`,
        timer: 1500,
        showConfirmButton: false,
      });
      void queryClient.invalidateQueries({ queryKey: ["adminSkills"] });
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

  // Delete skill mutation
  const deleteMutation = useMutation({
    mutationFn: async (skill: SkillItem) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return deleteSkill(session.accessToken, skill.id);
    },
    onSuccess: () => {
      void Swal.fire({
        icon: "success",
        title: "Đã xóa",
        timer: 1500,
        showConfirmButton: false,
      });
      void queryClient.invalidateQueries({ queryKey: ["adminSkills"] });
      onStatsChange?.();
    },
    onError: (err: any) => {
      void Swal.fire({
        icon: "error",
        title: "Không thể xóa kỹ năng",
        text:
          err?.message ||
          "Kỹ năng này đang được liên kết với tin tuyển dụng hoặc hồ sơ ứng viên. Vui lòng chuyển sang Tạm ẩn thay vì xóa.",
      });
    },
  });

  const handleDelete = async (skill: SkillItem) => {
    const jobCount = skill._count?.jobPostSkills ?? 0;
    const candidateCount = skill._count?.candidateSkills ?? 0;

    const confirm = await Swal.fire({
      icon: "warning",
      title: `Xóa kỹ năng "${skill.name}"?`,
      html: `
        <div class="text-sm text-slate-600 text-left space-y-1">
          <p>• Tin tuyển dụng đang dùng: <strong>${jobCount}</strong></p>
          <p>• Hồ sơ ứng viên sở hữu: <strong>${candidateCount}</strong></p>
          <p class="text-rose-600 mt-2">Hành động này sẽ xóa vĩnh viễn kỹ năng khỏi danh mục hệ thống.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Xác nhận xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
    });

    if (confirm.isConfirmed) {
      deleteMutation.mutate(skill);
    }
  };

  const handleRefresh = () => {
    void refetchSkills();
    void refetchCategories();
    onStatsChange?.();
  };

  return (
    <div className="space-y-4">
      {/* ─── INLINE TOOLBAR (RESPONSIVE & CLEAN) ─── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Bộ lọc bên trái */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-[240px] md:w-[260px]">
            <MagnifyingGlass
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 text-sm focus-visible:bg-white focus-visible:ring-emerald-500"
              placeholder="Tìm theo tên kỹ năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Nhóm chuyên môn */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm sm:w-[180px]">
              <SelectValue placeholder="Tất cả nhóm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhóm</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Trạng thái */}
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
            variant="outline"
            className="h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setCatDialogOpen(true)}
          >
            <FolderSimple size={16} className="mr-1.5 text-blue-600" />
            Quản lý nhóm ({categories.length})
          </Button>

          <Button
            className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
            onClick={() => {
              setEditingSkill(null);
              setFormDialogOpen(true);
            }}
          >
            <Plus size={16} weight="bold" className="mr-1.5" />
            Thêm kỹ năng
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
            <table className="w-full min-w-[850px] border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
                  <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Tên kỹ năng chuẩn
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Nhóm chuyên môn
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Tin tuyển dụng
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase">
                    Hồ sơ ứng viên
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
                {skills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Không tìm thấy kỹ năng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  skills.map((skill) => {
                    const jobCount = skill._count?.jobPostSkills ?? 0;
                    const candidateCount = skill._count?.candidateSkills ?? 0;

                    return (
                      <tr key={skill.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{skill.name}</span>
                            {skill.description ? (
                              <span className="mt-0.5 max-w-[280px] truncate text-xs text-slate-400">
                                {skill.description}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {skill.category ? (
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset">
                              {skill.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Chưa phân nhóm</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-slate-800">
                            {jobCount.toLocaleString()}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">tin</span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-slate-800">
                            {candidateCount.toLocaleString()}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">CV</span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {skill.isActive ? (
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
                                  setEditingSkill(skill);
                                  setFormDialogOpen(true);
                                }}
                              >
                                <PencilSimple size={15} className="mr-2 text-slate-600" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => toggleMutation.mutate(skill)}
                              >
                                {skill.isActive ? (
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
                                onClick={() => void handleDelete(skill)}
                              >
                                <Trash size={15} className="mr-2" />
                                Xóa kỹ năng
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
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>
              trên tổng số <strong>{totalItems.toLocaleString()}</strong> kỹ năng
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

      {/* Dialog Thêm/Sửa kỹ năng */}
      <SkillFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        skill={editingSkill}
        categories={categories}
        onSuccess={() => {
          void refetchSkills();
          onStatsChange?.();
        }}
      />

      {/* Dialog Quản lý nhóm kỹ năng */}
      <SkillCategoriesDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        categories={categories}
        onRefresh={() => {
          void refetchCategories();
          void refetchSkills();
          onStatsChange?.();
        }}
      />
    </div>
  );
}
