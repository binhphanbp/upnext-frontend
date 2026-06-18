import type { DashboardInterviewStatus } from "@/features/recruiter/data/dashboard-data";
import {
  getMetricToneClasses,
  interviewStatusLabels,
  type DashboardInterviewScheduleItem,
} from "@/features/recruiter/data/dashboard-metrics";
import { ArrowRight } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

import { SectionCard } from "./section-card";

const statusTones: Record<
  DashboardInterviewStatus,
  "danger" | "good" | "info" | "neutral" | "warning"
> = {
  CANCELLED: "neutral",
  COMPLETED: "good",
  NEEDS_FEEDBACK: "warning",
  NO_SHOW: "danger",
  SCHEDULED: "info",
  UPCOMING: "good",
};

export function InterviewSchedule({ items }: { items: DashboardInterviewScheduleItem[] }) {
  return (
    <SectionCard className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] leading-snug font-extrabold text-slate-950">
          Lịch phỏng vấn hôm nay
        </h2>
        <a
          className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-600"
          href="#"
        >
          Xem lịch đầy đủ
          <ArrowRight aria-hidden className="h-4 w-4" />
        </a>
      </div>

      <div className="relative divide-y divide-slate-100 pl-3 before:absolute before:top-1 before:bottom-4 before:left-0 before:w-px before:bg-emerald-100">
        {items.map((item) => {
          const toneClasses = getMetricToneClasses(statusTones[item.status]);

          return (
            <div
              className="grid grid-cols-[42px_minmax(0,1fr)_96px] gap-3 py-2.5"
              key={`${item.time}-${item.name}`}
            >
              <div>
                <p className="text-sm leading-tight font-extrabold text-slate-950">{item.time}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{item.duration}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-slate-950">{item.name}</p>
                <p className="mt-1 truncate text-xs font-bold text-slate-500">{item.role}</p>
                <p className="mt-1 truncate text-xs font-bold text-slate-500">{item.round}</p>
              </div>
              <span
                className={cn(
                  "mt-0.5 flex h-7 items-center justify-center rounded-md px-2 text-center text-[11px] font-extrabold leading-none",
                  toneClasses.badge,
                )}
              >
                {interviewStatusLabels[item.status]}
              </span>
            </div>
          );
        })}
      </div>

      <a
        className="mt-2 inline-flex items-center gap-3 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Xem tất cả lịch
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </SectionCard>
  );
}
