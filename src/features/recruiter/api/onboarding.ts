import { apiRequest } from "@/shared/api/http";

const apiBaseUrl = "http://localhost:3636/api/v1";

export type RecruiterAccountDetail = Readonly<{
  id: string;
  email: string;
  status: string;
  company: {
    id: string;
    name: string;
    status: string;
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    businessLicenseFileId: string | null;
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

export type CreateCompanyPayload = Readonly<{
  name: string;
  taxCode?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  companySize?: string;
}>;

export type CompanyResponse = Readonly<{
  id: string;
  name: string;
}>;

export function getRecruiterAccount(accountId: string, token: string) {
  return apiRequest<RecruiterAccountDetail>(`${apiBaseUrl}/recruiter-accounts/${accountId}`, {
    headers: authHeaders(token),
  });
}

export function createRecruiterProfile(payload: CreateRecruiterProfilePayload, token: string) {
  return apiRequest(`${apiBaseUrl}/recruiter-profiles`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateRecruiterProfile(
  profileId: string,
  payload: Partial<Omit<CreateRecruiterProfilePayload, "recruiterAccountId">>,
  token: string,
) {
  return apiRequest(`${apiBaseUrl}/recruiter-profiles/${profileId}`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
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

  return apiRequest<UploadFileResponse>(`${apiBaseUrl}/files/upload`, {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function createCompany(payload: CreateCompanyPayload, token: string) {
  return apiRequest<CompanyResponse>(`${apiBaseUrl}/companies`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function attachRecruiterCompany(accountId: string, companyId: string, token: string) {
  return apiRequest(`${apiBaseUrl}/recruiter-accounts/${accountId}`, {
    body: JSON.stringify({ companyId }),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function uploadCompanyBusinessLicense(companyId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest(`${apiBaseUrl}/companies/${companyId}/business-license`, {
    body: formData,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function getRecruiterStats(accountId: string, token: string) {
  return apiRequest<{ totalJobPosts: number; totalCandidates: number }>(
    `${apiBaseUrl}/recruiter-accounts/${accountId}/dashboard-stats`,
    {
      headers: authHeaders(token),
    },
  );
}

export function changePassword(accountId: string, payload: Record<string, string>, token: string) {
  return apiRequest(`${apiBaseUrl}/recruiter-accounts/${accountId}/change-password`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateCompany(companyId: string, payload: CreateCompanyPayload, token: string) {
  return apiRequest(`${apiBaseUrl}/companies/${companyId}`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export function getCompany(companyId: string, token: string) {
  return apiRequest<any>(`${apiBaseUrl}/companies/${companyId}`, {
    headers: authHeaders(token),
  });
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
