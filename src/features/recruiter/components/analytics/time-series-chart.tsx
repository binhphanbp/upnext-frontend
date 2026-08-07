"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RecruiterAnalyticsResponse } from "@/features/recruiter/api/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function RecruiterActivityTimeSeriesChart({
  timeSeries,
}: {
  timeSeries: RecruiterAnalyticsResponse["timeSeries"];
}) {
  const t = useTranslations("Recruiter.analytics");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = timeSeries.points.map((point) => ({ ...point, label: formatShortDate(point.date) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("timeSeries.title")}</CardTitle>
        <CardDescription>{t("timeSeries.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[280px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <LineChart data={data}>
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
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: "var(--color-border)" }}
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    borderRadius: "8px",
                    borderColor: "var(--color-border)",
                    color: "var(--color-foreground)",
                    fontWeight: "bold",
                  }}
                  formatter={(value: any) => new Intl.NumberFormat("vi-VN").format(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  name={t("timeSeries.views")}
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="applications"
                  name={t("timeSeries.applications")}
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="hires"
                  name={t("timeSeries.hires")}
                  stroke="var(--color-chart-4)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="size-full animate-pulse rounded-lg bg-slate-50/50" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
