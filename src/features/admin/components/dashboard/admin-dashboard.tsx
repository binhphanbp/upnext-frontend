"use client";

import { useTranslations } from "next-intl";

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
