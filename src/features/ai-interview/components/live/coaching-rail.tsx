"use client";

import { Info } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";

import { paceBand, WPM_TARGET } from "../../lib/delivery-metrics";
import type { DeliverySample, DeliverySignals } from "../../types";
import { StatTile } from "../interview-primitives";

/**
 * Live delivery coaching.
 *
 * Scope, stated on screen and not only in code: these are *speech* signals —
 * pace, filler words, pauses, loudness consistency. The system does not infer
 * emotion, personality or any attribute of the person, and none of these numbers
 * reach the rubric score or any recruiter surface. See the header note in
 * `lib/delivery-metrics.ts` for why that boundary is drawn where it is.
 *
 * The panel is deliberately calm: nothing flashes red mid-answer. Being told you
 * are talking too fast while talking is how you get someone to freeze.
 */
export function CoachingRail({
  delivery,
  samples,
  isActive,
  className,
}: {
  delivery: DeliverySignals;
  samples: DeliverySample[];
  isActive: boolean;
  className?: string;
}) {
  const t = useTranslations("AiInterview");
  const band = paceBand(delivery.wpm);

  return (
    <section className={cn("space-y-3", className)} aria-label={t("coaching.title")}>
      <div className="flex items-center gap-1.5">
        <h3 className="text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">
          {t("coaching.title")}
        </h3>
        <button
          type="button"
          className="upnext-focus group relative grid size-4 place-items-center rounded-full text-slate-600"
          aria-label={t("coaching.disclaimer")}
        >
          <Info aria-hidden className="size-3.5" />
          <span className="pointer-events-none absolute top-full right-0 z-10 mt-1.5 w-60 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-left text-[11px] leading-relaxed text-slate-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {t("coaching.disclaimer")}
          </span>
        </button>
      </div>

      <PaceGauge wpm={delivery.wpm} band={band} isActive={isActive} />

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label={t("coaching.fillers")}
          value={delivery.fillerCount}
          tone={delivery.fillerCount > 6 ? "watch" : "neutral"}
          hint={
            delivery.fillerBreakdown.length
              ? delivery.fillerBreakdown
                  .slice(0, 2)
                  .map((entry) => `${entry.word} ×${entry.count}`)
                  .join(", ")
              : t("coaching.noFillers")
          }
        />
        <StatTile
          label={t("coaching.longestPause")}
          value={delivery.longestPauseMs ? `${(delivery.longestPauseMs / 1000).toFixed(1)}s` : "—"}
          tone={delivery.longestPauseMs > 4_000 ? "watch" : "neutral"}
          hint={t("coaching.pauseHint")}
        />
      </div>

      <Sparkline samples={samples} isActive={isActive} label={t("coaching.level")} />
    </section>
  );
}

function PaceGauge({
  wpm,
  band,
  isActive,
}: {
  wpm: number;
  band: ReturnType<typeof paceBand>;
  isActive: boolean;
}) {
  const t = useTranslations("AiInterview");
  // 60–210 wpm covers everything from laboured to auctioneer.
  const position = Math.min(1, Math.max(0, (wpm - 60) / 150));
  const targetStart = ((WPM_TARGET.min - 60) / 150) * 100;
  const targetWidth = ((WPM_TARGET.max - WPM_TARGET.min) / 150) * 100;

  return (
    <div className="rounded-xl bg-slate-800/60 px-3 py-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold tracking-[0.08em] text-slate-500 uppercase">
          {t("coaching.pace")}
        </span>
        <span className="text-sm font-bold text-slate-100 tabular-nums">
          {wpm > 0 ? wpm : "—"}
          <span className="ml-0.5 text-[10px] font-semibold text-slate-500">wpm</span>
        </span>
      </div>

      <div className="relative mt-2 h-2 rounded-full bg-slate-700">
        <div
          aria-hidden
          className="absolute inset-y-0 rounded-full bg-emerald-500/25"
          style={{ left: `${targetStart}%`, width: `${targetWidth}%` }}
        />
        {wpm > 0 ? (
          <div
            aria-hidden
            className={cn(
              "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 transition-[left] duration-500 ease-out motion-reduce:transition-none",
              band === "ideal" ? "bg-emerald-400" : "bg-amber-400",
            )}
            style={{ left: `${position * 100}%` }}
          />
        ) : null}
      </div>

      <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
        {isActive || wpm > 0 ? t(`coaching.paceBand.${band}`) : t("coaching.paceIdle")}
      </p>
    </div>
  );
}

/** Input level over the last ~12 seconds. Purely an "is it hearing me" signal. */
function Sparkline({
  samples,
  isActive,
  label,
}: {
  samples: DeliverySample[];
  isActive: boolean;
  label: string;
}) {
  const visible = samples.slice(-64);

  return (
    <div className="rounded-xl bg-slate-800/60 px-3 py-2.5">
      <p className="text-[10px] font-bold tracking-[0.08em] text-slate-500 uppercase">{label}</p>
      <div className="mt-2 flex h-9 items-end gap-[2px]" aria-hidden>
        {visible.length === 0
          ? Array.from({ length: 32 }, (_, index) => (
              <span
                key={index}
                className="flex-1 rounded-sm bg-slate-700"
                style={{ height: "8%" }}
              />
            ))
          : visible.map((sample, index) => (
              <span
                key={index}
                className={cn(
                  "flex-1 rounded-sm transition-[height] duration-100 ease-out motion-reduce:transition-none",
                  isActive && index >= visible.length - 3 ? "bg-emerald-400" : "bg-slate-600",
                )}
                style={{ height: `${Math.max(8, sample.level * 100)}%` }}
              />
            ))}
      </div>
    </div>
  );
}
