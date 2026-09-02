"use client";

import {
  ArrowsCounterClockwise,
  DownloadSimple,
  Eye,
  MagnifyingGlass,
  User,
} from "@phosphor-icons/react";
import * as React from "react";
import Swal from "sweetalert2";

import {
  formatAuditAction,
  formatAuditTarget,
  getAdminAuditLogs,
  getAdminAuditLogStats,
  getAdminAuditLogFilterOptions,
  type AdminAuditLogItem,
  type AdminAuditLogStats,
  type AdminAuditLogFilterOptions,
} from "@/features/admin/api/audit-logs";
import { AdminTableLayout } from "@/features/admin/components/admin-table-layout";
import { getAdminSession } from "@/features/admin/session";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

import { AuditLogDetailDialog } from "./audit-log-detail-dialog";
import { AuditLogKpiCards } from "./audit-log-kpi-cards";

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

function getActionBadge(action: string) {
  const label = formatAuditAction(action);
  let tone: "brand" | "success" | "info" | "error" | "neutral" = "neutral";
  if (action.startsWith("INVOICE_") || action.includes("PAYMENT")) {
    tone = "brand";
  } else if (
    action.startsWith("CREATE_") ||
    action.startsWith("APPROVE_") ||
    action.startsWith("VERIFY_")
  ) {
    tone = "success";
  } else if (
    action.startsWith("UPDATE_") ||
    action.startsWith("ASSIGN_") ||
    action.startsWith("VIEW_")
  ) {
    tone = "info";
  } else if (
    action.startsWith("LOCK_") ||
    action.startsWith("REJECT_") ||
    action.startsWith("CANCEL_") ||
    action.startsWith("DELETE_")
  ) {
    tone = "error";
  }

  return (
    <Badge tone={tone} className="text-xs font-semibold" title={action}>
      {label}
    </Badge>
  );
}

export function AuditLogTable() {
  const [token, setToken] = React.useState<string>("");
  const [logs, setLogs] = React.useState<AdminAuditLogItem[]>([]);
  const [stats, setStats] = React.useState<AdminAuditLogStats | null>(null);
  const [filterOptions, setFilterOptions] = React.useState<AdminAuditLogFilterOptions | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);

  // Filters & Pagination
  const [search, setSearch] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("ALL");
  const [targetTypeFilter, setTargetTypeFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  // Detail Modal
  const [selectedLog, setSelectedLog] = React.useState<AdminAuditLogItem | null>(null);

  // Read admin token
  React.useEffect(() => {
    const session = getAdminSession();
    const t =
      session?.accessToken ||
      localStorage.getItem("upnext.admin.accessToken") ||
      localStorage.getItem("adminAccessToken") ||
      "";
    setToken(t);
  }, []);

  // Fetch KPI stats & filter options
  const fetchMetadata = React.useCallback(async () => {
    const session = getAdminSession();
    const activeToken =
      token || session?.accessToken || localStorage.getItem("upnext.admin.accessToken") || "";
    if (!activeToken) {
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    try {
      const [statsRes, optionsRes] = await Promise.all([
        getAdminAuditLogStats(activeToken),
        getAdminAuditLogFilterOptions(activeToken),
      ]);
      setStats(statsRes);
      setFilterOptions(optionsRes);
    } catch {
      // Ignored
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  // Fetch audit log records
  const fetchLogs = React.useCallback(async () => {
    const session = getAdminSession();
    const activeToken =
      token || session?.accessToken || localStorage.getItem("upnext.admin.accessToken") || "";
    if (!activeToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getAdminAuditLogs(
        {
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          action: actionFilter === "ALL" ? undefined : actionFilter,
          targetType: targetTypeFilter === "ALL" ? undefined : targetTypeFilter,
        },
        activeToken,
      );
      setLogs(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tải danh sách nhật ký.";
      Swal.fire({
        icon: "error",
        title: "Lỗi kết nối",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, search, actionFilter, targetTypeFilter]);

  React.useEffect(() => {
    fetchMetadata();
    fetchLogs();
  }, [fetchMetadata, fetchLogs]);

  const handleRefresh = () => {
    fetchMetadata();
    fetchLogs();
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (logs.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Không có dữ liệu",
        text: "Danh sách hiện tại đang trống để xuất.",
      });
      return;
    }

    const headers = [
      "Mã log",
      "Thời gian",
      "Quản trị viên",
      "Email Admin",
      "Vai trò Admin",
      "Hành động",
      "Loại thực thể",
      "Mã thực thể (Target ID)",
      "Địa chỉ IP",
      "User Agent",
    ];

    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${formatDate(l.createdAt)}"`,
      `"${l.admin?.fullName || "Hệ thống"}"`,
      `"${l.admin?.email || ""}"`,
      `"${l.admin?.role?.roleName || ""}"`,
      `"${l.action}"`,
      `"${l.targetType || "SYSTEM"}"`,
      `"${l.targetId || ""}"`,
      `"${l.ipAddress || ""}"`,
      `"${(l.userAgent || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `upnext-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Official KPI Cards */}
      <AuditLogKpiCards stats={stats} loading={statsLoading} />

      {/* 2. AdminTableLayout */}
      <AdminTableLayout
        loading={loading}
        totalItems={total}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        filterBar={
          <>
            <div className="relative w-full sm:w-[320px]">
              <MagnifyingGlass
                className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                className="border-input focus:border-primary h-10 w-full rounded-xl border bg-white pl-10 text-sm shadow-none focus:outline-none"
                placeholder="Tìm admin, hành động, IP, target ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[220px]">
                <SelectValue placeholder="Tất cả hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả hành động</SelectItem>
                {filterOptions?.actions.map((act) => (
                  <SelectItem key={act} value={act}>
                    {formatAuditAction(act)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={targetTypeFilter}
              onValueChange={(v) => {
                setTargetTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
                <SelectValue placeholder="Tất cả thực thể" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả thực thể</SelectItem>
                {filterOptions?.targetTypes.map((tgt) => (
                  <SelectItem key={tgt} value={tgt}>
                    {formatAuditTarget(tgt)}
                  </SelectItem>
                ))}
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
              aria-label="Làm mới nhật ký"
            >
              <ArrowsCounterClockwise size={18} />
            </Button>
            <Button
              variant="outline"
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border-emerald-600 px-4 font-semibold text-emerald-600 shadow-none transition-all hover:bg-emerald-50/50"
              onClick={handleExportCsv}
            >
              <DownloadSimple size={18} />
              <span>Xuất Excel</span>
            </Button>
          </>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 !bg-[#bfe9d6]">
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Thời gian & Mã ID
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Quản trị viên
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Hành động
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Đối tượng tác động
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Địa chỉ IP
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-center font-semibold text-slate-800 last:border-r-0">
              Chi tiết
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-slate-400">
                Không tìm thấy bản ghi nhật ký nào phù hợp.
              </td>
            </tr>
          ) : (
            logs.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                {/* Thời gian */}
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <p className="text-xs font-semibold text-slate-900">
                    {formatDate(item.createdAt)}
                  </p>
                  <p
                    className="max-w-[140px] truncate font-mono text-[11px] text-slate-400"
                    title={item.id}
                  >
                    {item.id.slice(0, 13)}...
                  </p>
                </td>

                {/* Quản trị viên */}
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <User size={14} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {item.admin?.fullName || "Hệ thống tự động"}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {item.admin?.email || "system_cron"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Hành động */}
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  {getActionBadge(item.action)}
                </td>

                {/* Đối tượng tác động */}
                <td className="border-r border-slate-200 px-4 py-3 text-xs last:border-r-0">
                  <span className="block font-semibold text-slate-800">
                    {formatAuditTarget(item.targetType)}
                  </span>
                  {item.targetId ? (
                    <span
                      className="block max-w-[150px] truncate font-mono text-[10px] text-slate-400"
                      title={item.targetId}
                    >
                      Mã: {item.targetId.slice(0, 13)}...
                    </span>
                  ) : null}
                </td>

                {/* IP Address */}
                <td className="border-r border-slate-200 px-4 py-3 font-mono text-xs text-slate-600 last:border-r-0">
                  {item.ipAddress || "—"}
                </td>

                {/* Chi tiết */}
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(item)}
                    className="h-8 gap-1.5 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    <Eye size={16} weight="bold" />
                    <span>Xem Diff</span>
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTableLayout>

      {/* 3. Detail Dialog */}
      <AuditLogDetailDialog
        log={selectedLog}
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />
    </div>
  );
}
