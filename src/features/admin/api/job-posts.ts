import { apiRequest } from "@/shared/api/http";

export type AdminJobPostResponse = Readonly<{
  id: string;
  title: string;
  status: string;
  moderationStatus: string;
  company: {
    id: string;
    name: string;
    status: string;
    verificationStatus: string;
  };
  createdByRecruiter: {
    id: string;
    email: string;
    profile: {
      id: string;
      fullName: string;
    };
  };
  _count: {
    applications: number;
    views: number;
    savedJobs: number;
  };
  createdAt: string;
  employmentType?: { id: string; name: string } | null;
  jobPostLocations?: ReadonlyArray<{
    jobLocation: { city: string | null; district: string | null; address: string | null };
  }>;
  publishedAt?: string | null;
  [key: string]: any;
}>;

export type AdminJobPostFilters = {
  employmentTypeId?: string | undefined;
  city?: string | undefined;
};

export type EmploymentTypeOption = Readonly<{ id: string; name: string }>;

export type JobLocationOption = Readonly<{
  id: string;
  city: string | null;
  district: string | null;
}>;

export function getEmploymentTypes() {
  return apiRequest<EmploymentTypeOption[]>("/employment-types");
}

export function getJobLocations() {
  return apiRequest<JobLocationOption[]>("/job-locations");
}

export type AdminJobPostsPaginatedResponse = Readonly<{
  items: AdminJobPostResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}>;

export async function getAdminJobPosts(
  token: string,
  limit: number = 100,
  filters: AdminJobPostFilters = {},
) {
  const searchParams = new URLSearchParams({ limit: String(limit) });
  if (filters.employmentTypeId) searchParams.set("employmentTypeId", filters.employmentTypeId);
  if (filters.city) searchParams.set("city", filters.city);

  const response = await apiRequest<AdminJobPostsPaginatedResponse | AdminJobPostResponse[]>(
    `/admin/job-posts?${searchParams.toString()}`,
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

export async function getJobPostDetails(token: string, id: string) {
  return apiRequest<AdminJobPostResponse>(`/job-posts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

export async function rejectJobPost(token: string, id: string, payload: { reason: string }) {
  return apiRequest<{ success: boolean }>(`/admin/job-posts/${id}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: payload.reason,
    }),
  });
}

export async function approveJobPost(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/admin/job-posts/${id}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateJobPostVisibility(token: string, id: string, isHidden: boolean) {
  return apiRequest<{ success: boolean }>(`/admin/job-posts/${id}/visibility`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isHidden }),
  });
}
