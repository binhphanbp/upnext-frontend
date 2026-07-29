/**
 * Faceted filtering rules for the public jobs search.
 *
 * The sidebar counts and the result list are two views of the same rules, so both read the
 * predicates below instead of re-deriving them. The job shape is declared structurally rather
 * than importing `Job` so this stays a leaf module with no dependency on the page component.
 */

export type FacetableJob = {
  title: string;
  level: string;
  mode: string;
  salary: string;
  categories: string[];
  skills?: string[];
  experienceYears?: number[];
};

/** Facet groups are AND-ed with each other while options inside one group are OR-ed. */
export const FACET_GROUP_KEYS = [
  "category",
  "level",
  "mode",
  "salary",
  "experience",
  "technology",
] as const;

export type FacetGroupKey = (typeof FACET_GROUP_KEYS)[number];

/** Generic over the job type so callers can keep their own richer job shape. */
export type FacetGroupMatchersFor<TJob extends FacetableJob> = Record<
  FacetGroupKey,
  (job: TJob) => boolean
>;

export type FacetGroupMatchers = FacetGroupMatchersFor<FacetableJob>;

/** Salary is a free-text field, so the bounds are read from the digits it contains. */
export function parseSalaryRange(job: Pick<FacetableJob, "salary">) {
  const values = job.salary.match(/\d+/g)?.map(Number) ?? [];
  if (values.length === 1) return { min: values[0]!, max: values[0]! };
  if (values.length >= 2) return { min: values[0]!, max: values[1]! };
  return { min: 0, max: 0 };
}

export function matchesExperienceRange(years: number[], filter: string) {
  return years.some((year) => {
    if (filter === "exp-0-1") return year < 1;
    if (filter === "exp-1-2") return year >= 1 && year < 2;
    if (filter === "exp-2-4") return year >= 2 && year < 4;
    if (filter === "exp-4-6") return year >= 4 && year < 6;
    if (filter === "exp-6") return year >= 6;
    return false;
  });
}

export function matchesLevelFilter(job: Pick<FacetableJob, "level">, filter: string) {
  const level = job.level.toLowerCase();
  if (filter === "fresher") {
    return level.includes("fresher") || level.includes("junior") || level.includes("intern");
  }
  if (filter === "middle") return level.includes("middle") || level.includes("mid");
  if (filter === "senior") return level.includes("senior") || level.includes("lead");
  return false;
}

export function matchesModeFilter(job: Pick<FacetableJob, "mode">, filter: string) {
  const mode = job.mode.toLowerCase();
  if (filter === "hybrid") return mode.includes("hybrid");
  if (filter === "remote") return mode.includes("remote");
  if (filter === "onsite") return mode.includes("onsite") || mode.includes("office");
  return false;
}

const SALARY_BUCKETS: Record<string, { lo: number; hi: number }> = {
  "sal-0-15": { lo: 0, hi: 15 },
  "sal-15-25": { lo: 15, hi: 25 },
  "sal-25-40": { lo: 25, hi: 40 },
  "sal-40-60": { lo: 40, hi: 60 },
  "sal-60": { lo: 60, hi: Number.POSITIVE_INFINITY },
};

/**
 * A posting matches a bracket when its pay range genuinely extends into it.
 *
 * Brackets are half-open, so a range that only touches a boundary is excluded: a 22-40 posting
 * belongs to "25 - 40" but not to "40 - 60". Treating that single touching point as a match made
 * 195 of 204 postings answer "40 - 60", which filters nothing. Ranges that truly straddle two
 * brackets (a 30-55 posting) still appear under both, which is the point of the bracket list.
 */
export function matchesSalaryFilter(job: Pick<FacetableJob, "salary">, filter: string) {
  const bucket = SALARY_BUCKETS[filter];
  if (!bucket) return false;

  const { min, max } = parseSalaryRange(job);
  // Undisclosed or negotiable pay parses to zero and must not land in any bracket.
  if (max <= 0) return false;

  return max > bucket.lo && min < bucket.hi;
}

export function matchesTechnologyFilter(
  job: Pick<FacetableJob, "title" | "skills">,
  technology: string,
) {
  const needle = technology.toLowerCase();
  return (
    (job.skills?.some((skill) => skill.toLowerCase() === needle) ?? false) ||
    job.title.toLowerCase().includes(needle)
  );
}

export function matchesAllFacetGroups<TJob extends FacetableJob>(
  job: TJob,
  matchers: FacetGroupMatchersFor<TJob>,
) {
  return FACET_GROUP_KEYS.every((key) => matchers[key](job));
}

/**
 * Counts how many jobs an option would yield.
 *
 * The option's own group is skipped: applying it would collapse every unpicked sibling to zero,
 * because options within a group are alternatives rather than additional constraints. Skipping it
 * makes each number answer "how many results if I pick this too", which is what a drill-down
 * filter implies.
 */
export function countFacetOption<TJob extends FacetableJob>(
  jobs: TJob[],
  matchers: FacetGroupMatchersFor<TJob>,
  group: FacetGroupKey,
  matchesOption: (job: TJob) => boolean,
) {
  return jobs.filter(
    (job) =>
      FACET_GROUP_KEYS.every((key) => key === group || matchers[key](job)) && matchesOption(job),
  ).length;
}
