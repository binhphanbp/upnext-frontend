"use client";

import {
  ArrowsClockwise,
  CalendarBlank,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  SealCheck,
  ShieldCheck,
  ShieldWarning,
  TrendDown,
  TrendUp,
  WarningCircle,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getCompany,
  getRecruiterAccount,
  type CompanyDetail,
} from "@/features/recruiter/api/onboarding";
import {
  getReputationActivities,
  type ReputationActivity,
} from "@/features/recruiter/api/reputation";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

import { SelectFilter } from "../components/interviews/select-filter";
import { RecruiterTableLayout } from "../components/recruiter-table-layout";

type ReputationTier = "elite" | "trusted" | "standard" | "warning" | "locked";

const REPUTATION_TIERS: ReadonlyArray<{
  id: ReputationTier;
  range: string;
  min: number;
  max: number;
  badgeTone: "success" | "info" | "warning" | "error" | "neutral";
  barColor: string;
  textColor: string;
  bgColor: string;
}> = [
  {
    id: "locked",
    range: "< 30",
    min: 0,
    max: 29,
    badgeTone: "error",
    barColor: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
  {
    id: "warning",
    range: "30 - 49",
    min: 30,
    max: 49,
    badgeTone: "warning",
    barColor: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
  },
  {
    id: "standard",
    range: "50 - 69",
    min: 50,
    max: 69,
    badgeTone: "info",
    barColor: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    id: "trusted",
    range: "70 - 89",
    min: 70,
    max: 89,
    badgeTone: "success",
    barColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  {
    id: "elite",
    range: "90 - 100",
    min: 90,
    max: 100,
    badgeTone: "success",
    barColor: "bg-emerald-600",
    textColor: "text-emerald-800",
    bgColor: "bg-emerald-50/80 border-emerald-300",
  },
];

const REPUTATION_SCALE_MAX = 100;

function formatReputationAction(
  actionType: string,
  t: ReturnType<typeof useTranslations<"Recruiter.dashboard.companyReputation">>,
) {
  if (!actionType) return t("action.default");
  try {
    const key = `action.${actionType}`;
    if (typeof t.has === "function" && t.has(key)) {
      return t(key as any);
    }
  } catch {
    // Fall back to transformed string
  }
  return actionType
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getReputationTier(score: number) {
  return [...REPUTATION_TIERS].reverse().find((tier) => score >= tier.min) ?? REPUTATION_TIERS[0]!;
}

export function RecruiterCompanyReputationPage() {
  const t = useTranslations("Recruiter.dashboard.companyReputation");
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [activities, setActivities] = useState<ReputationActivity[]>([]);
  const [reputationScore, setReputationScore] = useState(0);
  const [publishThreshold, setPublishThreshold] = useState(50);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "GAIN" | "LOSS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      setLoadError(null);
      try {
        const session = getRecruiterSession();
        if (!session) {
          router.replace(
            `/recruiter/login?redirect=${encodeURIComponent("/recruiter/company-reputation")}`,
          );
          return;
        }

        const account = await getRecruiterAccount(session.user.id, session.accessToken);
        const accountCompany = account.company;
        if (!accountCompany?.id) {
          setCompany(null);
          setActivities([]);
          setReputationScore(0);
          return;
        }

        setReputationScore(Number(accountCompany.reputationScore));
        setPublishThreshold(accountCompany.minReputationScoreToPublish ?? 50);

        const [companyData, activitiesData] = await Promise.all([
          getCompany(accountCompany.id, session.accessToken),
          getReputationActivities(accountCompany.id, session.accessToken),
        ]);
        setCompany(companyData);
        setActivities(activitiesData);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearRecruiterSession();
          router.replace(
            `/recruiter/login?redirect=${encodeURIComponent("/recruiter/company-reputation")}`,
          );
          return;
        }
        setLoadError(t("state.loadErrorDesc"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, t],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const score = useMemo(() => {
    return Number.isFinite(reputationScore)
      ? Math.max(0, Math.min(REPUTATION_SCALE_MAX, reputationScore))
      : 0;
  }, [reputationScore]);

  const currentTier = useMemo(() => getReputationTier(score), [score]);
  const scorePercent = Math.round((score / REPUTATION_SCALE_MAX) * 100);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const delta = Number(act.score);
      if (filterType === "GAIN" && delta <= 0) return false;
      if (filterType === "LOSS" && delta >= 0) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text =
          `${act.reason || ""} ${act.actionType} ${formatReputationAction(act.actionType, t)} ${act.byAdmin?.fullName || ""}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });
  }, [activities, filterType, searchQuery, t]);

  const totalGain = useMemo(() => {
    return activities.filter((a) => Number(a.score) > 0).length;
  }, [activities]);

  const totalLoss = useMemo(() => {
    return activities.filter((a) => Number(a.score) < 0).length;
  }, [activities]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, pageSize]);

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [currentPage, filteredActivities, pageSize]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center border-slate-200 bg-white p-8 text-center">
        <WarningCircle size={40} weight="duotone" className="text-red-500" />
        <h1 className="mt-3 text-lg font-bold text-slate-900">{t("state.loadErrorTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{loadError}</p>
        <Button className="mt-5" onClick={() => void loadData(true)} disabled={refreshing}>
          <ArrowsClockwise size={16} className={cn(refreshing && "animate-spin")} />
          {t("state.retry")}
        </Button>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center border-slate-200 bg-white p-8 text-center">
        <ShieldWarning size={40} weight="duotone" className="text-amber-500" />
        <h1 className="mt-3 text-lg font-bold text-slate-900">{t("state.noCompanyTitle")}</h1>
        <p className="mt-1 max-w-md text-sm text-slate-500">{t("state.noCompanyDesc")}</p>
        <Button className="mt-5" onClick={() => router.push("/recruiter/company-profile")}>
          {t("state.completeCompanyProfile")}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Thống kê tổng quan dạng thẻ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Điểm hiện tại */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              {t("kpi.trustScore")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <ShieldCheck size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{Math.round(score)}</span>
            <span className="text-xs font-medium text-slate-400">{t("kpi.scoreUnit")}</span>
          </div>
          <div className="mt-2">
            <Badge tone={currentTier.badgeTone} className="text-[11px] font-semibold">
              {t(`tier.${currentTier.id}.label`)}
            </Badge>
          </div>
        </Card>

        {/* Trạng thái xác thực */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              {t("kpi.legalProfile")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <SealCheck size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-slate-800">
              {company?.verificationStatus === "VERIFIED"
                ? t("kpi.verified")
                : company?.verificationStatus === "PENDING"
                  ? t("kpi.pending")
                  : t("kpi.unverified")}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {company?.taxCode ? t("kpi.taxCode", { code: company.taxCode }) : t("kpi.noTaxCode")}
          </p>
        </Card>

        {/* Điều kiện đăng tin */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              {t("kpi.publishEligibility")}
            </span>
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-md",
                score >= publishThreshold
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700",
              )}
            >
              {score >= publishThreshold ? (
                <CheckCircle size={16} weight="bold" />
              ) : (
                <WarningCircle size={16} weight="bold" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-base font-bold",
                score >= publishThreshold ? "text-emerald-700" : "text-red-700",
              )}
            >
              {score >= publishThreshold
                ? t("kpi.eligibleToPublish")
                : t("kpi.ineligibleToPublish")}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {t("kpi.minScoreRequirement", { threshold: publishThreshold })}
          </p>
        </Card>

        {/* Biến động điểm */}
        <Card className="border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              {t("kpi.historySummary")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Clock size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{activities.length}</span>
            <span className="text-xs font-medium text-slate-400">
              {t("kpi.changesCount", { count: activities.length })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="font-medium text-emerald-700">
              {t("kpi.gainsCount", { count: totalGain })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-red-700">
              {t("kpi.lossesCount", { count: totalLoss })}
            </span>
          </div>
        </Card>
      </div>

      {/* Thước đo Thang điểm Uy tín */}
      <Card className="border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("scale.title")}</h2>
            <p className="text-xs text-slate-500">
              {t("scale.subtitle", {
                score: Math.round(score),
                tier: t(`tier.${currentTier.id}.label`),
              })}
            </p>
          </div>
        </div>

        {/* Progress bar with marks */}
        <div className="mt-5 space-y-2">
          <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                currentTier.barColor,
              )}
              style={{ width: `${scorePercent}%` }}
            />
            {REPUTATION_TIERS.filter((tItem) => tItem.min > 0).map((tier) => (
              <span
                key={tier.id}
                className="absolute top-0 h-full w-px bg-white/90 shadow-xs"
                style={{ left: `${tier.min}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>0</span>
            <span>{t("scale.tickWarning")}</span>
            <span>{t("scale.tickStandard")}</span>
            <span>{t("scale.tickTrusted")}</span>
            <span>{t("scale.tickElite")}</span>
            <span>100</span>
          </div>
        </div>

        {/* Danh sách các phân hạng */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPUTATION_TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier.id;
            return (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-lg border p-3.5 transition-colors",
                  isCurrent
                    ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {t(`tier.${tier.id}.label`)}
                    </span>
                    {isCurrent && (
                      <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {t("scale.currentBadge")}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {t("scale.pts", { range: tier.range })}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {t(`tier.${tier.id}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bảng Lịch sử biến động điểm uy tín */}
      <section>
        <RecruiterTableLayout
          loading={refreshing}
          totalItems={filteredActivities.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          filterBar={
            <div className="flex w-full min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
              <div className="min-w-0 xl:mr-auto xl:shrink-0">
                <h2 className="text-base font-bold text-slate-900">{t("history.title")}</h2>
              </div>

              <div className="grid w-full min-w-0 gap-2 sm:grid-cols-[176px_minmax(220px,1fr)_auto] xl:w-auto xl:min-w-[590px]">
                <SelectFilter
                  ariaLabel={t("history.filterAria")}
                  value={filterType}
                  onChange={(value) => setFilterType(value as typeof filterType)}
                  placeholder={t("history.filterPlaceholder")}
                  options={[
                    { value: "ALL", label: t("history.filterAll") },
                    { value: "GAIN", label: t("history.filterGain") },
                    { value: "LOSS", label: t("history.filterLoss") },
                  ]}
                  className="w-full min-w-0"
                  triggerClassName={cn(
                    "rounded-full",
                    filterType !== "ALL" &&
                      "border-emerald-500 bg-emerald-50/10 font-medium text-emerald-600",
                  )}
                />

                <label className="relative min-w-0">
                  <span className="sr-only">{t("history.searchAria")}</span>
                  <MagnifyingGlass
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    aria-label={t("history.searchAria")}
                    placeholder={t("history.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-full border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>

                <Button
                  variant="outline"
                  className="h-10 rounded-full border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-none hover:bg-slate-50"
                  onClick={() => void loadData(true)}
                  disabled={refreshing}
                >
                  <ArrowsClockwise size={15} className={cn(refreshing && "animate-spin")} />
                  {t("history.refresh")}
                </Button>
              </div>
            </div>
          }
        >
          <thead>
            <tr>
              <th>{t("history.columns.action")}</th>
              <th>{t("history.columns.change")}</th>
              <th>{t("history.columns.reason")}</th>
              <th>{t("history.columns.time")}</th>
              <th>{t("history.columns.performedBy")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-slate-500">
                  <CalendarBlank size={32} className="mx-auto mb-2 text-slate-300" />
                  {activities.length === 0 ? t("history.emptyAll") : t("history.emptyFiltered")}
                </td>
              </tr>
            ) : (
              paginatedActivities.map((act) => {
                const delta = Number(act.score);
                const isPositive = delta > 0;
                const isNegative = delta < 0;

                return (
                  <tr key={act.id}>
                    <td className="font-semibold text-slate-700">
                      {formatReputationAction(act.actionType, t)}
                    </td>
                    <td className="whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          isPositive
                            ? "bg-emerald-50 text-emerald-700"
                            : isNegative
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-700",
                        )}
                      >
                        {isPositive && <TrendUp size={12} weight="bold" />}
                        {isNegative && <TrendDown size={12} weight="bold" />}
                        {isPositive
                          ? t("history.pointsAdded", { points: delta })
                          : t("history.pointsDeducted", { points: delta })}
                      </span>
                    </td>
                    <td className="max-w-sm whitespace-normal text-slate-600">
                      {act.reason || t("history.noReason")}
                    </td>
                    <td className="max-w-sm whitespace-normal text-slate-600">
                      {new Date(act.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="max-w-sm whitespace-normal text-slate-600">
                      {act.byAdmin ? (
                        <span className="max-w-sm whitespace-normal text-slate-600">
                          {t("history.byAdmin", { name: act.byAdmin.fullName })}
                        </span>
                      ) : (
                        <span className="max-w-sm whitespace-normal text-slate-600">
                          {t("history.bySystem")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </RecruiterTableLayout>
      </section>
    </div>
  );
}
