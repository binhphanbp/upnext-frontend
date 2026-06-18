import { apiRequest } from "@/shared/api/http";

export type RecruiterJobPostApiItem = {
  benefits: string | null;
  companyId: string;
  createdAt: string;
  createdByRecruiterId: string;
  deletedAt: string | null;
  description: string | null;
  employmentType?: {
    id: string;
    name: string;
  } | null;
  employmentTypeId: string | null;
  experienceLevel?: {
    code?: string | null;
    id: string;
    name: string;
  } | null;
  experienceLevelId: string | null;
  expiredAt: string | null;
  id: string;
  jobCategory?: {
    id: string;
    name: string;
  } | null;
  jobCategoryId: string | null;
  moderationNote: string | null;
  moderationStatus: string | null;
  publishedAt: string | null;
  reason: string | null;
  requirements: string | null;
  salaryCurrency: string | null;
  salaryIsNegotiable: boolean;
  salaryIsVisible: boolean;
  salaryMax: number | string | null;
  salaryMin: number | string | null;
  salaryPeriod: string | null;
  slug: string;
  status: string;
  title: string;
  updatedAt: string;
  vacanciesCount: number;
};

export type JobPostDetailApiItem = RecruiterJobPostApiItem & {
  company?: {
    address?: string | null;
    id: string;
    name: string;
  } | null;
  jobPostLocations?: Array<{
    id: string;
    jobLocation?: {
      address?: string | null;
      city?: string | null;
      country?: string | null;
      district?: string | null;
      id: string;
      workingModel?: string | null;
    } | null;
  }> | null;
  jobPostSkills?: Array<{
    id: string;
    skill?: {
      id: string;
      name: string;
    } | null;
  }> | null;
  jobPostSpecializations?: Array<{
    id: string;
    specialization?: {
      id: string;
      name: string;
    } | null;
  }> | null;
};

export type JobPostViewStatsResponse = {
  views: number;
};

export type JobCategoryApiItem = {
  id: string;
  name: string;
};

export type ExperienceLevelApiItem = {
  code?: string | null;
  id: string;
  name: string;
};

export type EmploymentTypeApiItem = {
  id: string;
  name: string;
};

export type CreateJobPostPayload = {
  benefits: string;
  companyId: string;
  description: string;
  employmentTypeId: string;
  experienceLevelId: string;
  jobCategoryId: string;
  recruiterId: string;
  requirements: string;
  salaryCurrency: "VND";
  salaryIsNegotiable: boolean;
  salaryIsVisible: boolean;
  salaryMax: number;
  salaryMin: number;
  salaryPeriod: "MONTH";
  title: string;
  vacanciesCount: number;
};

export function getRecruiterJobPosts(recruiterId: string) {
  const params = new URLSearchParams({
    recruiterId,
  });

  return apiRequest<RecruiterJobPostApiItem[]>(`/recruiter/job-posts?${params.toString()}`);
}

export function getJobCategories() {
  return apiRequest<JobCategoryApiItem[]>("/job-categories");
}

export function getExperienceLevels() {
  return apiRequest<ExperienceLevelApiItem[]>("/experience-levels");
}

export function getEmploymentTypes() {
  return apiRequest<EmploymentTypeApiItem[]>("/employment-types");
}

export function createJobPost(payload: CreateJobPostPayload) {
  return apiRequest<RecruiterJobPostApiItem>("/job-posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function getJobPostDetail(jobPostId: string) {
  return apiRequest<JobPostDetailApiItem>(`/job-posts/${jobPostId}`);
}

export function getJobPostApplications(jobPostId: string, recruiterId: string) {
  const params = new URLSearchParams({
    recruiterId,
  });

  return apiRequest<unknown>(`/job-posts/${jobPostId}/applications?${params.toString()}`);
}

export function getJobPostViewStats(jobPostId: string, recruiterId: string) {
  const params = new URLSearchParams({
    recruiterId,
  });

  return apiRequest<JobPostViewStatsResponse>(
    `/job-posts/${jobPostId}/views/stats?${params.toString()}`,
  );
}
