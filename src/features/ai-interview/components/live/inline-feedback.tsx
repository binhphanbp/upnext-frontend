"use client";

import {
  ArrowRight,
  CaretDown,
  CheckCircle,
  Lightbulb,
  Target,
  WarningCircle,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";

import { RUBRIC_DIMENSIONS } from "../../lib/rubric";
import type { QuestionScore } from "../../types";
import { DimensionBar, ScoreDial, SectionLabel } from "../interview-primitives";

const AUTO_ADVANCE_SEC = 20;

/**
 * Feedback for the question just answered, delivered while it is still fresh.
 *
 * Two things make this different from a post-session report card:
 *
 * 1. It shows the *adaptive decision* — what the next question will be and why.
 *    Without it, an adaptive interview feels arbitrary; with it, the candidate
 *    understands that an easier follow-up is calibration, not punishment.
 * 2. The model answer stays collapsed by default. Reading a perfect answer
 *    immediately after giving an imperfect one is demoralising, and the point of
 *    this panel is to keep someone in the session, not to grade them.
 *
 * Auto-advance keeps the session moving but any interaction cancels it — the
 * countdown must never yank the panel away from someone mid-sentence.
 */
export function InlineFeedback({
  score,
  onContinue,
  isLastQuestion,
  className,
}: {
  score: QuestionScore;
  onContinue: () => void;
  isLastQuestion: boolean;
  className?: string;
}) {
  const t = useTranslations("AiInterview");
  const [remaining, setRemaining] = useState(AUTO_ADVANCE_SEC);
  const [isPaused, setIsPaused] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;
    if (remaining <= 0) {
      onContinue();
      return undefined;
    }
    const timer = setTimeout(() => setRemaining((current) => current - 1), 1_000);
    return () => clearTimeout(timer);
  }, [isPaused, onContinue, remaining]);

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4 backdrop-blur sm:p-5",
        className,
      )}
      aria-label={t("feedback.title")}
    >
      <div className="flex items-start gap-4">
        <ScoreDial score={score.score} size={76} surface="dark" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">
            {t("feedback.title")}
          </p>
          <p className="mt-1 text-sm leading-snug text-pretty text-slate-300">
            {score.questionText}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <SectionLabel surface="dark">{t("feedback.rubric")}</SectionLabel>
          {RUBRIC_DIMENSIONS.map((dimension) => (
            <DimensionBar
              key={dimension.key}
              label={t(dimension.labelKey)}
              value={score.dimensions[dimension.key]}
              max={dimension.max}
              surface="dark"
            />
          ))}
        </div>

        <div className="space-y-4">
          {score.strengths.length ? (
            <div>
              <SectionLabel surface="dark">{t("feedback.strengths")}</SectionLabel>
              <ul className="space-y-1.5">
                {score.strengths.map((item) => (
                  <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-slate-300">
                    <CheckCircle
                      weight="fill"
                      aria-hidden
                      className="mt-0.5 size-3.5 shrink-0 text-emerald-500"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {score.missingPoints.length ? (
            <div>
              <SectionLabel surface="dark">{t("feedback.missing")}</SectionLabel>
              <ul className="space-y-1.5">
                {score.missingPoints.map((item) => (
                  <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-slate-300">
                    <WarningCircle
                      weight="fill"
                      aria-hidden
                      className="mt-0.5 size-3.5 shrink-0 text-amber-500"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {/* Why the next question is what it is (§8.4 adaptive rules). */}
      {!isLastQuestion ? (
        <div className="mt-4 flex gap-2.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3 py-2.5">
          <Target weight="fill" aria-hidden className="mt-0.5 size-4 shrink-0 text-indigo-400" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-indigo-200">
              {t(`adaptive.${score.adaptiveDecision.action}`)}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-indigo-300/80">
              {score.adaptiveDecision.reason}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            setShowModelAnswer((current) => !current);
            setIsPaused(true);
          }}
          aria-expanded={showModelAnswer}
          className="upnext-focus flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-left transition-colors hover:bg-slate-800"
        >
          <Lightbulb weight="fill" aria-hidden className="size-4 shrink-0 text-amber-400" />
          <span className="flex-1 text-[13px] font-semibold text-slate-200">
            {t("feedback.modelAnswer")}
          </span>
          <CaretDown
            aria-hidden
            className={cn(
              "size-3.5 text-slate-500 transition-transform",
              showModelAnswer && "rotate-180",
            )}
          />
        </button>
        {showModelAnswer ? (
          <p className="mt-2 rounded-xl border border-slate-700/60 bg-slate-800/30 px-3.5 py-3 text-[13px] leading-relaxed text-pretty text-slate-300">
            {score.suggestedAnswer}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-700/60 pt-3">
        <button
          type="button"
          onClick={() => setIsPaused(true)}
          disabled={isPaused}
          className="upnext-focus rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-40"
        >
          {isPaused ? t("feedback.paused") : t("feedback.review", { seconds: remaining })}
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="upnext-focus inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-400"
        >
          {isLastQuestion ? t("feedback.finish") : t("feedback.next")}
          <ArrowRight weight="bold" aria-hidden className="size-4" />
        </button>
      </div>
    </section>
  );
}
