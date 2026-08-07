import type {
  CandidateActivityJobPostApi,
  CandidateApplicationApi,
  CandidateApplicationStatus,
} from "@/features/candidate/api/profile";
import type { PublicJob } from "@/features/public/home/api";

export type ApplicationStatusGroup = "active" | "all" | "closed" | "interview" | "offer";

const activeStatuses = new Set<CandidateApplicationStatus>([
  "SUBMITTED",
  "VIEWED",
  "CONSIDERING",
  "SHORTLISTED",
]);
const offerStatuses = new Set<CandidateApplicationStatus>(["OFFERED", "HIRED"]);
const withdrawableStatuses = new Set<CandidateApplicationStatus>([
  "SUBMITTED",
  "VIEWED",
  "CONSIDERING",
  "SHORTLISTED",
  "INTERVIEWING",
  "OFFERED",
]);
const cvEditableStatuses = new Set<CandidateApplicationStatus>(["SUBMITTED"]);

export function getApplicationStatusGroup(
  status: CandidateApplicationStatus,
): Exclude<ApplicationStatusGroup, "all"> {
  if (activeStatuses.has(status)) return "active";
  if (status === "INTERVIEWING") return "interview";
  if (offerStatuses.has(status)) return "offer";
  return "closed";
}

export function canWithdrawApplication(status: CandidateApplicationStatus) {
  return withdrawableStatuses.has(status);
}

export function canChangeApplicationCv(status: CandidateApplicationStatus) {
  return cvEditableStatuses.has(status);
}

export function filterApplications(
  applications: readonly CandidateApplicationApi[],
  group: ApplicationStatusGroup,
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return applications.filter((application) => {
    if (group !== "all" && getApplicationStatusGroup(application.status) !== group) return false;
    if (!normalizedQuery) return true;

    return [application.jobPost.title, application.jobPost.company.name]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
}

export function getCompanyLogo(jobPost: CandidateActivityJobPostApi, fallbackLogo?: string | null) {
  return jobPost.company.logoUrl ?? jobPost.company.logoFile?.publicUrl ?? fallbackLogo ?? null;
}

export function getJobLocation(publicJob: PublicJob | undefined, fallback: string) {
  return publicJob?.jobPostLocations?.[0]?.jobLocation.city || fallback;
}

export function getJobTags(jobPost: CandidateActivityJobPostApi) {
  return [jobPost.jobCategory?.name, jobPost.experienceLevel?.name, jobPost.employmentType?.name]
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
}

export function formatJobSalary(
  jobPost: CandidateActivityJobPostApi,
  locale: string,
  labels: Readonly<{ hidden: string; negotiable: string }>,
) {
  if (!jobPost.salaryIsVisible) return labels.hidden;
  if (jobPost.salaryIsNegotiable && !jobPost.salaryMin && !jobPost.salaryMax) {
    return labels.negotiable;
  }

  const minimum = toFiniteNumber(jobPost.salaryMin);
  const maximum = toFiniteNumber(jobPost.salaryMax);
  const formatter = new Intl.NumberFormat(locale, {
    currency: jobPost.salaryCurrency || "VND",
    maximumFractionDigits: 0,
    style: "currency",
  });

  if (minimum !== null && maximum !== null) {
    return `${formatter.format(minimum)} – ${formatter.format(maximum)}`;
  }
  if (minimum !== null) return `${formatter.format(minimum)}+`;
  if (maximum !== null) return `≤ ${formatter.format(maximum)}`;
  return labels.negotiable;
}

export function isJobAvailable(jobPost: CandidateActivityJobPostApi, now = new Date()) {
  if (jobPost.status.toUpperCase() !== "PUBLISHED") return false;
  if (!jobPost.expiredAt) return true;
  return new Date(jobPost.expiredAt).getTime() > now.getTime();
}

/**
 * How much time is left to apply.
 *
 * A shortlist exists to be acted on before postings close, so the days remaining is the fact that
 * decides what a candidate does next. Every live posting carries `expiredAt`, and "closed" also
 * covers a posting pulled by the employer, which has no deadline to count down to.
 */
export type SavedJobUrgency = "closed" | "open" | "soon";

/** A posting closing inside this window is worth flagging before it is too late to apply. */
export const SAVED_JOB_SOON_DAYS = 7;

export type SavedJobDeadline = {
  /**
   * Whole days remaining, floored, so the countdown never claims more time than the posting has:
   * 47 hours left reads as one day rather than two. Null once the posting is closed.
   */
  daysLeft: number | null;
  urgency: SavedJobUrgency;
};

export function getSavedJobDeadline(
  jobPost: CandidateActivityJobPostApi,
  now = new Date(),
): SavedJobDeadline {
  if (!isJobAvailable(jobPost, now)) return { urgency: "closed", daysLeft: null };
  if (!jobPost.expiredAt) return { urgency: "open", daysLeft: null };

  const millisecondsLeft = new Date(jobPost.expiredAt).getTime() - now.getTime();
  const daysLeft = Math.floor(millisecondsLeft / 86_400_000);

  return {
    urgency: daysLeft <= SAVED_JOB_SOON_DAYS ? "soon" : "open",
    daysLeft,
  };
}

export type SavedJobFilter = "all" | SavedJobUrgency;

export const SAVED_JOB_FILTERS: readonly SavedJobFilter[] = ["all", "soon", "open", "closed"];

export function isSavedJobFilter(value: string | null | undefined): value is SavedJobFilter {
  return SAVED_JOB_FILTERS.includes(value as SavedJobFilter);
}

export function matchesSavedJobFilter(
  jobPost: CandidateActivityJobPostApi,
  filter: SavedJobFilter,
  now = new Date(),
) {
  if (filter === "all") return true;
  return getSavedJobDeadline(jobPost, now).urgency === filter;
}

/**
 * Orders a shortlist by what closes first, so triage does not depend on when things were saved.
 * Closed postings sink to the bottom: they are kept so the row can still be removed, but they are
 * no longer decisions to make.
 */
export function compareSavedJobDeadline(
  left: CandidateActivityJobPostApi,
  right: CandidateActivityJobPostApi,
  now = new Date(),
) {
  const rank = (jobPost: CandidateActivityJobPostApi) => {
    const { urgency, daysLeft } = getSavedJobDeadline(jobPost, now);
    if (urgency === "closed") return Number.POSITIVE_INFINITY;
    return daysLeft ?? Number.MAX_SAFE_INTEGER;
  };

  return rank(left) - rank(right);
}

/** The top of the advertised range, or the floor when only that is published. */
export function getJobSalaryCeiling(jobPost: CandidateActivityJobPostApi) {
  if (!jobPost.salaryIsVisible) return null;
  return toFiniteNumber(jobPost.salaryMax) ?? toFiniteNumber(jobPost.salaryMin);
}

/** Undisclosed pay sorts last rather than as zero, which would rank it below the worst-paid job. */
export function compareSavedJobSalary(
  left: CandidateActivityJobPostApi,
  right: CandidateActivityJobPostApi,
) {
  const ceiling = (jobPost: CandidateActivityJobPostApi) =>
    getJobSalaryCeiling(jobPost) ?? Number.NEGATIVE_INFINITY;

  return ceiling(right) - ceiling(left);
}

/**
 * Sections the shortlist so the closing postings sit at the top of the page.
 *
 * Grouping replaces the urgency tabs this page used to carry. A shortlist is small and every entry is
 * a pending decision, so hiding three quarters of it behind a tab costs more than it saves — and
 * tabs were also the applications tracker's signature control, which made two very different pages
 * read as the same one. Empty groups are dropped so no heading announces nothing.
 */
export const SAVED_JOB_GROUP_ORDER: readonly SavedJobUrgency[] = ["soon", "open", "closed"];

export function groupSavedJobsByUrgency<TItem>(
  items: readonly TItem[],
  readJobPost: (item: TItem) => CandidateActivityJobPostApi,
  now = new Date(),
) {
  return SAVED_JOB_GROUP_ORDER.map((urgency) => ({
    urgency,
    items: items.filter((item) => getSavedJobDeadline(readJobPost(item), now).urgency === urgency),
  })).filter((group) => group.items.length > 0);
}

function toFiniteNumber(value: number | string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
