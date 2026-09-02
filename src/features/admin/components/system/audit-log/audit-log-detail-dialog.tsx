"use client";

import {
  ArrowsLeftRight,
  DeviceMobile,
  Globe,
  IdentificationCard,
  Target,
  User,
} from "@phosphor-icons/react";
import * as React from "react";

import type { AdminAuditLogItem } from "@/features/admin/api/audit-logs";
import { formatAuditAction, formatAuditTarget } from "@/features/admin/api/audit-logs";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

function formatDate(isoString: string | null) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface AuditLogDetailDialogProps {
  log: AdminAuditLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailDialog({ log, open, onOpenChange }: AuditLogDetailDialogProps) {
  if (!log) return null;

  const oldKeys = log.oldValue && typeof log.oldValue === "object" ? Object.keys(log.oldValue) : [];
  const newKeys = log.newValue && typeof log.newValue === "object" ? Object.keys(log.newValue) : [];
  const allKeys = Array.from(new Set([...oldKeys, ...newKeys]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-[720px]">
        {/* 1. Header */}
        <DialogHeader className="border-b border-slate-200 px-6 py-4 pr-14">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Chi tiết Bản ghi Nhật ký Hệ thống
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Mã log: <span className="font-mono font-bold text-slate-700">{log.id}</span> • Thời
                gian:{" "}
                <span className="font-semibold text-slate-700">{formatDate(log.createdAt)}</span>
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center">
              <Badge tone="brand" className="text-xs font-semibold">
                {formatAuditAction(log.action)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 p-6 text-xs text-slate-800">
          {/* 2. Admin & Target Information Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Admin Info */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <User size={16} weight="bold" className="text-emerald-600" />
                <span>Quản trị viên thực hiện</span>
              </div>
              <div className="space-y-1 pl-5">
                <p className="font-semibold text-slate-900">
                  {log.admin?.fullName || "Hệ thống tự động"}
                </p>
                <p className="font-mono text-[11px] text-slate-500">
                  {log.admin?.email || "system_cron"}
                </p>
                {log.admin?.role ? (
                  <Badge tone="neutral" className="mt-1 text-[10px]">
                    {log.admin.role.roleName}
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Target Info */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Target size={16} weight="bold" className="text-blue-600" />
                <span>Đối tượng tác động</span>
              </div>
              <div className="space-y-1 pl-5">
                <p className="font-semibold text-slate-900">
                  Loại thực thể:{" "}
                  <span className="font-bold text-blue-700">
                    {formatAuditTarget(log.targetType)}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Mã đối tượng:{" "}
                  <span className="font-mono font-bold text-slate-700">{log.targetId || "—"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 3. Context (IP & User Agent) */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Globe size={16} weight="bold" className="text-amber-600" />
              <span>Môi trường mạng & Thiết bị</span>
            </div>
            <div className="grid gap-2 pl-5 sm:grid-cols-2">
              <div>
                <span className="text-slate-500">Địa chỉ IP: </span>
                <span className="font-mono font-bold text-slate-800">{log.ipAddress || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500">Request ID: </span>
                <span className="font-mono text-slate-700">{log.requestId || "—"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500">User Agent: </span>
                <span className="font-mono text-[11px] break-all text-slate-600">
                  {log.userAgent || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Changeset / Diff Viewer */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <ArrowsLeftRight size={16} weight="bold" className="text-purple-600" />
              <span>Biến động dữ liệu (Changeset / Diff)</span>
            </div>

            {allKeys.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-400">
                Bản ghi không ghi nhận giá trị biến động payload.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100/90 text-xs font-bold text-slate-700">
                  <div className="border-r border-slate-200 p-2.5">Dữ liệu ban đầu (Old Value)</div>
                  <div className="p-2.5">Dữ liệu sau thay đổi (New Value)</div>
                </div>
                <div className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                  {allKeys.map((key) => {
                    const oldVal = log.oldValue ? log.oldValue[key] : undefined;
                    const newVal = log.newValue ? log.newValue[key] : undefined;
                    const isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                    return (
                      <div key={key} className="grid grid-cols-2">
                        {/* Old value column */}
                        <div
                          className={`border-r border-slate-200 p-2.5 break-all ${
                            isDifferent && oldVal !== undefined
                              ? "bg-rose-50/50 text-rose-900"
                              : "text-slate-600"
                          }`}
                        >
                          <span className="block font-sans text-xs font-semibold text-slate-800">
                            {key}:
                          </span>
                          {oldVal !== undefined ? JSON.stringify(oldVal, null, 2) : "—"}
                        </div>

                        {/* New value column */}
                        <div
                          className={`p-2.5 break-all ${
                            isDifferent && newVal !== undefined
                              ? "bg-emerald-50/50 font-bold text-emerald-900"
                              : "text-slate-600"
                          }`}
                        >
                          <span className="block font-sans text-xs font-semibold text-slate-800">
                            {key}:
                          </span>
                          {newVal !== undefined ? JSON.stringify(newVal, null, 2) : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Footer */}
        <DialogFooter className="sticky bottom-0 flex items-center justify-end border-t border-slate-200 bg-slate-50/95 px-6 py-3 backdrop-blur-xs sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
