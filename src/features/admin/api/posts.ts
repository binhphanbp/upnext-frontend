import { apiRequest } from "@/shared/api/http";

export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type PostType = "BLOG" | "NEWS" | "FAQ";

export type AdminPostFile = Readonly<{
  id: string;
  publicUrl: string | null;
}>;

export type AdminPostCategory = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type AdminPostTag = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type AdminPostResponse = Readonly<{
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  type: PostType;
  categoryId: string | null;
  thumbnailFileId: string | null;
  coverImageFileId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  focusKeyword: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  category?: AdminPostCategory | null;
  admin?: { id: string; fullName: string; email: string; avatarUrl?: string | null } | null;
  thumbnailFile?: AdminPostFile | null;
  coverImageFile?: AdminPostFile | null;
  postTags?: ReadonlyArray<{ tagId: string; tag: AdminPostTag }>;
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

export type CreateAdminPostPayload = {
  title: string;
  content: string;
  status?: PostStatus | undefined;
  type?: PostType | undefined;
  categoryId?: string | null | undefined;
  thumbnailFileId?: string | null | undefined;
  coverImageFileId?: string | null | undefined;
  socialImageFileId?: string | null | undefined;
  thumbnailAlt?: string | undefined;
  coverImageAlt?: string | undefined;
  excerpt?: string | undefined;
  metaTitle?: string | undefined;
  metaDescription?: string | undefined;
  metaKeywords?: string | undefined;
  focusKeyword?: string | undefined;
  tagIds?: string[] | undefined;
};

export type UpdateAdminPostPayload = Partial<CreateAdminPostPayload> & {
  expectedUpdatedAt?: string | undefined;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function jsonAuthHeaders(token: string) {
  return { ...authHeaders(token), "Content-Type": "application/json" };
}

export async function getAdminPosts(token: string, limit: number = 100) {
  const response = await apiRequest<AdminPostsPaginatedResponse | AdminPostResponse[]>(
    `/admin/posts?limit=${limit}`,
    { headers: authHeaders(token) },
  );

  if (Array.isArray(response)) {
    return response;
  }

  if (response && "items" in response && Array.isArray(response.items)) {
    return response.items;
  }

  return [];
}

export function getAdminPostDetails(token: string, id: string) {
  return apiRequest<AdminPostResponse>(`/admin/posts/${id}`, {
    headers: authHeaders(token),
  });
}

export function createAdminPost(token: string, payload: CreateAdminPostPayload) {
  return apiRequest<AdminPostResponse>("/admin/posts", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateAdminPost(token: string, id: string, payload: UpdateAdminPostPayload) {
  return apiRequest<AdminPostResponse>(`/admin/posts/${id}`, {
    method: "PATCH",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function publishAdminPost(token: string, id: string, expectedUpdatedAt: string) {
  return apiRequest<AdminPostResponse>(`/admin/posts/${id}/publish`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ expectedUpdatedAt }),
  });
}

export function archiveAdminPost(token: string, id: string, expectedUpdatedAt: string) {
  return apiRequest<AdminPostResponse>(`/admin/posts/${id}/archive`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ expectedUpdatedAt }),
  });
}

export function deleteAdminPost(token: string, id: string) {
  return apiRequest<void>(`/admin/posts/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function getAdminPostCategories(token: string) {
  return apiRequest<AdminPostCategory[]>("/admin/posts/categories", {
    headers: authHeaders(token),
  });
}

export function getAdminPostTags(token: string) {
  return apiRequest<AdminPostTag[]>("/admin/posts/tags", {
    headers: authHeaders(token),
  });
}

export type UploadedPostImage = Readonly<{
  message: string;
  file: { id: string; publicUrl: string; originalName: string; mimeType: string };
}>;

export function uploadPostImage(
  token: string,
  file: File,
  purpose: "POST_THUMBNAIL" | "POST_COVER",
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);
  formData.append("visibility", "PUBLIC");

  return apiRequest<UploadedPostImage>("/files/upload", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
}
