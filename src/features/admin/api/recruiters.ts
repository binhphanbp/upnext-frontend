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

export async function getAdminRecruiters(token: string): Promise<AdminRecruiterResponse[]> {
  // Using limit=100 to fetch all items for client-side pagination
  // This matches the pattern in other admin components like employers-table
  const response = await apiRequest<AdminRecruitersPaginatedResponse | AdminRecruiterResponse[]>(
    `/recruiter-accounts?limit=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  let responseData = response as any;
  if (response && "data" in response) {
    responseData = (response as any).data;
  }

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (responseData && "items" in responseData && Array.isArray(responseData.items)) {
    return responseData.items;
  }

  return [];
}
