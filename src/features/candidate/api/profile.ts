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

export type CandidateApplicationApi = Readonly<{
  id: string;
  status: string;
  submittedAt: string;
}>;

export type SavedJobApi = Readonly<{
  id: string;
  createdAt: string;
}>;

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

export function updateMyCandidateProfile(
  token: string,
  payload: Partial<{
    phoneNumber: string;
    address: string;
    description: string;
    jobSearchStatus: "OPEN_TO_WORK" | "NOT_LOOKING";
    profileVisibility: "PUBLIC" | "PRIVATE";
  }>,
) {
  return apiRequest<CandidateProfileApi>("/candidate-profiles/me", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function createCandidateEducation(
  token: string,
  payload: {
    schoolName: string;
    degree?: string;
    major?: string;
    description?: string;
  },
) {
  return apiRequest<CandidateEducationApi>("/candidate-profiles/me/educations", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function createCandidateExperience(
  token: string,
  payload: {
    companyName: string;
    positionTitle: string;
    employmentType?: string;
    description?: string;
    technologies?: string;
    isCurrent?: boolean;
  },
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

export function createCandidateSkill(
  token: string,
  payload: {
    skillId: string;
    proficiencyLevel?: CandidateSkillApi["proficiencyLevel"];
    yearsOfExperience?: number;
  },
) {
  return apiRequest<CandidateSkillApi>("/candidate-profiles/me/skills", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCandidateJobPreference(
  token: string,
  payload: Partial<{
    desiredPosition: string;
    desiredSalaryMin: number | undefined;
    desiredSalaryMax: number | undefined;
    salaryCurrency: string;
    workingModel: "ONSITE" | "REMOTE" | "HYBRID";
    noticePeriodDays: number;
    isRelocate: boolean;
  }>,
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

export function getMyCandidateCvs(candidateAccountId: string) {
  const params = new URLSearchParams({
    candidateAccountId,
    limit: "20",
    page: "1",
  });

  return apiRequest<PaginatedResponse<CandidateCvApi>>(`/cvs/me?${params.toString()}`);
}

export function getMyCandidateApplications(candidateAccountId: string) {
  const params = new URLSearchParams({ candidateAccountId });

  return apiRequest<CandidateApplicationApi[]>(`/applications/me?${params.toString()}`);
}

export function getMySavedJobs(candidateAccountId: string) {
  const params = new URLSearchParams({ candidateAccountId });

  return apiRequest<SavedJobApi[]>(`/saved-jobs?${params.toString()}`);
}
