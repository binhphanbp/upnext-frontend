"use client";

import { ArrowRight, Minus, Plus, Warning } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import type { AiCvAnalysisCard } from "../../types";
import { AiCardLabel, AiCardSection, AiCardShell, ScoreBar, ScoreRing } from "./card-primitives";

/**
 * §8.1 — structured CV analysis. Every strength and weakness carries the line
 * from the CV that produced it: an unevidenced critique is not actionable, and
 * the plan requires evidence for each remark.
 */
export function CvAnalysisCard({ card }: { card: AiCvAnalysisCard }) {
  const t = useTranslations("AiCopilot");

  const subScores = [
    { key: "completeness", value: card.scores.completeness },
    { key: "clarity", value: card.scores.clarity },
    { key: "impact", value: card.scores.impact },
    { key: "atsReadiness", value: card.scores.atsReadiness },
  ] as const;

  return (
    <AiCardShell>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <ScoreRing score={card.overallScore} size={60} label={t("cv.overall")} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-slate-950">{card.cvName}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t("cv.subtitle")}</p>
        </div>
      </div>

      <AiCardSection className="bg-slate-50/60">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {subScores.map((item) => (
            <div key={item.key}>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="truncate text-xs text-slate-600">{t(`cv.score.${item.key}`)}</dt>
                <dd className="shrink-0 text-[13px] font-bold text-slate-800 tabular-nums">
                  {item.value}
                </dd>
              </div>
              <ScoreBar score={item.value} className="mt-1" />
            </div>
          ))}
        </dl>
      </AiCardSection>

      <AiCardSection>
        <AiCardLabel>
          <span className="inline-flex items-center gap-1.5">
            <Plus weight="bold" className="size-3.5 text-emerald-500" />
            {t("cv.strengths")}
          </span>
        </AiCardLabel>
        <ul className="space-y-2">
          {card.strengths.map((item) => (
            <EvidenceItem
              key={item.text}
              text={item.text}
              evidence={item.evidence}
              tone="positive"
            />
          ))}
        </ul>
      </AiCardSection>

      <AiCardSection>
        <AiCardLabel>
          <span className="inline-flex items-center gap-1.5">
            <Minus weight="bold" className="size-3.5 text-amber-500" />
            {t("cv.weaknesses")}
          </span>
        </AiCardLabel>
        <ul className="space-y-2">
          {card.weaknesses.map((item) => (
            <EvidenceItem
              key={item.text}
              text={item.text}
              evidence={item.evidence}
              tone="negative"
            />
          ))}
        </ul>
      </AiCardSection>

      {card.missingSections.length > 0 ? (
        <AiCardSection>
          <AiCardLabel>
            <span className="inline-flex items-center gap-1.5">
              <Warning weight="fill" className="size-3.5 text-slate-400" />
              {t("cv.missingSections")}
            </span>
          </AiCardLabel>
          <div className="flex flex-wrap gap-1.5">
            {card.missingSections.map((section) => (
              <span
                key={section}
                className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 ring-inset"
              >
                {section}
              </span>
            ))}
          </div>
        </AiCardSection>
      ) : null}

      <AiCardSection className="flex items-center justify-between gap-3 bg-slate-50/60 py-2.5">
        <p className="text-[11px] text-slate-400">{t("cv.noAutoUpdate")}</p>
        <Link
          href={card.href}
          className="upnext-focus inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800"
        >
          {t("cv.openBuilder")}
          <ArrowRight className="size-3.5" />
        </Link>
      </AiCardSection>
    </AiCardShell>
  );
}

function EvidenceItem({
  text,
  evidence,
  tone,
}: {
  text: string;
  evidence: string;
  tone: "positive" | "negative";
}) {
  return (
    <li>
      <p className="text-[13.5px] font-medium text-slate-800">{text}</p>
      <p
        className={
          tone === "positive"
            ? "mt-0.5 border-l-2 border-emerald-200 pl-2 text-xs leading-relaxed text-slate-500 italic"
            : "mt-0.5 border-l-2 border-amber-200 pl-2 text-xs leading-relaxed text-slate-500 italic"
        }
      >
        {evidence}
      </p>
    </li>
  );
}
