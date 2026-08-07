"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RecruiterAnalyticsResponse } from "@/features/recruiter/api/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

// Every stage bar uses --color-chart-1 at a decreasing opacity — a single color reads as
// "one metric narrowing down" (the funnel shape itself already conveys the drop-off), whereas
// five unrelated hues would read as five different categories instead of sequential stages.
const STAGE_OPACITY = [1, 0.85, 0.7, 0.55, 0.4];

export function RecruiterFunnelChart({ funnel }: { funnel: RecruiterAnalyticsResponse["funnel"] }) {
  const t = useTranslations("Recruiter.analytics");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = funnel.stages.map((stage) => ({
    ...stage,
    label: t(`funnel.stages.${stage.stage}`),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("funnel.title")}</CardTitle>
        <CardDescription>{t("funnel.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[280px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  type="number"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
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
                  formatter={(value: any, _name: any, item: any) => {
                    const conversion = item?.payload?.conversionFromPrevious;
                    const formattedValue = new Intl.NumberFormat("vi-VN").format(Number(value));
                    return [
                      conversion !== null && conversion !== undefined
                        ? `${formattedValue} (${conversion}% ${t("funnel.fromPrevious")})`
                        : formattedValue,
                      t("funnel.count"),
                    ];
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.stage}
                      fill="var(--color-chart-1)"
                      fillOpacity={STAGE_OPACITY[index] ?? 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="size-full animate-pulse rounded-lg bg-slate-50/50" />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {data.map((stage) => (
            <div key={stage.stage} className="border-border rounded-lg border p-3 text-center">
              <p className="text-muted-foreground text-xs font-semibold">{stage.label}</p>
              <p className="text-foreground mt-1 text-lg font-extrabold">{stage.count}</p>
              <p className="text-muted-foreground text-xs">
                {stage.conversionFromPrevious === null
                  ? "—"
                  : `${stage.conversionFromPrevious}% ${t("funnel.fromPrevious")}`}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
