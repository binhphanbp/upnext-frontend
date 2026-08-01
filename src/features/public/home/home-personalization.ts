import type { CandidateProfileApi } from "@/features/candidate/api/profile";

import type { PublicJob } from "./api";
import {
  getPublishedTime,
  hasRemoteWorkingModel,
  isPublicJobAvailable,
} from "./home-section-selectors";

export type HomeCandidateContext = Readonly<{
  profile: CandidateProfileApi | null;
  savedJobIds: ReadonlySet<string>;
  followedCompanyIds: ReadonlySet<string>;
  appliedJobIds: ReadonlySet<string>;
}>;

export type RecommendationReasonCode =
  | "skill"
  | "position"
  | "workingModel"
  | "level"
  | "salary"
  | "followedCompany";

export type RecommendedJob = Readonly<{
  job: PublicJob;
  score: number;
  reasonCodes: readonly RecommendationReasonCode[];
}>;

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const MIN_RECOMMENDATION_SCORE = 40;

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("vi")
    .trim();
}

function toFiniteNumber(value: string | number | null | undefined) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function isWithinSevenDays(value: string | null | undefined, now: number) {
  if (!value) return false;
  const publishedAt = new Date(value).getTime();
  return (
    Number.isFinite(publishedAt) &&
    publishedAt <= now &&
    now - publishedAt <= 7 * DAY_IN_MILLISECONDS
  );
}

export function countCandidateSignals(context: HomeCandidateContext) {
  const preference = context.profile?.jobPreference;
  const signalGroups = [
    Boolean(context.profile?.skills.length),
    Boolean(preference?.desiredPosition?.trim()),
    Boolean(preference?.workingModel),
    Boolean(preference?.desiredLevelId),
    Boolean(preference?.desiredSalaryMin || preference?.desiredSalaryMax),
    context.savedJobIds.size >= 3,
    context.followedCompanyIds.size > 0,
  ];

  return signalGroups.filter(Boolean).length;
}

export function hasSufficientCandidateSignals(context: HomeCandidateContext) {
  return Boolean(context.profile) && countCandidateSignals(context) >= 2;
}

function getJobText(job: PublicJob) {
  return normalize(
    [
      job.title,
      job.jobCategory?.name,
      ...(job.jobPostSpecializations ?? []).map((item) => item.specialization.name),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getJobSkillNames(job: PublicJob) {
  return new Set(
    (job.jobPostSkills ?? []).map((item) => normalize(item.skill.name)).filter(Boolean),
  );
}

function getWorkingModel(job: PublicJob) {
  return (job.jobPostLocations ?? [])
    .map((item) => item.jobLocation?.workingModel?.toUpperCase())
    .filter(Boolean);
}

function getReasonedMatch(job: PublicJob, context: HomeCandidateContext) {
  const preference = context.profile?.jobPreference;
  const reasons: RecommendationReasonCode[] = [];
  let score = 0;

  const candidateSkills = new Set(
    (context.profile?.skills ?? []).map((item) => normalize(item.skill.name)).filter(Boolean),
  );
  const matchingSkills = [...getJobSkillNames(job)].filter((skill) => candidateSkills.has(skill));
  if (matchingSkills.length > 0) {
    score += Math.min(
      40,
      Math.round((matchingSkills.length / Math.max(1, candidateSkills.size)) * 40),
    );
    reasons.push("skill");
  }

  const desiredPosition = normalize(preference?.desiredPosition);
  if (desiredPosition && getJobText(job).includes(desiredPosition)) {
    score += 25;
    reasons.push("position");
  }

  if (preference?.workingModel) {
    const model = preference.workingModel.toUpperCase();
    const matches =
      model === "REMOTE" ? hasRemoteWorkingModel(job) : getWorkingModel(job).includes(model);
    if (matches) {
      score += 10;
      reasons.push("workingModel");
    }
  }

  const desiredLevel = normalize(preference?.desiredLevel?.name);
  if (desiredLevel && normalize(job.experienceLevel?.name).includes(desiredLevel)) {
    score += 10;
    reasons.push("level");
  }

  const desiredMin = toFiniteNumber(preference?.desiredSalaryMin);
  const desiredMax = toFiniteNumber(preference?.desiredSalaryMax);
  const jobMin = toFiniteNumber(job.salaryMin);
  const jobMax = toFiniteNumber(job.salaryMax);
  const salaryOverlaps =
    (desiredMin === null || jobMax === null || jobMax >= desiredMin) &&
    (desiredMax === null || jobMin === null || jobMin <= desiredMax) &&
    Boolean(desiredMin !== null || desiredMax !== null);
  if (salaryOverlaps) {
    score += 10;
    reasons.push("salary");
  }

  if (job.company?.id && context.followedCompanyIds.has(job.company.id)) {
    score += 5;
    reasons.push("followedCompany");
  }

  return { score, reasonCodes: reasons };
}

export function selectRecommendedJobs(
  jobs: readonly PublicJob[] | undefined,
  {
    context,
    now = Date.now(),
    limit = 12,
    excludedIds,
  }: {
    context: HomeCandidateContext;
    now?: number;
    limit?: number;
    excludedIds?: ReadonlySet<string>;
  },
): RecommendedJob[] {
  if (!jobs?.length || !hasSufficientCandidateSignals(context)) return [];

  return jobs
    .filter(
      (job) =>
        isPublicJobAvailable(job, now) &&
        !excludedIds?.has(job.id) &&
        !context.appliedJobIds.has(job.id),
    )
    .map((job) => {
      const match = getReasonedMatch(job, context);
      return { job, ...match };
    })
    .filter((item) => item.score >= MIN_RECOMMENDATION_SCORE && item.reasonCodes.length > 0)
    .toSorted((left, right) => {
      const scoreDelta = right.score - left.score;
      return scoreDelta !== 0
        ? scoreDelta
        : getPublishedTime(right.job) - getPublishedTime(left.job);
    })
    .slice(0, limit);
}

export function selectFollowedCompanyFreshJobs(
  jobs: readonly PublicJob[] | undefined,
  context: HomeCandidateContext,
  now = Date.now(),
) {
  if (!jobs?.length || context.followedCompanyIds.size === 0) return [];

  return jobs
    .filter(
      (job) =>
        isPublicJobAvailable(job, now) &&
        !context.appliedJobIds.has(job.id) &&
        Boolean(job.company?.id && context.followedCompanyIds.has(job.company.id)) &&
        isWithinSevenDays(job.publishedAt ?? job.createdAt, now),
    )
    .toSorted((left, right) => getPublishedTime(right) - getPublishedTime(left));
}
