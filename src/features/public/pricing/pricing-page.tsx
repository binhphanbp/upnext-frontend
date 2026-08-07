"use client";

import { Check, Minus } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  getPublicSubscriptionPlans,
  SUBSCRIPTION_FEATURES,
  type SubscriptionFeature,
  type SubscriptionPlan,
} from "@/features/recruiter/api/billing";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

type PricingTab = "recruiter" | "candidate";

/** Highest-priced plan gets the "contact sales" CTA rather than self-serve upgrade. */
function resolveCta(plan: SubscriptionPlan, isTopTier: boolean) {
  if (Number(plan.price) <= 0) return "free" as const;
  return isTopTier ? ("contact" as const) : ("upgrade" as const);
}

function formatPrice(price: string) {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function PricingPage() {
  const t = useTranslations("Pricing");
  const [tab, setTab] = useState<PricingTab>("recruiter");
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Candidate plans are not on sale yet, so there is nothing to fetch for them.
    if (tab !== "recruiter") return;

    let active = true;
    setError(false);

    void getPublicSubscriptionPlans("RECRUITER")
      .then((data) => {
        if (active) setPlans(data);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [tab]);

  const limitByPlan = useMemo(() => {
    const map = new Map<
      string,
      Map<SubscriptionFeature, { enabled: boolean; limit: number | null }>
    >();
    for (const plan of plans ?? []) {
      map.set(
        plan.id,
        new Map(
          plan.features.map((feature) => [
            feature.feature,
            { enabled: feature.enabled, limit: feature.limitValue },
          ]),
        ),
      );
    }
    return map;
  }, [plans]);

  /** Only show comparison rows that at least one plan actually grants. */
  const comparedFeatures = useMemo(
    () =>
      SUBSCRIPTION_FEATURES.filter((feature) =>
        (plans ?? []).some((plan) => limitByPlan.get(plan.id)?.get(feature)?.enabled),
      ),
    [plans, limitByPlan],
  );

  const renderLimit = (planId: string, feature: SubscriptionFeature) => {
    const entry = limitByPlan.get(planId)?.get(feature);

    if (!entry?.enabled) {
      return (
        <span className="inline-flex items-center gap-1 text-slate-400">
          <Minus size={14} aria-hidden="true" />
          <span className="sr-only">{t("notIncluded")}</span>
        </span>
      );
    }
    if (entry.limit === null) {
      return <span className="font-semibold text-emerald-700">{t("unlimited")}</span>;
    }
    return (
      <span className="font-semibold text-slate-900">{entry.limit.toLocaleString("vi-VN")}</span>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
          {t("eyebrow")}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">{t("headline")}</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
          {t("subheadline")}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={t("eyebrow")}
        className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1"
      >
        {(["recruiter", "candidate"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "h-10 cursor-pointer rounded-full px-5 text-sm font-bold transition-all",
              tab === value
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800",
            )}
          >
            {t(`tabs.${value}`)}
          </button>
        ))}
      </div>

      {tab === "candidate" ? (
        <p className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm font-medium text-slate-600">
          {t("candidateComingSoon")}
        </p>
      ) : error ? (
        <p className="mt-10 text-center text-sm font-semibold text-rose-600">{t("states.error")}</p>
      ) : plans === null ? (
        <p className="mt-10 text-center text-sm font-semibold text-slate-500">
          {t("states.loading")}
        </p>
      ) : plans.length === 0 ? (
        <p className="mt-10 text-center text-sm font-semibold text-slate-500">
          {t("states.empty")}
        </p>
      ) : (
        <>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, index) => {
              const isTopTier = index === plans.length - 1;
              const ctaKey = resolveCta(plan, isTopTier);
              const price = formatPrice(plan.price);

              return (
                <article
                  key={plan.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-white p-6 shadow-none transition-shadow",
                    plan.highlightLabel
                      ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/20"
                      : "border-slate-200",
                  )}
                >
                  {plan.highlightLabel ? (
                    <span className="mb-3 w-fit rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
                      {plan.highlightLabel}
                    </span>
                  ) : null}

                  <h2 className="text-lg font-bold text-slate-950">{plan.subscriptionName}</h2>

                  <p className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-950">{price ?? t("free")}</span>
                    {price ? (
                      <span className="text-xs font-semibold text-slate-500">
                        {plan.durationDays === 30
                          ? t("perMonth")
                          : t("perCycle", { days: plan.durationDays })}
                      </span>
                    ) : null}
                  </p>

                  {plan.description ? (
                    <p className="mt-3 text-xs leading-relaxed text-slate-600">
                      {plan.description}
                    </p>
                  ) : null}

                  <ul className="mt-5 flex-1 space-y-2">
                    {SUBSCRIPTION_FEATURES.filter((feature) => {
                      const entry = limitByPlan.get(plan.id)?.get(feature);
                      return entry?.enabled && entry.limit !== 0;
                    })
                      .slice(0, 4)
                      .map((feature) => {
                        const entry = limitByPlan.get(plan.id)?.get(feature);
                        return (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-xs text-slate-700"
                          >
                            <Check
                              size={14}
                              className="mt-0.5 shrink-0 text-emerald-600"
                              aria-hidden="true"
                            />
                            <span>
                              {t(`features.${feature}`)}
                              {": "}
                              <strong className="font-semibold">
                                {entry?.limit === null
                                  ? t("unlimited")
                                  : entry?.limit?.toLocaleString("vi-VN")}
                              </strong>
                            </span>
                          </li>
                        );
                      })}
                  </ul>

                  <Button
                    asChild
                    className={cn(
                      "mt-6 h-11 w-full rounded-lg text-sm font-bold shadow-none",
                      plan.highlightLabel
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                    )}
                  >
                    <Link href="/recruiter/billing">{t(`cta.${ctaKey}`)}</Link>
                  </Button>
                </article>
              );
            })}
          </div>

          <section className="mt-14">
            <h2 className="text-lg font-bold text-slate-950">{t("comparison.title")}</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-bold text-slate-700"
                    >
                      {t("comparison.feature")}
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-bold text-slate-700"
                      >
                        {plan.subscriptionName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparedFeatures.map((feature) => (
                    <tr key={feature} className="border-b border-slate-100 last:border-b-0">
                      <th
                        scope="row"
                        className="px-4 py-3 text-left text-xs font-medium text-slate-700"
                      >
                        {t(`features.${feature}`)}
                      </th>
                      {plans.map((plan) => (
                        <td key={plan.id} className="px-4 py-3 text-center text-xs">
                          {renderLimit(plan.id, feature)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
