/**
 * Result-toolbar rules for the public jobs list: how results are ordered, how many appear per page,
 * how they are laid out, and what the "showing X–Y of N" line reads.
 *
 * Kept apart from the page component so the ordering and range arithmetic can be tested directly —
 * both have already shipped wrong once.
 */

/**
 * Every ordering the list offers, and the only list of them.
 *
 * Each dimension is offered in both directions: a reader who can ask for the newest can ask for the
 * oldest, and one who can ask for the best paid can ask for the cheapest. Half a dimension is what
 * the toolbar used to expose ("Mới nhất" and "Lương cao nhất" with no counterparts), which reads as
 * an unfinished control rather than a deliberate choice.
 */
export const JOB_SORTS = ["relevant", "newest", "oldest", "salary-desc", "salary-asc"] as const;

export type JobSort = (typeof JOB_SORTS)[number];

export const DEFAULT_JOB_SORT: JobSort = "relevant";

export function isJobSort(value: string | null | undefined): value is JobSort {
  return JOB_SORTS.includes(value as JobSort);
}

/** Links shared before the salary orders were split still carry `sort=salary`. */
const LEGACY_JOB_SORTS: Record<string, JobSort> = { salary: "salary-desc" };

/**
 * The single entry point for turning a URL value into an ordering.
 *
 * This exists because the page previously validated `sort` twice — once against its own Set when
 * reading the URL and once here before sorting — so adding an option to the dropdown would have
 * left it working on screen but silently dropped from any shared link.
 */
export function parseJobSort(value: string | null | undefined): JobSort {
  if (isJobSort(value)) return value;
  return (value && LEGACY_JOB_SORTS[value]) || DEFAULT_JOB_SORT;
}

/**
 * Page sizes are multiples of six so a row stays full in both layouts: the grid is 2 columns at
 * tablet and 3 at desktop, and a trailing half-empty row reads as a rendering fault.
 */
export const JOB_PAGE_SIZES = [12, 24, 48] as const;

export type JobPageSize = (typeof JOB_PAGE_SIZES)[number];

export const DEFAULT_JOB_PAGE_SIZE: JobPageSize = 12;

export function parseJobPageSize(value: string | null | undefined): JobPageSize {
  const parsed = Number(value);
  return JOB_PAGE_SIZES.includes(parsed as JobPageSize)
    ? (parsed as JobPageSize)
    : DEFAULT_JOB_PAGE_SIZE;
}

export const JOB_VIEWS = ["list", "grid"] as const;

export type JobView = (typeof JOB_VIEWS)[number];

export const DEFAULT_JOB_VIEW: JobView = "list";

export function isJobView(value: string | null | undefined): value is JobView {
  return JOB_VIEWS.includes(value as JobView);
}

/** The subset of a job the toolbar needs, so this module stays independent of the page's Job type. */
export type SortableJob = {
  id: string;
  salary: string;
  publishedAt?: string | null;
  featured?: boolean | undefined;
  urgent?: boolean | undefined;
};

/** Salary is free text ("30 - 55 triệu/tháng"), so the ceiling is the largest figure it states. */
export function jobSalaryCeiling(job: Pick<SortableJob, "salary">) {
  const values = job.salary.match(/\d+/g)?.map(Number) ?? [];
  return values.length ? Math.max(...values) : 0;
}

function publishedTime(job: Pick<SortableJob, "publishedAt">) {
  if (!job.publishedAt) return null;

  const time = new Date(job.publishedAt).getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Orders by publication date in either direction.
 *
 * This used to compare the pre-formatted `posted` label with localeCompare, which orders by text:
 * against live data that put "8 ngày trước" *after* "26 ngày trước", so the newest posting on the
 * board landed last.
 *
 * Undated postings sort last in *both* directions. An absent date is not evidence of being recent,
 * and it is equally not evidence of being old — so it must not head the "cũ nhất" list either.
 */
export function compareJobsByRecency(
  left: Pick<SortableJob, "publishedAt">,
  right: Pick<SortableJob, "publishedAt">,
  direction: "asc" | "desc" = "desc",
) {
  const leftTime = publishedTime(left);
  const rightTime = publishedTime(right);

  if (leftTime === null && rightTime === null) return 0;
  if (leftTime === null) return 1;
  if (rightTime === null) return -1;

  return direction === "asc" ? leftTime - rightTime : rightTime - leftTime;
}

/**
 * Orders by pay in either direction.
 *
 * An undisclosed salary sorts last in *both* directions rather than reading as 0. Treating it as
 * zero would head the "lương thấp nhất" list with every "Thỏa thuận" posting, which answers a
 * question nobody asked: those postings state no pay at all, so they are not the cheapest.
 */
export function compareJobsBySalary(
  left: Pick<SortableJob, "salary">,
  right: Pick<SortableJob, "salary">,
  direction: "asc" | "desc" = "desc",
) {
  const leftCeiling = jobSalaryCeiling(left);
  const rightCeiling = jobSalaryCeiling(right);

  if (leftCeiling === 0 && rightCeiling === 0) return 0;
  if (leftCeiling === 0) return 1;
  if (rightCeiling === 0) return -1;

  return direction === "asc" ? leftCeiling - rightCeiling : rightCeiling - leftCeiling;
}

/**
 * Sorts a copy, so the caller's array is never mutated.
 *
 * Every order falls back to recency and then to id. Without a total order, two jobs that tie would
 * keep whatever position the previous render left them in, and a list that reshuffles under an
 * unrelated re-render looks broken.
 */
export function sortJobs<TJob extends SortableJob>(
  jobs: readonly TJob[],
  sort: JobSort,
  relevanceScore: (job: TJob) => number = () => 0,
) {
  const byIdentity = (left: TJob, right: TJob) => left.id.localeCompare(right.id);
  const byNewest = (left: TJob, right: TJob) =>
    compareJobsByRecency(left, right, "desc") || byIdentity(left, right);

  return [...jobs].sort((left, right) => {
    if (sort === "newest") return byNewest(left, right);
    if (sort === "oldest") {
      return compareJobsByRecency(left, right, "asc") || byIdentity(left, right);
    }
    if (sort === "salary-desc") {
      return compareJobsBySalary(left, right, "desc") || byNewest(left, right);
    }
    if (sort === "salary-asc") {
      return compareJobsBySalary(left, right, "asc") || byNewest(left, right);
    }

    const byScore = relevanceScore(right) - relevanceScore(left);
    if (byScore !== 0) return byScore;

    const promotion = (job: TJob) => (job.featured ? 2 : 0) + (job.urgent ? 1 : 0);
    return promotion(right) - promotion(left) || byNewest(left, right);
  });
}

/**
 * The "showing X–Y of N" figures.
 *
 * Everything is derived from `total` rather than from the requested page, so the line can never
 * claim a range wider than the result set — the failure that reads as "Vị trí 1–12 của 3 việc làm".
 * An empty result set reports 0–0, which the caller is expected to replace with an empty state.
 */
export function getResultRange(page: number, pageSize: JobPageSize, total: number) {
  if (total <= 0) return { from: 0, to: 0, totalPages: 1, page: 1 };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);

  return {
    from: (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, total),
    totalPages,
    page: safePage,
  };
}
