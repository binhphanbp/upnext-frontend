import { apiRequest } from "@/shared/api/http";

export type RecruiterAccountApiItem = {
  company?: {
    id: string;
    name: string;
  } | null;
  companyId: string | null;
  createdAt: string;
  email: string;
  id: string;
  profile?: {
    avatarUrl?: string | null;
    fullName?: string | null;
    id: string;
  } | null;
  recruiterRole?: {
    code: string;
    description?: string | null;
    id: string;
    name: string;
  } | null;
  recruiterRoleId: string | null;
  status: string;
  updatedAt: string;
};

export type RecruiterAccountsResponse = {
  items: RecruiterAccountApiItem[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

export function getRecruiterAccounts() {
  return apiRequest<RecruiterAccountsResponse>("/recruiter-accounts");
}

export function deactivateRecruiterAccount(accountId: string) {
  return apiRequest(`/recruiter-accounts/${accountId}/deactivate`, {
    method: "PATCH",
  });
}
