import { authHeaders, jsonAuthHeaders, removeEmptyFields } from "@/features/recruiter/api/client";
import { apiRequest } from "@/shared/api/http";

export type RecruiterAccountDetail = Readonly<{
  id: string;
  email: string;
  status: string;
  recruiterRole?: {
    id: string;
    code: string;
    name: string;
    rolePermissions?: Array<{
      recruiterPermission: {
        code: string;
      };
    }>;
  } | null;
  company: {
    id: string;
    name: string;
    status: "ACTIVE" | "LOCKED" | "RESTRICTED";
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    businessLicenseFileId: string | null;
    reputationScore: string;
    /** Server-side threshold a company must reach before a post can be sent to moderation. */
    minReputationScoreToPublish?: number;
    restrictedAt: string | null;
  } | null;
  profile: {
    id: string;
    fullName: string;
    phoneNumber: string | null;
    gender: "MALE" | "FEMALE" | null;
    avatarUrl: string | null;
  } | null;
}>;

export type CreateRecruiterProfilePayload = Readonly<{
  recruiterAccountId: string;
  fullName: string;
  phoneNumber?: string | undefined;
  gender?: "MALE" | "FEMALE" | undefined;
  avatarUrl?: string | undefined;
}>;

export type UpdateRecruiterProfilePayload = {
  fullName?: string | undefined;
  phoneNumber?: string | undefined;
  gender?: "MALE" | "FEMALE" | undefined;
  avatarUrl?: string | null | undefined;
};

export type CreateCompanyPayload = Readonly<{
  name: string;
  taxCode?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  companySize?: string;
  benefits?: string;
}>;

export type CompanyResponse = Readonly<{
  id: string;
  name: string;
}>;

export type CompanyDetail = Readonly<{
  id: string;
  name: string;
  taxCode: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  companySize: string | null;
  benefits: string | null;
  status: string;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  businessLicenseFileId: string | null;
  reputationScore: string;
  logoFileId?: string | null;
  logoFile?: {
    id: string;
    publicUrl: string;
  } | null;
  coverFile?: {
    id: string;
    publicUrl: string;
  } | null;
  photos?: Array<{
    id: string;
    publicUrl: string;
  }> | null;
}>;

export function getRecruiterAccount(accountId: string, token: string) {
  return apiRequest<RecruiterAccountDetail>(`/recruiter-accounts/${accountId}`, {
    headers: authHeaders(token),
  });
}

export function createRecruiterProfile(payload: CreateRecruiterProfilePayload, token: string) {
  return apiRequest("/recruiter-profiles", {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function updateRecruiterProfile(
  profileId: string,
  payload: UpdateRecruiterProfilePayload,
  token: string,
) {
  return apiRequest(`/recruiter-profiles/${profileId}`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export type UploadFileResponse = Readonly<{
  message: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: string;
    storageKey: string;
    publicUrl: string;
  };
}>;

export function uploadFile(file: File, purpose: string, visibility: string, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);
  formData.append("visibility", visibility);

  return apiRequest<UploadFileResponse>("/files/upload", {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function createCompany(payload: CreateCompanyPayload, token: string) {
  return apiRequest<CompanyResponse>("/companies", {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function attachRecruiterCompany(accountId: string, companyId: string, token: string) {
  return apiRequest(`/recruiter-accounts/${accountId}`, {
    body: JSON.stringify({ companyId }),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function uploadCompanyBusinessLicense(companyId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest(`/companies/${companyId}/business-license`, {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export type ScanCompanyLicenseResult = {
  name: string;
  taxCode: string;
  city: string | null;
  address: string;
  email: string | null;
  phone: string | null;
  website: string | null;
};

export function scanCompanyBusinessLicense(companyId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<ScanCompanyLicenseResult>(`/companies/${companyId}/scan-license`, {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

// Quét trước khi công ty được tạo (onboarding) — không đọc/ghi dữ liệu công ty nào.
export function scanCompanyBusinessLicensePreview(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<ScanCompanyLicenseResult>("/companies/scan-license", {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function uploadCompanyLogo(companyId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadFileResponse>(`/companies/${companyId}/logo`, {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function uploadCompanyCover(companyId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadFileResponse>(`/companies/${companyId}/cover`, {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function getCompanyBusinessLicenseUrl(companyId: string, token: string) {
  return apiRequest<{ url: string }>(`/companies/${companyId}/business-license/url`, {
    headers: authHeaders(token),
  });
}

export function getRecruiterStats(accountId: string, token: string) {
  return apiRequest<{ totalJobPosts: number; totalCandidates: number }>(
    `/recruiter-accounts/${accountId}/dashboard-stats`,
    {
      headers: authHeaders(token),
    },
  );
}

export function changePassword(accountId: string, payload: Record<string, string>, token: string) {
  return apiRequest(`/recruiter-accounts/${accountId}/change-password`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function updateCompany(companyId: string, payload: CreateCompanyPayload, token: string) {
  return apiRequest(`/companies/${companyId}`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function getCompany(companyId: string, token: string) {
  return apiRequest<CompanyDetail>(`/companies/${companyId}`, {
    headers: authHeaders(token),
  });
}

export function uploadCompanyPhoto(companyId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadFileResponse>(`/companies/${companyId}/photos`, {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function deleteCompanyPhoto(companyId: string, photoId: string, token: string) {
  return apiRequest(`/companies/${companyId}/photos/${photoId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export interface CompanyLocation {
  id: string;
  companyId: string;
  name: string | null;
  country: string;
  workingModel: "ONSITE" | "HYBRID" | "REMOTE";
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationPayload {
  name?: string;
  country?: string;
  workingModel: "ONSITE" | "HYBRID" | "REMOTE";
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export function getCompanyLocations(companyId: string, token: string) {
  return apiRequest<CompanyLocation[]>(`/companies/${companyId}/locations`, {
    headers: authHeaders(token),
  });
}

export function createCompanyLocation(
  companyId: string,
  payload: CreateLocationPayload,
  token: string,
) {
  return apiRequest<CompanyLocation>(`/companies/${companyId}/locations`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function updateCompanyLocation(
  companyId: string,
  locationId: string,
  payload: Partial<CreateLocationPayload>,
  token: string,
) {
  return apiRequest<CompanyLocation>(`/companies/${companyId}/locations/${locationId}`, {
    body: JSON.stringify(payload),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function deleteCompanyLocation(companyId: string, locationId: string, token: string) {
  return apiRequest<void>(`/companies/${companyId}/locations/${locationId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}
