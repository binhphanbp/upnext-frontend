"use client";

import { Calendar, CaretDown, Crown, Info, X } from "@phosphor-icons/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  getReputationActivities,
  type ReputationActivity,
} from "@/features/recruiter/api/reputation";
import { cn } from "@/shared/lib/cn";

export type ReputationTier = "elite" | "trusted" | "standard" | "warning" | "locked";

export const REPUTATION_TIERS: ReadonlyArray<{
  id: ReputationTier;
  min: number;
  badgeClass: string;
  barColor: string;
}> = [
  {
    id: "locked",
    min: 0,
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    barColor: "bg-red-500",
  },
  {
    id: "warning",
    min: 30,
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    barColor: "bg-orange-500",
  },
  {
    id: "standard",
    min: 50,
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    barColor: "bg-blue-500",
  },
  {
    id: "trusted",
    min: 70,
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    barColor: "bg-emerald-500",
  },
  {
    id: "elite",
    min: 90,
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    barColor: "bg-amber-500",
  },
];

export const REPUTATION_SCALE_MAX = 100;

export function getReputationTier(score: number) {
  return [...REPUTATION_TIERS].reverse().find((tier) => score >= tier.min) ?? REPUTATION_TIERS[0]!;
}

export type CompanyReputationCardProps = {
  companyId?: string | null;
  reputationScore?: string | number | null;
  token?: string | null;
  className?: string;
};

export function CompanyReputationCard({
  companyId,
  reputationScore: rawScore,
  token,
  className,
}: CompanyReputationCardProps) {
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [activities, setActivities] = useState<ReputationActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const score = useMemo(() => {
    const raw = Number(rawScore ?? 100);
    return Number.isFinite(raw) ? Math.max(0, Math.min(REPUTATION_SCALE_MAX, raw)) : 100;
  }, [rawScore]);

  const tier = useMemo(() => getReputationTier(score), [score]);
  const percent = Math.round((score / REPUTATION_SCALE_MAX) * 100);

  useEffect(() => {
    if (!dialogOpen || !companyId || !token) return;
    setLoadingActivities(true);
    getReputationActivities(companyId, token)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
  }, [dialogOpen, companyId, token]);

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md",
          className,
        )}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-amber-200/60 bg-amber-50 text-amber-600">
              <Crown size={18} weight="fill" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t("dashboard.reputation.title")}
              </h3>
              <p className="text-xs text-slate-500">
                {t(`dashboard.reputation.tier.${tier.id}.label`)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700 focus:outline-none"
          >
            <Info size={14} weight="bold" className="text-emerald-600" />
            {t("dashboard.reputation.learnMore")}
          </button>
        </div>

        <div className="mb-3 flex items-end justify-between">
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              {Math.round(score)}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-400">/ 100</span>
          </div>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", tier.badgeClass)}>
            {t(`dashboard.reputation.tier.${tier.id}.label`)}
          </span>
        </div>

        <div className="relative mb-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/60">
          <div
            className={cn("h-full rounded-full transition-all duration-500", tier.barColor)}
            style={{ width: `${percent}%` }}
          />
          {REPUTATION_TIERS.filter((tItem) => tItem.min > 0).map((tItem) => (
            <span
              key={tItem.id}
              className="absolute top-0 h-full w-px bg-white/80"
              style={{ left: `${tItem.min}%` }}
            />
          ))}
        </div>

        <div className="mb-3 flex justify-between text-[10px] font-semibold text-slate-400">
          <span>0</span>
          <span>30</span>
          <span>50</span>
          <span>70</span>
          <span>90</span>
          <span>100</span>
        </div>

        <p className="text-xs leading-relaxed text-slate-600">
          {t(`dashboard.reputation.tier.${tier.id}.description`)}
        </p>
      </div>

      <DialogPrimitive.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" />
          <DialogPrimitive.Content
            aria-describedby="reputation-dialog-desc"
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-4rem)] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white p-6 shadow-2xl focus:outline-none"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Crown size={20} weight="fill" className="text-amber-500" />
                <DialogPrimitive.Title className="text-lg font-bold text-slate-900">
                  {t("dashboard.reputation.dialog.title")}
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close
                aria-label={t("dashboard.reputation.dialog.close")}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} weight="bold" />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description id="reputation-dialog-desc" className="sr-only">
              {t("dashboard.reputation.dialog.title")}
            </DialogPrimitive.Description>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-600">
              {/* Thẻ hiển thị điểm hiện tại trong modal */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    {t("dashboard.reputation.currentScore")}
                  </span>
                  <span
                    className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", tier.badgeClass)}
                  >
                    {t(`dashboard.reputation.tier.${tier.id}.label`)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {Math.round(score)}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    {t("dashboard.reputation.scoreUnit")}
                  </span>
                </div>
              </div>

              {/* Accordion 1: Hướng dẫn */}
              <div className="rounded-xl border border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setGuideOpen(!guideOpen)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-slate-50/70 p-3.5 text-left text-sm font-bold text-slate-800 transition hover:bg-slate-100/80"
                >
                  <div className="flex items-center gap-2">
                    <Info size={18} className="text-emerald-600" />
                    <span>
                      {t("dashboard.reputation.dialog.introTitle") || "Hướng dẫn tính điểm uy tín"}
                    </span>
                  </div>
                  <CaretDown
                    size={16}
                    className={cn(
                      "text-slate-500 transition-transform duration-200",
                      guideOpen && "rotate-180",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden px-3.5",
                    guideOpen
                      ? "max-h-[1000px] opacity-100 py-4 space-y-4 border-t border-slate-100"
                      : "max-h-0 opacity-0",
                  )}
                >
                  <p className="text-sm">{t("dashboard.reputation.dialog.intro")}</p>

                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-700">
                      {t("dashboard.reputation.dialog.gainTitle")}
                    </h5>
                    <p className="text-sm text-slate-500">
                      {t("dashboard.reputation.dialog.gainText")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-700">
                      {t("dashboard.reputation.dialog.lossTitle")}
                    </h5>
                    <p className="text-sm text-slate-500">
                      {t("dashboard.reputation.dialog.lossText")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-bold text-slate-700">
                      {t("dashboard.reputation.dialog.tiersTitle")}
                    </h5>
                    <ul className="space-y-2">
                      {[...REPUTATION_TIERS].reverse().map((tItem) => (
                        <li key={tItem.id} className="flex gap-2 rounded-lg bg-slate-50 p-3">
                          <span
                            className={cn(
                              "h-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                              tItem.badgeClass,
                            )}
                          >
                            {t(`dashboard.reputation.tier.${tItem.id}.range`)}
                          </span>
                          <span className="text-xs leading-relaxed text-slate-600">
                            <strong className="text-slate-700">
                              {t(`dashboard.reputation.tier.${tItem.id}.label`)}:
                            </strong>{" "}
                            {t(`dashboard.reputation.tier.${tItem.id}.description`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Accordion 2: Lịch sử cộng / trừ điểm */}
              <div className="rounded-xl border border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-slate-50/70 p-3.5 text-left text-sm font-bold text-slate-800 transition hover:bg-slate-100/80"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-600" />
                    <span>{t("dashboard.reputation.dialog.historyTitle")}</span>
                  </div>
                  <CaretDown
                    size={16}
                    className={cn(
                      "text-slate-500 transition-transform duration-200",
                      historyOpen && "rotate-180",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden px-3.5",
                    historyOpen
                      ? "max-h-[600px] opacity-100 py-4 border-t border-slate-100"
                      : "max-h-0 opacity-0",
                  )}
                >
                  {loadingActivities ? (
                    <p className="text-sm text-slate-400">
                      {t("dashboard.reputation.dialog.historyLoading")}
                    </p>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {t("dashboard.reputation.dialog.historyEmpty")}
                    </p>
                  ) : (
                    <ul className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                      {activities.map((activity) => {
                        const delta = Number(activity.score);
                        return (
                          <li
                            key={activity.id}
                            className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-slate-700">
                                {activity.reason || activity.actionType}
                              </p>
                              <span className="text-xs text-slate-400">
                                {new Date(activity.createdAt).toLocaleDateString(
                                  locale === "vi" ? "vi-VN" : "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                                delta > 0
                                  ? "bg-emerald-50 text-emerald-600"
                                  : delta < 0
                                    ? "bg-red-50 text-red-600"
                                    : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
