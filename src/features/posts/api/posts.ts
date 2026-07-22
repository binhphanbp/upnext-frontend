import { apiRequest } from "@/shared/api/http";

import type {
  PaginatedPostsResponse,
  Post,
  PostCategory,
  PostTag,
  PublicPostsQuery,
} from "../types/post";

export async function getPublicPosts(
  query: PublicPostsQuery = {},
): Promise<PaginatedPostsResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.categorySlug) params.set("categorySlug", query.categorySlug);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.tag) params.set("tag", query.tag);

  const queryString = params.toString();
  return apiRequest<PaginatedPostsResponse>(`/posts${queryString ? `?${queryString}` : ""}`);
}

export async function getPublicPostBySlug(slug: string): Promise<Post> {
  return apiRequest<Post>(`/posts/by-slug/${encodeURIComponent(slug)}`);
}

export async function getPublicPostCategories(): Promise<PostCategory[]> {
  return apiRequest<PostCategory[]>("/posts/categories");
}

export async function getPublicPostTags(): Promise<PostTag[]> {
  return apiRequest<PostTag[]>("/posts/tags");
}
