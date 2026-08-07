"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  getRecruiterAnalytics,
  type RecruiterAnalyticsResponse,
  type RecruiterAnalyticsWindowDays,
} from "@/features/recruiter/api/analytics";
import { RECRUITER_SESSION_REFRESHED_EVENT } from "@/features/recruiter/api/client";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { AnalyticsFilters } from "./analytics/analytics-filters";
import { RecruiterFunnelChart } from "./analytics/funnel-chart";
import { JobComparisonTable } from "./analytics/job-comparison-table";
import { AnalyticsKpiCards } from "./analytics/kpi-cards";
import { RecruiterActivityTimeSeriesChart } from "./analytics/time-series-chart";

const VALID_WINDOWS: RecruiterAnalyticsWindowDays[] = [7, 30, 90];
const DEFAULT_WINDOW_DAYS: RecruiterAnalyticsWindowDays = 30;

function parseWindowDays(raw: string | null): RecruiterAnalyticsWindowDays {
  const parsed = Number(raw);
  return (VALID_WINDOWS as number[]).includes(parsed)
    ? (parsed as RecruiterAnalyticsWindowDays)
    : DEFAULT_WINDOW_DAYS;
}

function buildAnalyticsPath(windowDays: RecruiterAnalyticsWindowDays, jobPostId: string | null) {
  const query = new URLSearchParams();
  if (windowDays !== DEFAULT_WINDOW_DAYS) query.set("window", String(windowDays));
  if (jobPostId) query.set("jobPostId", jobPostId);
  const search = query.toString();
  return search ? `/recruiter/analytics?${search}` : "/recruiter/analytics";
}

function LoadingState() {
  const t = useTranslations("Recruiter.analytics");
  return (
    <div className="text-muted-foreground flex h-80 items-center justify-center text-sm font-bold">
      <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
      {t("loading")}
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function RecruiterAnalyticsPage() {
  const t = useTranslations("Recruiter.analytics");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<RecruiterAnalyticsWindowDays>(() =>
    parseWindowDays(searchParams?.get("window") ?? null),
  );
  const [selectedJobPostId, setSelectedJobPostId] = useState<string | null>(
    () => searchParams?.get("jobPostId") ?? null,
  );

  const [jobDirectory, setJobDirectory] = useState<
    ReadonlyArray<{ jobPostId: string; title: string }>
  >([]);
  const [data, setData] = useState<RecruiterAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleUnauthorized = useCallback(() => {
    clearRecruiterSession();
    router.replace("/recruiter/login");
  }, [router]);

  // Initial session check — same pattern as the rest of the recruiter area
  // (recruiter-dashboard-page.tsx / recruiter-candidates-page.tsx).
  useEffect(() => {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }
    setToken(session.accessToken);
  }, [router]);

  useEffect(() => {
    const handleSessionRefresh = (event: Event) => {
      const { accessToken } = (event as CustomEvent<{ accessToken: string }>).detail;
      setToken(accessToken);
    };
    window.addEventListener(RECRUITER_SESSION_REFRESHED_EVENT, handleSessionRefresh);
    return () =>
      window.removeEventListener(RECRUITER_SESSION_REFRESHED_EVENT, handleSessionRefresh);
  }, []);

  // The job-picker dropdown always needs the recruiter's full job list, even while drilled
  // into a single job (whose own response omits the `jobs` table). Fetched once, independent
  // of the currently selected window/job, since which jobs exist doesn't depend on either.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getRecruiterAnalytics(token, { windowDays: DEFAULT_WINDOW_DAYS })
      .then((result) => {
        if (cancelled) return;
        setJobDirectory(
          (result.jobs ?? []).map((job) => ({ jobPostId: job.jobPostId, title: job.title })),
        );
      })
      .catch(() => {
        // Non-critical: the job picker just stays empty; the main fetch below surfaces real errors.
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    getRecruiterAnalytics(token, { windowDays, jobPostId: selectedJobPostId ?? undefined })
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          handleUnauthorized();
          return;
        }
        setLoadError(error instanceof Error ? error.message : t("error"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, windowDays, selectedJobPostId, handleUnauthorized, t]);

  function updateFilters(
    nextWindowDays: RecruiterAnalyticsWindowDays,
    nextJobPostId: string | null,
  ) {
    setWindowDays(nextWindowDays);
    setSelectedJobPostId(nextJobPostId);
    router.replace(buildAnalyticsPath(nextWindowDays, nextJobPostId));
  }

  if (loading && !data) return <LoadingState />;

  if (loadError) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 text-center">
        <p className="text-muted-foreground text-sm font-semibold">{loadError}</p>
        <Button variant="outline" onClick={() => updateFilters(windowDays, selectedJobPostId)}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const hasAnyJobs = jobDirectory.length > 0 || data.scope.job !== null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">{t("subtitle")}</p>
        </div>
      </header>

      {!hasAnyJobs ? (
        <div className="border-border text-muted-foreground flex h-60 items-center justify-center rounded-2xl border text-sm font-semibold">
          {t("emptyState")}
        </div>
      ) : (
        <>
          <AnalyticsFilters
            windowDays={windowDays}
            onWindowDaysChange={(nextWindowDays) =>
              updateFilters(nextWindowDays, selectedJobPostId)
            }
            jobs={jobDirectory}
            selectedJobPostId={selectedJobPostId}
            onSelectedJobPostIdChange={(nextJobPostId) => updateFilters(windowDays, nextJobPostId)}
          />

          {data.scope.job ? (
            <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-2xl border p-4">
              <div>
                <p className="text-foreground text-lg font-bold">{data.scope.job.title}</p>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone={data.scope.job.status === "PUBLISHED" ? "success" : "neutral"}>
                    {data.scope.job.status}
                  </Badge>
                  {(() => {
                    const publishedAtLabel = formatDate(data.scope.job.publishedAt);
                    return publishedAtLabel ? (
                      <span>{t("jobHeader.publishedAt", { date: publishedAtLabel })}</span>
                    ) : null;
                  })()}
                  <span>{t("jobHeader.vacancies", { count: data.scope.job.vacanciesCount })}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => updateFilters(windowDays, null)}
              >
                {t("filters.backToAll")}
              </Button>
            </div>
          ) : null}

          <AnalyticsKpiCards kpis={data.kpis} />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RecruiterFunnelChart funnel={data.funnel} />
            <RecruiterActivityTimeSeriesChart timeSeries={data.timeSeries} />
          </section>

          {data.jobs ? (
            <section aria-label={t("jobTable.title")}>
              <JobComparisonTable
                jobs={data.jobs}
                onSelectJob={(jobPostId) => updateFilters(windowDays, jobPostId)}
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
