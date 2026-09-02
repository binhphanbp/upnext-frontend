"use client";

import { CheckCircle, Clock, CurrencyCircleDollar, ReceiptX } from "@phosphor-icons/react";
import * as React from "react";

import type { AdminInvoiceStats } from "@/features/admin/api/invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

interface InvoiceKpiCardsProps {
  stats: AdminInvoiceStats | null;
  loading?: boolean;
}

export function InvoiceKpiCards({ stats, loading }: InvoiceKpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Tổng doanh thu */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="truncate text-sm font-semibold whitespace-nowrap text-slate-700">
            Tổng doanh thu
          </CardTitle>
          <CurrencyCircleDollar className="shrink-0 text-emerald-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-32 rounded-md" />
          ) : (
            <div className="truncate text-2xl font-extrabold text-slate-900">
              {formatVnd(stats?.totalRevenue ?? 0)}
            </div>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">
            {stats ? `${stats.paidCount} giao dịch thành công` : "Đang tải dữ liệu..."}
          </p>
        </CardContent>
      </Card>

      {/* 2. Hóa đơn thành công */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="truncate text-sm font-semibold whitespace-nowrap text-slate-700">
            Hóa đơn thành công
          </CardTitle>
          <CheckCircle className="shrink-0 text-blue-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20 rounded-md" />
          ) : (
            <div className="text-2xl font-extrabold text-slate-900">{stats?.paidCount ?? 0}</div>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">
            {stats && stats.totalCount > 0
              ? `Tỷ lệ ${Math.round((stats.paidCount / stats.totalCount) * 100)}% hoàn tất`
              : "Tỷ lệ 0%"}
          </p>
        </CardContent>
      </Card>

      {/* 3. Chờ thanh toán */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="truncate text-sm font-semibold whitespace-nowrap text-slate-700">
            Chờ thanh toán
          </CardTitle>
          <Clock className="shrink-0 text-amber-500" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-28 rounded-md" />
          ) : (
            <div className="truncate text-2xl font-extrabold text-slate-900">
              {stats?.pendingCount ?? 0}{" "}
              <span className="text-sm font-normal text-slate-500">
                ({formatVnd(stats?.pendingRevenue ?? 0)})
              </span>
            </div>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">Cần theo dõi xử lý</p>
        </CardContent>
      </Card>

      {/* 4. Hóa đơn đã hủy */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="truncate text-sm font-semibold whitespace-nowrap text-slate-700">
            Hóa đơn đã hủy
          </CardTitle>
          <ReceiptX className="shrink-0 text-rose-500" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20 rounded-md" />
          ) : (
            <div className="text-2xl font-extrabold text-slate-900">
              {(stats?.failedCount ?? 0).toLocaleString()}
            </div>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">Giao dịch đã hủy bỏ</p>
        </CardContent>
      </Card>
    </div>
  );
}
