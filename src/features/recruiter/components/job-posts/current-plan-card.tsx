import { planResources } from "@/features/recruiter/data/job-posts-data";
import { ArrowRight } from "@/features/recruiter/icons";

export function CurrentPlanCard() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-slate-950">Gói hiện tại</h2>
        <span className="rounded-md bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700">
          Pro
        </span>
      </div>

      <div className="space-y-4">
        {planResources.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold">
              <span className="text-slate-500">{item.label}</span>
              <span className="text-slate-950">{item.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <a
        className="mt-5 inline-flex items-center gap-3 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Nâng cấp gói
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </section>
  );
}
