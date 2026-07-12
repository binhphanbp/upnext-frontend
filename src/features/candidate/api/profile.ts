import { apiRequest } from "@/shared/api/http";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export type CandidateProfileApi = Readonly<{
  id: string;
  candidateAccountId: string;
  phoneNumber: string | null;
  gender: "MALE" | "FEMALE" | null;
  address: string | null;
  birthdate: string | null;
  description: string | null;
  jobSearchStatus: "OPEN_TO_WORK" | "NOT_LOOKING";
  profileVisibility: "PUBLIC" | "PRIVATE";
  account: {
    id: string;
    fullName: string;
    email: string;
  };
  educations: CandidateEducationApi[];
  experiences: CandidateExperienceApi[];
  projects: CandidateProjectApi[];
  certifications: CandidateCertificationApi[];
  skills: CandidateSkillApi[];
  languages: CandidateLanguageApi[];
  links: CandidateLinkApi[];
  jobPreference: CandidateJobPreferenceApi | null;
}>;

export type CandidateEducationApi = Readonly<{
  id: string;
  schoolName: string;
  degree: string | null;
  major: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  gpa: string | number | null;
  description: string | null;
  sortOrder: number;
}>;

export type CandidateExperienceApi = Readonly<{
  id: string;
  companyName: string;
  positionTitle: string;
  employmentType: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  technologies: string | null;
  sortOrder: number;
}>;

export type CandidateProjectApi = Readonly<{
  id: string;
  name: string;
  role: string | null;
  description: string | null;
  projectUrl: string | null;
  technologies: string | null;
  deployUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
}>;

export type CandidateCertificationApi = Readonly<{
  id: string;
  name: string;
  organization: string | null;
  issuedDate: string | null;
  expiredDate: string | null;
  credentialUrl: string | null;
  sortOrder: number;
}>;

export type CandidateLanguageApi = Readonly<{
  id: string;
  language: string;
  proficiency: string;
}>;

export type CandidateLinkApi = Readonly<{
  id: string;
  type: string;
  url: string;
}>;

export type CandidateSkillApi = Readonly<{
  id: string;
  skillId: string;
  proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  yearsOfExperience: string | number | null;
  sortOrder: number;
  skill: {
    id: string;
    name: string;
  };
}>;

export type CandidateJobPreferenceApi = Readonly<{
  id: string;
  desiredPosition: string | null;
  desiredSalaryMin: string | number | null;
  desiredSalaryMax: string | number | null;
  salaryCurrency: string;
  workingModel: "ONSITE" | "REMOTE" | "HYBRID" | null;
  desiredLevelId: string | null;
  desiredLevel?: {
    id: string;
    name: string;
  } | null;
  noticePeriodDays: number | null;
  isRelocate: boolean;
}>;

export type UpdateCandidateProfilePayload = Readonly<
  Partial<{
    phoneNumber: string;
    gender: "MALE" | "FEMALE";
    address: string;
    birthdate: string;
    description: string;
    jobSearchStatus: "OPEN_TO_WORK" | "NOT_LOOKING";
    profileVisibility: "PUBLIC" | "PRIVATE";
  }>
>;

export type CreateCandidateExperiencePayload = Readonly<{
  companyName: string;
  positionTitle: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  technologies?: string;
  sortOrder?: number;
}>;

export type UpdateCandidateExperiencePayload = Readonly<Partial<CreateCandidateExperiencePayload>>;

export type CreateCandidateEducationPayload = Readonly<{
  schoolName: string;
  degree?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  gpa?: number;
  description?: string;
  sortOrder?: number;
}>;

export type UpdateCandidateEducationPayload = Readonly<Partial<CreateCandidateEducationPayload>>;

export type CreateCandidateSkillPayload = Readonly<{
  skillId: string;
  proficiencyLevel?: CandidateSkillApi["proficiencyLevel"];
  yearsOfExperience?: number;
  sortOrder?: number;
}>;

export type UpdateCandidateSkillPayload = Readonly<Partial<CreateCandidateSkillPayload>>;

export type CreateCandidateProjectPayload = Readonly<{
  name: string;
  role?: string;
  description?: string;
  projectUrl?: string;
  technologies?: string;
  deployUrl?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
}>;

export type UpdateCandidateProjectPayload = Readonly<Partial<CreateCandidateProjectPayload>>;

export type CreateCandidateCertificationPayload = Readonly<{
  name: string;
  organization?: string;
  issuedDate?: string;
  expiredDate?: string;
  credentialUrl?: string;
  sortOrder?: number;
}>;

export type UpdateCandidateCertificationPayload = Readonly<
  Partial<CreateCandidateCertificationPayload>
>;

export type CreateCandidateLanguagePayload = Readonly<{
  language: string;
  proficiency: string;
}>;

export type UpdateCandidateLanguagePayload = Readonly<Partial<CreateCandidateLanguagePayload>>;

export type CreateCandidateLinkPayload = Readonly<{
  type: string;
  url: string;
}>;

export type UpdateCandidateLinkPayload = Readonly<Partial<CreateCandidateLinkPayload>>;

export type UpdateCandidateJobPreferencePayload = Readonly<
  Partial<{
    desiredPosition: string;
    desiredSalaryMin: number | undefined;
    desiredSalaryMax: number | undefined;
    salaryCurrency: string;
    workingModel: "ONSITE" | "REMOTE" | "HYBRID";
    desiredLevelId: string;
    noticePeriodDays: number;
    isRelocate: boolean;
  }>
>;

export type SkillOptionApi = Readonly<{
  id: string;
  name: string;
}>;

export type CandidateCvApi = Readonly<{
  id: string;
  title: string;
  source: string;
  status: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    sourceFileId: string | null;
    createdAt: string;
    sourceFile: {
      id: string;
      originalName: string;
      mimeType: string;
      publicUrl: string | null;
    } | null;
  }>;
}>;

export type CandidateApplicationStatus =
  | "SUBMITTED"
  | "VIEWED"
  | "SHORTLISTED"
  | "INTERVIEWING"
  | "OFFERED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export type CandidateActivityJobPostApi = Readonly<{
  id: string;
  slug: string;
  title: string;
  description: string;
  salaryMin: number | string | null;
  salaryMax: number | string | null;
  salaryCurrency: string;
  salaryIsNegotiable: boolean;
  salaryIsVisible: boolean;
  status: string;
  publishedAt: string | null;
  expiredAt: string | null;
  company: Readonly<{
    id: string;
    name: string;
    logoUrl?: string | null;
    logoFile?: Readonly<{ publicUrl: string }> | null;
    verificationStatus?: string;
  }>;
  experienceLevel?: Readonly<{ id: string; name: string }> | null;
  employmentType?: Readonly<{ id: string; name: string }> | null;
  jobCategory?: Readonly<{ id: string; name: string }> | null;
}>;

export type CandidateApplicationApi = Readonly<{
  id: string;
  jobPostId: string;
  candidateProfileId: string;
  cvVersionId: string;
  coverLetter: string | null;
  status: CandidateApplicationStatus;
  submittedAt: string;
  viewedAt: string | null;
  rejectedAt: string | null;
  hiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  jobPost: CandidateActivityJobPostApi;
  cvVersion: Readonly<{
    id: string;
    cvId: string;
    versionNumber: number;
    sourceFileId: string | null;
    createdAt: string;
  }>;
}>;

export type CandidateApplicationMutationApi = Pick<
  CandidateApplicationApi,
  "id" | "status" | "updatedAt"
>;

export type SavedJobApi = Readonly<{
  id: string;
  candidateProfileId: string;
  jobPostId: string;
  createdAt: string;
  jobPost: CandidateActivityJobPostApi;
}>;

export type SavedJobMutationApi = Omit<SavedJobApi, "jobPost">;

export type PaginatedResponse<TItem> = Readonly<{
  items: TItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

export function getMyCandidateProfile(token: string) {
  return apiRequest<CandidateProfileApi>("/candidate-profiles/me", {
    headers: authHeaders(token),
  });
}

export function updateMyCandidateProfile(token: string, payload: UpdateCandidateProfilePayload) {
  return apiRequest<CandidateProfileApi>("/candidate-profiles/me", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function createCandidateEducation(token: string, payload: CreateCandidateEducationPayload) {
  return apiRequest<CandidateEducationApi>("/candidate-profiles/me/educations", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCandidateEducation(
  token: string,
  educationId: string,
  payload: UpdateCandidateEducationPayload,
) {
  return apiRequest<CandidateEducationApi>(`/candidate-profiles/me/educations/${educationId}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function deleteCandidateEducation(token: string, educationId: string) {
  return apiRequest<void>(`/candidate-profiles/me/educations/${educationId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function createCandidateExperience(
  token: string,
  payload: CreateCandidateExperiencePayload,
) {
  return apiRequest<CandidateExperienceApi>("/candidate-profiles/me/experiences", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCandidateExperience(
  token: string,
  experienceId: string,
  payload: UpdateCandidateExperiencePayload,
) {
  return apiRequest<CandidateExperienceApi>(`/candidate-profiles/me/experiences/${experienceId}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function deleteCandidateExperience(token: string, experienceId: string) {
  return apiRequest<void>(`/candidate-profiles/me/experiences/${experienceId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function createCandidateSkill(token: string, payload: CreateCandidateSkillPayload) {
  return apiRequest<CandidateSkillApi>("/candidate-profiles/me/skills", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCandidateSkill(
  token: string,
  candidateSkillId: string,
  payload: UpdateCandidateSkillPayload,
) {
  return apiRequest<CandidateSkillApi>(`/candidate-profiles/me/skills/${candidateSkillId}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function deleteCandidateSkill(token: string, candidateSkillId: string) {
  return apiRequest<void>(`/candidate-profiles/me/skills/${candidateSkillId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function createCandidateProject(token: string, payload: CreateCandidateProjectPayload) {
  return apiRequest<CandidateProjectApi>("/candidate-profiles/me/projects", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCandidateProject(
  token: string,
  projectId: string,
  payload: UpdateCandidateProjectPayload,
) {
  return apiRequest<CandidateProjectApi>(`/candidate-profiles/me/projects/${projectId}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function deleteCandidateProject(token: string, projectId: string) {
  return apiRequest<void>(`/candidate-profiles/me/projects/${projectId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function createCandidateCertification(
  token: string,
  payload: CreateCandidateCertificationPayload,
) {
  return apiRequest<CandidateCertificationApi>("/candidate-profiles/me/certifications", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCandidateCertification(
  token: string,
  certificationId: string,
  payload: UpdateCandidateCertificationPayload,
) {
  return apiRequest<CandidateCertificationApi>(
    `/candidate-profiles/me/certifications/${certificationId}`,
    {
      body: JSON.stringify(payload),
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
      method: "PATCH",
    },
  );
}

export function deleteCandidateCertification(token: string, certificationId: string) {
  return apiRequest<void>(`/candidate-profiles/me/certifications/${certificationId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function createCandidateLanguage(token: string, payload: CreateCandidateLanguagePayload) {
  return apiRequest<CandidateLanguageApi>("/candidate-profiles/me/languages", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCandidateLanguage(
  token: string,
  languageId: string,
  payload: UpdateCandidateLanguagePayload,
) {
  return apiRequest<CandidateLanguageApi>(`/candidate-profiles/me/languages/${languageId}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function deleteCandidateLanguage(token: string, languageId: string) {
  return apiRequest<void>(`/candidate-profiles/me/languages/${languageId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function createCandidateLink(token: string, payload: CreateCandidateLinkPayload) {
  return apiRequest<CandidateLinkApi>("/candidate-profiles/me/links", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCandidateLink(
  token: string,
  linkId: string,
  payload: UpdateCandidateLinkPayload,
) {
  return apiRequest<CandidateLinkApi>(`/candidate-profiles/me/links/${linkId}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function deleteCandidateLink(token: string, linkId: string) {
  return apiRequest<void>(`/candidate-profiles/me/links/${linkId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function updateCandidateJobPreference(
  token: string,
  payload: UpdateCandidateJobPreferencePayload,
) {
  return apiRequest<CandidateJobPreferenceApi>("/candidate-profiles/me/job-preference", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function searchSkills(query: string) {
  const params = new URLSearchParams({ q: query });

  return apiRequest<SkillOptionApi[]>(`/skills/search?${params.toString()}`);
}

export function createSkillOption(name: string) {
  return apiRequest<SkillOptionApi>("/skills", {
    body: JSON.stringify({ name }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function getMyCandidateCvs(
  token: string,
  candidateAccountId: string,
  page = 1,
  limit = 100,
) {
  const params = new URLSearchParams({
    candidateAccountId,
    limit: String(limit),
    page: String(page),
  });

  return apiRequest<PaginatedResponse<CandidateCvApi>>(`/cvs/me?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export function getMyCandidateApplications(token: string) {
  return apiRequest<CandidateApplicationApi[]>("/applications/me", {
    headers: authHeaders(token),
  });
}

export function getCandidateApplication(token: string, applicationId: string) {
  return apiRequest<CandidateApplicationApi>(`/applications/${applicationId}`, {
    headers: authHeaders(token),
  });
}

export function withdrawCandidateApplication(token: string, applicationId: string) {
  return apiRequest<CandidateApplicationMutationApi>(`/applications/${applicationId}/withdraw`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function getMySavedJobs(token: string) {
  return apiRequest<SavedJobApi[]>("/saved-jobs", {
    headers: authHeaders(token),
  });
}

export function saveCandidateJob(token: string, jobPostId: string) {
  return apiRequest<SavedJobMutationApi>("/saved-jobs", {
    body: JSON.stringify({ jobPostId }),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function unsaveCandidateJob(token: string, jobPostId: string) {
  return apiRequest<void>(`/saved-jobs/${jobPostId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function setCandidateCvDefault(token: string, cvId: string) {
  return apiRequest<CandidateCvApi>(`/cvs/${cvId}/default`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function deleteCandidateCv(token: string, cvId: string) {
  return apiRequest<void>(`/cvs/${cvId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function uploadCandidateCvFile(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", "CV");
  formData.append("visibility", "PRIVATE");

  return apiRequest<{
    file: {
      id: string;
      originalName: string;
      mimeType: string;
      publicUrl: string;
      sizeBytes: string;
    };
  }>("/files/upload", {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function createCandidateCv(
  token: string,
  candidateAccountId: string,
  payload: {
    title: string;
    source: "UPLOAD" | "BUILDER";
    isDefault?: boolean;
    sourceFileId?: string;
  },
) {
  const params = new URLSearchParams({ candidateAccountId });
  return apiRequest<CandidateCvApi>(`/cvs?${params.toString()}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function submitApplication(
  token: string,
  payload: {
    jobPostId: string;
    candidateAccountId: string;
    cvId?: string | null;
    coverLetter?: string | null;
  },
) {
  return apiRequest<any>("/applications", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
