"use client";

import { ArrowsClockwise, SkipForward } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";

import { COMPETENCY_LABEL_KEYS } from "../../lib/rubric";
import type { InterviewQuestion } from "../../types";

/**
 * The question under discussion, plus the two escapes a candidate needs mid-turn:
 * hear it again, or move on.
 *
 * The time bar is a budget, not a buzzer — it never cuts anyone off. Running
 * over is itself feedback (it shows up as pace in the report), and a hard stop
 * mid-sentence would make the transcript unusable for scoring.
 */
export function QuestionCard({
  question,
  isAnswering,
  onRepeat,
  onSkip,
  className,
}: {
  question: InterviewQuestion;
  isAnswering: boolean;
  onRepeat: () => void;
  onSkip: () => void;
  className?: string;
}) {
  const t = useTranslations("AiInterview");
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    setElapsedSec(0);
    if (!isAnswering) return undefined;
    const timer = setInterval(() => setElapsedSec((current) => current + 1), 1_000);
    return () => clearInterval(timer);
  }, [isAnswering, question.id]);

  const ratio = Math.min(1, elapsedSec / question.timeLimitSec);
  const isOverBudget = elapsedSec > question.timeLimitSec;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-700/70 bg-slate-800/50 p-4 backdrop-blur-sm sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-700/80 px-2 py-0.5 text-[11px] font-bold text-slate-200 tabular-nums">
          {t("question.counter", { index: question.index, total: question.total })}
        </span>
        <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
          {t(COMPETENCY_LABEL_KEYS[question.competency])}
        </span>
        <span className="rounded-lg bg-slate-700/60 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
          {t(`difficulty.${question.difficulty}`)}
        </span>
        {question.followUpOfId ? (
          <span className="rounded-lg bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
            {t("question.adaptive")}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[17px] leading-relaxed font-semibold text-balance text-slate-50">
        {question.text}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-700">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none",
              isOverBudget ? "bg-amber-400" : "bg-slate-400",
            )}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <span
          className={cn(
            "shrink-0 text-xs font-semibold tabular-nums",
            isOverBudget ? "text-amber-400" : "text-slate-400",
          )}
        >
          {Math.floor(elapsedSec / 60)}:{(elapsedSec % 60).toString().padStart(2, "0")}
          <span className="text-slate-600"> / {Math.round(question.timeLimitSec / 60)}:00</span>
        </span>
      </div>

      {isAnswering ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onRepeat}
            className="upnext-focus inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700/70 hover:text-slate-100"
          >
            <ArrowsClockwise aria-hidden className="size-3.5" />
            {t("question.repeat")}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="upnext-focus inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-700/70 hover:text-slate-200"
          >
            <SkipForward aria-hidden className="size-3.5" />
            {t("question.skip")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
