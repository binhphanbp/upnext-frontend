import { taskItems } from "@/features/recruiter/data/dashboard-data";
import { ChevronRight } from "@/features/recruiter/icons";

import { SectionCard } from "./section-card";

export function TaskCard() {
  return (
    <SectionCard className="p-4">
      <h2 className="mb-5 text-base font-extrabold text-slate-950">Việc cần xử lý hôm nay</h2>
      <div className="divide-y divide-slate-100">
        {taskItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className="flex h-[47px] w-full items-center gap-3 text-left text-sm font-bold text-slate-700"
              key={item.label}
            >
              <Icon aria-hidden className="h-4.5 w-4.5 text-slate-500" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className="font-extrabold text-slate-950">{item.count}</span>
              <ChevronRight aria-hidden className="h-4 w-4 text-slate-500" />
            </button>
          );
        })}
      </div>
      <a
        className="mt-5 inline-flex items-center gap-3 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Xem tất cả việc cần xử lý
        <ChevronRight aria-hidden className="h-4 w-4" />
      </a>
    </SectionCard>
  );
}
