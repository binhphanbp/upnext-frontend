"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Link } from "@/i18n/navigation";

import type { PublicJob } from "./api";
import { getPublicJobs } from "./api";
import { Bot, BriefcaseBusiness, ChevronRight, PieChart, TrendingUp, Zap } from "./marketing-icons";

type MarketChart = "weekly" | "salary";

type WeeklyPoint = {
  label: string;
  rangeLabel: string;
  value: number;
};

type SalaryBand = {
  id: string;
  label: string;
  shortLabel: string;
  lowerBound: number;
  upperBound: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const barColors = ["#48d6a5", "#10b981", "#8b6cf4", "#4cb7e9", "#f6b528"];

function localeCode(locale: string) {
  return locale === "en" ? "en-US" : "vi-VN";
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function publicationTime(job: PublicJob) {
  return parseDate(job.publishedAt) ?? parseDate(job.createdAt);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function startOfCalendarWeek(value: Date) {
  const day = value.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return new Date(startOfDay(value).getTime() - daysSinceMonday * DAY_MS);
}

function useCompactViewport() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setIsCompact(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isCompact;
}

function formatRelativeTime(timestamp: number | null, locale: string) {
  if (!timestamp) return "";

  const elapsedMs = Date.now() - timestamp;
  const formatter = new Intl.RelativeTimeFormat(localeCode(locale), { numeric: "auto" });
  const minutes = Math.round(elapsedMs / (60 * 1000));

  if (Math.abs(minutes) < 60) return formatter.format(-minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(-hours, "hour");

  return formatter.format(-Math.round(hours / 24), "day");
}

function formatDateRange(start: Date, end: Date, locale: string) {
  const formatter = new Intl.DateTimeFormat(localeCode(locale), {
    day: "2-digit",
    month: "2-digit",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function buildWeeklySeries(jobs: PublicJob[], referenceDate: Date, locale: string): WeeklyPoint[] {
  const currentWeekStart = startOfCalendarWeek(referenceDate);
  const today = startOfDay(referenceDate);
  const jobsByWeek = Array.from({ length: 5 }, (_, index) => {
    const start = new Date(currentWeekStart.getTime() - (4 - index) * WEEK_MS);
    const end = new Date(start.getTime() + WEEK_MS);
    return { start, end, value: 0 };
  });

  for (const job of jobs) {
    const timestamp = publicationTime(job);
    if (!timestamp) continue;

    const bucket = jobsByWeek.find(
      (week) => timestamp >= week.start.getTime() && timestamp < week.end.getTime(),
    );
    if (bucket) bucket.value += 1;
  }

  const labelFormatter = new Intl.DateTimeFormat(localeCode(locale), {
    day: "2-digit",
    month: "2-digit",
  });

  return jobsByWeek.map((week) => {
    const endInclusive = new Date(Math.min(week.end.getTime() - DAY_MS, today.getTime()));
    return {
      label: labelFormatter.format(week.start),
      rangeLabel: formatDateRange(week.start, endInclusive, locale),
      value: week.value,
    };
  });
}

function publishedSalaryMidpoint(job: PublicJob) {
  if (!job.salaryIsVisible || job.salaryCurrency?.toUpperCase() !== "VND") return null;

  const minimum = job.salaryMin ?? job.salaryMax;
  const maximum = job.salaryMax ?? job.salaryMin;
  if (minimum === null || maximum === null || minimum < 0 || maximum <= 0 || maximum < minimum) {
    return null;
  }

  return Math.round((minimum + maximum) / 2);
}

function MarketHeader({
  title,
  description,
  scope,
  exploreJobsLabel,
}: {
  title: string;
  description: string;
  scope?: string;
  exploreJobsLabel: string;
}) {
  return (
    <header className="jm-head">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {scope && <span className="jm-scope">{scope}</span>}
      </div>
      <Link className="jm-report-btn" href="/jobs">
        <BriefcaseBusiness size={17} aria-hidden="true" />
        {exploreJobsLabel}
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </header>
  );
}

function MarketState({
  title,
  description,
  actionLabel,
  onAction,
  isRetrying,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="jm-state" aria-live="polite">
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} disabled={isRetrying}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return <div className="jm-chart-empty">{message}</div>;
}

function MarketTooltip({
  active,
  label,
  numberFormatter,
  payload,
  jobsLabel,
}: {
  active?: boolean;
  label?: string;
  numberFormatter: Intl.NumberFormat;
  payload?: Array<{
    value?: number;
    payload?: { label?: string; rangeLabel?: string };
  }>;
  jobsLabel: string;
}) {
  const value = payload?.[0]?.value;
  if (!active || typeof value !== "number") return null;
  const dataPoint = payload?.[0]?.payload;
  const displayLabel = dataPoint?.rangeLabel ?? dataPoint?.label ?? label;

  return (
    <div className="jm-tooltip">
      <span>{displayLabel}</span>
      <strong>
        {numberFormatter.format(value)} {jobsLabel}
      </strong>
    </div>
  );
}

function JobLogo({ job }: { job: PublicJob }) {
  const [failed, setFailed] = useState(false);
  const logo = job.company?.logoUrl ?? job.company?.logoFile?.publicUrl ?? "";
  const companyName = job.company?.name ?? "UpNext";

  if (!logo || failed) {
    return (
      <span className="jm-latest-mono" aria-hidden="true">
        {companyName.charAt(0).toLocaleUpperCase()}
      </span>
    );
  }

  return (
    <Image src={logo} alt="" width={40} height={40} unoptimized onError={() => setFailed(true)} />
  );
}

function MarketIllustration() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="jm-illu-fallback" aria-hidden="true">
        <Bot size={52} />
      </span>
    );
  }

  return (
    <Image
      className="jm-illu-img"
      src="/assets/marketing/home/market-ai.png"
      alt=""
      width={560}
      height={320}
      loading="eager"
      sizes="(max-width: 1180px) calc(100vw - 40px), 320px"
      onError={() => setFailed(true)}
    />
  );
}

export function JobMarket() {
  const locale = useLocale();
  const t = useTranslations("HomePage.content.market.snapshot");
  const isCompact = useCompactViewport();
  const [activeChart, setActiveChart] = useState<MarketChart>("weekly");
  const numberFormatter = useMemo(() => new Intl.NumberFormat(localeCode(locale)), [locale]);
  const compactNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(localeCode(locale), { notation: "compact", maximumFractionDigits: 1 }),
    [locale],
  );

  const jobsQuery = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
    staleTime: 30_000,
  });

  const salaryBands = useMemo<SalaryBand[]>(
    () => [
      {
        id: "under-10",
        label: t("salaryUnder10"),
        shortLabel: t("salaryUnder10Short"),
        lowerBound: 0,
        upperBound: 10_000_000,
      },
      {
        id: "10-20",
        label: t("salary10To20"),
        shortLabel: t("salary10To20Short"),
        lowerBound: 10_000_000,
        upperBound: 20_000_000,
      },
      {
        id: "20-30",
        label: t("salary20To30"),
        shortLabel: t("salary20To30Short"),
        lowerBound: 20_000_000,
        upperBound: 30_000_000,
      },
      {
        id: "30-50",
        label: t("salary30To50"),
        shortLabel: t("salary30To50Short"),
        lowerBound: 30_000_000,
        upperBound: 50_000_000,
      },
      {
        id: "over-50",
        label: t("salaryOver50"),
        shortLabel: t("salaryOver50Short"),
        lowerBound: 50_000_000,
        upperBound: null,
      },
    ],
    [t],
  );

  const snapshot = useMemo(() => {
    const now = new Date();
    const nowTimestamp = now.getTime();
    const jobs = jobsQuery.data ?? [];
    const visibleJobs = jobs.filter((job) => {
      const published = publicationTime(job);
      const expiry = parseDate(job.expiredAt);
      const isPublished = published !== null && published <= nowTimestamp;
      const isNotExpired = expiry === null || expiry > nowTimestamp;
      return isPublished && isNotExpired;
    });
    const latestJobs = [...visibleJobs]
      .sort((first, second) => (publicationTime(second) ?? 0) - (publicationTime(first) ?? 0))
      .slice(0, 3);
    const newJobs24h = visibleJobs.filter((job) => {
      const published = publicationTime(job);
      return (
        published !== null && nowTimestamp - published >= 0 && nowTimestamp - published <= DAY_MS
      );
    }).length;
    const hiringCompanies = new Set(
      visibleJobs
        .map((job) => job.company?.id)
        .filter((companyId): companyId is string => Boolean(companyId)),
    ).size;
    const weeklySeries = buildWeeklySeries(visibleJobs, now, locale);
    const salaryDistribution = salaryBands.map((band) => ({ ...band, value: 0 }));

    for (const job of visibleJobs) {
      const midpoint = publishedSalaryMidpoint(job);
      if (midpoint === null) continue;
      const band = salaryDistribution.find(
        (candidate) =>
          midpoint >= candidate.lowerBound &&
          (candidate.upperBound === null || midpoint < candidate.upperBound),
      );
      if (band) band.value += 1;
    }

    return {
      latestJobs,
      visibleJobs,
      newJobs24h,
      hiringCompanies,
      weeklySeries,
      salaryDistribution,
    };
  }, [jobsQuery.data, locale, salaryBands]);

  const hasWeeklyData = snapshot.weeklySeries.some((point) => point.value > 0);
  const salaryJobCount = snapshot.salaryDistribution.reduce((sum, band) => sum + band.value, 0);
  const hasSalaryData = salaryJobCount > 0;

  useEffect(() => {
    if (!hasWeeklyData && hasSalaryData) setActiveChart("salary");
  }, [hasSalaryData, hasWeeklyData]);

  const completedWeeks = snapshot.weeklySeries.slice(0, -1);
  const completedWeeksAverage =
    completedWeeks.length > 0
      ? completedWeeks.reduce((sum, point) => sum + point.value, 0) / completedWeeks.length
      : null;
  const completedWeeksHigh = hasWeeklyData
    ? completedWeeks.reduce(
        (highest, point) => (point.value > highest.value ? point : highest),
        completedWeeks[0]!,
      )
    : null;
  const weeklyLatest = snapshot.weeklySeries.at(-1);
  const popularSalary = hasSalaryData
    ? snapshot.salaryDistribution.reduce(
        (popular, band) => (band.value > popular.value ? band : popular),
        snapshot.salaryDistribution[0]!,
      )
    : null;
  const updatedAt = jobsQuery.dataUpdatedAt
    ? new Intl.DateTimeFormat(localeCode(locale), {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(jobsQuery.dataUpdatedAt))
    : "";

  const title = t("title");
  const description = t("description");

  if (jobsQuery.isPending) {
    return (
      <section className="marketing-home-market" aria-busy="true" aria-label={title}>
        <MarketHeader title={title} description={description} exploreJobsLabel={t("exploreJobs")} />
        <div className="jm-loading" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  if (jobsQuery.isError) {
    return (
      <section className="marketing-home-market" aria-label={title}>
        <MarketHeader title={title} description={description} exploreJobsLabel={t("exploreJobs")} />
        <MarketState
          title={t("marketDataErrorTitle")}
          description={t("marketDataErrorDescription")}
          actionLabel={t("retry")}
          onAction={() => void jobsQuery.refetch()}
          isRetrying={jobsQuery.isFetching}
        />
      </section>
    );
  }

  if (snapshot.visibleJobs.length === 0) {
    return (
      <section className="marketing-home-market" aria-label={title}>
        <MarketHeader title={title} description={description} exploreJobsLabel={t("exploreJobs")} />
        <MarketState title={t("noMarketDataTitle")} description={t("noMarketDataDescription")} />
      </section>
    );
  }

  const scope = t("scope", {
    count: numberFormatter.format(snapshot.visibleJobs.length),
    updatedAt,
  });
  const chartHeading = (chart: MarketChart) =>
    chart === "weekly" ? t("showWeeklyChart") : t("showSalaryChart");

  return (
    <section className="marketing-home-market" aria-label={title}>
      <MarketHeader
        title={title}
        description={description}
        scope={scope}
        exploreJobsLabel={t("exploreJobs")}
      />

      <div className="jm-grid">
        <aside className="jm-rail" aria-labelledby="jm-latest-heading">
          <div className="jm-illu">
            <MarketIllustration />
          </div>
          <div className="jm-latest">
            <div className="jm-latest-head">
              <span className="jm-latest-icon" aria-hidden="true">
                <Zap size={15} />
              </span>
              <div>
                <h3 id="jm-latest-heading">{t("latestJobs")}</h3>
                <p>{t("latestJobsDescription")}</p>
              </div>
            </div>
            <ul>
              {snapshot.latestJobs.map((job) => {
                const city = job.jobPostLocations?.[0]?.jobLocation?.city ?? t("unknownLocation");
                const employmentType = job.employmentType?.name ?? t("unknownEmploymentType");
                const publishedAt = publicationTime(job);
                return (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}`} className="jm-latest-link">
                      <span className="jm-latest-logo">
                        <JobLogo job={job} />
                      </span>
                      <span className="jm-latest-body">
                        <b>{job.title}</b>
                        <em>{job.company?.name ?? "UpNext"}</em>
                        <span className="jm-latest-meta">
                          <small>
                            {city} · {employmentType}
                          </small>
                          {publishedAt && (
                            <time dateTime={new Date(publishedAt).toISOString()}>
                              {formatRelativeTime(publishedAt, locale)}
                            </time>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link className="jm-latest-all" href="/jobs">
              {t("viewAllJobs")} <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <div className="jm-main">
          <div className="jm-kpis">
            {[
              { value: snapshot.newJobs24h, label: t("newJobs24h"), accentClass: "jm-kpi-mint" },
              {
                value: snapshot.visibleJobs.length,
                label: t("visibleJobs"),
                accentClass: "jm-kpi-green",
              },
              {
                value: snapshot.hiringCompanies,
                label: t("hiringCompanies"),
                accentClass: "jm-kpi-violet",
              },
            ].map((kpi) => (
              <article className={`jm-kpi ${kpi.accentClass}`} key={kpi.label}>
                <span className="jm-kpi-mark" aria-hidden="true" />
                <strong>{numberFormatter.format(kpi.value)}</strong>
                <span className="jm-kpi-label">{kpi.label}</span>
              </article>
            ))}
          </div>

          <fieldset className="jm-chart-tabs">
            <legend className="sr-only">{t("mobileChartsLabel")}</legend>
            {(["weekly", "salary"] as const).map((chart) => (
              <button
                type="button"
                className={activeChart === chart ? "is-active" : ""}
                aria-pressed={activeChart === chart}
                key={chart}
                onClick={() => setActiveChart(chart)}
              >
                {chartHeading(chart)}
              </button>
            ))}
          </fieldset>

          <div className="jm-charts">
            <article
              className={`jm-chart jm-chart-weekly${activeChart === "weekly" ? " is-active" : ""}`}
            >
              <div className="jm-chart-head">
                <div>
                  <h3 id="jm-weekly-title">
                    <TrendingUp size={16} aria-hidden="true" />
                    <span>{t("weeklyTitle")}</span>
                  </h3>
                  <p>{t("weeklyDescription")}</p>
                </div>
                <span className="jm-chart-context">{t("lastFiveWeeks")}</span>
              </div>

              {hasWeeklyData ? (
                <figure aria-labelledby="jm-weekly-title">
                  <div className="jm-chart-body">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 1, height: 1 }}
                    >
                      <AreaChart
                        data={snapshot.weeklySeries}
                        margin={{ top: 18, right: 8, bottom: 4, left: -14 }}
                      >
                        <defs>
                          <linearGradient id="jmGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="4 6" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          dy={6}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={44}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          tickFormatter={(value) => compactNumberFormatter.format(value)}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={
                            <MarketTooltip
                              numberFormatter={numberFormatter}
                              jobsLabel={t("jobs")}
                            />
                          }
                          cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          strokeWidth={3}
                          fill="url(#jmGrowth)"
                          dot={{ r: 4, fill: "#ffffff", strokeWidth: 2.5, stroke: "#10b981" }}
                          activeDot={{ r: 6, fill: "#10b981", strokeWidth: 3, stroke: "#ffffff" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <figcaption className="sr-only">{t("weeklyDescription")}</figcaption>
                  <table className="sr-only">
                    <caption>{t("accessibleWeeklyTable")}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t("week")}</th>
                        <th scope="col">{t("jobCount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.weeklySeries.map((point) => (
                        <tr key={point.rangeLabel}>
                          <td>{point.rangeLabel}</td>
                          <td>{numberFormatter.format(point.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </figure>
              ) : (
                <ChartEmpty message={t("noWeeklyData")} />
              )}

              {hasWeeklyData &&
                completedWeeksAverage !== null &&
                completedWeeksHigh &&
                weeklyLatest && (
                  <div className="jm-chart-foot">
                    <span>
                      <em>{t("completedWeeksAverage")}</em>
                      <b>{numberFormatter.format(completedWeeksAverage)}</b>
                      <small>{t("jobsPerWeek")}</small>
                    </span>
                    <span>
                      <em>{t("completedWeeksHigh")}</em>
                      <b>{numberFormatter.format(completedWeeksHigh.value)}</b>
                      <small>{completedWeeksHigh.rangeLabel}</small>
                    </span>
                    <span className="jm-chart-foot-up">
                      <em>{t("latestWeek")}</em>
                      <b>{numberFormatter.format(weeklyLatest.value)}</b>
                      <small>{weeklyLatest.rangeLabel}</small>
                    </span>
                  </div>
                )}
            </article>

            <article
              className={`jm-chart jm-chart-salary${activeChart === "salary" ? " is-active" : ""}`}
            >
              <div className="jm-chart-head">
                <div>
                  <h3 id="jm-salary-title">
                    <PieChart size={16} aria-hidden="true" />
                    <span>{t("salaryTitle")}</span>
                  </h3>
                  <p>{t("salaryDescription")}</p>
                </div>
                <span className="jm-chart-context">{t("monthlyVnd")}</span>
              </div>

              {hasSalaryData ? (
                <figure aria-labelledby="jm-salary-title">
                  <div className="jm-chart-body">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 1, height: 1 }}
                    >
                      <BarChart
                        data={snapshot.salaryDistribution}
                        margin={{ top: 18, right: 4, bottom: 4, left: -14 }}
                      >
                        <CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="4 6" />
                        <XAxis
                          dataKey={isCompact ? "shortLabel" : "label"}
                          axisLine={false}
                          tickLine={false}
                          dy={6}
                          tick={{ fill: "#94a3b8", fontSize: isCompact ? 9.5 : 10.5 }}
                          interval={0}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={40}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          tickFormatter={(value) => compactNumberFormatter.format(value)}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={
                            <MarketTooltip
                              numberFormatter={numberFormatter}
                              jobsLabel={t("jobs")}
                            />
                          }
                          cursor={{ fill: "rgba(16,185,129,0.06)" }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                          {snapshot.salaryDistribution.map((entry, index) => (
                            <Cell key={entry.id} fill={barColors[index] ?? "#10b981"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <figcaption className="sr-only">{t("salaryDescription")}</figcaption>
                  <table className="sr-only">
                    <caption>{t("accessibleSalaryTable")}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t("salaryRange")}</th>
                        <th scope="col">{t("jobCount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.salaryDistribution.map((band) => (
                        <tr key={band.id}>
                          <td>{band.label}</td>
                          <td>{numberFormatter.format(band.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </figure>
              ) : (
                <ChartEmpty message={t("noSalaryData")} />
              )}

              {hasSalaryData && popularSalary && (
                <div className="jm-chart-foot">
                  <span>
                    <em>{t("popularSalary")}</em>
                    <b>{popularSalary.label}</b>
                  </span>
                  <span className="jm-chart-foot-up">
                    <em>{t("coverage")}</em>
                    <b>
                      {numberFormatter.format(salaryJobCount)}/
                      {numberFormatter.format(snapshot.visibleJobs.length)} {t("jobs")}
                    </b>
                  </span>
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
