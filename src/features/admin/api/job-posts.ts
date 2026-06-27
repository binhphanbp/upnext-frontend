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
  // Fallback for fields not yet in this list API schema but used by UI
  employmentType?: { name: string };
  jobPostLocations?: ReadonlyArray<{ jobLocation: { city: string | null } }>;
  publishedAt?: string | null;
  [key: string]: any;
}>;

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

export async function getAdminJobPosts(token: string, limit: number = 100) {
  const response = await apiRequest<AdminJobPostsPaginatedResponse | AdminJobPostResponse[]>(
    `/admin/job-posts?limit=${limit}`,
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
