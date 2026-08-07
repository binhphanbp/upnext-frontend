import { apiRequest } from "@/shared/api/http";

export type AdminCompanyResponse = {
  id: string;
  name: string;
  type: string;
  email?: string;
  status: "ACTIVE" | "LOCKED" | "RESTRICTED";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  members?: any[];
  recruiterAccounts?: any[];
  /** The company's current subscription, or null when it is on no paid plan. */
  activePlan?: { id: string; name: string; expiredAt: string } | null;
  _count?: {
    jobPosts: number;
  };
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

export type AdminEmployerFilters = {
  /** A plan UUID, or "none" for companies without an active plan. */
  plan?: string | undefined;
};

export type AdminSubscriptionPlanOption = Readonly<{
  id: string;
  subscriptionName: string;
  status: string;
}>;

export function getAdminSubscriptionPlans(token: string) {
  return apiRequest<AdminSubscriptionPlanOption[]>("/subscription-plans", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminEmployers(
  token: string,
  limit: number = 100,
  filters: AdminEmployerFilters = {},
) {
  const searchParams = new URLSearchParams({ limit: String(limit) });
  if (filters.plan === "none") {
    searchParams.set("plan", "none");
  } else if (filters.plan) {
    searchParams.set("planId", filters.plan);
  }

  const response = await apiRequest<AdminCompaniesPaginatedResponse | AdminCompanyResponse[]>(
    `/companies?${searchParams.toString()}`,
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
  status: "ACTIVE" | "LOCKED" | "RESTRICTED";
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

export type ReputationActivityResponse = {
  id: string;
  actionType: string;
  score: string;
  reason: string | null;
  createdAt: string;
};

export async function getAdminCompanyReputationActivities(token: string, id: string) {
  return apiRequest<ReputationActivityResponse[]>(`/companies/${id}/reputation-activities`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function banCompanyForFraud(token: string, id: string, reason: string) {
  return apiRequest(`/companies/${id}/ban-fraud`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
}
