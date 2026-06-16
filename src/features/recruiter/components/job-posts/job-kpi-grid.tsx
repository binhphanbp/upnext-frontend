import { jobKpis } from "@/features/recruiter/data/job-posts-data";
import { ArrowUp } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

const accentClasses = {
  blue: "bg-blue-50 text-blue-500",
  green: "bg-emerald-50 text-emerald-500",
  orange: "bg-orange-50 text-orange-500",
  red: "bg-red-50 text-red-500",
  violet: "bg-violet-50 text-violet-500",
} as const;

export function JobKpiGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {jobKpis.map((item) => {
        const Icon = item.icon;

        return (
          <article
            className="min-h-[122px] rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
            key={item.label}
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  accentClasses[item.accent],
                )}
              >
                <Icon aria-hidden className="h-5 w-5 stroke-[1.9]" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-600">{item.label}</p>
                <p className="mt-2 text-2xl leading-none font-extrabold text-slate-950">
                  {item.value}
                </p>
              </div>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500">
              {item.trend ? (
                <>
                  <ArrowUp aria-hidden className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">{item.trend}</span>
                </>
              ) : null}
              <span>{item.helper}</span>
            </p>
          </article>
        );
      })}
    </div>
  );
}
