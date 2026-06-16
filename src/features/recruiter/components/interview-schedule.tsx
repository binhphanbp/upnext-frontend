import {
  interviews,
  interviewStatusLabels,
  type InterviewStatus,
} from "@/features/recruiter/data/dashboard-data";
import { ArrowRight } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

import { SectionCard } from "./section-card";

const statusClasses: Record<InterviewStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-orange-50 text-orange-600",
  reschedule: "bg-blue-50 text-blue-600",
};

export function InterviewSchedule() {
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
        {interviews.map((item) => (
          <div className="grid grid-cols-[42px_minmax(0,1fr)_84px] gap-3 py-2.5" key={item.time}>
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
                statusClasses[item.status],
              )}
            >
              {interviewStatusLabels[item.status]}
            </span>
          </div>
        ))}
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
