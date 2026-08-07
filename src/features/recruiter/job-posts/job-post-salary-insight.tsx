"use client";

import { ArrowSquareOut, Coins, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import type { JobPostSalaryInsightResponse } from "./api";

type JobPostSalaryInsightProps = Readonly<{
  insight: JobPostSalaryInsightResponse | null;
  isLoading: boolean;
  errorMessage: string;
  experienceYears: string;
  canAnalyze: boolean;
  onExperienceYearsChange: (value: string) => void;
  onAnalyze: () => void;
  onApply?: (() => void) | undefined;
}>;

function getConfidenceLabel(
  t: ReturnType<typeof useTranslations>,
  confidence: "LOW" | "MEDIUM" | "HIGH",
) {
  switch (confidence) {
    case "LOW":
      return t("jobPostsPage.salaryInsight.confidenceLow");
    case "MEDIUM":
      return t("jobPostsPage.salaryInsight.confidenceMedium");
    case "HIGH":
      return t("jobPostsPage.salaryInsight.confidenceHigh");
  }
}

/**
 * The grounded search fires ~5 Google queries before Gemini answers; measured round trips sit at
 * 18–35s. Without a visible clock the panel looks frozen and recruiters hit "Phân tích" again.
 */
const ESTIMATED_RESEARCH_SECONDS = 35;

function ResearchingIndicator() {
  const t = useTranslations("Recruiter");
  const [remainingSeconds, setRemainingSeconds] = useState(ESTIMATED_RESEARCH_SECONDS);

  useEffect(() => {
    setRemainingSeconds(ESTIMATED_RESEARCH_SECONDS);
    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedRatio = (ESTIMATED_RESEARCH_SECONDS - remainingSeconds) / ESTIMATED_RESEARCH_SECONDS;

  return (
    <output className="mt-4 block rounded-lg border border-emerald-200 bg-white/90 px-3 py-3">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="relative animate-pulse text-emerald-600"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {t("jobPostsPage.salaryInsight.researchingTitle")}
          </p>
          <p className="text-xs font-normal text-slate-500">
            {remainingSeconds > 0
              ? t("jobPostsPage.salaryInsight.researchingCountdown", { seconds: remainingSeconds })
              : t("jobPostsPage.salaryInsight.researchingFinishing")}
          </p>
        </div>
      </div>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.min(elapsedRatio, 0.97) * 100}%` }}
        />
      </div>
    </output>
  );
}

function getComparisonLabel(
  t: ReturnType<typeof useTranslations>,
  position: "NOT_PROVIDED" | "BELOW" | "ALIGNED" | "ABOVE",
) {
  switch (position) {
    case "NOT_PROVIDED":
      return t("jobPostsPage.salaryInsight.comparisonNotProvided");
    case "BELOW":
      return t("jobPostsPage.salaryInsight.comparisonBelow");
    case "ALIGNED":
      return t("jobPostsPage.salaryInsight.comparisonAligned");
    case "ABOVE":
      return t("jobPostsPage.salaryInsight.comparisonAbove");
  }
}

export function JobPostSalaryInsight({
  insight,
  isLoading,
  errorMessage,
  experienceYears,
  canAnalyze,
  onExperienceYearsChange,
  onAnalyze,
  onApply,
}: JobPostSalaryInsightProps) {
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const experienceInputId = useId();
  const isWebGrounded = insight?.available && insight.basis === "WEB_GROUNDED_AI";

  return (
    <section
      aria-labelledby="salary-insight-heading"
      className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Sparkle size={18} weight="fill" aria-hidden="true" />
          </span>
          <div>
            <h3 id="salary-insight-heading" className="text-sm font-semibold text-slate-900">
              {t("jobPostsPage.salaryInsight.heading")}
            </h3>
            <p className="mt-1 text-xs leading-5 font-normal text-slate-600">
              {t("jobPostsPage.salaryInsight.description")}
            </p>
          </div>
        </div>
        <div className="grid w-full gap-2">
          <div>
            <Label htmlFor={experienceInputId} className="text-xs font-medium text-slate-700">
              {t("jobPostsPage.aiGeneratorForm.yearsExperienceLabel")}{" "}
              <span className="text-rose-600">*</span>
            </Label>
            <FormInput
              id={experienceInputId}
              type="number"
              min={0}
              max={50}
              step={0.5}
              inputMode="decimal"
              aria-required="true"
              value={experienceYears}
              onChange={(event) => onExperienceYearsChange(event.target.value)}
              placeholder={t("jobPostsPage.aiGeneratorForm.yearsExperiencePlaceholder")}
              className="mt-1 h-10 bg-white font-normal"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!canAnalyze || isLoading}
            onClick={onAnalyze}
            className="w-full bg-white font-medium"
          >
            <Coins size={17} aria-hidden="true" />
            {isLoading
              ? t("jobPostsPage.salaryInsight.analyzing")
              : insight
                ? t("jobPostsPage.salaryInsight.reanalyze")
                : t("jobPostsPage.salaryInsight.analyze")}
          </Button>
        </div>
      </div>

      {!canAnalyze && !insight ? (
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs font-normal text-slate-600">
          {t("jobPostsPage.salaryInsight.needMoreInput")}
        </p>
      ) : null}

      <div aria-live="polite">
        {isLoading ? <ResearchingIndicator /> : null}

        {errorMessage ? (
          <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && insight && !insight.available ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-sm font-medium text-amber-900">
              {t("jobPostsPage.salaryInsight.insufficientDataTitle")}
            </p>
            <p className="mt-1 text-xs leading-5 font-normal text-amber-800">
              {t("jobPostsPage.salaryInsight.insufficientDataText", {
                message: insight.message,
                sampleSize: insight.sampleSize,
              })}
            </p>
          </div>
        ) : null}

        {!isLoading && insight?.available ? (
          <div className="mt-4 space-y-4">
            <div
              className="grid grid-cols-3 gap-2"
              aria-label={t("jobPostsPage.salaryInsight.marketRangeAria")}
            >
              <SalaryMetric label="P25" value={insight.market.p25} locale={locale} />
              <SalaryMetric
                label={t("jobPostsPage.salaryInsight.medianLabel")}
                value={insight.market.median}
                locale={locale}
                featured
              />
              <SalaryMetric label="P75" value={insight.market.p75} locale={locale} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium",
                  insight.confidence === "HIGH" && "bg-emerald-100 text-emerald-800",
                  insight.confidence === "MEDIUM" && "bg-sky-100 text-sky-800",
                  insight.confidence === "LOW" && "bg-amber-100 text-amber-800",
                )}
              >
                {getConfidenceLabel(t, insight.confidence)}
              </span>
              <span className="font-normal text-slate-600">
                {isWebGrounded
                  ? t("jobPostsPage.salaryInsight.webSourcesCount", { count: insight.sampleSize })
                  : t("jobPostsPage.salaryInsight.similarPostsCount", {
                      count: insight.sampleSize,
                      months: insight.lookbackMonths,
                    })}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">
                {isWebGrounded
                  ? t("jobPostsPage.salaryInsight.googleSearchSource")
                  : t("jobPostsPage.salaryInsight.upnextDataSource")}
              </span>
            </div>

            {insight.marketSummary ? (
              <p className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-xs leading-5 font-normal text-slate-700">
                {insight.marketSummary}
              </p>
            ) : null}

            <p className="text-sm font-medium text-slate-800">
              {getComparisonLabel(t, insight.comparison.position)}
              {insight.comparison.differencePercent !== null
                ? t("jobPostsPage.salaryInsight.differencePercentSuffix", {
                    sign: insight.comparison.differencePercent > 0 ? "+" : "",
                    percent: insight.comparison.differencePercent,
                  })
                : ""}
            </p>

            {insight.matchedFactors.length ? (
              <ul
                className="flex flex-wrap gap-1.5"
                aria-label={t("jobPostsPage.salaryInsight.matchedFactorsAria")}
              >
                {insight.matchedFactors.map((factor) => (
                  <li
                    key={factor}
                    className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-normal text-emerald-800"
                  >
                    {factor}
                  </li>
                ))}
              </ul>
            ) : null}

            {insight.sources?.length ? (
              <details className="group rounded-lg border border-emerald-200 bg-white/80">
                <summary className="upnext-focus cursor-pointer list-none rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 marker:hidden">
                  {t("jobPostsPage.salaryInsight.webSourcesToggle", {
                    count: insight.sources.length,
                  })}
                  <span className="float-right text-xs font-normal text-emerald-700 group-open:hidden">
                    {t("jobPostsPage.salaryInsight.viewSources")}
                  </span>
                  <span className="float-right hidden text-xs font-normal text-emerald-700 group-open:inline">
                    {t("jobPostsPage.salaryInsight.collapseSources")}
                  </span>
                </summary>
                <div className="border-t border-emerald-100 px-3 py-3">
                  <ul className="space-y-2">
                    {insight.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="upnext-focus inline-flex max-w-full items-center gap-1.5 rounded text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          <span className="truncate">{source.title}</span>
                          <ArrowSquareOut size={14} className="shrink-0" aria-hidden="true" />
                          <span className="sr-only">
                            {t("jobPostsPage.salaryInsight.openInNewTab")}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  {insight.searchedAt ? (
                    <p className="mt-3 text-[11px] font-normal text-slate-500">
                      {t("jobPostsPage.salaryInsight.researchedAtPrefix")}
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(insight.searchedAt))}
                    </p>
                  ) : null}
                </div>
              </details>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-emerald-200 pt-3">
              <p className="text-xs leading-5 font-normal text-slate-500">
                {isWebGrounded
                  ? t("jobPostsPage.salaryInsight.webGroundedDisclaimer")
                  : t("jobPostsPage.salaryInsight.upnextDataDisclaimer")}
              </p>
              {onApply ? (
                <Button
                  type="button"
                  onClick={onApply}
                  className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                >
                  {t("jobPostsPage.salaryInsight.applyRangeButton", {
                    min: formatSalary(insight.recommended.salaryMin, locale),
                    max: formatSalary(insight.recommended.salaryMax, locale),
                  })}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SalaryMetric({
  label,
  value,
  locale,
  featured = false,
}: Readonly<{ label: string; value: number; locale: string; featured?: boolean }>) {
  const t = useTranslations("Recruiter");
  return (
    <div
      className={cn(
        "rounded-lg border bg-white px-2 py-3 text-center",
        featured ? "border-emerald-400 shadow-sm" : "border-emerald-100",
      )}
    >
      <span className="block text-[10px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <strong className="mt-1 block text-xs font-semibold text-slate-900 sm:text-sm">
        {formatSalary(value, locale)}
      </strong>
      <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
        {t("jobPostsPage.salaryInsight.perMonth")}
      </span>
    </div>
  );
}

function formatSalary(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
