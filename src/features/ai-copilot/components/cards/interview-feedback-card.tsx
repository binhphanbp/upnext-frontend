"use client";

import { ArrowRight, CheckCircle, Target } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import type { AiInterviewFeedbackCard } from "../../types";
import { AiCardLabel, AiCardSection, AiCardShell, ScoreBar, ScoreRing } from "./card-primitives";

/** §8.4 — the five-dimension rubric, shown with its maximum so a 30 reads as */
/** "30 out of 40" rather than an unanchored number. */
const RUBRIC = [
  { key: "technicalCorrectness", max: 40 },
  { key: "relevance", max: 20 },
  { key: "depth", max: 15 },
  { key: "clarity", max: 15 },
  { key: "practicalEvidence", max: 10 },
] as const;

export function InterviewFeedbackCard({ card }: { card: AiInterviewFeedbackCard }) {
  const t = useTranslations("AiCopilot");

  return (
    <AiCardShell>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
            {t("interview.questionOf", { index: card.questionIndex, total: card.questionTotal })}
          </p>
          <p className="mt-1 text-[14.5px] leading-snug font-semibold text-balance text-slate-900">
            {card.question}
          </p>
        </div>
        <ScoreRing score={card.score} label={t("interview.score")} />
      </div>

      <AiCardSection className="bg-slate-50/60">
        <AiCardLabel>{t("interview.rubric")}</AiCardLabel>
        <ul className="space-y-2">
          {RUBRIC.map((dimension) => {
            const value = card.dimensions[dimension.key];
            return (
              <li key={dimension.key}>
                <div className="flex items-baseline gap-2">
                  <span className="flex-1 truncate text-xs text-slate-600">
                    {t(`interview.dimension.${dimension.key}`)}
                  </span>
                  <span className="shrink-0 text-[13px] font-bold text-slate-800 tabular-nums">
                    {value}
                    <span className="text-[11px] font-medium text-slate-400">/{dimension.max}</span>
                  </span>
                </div>
                <ScoreBar score={(value / dimension.max) * 100} className="mt-1" />
              </li>
            );
          })}
        </ul>
      </AiCardSection>

      <AiCardSection>
        <AiCardLabel>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle weight="fill" className="size-3.5 text-emerald-500" />
            {t("interview.strengths")}
          </span>
        </AiCardLabel>
        <ul className="space-y-1">
          {card.strengths.map((item) => (
            <li key={item} className="text-[13px] leading-relaxed text-slate-600">
              {item}
            </li>
          ))}
        </ul>
      </AiCardSection>

      <AiCardSection>
        <AiCardLabel>
          <span className="inline-flex items-center gap-1.5">
            <Target weight="fill" className="size-3.5 text-amber-500" />
            {t("interview.missingPoints")}
          </span>
        </AiCardLabel>
        <ul className="space-y-1">
          {card.missingPoints.map((item) => (
            <li key={item} className="text-[13px] leading-relaxed text-slate-600">
              {item}
            </li>
          ))}
        </ul>
      </AiCardSection>

      <AiCardSection className="flex justify-end bg-slate-50/60 py-2.5">
        <Link
          href={card.href}
          className="upnext-focus inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800"
        >
          {t("interview.openSession")}
          <ArrowRight className="size-3.5" />
        </Link>
      </AiCardSection>
    </AiCardShell>
  );
}
