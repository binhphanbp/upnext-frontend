"use client";

import {
  Briefcase,
  CurrencyCircleDollar,
  ShieldCheck,
  TrendDown,
  TrendUp,
  Users,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import type { AdminDashboardSummary } from "../../api/dashboard";

export function StatCards({ stats }: { stats?: AdminDashboardSummary | undefined }) {
  const t = useTranslations("Admin.dashboard");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const renderPercent = (percent?: number) => {
    if (percent === undefined || percent === null) return null;
    const isPositive = percent > 0;
    const isZero = percent === 0;
    const Icon = isPositive ? TrendUp : TrendDown;

    if (isZero) return null;

    return (
      <span className={cn("mr-1 flex items-center", isPositive ? "text-success" : "text-error")}>
        <Icon className="mr-0.5" size={14} /> {isPositive ? "+" : ""}
        {percent}%
      </span>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">{t("totalRevenue")}</CardTitle>
          <CurrencyCircleDollar className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">
            {formatCurrency(stats?.revenue?.total ?? 0)}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            {renderPercent(stats?.revenue?.growthPercent)}
            {(t as any)("comparedToLastWeek")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">{t("totalUsers")}</CardTitle>
          <Users className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">
            {stats?.totalUsers?.toLocaleString() ?? 0}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            {renderPercent(stats?.newUsers?.growthPercent)}
            {(t as any)("comparedToLastWeek")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">{t("activeJobs")}</CardTitle>
          <Briefcase className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">
            {stats?.activeJobPosts?.total?.toLocaleString() ?? 0}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            {renderPercent(stats?.activeJobPosts?.growthPercent)}
            {(t as any)("comparedToLastWeek")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">{t("pendingApprovals")}</CardTitle>
          <ShieldCheck className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-warning text-2xl font-extrabold">
            {stats?.pendingReview?.total ?? 0}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            <span className="text-foreground font-bold">
              {stats?.pendingReview?.companyRegistrations ?? 0}
            </span>{" "}
            {t("companies")},{" "}
            <span className="text-foreground font-bold">{stats?.pendingReview?.jobPosts ?? 0}</span>{" "}
            {t("jobs")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
