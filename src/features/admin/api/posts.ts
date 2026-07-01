import { apiRequest } from "@/shared/api/http";

export type AdminPostResponse = Readonly<{
  id: string;
  title: string;
  status: string;
  author?: {
    id: string;
    profile?: {
      fullName: string;
    };
    email?: string;
  };
  categories?: ReadonlyArray<{
    postCategory?: {
      name: string;
    };
  }>;
  views?: number;
  content?: string;
  publishedAt?: string | null;
  createdAt?: string;
  [key: string]: any;
}>;

export type AdminPostsPaginatedResponse = Readonly<{
  items: AdminPostResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}>;

export async function getAdminPosts(token: string, limit: number = 100) {
  const response = await apiRequest<AdminPostsPaginatedResponse | AdminPostResponse[]>(
    `/admin/posts?limit=${limit}`,
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

export async function updateAdminPost(token: string, id: string, data: any) {
  return apiRequest<AdminPostResponse>(`/admin/posts/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteAdminPost(token: string, id: string) {
  return apiRequest<void>(`/admin/posts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminPostDetails(token: string, id: string) {
  return apiRequest<AdminPostResponse>(`/admin/posts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
