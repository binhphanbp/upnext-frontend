import { apiRequest } from "@/shared/api/http";

export type CompanyMemberApiItem = {
  companyId: string;
  createdAt: string;
  id: string;
  joinedAt: string;
  recruiterAccount: {
    email: string;
    id: string;
    profile?: {
      avatarUrl?: string | null;
      fullName?: string | null;
    } | null;
    status: string;
  };
  recruiterAccountId: string;
  role: {
    code: string;
    id: string;
    name: string;
  };
  roleId: string;
  status: string;
  updatedAt: string;
};

export function getCompanyMembers(companyId: string) {
  return apiRequest<CompanyMemberApiItem[]>(`/companies/${companyId}/members`);
}

export function inviteCompanyMember(
  companyId: string,
  payload: {
    email: string;
    roleId: string;
  },
) {
  return apiRequest(`/companies/${companyId}/members/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function updateCompanyMemberRole(
  memberId: string,
  payload: {
    roleId: string;
  },
) {
  return apiRequest(`/company-members/${memberId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function deleteCompanyMember(memberId: string) {
  return apiRequest(`/company-members/${memberId}`, {
    method: "DELETE",
  });
}
