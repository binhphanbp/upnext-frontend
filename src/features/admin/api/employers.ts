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
