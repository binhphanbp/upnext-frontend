import { trustItems } from "@/features/recruiter/data/dashboard-data";
import { ArrowRight, CheckCircle2 } from "@/features/recruiter/icons";

import { SectionCard } from "./section-card";

export function TrustScoreCard() {
  return (
    <SectionCard className="p-4">
      <h2 className="text-base font-extrabold text-slate-950">Điểm uy tín doanh nghiệp</h2>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl leading-none font-extrabold text-slate-950">
          86<span className="text-base font-bold text-slate-500">/100</span>
        </p>
        <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700">
          Doanh nghiệp tin cậy
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[86%] rounded-full bg-emerald-500" />
      </div>

      <div className="mt-4 space-y-2.5">
        {trustItems.map((item) => (
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600" key={item}>
            <CheckCircle2 aria-hidden className="h-4 w-4 text-slate-500" />
            <span className="min-w-0 flex-1">{item}</span>
            <CheckCircle2 aria-hidden className="h-4 w-4 fill-emerald-500 text-white" />
          </div>
        ))}
      </div>

      <a
        className="mt-5 inline-flex items-center gap-3 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Xem chi tiết
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </SectionCard>
  );
}
