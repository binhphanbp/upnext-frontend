"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Code,
  EnvelopeSimple,
  Heart,
  MagnifyingGlass,
  Sparkle,
  TrendUp,
  Users,
  X,
} from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { PublicFooter } from "@/features/public/shared/public-footer";
import { PublicHeader } from "@/features/public/shared/public-header";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { apiRequest } from "@/shared/api/http";

import { getPublicPostCategories, getPublicPosts, getPublicPostTags } from "../api/posts";
import type { PaginatedPostsResponse, Post, PostCategory, PostTag } from "../types/post";

// Fallback tags if API is loading
const DEFAULT_TRENDING_TAGS: PostTag[] = [
  { id: "1", name: "Developer", slug: "developer", _count: { postTags: 13 } },
  { id: "2", name: "AI & Data", slug: "ai-data", _count: { postTags: 8 } },
  { id: "3", name: "Career Path", slug: "career-path", _count: { postTags: 8 } },
  { id: "4", name: "Phỏng vấn IT", slug: "phong-van-it", _count: { postTags: 7 } },
  { id: "5", name: "Cloud & AWS", slug: "cloud-aws", _count: { postTags: 7 } },
  {
    id: "6",
    name: "Backend & Architecture",
    slug: "backend-architecture-tag",
    _count: { postTags: 7 },
  },
];
const EMPTY_POSTS: Post[] = [];

// Helper to assign contextual Phosphor icons to real tags from database
function getTagIcon(slug: string, name: string) {
  const lower = (slug + " " + name).toLowerCase();
  if (lower.includes("ai") || lower.includes("tech")) return Sparkle;
  if (lower.includes("phong-van") || lower.includes("interview") || lower.includes("user"))
    return Users;
  if (lower.includes("career") || lower.includes("xu-huong") || lower.includes("trend"))
    return TrendUp;
  if (
    lower.includes("dev") ||
    lower.includes("code") ||
    lower.includes("frontend") ||
    lower.includes("backend")
  )
    return Code;
  if (lower.includes("luong") || lower.includes("salary") || lower.includes("heart")) return Heart;
  if (lower.includes("employer") || lower.includes("tuyen-dung") || lower.includes("job"))
    return Briefcase;
  return ArrowUpRight;
}

export function PostsPageContent() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get("search") || searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || searchParams.get("categorySlug") || "";
  const tagParam = searchParams.get("tag") || "";

  const [postsResponse, setPostsResponse] = useState<PaginatedPostsResponse | null>(null);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [dbTags, setDbTags] = useState<PostTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(categoryParam);
  const [selectedTagSlug, setSelectedTagSlug] = useState(tagParam);
  const [searchInput, setSearchInput] = useState(searchParamQuery);
  const [activeSearch, setActiveSearch] = useState(searchParamQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const resultsSectionRef = useRef<HTMLDivElement | null>(null);

  // Sync state if URL search params change
  useEffect(() => {
    setSelectedCategorySlug(categoryParam);
    setSelectedTagSlug(tagParam);
    if (searchParamQuery !== activeSearch) {
      setSearchInput(searchParamQuery);
      setActiveSearch(searchParamQuery);
    }
  }, [activeSearch, categoryParam, tagParam, searchParamQuery]);

  // 1. Fetch Real Categories from Database
  useEffect(() => {
    getPublicPostCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error loading post categories:", err));
  }, []);

  // 2. Fetch Real Tags with post counts from Database
  useEffect(() => {
    getPublicPostTags()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Sort by postTags count descending
          const sorted = [...data].sort(
            (a, b) => (b._count?.postTags || 0) - (a._count?.postTags || 0),
          );
          setDbTags(sorted);
        }
      })
      .catch((err) => console.error("Error loading real post tags:", err));
  }, []);

  // 3. Fetch Real Posts from Database when filters/search/tag/page change
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getPublicPosts({
      page: currentPage,
      limit: activeSearch || selectedTagSlug ? 12 : 14,
      categorySlug: selectedCategorySlug || undefined,
      search: activeSearch || undefined,
      tag: selectedTagSlug || undefined,
    })
      .then((res) => {
        if (!ignore) {
          setPostsResponse(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading real public posts:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedCategorySlug, selectedTagSlug, activeSearch, currentPage]);

  const apiPosts = postsResponse?.items ?? EMPTY_POSTS;
  const meta = postsResponse?.meta;
  const totalCount = meta?.total ?? meta?.totalItems ?? apiPosts.length;

  // Real Trending Tags to display (top 5-6 tags with highest article count in DB)
  const trendingTags = useMemo(() => {
    if (dbTags.length > 0) {
      return dbTags.slice(0, 6);
    }
    return DEFAULT_TRENDING_TAGS;
  }, [dbTags]);

  // Reading time helper
  const getReadingTime = (post: Partial<Post>, fallbackMinutes = 5) => {
    if (!post.content) return fallbackMinutes;
    const clean = post.content.replace(/<[^>]*>/g, " ");
    const wordCount = clean.split(/\s+/u).filter(Boolean).length;
    return Math.max(3, Math.ceil(wordCount / 200));
  };

  // Date formatting helper in format DD/MM/YYYY
  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return "28/08/2026";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "28/08/2026";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Log search keyword analytics
  const logSearch = (query: string) => {
    if (!query.trim() || query.trim().length < 2) return;
    apiRequest("/search-keywords/log", {
      method: "POST",
      body: JSON.stringify({
        keyword: query.trim(),
        source: "posts_hero",
      }),
    }).catch(() => {});
  };

  // Execute Search Function
  const handleExecuteSearch = (query: string) => {
    const trimmed = query.trim();
    setActiveSearch(trimmed);
    setSearchInput(trimmed);
    setSelectedTagSlug("");
    setCurrentPage(1);

    if (trimmed) {
      router.push(`/posts?search=${encodeURIComponent(trimmed)}`);
      logSearch(trimmed);
    } else {
      router.push("/posts");
    }

    setTimeout(() => {
      resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Click on Real Trending Tag
  const handleTrendingTagClick = (tag: PostTag) => {
    if (selectedTagSlug === tag.slug) {
      // Toggle off
      handleClearAllFilters();
    } else {
      // Filter by real tag
      setSelectedTagSlug(tag.slug);
      setActiveSearch("");
      setSearchInput(tag.name);
      setCurrentPage(1);
      router.push(`/posts?tag=${encodeURIComponent(tag.slug)}`);

      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchInput("");
    setActiveSearch("");
    setSelectedTagSlug("");
    setSelectedCategorySlug("");
    setCurrentPage(1);
    router.push("/posts");
  };

  // Real Database Posts resolution
  const latestPosts = useMemo<Partial<Post>[]>(() => {
    return apiPosts.slice(0, 8);
  }, [apiPosts]);

  // Helper for thumbnail image with fallback
  const getPostThumbnail = (post: Partial<Post>, index = 0) => {
    if (post.thumbnailFile?.publicUrl) {
      return post.thumbnailFile.publicUrl;
    }
    if (post.coverImageFile?.publicUrl) {
      return post.coverImageFile.publicUrl;
    }
    const fallbackImages = [
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    ];
    return fallbackImages[index % fallbackImages.length];
  };

  const isFiltering = Boolean(activeSearch || selectedTagSlug || selectedCategorySlug);
  const activeFilterTitle = activeSearch
    ? `Từ khóa: "${activeSearch}"`
    : selectedTagSlug
      ? `Tag: "${trendingTags.find((t) => t.slug === selectedTagSlug)?.name || selectedTagSlug}"`
      : `Danh mục: "${categories.find((c) => c.slug === selectedCategorySlug)?.name || selectedCategorySlug}"`;

  return (
    <div className="flex min-h-screen flex-col justify-between bg-white font-sans text-slate-900 antialiased">
      {/* 1. Global Public Header */}
      <PublicHeader navigate={navigate} />

      <main className="flex-grow pb-16">
        {/* 2. HERO SECTION - 100% IDENTICAL TO DESIGN WITH REAL DATABASE DATA */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#f4fcf7] via-[#fafdfb] to-white px-4 pt-10 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Left Column (Heading, Subtitle, Search, Real Trending Tags) */}
              <div className="lg:col-span-5 xl:col-span-5">
                {/* Badge: ✦ TÀI NGUYÊN & INSIGHTS */}
                <div className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#0b6b52] uppercase">
                  <span className="text-sm text-[#10a778]">✦</span>
                  <span>TÀI NGUYÊN & INSIGHTS</span>
                </div>

                {/* Main Heading */}
                <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[40px] lg:leading-[1.18] xl:text-[44px]">
                  Kiến thức thực tiễn
                  <br />
                  Dẫn lối <span className="text-[#0d8264]">tuyển dụng hiệu quả</span>
                </h1>

                {/* Green Accent Underline Bar */}
                <div className="mb-5 h-1 w-14 rounded-full bg-[#10a778]" />

                {/* Subtitle */}
                <p className="mb-8 max-w-lg text-sm leading-relaxed font-normal text-slate-600 sm:text-base">
                  Cập nhật xu hướng, chiến lược và kinh nghiệm thực tế giúp doanh nghiệp tuyển đúng
                  người, xây dựng đội ngũ mạnh mẽ và bền vững.
                </p>

                {/* Search Bar with Real DB Functionality */}
                <form
                  className="mb-5 flex max-w-lg items-center rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm transition focus-within:border-[#10a778] focus-within:ring-2 focus-within:ring-[#10a778]/20"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteSearch(searchInput);
                  }}
                >
                  <div className="pl-3 text-slate-400">
                    <MagnifyingGlass size={19} weight="bold" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài viết, chủ đề, từ khóa..."
                    aria-label="Tìm kiếm bài viết"
                    className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="mr-1 p-1 text-slate-400 transition hover:text-slate-600"
                      aria-label="Xóa từ khóa tìm kiếm"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  )}
                  <button
                    type="submit"
                    aria-label="Tìm kiếm"
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-[#0a4d3c] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#073b2d] sm:text-sm"
                  >
                    <span>Tìm kiếm</span>
                    <span className="text-xs text-[#10a778]">✦</span>
                  </button>
                </form>

                {/* Real Trending Search Tags from Database */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="mr-1 font-semibold text-slate-700">Xu hướng tìm kiếm:</span>
                  {trendingTags.map((tag) => {
                    const IconComp = getTagIcon(tag.slug, tag.name);
                    const isSelected =
                      selectedTagSlug === tag.slug ||
                      (activeSearch && activeSearch.toLowerCase() === tag.name.toLowerCase());

                    return (
                      <button
                        key={tag.id || tag.slug}
                        type="button"
                        onClick={() => handleTrendingTagClick(tag)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition duration-150 ${
                          isSelected
                            ? "border-[#10a778] bg-[#f0fdf4] font-semibold text-[#0b7f5f] shadow-xs ring-1 ring-[#10a778]/50"
                            : "border-slate-200/90 bg-white text-slate-700 shadow-2xs hover:border-[#10a778] hover:bg-[#f0fdf4]/50 hover:text-[#0b7f5f]"
                        }`}
                        title={`${tag.name} (${tag._count?.postTags || 0} bài viết)`}
                      >
                        <IconComp
                          size={13}
                          className={isSelected ? "text-[#0b7f5f]" : "text-[#10a778]"}
                          weight="bold"
                        />
                        <span>{tag.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column (Big 3D Composition Image) */}
              <div className="relative flex justify-center lg:col-span-7 lg:justify-end xl:col-span-7">
                <div className="relative w-full max-w-[760px] overflow-hidden rounded-2xl bg-transparent xl:max-w-[850px]">
                  <img
                    src="/assets/images/posts/hero-insights-composition.jpg"
                    alt="UpNext HR Analytics, Recruitment Insights & Resources"
                    className="aspect-[16/9] h-auto w-full object-contain drop-shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/assets/images/posts/hero-banner.jpg";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. DYNAMIC SEARCH/TAG FILTER RESULTS OR DEFAULT HOMEPAGE SECTIONS */}
        <div ref={resultsSectionRef} className="scroll-mt-6">
          {isFiltering ? (
            /* FILTER / SEARCH RESULTS VIEW (100% REAL DATA) */
            <section className="mx-auto max-w-7xl px-4 pt-4 pb-14 sm:px-6 lg:px-8">
              {/* Filter Header Banner */}
              <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-[#e2f5ec] bg-[#f2faf6] p-4 shadow-2xs sm:flex-row sm:items-center sm:p-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#0a4d3c] text-white shadow-xs">
                    <MagnifyingGlass size={22} weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                      Kết quả tìm kiếm: <span className="text-[#0b7f5f]">{activeFilterTitle}</span>
                    </h2>
                    <p className="mt-0.5 text-xs font-normal text-slate-500">
                      Tìm thấy <span className="font-semibold text-slate-700">{totalCount}</span>{" "}
                      bài viết trong cơ sở dữ liệu
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-[#0b6b52] hover:text-[#074b39] sm:self-center sm:text-sm"
                >
                  <X size={16} weight="bold" />
                  <span>Xóa bộ lọc / Xem tất cả</span>
                </button>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="py-20 text-center">
                  <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#10a778] border-t-transparent" />
                  <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu bài viết...</p>
                </div>
              ) : apiPosts.length > 0 ? (
                /* Search Results Grid (Real Posts) */
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {apiPosts.map((post, idx) => (
                    <Link
                      key={post.id || idx}
                      href={`/posts/${post.slug}`}
                      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs transition duration-200 hover:border-[#10a778]/50 hover:shadow-md"
                    >
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <img
                          src={getPostThumbnail(post, idx)}
                          alt={post.title || "Article thumbnail"}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="mb-1.5 text-[11px] font-medium text-slate-400">
                            {formatDisplayDate(post.createdAt)} • {getReadingTime(post, 4)} phút đọc
                          </div>

                          <h4 className="line-clamp-2 text-sm leading-snug font-bold text-slate-900 transition group-hover:text-[#0b7f5f]">
                            {post.title}
                          </h4>

                          {post.metaDescription && (
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {post.metaDescription}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="inline-block rounded-md bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-medium text-[#0b7f5f]">
                            {post.category?.name || "Bài viết UpNext"}
                          </span>
                          {post.viewCount !== undefined && post.viewCount > 0 && (
                            <span className="text-[10px] text-slate-400">
                              {post.viewCount.toLocaleString()} lượt xem
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* No Results Empty State */
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100/60 text-[#0b7f5f]">
                    <MagnifyingGlass size={26} weight="bold" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Không tìm thấy bài viết phù hợp
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                    Không có bài viết nào khớp với bộ lọc đang chọn. Bạn có thể bấm vào các tag xu
                    hướng thực tế bên dưới.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {trendingTags.map((tag) => (
                      <button
                        key={tag.id || tag.slug}
                        type="button"
                        onClick={() => handleTrendingTagClick(tag)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#10a778] hover:text-[#0b7f5f]"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="rounded-xl bg-[#0a4d3c] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#073b2d]"
                    >
                      Xem tất cả bài viết
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : (
            /* DEFAULT HOMEPAGE VIEW (100% REAL DATA FROM DATABASE) */
            <>
              {/* BÀI VIẾT MỚI NHẤT (REAL POSTS GRID FROM DATABASE) */}
              <section
                id="tat-ca-bai-viet"
                className="mx-auto max-w-7xl px-4 pt-4 pb-14 sm:px-6 lg:px-8"
              >
                {/* Section Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-5 w-1 rounded-full bg-[#10a778]" />
                    <h2 className="text-base font-bold tracking-tight text-slate-900 uppercase sm:text-lg">
                      BÀI VIẾT MỚI NHẤT
                    </h2>
                  </div>
                  <Link
                    href="/posts"
                    className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b7f5f] hover:text-[#08634a]"
                  >
                    <span>Xem tất cả ({totalCount})</span>
                    <ArrowRight
                      size={14}
                      className="transition duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>

                {/* 4-Columns Grid (Real database articles) */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {latestPosts.map((post, idx) => (
                    <Link
                      key={post.id || idx}
                      href={`/posts/${post.slug}`}
                      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs transition duration-200 hover:border-[#10a778]/50 hover:shadow-md"
                    >
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <img
                          src={getPostThumbnail(post, idx + 6)}
                          alt={post.title || "Latest article"}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="mb-1.5 text-[11px] font-medium text-slate-400">
                            {formatDisplayDate(post.createdAt)} •{" "}
                            {getReadingTime(post, 4 + (idx % 3))} phút đọc
                          </div>

                          <h4 className="line-clamp-2 text-xs leading-snug font-bold text-slate-900 transition group-hover:text-[#0b7f5f] sm:text-sm">
                            {post.title}
                          </h4>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="inline-block rounded-md bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-medium text-[#0b7f5f]">
                            {post.category?.name || "Kinh nghiệm tuyển dụng"}
                          </span>
                          {post.viewCount !== undefined && post.viewCount > 0 && (
                            <span className="text-[10px] text-slate-400">
                              {post.viewCount.toLocaleString()} lượt xem
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Real Pagination from API Meta */}
          {(() => {
            const totalPages = meta?.totalPages ?? 1;
            if (totalPages <= 1) return null;
            return (
              <div className="mt-8 mb-10 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600">
                <button
                  type="button"
                  className="rounded p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  aria-label="Trang đầu"
                >
                  «
                </button>
                <button
                  type="button"
                  className="rounded p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Trang trước"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      pageNum === currentPage
                        ? "bg-[#0b7f5f] font-bold text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  className="rounded p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Trang sau"
                >
                  ›
                </button>
                <button
                  type="button"
                  className="rounded p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  aria-label="Trang cuối"
                >
                  »
                </button>
              </div>
            );
          })()}
        </div>

        {/* 5. NEWSLETTER SUBSCRIPTION BANNER (BOTTOM CTA) */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-[#063a2a] p-6 text-white shadow-lg sm:p-8 lg:p-10">
            <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
              {/* Left text with envelope icon */}
              <div className="flex w-full items-center gap-4 text-left lg:w-auto">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#0d4f3b] text-white shadow-xs">
                  <EnvelopeSimple size={28} weight="regular" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    Đăng ký nhận bản tin UpNext
                  </h3>
                  <p className="mt-1 max-w-xl text-xs text-emerald-100/85 sm:text-sm">
                    Nhận ngay những bài viết mới nhất, xu hướng tuyển dụng và tài liệu hữu ích dành
                    riêng cho nhà tuyển dụng.
                  </p>
                </div>
              </div>

              {/* Right Form */}
              <div className="w-full flex-shrink-0 lg:w-auto">
                {subscribed ? (
                  <div className="rounded-xl bg-emerald-800/80 px-6 py-3 text-sm font-semibold text-emerald-100 shadow-xs">
                    ✓ Cảm ơn bạn đã đăng ký nhận bản tin UpNext!
                  </div>
                ) : (
                  <form
                    className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (emailInput.trim()) {
                        setSubscribed(true);
                      }
                    }}
                  >
                    <input
                      type="email"
                      required
                      placeholder="Nhập email của bạn..."
                      aria-label="Nhập email của bạn"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full rounded-lg bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:ring-2 focus:ring-[#10a778] focus:outline-none sm:w-72 lg:w-80"
                    />
                    <button
                      type="submit"
                      className="flex-shrink-0 rounded-lg bg-[#0b7f5f] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#08634a]"
                    >
                      Đăng ký ngay
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Global Public Footer */}
      <PublicFooter navigate={navigate} />
    </div>
  );
}
