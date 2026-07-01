"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

import type { AdminRevenueChartData } from "../../api/dashboard";

export function RevenueChart({ data }: { data?: AdminRevenueChartData["points"] | undefined }) {
  const t = useTranslations("Admin.dashboard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle>{t("revenueChart.title")}</CardTitle>
        <CardDescription>{t("revenueChart.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height={350} minWidth={0}>
              <BarChart data={Array.isArray(data) ? data : []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="label"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000000}tr`}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-muted)" }}
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    borderRadius: "8px",
                    borderColor: "var(--color-border)",
                    color: "var(--color-foreground)",
                    fontWeight: "bold",
                  }}
                  formatter={(value: any) => [
                    new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(value),
                    t("revenueChart.title"),
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-brand)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="size-full animate-pulse rounded-lg bg-slate-50/50" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
