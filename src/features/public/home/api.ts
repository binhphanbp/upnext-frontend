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

export function getPublicJobs() {
  return apiRequest<PublicJob[]>("/job-posts");
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

export interface HomeApiResponseData {
  stats: {
    jobsCount: number;
    companiesCount: number;
    candidatesCount: number;
  };
  marketInsight: {
    summary: {
      month: number;
      year: number;
      newJobsCount: number;
      activeJobsCount: number;
      hiringCompaniesCount: number;
    };
    jobGrowthLineChart: {
      from: string;
      to: string;
      minValue: number;
      maxValue: number;
      growthPercent: number;
      points: Array<{ date: string; jobsCount: number }>;
    };
    salaryDemandBarChart: Array<{
      salaryRange: string;
      jobsCount: number;
    }>;
    latestJobs: Array<{
      id: string;
      title: string;
      slug: string;
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
    }>;
  };
  topCompanies: Array<{
    id: string;
    name: string;
    logo?: string;
    coverImage?: string;
    companyType: string;
    shortDescription: string;
    activeJobsCount: number;
    applicationsCount: number;
  }>;
  companyLogos: Array<{
    slug: string;
    name: string;
    logo: string;
  }>;
}

export interface HomeApiResponse {
  success: boolean;
  data: HomeApiResponseData;
}

export function getHomeData() {
  return apiRequest<HomeApiResponse>("/home");
}
