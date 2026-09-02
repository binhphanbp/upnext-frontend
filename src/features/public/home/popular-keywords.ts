import { apiRequest } from "@/shared/api/http";

export type PopularKeywordLocale = "vi" | "en";

/** Chỗ hiển thị chip — trang chủ và trang việc làm dùng hai danh sách khác nhau. */
export type PopularKeywordPlacement = "HOME_HERO" | "JOBS_SEARCH";

export type PopularKeywordCategory = "skill" | "role" | "location" | "level" | "work-mode";

export type PopularKeyword = {
  label: string;
  shortLabel?: string;
  query: string;
  locale: PopularKeywordLocale;
  priority: number;
  category?: PopularKeywordCategory;
};

type NormalizeOptions = {
  locale: PopularKeywordLocale;
  fallback: PopularKeyword[];
  limit?: number;
};

type SlideOptions = {
  itemsPerSlide: number;
};

/**
 * Chỉ dùng khi API chưa trả về: giữ chip hiện ngay lúc trang mở và đỡ trường hợp API lỗi.
 *
 * Nguồn thật là bảng `popular_search_keywords` ở backend
 * (`prisma/data/popular-search-keywords.json` + `scripts/seed-popular-keywords.ts`).
 * Sửa danh sách thì sửa ở đó, không sửa ở đây.
 */
export const fallbackPopularKeywords: PopularKeyword[] = [
  { label: "Frontend", query: "Frontend", locale: "vi", priority: 10, category: "role" },
  { label: "Backend", query: "Backend", locale: "vi", priority: 20, category: "role" },
  { label: "DevOps", query: "DevOps", locale: "vi", priority: 30, category: "role" },
  { label: "AI Engineer", query: "AI Engineer", locale: "vi", priority: 40, category: "role" },
  { label: "Data", query: "Data", locale: "vi", priority: 50, category: "skill" },
  { label: "UI/UX", query: "UI/UX", locale: "vi", priority: 60, category: "skill" },
  { label: "React", query: "React", locale: "vi", priority: 70, category: "skill" },
  { label: "Node.js", query: "Node.js", locale: "vi", priority: 80, category: "skill" },
  { label: "Java", query: "Java", locale: "vi", priority: 90, category: "skill" },
  { label: "Python", query: "Python", locale: "vi", priority: 100, category: "skill" },
  { label: "Golang", query: "Golang", locale: "vi", priority: 110, category: "skill" },
  {
    label: "QA Automation",
    shortLabel: "QA",
    query: "QA Automation",
    locale: "vi",
    priority: 120,
    category: "role",
  },
  { label: "Remote", query: "Remote", locale: "vi", priority: 130, category: "work-mode" },
  { label: "Hybrid", query: "Hybrid", locale: "vi", priority: 140, category: "work-mode" },
  { label: "Fresher", query: "Fresher", locale: "vi", priority: 150, category: "level" },
  { label: "Senior", query: "Senior", locale: "vi", priority: 160, category: "level" },
  { label: "Product", query: "Product", locale: "vi", priority: 170, category: "role" },
  { label: "Fintech", query: "Fintech", locale: "vi", priority: 180, category: "skill" },
  { label: "AWS", query: "AWS", locale: "vi", priority: 190, category: "skill" },
  {
    label: "Kubernetes",
    shortLabel: "K8s",
    query: "Kubernetes",
    locale: "vi",
    priority: 200,
    category: "skill",
  },
  { label: "Mobile", query: "Mobile", locale: "vi", priority: 210, category: "role" },
  {
    label: "Business Analyst",
    shortLabel: "BA",
    query: "Business Analyst",
    locale: "vi",
    priority: 220,
    category: "role",
  },
  { label: "Security", query: "Security", locale: "vi", priority: 230, category: "skill" },
  { label: "Cloud", query: "Cloud", locale: "vi", priority: 240, category: "skill" },
  { label: "Frontend", query: "Frontend", locale: "en", priority: 10, category: "role" },
  { label: "Backend", query: "Backend", locale: "en", priority: 20, category: "role" },
  { label: "DevOps", query: "DevOps", locale: "en", priority: 30, category: "role" },
  { label: "AI Engineer", query: "AI Engineer", locale: "en", priority: 40, category: "role" },
  { label: "Data", query: "Data", locale: "en", priority: 50, category: "skill" },
  { label: "UI/UX", query: "UI/UX", locale: "en", priority: 60, category: "skill" },
  { label: "React", query: "React", locale: "en", priority: 70, category: "skill" },
  { label: "Node.js", query: "Node.js", locale: "en", priority: 80, category: "skill" },
  { label: "Java", query: "Java", locale: "en", priority: 90, category: "skill" },
  { label: "Python", query: "Python", locale: "en", priority: 100, category: "skill" },
  { label: "Golang", query: "Golang", locale: "en", priority: 110, category: "skill" },
  {
    label: "QA Automation",
    shortLabel: "QA",
    query: "QA Automation",
    locale: "en",
    priority: 120,
    category: "role",
  },
  { label: "Remote", query: "Remote", locale: "en", priority: 130, category: "work-mode" },
  { label: "Hybrid", query: "Hybrid", locale: "en", priority: 140, category: "work-mode" },
  { label: "Fresher", query: "Fresher", locale: "en", priority: 150, category: "level" },
  { label: "Senior", query: "Senior", locale: "en", priority: 160, category: "level" },
  { label: "Product", query: "Product", locale: "en", priority: 170, category: "role" },
  { label: "Fintech", query: "Fintech", locale: "en", priority: 180, category: "skill" },
  { label: "AWS", query: "AWS", locale: "en", priority: 190, category: "skill" },
  {
    label: "Kubernetes",
    shortLabel: "K8s",
    query: "Kubernetes",
    locale: "en",
    priority: 200,
    category: "skill",
  },
  { label: "Mobile", query: "Mobile", locale: "en", priority: 210, category: "role" },
  {
    label: "Business Analyst",
    shortLabel: "BA",
    query: "Business Analyst",
    locale: "en",
    priority: 220,
    category: "role",
  },
  { label: "Security", query: "Security", locale: "en", priority: 230, category: "skill" },
  { label: "Cloud", query: "Cloud", locale: "en", priority: 240, category: "skill" },
];

export function normalizePopularKeywords(
  keywords: readonly PopularKeyword[],
  { locale, fallback, limit = 24 }: NormalizeOptions,
) {
  const source = keywords.length > 0 ? keywords : fallback;
  const seen = new Set<string>();

  return source
    .filter((keyword) => keyword.locale === locale)
    .filter((keyword) => keyword.label.trim() && keyword.query.trim())
    .sort((left, right) => left.priority - right.priority)
    .filter((keyword) => {
      const key = keyword.query.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function getPopularKeywordsForLocale(locale: PopularKeywordLocale, limit = 24) {
  return normalizePopularKeywords(fallbackPopularKeywords, {
    locale,
    fallback: fallbackPopularKeywords,
    limit,
  });
}

export function buildPopularKeywordSlides(
  keywords: readonly PopularKeyword[],
  { itemsPerSlide }: SlideOptions,
) {
  const slides: PopularKeyword[][] = [];

  for (let index = 0; index < keywords.length; index += itemsPerSlide) {
    slides.push(keywords.slice(index, index + itemsPerSlide));
  }

  if (slides.length > 0) {
    slides.push(slides[0]!);
  }

  return slides;
}

type PopularKeywordApiItem = {
  label: string;
  shortLabel: string | null;
  query: string;
  priority: number;
  category: string | null;
};

/**
 * Lấy chip từ backend. Trả về mảng rỗng khi lỗi hoặc chưa có dữ liệu, để chỗ gọi tự
 * quyết định dùng `fallbackPopularKeywords` — chip là phần trang trí điều hướng, không
 * đáng để một API lỗi làm hỏng cả ô tìm kiếm.
 */
export async function fetchPopularKeywords(
  placement: PopularKeywordPlacement,
  locale: PopularKeywordLocale,
  limit = 24,
): Promise<PopularKeyword[]> {
  try {
    const response = await apiRequest<{ items: PopularKeywordApiItem[] }>(
      `/search-keywords/popular?placement=${placement}&locale=${locale}&limit=${limit}`,
    );

    return response.items.map((item) => ({
      label: item.label,
      ...(item.shortLabel ? { shortLabel: item.shortLabel } : {}),
      query: item.query,
      locale,
      priority: item.priority,
      ...(item.category ? { category: item.category as PopularKeywordCategory } : {}),
    }));
  } catch {
    return [];
  }
}
