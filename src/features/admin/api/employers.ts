import { apiRequest } from "@/shared/api/http";

export type AdminCompanyResponse = {
  id: string;
  name: string;
  type: string;
  email?: string;
  status: "ACTIVE" | "LOCKED";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export type AdminCompaniesPaginatedResponse = {
  items: AdminCompanyResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getAdminEmployers(token: string, limit: number = 100) {
  const response = await apiRequest<AdminCompaniesPaginatedResponse | AdminCompanyResponse[]>(
    `/companies?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (Array.isArray(response)) {
    return response;
  }

  if (response && "items" in response && Array.isArray(response.items)) {
    return response.items;
  }

  return [];
}

export async function verifyCompany(
  token: string,
  id: string,
  status: "VERIFIED" | "REJECTED",
  reason?: string,
) {
  return apiRequest(`/companies/${id}/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, reason }),
  });
}

export type AdminCompanyDetailResponse = {
  id: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
  taxCode?: string;
  website?: string;
  address?: string;
  shortDescription?: string;
  description?: string;
  benefits?: string;
  companySize?: string;
  status: "ACTIVE" | "LOCKED";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  reputationScore: string;
  createdAt: string;
  updatedAt: string;
  logoFile?: { publicUrl: string };
  coverFile?: { publicUrl: string };
  members?: any[];
  recruiterAccounts?: any[];
  jobPosts?: any[];
};

export async function getAdminCompanyDetails(token: string, id: string) {
  return apiRequest<AdminCompanyDetailResponse>(`/companies/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
