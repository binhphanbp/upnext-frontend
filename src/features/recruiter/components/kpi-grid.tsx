import { kpiCards } from "@/features/recruiter/data/dashboard-data";
import { ArrowUp } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

const accentClasses = {
  amber: "bg-amber-50 text-amber-500",
  blue: "bg-blue-50 text-blue-500",
  green: "bg-emerald-50 text-emerald-500",
  sky: "bg-sky-50 text-sky-500",
  teal: "bg-teal-50 text-teal-500",
  violet: "bg-violet-50 text-violet-500",
} as const;

export function KpiGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {kpiCards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            className="min-h-[128px] rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
            key={card.label}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  accentClasses[card.accent],
                )}
              >
                <Icon aria-hidden className="h-4.5 w-4.5 stroke-[1.9]" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] leading-snug font-bold text-slate-600">{card.label}</p>
                <p className="mt-2 text-2xl leading-none font-extrabold text-slate-950">
                  {card.value.includes("/") ? (
                    <>
                      86<span className="text-base font-bold text-slate-500">/100</span>
                    </>
                  ) : (
                    card.value
                  )}
                </p>
              </div>
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-[11px] leading-snug font-bold text-slate-500">
              <ArrowUp aria-hidden className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-600">{card.trend.split(" ")[0]}</span>
              <span>{card.trend.split(" ").slice(1).join(" ")}</span>
            </p>
          </article>
        );
      })}
    </div>
  );
}
