"use client";

import { CaretDown, Prohibit, ShieldCheck } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/shared/ui/checkbox";

/**
 * Informed consent, shown before the microphone is ever requested.
 *
 * Two lists, deliberately: what the session *does* collect, and what it
 * explicitly does not. The second list is the substantive one — a candidate
 * being recorded has no way to verify a negative, so the product has to state
 * it plainly and then be built so it stays true (`lib/delivery-metrics.ts`
 * carries the same boundary in code).
 *
 * Consent is required only when live capture is enabled; the simulated mode
 * touches no device and asks for nothing.
 */
export function ConsentPanel({
  isRequired,
  isAccepted,
  onAcceptedChange,
  usesCloudSpeech,
  className,
}: {
  isRequired: boolean;
  isAccepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  /** Browser speech recognition routes audio through a vendor service. */
  usesCloudSpeech: boolean;
  className?: string;
}) {
  const t = useTranslations("AiInterview");
  const [isExpanded, setIsExpanded] = useState(false);

  const collected = [
    t("consent.collected.audio"),
    t("consent.collected.transcript"),
    t("consent.collected.delivery"),
    ...(usesCloudSpeech ? [t("consent.collected.cloudSpeech")] : []),
  ];

  const notCollected = [
    t("consent.excluded.emotion"),
    t("consent.excluded.appearance"),
    t("consent.excluded.demographics"),
    t("consent.excluded.recruiter"),
  ];

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-50/70 p-4", className)}>
      <div className="flex items-start gap-2.5">
        <ShieldCheck
          weight="fill"
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-emerald-600"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{t("consent.title")}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{t("consent.summary")}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="upnext-focus mt-2.5 inline-flex items-center gap-1.5 rounded-lg py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
      >
        {isExpanded ? t("consent.hideDetails") : t("consent.showDetails")}
        <CaretDown
          aria-hidden
          className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")}
        />
      </button>

      {isExpanded ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">
              {t("consent.collectedTitle")}
            </p>
            <ul className="space-y-1.5">
              {collected.map((item) => (
                <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-slate-700">
                  <span
                    aria-hidden
                    className="mt-[0.62em] size-1.5 shrink-0 rounded-full bg-slate-400"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">
              {t("consent.excludedTitle")}
            </p>
            <ul className="space-y-1.5">
              {notCollected.map((item) => (
                <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-slate-700">
                  <Prohibit
                    weight="bold"
                    aria-hidden
                    className="mt-[0.2em] size-3.5 shrink-0 text-slate-400"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
              {t("consent.legalNote")}
            </p>
          </div>
        </div>
      ) : null}

      {isRequired ? (
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-slate-200 pt-3">
          <Checkbox
            checked={isAccepted}
            onCheckedChange={(checked) => onAcceptedChange(checked === true)}
            className="mt-0.5"
          />
          <span className="text-[13px] leading-relaxed text-slate-700">{t("consent.agree")}</span>
        </label>
      ) : null}
    </div>
  );
}
