"use client";

import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const data = [
  { name: "1", total: Math.floor(Math.random() * 200) + 50 },
  { name: "2", total: Math.floor(Math.random() * 200) + 50 },
  { name: "3", total: Math.floor(Math.random() * 200) + 50 },
  { name: "4", total: Math.floor(Math.random() * 200) + 50 },
  { name: "5", total: Math.floor(Math.random() * 200) + 50 },
  { name: "6", total: Math.floor(Math.random() * 200) + 50 },
  { name: "7", total: Math.floor(Math.random() * 200) + 50 },
  { name: "8", total: Math.floor(Math.random() * 200) + 50 },
  { name: "9", total: Math.floor(Math.random() * 200) + 50 },
  { name: "10", total: Math.floor(Math.random() * 200) + 50 },
  { name: "11", total: Math.floor(Math.random() * 200) + 50 },
  { name: "12", total: Math.floor(Math.random() * 200) + 50 },
];

export function RevenueChart() {
  const t = useTranslations("Admin.dashboard");

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle>{t("revenueChart.title")}</CardTitle>
        <CardDescription>{t("revenueChart.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
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
                tickFormatter={(value) => `${value}M`}
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
                formatter={(value: any) => [`${value}M`, t("revenueChart.title")]}
              />
              <Bar
                dataKey="total"
                fill="var(--color-brand)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
