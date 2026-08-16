import { ApiError, apiRequest, createApiUrl } from "@/shared/api/http";

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
  preferredSearchCity?: string | null;
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
    preferredSearchCity: string | null;
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
  /** Optimistic-concurrency version of the logical CV. */
  version: number;
  createdAt: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    sourceFileId: string | null;
    versionNo: number;
    contentJson?: unknown | null;
    parsedText?: string | null;
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
  | "CONSIDERING"
  | "SHORTLISTED"
  | "INTERVIEWING"
  | "OFFERED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export type CandidateOfferResponse = "PENDING" | "ACCEPTED" | "DECLINED";

export type CandidateApplicationActivityGroup =
  | "all"
  | "active"
  | "interview"
  | "action_required"
  | "closed";

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
  jobPostLocations?: ReadonlyArray<{
    jobLocation: Readonly<{
      address?: string | null;
      city?: string | null;
      country?: string | null;
      district?: string | null;
    }>;
  }>;
}>;

export type CandidateApplicationInterviewApi = Readonly<{
  id: string;
  interviewRound: number;
  type: "ONLINE" | "ONSITE";
  scheduledStartAt: string;
  scheduledEndAt: string;
  meetingUrl?: string | null;
  location?: string | null;
  recruiterNote?: string | null;
  status: "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  recruiterProfile?: Readonly<{ fullName: string }> | null;
}>;

export type CandidateApplicationOfferDetails = Readonly<{
  salaryOffer: string;
  startDate: string;
  note?: string;
  offerLetterUrl?: string;
  attachmentName?: string;
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
  activityGroup?: Exclude<CandidateApplicationActivityGroup, "all">;
  availableActions?: Readonly<{
    canChangeCv: boolean;
    canRespondToOffer: boolean;
    canWithdraw: boolean;
  }>;
  offerDetails?: CandidateApplicationOfferDetails | null;
  offerDeadlineAt?: string | null;
  offerRespondedAt?: string | null;
  offerResponse?: CandidateOfferResponse | null;
  interviews?: ReadonlyArray<CandidateApplicationInterviewApi>;
  cvVersion: Readonly<{
    id: string;
    cvId: string;
    versionNo: number;
    sourceFileId: string | null;
    contentJson?: unknown | null;
    createdAt: string;
    fileName: string;
    cv?: Readonly<{
      source: string;
      title: string;
    }> | null;
  }>;
  statusLogs?: ReadonlyArray<{
    id: string;
    actorType: string;
    actorId: string | null;
    oldStatus: CandidateApplicationStatus | null;
    newStatus: CandidateApplicationStatus;
    reason: string | null;
    note: string | null;
    changedAt: string;
  }>;
}>;

export type CandidateApplicationMutationApi = Readonly<{
  id: string;
  status: CandidateApplicationStatus;
  updatedAt: string;
  offerRespondedAt?: string | null;
  offerResponse?: CandidateOfferResponse | null;
}>;

export type CandidateApplicationActivityApi = Readonly<{
  items: CandidateApplicationApi[];
  meta: PaginatedResponse<CandidateApplicationApi>["meta"];
  summary: Readonly<{
    total: number;
    active: number;
    interviewing: number;
    actionRequired: number;
    nextInterviewAt: string | null;
    nextInterviewApplicationId: string | null;
  }>;
}>;

export type SavedJobApi = Readonly<{
  id: string;
  candidateProfileId: string;
  jobPostId: string;
  createdAt: string;
  jobPost: CandidateActivityJobPostApi;
}>;

export type SavedJobMutationApi = Omit<SavedJobApi, "jobPost">;

export type CompanyFollowApi = Readonly<{
  id: string;
  candidateProfileId: string;
  companyId: string;
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

/** Extending the shared skill catalog needs a signed-in actor; the API rejects anonymous writes. */
export function createSkillOption(name: string, token: string) {
  return apiRequest<SkillOptionApi>("/skills", {
    body: JSON.stringify({ name }),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function getMyCandidateCvs(token: string, page = 1, limit = 100) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  return apiRequest<PaginatedResponse<CandidateCvApi>>(`/cvs/me?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export function getCandidateCv(token: string, cvId: string) {
  return apiRequest<CandidateCvApi>(`/cvs/${cvId}`, { headers: authHeaders(token) });
}

/**
 * Fetches a protected CV file after the API authorizes the candidate.
 * `sourceFile.publicUrl` is intentionally not used because uploaded CVs are
 * private; the API may stream bytes itself or redirect to signed storage.
 */
type CandidateCvDownloadOptions = Readonly<{
  /**
   * The MIME type stored with the original upload. Cloudinary delivers private
   * `raw` assets as `application/octet-stream`, even when the file is a PDF.
   */
  expectedMimeType?: string | null;
  fileName?: string | null;
}>;

const genericBinaryMimeTypes = new Set(["application/octet-stream", "binary/octet-stream"]);

function normaliseMimeType(mimeType?: string | null) {
  return mimeType?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function inferCandidateCvMimeType(fileName?: string | null) {
  if (fileName?.trim().toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (fileName?.trim().toLowerCase().endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "";
}

/**
 * Restores the trusted upload MIME type when private object storage returns a
 * generic binary response. The replacement Blob is important: an object URL
 * inherits `blob.type`, so changing display state alone would not make a PDF
 * render in an iframe.
 */
export function prepareCandidateCvPreview(
  blob: Blob,
  { expectedMimeType, fileName }: CandidateCvDownloadOptions = {},
) {
  const deliveryMimeType = normaliseMimeType(blob.type);
  const storedMimeType = normaliseMimeType(expectedMimeType);
  const isGenericDelivery = !deliveryMimeType || genericBinaryMimeTypes.has(deliveryMimeType);
  const mimeType =
    (isGenericDelivery ? storedMimeType || inferCandidateCvMimeType(fileName) : deliveryMimeType) ||
    deliveryMimeType ||
    "application/octet-stream";

  return {
    blob: blob.type === mimeType ? blob : new Blob([blob], { type: mimeType }),
    mimeType,
  };
}

export async function downloadCandidateCvVersion(
  token: string,
  cvVersionId: string,
  options?: CandidateCvDownloadOptions,
) {
  const response = await fetch(createApiUrl(`/cv-versions/${cvVersionId}/download`), {
    headers: {
      ...authHeaders(token),
      Accept:
        "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream",
    },
  });

  if (!response.ok) {
    const payload = await readDownloadErrorPayload(response);
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Không thể tải tệp CV. Vui lòng thử lại.";

    throw new ApiError(response.status, message, payload);
  }

  const blob = await response.blob();
  const responseMimeType = response.headers.get("content-type")?.split(";", 1)[0];

  return prepareCandidateCvPreview(
    responseMimeType && responseMimeType !== blob.type
      ? new Blob([blob], { type: responseMimeType })
      : blob,
    options,
  );
}

async function readDownloadErrorPayload(response: Response): Promise<unknown> {
  const responseText = await response.text();
  if (!responseText.trim()) return null;

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

type CandidateApplicationWireApi = Omit<CandidateApplicationApi, "cvVersion"> & {
  cvVersion: Omit<CandidateApplicationApi["cvVersion"], "versionNo" | "fileName"> & {
    versionNo?: number;
    /** Kept temporarily for API responses created before the field was standardized. */
    versionNumber?: number;
    fileName?: string;
  };
};

function normalizeCandidateApplication(
  application: CandidateApplicationWireApi,
): CandidateApplicationApi {
  const cvVersion = application.cvVersion;
  const isPendingOffer =
    application.status === "OFFERED" &&
    (application.offerResponse === undefined ||
      application.offerResponse === null ||
      application.offerResponse === "PENDING");
  const isOfferExpired =
    Boolean(application.offerDeadlineAt) &&
    new Date(application.offerDeadlineAt as string).getTime() <= Date.now();

  return {
    ...application,
    activityGroup:
      application.activityGroup ??
      (application.status === "INTERVIEWING"
        ? "interview"
        : application.status === "OFFERED"
          ? isPendingOffer && !isOfferExpired
            ? "action_required"
            : application.offerResponse === "ACCEPTED"
              ? "active"
              : "closed"
          : ["SUBMITTED", "VIEWED", "CONSIDERING", "SHORTLISTED"].includes(application.status)
            ? "active"
            : "closed"),
    availableActions: application.availableActions ?? {
      canChangeCv: application.status === "SUBMITTED",
      canRespondToOffer: isPendingOffer && !isOfferExpired,
      canWithdraw: ["SUBMITTED", "VIEWED", "CONSIDERING", "SHORTLISTED", "INTERVIEWING"].includes(
        application.status,
      ),
    },
    cvVersion: {
      ...cvVersion,
      versionNo: cvVersion.versionNo ?? cvVersion.versionNumber ?? 1,
      fileName: cvVersion.fileName ?? cvVersion.cv?.title ?? "CV đã chọn",
    },
    interviews: application.interviews ?? [],
    jobPost: {
      ...application.jobPost,
      jobPostLocations: application.jobPost.jobPostLocations ?? [],
    },
  };
}

export async function getMyCandidateApplications(token: string) {
  const applications = await apiRequest<CandidateApplicationWireApi[]>("/applications/me", {
    headers: authHeaders(token),
  });
  return applications.map(normalizeCandidateApplication);
}

export async function getMyCandidateApplicationActivity(
  token: string,
  params: Readonly<{
    group?: CandidateApplicationActivityGroup;
    limit?: number;
    page?: number;
    q?: string;
    sort?: "recent_activity" | "newest" | "oldest";
  }> = {},
) {
  const searchParams = new URLSearchParams();
  if (params.group && params.group !== "all") searchParams.set("group", params.group);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.sort && params.sort !== "recent_activity") searchParams.set("sort", params.sort);
  const suffix = searchParams.size ? `?${searchParams.toString()}` : "";

  const response = await apiRequest<
    Omit<CandidateApplicationActivityApi, "items"> & { items: CandidateApplicationWireApi[] }
  >(`/applications/me/activity${suffix}`, {
    headers: authHeaders(token),
  });

  return {
    ...response,
    items: response.items.map(normalizeCandidateApplication),
  } satisfies CandidateApplicationActivityApi;
}

export async function getCandidateApplication(token: string, applicationId: string) {
  const application = await apiRequest<CandidateApplicationWireApi>(
    `/applications/${applicationId}`,
    {
      headers: authHeaders(token),
    },
  );
  return normalizeCandidateApplication(application);
}

export function withdrawCandidateApplication(token: string, applicationId: string) {
  return apiRequest<CandidateApplicationMutationApi>(`/applications/${applicationId}/withdraw`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function updateCandidateApplicationCv(
  token: string,
  applicationId: string,
  payload: { cvVersionId: string },
) {
  return apiRequest<CandidateApplicationMutationApi>(`/applications/${applicationId}/cv`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
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

export function getMyFollowedCompanies(token: string) {
  return apiRequest<CompanyFollowApi[]>("/company-follows/me", {
    headers: authHeaders(token),
  });
}

export function followCandidateCompany(token: string, companyId: string) {
  return apiRequest<CompanyFollowApi>(`/companies/${companyId}/follow`, {
    headers: authHeaders(token),
    method: "POST",
  });
}

export function unfollowCandidateCompany(token: string, companyId: string) {
  return apiRequest<void>(`/companies/${companyId}/follow`, {
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
  payload: {
    contentJson?: Record<string, unknown>;
    parsedText?: string;
    title: string;
    source: "UPLOAD" | "BUILDER";
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    isDefault?: boolean;
    sourceFileId?: string;
  },
) {
  return apiRequest<CandidateCvApi>("/cvs", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export type CreateBuilderCvVersionResponse = Readonly<{
  cv: Pick<CandidateCvApi, "id" | "title" | "status" | "isDefault" | "version" | "updatedAt">;
  version: CandidateCvApi["versions"][number];
}>;

/** Saves the current Builder document as a new immutable CV version. */
export function createCandidateBuilderVersion(
  token: string,
  cvId: string,
  payload: {
    contentJson: Record<string, unknown>;
    parsedText: string;
    title?: string;
    status: "DRAFT" | "ACTIVE";
    expectedVersion: number;
  },
) {
  return apiRequest<CreateBuilderCvVersionResponse>(`/cvs/${cvId}/builder-versions`, {
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
    cvVersionId: string;
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

export type CheckAppliedJobApi = Readonly<{
  applied: boolean;
  applicationId?: string | null;
  status?: string | null;
}>;

export function checkAppliedJob(token: string, jobPostId: string) {
  return apiRequest<CheckAppliedJobApi>(`/job-posts/${jobPostId}/applications/me`, {
    headers: authHeaders(token),
  });
}

export function respondCandidateOffer(
  token: string,
  applicationId: string,
  action: "ACCEPT" | "DECLINE",
) {
  return apiRequest<CandidateApplicationMutationApi>(
    `/applications/${applicationId}/respond-offer`,
    {
      body: JSON.stringify({ action }),
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
      method: "PATCH",
    },
  );
}
