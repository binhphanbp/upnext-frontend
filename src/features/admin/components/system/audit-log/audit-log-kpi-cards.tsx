"use client";

import { CalendarCheck, ChartBar, ListChecks, UsersThree } from "@phosphor-icons/react";
import * as React from "react";

import { formatAuditAction, type AdminAuditLogStats } from "@/features/admin/api/audit-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

interface AuditLogKpiCardsProps {
  stats: AdminAuditLogStats | null;
  loading?: boolean;
}

export function AuditLogKpiCards({ stats, loading }: AuditLogKpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Tổng số thao tác */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold whitespace-nowrap text-slate-700">
            Tổng lượt thao tác
          </CardTitle>
          <ListChecks className="shrink-0 text-emerald-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-md" />
          ) : (
            <div className="text-2xl font-extrabold text-slate-900">
              {(stats?.totalLogs ?? 0).toLocaleString()}
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Lưu vết an toàn toàn hệ thống</p>
        </CardContent>
      </Card>

      {/* 2. Thao tác hôm nay */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold whitespace-nowrap text-slate-700">
            Thao tác hôm nay
          </CardTitle>
          <CalendarCheck className="shrink-0 text-blue-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20 rounded-md" />
          ) : (
            <div className="text-2xl font-extrabold text-slate-900">
              {(stats?.todayLogs ?? 0).toLocaleString()}
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Phát sinh từ 00:00 hôm nay</p>
        </CardContent>
      </Card>

      {/* 3. Quản trị viên hoạt động */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold whitespace-nowrap text-slate-700">
            Admin hoạt động
          </CardTitle>
          <UsersThree className="shrink-0 text-amber-500" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20 rounded-md" />
          ) : (
            <div className="text-2xl font-extrabold text-slate-900">{stats?.activeAdmins ?? 0}</div>
          )}
          <p className="mt-1 text-xs text-slate-500">Trong 7 ngày gần nhất</p>
        </CardContent>
      </Card>

      {/* 4. Hành động phổ biến nhất */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold whitespace-nowrap text-slate-700">
            Hành động nổi bật
          </CardTitle>
          <ChartBar className="shrink-0 text-purple-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-28 rounded-md" />
          ) : (
            <div
              className="truncate text-lg font-bold text-slate-900"
              title={formatAuditAction(stats?.topAction)}
            >
              {formatAuditAction(stats?.topAction)}
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Thao tác được ghi nhận nhiều nhất</p>
        </CardContent>
      </Card>
    </div>
  );
}
