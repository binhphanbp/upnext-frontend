import { authHeaders, jsonAuthHeaders, removeEmptyFields } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type JobOption = Readonly<{
  id: string;
  name: string;
  code?: string;
}>;

export type JobLocationOption = Readonly<{
  id: string;
  city: string | null;
  district: string | null;
  address: string | null;
  workingModel: string;
}>;

export type RecruiterJobPost = Readonly<{
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salaryMin: string | number | null;
  salaryMax: string | number | null;
  salaryCurrency: string;
  salaryIsVisible: boolean;
  salaryIsNegotiable: boolean;
  vacanciesCount: number;
  status: JobStatus;
  moderationStatus: ModerationStatus;
  publishedAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    businessLicenseFileId: string | null;
  };
  jobCategory: JobOption | null;
  employmentType: JobOption | null;
  experienceLevel: JobOption | null;
  jobPostSkills: ReadonlyArray<{
    skill: JobOption;
  }>;
  jobPostLocations: ReadonlyArray<{
    jobLocation: JobLocationOption;
  }>;
  _count?: {
    applications: number;
    views: number;
  };
}>;

export type CreateRecruiterJobPostPayload = Readonly<{
  title: string;
  description: string;
  requirements?: string | undefined;
  benefits?: string | undefined;
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  salaryCurrency?: string | undefined;
  salaryIsNegotiable?: boolean | undefined;
  salaryIsVisible?: boolean | undefined;
  vacanciesCount?: number | undefined;
  jobCategoryId?: string | undefined;
  experienceLevelId?: string | undefined;
  employmentTypeId?: string | undefined;
}>;

export type JobPostCatalogs = Readonly<{
  categories: JobOption[];
  employmentTypes: JobOption[];
  experienceLevels: JobOption[];
  skills: JobOption[];
  specializations: JobOption[];
}>;

export async function getRecruiterJobPosts(token: string, recruiterId?: string) {
  const url = recruiterId
    ? `/recruiter/job-posts?recruiterId=${recruiterId}`
    : "/recruiter/job-posts";
  return apiRequest<RecruiterJobPost[]>(url, {
    headers: authHeaders(token),
  });
}

export function createRecruiterJobPost(payload: CreateRecruiterJobPostPayload, token: string) {
  return apiRequest<RecruiterJobPost>("/job-posts", {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function publishRecruiterJobPost(jobPostId: string, token: string) {
  return apiRequest<RecruiterJobPost>(`/job-posts/${jobPostId}/publish`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function closeRecruiterJobPost(jobPostId: string, token: string) {
  return apiRequest<RecruiterJobPost>(`/job-posts/${jobPostId}/close`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function addSkillToRecruiterJobPost(jobPostId: string, skillId: string, token: string) {
  return apiRequest(`/job-posts/${jobPostId}/skills`, {
    body: JSON.stringify({ skillId }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function addLocationToRecruiterJobPost(
  jobPostId: string,
  jobLocationId: string,
  token: string,
) {
  return apiRequest(`/job-posts/${jobPostId}/locations`, {
    body: JSON.stringify({ jobLocationId }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function addSpecializationToRecruiterJobPost(
  jobPostId: string,
  specializationId: string,
  token: string,
) {
  return apiRequest(`/job-posts/${jobPostId}/specializations`, {
    body: JSON.stringify({ specializationId, isRequired: true }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export async function getJobPostCatalogs(): Promise<JobPostCatalogs> {
  const [categories, employmentTypes, experienceLevels, skills, specializations] =
    await Promise.all([
      apiRequest<JobOption[]>("/job-categories"),
      apiRequest<JobOption[]>("/employment-types"),
      apiRequest<JobOption[]>("/experience-levels"),
      apiRequest<JobOption[]>("/skills"),
      apiRequest<JobOption[]>("/specializations"),
    ]);

  return {
    categories,
    employmentTypes,
    experienceLevels,
    skills,
    specializations,
  };
}
