import { authHeaders, jsonAuthHeaders, removeEmptyFields } from "@/features/recruiter/api/client";
import { ApiError, apiRequest } from "@/shared/api/http";

export type RecruiterPermission = Readonly<{
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}>;

export type RecruiterRole = Readonly<{
  id: string;
  code: string;
  name: string;
  description: string | null;
  companyId?: string | null;
  rolePermissions?: {
    recruiterPermission: RecruiterPermission;
  }[];
}>;

export type CompanyMember = Readonly<{
  id: string;
  invitedEmail: string | null;
  status: "INVITED" | "ACTIVE" | "SUSPENDED";
  joinedAt: string;
  recruiterAccount: {
    id: string;
    email: string;
    status: string;
    profile: {
      id?: string;
      fullName: string | null;
      avatarUrl: string | null;
    } | null;
  } | null;
  role: {
    id: string;
    code: string;
    name: string;
  } | null;
}>;

export type RolePayload = Readonly<{
  code?: string;
  name: string;
  description?: string;
}>;

export type PermissionPayload = Readonly<{
  code: string;
  module: string;
  action: string;
  description?: string;
}>;

export function getCompanyMembers(companyId: string, token: string) {
  return apiRequest<CompanyMember[]>(`/companies/${companyId}/members`, {
    headers: authHeaders(token),
  });
}

export function inviteCompanyMember(
  companyId: string,
  email: string,
  roleId: string,
  token: string,
) {
  return apiRequest<CompanyMember>(`/companies/${companyId}/members/invite`, {
    body: JSON.stringify({ email, roleId: roleId || null }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function updateCompanyMemberRole(memberId: string, roleId: string, token: string) {
  return apiRequest<CompanyMember>(`/company-members/${memberId}/role`, {
    body: JSON.stringify({ roleId }),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function removeCompanyMember(memberId: string, token: string) {
  return apiRequest<void>(`/company-members/${memberId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function getRecruiterRoles(token: string) {
  return apiRequest<RecruiterRole[]>("/recruiter-roles", {
    headers: authHeaders(token),
  });
}

export function createRecruiterRole(payload: RolePayload, token: string) {
  return apiRequest<RecruiterRole>("/recruiter-roles", {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export async function createRecruiterRoleWithPermissions(
  payload: RolePayload,
  permissionIds: string[],
  token: string,
) {
  const role = await createRecruiterRole(payload, token);

  if (permissionIds.length === 0) {
    return role;
  }

  return assignRecruiterRolePermissions(role.id, permissionIds, token);
}

export function updateRecruiterRole(roleId: string, payload: RolePayload, token: string) {
  return apiRequest<RecruiterRole>(`/recruiter-roles/${roleId}`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function deleteRecruiterRole(roleId: string, token: string) {
  return apiRequest<void>(`/recruiter-roles/${roleId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export function assignRecruiterRolePermissions(
  roleId: string,
  permissionIds: string[],
  token: string,
) {
  return apiRequest<RecruiterRole>(`/recruiter-roles/${roleId}/permissions`, {
    body: JSON.stringify({ permissionIds }),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function getRecruiterPermissions(token: string) {
  return apiRequest<RecruiterPermission[]>("/recruiter-permissions", {
    headers: authHeaders(token),
  });
}

export function createRecruiterPermission(payload: PermissionPayload, token: string) {
  return apiRequest<RecruiterPermission>("/recruiter-permissions", {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "POST",
  });
}

export function updateRecruiterPermission(
  permissionId: string,
  payload: PermissionPayload,
  token: string,
) {
  return apiRequest<RecruiterPermission>(`/recruiter-permissions/${permissionId}`, {
    body: JSON.stringify(removeEmptyFields(payload)),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function deleteRecruiterPermission(permissionId: string, token: string) {
  return apiRequest<void>(`/recruiter-permissions/${permissionId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}

export type Application = Readonly<{
  id: string;
  submittedAt: string;
  status:
    | "SUBMITTED"
    | "REVIEWING"
    | "INTERVIEWING"
    | "OFFERED"
    | "ACCEPTED"
    | "REJECTED"
    | "WITHDRAWN";
  coverLetter: string | null;
  candidateProfile: {
    id: string;
    account: {
      id: string;
      fullName: string | null;
      email: string;
    };
  };
  jobPost: {
    id: string;
    title: string;
  };
  cvVersion: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
}>;

export function getCompanyApplications(
  token: string,
  params?: {
    jobPostId?: string;
    status?: string;
    search?: string;
  },
) {
  const query = new URLSearchParams();
  if (params?.jobPostId) query.set("jobPostId", params.jobPostId);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);

  const queryString = query.toString();
  const url = `/recruiter/company-applications${queryString ? `?${queryString}` : ""}`;

  return apiRequest<Application[]>(url, {
    headers: authHeaders(token),
  });
}

export function isRecruiterMissingCompanyError(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return false;
  }

  const payload = error.payload as { message?: unknown } | undefined;
  const message =
    typeof payload?.message === "string"
      ? payload.message
      : Array.isArray(payload?.message)
        ? payload.message.join(" ")
        : error.message;

  return message.toLowerCase().includes("recruiter does not belong to any company");
}

export function updateApplicationStatus(
  applicationId: string,
  status: string,
  token: string,
  note?: string,
) {
  return apiRequest<Application>(`/applications/${applicationId}/status`, {
    body: JSON.stringify({ status, note }),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export function updateCompanyMemberStatus(
  memberId: string,
  status: "ACTIVE" | "SUSPENDED",
  token: string,
) {
  return apiRequest<CompanyMember>(`/company-members/${memberId}/status`, {
    body: JSON.stringify({ status }),
    headers: jsonAuthHeaders(token),
    method: "PATCH",
  });
}

export type CompanyInvitationDetails = Readonly<{
  id: string;
  invitedEmail: string;
  companyName: string;
  roleName: string | null;
  hasPassword: boolean;
}>;

export function getCompanyInvitationDetails(id: string) {
  return apiRequest<CompanyInvitationDetails>(`/company-members/invitations/${id}`, {
    method: "GET",
  });
}

export function acceptCompanyInvitationAndSetPassword(id: string, password: string) {
  return apiRequest<{
    accessToken: string;
    tokenType: string;
    user: { id: string; email: string; role: string };
  }>(`/company-members/invitations/${id}/accept-and-set-password`, {
    body: JSON.stringify({ password }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function acceptCompanyInvitation(id: string, token: string) {
  return apiRequest<{ id: string; status: string }>(`/company-members/invitations/${id}/accept`, {
    headers: authHeaders(token),
    method: "POST",
  });
}
