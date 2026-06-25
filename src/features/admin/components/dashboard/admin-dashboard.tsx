"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

import { RecentActivity } from "./recent-activity";
import { RevenueChart } from "./revenue-chart";
import { StatCards } from "./stat-cards";

export function AdminDashboard() {
  const t = useTranslations("Admin.dashboard");

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

      <StatCards />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChart />
        <RecentActivity />
      </div>
    </div>
  );
}
