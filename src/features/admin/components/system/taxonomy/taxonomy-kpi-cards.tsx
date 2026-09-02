"use client";

import { Briefcase, CheckCircle, Code, FolderSimple } from "@phosphor-icons/react";
import * as React from "react";

import type { TaxonomyStats } from "@/features/admin/api/taxonomy";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

interface TaxonomyKpiCardsProps {
  stats: TaxonomyStats | null;
  loading?: boolean;
}

export function TaxonomyKpiCards({ stats, loading }: TaxonomyKpiCardsProps) {
  const activePercent =
    stats && stats.totalSkills > 0
      ? Math.round((stats.activeSkills / stats.totalSkills) * 100)
      : 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Tổng kỹ năng chuẩn */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="truncate text-sm font-semibold whitespace-nowrap text-slate-700">
            Tổng kỹ năng chuẩn
          </CardTitle>
          <Code className="shrink-0 text-emerald-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-md" />
          ) : (
            <div className="truncate text-2xl font-extrabold text-slate-900">
              {(stats?.totalSkills ?? 0).toLocaleString()}
            </div>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">
            {stats ? `${stats.activeSkills} kỹ năng đang kích hoạt` : "Đang tải dữ liệu..."}
          </p>
        </CardContent>
      </Card>

      {/* 2. Nhóm chuyên môn */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="truncate text-sm font-semibold whitespace-nowrap text-slate-700">
            Nhóm kỹ năng
          </CardTitle>
          <FolderSimple className="shrink-0 text-blue-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16 rounded-md" />
          ) : (
            <div className="text-2xl font-extrabold text-slate-900">
              {stats?.totalSkillCategories ?? 0}
            </div>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">Frontend, Backend, AI, DevOps...</p>
        </CardContent>
      </Card>

      {/* 3. Ngành nghề tuyển dụng */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="truncate text-sm font-semibold whitespace-nowrap text-slate-700">
            Ngành nghề tuyển dụng
          </CardTitle>
          <Briefcase className="shrink-0 text-indigo-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16 rounded-md" />
          ) : (
            <div className="truncate text-2xl font-extrabold text-slate-900">
              {stats?.totalJobCategories ?? 0}
            </div>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">
            {stats
              ? `${stats.activeJobCategories} ngành nghề đang mở tuyển`
              : "Đang tải dữ liệu..."}
          </p>
        </CardContent>
      </Card>

      {/* 4. Tỷ lệ hoạt động */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="truncate text-sm font-semibold whitespace-nowrap text-slate-700">
            Tỷ lệ hoạt động
          </CardTitle>
          <CheckCircle className="shrink-0 text-teal-600" size={20} weight="bold" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20 rounded-md" />
          ) : (
            <div className="text-2xl font-extrabold text-slate-900">{activePercent}%</div>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">Sẵn sàng cho AI Matcher</p>
        </CardContent>
      </Card>
    </div>
  );
}
