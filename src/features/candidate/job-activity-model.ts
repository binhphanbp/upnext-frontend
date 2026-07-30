import type {
  CandidateActivityJobPostApi,
  CandidateApplicationApi,
  CandidateApplicationStatus,
} from "@/features/candidate/api/profile";
import type { PublicJob } from "@/features/public/home/api";

export type ApplicationStatusGroup = "active" | "all" | "closed" | "interview" | "offer";

const activeStatuses = new Set<CandidateApplicationStatus>(["SUBMITTED", "VIEWED", "SHORTLISTED"]);
const offerStatuses = new Set<CandidateApplicationStatus>(["OFFERED", "HIRED"]);
const withdrawableStatuses = new Set<CandidateApplicationStatus>([
  "SUBMITTED",
  "VIEWED",
  "SHORTLISTED",
  "INTERVIEWING",
  "OFFERED",
]);

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

function toFiniteNumber(value: number | string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
