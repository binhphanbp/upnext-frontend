"use client";

import {
  ArrowRight,
  Briefcase,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  FileText,
  MagnifyingGlass,
  MapPin,
  PaperPlaneTilt,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getMyCandidateApplications,
  type CandidateApplicationApi,
} from "@/features/candidate/api/profile";
import { CandidatePageHeader } from "@/features/candidate/candidate-page-header";
import {
  filterApplications,
  formatJobSalary,
  getApplicationStatusGroup,
  getCompanyLogo,
  getJobLocation,
  getJobTags,
  type ApplicationStatusGroup,
} from "@/features/candidate/job-activity-model";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";
import { getPublicJobs } from "@/features/public/home/api";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";

import { ApplicationStatusBadge } from "./application-status-badge";

const statusGroups: readonly ApplicationStatusGroup[] = [
  "all",
  "active",
  "interview",
  "offer",
  "closed",
];
const pageSize = 6;
const emptyApplications: CandidateApplicationApi[] = [];

type SortOrder = "newest" | "oldest";

export function CandidateApplicationsPage() {
  const t = useTranslations("CandidateWorkspace");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cvsQuery, isSessionResolved, session } = useCandidateProfileWorkspace();

  const statusParam = searchParams.get("status");
  const status: ApplicationStatusGroup = statusGroups.includes(
    statusParam as ApplicationStatusGroup,
  )
    ? (statusParam as ApplicationStatusGroup)
    : "all";
  const sort: SortOrder = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const query = searchParams.get("q") ?? "";
  const requestedPage = Math.max(1, Math.floor(Number(searchParams.get("page")) || 1));
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const applicationsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getMyCandidateApplications(session!.accessToken),
    queryKey: ["candidate-applications", session?.user.id],
  });
  const publicJobsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: getPublicJobs,
    queryKey: ["public-jobs"],
  });

  const applications = applicationsQuery.data ?? emptyApplications;
  const isUnauthorized =
    applicationsQuery.error instanceof ApiError && applicationsQuery.error.status === 401;
  const publicJobsById = useMemo(
    () => new Map((publicJobsQuery.data ?? []).map((job) => [job.id, job])),
    [publicJobsQuery.data],
  );
  const visibleApplications = useMemo(() => {
    const filtered = filterApplications(applications, status, query);
    return filtered.toSorted((left, right) => {
      const difference =
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      return sort === "newest" ? difference : -difference;
    });
  }, [applications, query, sort, status]);
  const totalPages = Math.max(1, Math.ceil(visibleApplications.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const paginatedApplications = visibleApplications.slice((page - 1) * pageSize, page * pageSize);
  const defaultCv = cvsQuery.data?.items.find((cv) => cv.isDefault);

  const counts = useMemo(
    () =>
      statusGroups.reduce<Record<ApplicationStatusGroup, number>>(
        (result, group) => {
          result[group] =
            group === "all"
              ? applications.length
              : applications.filter(
                  (application) => getApplicationStatusGroup(application.status) === group,
                ).length;
          return result;
        },
        { active: 0, all: 0, closed: 0, interview: 0, offer: 0 },
      ),
    [applications],
  );

  const updateSearch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "sort" && value === "newest")) next.delete(key);
      else next.set(key, value);
    });
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
      eyebrow={t("common.workspaceEyebrow")}
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
      <div className="space-y-7 pb-4">
        {pageHeader}
        <CandidateApplicationsLoading />
      </div>
    );
  }

  if (!session || isUnauthorized) {
    return (
      <div className="space-y-7 pb-4">
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
    <div className="space-y-7 pb-4">
      {pageHeader}

      {applicationsQuery.isLoading ? <CandidateApplicationsLoading /> : null}

      {applicationsQuery.isError ? (
        <ActivityState
          tone="error"
          icon={<WarningCircle />}
          title={t("applications.states.errorTitle")}
          description={t("applications.states.errorDescription")}
          action={
            <Button className="rounded-xl" onClick={() => applicationsQuery.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : null}

      {applicationsQuery.isSuccess ? (
        <>
          <section
            className="grid gap-3 sm:grid-cols-3"
            aria-label={t("applications.summary.label")}
          >
            <SummaryCard
              icon={<PaperPlaneTilt />}
              label={t("applications.summary.total")}
              value={applications.length}
            />
            <SummaryCard
              icon={<Clock />}
              label={t("applications.summary.inProgress")}
              value={counts.active + counts.interview}
              tone="brand"
            />
            <SummaryCard
              icon={<CheckCircle />}
              label={t("applications.summary.positive")}
              value={counts.offer}
              tone="success"
            />
          </section>

          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_304px]">
            <section className="min-w-0 space-y-5" aria-labelledby="applications-list-title">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="border-b border-slate-200 px-4 pt-4 sm:px-5 sm:pt-5">
                  <h2 id="applications-list-title" className="text-lg font-bold text-slate-950">
                    {t("applications.list.title")}
                  </h2>
                  <div
                    className="hide-scroll mt-4 flex gap-5 overflow-x-auto"
                    role="group"
                    aria-label={t("applications.filters.statusLabel")}
                  >
                    {statusGroups.map((group) => (
                      <button
                        key={group}
                        type="button"
                        aria-pressed={status === group}
                        onClick={() => updateSearch({ status: group })}
                        className={cn(
                          "upnext-focus relative min-h-11 shrink-0 border-b-2 px-0.5 pb-3 text-sm font-bold transition-colors",
                          status === group
                            ? "border-brand text-accent-foreground"
                            : "border-transparent text-slate-500 hover:text-slate-900",
                        )}
                      >
                        {t(`applications.filters.groups.${group}`)}
                        <span className="ml-1.5 text-xs tabular-nums">{counts[group]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:p-5">
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
                      className="rounded-xl bg-white pr-20 pl-10"
                      placeholder={t("applications.filters.searchPlaceholder")}
                    />
                    <button
                      type="submit"
                      className="upnext-focus text-accent-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-emerald-50"
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
                      className="upnext-focus h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                    >
                      <option value="newest">{t("applications.filters.newest")}</option>
                      <option value="oldest">{t("applications.filters.oldest")}</option>
                    </select>
                  </div>
                </div>

                {paginatedApplications.length > 0 ? (
                  <ul className="divide-y divide-slate-200">
                    {paginatedApplications.map((application) => {
                      const publicJob = publicJobsById.get(application.jobPostId);
                      return (
                        <li key={application.id}>
                          <ApplicationRow
                            application={application}
                            locale={locale}
                            location={getJobLocation(publicJob, t("common.locationFallback"))}
                          />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyApplications hasApplications={applications.length > 0} />
                )}

                {visibleApplications.length > pageSize ? (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={(nextPage) => updateSearch({ page: String(nextPage) })}
                  />
                ) : null}
              </div>
            </section>

            <aside
              className="space-y-4 xl:sticky xl:top-24"
              aria-label={t("common.supportingInfo")}
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <span className="bg-brand-muted text-accent-foreground grid size-10 place-items-center rounded-xl">
                    <FileText aria-hidden="true" size={20} />
                  </span>
                  {defaultCv ? (
                    <span className="bg-success-muted text-accent-foreground rounded-full px-2.5 py-1 text-[11px] font-bold">
                      {t("applications.resume.defaultBadge")}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-base font-bold text-slate-950">
                  {t("applications.resume.title")}
                </h2>
                <p className="mt-1 text-sm font-semibold break-words text-slate-700">
                  {defaultCv?.title ?? t("applications.resume.missing")}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {defaultCv
                    ? t("applications.resume.description")
                    : t("applications.resume.missingDescription")}
                </p>
                <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
                  <Link href="/candidate/profile?section=documents">
                    {t("applications.resume.manage")}
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h2 className="text-base font-bold text-slate-950">
                  {t("applications.guide.title")}
                </h2>
                <ol className="mt-4 space-y-4">
                  {["submitted", "review", "decision"].map((step, index) => (
                    <li key={step} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                      <span className="bg-brand-muted text-accent-foreground grid size-7 place-items-center rounded-full text-xs font-bold tabular-nums">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {t(`applications.guide.${step}.title`)}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          {t(`applications.guide.${step}.description`)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ApplicationRow({
  application,
  locale,
  location,
}: Readonly<{
  application: CandidateApplicationApi;
  locale: string;
  location: string;
}>) {
  const t = useTranslations("CandidateWorkspace");
  const logo = getCompanyLogo(application.jobPost);
  const tags = getJobTags(application.jobPost);
  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(application.submittedAt),
  );

  return (
    <article className="group p-4 transition-colors hover:bg-slate-50/70 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <CompanyLogo logo={logo} name={application.jobPost.company.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/candidate/applications/${application.id}`}
                className="upnext-focus hover:text-accent-foreground block rounded text-base font-bold text-slate-950 sm:text-lg"
              >
                <span className="line-clamp-2">{application.jobPost.title}</span>
              </Link>
              <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                {application.jobPost.company.name}
              </p>
            </div>
            <ApplicationStatusBadge status={application.status} />
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
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                >
                  {tag}
                </span>
              ))}
              <span className="text-accent-foreground px-1 py-1 text-xs font-bold">
                {formatJobSalary(application.jobPost, locale, {
                  hidden: t("common.salaryHidden"),
                  negotiable: t("common.salaryNegotiable"),
                })}
              </span>
            </div>
            <Link
              href={`/candidate/applications/${application.id}`}
              className="upnext-focus text-accent-foreground inline-flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-bold hover:bg-emerald-50 sm:self-auto"
            >
              {t("applications.card.viewDetail")}
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
    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm sm:size-14">
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

function SummaryCard({
  icon,
  label,
  tone = "neutral",
  value,
}: Readonly<{
  icon: ReactNode;
  label: string;
  tone?: "brand" | "neutral" | "success";
  value: number;
}>) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-5",
          tone === "neutral" && "bg-slate-100 text-slate-600",
          tone === "brand" && "bg-brand-muted text-accent-foreground",
          tone === "success" && "bg-emerald-50 text-emerald-700",
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold tracking-[-0.03em] text-slate-950 tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function EmptyApplications({ hasApplications }: Readonly<{ hasApplications: boolean }>) {
  const t = useTranslations("CandidateWorkspace");
  return (
    <div className="px-5 py-14 text-center sm:py-16">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Briefcase aria-hidden="true" size={26} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-950">
        {hasApplications
          ? t("applications.states.noResultsTitle")
          : t("applications.states.emptyTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {hasApplications
          ? t("applications.states.noResultsDescription")
          : t("applications.states.emptyDescription")}
      </p>
      <Button asChild variant={hasApplications ? "outline" : "primary"} className="mt-5 rounded-xl">
        <Link href={hasApplications ? "/candidate/applications" : "/jobs"}>
          {hasApplications ? t("common.clearFilters") : t("common.exploreJobs")}
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
      <p className="text-xs font-semibold text-slate-500 tabular-nums">
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
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_304px]">
        <Skeleton className="h-[560px] rounded-2xl" />
        <Skeleton className="hidden h-72 rounded-2xl xl:block" />
      </div>
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
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span
        aria-hidden="true"
        className={cn(
          "mx-auto grid size-14 place-items-center rounded-2xl [&_svg]:size-7",
          tone === "error" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600",
        )}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 flex justify-center">{action}</div>
    </section>
  );
}
