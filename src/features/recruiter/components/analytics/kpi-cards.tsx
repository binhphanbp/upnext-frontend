"use client";

import {
  Briefcase,
  CalendarCheck,
  ChartLineUp,
  Eye,
  Timer,
  UserCheck,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import type { RecruiterAnalyticsResponse } from "@/features/recruiter/api/analytics";
import { Card, CardContent } from "@/shared/ui/card";

function formatDays(value: number | null, t: ReturnType<typeof useTranslations>) {
  return value === null ? t("kpis.noData") : t("kpis.days", { count: Math.round(value * 10) / 10 });
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub?: string | undefined;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="p-0">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <div
            className={`flex size-10 items-center justify-center rounded-xl text-white ${accent}`}
          >
            {icon}
          </div>
        </div>
        <div>
          <p className="text-foreground text-3xl font-extrabold">{value}</p>
          {sub ? <p className="text-muted-foreground mt-1 text-xs">{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsKpiCards({ kpis }: { kpis: RecruiterAnalyticsResponse["kpis"] }) {
  const t = useTranslations("Recruiter.analytics");

  return (
    <section
      aria-label={t("kpis.sectionLabel")}
      className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6"
    >
      <KpiCard
        title={t("kpis.totalViews")}
        value={kpis.totalViews.toLocaleString("vi-VN")}
        icon={<Eye size={20} weight="bold" />}
        accent="bg-[#5d87ff]"
      />
      <KpiCard
        title={t("kpis.totalApplications")}
        value={kpis.totalApplications.toLocaleString("vi-VN")}
        icon={<Briefcase size={20} weight="bold" />}
        accent="bg-[#10a778]"
      />
      <KpiCard
        title={t("kpis.interviewsScheduled")}
        value={kpis.interviewsScheduled.toLocaleString("vi-VN")}
        icon={<CalendarCheck size={20} weight="bold" />}
        accent="bg-amber-500"
      />
      <KpiCard
        title={t("kpis.hires")}
        value={kpis.hires.toLocaleString("vi-VN")}
        icon={<UserCheck size={20} weight="bold" />}
        accent="bg-emerald-600"
      />
      <KpiCard
        title={t("kpis.avgTimeToHire")}
        value={formatDays(kpis.timeToHireDays.average, t)}
        sub={
          kpis.timeToHireDays.sampleSize > 0
            ? t("kpis.sampleSize", { count: kpis.timeToHireDays.sampleSize })
            : undefined
        }
        icon={<Timer size={20} weight="bold" />}
        accent="bg-violet-600"
      />
      <KpiCard
        title={t("kpis.medianTimeToHire")}
        value={formatDays(kpis.timeToHireDays.median, t)}
        icon={<ChartLineUp size={20} weight="bold" />}
        accent="bg-rose-500"
      />
    </section>
  );
}
