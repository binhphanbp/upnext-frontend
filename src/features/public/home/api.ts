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
}
