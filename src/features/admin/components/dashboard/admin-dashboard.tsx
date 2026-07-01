"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { RecentActivity } from "./recent-activity";
import { RevenueChart } from "./revenue-chart";
import { StatCards } from "./stat-cards";
import { useAdminDashboard } from "./use-admin-dashboard";

export function AdminDashboard() {
  const t = useTranslations("Admin.dashboard");
  const { data, isLoading } = useAdminDashboard();

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <DownloadSimple className="mr-2" />
            {t("downloadReport")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-1 h-[450px] lg:col-span-4" />
            <Skeleton className="col-span-1 h-[450px] lg:col-span-3" />
          </div>
        </div>
      ) : (
        <>
          <StatCards stats={data?.summary} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <RevenueChart data={data?.revenueChart?.points} />
            <RecentActivity activities={data?.latestActivities} />
          </div>
        </>
      )}
    </div>
  );
}
