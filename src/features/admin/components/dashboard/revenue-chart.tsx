"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const data = [
  { name: "Thg 1", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 2", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 3", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 4", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 5", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 6", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 7", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 8", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 9", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 10", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 11", total: Math.floor(Math.random() * 200) + 50 },
  { name: "Thg 12", total: Math.floor(Math.random() * 200) + 50 },
];

export function RevenueChart() {
  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle>Doanh thu</CardTitle>
        <CardDescription>Doanh thu bán gói dịch vụ và tin đăng trong năm nay.</CardDescription>
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
                formatter={(value: any) => [`${value} Triệu VNĐ`, "Doanh thu"]}
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
