import { authHeaders, jsonAuthHeaders, removeEmptyFields } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

/** Khớp enum JobStatus của backend; "ARCHIVED" là giá trị cũ vẫn còn dùng ở màn admin. */
export type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "EXPIRED" | "HIDDEN" | "ARCHIVED";
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SalaryPeriod = "HOUR" | "DAY" | "MONTH" | "YEAR";
export type JobPostOutputLanguage = "vi" | "en";
export type JobPostPresentationStyle = "traditional" | "skill_focused" | "value_focused";
export type JobPostWorkMode = "onsite" | "hybrid" | "remote";

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
  salaryPeriod: SalaryPeriod;
  salaryIsVisible: boolean;
  salaryIsNegotiable: boolean;
  vacanciesCount: number;
  status: JobStatus;
  moderationStatus: ModerationStatus;
  reason: string | null;
  moderationNote: string | null;
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
  educationLevel?: string;
  jobPostSkills: ReadonlyArray<{
    skill: JobOption;
  }>;
  jobPostLocations: ReadonlyArray<{
    jobLocation: JobLocationOption;
  }>;
  jobPostSpecializations: ReadonlyArray<{
    specialization: JobOption;
  }>;
  workingDays: string | null;
  expiredAt: string | null;
  createdByRecruiterId?: string | null;
  createdByRecruiter?: {
    id: string;
    email: string;
    profile: {
      id: string;
      fullName: string;
    } | null;
  } | null;
  _count?: {
    applications: number;
    views: number;
  };
  /** Tối đa 1 phần tử -- lượt đẩy tin đang SCHEDULED/ACTIVE, nếu có. Mảng rỗng
   * nghĩa là tin chưa từng được đẩy hoặc lượt đẩy gần nhất đã kết thúc. */
  boosts?: ReadonlyArray<{
    id: string;
    type: JobBoostType;
    status: "SCHEDULED" | "ACTIVE";
    startsAt: string;
    endsAt: string;
  }>;
}>;

export type JobBoostType = "FEATURED" | "URGENT";
export type JobBoostStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";

export type JobBoost = Readonly<{
  id: string;
  jobPostId: string;
  companyId: string;
  type: JobBoostType;
  status: JobBoostStatus;
  creditCost: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  jobPost?: { id: string; title: string; slug: string };
}>;

export type StopJobBoostResult = JobBoost & { creditRefunded: boolean };

export type JobBoostMetricsResponse = Readonly<{
  boost: JobBoost;
  daily: ReadonlyArray<{
    date: string;
    impressions: number;
    clicks: number;
    applicationsCount: number;
    savedCount: number;
  }>;
  totals: { impressions: number; clicks: number; applications: number; saves: number };
}>;

export type JobPostAccessMember = Readonly<{
  companyMemberId: string;
  recruiterAccountId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: {
    id: string;
    code: string;
    name: string;
  } | null;
  memberStatus: "INVITED" | "ACTIVE" | "SUSPENDED";
  accountStatus: string;
  isJobCreator: boolean;
  hasAccess: boolean;
  revokedAt: string | null;
}>;

export type JobPostAccessMembersResponse = Readonly<{
  jobPost: {
    id: string;
    title: string;
    createdByRecruiterId: string;
  };
  members: JobPostAccessMember[];
}>;

export type CreateRecruiterJobPostPayload = Readonly<{
  title: string;
  description: string;
  requirements?: string | undefined;
  benefits?: string | undefined;
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  salaryCurrency?: string | undefined;
  salaryPeriod?: SalaryPeriod | undefined;
  salaryIsNegotiable?: boolean | undefined;
  salaryIsVisible?: boolean | undefined;
  vacanciesCount?: number | undefined;
  jobCategoryId?: string | undefined;
  experienceLevelId?: string | undefined;
  employmentTypeId?: string | undefined;
  educationLevel?: string | undefined;
  workingDays?: string | undefined;
  expiredAt?: string | undefined;
}>;

export type JobPostCatalogs = Readonly<{
  categories: JobOption[];
  employmentTypes: JobOption[];
  experienceLevels: JobOption[];
  skills: JobOption[];
  specializations: JobOption[];
}>;

export type GenerateJobPostDraftPayload = Readonly<{
  title: string;
  jobCategoryId?: string;
  experienceLevelId?: string;
  employmentTypeId?: string;
  requiredSkillIds?: string[];
  preferredSkillIds?: string[];
  keywords?: string[];
  yearsOfExperience?: string;
  companyDescription?: string;
  productOrDomain?: string;
  roleObjective?: string;
  teamContext?: string;
  languageRequirement?: string;
  workMode?: JobPostWorkMode;
  outputLanguage: JobPostOutputLanguage;
  presentationStyle: JobPostPresentationStyle;
  hints?: string;
  /** Khóa idempotency của lần bấm này. Backend dùng nó để một lần thử lại không
   *  bị trừ thêm lượt AI và không gọi lại model. Xem job-post-ai-request-key.ts. */
  clientRequestId?: string;
}>;

export type JobPostAiDraftResponse = Readonly<{
  model: string;
  source: "generated" | "extracted";
  draft: {
    title: string;
    description: string;
    requirements: string;
    benefits: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryPeriod: SalaryPeriod;
    salaryIsNegotiable: boolean;
    salaryIsVisible: boolean;
    vacanciesCount: number;
    educationLevel: string;
    workingDays: string | null;
    jobCategoryId: string | null;
    experienceLevelId: string | null;
    employmentTypeId: string | null;
    skillIds: string[];
    specializationIds: string[];
  };
  suggestions: {
    unmatchedSkillNames: string[];
    unmatchedSpecializationNames: string[];
  };
}>;

export type JobPostSalaryInsightPayload = Readonly<{
  title: string;
  description: string;
  yearsOfExperience: number;
  requirements?: string;
  jobCategoryId?: string;
  experienceLevelId?: string;
  skillIds?: string[];
  requiredSkillIds?: string[];
  relatedSkillIds?: string[];
  skillKeywords?: string[];
  jobLocationIds?: string[];
  currentSalaryMin?: number;
  currentSalaryMax?: number;
}>;

type SalaryInsightBase = Readonly<{
  basis: "UPNEXT_PUBLIC_JOB_POSTS" | "WEB_GROUNDED_AI" | "MULTI_SOURCE_RESEARCH";
  currency: "VND";
  period: "MONTH";
  sampleSize: number;
  lookbackMonths: number;
  message: string;
}>;

export type JobPostSalaryInsightResponse =
  | (SalaryInsightBase &
      Readonly<{
        available: false;
      }>)
  | (SalaryInsightBase &
      Readonly<{
        available: true;
        confidence: "LOW" | "MEDIUM" | "HIGH";
        market: {
          p25: number;
          median: number;
          p75: number;
        };
        recommended: {
          salaryMin: number;
          salaryMax: number;
        };
        comparison: {
          position: "NOT_PROVIDED" | "BELOW" | "ALIGNED" | "ABOVE";
          differencePercent: number | null;
        };
        matchedFactors: string[];
        marketSummary?: string;
        evidenceNotes?: string[];
        sources?: Array<{
          title: string;
          url: string;
        }>;
        searchQueries?: string[];
        searchedAt?: string;
        model?: string;
      }>);

export async function getRecruiterJobPosts(token: string, recruiterId?: string) {
  const url = recruiterId
    ? `/recruiter/job-posts?recruiterId=${recruiterId}`
    : "/recruiter/job-posts";
  return apiRequest<RecruiterJobPost[]>(url, {
    headers: authHeaders(token),
  });
}

export function getJobPostAccessMembers(jobPostId: string, token: string) {
  return apiRequest<JobPostAccessMembersResponse>(
    `/recruiter/job-posts/${jobPostId}/access-members`,
    {
      headers: authHeaders(token),
    },
  );
}

export function updateJobPostMemberAccess(
  jobPostId: string,
  recruiterAccountId: string,
  hasAccess: boolean,
  token: string,
) {
  return apiRequest<{ recruiterAccountId: string; hasAccess: boolean }>(
    `/recruiter/job-posts/${jobPostId}/access-members/${recruiterAccountId}`,
    {
      body: JSON.stringify({ hasAccess }),
      headers: jsonAuthHeaders(token),
      method: "PATCH",
    },
  );
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

export function deleteRecruiterJobPost(jobPostId: string, token: string) {
  return apiRequest<void>(`/job-posts/${jobPostId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function reopenRecruiterJobPost(jobPostId: string, token: string) {
  return apiRequest<RecruiterJobPost>(`/job-posts/${jobPostId}/reopen`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function setJobPostSkills(jobPostId: string, skillIds: string[], token: string) {
  return apiRequest(`/job-posts/${jobPostId}/skills`, {
    body: JSON.stringify({ skillIds }),
    headers: jsonAuthHeaders(token),
    method: "PUT",
  });
}

export function setJobPostLocations(jobPostId: string, jobLocationIds: string[], token: string) {
  return apiRequest(`/job-posts/${jobPostId}/locations`, {
    body: JSON.stringify({ jobLocationIds }),
    headers: jsonAuthHeaders(token),
    method: "PUT",
  });
}

export function setJobPostSpecializations(
  jobPostId: string,
  specializationIds: string[],
  token: string,
) {
  return apiRequest(`/job-posts/${jobPostId}/specializations`, {
    body: JSON.stringify({ specializationIds }),
    headers: jsonAuthHeaders(token),
    method: "PUT",
  });
}

export function updateRecruiterJobPost(
  jobPostId: string,
  payload: CreateRecruiterJobPostPayload,
  token: string,
) {
  return apiRequest<RecruiterJobPost>(`/job-posts/${jobPostId}`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
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

/**
 * Adds a catalog entry the seed data is missing. The API answers 409 when the name already exists
 * under any spelling, so callers surface that instead of creating a near-duplicate.
 */
export function createSkillOption(name: string, token: string) {
  return apiRequest<JobOption>("/skills", {
    body: JSON.stringify({ name }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function createSpecializationOption(name: string, token: string) {
  return apiRequest<JobOption>("/specializations", {
    body: JSON.stringify({ name }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function generateJobPostDraft(payload: GenerateJobPostDraftPayload, token: string) {
  return apiRequest<JobPostAiDraftResponse>("/job-post-ai/generate", {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function getJobPostSalaryInsight(payload: JobPostSalaryInsightPayload, token: string) {
  return apiRequest<JobPostSalaryInsightResponse>("/job-post-ai/salary-insights", {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function extractJobPostDraft(text: string, token: string, clientRequestId?: string) {
  return apiRequest<JobPostAiDraftResponse>("/job-post-ai/extract", {
    body: JSON.stringify(clientRequestId ? { text, clientRequestId } : { text }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

/**
 * `idempotencyKey` phải ổn định qua các lần retry mạng của CÙNG một lượt bấm
 * (sinh một lần bằng `crypto.randomUUID()` ở nơi gọi, không sinh lại mỗi lần
 * gọi hàm này) -- đó là điều kiện để backend chống trừ quota hai lần.
 */
export function boostJobPost(
  jobPostId: string,
  type: JobBoostType,
  idempotencyKey: string,
  token: string,
) {
  return apiRequest<JobBoost>(`/recruiter/job-posts/${jobPostId}/boost`, {
    body: JSON.stringify({ type }),
    headers: {
      ...jsonAuthHeaders(token),
      "Idempotency-Key": idempotencyKey,
    },
    method: "POST",
  });
}

export function stopJobBoost(boostId: string, token: string) {
  return apiRequest<StopJobBoostResult>(`/recruiter/job-posts/boosts/${boostId}/stop`, {
    headers: authHeaders(token),
    method: "POST",
  });
}

export function getJobBoostHistory(
  token: string,
  params: { status?: JobBoostStatus; page?: number; limit?: number } = {},
) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiRequest<{ items: JobBoost[]; total: number; page: number; limit: number }>(
    `/recruiter/job-posts/boosts${query ? `?${query}` : ""}`,
    { headers: authHeaders(token) },
  );
}

export function getJobBoostMetrics(
  boostId: string,
  token: string,
  range: { from?: string; to?: string } = {},
) {
  const search = new URLSearchParams();
  if (range.from) search.set("from", range.from);
  if (range.to) search.set("to", range.to);
  const query = search.toString();
  return apiRequest<JobBoostMetricsResponse>(
    `/recruiter/job-posts/boosts/${boostId}/metrics${query ? `?${query}` : ""}`,
    { headers: authHeaders(token) },
  );
}

export function extractJobPostDraftFile(file: File, token: string, clientRequestId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  // multipart nên khóa đi kèm dưới dạng form field, không phải JSON body.
  if (clientRequestId) formData.append("clientRequestId", clientRequestId);

  return apiRequest<JobPostAiDraftResponse>("/job-post-ai/extract-file", {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}
