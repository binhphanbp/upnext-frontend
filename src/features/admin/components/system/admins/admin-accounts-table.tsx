"use client";

import {
  DotsThree,
  Key,
  Lock,
  LockOpen,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Shield,
  Trash,
  User,
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

import type { AdminAccount } from "../../../api/admin-users";
import {
  deleteAdminAccount,
  getAdminAccounts,
  lockAdminAccount,
  unlockAdminAccount,
} from "../../../api/admin-users";
import type { AdminRole } from "../../../api/roles";
import { getAdminRoles } from "../../../api/roles";
import { AdminPermissionGate } from "../../../hooks/use-admin-permission";
import { getAdminSession } from "../../../session";
import { AddAdminDialog } from "./add-admin-dialog";
import { EditAdminDialog } from "./edit-admin-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

export function AdminAccountsTable() {
  const [accounts, setAccounts] = React.useState<AdminAccount[]>([]);
  const [roles, setRoles] = React.useState<AdminRole[]>([]);
  const [meta, setMeta] = React.useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);

  // Dialog States
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [resetPwdOpen, setResetPwdOpen] = React.useState(false);
  const [selectedAdmin, setSelectedAdmin] = React.useState<AdminAccount | null>(null);

  // Confirmation dialogs
  const [actionModal, setActionModal] = React.useState<{
    type: "LOCK" | "UNLOCK" | "DELETE";
    admin: AdminAccount;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = React.useState(false);

  // Fetch roles for filter and forms
  React.useEffect(() => {
    const session = getAdminSession();
    if (session?.accessToken) {
      getAdminRoles(session.accessToken)
        .then((data) => setRoles(data))
        .catch(console.error);
    }
  }, []);

  const fetchAccounts = React.useCallback(async () => {
    const session = getAdminSession();
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAccounts(session.accessToken, {
        page,
        limit: 20,
        q: searchTerm.trim() || undefined,
        roleId: roleFilter !== "ALL" ? roleFilter : undefined,
        status:
          statusFilter !== "ALL" ? (statusFilter as "ACTIVE" | "INACTIVE" | "LOCKED") : undefined,
      });

      setAccounts(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không thể tải danh sách tài khoản quản trị");
      toast.error("Không thể tải danh sách tài khoản quản trị");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter]);

  React.useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleActionConfirm = async () => {
    if (!actionModal) return;
    const session = getAdminSession();
    if (!session?.accessToken) return;

    setIsProcessingAction(true);
    try {
      const { type, admin } = actionModal;
      if (type === "LOCK") {
        await lockAdminAccount(session.accessToken, admin.id);
        toast.success(`Đã khóa tài khoản "${admin.fullName}"`);
      } else if (type === "UNLOCK") {
        await unlockAdminAccount(session.accessToken, admin.id);
        toast.success(`Đã mở khóa tài khoản "${admin.fullName}"`);
      } else if (type === "DELETE") {
        await deleteAdminAccount(session.accessToken, admin.id);
        toast.success(`Đã xóa tài khoản "${admin.fullName}"`);
      }

      setActionModal(null);
      fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || "Thao tác không thành công");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const columns = React.useMemo<ColumnDef<AdminAccount>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Quản trị viên",
        cell: ({ row }) => {
          const admin = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {admin.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(-2)
                  .join("")
                  .toUpperCase() || <User size={16} />}
              </div>
              <div className="flex flex-col">
                <span className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
                  {admin.fullName}
                  {admin.role?.roleCode === "SUPER_ADMIN" && (
                    <Shield size={14} className="text-primary" weight="fill" />
                  )}
                </span>
                <span className="text-muted-foreground text-xs">{admin.email}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Số điện thoại",
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-sm">
            {row.original.phone || "—"}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: "Vai trò",
        cell: ({ row }) => {
          const role = row.original.role;
          if (!role) return <span className="text-muted-foreground text-xs">—</span>;

          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground text-sm font-medium">{role.roleName}</span>
              <span className="text-muted-foreground font-mono text-[11px]">{role.roleCode}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === "ACTIVE") {
            return <Badge tone="success">Kích hoạt</Badge>;
          }
          if (status === "LOCKED") {
            return <Badge tone="error">Tạm khóa</Badge>;
          }
          return <Badge tone="neutral">Vô hiệu hóa</Badge>;
        },
      },
      {
        accessorKey: "lastLoginAt",
        header: "Đăng nhập cuối",
        cell: ({ row }) => {
          const lastLogin = row.original.lastLoginAt;
          if (!lastLogin)
            return <span className="text-muted-foreground text-xs">Chưa đăng nhập</span>;

          return (
            <span className="text-muted-foreground text-xs">
              {new Date(lastLogin).toLocaleString("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Thao tác</span>,
        cell: ({ row }) => {
          const admin = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <DotsThree className="h-4 w-4" weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                <AdminPermissionGate permission="admins:write">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAdmin(admin);
                      setEditOpen(true);
                    }}
                  >
                    <PencilSimple className="mr-2 h-4 w-4" />
                    Chỉnh sửa thông tin
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAdmin(admin);
                      setResetPwdOpen(true);
                    }}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Đặt lại mật khẩu
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {admin.status === "ACTIVE" ? (
                    <DropdownMenuItem
                      onClick={() => setActionModal({ type: "LOCK", admin })}
                      className="text-amber-600 focus:text-amber-600"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Khóa tài khoản
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => setActionModal({ type: "UNLOCK", admin })}
                      className="text-emerald-600 focus:text-emerald-600"
                    >
                      <LockOpen className="mr-2 h-4 w-4" />
                      Mở khóa tài khoản
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => setActionModal({ type: "DELETE", admin })}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Xóa tài khoản
                  </DropdownMenuItem>
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
              placeholder="Tìm theo tên, email, sđt..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9"
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Tất cả vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.roleName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Kích hoạt</SelectItem>
              <SelectItem value="LOCKED">Tạm khóa</SelectItem>
              <SelectItem value="INACTIVE">Vô hiệu hóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AdminPermissionGate permission="admins:write">
          <Button variant="primary" onClick={() => setAddOpen(true)} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" weight="bold" />
            Thêm quản trị viên
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
          <Button variant="outline" size="sm" onClick={fetchAccounts}>
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable columns={columns} data={accounts} />

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground text-xs">
                Hiển thị {accounts.length} trên tổng số {meta.total} tài khoản
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Trang trước
                </Button>
                <span className="text-xs font-medium">
                  {page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AddAdminDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        roles={roles}
        onSuccess={fetchAccounts}
      />

      <EditAdminDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        admin={selectedAdmin}
        roles={roles}
        onSuccess={fetchAccounts}
      />

      <ResetPasswordDialog
        open={resetPwdOpen}
        onOpenChange={setResetPwdOpen}
        admin={selectedAdmin}
        onSuccess={fetchAccounts}
      />

      {/* Action Confirmation Modal */}
      <Dialog open={Boolean(actionModal)} onOpenChange={(open) => !open && setActionModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionModal?.type === "LOCK"
                ? "Xác nhận khóa tài khoản"
                : actionModal?.type === "UNLOCK"
                  ? "Xác nhận mở khóa tài khoản"
                  : "Xác nhận xóa tài khoản"}
            </DialogTitle>
            <DialogDescription>
              {actionModal?.type === "LOCK" && (
                <>
                  Bạn có chắc chắn muốn khóa tài khoản{" "}
                  <strong className="text-foreground">{actionModal.admin.fullName}</strong>? Quản
                  trị viên này sẽ lập tức bị đăng xuất và không thể truy cập hệ thống.
                </>
              )}
              {actionModal?.type === "UNLOCK" && (
                <>
                  Bạn có chắc chắn muốn mở khóa cho tài khoản{" "}
                  <strong className="text-foreground">{actionModal.admin.fullName}</strong>? Quản
                  trị viên sẽ có thể đăng nhập lại bình thường.
                </>
              )}
              {actionModal?.type === "DELETE" && (
                <>
                  Bạn có chắc chắn muốn xóa tài khoản{" "}
                  <strong className="text-foreground">{actionModal.admin.fullName}</strong>? Thao
                  tác này sẽ lưu trữ tài khoản và thu hồi toàn bộ quyền truy cập.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionModal(null)}
              disabled={isProcessingAction}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant={actionModal?.type === "UNLOCK" ? "primary" : "destructive"}
              onClick={handleActionConfirm}
              disabled={isProcessingAction}
            >
              {isProcessingAction
                ? "Đang xử lý..."
                : actionModal?.type === "UNLOCK"
                  ? "Mở khóa"
                  : actionModal?.type === "LOCK"
                    ? "Khóa tài khoản"
                    : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
