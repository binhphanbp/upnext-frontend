"use client";

import {
  ArrowRight,
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  Clock,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  SpinnerGap,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getMySavedJobs,
  saveCandidateJob,
  type SavedJobApi,
  unsaveCandidateJob,
} from "@/features/candidate/api/profile";
import { CandidatePageHeader } from "@/features/candidate/candidate-page-header";
import {
  compareSavedJobDeadline,
  formatJobSalary,
  getCompanyLogo,
  getJobLocation,
  getJobTags,
  getSavedJobDeadline,
  isJobAvailable,
  isSavedJobFilter,
  matchesSavedJobFilter,
  SAVED_JOB_FILTERS,
  type SavedJobFilter,
} from "@/features/candidate/job-activity-model";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";
import { getPublicJobs } from "@/features/public/home/api";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { toast } from "@/shared/ui/toast";

type SavedJobsSort = "company" | "deadline" | "newest" | "oldest";
const emptySavedJobs: SavedJobApi[] = [];
const pageSize = 8;

export function CandidateSavedJobsPage() {
  const t = useTranslations("CandidateWorkspace");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isSessionResolved, session } = useCandidateProfileWorkspace();
  const query = searchParams.get("q") ?? "";
  const sortParam = searchParams.get("sort");
  const sort: SavedJobsSort =
    sortParam === "company" || sortParam === "oldest" || sortParam === "deadline"
      ? sortParam
      : "newest";
  const urgencyParam = searchParams.get("urgency");
  const urgency: SavedJobFilter = isSavedJobFilter(urgencyParam) ? urgencyParam : "all";
  const requestedPage = Math.max(1, Math.floor(Number(searchParams.get("page")) || 1));
  const [draftQuery, setDraftQuery] = useState(query);
  const savedJobsQueryKey = ["candidate-saved-jobs", session?.user.id] as const;

  const savedJobsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getMySavedJobs(session!.accessToken),
    queryKey: savedJobsQueryKey,
  });
  const publicJobsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: getPublicJobs,
    queryKey: ["public-jobs"],
  });

  const restoreMutation = useMutation({
    mutationFn: (savedJob: SavedJobApi) =>
      saveCandidateJob(session!.accessToken, savedJob.jobPostId),
    onError: () => toast.error(t("savedJobs.feedback.error")),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: savedJobsQueryKey });
    },
  });

  /* Removal reports through the app-wide toaster rather than a second fixed layer of this page's
     own: two stacks pinned to the same corner would overlap, and this one gets the shared
     stacking, animation and swipe-to-dismiss for free. */
  const unsaveMutation = useMutation({
    mutationFn: (jobPostId: string) => unsaveCandidateJob(session!.accessToken, jobPostId),
    onMutate: async (jobPostId) => {
      await queryClient.cancelQueries({ queryKey: savedJobsQueryKey });
      const previous = queryClient.getQueryData<SavedJobApi[]>(savedJobsQueryKey) ?? [];
      const removed = previous.find((savedJob) => savedJob.jobPostId === jobPostId) ?? null;
      queryClient.setQueryData<SavedJobApi[]>(savedJobsQueryKey, (current = []) =>
        current.filter((savedJob) => savedJob.jobPostId !== jobPostId),
      );
      return { previous, removed };
    },
    onError: (_error, _jobPostId, context) => {
      if (context?.previous) queryClient.setQueryData(savedJobsQueryKey, context.previous);
      toast.error(t("savedJobs.feedback.error"));
    },
    onSuccess: (_data, _jobPostId, context) => {
      const removed = context?.removed;
      if (!removed) return;

      const toastId = `unsave-job-${removed.jobPostId}`;
      toast.success(t("savedJobs.feedback.removed"), {
        id: toastId,
        action: {
          label: t("common.undo"),
          onClick: () => {
            toast.dismiss(toastId);
            restoreMutation.mutate(removed);
          },
        },
      });
    },
  });

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const publicJobsById = useMemo(
    () => new Map((publicJobsQuery.data ?? []).map((job) => [job.id, job])),
    [publicJobsQuery.data],
  );
  const savedJobs = savedJobsQuery.data ?? emptySavedJobs;
  const isUnauthorized =
    savedJobsQuery.error instanceof ApiError && savedJobsQuery.error.status === 401;
  const matchesQuery = (savedJob: SavedJobApi, normalizedQuery: string) =>
    !normalizedQuery ||
    [savedJob.jobPost.title, savedJob.jobPost.company.name]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);

  /**
   * Counted within the search but across every urgency, so a tab reports what picking it would show
   * rather than collapsing to zero once another tab is active.
   */
  const urgencyCounts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const searched = savedJobs.filter((savedJob) => matchesQuery(savedJob, normalizedQuery));

    return SAVED_JOB_FILTERS.reduce<Record<SavedJobFilter, number>>(
      (result, group) => {
        result[group] = searched.filter((savedJob) =>
          matchesSavedJobFilter(savedJob.jobPost, group),
        ).length;
        return result;
      },
      { all: 0, closed: 0, open: 0, soon: 0 },
    );
  }, [query, savedJobs]);

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return savedJobs
      .filter(
        (savedJob) =>
          matchesQuery(savedJob, normalizedQuery) &&
          matchesSavedJobFilter(savedJob.jobPost, urgency),
      )
      .toSorted((left, right) => {
        if (sort === "company") {
          return left.jobPost.company.name.localeCompare(right.jobPost.company.name, locale);
        }
        if (sort === "deadline") {
          return compareSavedJobDeadline(left.jobPost, right.jobPost);
        }
        const difference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        return sort === "newest" ? difference : -difference;
      });
  }, [locale, query, savedJobs, sort, urgency]);

  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const paginatedJobs = visibleJobs.slice((page - 1) * pageSize, page * pageSize);
  const updateSearch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (!value || (key === "sort" && value === "newest")) next.delete(key);
      else next.set(key, value);
    });
    // Narrowing the list invalidates the current page, so drop it unless the change is the page.
    if (!("page" in changes)) next.delete("page");
    const suffix = next.toString();
    router.replace(suffix ? `/candidate/saved-jobs?${suffix}` : "/candidate/saved-jobs", {
      scroll: false,
    });
  };

  const pageHeader = (
    <CandidatePageHeader
      breadcrumbItems={[
        { href: "/", label: t("common.home") },
        { label: t("savedJobs.page.title") },
      ]}
      description={t("savedJobs.page.description")}
      title={t("savedJobs.page.title")}
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
        <CandidateSavedJobsLoading />
      </div>
    );
  }

  if (!session || isUnauthorized) {
    return (
      <div className="space-y-6 pb-4">
        {pageHeader}
        <SavedJobsState
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

      {savedJobsQuery.isLoading ? <CandidateSavedJobsLoading /> : null}
      {savedJobsQuery.isError ? (
        <SavedJobsState
          tone="error"
          icon={<WarningCircle />}
          title={t("savedJobs.states.errorTitle")}
          description={t("savedJobs.states.errorDescription")}
          action={
            <Button className="rounded-xl" onClick={() => savedJobsQuery.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : null}

      {savedJobsQuery.isSuccess ? (
        <section className="min-w-0" aria-labelledby="saved-jobs-list-title">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 pt-4 sm:px-5 sm:pt-5">
              <h2 id="saved-jobs-list-title" className="text-lg font-bold text-slate-950">
                {t("savedJobs.list.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("savedJobs.list.count", { count: visibleJobs.length })}
              </p>
              {/* Deadline tabs, not status tabs: a shortlist is triaged by what closes first, and
                  "Sắp hết hạn" is the whole reason to revisit this page. */}
              <div
                className="hide-scroll mt-4 flex gap-5 overflow-x-auto"
                role="group"
                aria-label={t("savedJobs.filters.urgencyLabel")}
              >
                {SAVED_JOB_FILTERS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    aria-pressed={urgency === group}
                    onClick={() => updateSearch({ urgency: group === "all" ? null : group })}
                    className={cn(
                      "upnext-focus relative min-h-11 shrink-0 border-b-2 px-0.5 pb-3 text-sm font-bold transition-colors",
                      urgency === group
                        ? "border-brand text-accent-foreground"
                        : "border-transparent text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {t(`savedJobs.filters.groups.${group}`)}
                    <span className="ml-1.5 text-xs tabular-nums">{urgencyCounts[group]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-b border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:p-5">
              <form
                className="relative"
                onSubmit={(event) => {
                  event.preventDefault();
                  updateSearch({ q: draftQuery.trim() || null });
                }}
              >
                <label className="sr-only" htmlFor="candidate-saved-jobs-search">
                  {t("savedJobs.filters.searchLabel")}
                </label>
                <MagnifyingGlass
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                />
                <Input
                  id="candidate-saved-jobs-search"
                  name="saved-job-search"
                  type="search"
                  autoComplete="off"
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  className="rounded-lg border-slate-200 bg-slate-50 pr-20 pl-10"
                  placeholder={t("savedJobs.filters.searchPlaceholder")}
                />
                <button
                  type="submit"
                  className="upnext-focus text-accent-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-emerald-50"
                >
                  {t("common.search")}
                </button>
              </form>
              <div>
                <label className="sr-only" htmlFor="saved-jobs-sort">
                  {t("savedJobs.filters.sortLabel")}
                </label>
                <select
                  id="saved-jobs-sort"
                  value={sort}
                  onChange={(event) => updateSearch({ sort: event.target.value })}
                  className="upnext-focus h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700"
                >
                  <option value="newest">{t("savedJobs.filters.newest")}</option>
                  <option value="deadline">{t("savedJobs.filters.deadline")}</option>
                  <option value="oldest">{t("savedJobs.filters.oldest")}</option>
                  <option value="company">{t("savedJobs.filters.company")}</option>
                </select>
              </div>
            </div>

            {paginatedJobs.length > 0 ? (
              <ul className="divide-y divide-slate-200">
                {paginatedJobs.map((savedJob) => (
                  <li key={savedJob.id}>
                    <SavedJobRow
                      fallbackLogo={
                        publicJobsById.get(savedJob.jobPostId)?.company?.logoUrl ??
                        publicJobsById.get(savedJob.jobPostId)?.company?.logoFile?.publicUrl
                      }
                      isRemoving={
                        unsaveMutation.isPending && unsaveMutation.variables === savedJob.jobPostId
                      }
                      locale={locale}
                      location={getJobLocation(
                        publicJobsById.get(savedJob.jobPostId),
                        t("common.locationFallback"),
                      )}
                      savedJob={savedJob}
                      onRemove={() => unsaveMutation.mutate(savedJob.jobPostId)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptySavedJobs hasSavedJobs={savedJobs.length > 0} urgency={urgency} />
            )}

            {visibleJobs.length > pageSize ? (
              <SavedJobsPagination
                page={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => updateSearch({ page: String(nextPage) })}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SavedJobRow({
  fallbackLogo,
  isRemoving,
  locale,
  location,
  onRemove,
  savedJob,
}: Readonly<{
  fallbackLogo?: string | null | undefined;
  isRemoving: boolean;
  locale: string;
  location: string;
  onRemove: () => void;
  savedJob: SavedJobApi;
}>) {
  const t = useTranslations("CandidateWorkspace");
  const available = isJobAvailable(savedJob.jobPost);
  const logo = getCompanyLogo(savedJob.jobPost, fallbackLogo);
  const tags = getJobTags(savedJob.jobPost);
  const savedAt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(savedJob.createdAt),
  );
  const { daysLeft, urgency } = getSavedJobDeadline(savedJob.jobPost);
  const deadlineDate = savedJob.jobPost.expiredAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(savedJob.jobPost.expiredAt),
      )
    : null;

  /**
   * The deadline, not the save date, is what decides whether to act — the page description promises
   * applying before a posting expires, so the countdown leads and the save date is demoted.
   */
  const deadlineLabel = (() => {
    if (urgency === "closed") return t("savedJobs.card.closed");
    if (daysLeft === null) return t("savedJobs.card.noDeadline");
    if (daysLeft <= 0) return t("savedJobs.card.closesToday");
    if (urgency === "soon") return t("savedJobs.card.closesInDays", { days: daysLeft });
    return t("savedJobs.card.closesOn", { date: deadlineDate ?? "" });
  })();

  return (
    <article className="group p-5 transition-colors hover:bg-slate-50 sm:px-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 sm:size-14">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={56}
              height={56}
              unoptimized
              loading="lazy"
              className="size-full object-contain p-2"
            />
          ) : (
            savedJob.jobPost.company.name.slice(0, 2).toLocaleUpperCase()
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/jobs/${savedJob.jobPostId}`}
                className="upnext-focus hover:text-accent-foreground block rounded text-base font-bold text-slate-950 sm:text-lg"
              >
                <span className="line-clamp-2">{savedJob.jobPost.title}</span>
              </Link>
              <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                {savedJob.jobPost.company.name}
              </p>
            </div>
            <button
              type="button"
              aria-label={t("savedJobs.card.remove", { title: savedJob.jobPost.title })}
              disabled={isRemoving}
              onClick={onRemove}
              className="upnext-focus grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isRemoving ? (
                <SpinnerGap aria-hidden="true" className="animate-spin" />
              ) : (
                <Trash aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" size={15} />
              {location}
            </span>
            {/* Amber only inside the warning window: colouring every deadline would make the badge
                mean nothing when one is genuinely close. */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold",
                urgency === "soon"
                  ? "bg-amber-50 text-amber-800"
                  : urgency === "closed"
                    ? "bg-slate-100 text-slate-500"
                    : "text-slate-500",
              )}
            >
              {urgency === "soon" ? (
                <Clock aria-hidden="true" size={15} weight="fill" />
              ) : (
                <Clock aria-hidden="true" size={15} />
              )}
              {deadlineLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <BookmarkSimple aria-hidden="true" size={15} />
              {t("savedJobs.card.savedAt", { date: savedAt })}
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
                {formatJobSalary(savedJob.jobPost, locale, {
                  hidden: t("common.salaryHidden"),
                  negotiable: t("common.salaryNegotiable"),
                })}
              </span>
            </div>
            {available ? (
              <Button asChild size="sm" className="w-full rounded-xl sm:w-auto">
                <Link href={`/jobs/${savedJob.jobPostId}`}>
                  {t("savedJobs.card.viewAndApply")}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {t("savedJobs.card.unavailable")}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * An empty tab is not the same as an empty shortlist: "no deadlines close soon" is good news, while
 * "you saved nothing" needs a nudge to go browse. Saying the right one keeps the page from reading
 * like a dead end.
 */
function EmptySavedJobs({
  hasSavedJobs,
  urgency,
}: Readonly<{ hasSavedJobs: boolean; urgency: SavedJobFilter }>) {
  const t = useTranslations("CandidateWorkspace");

  const state = (() => {
    if (!hasSavedJobs) {
      return { key: "empty", clear: false } as const;
    }
    if (urgency === "soon") return { key: "noSoon", clear: true } as const;
    if (urgency === "open") return { key: "noOpen", clear: true } as const;
    if (urgency === "closed") return { key: "noClosed", clear: true } as const;
    return { key: "noResults", clear: true } as const;
  })();

  return (
    <div className="px-5 py-14 text-center sm:py-16">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <BookmarkSimple aria-hidden="true" size={26} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-950">
        {t(`savedJobs.states.${state.key}Title`)}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {t(`savedJobs.states.${state.key}Description`)}
      </p>
      <Button asChild variant={state.clear ? "outline" : "primary"} className="mt-5 rounded-xl">
        <Link href={state.clear ? "/candidate/saved-jobs" : "/jobs"}>
          {state.clear ? t("common.clearFilters") : t("common.exploreJobs")}
        </Link>
      </Button>
    </div>
  );
}

function SavedJobsPagination({
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

export function CandidateSavedJobsLoading() {
  const t = useTranslations("CandidateWorkspace");

  return (
    <div aria-busy="true" className="space-y-5">
      <span className="sr-only">{t("common.loading")}</span>
      <Skeleton className="h-[520px] rounded-xl" />
    </div>
  );
}

function SavedJobsState({
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
    <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
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
