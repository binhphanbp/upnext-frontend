"use client";

import {
  ArrowRight,
  Briefcase,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Clock,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  getMyCandidateApplicationActivity,
  type CandidateApplicationActivityGroup,
  type CandidateApplicationApi,
} from "@/features/candidate/api/profile";
import { CandidatePageHeader } from "@/features/candidate/candidate-page-header";
import {
  formatJobSalary,
  getCompanyLogo,
  getJobLocation,
  getJobTags,
} from "@/features/candidate/job-activity-model";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";

import { ApplicationStatusBadge } from "./application-status-badge";

const activityGroups: readonly CandidateApplicationActivityGroup[] = [
  "all",
  "action_required",
  "interview",
  "active",
  "closed",
];
const pageSize = 10;

type SortOrder = "recent_activity" | "newest" | "oldest";

export function CandidateApplicationsPage() {
  const t = useTranslations("CandidateWorkspace");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSessionResolved, session } = useCandidateProfileWorkspace();
  const rawGroup = searchParams.get("group") ?? searchParams.get("status");
  const group: CandidateApplicationActivityGroup = activityGroups.includes(
    rawGroup as CandidateApplicationActivityGroup,
  )
    ? (rawGroup as CandidateApplicationActivityGroup)
    : rawGroup === "offer"
      ? "action_required"
      : "all";
  const sort: SortOrder = ["recent_activity", "newest", "oldest"].includes(
    searchParams.get("sort") ?? "",
  )
    ? (searchParams.get("sort") as SortOrder)
    : "recent_activity";
  const query = searchParams.get("q") ?? "";
  const page = Math.max(1, Math.floor(Number(searchParams.get("page")) || 1));
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => setDraftQuery(query), [query]);

  const activityQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () =>
      getMyCandidateApplicationActivity(session!.accessToken, {
        group,
        limit: pageSize,
        page,
        q: query,
        sort,
      }),
    queryKey: ["candidate-application-activity", session?.user.id, group, query, sort, page],
  });
  const activity = activityQuery.data;
  const isUnauthorized =
    activityQuery.error instanceof ApiError && activityQuery.error.status === 401;

  const updateSearch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "sort" && value === "recent_activity")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    next.delete("status");
    if (!("page" in changes)) next.delete("page");
    const suffix = next.toString();
    router.replace(suffix ? `/candidate/applications?${suffix}` : "/candidate/applications", {
      scroll: false,
    });
  };

  const pageHeader = (
    <CandidatePageHeader
      breadcrumbItems={[
        { href: "/", label: t("common.home") },
        { label: t("applications.page.title") },
      ]}
      description={t("applications.page.description")}
      title={t("applications.page.title")}
      action={
        <Button asChild className="w-full rounded-xl sm:w-auto">
          <Link href="/jobs">
            {t("common.exploreJobs")}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      }
    />
  );

  if (!isSessionResolved) {
    return (
      <div className="space-y-6 pb-4">
        {pageHeader}
        <CandidateApplicationsLoading />
      </div>
    );
  }

  if (!session || isUnauthorized) {
    return (
      <div className="space-y-6 pb-4">
        {pageHeader}
        <ActivityState
          icon={<ShieldCheck />}
          title={t("common.signInTitle")}
          description={t("common.signInDescription")}
          action={
            <Button asChild className="rounded-xl">
              <Link href="/login">{t("common.signIn")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {pageHeader}
      {activityQuery.isLoading ? <CandidateApplicationsLoading /> : null}
      {activityQuery.isError ? (
        <ActivityState
          tone="error"
          icon={<WarningCircle />}
          title={t("applications.states.errorTitle")}
          description={t("applications.states.errorDescription")}
          action={
            <Button className="rounded-xl" onClick={() => activityQuery.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : null}
      {activity ? (
        <section className="space-y-5" aria-labelledby="applications-list-title">
          <ActivitySummary summary={activity.summary} />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-200 px-4 pt-5 sm:px-6 sm:pt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2
                    id="applications-list-title"
                    className="text-lg font-semibold text-slate-950 sm:text-xl"
                  >
                    {t("applications.list.title")}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {t("applications.list.count", {
                      active: activity.summary.active + activity.summary.interviewing,
                      total: activity.summary.total,
                    })}
                  </p>
                </div>
                {activity.summary.nextInterviewAt && activity.summary.nextInterviewApplicationId ? (
                  <Link
                    href={`/candidate/applications/${activity.summary.nextInterviewApplicationId}`}
                    className="upnext-focus inline-flex min-h-10 w-fit items-center gap-2 rounded-xl bg-amber-50 px-3 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
                  >
                    <CalendarBlank aria-hidden="true" size={16} />
                    {t("applications.summary.nextInterview")}
                  </Link>
                ) : null}
              </div>
              <div
                className="hide-scroll mt-5 flex gap-5 overflow-x-auto"
                role="group"
                aria-label={t("applications.filters.statusLabel")}
              >
                {activityGroups.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={group === item}
                    onClick={() => updateSearch({ group: item })}
                    className={cn(
                      "upnext-focus relative min-h-11 shrink-0 border-b-2 px-0.5 pb-3 text-sm font-semibold transition-colors",
                      group === item
                        ? "border-brand text-accent-foreground"
                        : "border-transparent text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {t(`applications.filters.groups.${item}`)}
                    <span className="ml-1.5 text-xs tabular-nums">
                      {getGroupCount(activity.summary, item)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_205px] sm:p-5">
              <form
                className="relative"
                onSubmit={(event) => {
                  event.preventDefault();
                  updateSearch({ q: draftQuery.trim() || null });
                }}
              >
                <label className="sr-only" htmlFor="candidate-application-search">
                  {t("applications.filters.searchLabel")}
                </label>
                <MagnifyingGlass
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                />
                <Input
                  id="candidate-application-search"
                  name="application-search"
                  type="search"
                  autoComplete="off"
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50 pr-20 pl-10"
                  placeholder={t("applications.filters.searchPlaceholder")}
                />
                <button
                  type="submit"
                  className="upnext-focus text-accent-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-emerald-50"
                >
                  {t("common.search")}
                </button>
              </form>
              <div>
                <label className="sr-only" htmlFor="application-sort">
                  {t("applications.filters.sortLabel")}
                </label>
                <select
                  id="application-sort"
                  value={sort}
                  onChange={(event) => updateSearch({ sort: event.target.value })}
                  className="upnext-focus h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700"
                >
                  <option value="recent_activity">
                    {t("applications.filters.recentActivity")}
                  </option>
                  <option value="newest">{t("applications.filters.newest")}</option>
                  <option value="oldest">{t("applications.filters.oldest")}</option>
                </select>
              </div>
            </div>
            {activity.items.length ? (
              <ul className="divide-y divide-slate-100" aria-live="polite">
                {activity.items.map((application) => (
                  <li key={application.id}>
                    <ApplicationRow application={application} locale={locale} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyApplications hasFilters={Boolean(query || group !== "all")} />
            )}
            {activity.meta.totalPages > 1 ? (
              <Pagination
                page={activity.meta.page}
                totalPages={activity.meta.totalPages}
                onPageChange={(nextPage) => updateSearch({ page: String(nextPage) })}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ActivitySummary({
  summary,
}: Readonly<{
  summary: NonNullable<Awaited<ReturnType<typeof getMyCandidateApplicationActivity>>>["summary"];
}>) {
  const t = useTranslations("CandidateWorkspace");
  const items = [
    {
      icon: <Briefcase />,
      label: t("applications.summary.total"),
      value: summary.total,
      tone: "text-slate-800",
    },
    {
      icon: <Clock />,
      label: t("applications.summary.inProgress"),
      value: summary.active,
      tone: "text-blue-700",
    },
    {
      icon: <CalendarBlank />,
      label: t("applications.summary.interview"),
      value: summary.interviewing,
      tone: "text-amber-700",
    },
    {
      icon: <WarningCircle />,
      label: t("applications.summary.actionRequired"),
      value: summary.actionRequired,
      tone: "text-emerald-700",
    },
  ];
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-slate-50 text-slate-600"
            >
              {item.icon}
            </span>
            {item.label}
          </dt>
          <dd className={cn("mt-3 text-2xl font-semibold tabular-nums", item.tone)}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function getGroupCount(
  summary: Awaited<ReturnType<typeof getMyCandidateApplicationActivity>>["summary"],
  group: CandidateApplicationActivityGroup,
) {
  if (group === "all") return summary.total;
  if (group === "active") return summary.active;
  if (group === "interview") return summary.interviewing;
  if (group === "action_required") return summary.actionRequired;
  return Math.max(
    0,
    summary.total - summary.active - summary.interviewing - summary.actionRequired,
  );
}

function ApplicationRow({
  application,
  locale,
}: Readonly<{ application: CandidateApplicationApi; locale: string }>) {
  const t = useTranslations("CandidateWorkspace");
  const logo = getCompanyLogo(application.jobPost);
  const tags = getJobTags(application.jobPost);
  const location = getJobLocation(application.jobPost, t("common.locationFallback"));
  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(application.submittedAt),
  );
  return (
    <article className="group p-4 transition-colors hover:bg-slate-50 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <CompanyLogo logo={logo} name={application.jobPost.company.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/candidate/applications/${application.id}`}
                className="upnext-focus hover:text-accent-foreground block rounded text-base font-semibold text-slate-950 sm:text-lg"
              >
                <span className="line-clamp-2">{application.jobPost.title}</span>
              </Link>
              <p className="mt-1 truncate text-sm font-medium text-slate-600">
                {application.jobPost.company.name}
              </p>
            </div>
            <ApplicationStatusBadge
              status={application.status}
              offerDeadlineAt={application.offerDeadlineAt}
              offerResponse={application.offerResponse}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" size={15} />
              {location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank aria-hidden="true" size={15} />
              {t("applications.card.appliedAt", { date: formattedDate })}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
              <span className="text-accent-foreground px-1 py-1 text-xs font-semibold">
                {formatJobSalary(application.jobPost, locale, {
                  hidden: t("common.salaryHidden"),
                  negotiable: t("common.salaryNegotiable"),
                })}
              </span>
            </div>
            <Link
              href={`/candidate/applications/${application.id}`}
              className="upnext-focus text-accent-foreground inline-flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold hover:bg-emerald-50 sm:self-auto"
            >
              {application.availableActions?.canRespondToOffer
                ? t("applications.card.reviewOffer")
                : t("applications.card.viewDetail")}
              <CaretRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function CompanyLogo({ logo, name }: Readonly<{ logo: string | null; name: string }>) {
  return (
    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 sm:size-14">
      {logo ? (
        <Image
          alt=""
          src={logo}
          width={56}
          height={56}
          unoptimized
          loading="lazy"
          className="size-full object-contain p-2"
        />
      ) : (
        name.slice(0, 2).toLocaleUpperCase()
      )}
    </span>
  );
}

function EmptyApplications({ hasFilters }: Readonly<{ hasFilters: boolean }>) {
  const t = useTranslations("CandidateWorkspace");
  return (
    <div className="px-5 py-14 text-center sm:py-16">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Briefcase aria-hidden="true" size={26} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        {hasFilters ? t("applications.states.noResultsTitle") : t("applications.states.emptyTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {hasFilters
          ? t("applications.states.noResultsDescription")
          : t("applications.states.emptyDescription")}
      </p>
      <Button asChild variant={hasFilters ? "outline" : "primary"} className="mt-5 rounded-xl">
        <Link href={hasFilters ? "/candidate/applications" : "/jobs"}>
          {hasFilters ? t("common.clearFilters") : t("common.exploreJobs")}
        </Link>
      </Button>
    </div>
  );
}

function Pagination({
  onPageChange,
  page,
  totalPages,
}: Readonly<{ onPageChange: (page: number) => void; page: number; totalPages: number }>) {
  const t = useTranslations("CandidateWorkspace");
  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-5"
      aria-label={t("common.pagination")}
    >
      <p className="text-xs font-medium text-slate-500 tabular-nums">
        {t("common.pageCount", { page, totalPages })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("common.previousPage")}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl"
        >
          <CaretLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("common.nextPage")}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl"
        >
          <CaretRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

export function CandidateApplicationsLoading() {
  const t = useTranslations("CandidateWorkspace");
  return (
    <div aria-busy="true" className="space-y-5">
      <span className="sr-only">{t("common.loading")}</span>
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-[560px] rounded-2xl" />
    </div>
  );
}

function ActivityState({
  action,
  description,
  icon,
  title,
  tone = "neutral",
}: Readonly<{
  action: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
  tone?: "error" | "neutral";
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className={cn(
          "mx-auto grid size-14 place-items-center rounded-2xl [&_svg]:size-7",
          tone === "error" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600",
        )}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 flex justify-center">{action}</div>
    </section>
  );
}
