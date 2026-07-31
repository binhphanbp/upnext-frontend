import { apiRequest } from "@/shared/api/http";

export interface PublicJob {
  id: string;
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

  return jobs.map<PublicJob>((job) => ({
    ...job,
    salaryMin: normalizeNullableNumber(job.salaryMin),
    salaryMax: normalizeNullableNumber(job.salaryMax),
  }));
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
