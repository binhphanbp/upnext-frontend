"use client";

import { DownloadSimple } from "@phosphor-icons/react";

import { Button } from "@/shared/ui/button";

import { RecentActivity } from "./recent-activity";
import { RevenueChart } from "./revenue-chart";
import { StatCards } from "./stat-cards";

export function AdminDashboard() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight">
            Thống kê nền tảng
          </h2>
          <p className="text-muted-foreground mt-1">
            Tổng quan hiệu suất hoạt động và doanh thu của hệ thống UpNext.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <DownloadSimple className="mr-2" />
            Tải báo cáo
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
