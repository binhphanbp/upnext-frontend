import { apiRequest } from "@/shared/api/http";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export type KeywordRange = "today" | "week" | "month" | "year" | "custom";

export type TopKeyword = {
  keyword: string;
  normalizedKeyword: string;
  canonicalKeyword: string;
  searchCount: number;
  uniqueUsers: number;
  lastSearchedAt: string;
};

export type ZeroResultKeyword = {
  canonicalKeyword: string;
  keyword: string;
  searchCount: number;
  uniqueVisitors: number;
  lastSearchedAt: string;
};

export type SupplyGapRow = {
  canonicalKeyword: string;
  keyword: string;
  searchCount: number;
  uniqueVisitors: number;
  openJobs: number;
  /** Tên kỹ năng ghép được; null nghĩa là từ khóa không khớp kỹ năng nào nên `openJobs` không có ý nghĩa. */
  matchedSkill: string | null;
};

export type KeywordSummary = {
  searchCount: number;
  uniqueVisitors: number;
  distinctKeywords: number;
  zeroResultSearches: number;
};

export type KeywordOverview = {
  from: string;
  to: string;
  current: KeywordSummary;
  previous: KeywordSummary;
  previousRange: { from: string; to: string };
};

export type KeywordTrendPoint = {
  day: string;
  searchCount: number;
  uniqueVisitors: number;
};

type RangeParams = {
  days?: number | undefined;
  from?: string | undefined;
  to?: string | undefined;
  limit?: number | undefined;
  source?: string | undefined;
};

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getTopKeywords(
  token: string,
  params: { range?: KeywordRange; from?: string; to?: string; limit?: number; source?: string },
) {
  const query = buildQuery({
    // `custom` chỉ tồn tại ở UI; backend suy ra khoảng tùy chọn từ việc có from và to.
    range: params.range === "custom" ? undefined : params.range,
    from: params.from,
    to: params.to,
    limit: params.limit,
    source: params.source,
  });

  return apiRequest<{ range: string; from: string; to: string; items: TopKeyword[] }>(
    `/search-keywords/top${query}`,
    { headers: authHeaders(token) },
  );
}

export function getKeywordOverview(token: string, params: RangeParams) {
  return apiRequest<KeywordOverview>(`/search-keywords/analytics/overview${buildQuery(params)}`, {
    headers: authHeaders(token),
  });
}

export function getZeroResultKeywords(token: string, params: RangeParams) {
  return apiRequest<{ from: string; to: string; items: ZeroResultKeyword[] }>(
    `/search-keywords/analytics/zero-results${buildQuery(params)}`,
    { headers: authHeaders(token) },
  );
}

export function getSupplyGap(token: string, params: RangeParams) {
  return apiRequest<{ from: string; to: string; items: SupplyGapRow[] }>(
    `/search-keywords/analytics/supply-gap${buildQuery(params)}`,
    { headers: authHeaders(token) },
  );
}

export function getKeywordTrend(token: string, params: RangeParams & { keyword?: string }) {
  return apiRequest<{
    from: string;
    to: string;
    keyword: string | null;
    points: KeywordTrendPoint[];
  }>(`/search-keywords/analytics/trend${buildQuery(params)}`, { headers: authHeaders(token) });
}
