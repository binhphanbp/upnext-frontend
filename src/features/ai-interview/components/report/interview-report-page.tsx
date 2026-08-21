"use client";

import {
  ArrowCounterClockwise,
  ArrowRight,
  ChatCircleDots,
  Info,
  Target,
  TrendUp,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import { formatDuration, paceBand } from "../../lib/delivery-metrics";
import {
  COMPETENCY_LABEL_KEYS,
  LEVEL_LABEL_KEYS,
  RUBRIC_DIMENSIONS,
  scoreBand,
} from "../../lib/rubric";
import type { InterviewReport } from "../../types";
import { DimensionBar, ScoreDial, SectionLabel, StatTile } from "../interview-primitives";
import { QuestionReview } from "./question-review";

/**
 * The post-session report.
 *
 * Ordered by what changes behaviour, not by what is easiest to compute: the
 * weakest competency and the three priorities come before the per-question
 * detail, because someone who reads only the top of this page should still walk
 * away knowing what to practise.
 *
 * Delivery metrics sit in their own section under an explicit banner. Keeping
 * them visually apart from the rubric is the interface honouring the same
 * boundary the code does — they did not affect the score.
 */
export function InterviewReportPage({
  report,
  onRestart,
}: {
  report: InterviewReport;
  onRestart: () => void;
}) {
  const t = useTranslations("AiInterview");
  const band = scoreBand(report.overallScore);
  const weakest = report.competencyScores[0];
  const pace = paceBand(report.delivery.wpm);

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <ScoreDial score={report.overallScore} size={112} caption={t("report.overall")} />

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              {t("report.title")}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-[-0.02em] text-balance text-slate-950 sm:text-2xl">
              {report.jobTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-slate-600">
              {t(`report.verdict.${band}`)}
            </p>

            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              <div className="flex gap-1.5">
                <dt className="text-slate-500">{t("report.level")}</dt>
                <dd className="font-semibold text-slate-800">
                  {t(LEVEL_LABEL_KEYS[report.level])}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">{t("report.duration")}</dt>
                <dd className="font-semibold text-slate-800 tabular-nums">
                  {formatDuration(report.durationSec * 1_000)}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">{t("report.questions")}</dt>
                <dd className="font-semibold text-slate-800 tabular-nums">
                  {report.questionScores.length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:w-44">
            <Button onClick={onRestart}>
              <ArrowCounterClockwise weight="bold" aria-hidden />
              {t("report.restart")}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/candidate/ai">
                <ChatCircleDots weight="fill" aria-hidden />
                {t("report.askCopilot")}
              </Link>
            </Button>
          </div>
        </div>

        {weakest ? (
          <p className="flex items-start gap-2.5 border-t border-slate-100 bg-amber-50/60 px-5 py-3 sm:px-6">
            <Target weight="fill" aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <span className="text-[13px] leading-relaxed text-slate-700">
              {t("report.weakestLead", {
                competency: t(COMPETENCY_LABEL_KEYS[weakest.competency]),
                score: weakest.score,
              })}
            </span>
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <SectionLabel>{t("report.rubricAverages")}</SectionLabel>
          <div className="space-y-3">
            {RUBRIC_DIMENSIONS.map((dimension) => (
              <DimensionBar
                key={dimension.key}
                label={t(dimension.labelKey)}
                value={report.dimensionAverages[dimension.key]}
                max={dimension.max}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <SectionLabel>{t("report.byCompetency")}</SectionLabel>
          <div className="space-y-3">
            {report.competencyScores.map((entry) => (
              <DimensionBar
                key={entry.competency}
                label={`${t(COMPETENCY_LABEL_KEYS[entry.competency])} · ${entry.questionCount} ${t("report.questionsShort")}`}
                value={entry.score}
                max={100}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FindingCard
          icon={<TrendUp weight="fill" aria-hidden className="size-4 text-emerald-600" />}
          title={t("report.strengths")}
          items={report.strengths}
          tone="positive"
        />
        <FindingCard
          icon={<Target weight="fill" aria-hidden className="size-4 text-amber-600" />}
          title={t("report.priorities")}
          items={report.priorities}
          tone="gap"
        />
      </div>

      {/* Coaching-only zone. Kept visually distinct from everything above. */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <div className="flex items-start gap-2.5">
          <Info weight="fill" aria-hidden className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">{t("report.deliveryTitle")}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-pretty text-slate-600">
              {t("report.deliveryDisclaimer")}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-4">
          <StatTile
            surface="light"
            label={t("coaching.pace")}
            value={`${report.delivery.wpm} wpm`}
            tone={pace === "ideal" ? "good" : "watch"}
            hint={t(`coaching.paceBand.${pace}`)}
          />
          <StatTile
            surface="light"
            label={t("coaching.fillers")}
            value={report.delivery.fillerCount}
            hint={
              report.delivery.fillerBreakdown
                .slice(0, 2)
                .map((entry) => `${entry.word} ×${entry.count}`)
                .join(", ") || t("coaching.noFillers")
            }
          />
          <StatTile
            surface="light"
            label={t("coaching.longestPause")}
            value={
              report.delivery.longestPauseMs
                ? `${(report.delivery.longestPauseMs / 1000).toFixed(1)}s`
                : "—"
            }
            hint={t("coaching.pauseHint")}
          />
          <StatTile
            surface="light"
            label={t("report.spokenTime")}
            value={formatDuration(report.delivery.spokenMs)}
            hint={t("report.spokenTimeHint")}
          />
        </div>
      </section>

      <section>
        <SectionLabel>{t("report.questionByQuestion")}</SectionLabel>
        <div className="space-y-2.5">
          {report.questionScores.map((score, index) => (
            <QuestionReview key={score.questionId} score={score} index={index + 1} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        <SectionLabel>{t("report.nextSteps")}</SectionLabel>
        <ol className="space-y-3">
          {report.nextSteps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden
                className="grid size-6 shrink-0 place-items-center rounded-lg bg-emerald-600 text-xs font-bold text-white"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{step.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-pretty text-slate-700">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <Button variant="outline" className="mt-4 bg-white" asChild>
          <Link href="/candidate/ai">
            {t("report.planWithCopilot")}
            <ArrowRight weight="bold" aria-hidden />
          </Link>
        </Button>
      </section>
    </div>
  );
}

function FindingCard({
  icon,
  title,
  items,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: "positive" | "gap";
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
        {icon}
        {title}
      </h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-700">
            <span
              aria-hidden
              className={cn(
                "mt-[0.55em] size-1.5 shrink-0 rounded-full",
                tone === "positive" ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            <span className="text-pretty">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
