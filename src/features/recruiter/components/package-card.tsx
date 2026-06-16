import { packageUsage } from "@/features/recruiter/data/dashboard-data";
import { ArrowRight } from "@/features/recruiter/icons";

import { SectionCard } from "./section-card";

export function PackageCard() {
  return (
    <SectionCard className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-950">Gói hiện tại</h2>
          <p className="mt-4 text-sm font-extrabold text-slate-950">Gói Pro</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Hiệu lực đến 25/06/2025 (còn 25 ngày)
          </p>
        </div>
        <span className="rounded-md bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700">
          Pro
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[92%] rounded-full bg-emerald-500" />
      </div>

      <div className="space-y-2.5">
        {packageUsage.map((item) => {
          const Icon = item.icon;

          return (
            <div
              className="flex items-center gap-3 text-xs font-bold text-slate-600"
              key={item.label}
            >
              <Icon aria-hidden className="h-4 w-4 text-slate-500" />
              <span className="min-w-0 flex-1">{item.label}</span>
              <span className="font-extrabold text-slate-900">{item.value}</span>
            </div>
          );
        })}
      </div>

      <a
        className="mt-5 inline-flex items-center gap-3 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Nâng cấp gói để mở rộng tính năng
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </SectionCard>
  );
}
