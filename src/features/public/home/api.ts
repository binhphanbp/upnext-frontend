import type { Post } from "@/features/posts/types/post";
import { ApiError, apiRequest } from "@/shared/api/http";

export interface PublicJob {
  id: string;
  /** Public visibility fields are supplied by the API after the homepage contract update. */
  status?: string | null;
  moderationStatus?: string | null;
  isHidden?: boolean | null;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryIsNegotiable: boolean;
  salaryIsVisible: boolean;
  vacanciesCount?: number | null;
  /** Public aggregate supplied by the API; never derive or fabricate it in the client. */
  viewCount?: number | null;
  publishedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    verificationStatus?: string | null;
    logoUrl?: string | null;
    logoFile?: {
      publicUrl: string;
    } | null;
  } | null;
  jobCategory?: { name: string } | null;
  employmentType?: { name: string } | null;
  experienceLevel?: { name: string } | null;
  jobPostLocations?: Array<{
    jobLocation: {
      city: string;
      workingModel?: string | null;
      address?: string | null;
    };
  }>;
  jobPostSkills?: Array<{
    minYearsExperience?: number | null;
    skill: {
      id: string;
      name: string;
    };
  }>;
  jobPostSpecializations?: Array<{
    specialization: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

type PublicJobWire = Omit<PublicJob, "salaryMin" | "salaryMax"> & {
  salaryMin: number | string | null;
  salaryMax: number | string | null;
};

export interface PublicCompany {
  id: string;
  name: string;
  slug?: string;
  type: string;
  activeJobsCount: number;
  logoUrl?: string | null;
  logoFile?: {
    publicUrl: string;
  } | null;
  coverFile?: {
    publicUrl: string;
  } | null;
  website?: string | null;
  address?: string | null;
  description?: string | null;
  /** Headcount band as free text, e.g. "201-500" or "10000+". */
  companySize?: string | null;
  /** The API sends this as a numeric string, so parse before comparing. */
  reputationScore?: number | string | null;
  verificationStatus?: string | null;
}

export interface PublicCompanyDetail extends Omit<PublicCompany, "activeJobsCount"> {
  slug: string;
  coverFile?: {
    publicUrl: string;
  } | null;
}

export interface PublicCompanyListResponse {
  items: PublicCompany[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type HomeJobCard = {
  id: string;
  title: string;
  slug?: string;
  skills: Array<{ id: string; name: string }>;
  location: string;
  workMode: string;
  employmentType: string;
  experience: string;
  salary: {
    min?: number;
    max?: number;
    currency?: string;
    label: string;
  };
  company: {
    id: string;
    name: string;
    logo?: string;
    avatar?: string;
  };
  deadline: string | null;
  /** Aggregate public views supplied by the home API; never calculate this in the browser. */
  viewCount?: number | null;
  publishedAt?: string | null;
  daysRemaining?: number | null;
  urgencyTone?: "URGENT" | "WARNING" | "NORMAL" | null;
  badges?: Array<"NEW" | "REMOTE">;
  createdAt: string;
};

export type HomeJobSection = {
  items: HomeJobCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type HomeTopCompany = {
  id: string;
  name: string;
  logo?: string;
  coverImage?: string;
  companyType: string;
  shortDescription: string;
  activeJobsCount: number;
  applicationsCount: number;
  latestPublishedAt?: string | null;
};

export type HomeMarketLatestJob = {
  id: string;
  title: string;
  slug?: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    avatar?: string;
  };
  location: string;
  workMode: string;
  employmentType: string;
  positionName?: string;
  createdAt: string;
  postedAtText?: string;
  publishedAt?: string | null;
};

export type HomeMarketInsight = {
  summary: {
    month: number;
    year: number;
    newJobsCount: number;
    activeJobsCount: number;
    hiringCompaniesCount: number;
    openJobsCount: number;
    activeEmployersCount: number;
    newJobs7dCount: number;
    newJobs24hCount: number;
  };
  jobGrowthLineChart: {
    from: string;
    to: string;
    minValue: number;
    maxValue: number;
    growthPercent: number;
    points: Array<{ date: string; jobsCount: number }>;
  };
  salaryDemandBarChart: Array<{ salaryRange: string; jobsCount: number }>;
  latestJobs: HomeMarketLatestJob[];
};

export type HomePersonalizationState = "GUEST" | "INSUFFICIENT" | "ELIGIBLE" | "NOT_LOOKING";

export type HomeAction = {
  type:
    | "APPLICATION_UPDATED"
    | "SAVED_JOB_EXPIRING"
    | "FOLLOWED_COMPANY_NEW_JOB"
    | "MISSING_CV"
    | "MISSING_PREFERENCES";
  jobId?: string;
  applicationId?: string;
  companyId?: string;
  status?: string;
  expiresAt?: string | null;
};

export type HomeRecommendationReasonCode =
  | "SKILL_MATCH"
  | "POSITION_MATCH"
  | "WORKING_MODEL_MATCH"
  | "LEVEL_MATCH"
  | "SALARY_OVERLAP"
  | "FOLLOWED_COMPANY";

export type HomePostCard = {
  id: string;
  title: string;
  slug: string;
  type: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  metaDescription?: string;
  category?: { id: string; name: string; slug: string };
  createdAt: string;
};

export type HomeCompanyLogo = {
  slug: string;
  name: string;
  logo: string;
};

export type HomeData = {
  stats: {
    jobsCount: number;
    companiesCount: number;
    candidatesCount: number;
    openJobsCount: number;
    activeEmployersCount: number;
    newJobs7dCount: number;
  };
  jobsSection: {
    all: HomeJobSection;
    remote: HomeJobSection;
    partTime: HomeJobSection;
    latest: HomeJobSection;
    /** Optional while older API deployments are still serving the prior contract. */
    popular?: HomeJobSection;
    expiring: HomeJobSection;
  };
  topCompanies: HomeTopCompany[];
  marketInsight: HomeMarketInsight;
  companyLogos: HomeCompanyLogo[];
  latestPosts: HomePostCard[];
  personalization?: {
    state: HomePersonalizationState;
    signalGroups: string[];
    missingSignals: string[];
  };
  actions?: HomeAction[];
  recommendations?: {
    title: "RECOMMENDED" | "LATEST";
    items: Array<{
      job: HomeJobCard;
      score: number;
      reasonCodes: string[];
      matchedSkills: string[];
    }>;
  };
};

type HomeApiResponse = HomeData | { success: true; data: HomeData };

function normalizeNullableNumber(value: number | string | null) {
  if (value === null || (typeof value === "string" && value.trim() === "")) return null;

  const normalized = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

export async function getPublicJobs() {
  return getPublicJobsWithFilters({});
}

export async function getPublicJobsWithFilters(options: { keyword?: string; location?: string }) {
  const params = new URLSearchParams();
  if (options.keyword?.trim()) params.set("keyword", options.keyword.trim());
  if (options.location?.trim()) params.set("location", options.location.trim());
  const query = params.size ? `?${params.toString()}` : "";
  const jobs = await apiRequest<PublicJobWire[]>(`/job-posts${query}`);

  return jobs.map(normalizePublicJob);
}

/** Fetches the full public record on demand, for example from a job quick preview. */
export async function getPublicJobDetail(id: string) {
  const job = await apiRequest<PublicJobWire>(`/job-posts/${encodeURIComponent(id)}`);
  return normalizePublicJob(job);
}

/**
 * Records a job-detail view for the public popularity feed. The visitor key is
 * an opaque, browser-generated identifier; it is not account data and lets the
 * API collapse refreshes into one view during its deduplication window.
 */
export async function recordPublicJobView(id: string, visitorKey?: string) {
  await apiRequest<void>(`/job-posts/${encodeURIComponent(id)}/views`, {
    method: "POST",
    ...(visitorKey ? { headers: { "x-upnext-visitor-key": visitorKey } } : {}),
  });
}

function normalizePublicJob(job: PublicJobWire): PublicJob {
  return {
    ...job,
    salaryMin: normalizeNullableNumber(job.salaryMin),
    salaryMax: normalizeNullableNumber(job.salaryMax),
  };
}

export function getPublicCompanies({ page, limit }: { page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (page) search.set("page", String(page));
  if (limit) search.set("limit", String(limit));

  const query = search.size ? `?${search.toString()}` : "";
  return apiRequest<PublicCompanyListResponse>(`/companies${query}`);
}

export async function getAllActivePublicCompanies() {
  const limit = 100;
  const firstPage = await apiRequest<PublicCompanyListResponse>(
    `/companies?status=ACTIVE&page=1&limit=${limit}`,
  );

  if (firstPage.meta.totalPages <= 1) {
    return firstPage;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
      apiRequest<PublicCompanyListResponse>(
        `/companies?status=ACTIVE&page=${index + 2}&limit=${limit}`,
      ),
    ),
  );

  return {
    items: [firstPage, ...remainingPages].flatMap((page) => page.items),
    meta: firstPage.meta,
  };
}

export function getPublicCompanyDetail(slug: string) {
  return apiRequest<PublicCompanyDetail>(`/companies/${slug}`);
}

export async function getHomeData(accessToken?: string) {
  const params = new URLSearchParams({
    jobPage: "1",
    jobLimit: "12",
    // The aggregate contract allows at most 20 companies. Request the full curated window so the
    // homepage carousel has meaningful pages while the directory CTA remains the path to all
    // active employers.
    topCompaniesLimit: "30",
    latestJobsLimit: "3",
  });
  const requestHome = (path: "home" | "home/candidate", token?: string) =>
    // The aggregate controller is mounted at `/api/home`, while the rest of the public API uses
    // `/api/v1`. Resolving one segment above the configured v1 base keeps both absolute staging
    // URLs and the local `/api/v1` proxy configuration correct.
    apiRequest<HomeApiResponse>(`../${path}?${params.toString()}`, {
      ...(token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {}),
    });

  let response: HomeApiResponse;
  let candidateFallbackStatus: number | null = null;
  try {
    response = await requestHome(accessToken ? "home/candidate" : "home", accessToken);
  } catch (error) {
    // A stale session or an account whose candidate profile is still being created must not make
    // the entire public homepage unavailable. Keep server failures visible, but gracefully fall
    // back to the public contract for authentication/profile-specific failures.
    if (!accessToken || !(error instanceof ApiError) || ![401, 403, 404].includes(error.status)) {
      throw error;
    }
    candidateFallbackStatus = error.status;
    response = await requestHome("home");
  }

  const data = "data" in response ? response.data : response;
  if (candidateFallbackStatus === 404) {
    return {
      ...data,
      personalization: {
        state: "INSUFFICIENT" as const,
        signalGroups: [],
        missingSignals: ["PROFILE"],
      },
      actions: [{ type: "MISSING_PREFERENCES" as const }],
    };
  }

  return data;
}

/**
 * The home aggregate has a dedicated companyLogos collection for the hero trust strip.
 * Do not substitute topCompanies here: that collection is ranked for the company section and
 * may contain records without a logo.
 */
export function getHomeTrustCompanies(home: Pick<HomeData, "companyLogos">): HomeCompanyLogo[] {
  return home.companyLogos.filter(
    (company) => company.name.trim().length > 0 && /^https?:\/\//u.test(company.logo.trim()),
  );
}

export function mapHomeJobCard(job: HomeJobCard): PublicJob {
  const salaryMin = normalizeNullableNumber(job.salary.min ?? null);
  const salaryMax = normalizeNullableNumber(job.salary.max ?? null);
  const logo = job.company.logo ?? job.company.avatar ?? null;
  const salaryLabel = job.salary.label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase();
  const salaryIsNegotiable =
    salaryLabel.includes("thoa thuan") ||
    salaryLabel.includes("negotiable") ||
    (salaryMin === null && salaryMax === null);

  return {
    id: job.id,
    status: "PUBLISHED",
    moderationStatus: "APPROVED",
    isHidden: false,
    title: job.title,
    description: "",
    requirements: null,
    benefits: null,
    salaryMin,
    salaryMax,
    salaryCurrency: job.salary.currency ?? "VND",
    salaryIsNegotiable,
    salaryIsVisible: !salaryIsNegotiable && (salaryMin !== null || salaryMax !== null),
    publishedAt: job.publishedAt ?? job.createdAt,
    expiredAt: job.deadline,
    createdAt: job.createdAt,
    company: {
      id: job.company.id,
      name: job.company.name,
      logoUrl: logo,
      logoFile: logo ? { publicUrl: logo } : null,
    },
    employmentType: job.employmentType ? { name: job.employmentType } : null,
    experienceLevel: job.experience ? { name: job.experience } : null,
    jobPostLocations:
      job.location || job.workMode
        ? [
            {
              jobLocation: {
                city: getHomeJobCity(job.location, job.workMode),
                address: job.location,
                workingModel: job.workMode,
              },
            },
          ]
        : [],
    jobPostSkills: job.skills.map((skill) => ({ skill })),
    viewCount: normalizeNullableNumber(job.viewCount ?? null),
  };
}

export function mapHomeCompanies(home: HomeData): PublicCompanyListResponse {
  const activeCompanies = home.topCompanies.filter((company) => company.activeJobsCount > 0);
  const spotlightIndex = activeCompanies.findIndex((company) =>
    Boolean(company.logo && company.coverImage && company.shortDescription.trim()),
  );
  const orderedCompanies =
    spotlightIndex > 0
      ? [
          activeCompanies[spotlightIndex]!,
          ...activeCompanies.filter((_, index) => index !== spotlightIndex),
        ]
      : activeCompanies;
  const items = orderedCompanies.map<PublicCompany>((company) => ({
    id: company.id,
    name: company.name,
    // The company detail endpoint accepts UUID or slug. The home contract intentionally keeps the
    // payload compact and does not include a slug, so use the stable UUID as the route segment.
    slug: company.id,
    type: company.companyType,
    activeJobsCount: company.activeJobsCount,
    logoUrl: company.logo ?? null,
    logoFile: company.logo ? { publicUrl: company.logo } : null,
    coverFile: company.coverImage ? { publicUrl: company.coverImage } : null,
    description: company.shortDescription,
  }));

  return {
    items,
    meta: {
      total: home.stats.activeEmployersCount,
      page: 1,
      limit: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    },
  };
}

export function getHomeJobCity(location: string, workMode?: string) {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const countryPattern = /^(?:vi[eệ]t nam|vietnam)$/iu;

  if (parts.length > 0 && countryPattern.test(parts.at(-1)!)) {
    parts.pop();
  }

  const city = parts.at(-1);
  if (city) return city;
  return (workMode ?? "").toLocaleUpperCase() === "REMOTE" ? "Remote" : "";
}

export function mapHomePost(post: HomePostCard): Post {
  const emptyAsset = {
    id: post.id,
    purpose: "home",
    visibility: "PUBLIC",
    storageKey: "",
    originalName: "",
    mimeType: "image/*",
    sizeBytes: "0",
  };

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: "",
    status: "PUBLISHED",
    type: post.type === "NEWS" || post.type === "FAQ" ? post.type : "BLOG",
    category: post.category ?? null,
    metaDescription: post.metaDescription ?? null,
    createdAt: post.createdAt,
    updatedAt: post.createdAt,
    thumbnailFile: post.thumbnailUrl ? { ...emptyAsset, publicUrl: post.thumbnailUrl } : null,
    coverImageFile: post.coverImageUrl ? { ...emptyAsset, publicUrl: post.coverImageUrl } : null,
  };
}
