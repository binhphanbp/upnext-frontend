import { apiRequest } from "@/shared/api/http";

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export type TaxonomyStats = {
  totalSkills: number;
  activeSkills: number;
  totalSkillCategories: number;
  totalJobCategories: number;
  activeJobCategories: number;
};

export type SkillCategoryItem = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    skills: number;
  };
};

export type SkillItem = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: SkillCategoryItem | null;
  _count?: {
    jobPostSkills: number;
    candidateSkills: number;
  };
};

export type JobCategoryItem = {
  id: string;
  name: string;
  sortOrder: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    jobPosts: number;
  };
};

export type AdminSkillsResponse = {
  items: SkillItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export function getTaxonomyStats(token: string): Promise<TaxonomyStats> {
  return apiRequest<TaxonomyStats>("/skills/stats", {
    headers: authHeaders(token),
  });
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export function getAdminSkills(
  token: string,
  params?: {
    page?: number | undefined;
    limit?: number | undefined;
    q?: string | undefined;
    categoryId?: string | undefined;
    isActive?: boolean | undefined;
  },
): Promise<AdminSkillsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.q) query.set("q", params.q);
  if (params?.categoryId && params.categoryId !== "all") {
    query.set("categoryId", params.categoryId);
  }
  if (params?.isActive !== undefined) {
    query.set("isActive", String(params.isActive));
  }

  const qs = query.toString();
  return apiRequest<AdminSkillsResponse>(`/skills/admin${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(token),
  });
}

export function createSkill(
  token: string,
  data: {
    name: string;
    categoryId?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
  },
): Promise<SkillItem> {
  return apiRequest<SkillItem>("/skills", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function updateSkill(
  token: string,
  id: string,
  data: Partial<{
    name: string;
    categoryId: string | null | undefined;
    description: string | null | undefined;
    isActive: boolean | undefined;
  }>,
): Promise<SkillItem> {
  return apiRequest<SkillItem>(`/skills/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function deleteSkill(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/skills/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ─── Skill Categories ────────────────────────────────────────────────────────

export function getSkillCategories(): Promise<SkillCategoryItem[]> {
  return apiRequest<SkillCategoryItem[]>("/skill-categories");
}

export function createSkillCategory(
  token: string,
  data: {
    name: string;
    description?: string | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
  },
): Promise<SkillCategoryItem> {
  return apiRequest<SkillCategoryItem>("/skill-categories", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function updateSkillCategory(
  token: string,
  id: string,
  data: Partial<{
    name: string;
    description: string | null | undefined;
    sortOrder: number | undefined;
    isActive: boolean | undefined;
  }>,
): Promise<SkillCategoryItem> {
  return apiRequest<SkillCategoryItem>(`/skill-categories/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function deleteSkillCategory(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/skill-categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ─── Job Categories ──────────────────────────────────────────────────────────

export function getJobCategories(): Promise<JobCategoryItem[]> {
  return apiRequest<JobCategoryItem[]>("/job-categories");
}

export function createJobCategory(
  token: string,
  data: {
    name: string;
    description?: string | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
  },
): Promise<JobCategoryItem> {
  return apiRequest<JobCategoryItem>("/job-categories", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function updateJobCategory(
  token: string,
  id: string,
  data: Partial<{
    name: string;
    description: string | null | undefined;
    sortOrder: number | undefined;
    isActive: boolean | undefined;
  }>,
): Promise<JobCategoryItem> {
  return apiRequest<JobCategoryItem>(`/job-categories/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function deleteJobCategory(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/job-categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
