import { apiRequest } from "@/shared/api/http";

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
  code: string;
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

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function jsonAuthHeaders(token: string) {
  return {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
}

function removeEmptyFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<T>;
}
