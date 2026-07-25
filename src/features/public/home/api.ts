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
}

export interface PublicCompany {
  id: string;
  name: string;
  slug?: string;
  type: string;
  logoUrl?: string | null;
  logoFile?: {
    publicUrl: string;
  } | null;
  website?: string | null;
  address?: string | null;
  description?: string | null;
}

export interface PublicCompanyDetail extends PublicCompany {
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

export function getPublicCompanies() {
  return apiRequest<PublicCompanyListResponse>("/companies");
}

export function getPublicCompanyDetail(slug: string) {
  return apiRequest<PublicCompanyDetail>(`/companies/${slug}`);
}
