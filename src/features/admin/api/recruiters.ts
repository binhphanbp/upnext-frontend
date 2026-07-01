import { apiRequest } from "@/shared/api/http";

export type AdminRecruiterResponse = {
  id: string;
  email: string;
  status: "ACTIVE" | "BANNED" | "PENDING_VERIFICATION";
  company?: {
    id: string;
    name: string;
  };
  recruiterRole?: {
    id: string;
    code: string;
    name: string;
  };
  profile?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
};

export type AdminRecruitersPaginatedResponse = {
  items: AdminRecruiterResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getAdminRecruiters(token: string) {
  // Using limit=1000 to fetch all items for client-side pagination
  // This matches the pattern in other admin components like employers-table
  const response = await apiRequest<AdminRecruitersPaginatedResponse | AdminRecruiterResponse[]>(
    `/recruiter-accounts?limit=1000`,
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
