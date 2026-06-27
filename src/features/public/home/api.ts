import { apiRequest } from "@/shared/api/http";

export type PublicJobPostApi = {
  id: string;
  title: string;
  description: string;
  publishedAt: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryIsVisible: boolean;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  } | null;
  employmentType?: {
    id: string;
    name: string;
  } | null;
  experienceLevel?: {
    id: string;
    name: string;
  } | null;
  jobCategory?: {
    id: string;
    name: string;
  } | null;
  jobPostLocations?: Array<{
    jobLocation?: {
      city: string;
    } | null;
  }>;
};

export function getPublicJobs() {
  return apiRequest<PublicJobPostApi[]>("/job-posts");
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
  publishedAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
  jobCategory?: { name: string } | null;
  employmentType?: { name: string } | null;
  experienceLevel?: { name: string } | null;
  jobPostLocations?: Array<{
    jobLocation: {
      city: string;
      address?: string | null;
    };
  }>;
}

export interface PublicCompany {
  id: string;
  name: string;
  type: string;
  logoUrl?: string | null;
  website?: string | null;
  address?: string | null;
  description?: string | null;
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
