"use client";

import {
  ArrowsCounterClockwise,
  CheckCircle,
  Clock,
  DotsThree,
  DownloadSimple,
  Eye,
  MagnifyingGlass,
  Prohibit,
  ReceiptX,
} from "@phosphor-icons/react";
import * as React from "react";
import Swal from "sweetalert2";

import {
  getAdminInvoices,
  getAdminInvoiceStats,
  type AdminInvoiceItem,
  type AdminInvoiceStats,
  type AdminPaymentMethod,
  type AdminPaymentStatus,
} from "@/features/admin/api/invoices";
import { AdminTableLayout } from "@/features/admin/components/admin-table-layout";
import { getAdminSession } from "@/features/admin/session";
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

import { CancelInvoiceDialog } from "./cancel-invoice-dialog";
import { InvoiceDetailDialog } from "./invoice-detail-dialog";
import { InvoiceKpiCards } from "./invoice-kpi-cards";
import { ManualConfirmDialog } from "./manual-confirm-dialog";

function formatVnd(amountStr: string | number) {
  const amount = typeof amountStr === "string" ? parseFloat(amountStr) : amountStr;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(isoString: string | null) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: AdminPaymentStatus) {
  switch (status) {
    case "PAID":
      return (
        <Badge tone="success" className="gap-1 font-semibold">
          <CheckCircle size={13} weight="bold" /> Đã thanh toán
        </Badge>
      );
    case "PENDING":
      return (
        <Badge tone="warning" className="gap-1 font-semibold">
          <Clock size={13} weight="bold" /> Chờ thanh toán
        </Badge>
      );
    case "REFUNDED":
      return (
        <Badge tone="neutral" className="gap-1 font-semibold">
          <ReceiptX size={13} weight="bold" /> Đã hoàn tiền
        </Badge>
      );
    case "FAILED":
      return (
        <Badge tone="error" className="gap-1 font-semibold">
          <ReceiptX size={13} weight="bold" /> Đã hủy
        </Badge>
      );
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

export function TransactionsTable() {
  const [token, setToken] = React.useState<string>("");
  const [invoices, setInvoices] = React.useState<AdminInvoiceItem[]>([]);
  const [stats, setStats] = React.useState<AdminInvoiceStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);

  // Filters & Pagination
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<AdminPaymentStatus | "ALL">("ALL");
  const [methodFilter, setMethodFilter] = React.useState<AdminPaymentMethod | "ALL">("ALL");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  // Dialog states
  const [detailInvoice, setDetailInvoice] = React.useState<AdminInvoiceItem | null>(null);
  const [confirmInvoice, setConfirmInvoice] = React.useState<AdminInvoiceItem | null>(null);
  const [cancelInvoice, setCancelInvoice] = React.useState<AdminInvoiceItem | null>(null);

  // Retrieve token
  React.useEffect(() => {
    const session = getAdminSession();
    const t =
      session?.accessToken ||
      localStorage.getItem("upnext.admin.accessToken") ||
      localStorage.getItem("adminAccessToken") ||
      localStorage.getItem("accessToken") ||
      "";
    setToken(t);
  }, []);

  // Fetch KPI stats
  const fetchStats = React.useCallback(async () => {
    const session = getAdminSession();
    const activeToken =
      token || session?.accessToken || localStorage.getItem("upnext.admin.accessToken") || "";
    if (!activeToken) {
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    try {
      const res = await getAdminInvoiceStats(activeToken);
      setStats(res);
    } catch {
      // Ignored
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  // Fetch invoice list
  const fetchInvoices = React.useCallback(async () => {
    const session = getAdminSession();
    const activeToken =
      token || session?.accessToken || localStorage.getItem("upnext.admin.accessToken") || "";
    if (!activeToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getAdminInvoices(
        {
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          paymentStatus: statusFilter === "ALL" ? undefined : statusFilter,
          paymentMethod: methodFilter === "ALL" ? undefined : methodFilter,
        },
        activeToken,
      );
      setInvoices(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tải danh sách hóa đơn.";
      Swal.fire({
        icon: "error",
        title: "Lỗi kết nối",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, search, statusFilter, methodFilter]);

  React.useEffect(() => {
    fetchStats();
    fetchInvoices();
  }, [fetchStats, fetchInvoices]);

  const handleRefresh = () => {
    fetchStats();
    fetchInvoices();
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (invoices.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Không có dữ liệu",
        text: "Danh sách hiện tại đang trống.",
      });
      return;
    }

    const headers = [
      "Mã hóa đơn",
      "Doanh nghiệp",
      "Mã số thuế",
      "Gói dịch vụ",
      "Số tiền (VNĐ)",
      "Phương thức",
      "Trạng thái",
      "Mã đối soát",
      "Ngày tạo",
      "Ngày thanh toán",
    ];

    const rows = invoices.map((inv) => [
      `"${inv.invoiceCode}"`,
      `"${inv.company?.name || ""}"`,
      `"${inv.company?.taxCode || ""}"`,
      `"${inv.subscriptionPlan?.subscriptionName || ""}"`,
      inv.amount,
      `"${inv.paymentMethod || ""}"`,
      `"${inv.paymentStatus}"`,
      `"${inv.paymentReference || ""}"`,
      `"${formatDate(inv.createdAt)}"`,
      `"${formatDate(inv.paidAt)}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `upnext-invoices-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Official KPI Cards */}
      <InvoiceKpiCards stats={stats} loading={statsLoading} />

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
                placeholder="Tìm theo mã HĐ, tên cty, MST..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as AdminPaymentStatus | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[170px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="PAID">Đã thanh toán</SelectItem>
                <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                <SelectItem value="FAILED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={methodFilter}
              onValueChange={(v) => {
                setMethodFilter(v as AdminPaymentMethod | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[170px]">
                <SelectValue placeholder="Tất cả cổng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả cổng</SelectItem>
                <SelectItem value="SEPAY">Chuyển khoản (SePay)</SelectItem>
                <SelectItem value="STRIPE">Thẻ quốc tế (Stripe)</SelectItem>
                <SelectItem value="MOMO">MoMo</SelectItem>
                <SelectItem value="PAYPAL">PayPal</SelectItem>
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
              Mã hóa đơn
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Doanh nghiệp & MST
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Gói dịch vụ
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-right font-semibold text-slate-800 last:border-r-0">
              Số tiền
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Phương thức
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Trạng thái
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-left font-semibold text-slate-800 last:border-r-0">
              Thời gian
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-center font-semibold text-slate-800 last:border-r-0">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-slate-400">
                Không tìm thấy hóa đơn nào phù hợp với bộ lọc.
              </td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <tr key={inv.id} className="transition-colors hover:bg-slate-50">
                {/* Mã HĐ */}
                <td className="border-r border-slate-200 px-4 py-3 font-mono font-bold text-slate-900 last:border-r-0">
                  {inv.invoiceCode}
                  {inv.paymentReference ? (
                    <span className="block text-[11px] font-normal text-slate-400">
                      Ref: {inv.paymentReference}
                    </span>
                  ) : null}
                </td>

                {/* Công ty */}
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <p className="font-semibold text-slate-900">{inv.company?.name}</p>
                  <p className="font-mono text-xs text-slate-400">
                    MST: {inv.company?.taxCode || "Chưa cập nhật"}
                  </p>
                </td>

                {/* Gói dịch vụ */}
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                    {inv.subscriptionPlan?.subscriptionName}
                  </span>
                </td>

                {/* Số tiền */}
                <td className="border-r border-slate-200 px-4 py-3 text-right font-mono font-bold text-emerald-700 last:border-r-0">
                  {formatVnd(inv.amount)}
                </td>

                {/* Phương thức */}
                <td className="border-r border-slate-200 px-4 py-3 text-xs font-medium text-slate-700 uppercase last:border-r-0">
                  {inv.paymentMethod || "—"}
                </td>

                {/* Trạng thái */}
                <td className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                  {getStatusBadge(inv.paymentStatus)}
                </td>

                {/* Thời gian */}
                <td className="border-r border-slate-200 px-4 py-3 text-xs text-slate-600 last:border-r-0">
                  <p>{formatDate(inv.createdAt)}</p>
                  {inv.paidAt ? (
                    <p className="text-[11px] text-emerald-600">Trả: {formatDate(inv.paidAt)}</p>
                  ) : null}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-500 hover:text-slate-800"
                      >
                        <DotsThree size={20} weight="bold" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Thao tác hóa đơn</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => setDetailInvoice(inv)}
                        className="cursor-pointer gap-2 text-xs font-semibold"
                      >
                        <Eye size={16} className="text-slate-500" />
                        Xem chi tiết & In HĐ
                      </DropdownMenuItem>

                      {inv.paymentStatus === "PENDING" ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => setConfirmInvoice(inv)}
                            className="cursor-pointer gap-2 text-xs font-semibold text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                          >
                            <CheckCircle size={16} />
                            Duyệt thanh toán tay
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setCancelInvoice(inv)}
                            className="cursor-pointer gap-2 text-xs font-semibold text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                          >
                            <Prohibit size={16} />
                            Hủy hóa đơn
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTableLayout>

      {/* 3. Modals */}
      <InvoiceDetailDialog
        invoice={detailInvoice}
        open={Boolean(detailInvoice)}
        onOpenChange={(open) => {
          if (!open) setDetailInvoice(null);
        }}
      />

      <ManualConfirmDialog
        invoice={confirmInvoice}
        open={Boolean(confirmInvoice)}
        onOpenChange={(open) => {
          if (!open) setConfirmInvoice(null);
        }}
        token={token}
        onSuccess={handleRefresh}
      />

      <CancelInvoiceDialog
        invoice={cancelInvoice}
        open={Boolean(cancelInvoice)}
        onOpenChange={(open) => {
          if (!open) setCancelInvoice(null);
        }}
        token={token}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
