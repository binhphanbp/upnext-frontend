"use client";

import { ClockCountdown, Sparkle } from "@phosphor-icons/react";
import { useFormatter, useTranslations } from "next-intl";

import type { CandidateCopilotQuota } from "../api/candidate-subscription-api";

export function AiCopilotQuotaBadge({ quota }: { quota?: CandidateCopilotQuota | undefined }) {
  const t = useTranslations("AiCopilot.quota");

  if (!quota?.enabled || quota.limit === null || quota.remaining === null) return null;

  return (
    <span
      className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 sm:inline-flex"
      aria-label={t("remainingLabel", { remaining: quota.remaining, limit: quota.limit })}
    >
      <Sparkle weight="fill" className="size-3.5" aria-hidden />
      {t("remaining", { remaining: quota.remaining, limit: quota.limit })}
    </span>
  );
}

export function AiCopilotQuotaNotice({ quota }: { quota?: CandidateCopilotQuota | undefined }) {
  const t = useTranslations("AiCopilot.quota");
  const format = useFormatter();

  if (!quota?.enabled || quota.limit === null || quota.remaining === null || quota.remaining > 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mx-auto mb-2 flex w-full max-w-3xl items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-950"
    >
      <ClockCountdown weight="fill" className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold">{t("exhaustedTitle")}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800">
          {t("exhaustedDescription", {
            date: format.dateTime(new Date(quota.periodEnd), { dateStyle: "medium" }),
          })}
        </p>
      </div>
    </div>
  );
}
