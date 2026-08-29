export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type PostType = "BLOG" | "NEWS" | "FAQ";

export type FileAsset = {
  id: string;
  purpose: string;
  visibility: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  publicUrl?: string | null;
};

export type PostCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: PostCategory | null;
  children?: PostCategory[];
};

export type PostTag = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    postTags: number;
  };
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  type: PostType;
  categoryId?: string | null;
  category?: PostCategory | null;
  adminId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  thumbnailFile?: FileAsset | null;
  coverImageFile?: FileAsset | null;
  postTags?: { tag: PostTag }[];
};

export type PublicPostsQuery = {
  page?: number;
  limit?: number;
  search?: string | undefined;
  categorySlug?: string | undefined;
  categoryId?: string | undefined;
  tag?: string | undefined;
};

export type PaginatedPostsResponse = {
  items: Post[];
  meta: {
    totalItems?: number;
    itemCount?: number;
    itemsPerPage?: number;
    totalPages?: number;
    currentPage?: number;
    total?: number;
    page?: number;
    limit?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};
