"use client";

import {
  ArrowRight,
  BookmarkSimple,
  CaretRight,
  Clock,
  CurrencyCircleDollar,
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
  compareSavedJobSalary,
  formatJobSalary,
  getCompanyLogo,
  getJobLocation,
  getJobTags,
  getSavedJobDeadline,
  groupSavedJobsByUrgency,
  isJobAvailable,
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

const SAVED_JOB_SORTS = ["deadline", "salary", "newest", "oldest", "company"] as const;

type SavedJobsSort = (typeof SAVED_JOB_SORTS)[number];

/** Deadline first: the shortlist exists to be cleared before postings close. */
const defaultSort: SavedJobsSort = "deadline";
const emptySavedJobs: SavedJobApi[] = [];

export function CandidateSavedJobsPage() {
  const t = useTranslations("CandidateWorkspace");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isSessionResolved, session } = useCandidateProfileWorkspace();
  const query = searchParams.get("q") ?? "";
  const sortParam = searchParams.get("sort");
  const sort: SavedJobsSort = SAVED_JOB_SORTS.includes(sortParam as SavedJobsSort)
    ? (sortParam as SavedJobsSort)
    : defaultSort;
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

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return savedJobs
      .filter((savedJob) => matchesQuery(savedJob, normalizedQuery))
      .toSorted((left, right) => {
        if (sort === "company") {
          return left.jobPost.company.name.localeCompare(right.jobPost.company.name, locale);
        }
        if (sort === "deadline") {
          return compareSavedJobDeadline(left.jobPost, right.jobPost);
        }
        if (sort === "salary") {
          return compareSavedJobSalary(left.jobPost, right.jobPost);
        }
        const difference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        return sort === "newest" ? difference : -difference;
      });
  }, [locale, query, savedJobs, sort]);

  /* Sections replace the urgency tabs: nothing is hidden behind a click, and the entries closing
     first sit at the top of the page where they get seen. */
  const groups = useMemo(
    () => groupSavedJobsByUrgency(visibleJobs, (savedJob) => savedJob.jobPost),
    [visibleJobs],
  );

  const updateSearch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (!value || (key === "sort" && value === defaultSort)) next.delete(key);
      else next.set(key, value);
    });
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
        <>
          {/* A bare toolbar, not the tracker's boxed filter panel: on a shortlist the entries are the
              content, so the controls should not be framed as heavily as the list itself. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form
              className="relative min-w-0 flex-1"
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
                className="rounded-xl border-slate-200 bg-white pr-20 pl-10"
                placeholder={t("savedJobs.filters.searchPlaceholder")}
              />
              <button
                type="submit"
                className="upnext-focus text-accent-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-emerald-50"
              >
                {t("common.search")}
              </button>
            </form>
            <div className="shrink-0">
              <label className="sr-only" htmlFor="saved-jobs-sort">
                {t("savedJobs.filters.sortLabel")}
              </label>
              <select
                id="saved-jobs-sort"
                value={sort}
                onChange={(event) => updateSearch({ sort: event.target.value })}
                className="upnext-focus h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 sm:w-56"
              >
                <option value="deadline">{t("savedJobs.filters.deadline")}</option>
                <option value="salary">{t("savedJobs.filters.salary")}</option>
                <option value="newest">{t("savedJobs.filters.newest")}</option>
                <option value="oldest">{t("savedJobs.filters.oldest")}</option>
                <option value="company">{t("savedJobs.filters.company")}</option>
              </select>
            </div>
          </div>

          {groups.length > 0 ? (
            <div className="space-y-6">
              {groups.map((group) => {
                const cards = (
                  <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((savedJob) => (
                      <li key={savedJob.id}>
                        <SavedJobCard
                          fallbackLogo={
                            publicJobsById.get(savedJob.jobPostId)?.company?.logoUrl ??
                            publicJobsById.get(savedJob.jobPostId)?.company?.logoFile?.publicUrl
                          }
                          isRemoving={
                            unsaveMutation.isPending &&
                            unsaveMutation.variables === savedJob.jobPostId
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
                );

                /* Closed entries are kept so they can still be cleared, but they are not decisions
                   any more, so they collapse instead of pushing live ones down the page. */
                if (group.urgency === "closed") {
                  return (
                    <details key={group.urgency} className="group/section">
                      <summary className="upnext-focus flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
                        <CaretRight
                          aria-hidden="true"
                          className="transition-transform group-open/section:rotate-90"
                        />
                        {t("savedJobs.groups.closed")}
                        <span className="text-xs tabular-nums">({group.items.length})</span>
                      </summary>
                      <div className="mt-4">{cards}</div>
                    </details>
                  );
                }

                return (
                  <section key={group.urgency} aria-labelledby={`saved-group-${group.urgency}`}>
                    <div className="mb-3 flex items-baseline gap-2">
                      <h2
                        id={`saved-group-${group.urgency}`}
                        className={cn(
                          "text-sm font-bold",
                          group.urgency === "soon" ? "text-amber-700" : "text-slate-700",
                        )}
                      >
                        {t(`savedJobs.groups.${group.urgency}`)}
                      </h2>
                      <span className="text-xs font-semibold text-slate-400 tabular-nums">
                        {group.items.length}
                      </span>
                    </div>
                    {group.urgency === "soon" ? (
                      <p className="mb-3 text-xs text-slate-500">
                        {t("savedJobs.groups.soonHint")}
                      </p>
                    ) : null}
                    {cards}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white">
              <EmptySavedJobs hasSavedJobs={savedJobs.length > 0} />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function SavedJobCard({
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
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-white p-4 transition hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]",
        urgency === "soon" ? "border-amber-200" : "border-slate-200",
        urgency === "closed" && "opacity-75",
      )}
    >
      {/* The deadline is the card's first line, above the job itself: on a shortlist it decides
          whether this entry is worth opening at all. */}
      <p
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold",
          urgency === "soon"
            ? "bg-amber-100 text-amber-900"
            : urgency === "closed"
              ? "bg-slate-100 text-slate-500"
              : "bg-slate-50 text-slate-600",
        )}
      >
        <Clock aria-hidden="true" size={14} weight={urgency === "soon" ? "fill" : "regular"} />
        {deadlineLabel}
      </p>

      <div className="mt-3 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={44}
              height={44}
              unoptimized
              loading="lazy"
              className="size-full object-contain p-1.5"
            />
          ) : (
            savedJob.jobPost.company.name.slice(0, 2).toLocaleUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-950">
            <Link
              href={`/jobs/${savedJob.jobPostId}`}
              className="upnext-focus hover:text-accent-foreground rounded"
            >
              <span className="line-clamp-2">{savedJob.jobPost.title}</span>
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            {savedJob.jobPost.company.name}
          </p>
        </div>
        {/* Quiet by default: removing is a correction, not the card's purpose. */}
        <button
          type="button"
          aria-label={t("savedJobs.card.remove", { title: savedJob.jobPost.title })}
          disabled={isRemoving}
          onClick={onRemove}
          className="upnext-focus grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
        >
          {isRemoving ? (
            <SpinnerGap aria-hidden="true" className="animate-spin" />
          ) : (
            <Trash aria-hidden="true" size={16} />
          )}
        </button>
      </div>

      <dl className="mt-3 grid gap-1.5 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{t("savedJobs.card.locationLabel")}</dt>
          <MapPin aria-hidden="true" size={14} className="shrink-0 text-slate-400" />
          <dd className="truncate">{location}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{t("savedJobs.card.salaryLabel")}</dt>
          <CurrencyCircleDollar aria-hidden="true" size={14} className="shrink-0 text-slate-400" />
          <dd className="text-accent-foreground truncate font-bold">
            {formatJobSalary(savedJob.jobPost, locale, {
              hidden: t("common.salaryHidden"),
              negotiable: t("common.salaryNegotiable"),
            })}
          </dd>
        </div>
      </dl>

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-[11px] font-medium text-slate-400">
        {t("savedJobs.card.savedAt", { date: savedAt })}
      </p>

      <div className="mt-auto pt-4">
        {available ? (
          <Button asChild className="w-full rounded-xl">
            <Link href={`/jobs/${savedJob.jobPostId}`}>
              {t("savedJobs.card.viewAndApply")}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full rounded-xl">
            <Link href={`/jobs/${savedJob.jobPostId}`}>{t("savedJobs.card.viewClosed")}</Link>
          </Button>
        )}
      </div>
    </article>
  );
}

/**
 * An empty tab is not the same as an empty shortlist: "no deadlines close soon" is good news, while
 * "you saved nothing" needs a nudge to go browse. Saying the right one keeps the page from reading
 * like a dead end.
 */
function EmptySavedJobs({ hasSavedJobs }: Readonly<{ hasSavedJobs: boolean }>) {
  const t = useTranslations("CandidateWorkspace");
  // Grouping shows every entry, so the only two empty cases left are "nothing saved" and
  // "nothing matches the search".
  const state = hasSavedJobs
    ? ({ key: "noResults", clear: true } as const)
    : ({ key: "empty", clear: false } as const);

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
