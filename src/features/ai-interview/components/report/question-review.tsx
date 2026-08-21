"use client";

import { CaretDown, CheckCircle, Lightbulb, Quotes, WarningCircle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";

import { SCRIPTED_TURNS } from "../../api/mock-session";
import { COMPETENCY_LABEL_KEYS, RUBRIC_DIMENSIONS } from "../../lib/rubric";
import type { QuestionScore } from "../../types";
import { DimensionBar, ScoreDial } from "../interview-primitives";

/**
 * One question, expandable.
 *
 * Collapsed by default and ordered as they were asked, because the report is
 * read twice: once immediately, skimming for the number, and once later while
 * preparing. The first pass needs the headline; the second needs the transcript
 * and the model answer side by side.
 */
export function QuestionReview({ score, index }: { score: QuestionScore; index: number }) {
  const t = useTranslations("AiInterview");
  const [isExpanded, setIsExpanded] = useState(false);
  const turn = SCRIPTED_TURNS.find((item) => item.question.id === score.questionId);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="upnext-focus flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
      >
        <ScoreDial score={score.score} size={44} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 tabular-nums">
              {t("report.questionNumber", { index })}
            </span>
            {turn ? (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                {t(COMPETENCY_LABEL_KEYS[turn.question.competency])}
              </span>
            ) : null}
          </span>
          <span className="mt-1 block text-sm leading-snug font-semibold text-pretty text-slate-900">
            {score.questionText}
          </span>
        </span>
        <CaretDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded ? (
        <div className="space-y-5 border-t border-slate-100 px-4 py-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2.5">
              {RUBRIC_DIMENSIONS.map((dimension) => (
                <DimensionBar
                  key={dimension.key}
                  label={t(dimension.labelKey)}
                  value={score.dimensions[dimension.key]}
                  max={dimension.max}
                />
              ))}
            </div>

            <div className="space-y-3.5">
              {score.strengths.length ? (
                <FindingList
                  title={t("feedback.strengths")}
                  items={score.strengths}
                  tone="positive"
                />
              ) : null}
              {score.missingPoints.length ? (
                <FindingList title={t("feedback.missing")} items={score.missingPoints} tone="gap" />
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              {t("report.yourAnswer")}
            </p>
            <blockquote className="flex gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
              <Quotes
                weight="fill"
                aria-hidden
                className="mt-0.5 size-4 shrink-0 -scale-x-100 text-slate-300"
              />
              <p className="text-[13px] leading-relaxed text-pretty text-slate-600 italic">
                {score.transcript}
              </p>
            </blockquote>
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              <Lightbulb weight="fill" aria-hidden className="size-3.5 text-amber-500" />
              {t("feedback.modelAnswer")}
            </p>
            <p className="rounded-xl border border-amber-100 bg-amber-50/60 px-3.5 py-3 text-[13px] leading-relaxed text-pretty text-slate-700">
              {score.suggestedAnswer}
            </p>
          </div>

          {turn ? (
            <div>
              <p className="mb-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                {t("report.expectedSignals")}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {turn.question.expectedSignals.map((signal) => (
                  <li
                    key={signal}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                  >
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FindingList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "gap";
}) {
  const Icon = tone === "positive" ? CheckCircle : WarningCircle;
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-slate-700">
            <Icon
              weight="fill"
              aria-hidden
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                tone === "positive" ? "text-emerald-500" : "text-amber-500",
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
