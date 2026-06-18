import {
  getMetricToneClasses,
  getTrendClasses,
  type DashboardKpiCard,
} from "@/features/recruiter/data/dashboard-metrics";
import { ArrowUp } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

export function KpiGrid({ cards }: { cards: DashboardKpiCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const toneClasses = getMetricToneClasses(card.tone);
        const trendClasses = getTrendClasses(card.trend.tone);

        return (
          <article
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
            key={card.label}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  toneClasses.subtle,
                )}
              >
                <Icon aria-hidden className="h-4.5 w-4.5 stroke-[1.9]" />
              </span>

              <div className="min-w-0">
                <p className="min-h-[28px] text-[11px] leading-4 font-bold text-slate-600">
                  {card.label}
                </p>
                <p className="mt-1.5 text-[16px] leading-none font-extrabold text-slate-950">
                  {card.value.includes("/100") ? (
                    <>
                      {card.value.split("/")[0]}
                      <span className="text-xs font-bold text-slate-500">/100</span>
                    </>
                  ) : (
                    card.value
                  )}
                </p>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-1 overflow-hidden text-[10px] leading-snug font-bold text-slate-500">
              <span className={cn("inline-flex shrink-0", trendClasses.icon)}>
                <ArrowUp
                  aria-hidden
                  className={cn(
                    "h-3.5 w-3.5",
                    card.trend.direction === "down" && "rotate-180",
                    card.trend.direction === "flat" && "rotate-90",
                  )}
                />
              </span>
              <span className={cn("shrink-0 whitespace-nowrap", trendClasses.text)}>
                {card.trend.amount}
              </span>
              <span className="min-w-0 truncate">{card.trend.compareLabel}</span>
            </p>
          </article>
        );
      })}
    </div>
  );
}
