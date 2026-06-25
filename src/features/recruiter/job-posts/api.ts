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
  locations: JobLocationOption[];
  skills: JobOption[];
  specializations: JobOption[];
}>;

export async function getRecruiterJobPosts(token: string) {
  return apiRequest<RecruiterJobPost[]>("/recruiter/job-posts", {
    headers: authHeaders(token),
  });
}

export function createRecruiterJobPost(payload: CreateRecruiterJobPostPayload, token: string) {
  return apiRequest<RecruiterJobPost>("/job-posts", {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
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
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
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
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
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
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export async function getJobPostCatalogs(): Promise<JobPostCatalogs> {
  const [categories, employmentTypes, experienceLevels, locations, skills, specializations] =
    await Promise.all([
      apiRequest<JobOption[]>("/job-categories"),
      apiRequest<JobOption[]>("/employment-types"),
      apiRequest<JobOption[]>("/experience-levels"),
      apiRequest<JobLocationOption[]>("/job-locations"),
      apiRequest<JobOption[]>("/skills"),
      apiRequest<JobOption[]>("/specializations"),
    ]);

  return {
    categories,
    employmentTypes,
    experienceLevels,
    locations,
    skills,
    specializations,
  };
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function removeEmptyFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<T>;
}
