"use client";

import { useSyncExternalStore } from "react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, Tooltip, XAxis, YAxis } from "recharts";

import { performanceData } from "@/features/recruiter/data/dashboard-data";
import { ChevronDown } from "@/features/recruiter/icons";

import { SectionCard } from "./section-card";

export function RecruitmentPerformanceChart() {
  const mounted = useIsClient();
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartWidth = useElementWidth(chartRef);

  return (
    <SectionCard className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] leading-snug font-extrabold text-slate-950">
          Hiệu suất tuyển dụng 30 ngày
        </h2>
        <button className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700">
          30 ngày
          <ChevronDown aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-6 pl-1 text-xs font-bold text-slate-600">
        <span className="inline-flex items-center gap-2">
          <i className="h-0.5 w-4 rounded-full bg-emerald-500" />
          Hồ sơ nhận
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-0.5 w-4 rounded-full border-t-2 border-dashed border-blue-500" />
          Phỏng vấn
        </span>
      </div>

      <div className="h-[205px]" ref={chartRef}>
        {mounted && chartWidth > 0 ? (
          <AreaChartContent width={chartWidth} />
        ) : (
          <div className="h-full rounded-lg bg-gradient-to-b from-emerald-50 to-white" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <SummaryCard color="emerald" label="Tổng hồ sơ nhận" value="1,248" />
        <SummaryCard color="blue" label="Tổng phỏng vấn" value="186" />
      </div>
    </SectionCard>
  );
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

function useElementWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    function updateWidth() {
      setWidth(Math.max(0, Math.floor(element?.clientWidth ?? 0)));
    }

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

function AreaChartContent({ width }: { width: number }) {
  return (
    <AreaChart
      data={performanceData}
      height={205}
      margin={{ bottom: 0, left: -26, right: 4, top: 8 }}
      width={width}
    >
      <defs>
        <linearGradient id="profilesFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="#e5e7eb" vertical={false} />
      <XAxis
        axisLine={false}
        dataKey="date"
        interval={2}
        tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
        tickLine={false}
      />
      <YAxis
        axisLine={false}
        domain={[0, 100]}
        tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
        tickCount={6}
        tickLine={false}
      />
      <Tooltip
        contentStyle={{
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          boxShadow: "0 14px 32px rgba(15, 23, 42, 0.1)",
          fontSize: 12,
          fontWeight: 700,
        }}
      />
      <Area
        dataKey="profiles"
        fill="url(#profilesFill)"
        stroke="#10b981"
        strokeWidth={2}
        type="monotone"
      />
      <Line
        dataKey="interviews"
        dot={false}
        stroke="#2563eb"
        strokeDasharray="7 6"
        strokeLinecap="round"
        strokeWidth={2}
        type="monotone"
      />
    </AreaChart>
  );
}

function SummaryCard({
  color,
  label,
  value,
}: {
  color: "blue" | "emerald";
  label: string;
  value: string;
}) {
  const dot = color === "emerald" ? "bg-emerald-500" : "bg-blue-500";
  const trend = color === "emerald" ? "18%" : "12%";

  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between">
        <p className="text-lg leading-none font-extrabold text-slate-950">{value}</p>
        <p className="text-xs font-extrabold text-emerald-600">↑ {trend}</p>
      </div>
    </div>
  );
}
