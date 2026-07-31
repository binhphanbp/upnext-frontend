import type { PublicCompany, PublicJob } from "./api";

export const EXPIRING_JOB_WINDOW_DAYS = 14;
export const EXPIRING_JOB_LIMIT = 8;
export const LATEST_JOB_LIMIT = 12;
export const TOP_COMPANY_LIMIT = 8;

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export type DeadlineTone = "critical" | "warning" | "neutral";

/**
 * `/job-posts` is currently the public feed and is expected to contain only
 * published, approved and visible jobs. Keep the date guard here so a stale
 * item cannot leak into a homepage section while the API is being refreshed.
 */
export function isPublicJobAvailable(job: PublicJob, now = Date.now()) {
  const publishedAt = job.publishedAt ? new Date(job.publishedAt).getTime() : null;
  const expiredAt = job.expiredAt ? new Date(job.expiredAt).getTime() : null;

  if (publishedAt !== null && !Number.isFinite(publishedAt)) return false;
  if (expiredAt !== null && !Number.isFinite(expiredAt)) return false;
  if (publishedAt !== null && publishedAt > now) return false;
  if (expiredAt !== null && expiredAt <= now) return false;

  return true;
}

export function getDaysUntilExpiration(job: PublicJob, now = Date.now()) {
  if (!job.expiredAt) return null;

  const expirationTime = new Date(job.expiredAt).getTime();
  if (!Number.isFinite(expirationTime)) return null;

  const remainingTime = expirationTime - now;
  if (remainingTime <= 0) return 0;

  return Math.ceil(remainingTime / DAY_IN_MILLISECONDS);
}

export function getDeadlineTone(days: number | null): DeadlineTone {
  if (days !== null && days <= 3) return "critical";
  if (days !== null && days <= 7) return "warning";
  return "neutral";
}

export function getPublishedTime(job: PublicJob) {
  const source = job.publishedAt ?? job.createdAt;
  const timestamp = new Date(source).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function selectExpiringJobs(
  jobs: readonly PublicJob[] | undefined,
  {
    now = Date.now(),
    limit = EXPIRING_JOB_LIMIT,
    excludedIds,
  }: {
    now?: number;
    limit?: number;
    excludedIds?: ReadonlySet<string>;
  } = {},
) {
  if (!jobs?.length) return [];

  return jobs
    .filter((job) => {
      const days = getDaysUntilExpiration(job, now);
      return (
        isPublicJobAvailable(job, now) &&
        days !== null &&
        days <= EXPIRING_JOB_WINDOW_DAYS &&
        !excludedIds?.has(job.id)
      );
    })
    .toSorted((a, b) => {
      const expirationA = new Date(a.expiredAt!).getTime();
      const expirationB = new Date(b.expiredAt!).getTime();
      return expirationA - expirationB;
    })
    .slice(0, limit);
}

export function selectLatestJobs(
  jobs: readonly PublicJob[] | undefined,
  {
    now = Date.now(),
    limit = LATEST_JOB_LIMIT,
    excludedIds,
  }: {
    now?: number;
    limit?: number;
    excludedIds?: ReadonlySet<string>;
  } = {},
) {
  if (!jobs?.length) return [];

  return jobs
    .filter((job) => isPublicJobAvailable(job, now) && !excludedIds?.has(job.id))
    .toSorted((a, b) => getPublishedTime(b) - getPublishedTime(a))
    .slice(0, limit);
}

export function selectTopCompanies(
  companies: readonly PublicCompany[] | undefined,
  limit = TOP_COMPANY_LIMIT,
) {
  if (!companies?.length) return [];

  return companies
    .filter((company) => company.activeJobsCount > 0)
    .toSorted((a, b) => {
      const jobsDelta = b.activeJobsCount - a.activeJobsCount;
      if (jobsDelta !== 0) return jobsDelta;

      const nameDelta = a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
      return nameDelta !== 0 ? nameDelta : a.id.localeCompare(b.id);
    })
    .slice(0, limit);
}

export function getJobTags(job: PublicJob) {
  if (job.jobPostSkills?.length) {
    return job.jobPostSkills.map((item) => item.skill.name).filter(Boolean);
  }

  return [job.jobCategory?.name, job.employmentType?.name, job.experienceLevel?.name].filter(
    (value): value is string => Boolean(value),
  );
}

export function getJobCities(job: PublicJob) {
  return Array.from(
    new Set(
      (job.jobPostLocations ?? [])
        .map((location) => location.jobLocation?.city?.trim())
        .filter((city): city is string => Boolean(city)),
    ),
  );
}

export function hasRemoteWorkingModel(job: PublicJob) {
  return (job.jobPostLocations ?? []).some((location) => {
    const model = location.jobLocation?.workingModel?.trim().toUpperCase();
    return model === "REMOTE";
  });
}
