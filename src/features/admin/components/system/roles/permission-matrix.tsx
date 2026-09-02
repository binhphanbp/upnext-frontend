"use client";

import * as React from "react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";

import type { AdminPermission } from "../../../api/permissions";

const MODULE_NAMES: Record<string, string> = {
  jobs: "Tin tuyển dụng",
  companies: "Doanh nghiệp",
  users: "Người dùng & Tài khoản",
  moderation: "Kiểm duyệt & Báo cáo",
  content: "Bài viết & Đánh giá",
  billing: "Gói cước & Thanh toán",
  support: "Trung tâm Hỗ trợ (CSKH)",
  system: "Hệ thống & Phân quyền",
};

export type PermissionMatrixProps = {
  permissions: AdminPermission[];
  selectedPermissionIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function PermissionMatrix({
  permissions,
  selectedPermissionIds,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  // Group permissions by module
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, AdminPermission[]> = {};
    for (const perm of permissions) {
      const mod = perm.module || "other";
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(perm);
    }
    return groups;
  }, [permissions]);

  const allPermissionIds = React.useMemo(() => permissions.map((p) => p.id), [permissions]);

  const isAllSelected =
    allPermissionIds.length > 0 &&
    allPermissionIds.every((id) => selectedPermissionIds.includes(id));

  const handleSelectAll = () => {
    if (disabled) return;
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allPermissionIds);
    }
  };

  const handleToggleModule = (modulePerms: AdminPermission[]) => {
    if (disabled) return;
    const modIds = modulePerms.map((p) => p.id);
    const areAllInModuleSelected = modIds.every((id) => selectedPermissionIds.includes(id));

    if (areAllInModuleSelected) {
      // Unselect this module
      onChange(selectedPermissionIds.filter((id) => !modIds.includes(id)));
    } else {
      // Select all in this module
      const combined = Array.from(new Set([...selectedPermissionIds, ...modIds]));
      onChange(combined);
    }
  };

  const handleToggleSingle = (permId: string) => {
    if (disabled) return;
    if (selectedPermissionIds.includes(permId)) {
      onChange(selectedPermissionIds.filter((id) => id !== permId));
    } else {
      onChange([...selectedPermissionIds, permId]);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-semibold">Danh mục Quyền hạn</span>
          <Badge tone="neutral">
            {selectedPermissionIds.length}/{permissions.length} quyền đã chọn
          </Badge>
        </div>
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
            {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả hệ thống"}
          </Button>
        )}
      </div>

      {/* Modules List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Object.entries(groupedPermissions).map(([modKey, modPerms]) => {
          const modIds = modPerms.map((p) => p.id);
          const selectedInModCount = modIds.filter((id) =>
            selectedPermissionIds.includes(id),
          ).length;

          const isModAllSelected = selectedInModCount === modIds.length && modIds.length > 0;
          const isModIndeterminate = selectedInModCount > 0 && selectedInModCount < modIds.length;

          return (
            <div
              key={modKey}
              className="border-border bg-card/60 flex flex-col rounded-xl border p-4 shadow-xs"
            >
              {/* Module Header */}
              <div className="border-border/60 mb-3 flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`mod-${modKey}`}
                    checked={isModAllSelected ? true : isModIndeterminate ? "indeterminate" : false}
                    onCheckedChange={() => handleToggleModule(modPerms)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`mod-${modKey}`}
                    className="text-foreground cursor-pointer text-sm font-bold"
                  >
                    {MODULE_NAMES[modKey] || modKey}
                  </Label>
                </div>
                <span className="text-muted-foreground text-xs font-medium">
                  {selectedInModCount}/{modPerms.length}
                </span>
              </div>

              {/* Module Permissions */}
              <div className="flex flex-col gap-2.5">
                {modPerms.map((perm) => {
                  const isChecked = selectedPermissionIds.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      className="hover:bg-accent/40 flex items-start gap-2.5 rounded-lg p-1.5 transition-colors"
                    >
                      <Checkbox
                        id={`perm-${perm.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleSingle(perm.id)}
                        disabled={disabled}
                        className="mt-0.5"
                      />
                      <div className="flex flex-col gap-0.5">
                        <Label
                          htmlFor={`perm-${perm.id}`}
                          className="text-foreground flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
                        >
                          {perm.permissionName}
                          <span className="text-muted-foreground bg-muted py-0.2 rounded px-1.5 font-mono text-[10px]">
                            {perm.permissionCode}
                          </span>
                        </Label>
                        {perm.description && (
                          <p className="text-muted-foreground text-[11px] leading-tight">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
