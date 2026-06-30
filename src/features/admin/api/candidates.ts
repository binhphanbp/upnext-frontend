import { apiRequest } from "@/shared/api/http";

export type AdminCandidateResponse = {
  id: string;
  fullName: string;
  email: string;
  authProvider: "DEFAULT" | "GOOGLE" | "GITHUB" | "LINKEDIN";
  providerUserId?: string | null;
  candidateAccountStatus: "ACTIVE" | "BANNED" | "PENDING_VERIFICATION";
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCandidatePaginatedResponse = {
  items: AdminCandidateResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getAdminCandidates(token: string, limit: number = 100) {
  const response = await apiRequest<AdminCandidatePaginatedResponse | AdminCandidateResponse[]>(
    `/candidate-accounts?limit=${limit}`,
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

export async function getAdminCandidateDetails(token: string, id: string) {
  return apiRequest<AdminCandidateResponse>(`/candidate-accounts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
