"use client";

import {
  DotsThree,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Shield,
  Trash,
} from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
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

import type { AdminRole } from "../../../api/roles";
import { deleteAdminRole, getAdminRoles } from "../../../api/roles";
import { AdminPermissionGate } from "../../../hooks/use-admin-permission";
import { getAdminSession } from "../../../session";
import { RoleEditorDialog } from "./role-editor-dialog";

export function RolesTable() {
  const [roles, setRoles] = React.useState<AdminRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  // Dialog states
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<AdminRole | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<AdminRole | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchRoles = React.useCallback(async () => {
    const session = getAdminSession();
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getAdminRoles(session.accessToken);
      setRoles(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không thể tải danh sách vai trò");
      toast.error("Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (role: AdminRole) => {
    setSelectedRole(role);
    setEditorOpen(true);
  };

  const handleOpenDelete = (role: AdminRole) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    const session = getAdminSession();
    if (!session?.accessToken) return;

    setIsDeleting(true);
    try {
      await deleteAdminRole(session.accessToken, roleToDelete.id);
      toast.success(`Đã xóa vai trò "${roleToDelete.roleName}"`);
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa vai trò này");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredData = React.useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        searchTerm === "" ||
        role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.roleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || role.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "SYSTEM" && role.isSystem) ||
        (typeFilter === "CUSTOM" && !role.isSystem);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [roles, searchTerm, statusFilter, typeFilter]);

  const columns = React.useMemo<ColumnDef<AdminRole>[]>(
    () => [
      {
        accessorKey: "roleName",
        header: "Tên vai trò",
        cell: ({ row }) => {
          const role = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground flex items-center gap-1.5 font-semibold">
                {role.roleName}
                {role.isSystem && <Shield size={14} className="text-primary" weight="fill" />}
              </span>
              <span className="text-muted-foreground font-mono text-xs">{role.roleCode}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Mô tả",
        cell: ({ row }) => (
          <span className="text-muted-foreground line-clamp-2 max-w-[320px] text-sm">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        accessorKey: "isSystem",
        header: "Loại vai trò",
        cell: ({ row }) => {
          const isSystem = row.original.isSystem;
          return isSystem ? (
            <Badge tone="brand">Hệ thống</Badge>
          ) : (
            <Badge tone="neutral">Tùy chỉnh</Badge>
          );
        },
      },
      {
        accessorKey: "adminsCount",
        header: "Quản trị viên",
        cell: ({ row }) => (
          <span className="text-foreground font-medium">{row.original.adminsCount} người</span>
        ),
      },
      {
        accessorKey: "permissionsCount",
        header: "Quyền hạn",
        cell: ({ row }) => <Badge tone="neutral">{row.original.permissionsCount || 0} quyền</Badge>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const status = row.original.status;
          return status === "ACTIVE" ? (
            <Badge tone="success">Kích hoạt</Badge>
          ) : (
            <Badge tone="neutral">Vô hiệu hóa</Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Thao tác</span>,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <DotsThree className="h-4 w-4" weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                <AdminPermissionGate permission="roles:write">
                  <DropdownMenuItem onClick={() => handleOpenEdit(role)}>
                    <PencilSimple className="mr-2 h-4 w-4" />
                    Chỉnh sửa & Phân quyền
                  </DropdownMenuItem>
                  {!role.isSystem && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleOpenDelete(role)}
                        disabled={role.adminsCount > 0}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Xóa vai trò
                      </DropdownMenuItem>
                    </>
                  )}
                </AdminPermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex w-full flex-1 flex-wrap items-center gap-2.5 sm:w-auto">
          <div className="relative w-full sm:w-72">
            <MagnifyingGlass className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Tìm theo tên hoặc mã vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Kích hoạt</SelectItem>
              <SelectItem value="INACTIVE">Vô hiệu hóa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Loại vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="SYSTEM">Hệ thống</SelectItem>
              <SelectItem value="CUSTOM">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AdminPermissionGate permission="roles:write">
          <Button variant="primary" onClick={handleOpenCreate} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" weight="bold" />
            Tạo vai trò mới
          </Button>
        </AdminPermissionGate>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="bg-card flex flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRoles}>
            Thử lại
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredData} />
      )}

      {/* Create / Edit Role Dialog */}
      <RoleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        role={selectedRole}
        onSuccess={fetchRoles}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa vai trò</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa vai trò{" "}
              <strong className="text-foreground">{roleToDelete?.roleName}</strong>? Thao tác này sẽ
              lưu trữ vai trò và không thể hoàn tác nếu không có quyền khôi phục.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
