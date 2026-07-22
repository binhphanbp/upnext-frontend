"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PublicFooter } from "@/features/public/shared/public-footer";
import { PublicHeader } from "@/features/public/shared/public-header";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";

import { getPublicPostCategories, getPublicPosts } from "../api/posts";
import type { PaginatedPostsResponse, Post, PostCategory } from "../types/post";

export function PostsPageContent() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || searchParams.get("categorySlug") || "";

  const [postsResponse, setPostsResponse] = useState<PaginatedPostsResponse | null>(null);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [subscribed, setSubscribed] = useState(false);

  // Sync state if categoryParam changes from header navigation
  useEffect(() => {
    setSelectedCategorySlug(categoryParam);
  }, [categoryParam]);

  // Fetch Categories
  useEffect(() => {
    getPublicPostCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error loading post categories:", err));
  }, []);

  // Fetch Posts when filters change
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getPublicPosts({
      page: currentPage,
      limit: 7, // 1 featured + 6 grid items per page
      categorySlug: selectedCategorySlug || undefined,
      search: searchQuery || undefined,
    })
      .then((res) => {
        if (!ignore) {
          setPostsResponse(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading public posts:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedCategorySlug, searchQuery, currentPage]);

  const posts = postsResponse?.items || [];
  const meta = postsResponse?.meta;

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const gridPosts =
    posts.length > 0 ? (selectedCategorySlug || searchQuery ? posts : posts.slice(1)) : [];
  const popularPosts = posts.slice(0, 3);

  // Format Helper for Date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Jul 21, 2026";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper for Reading Time
  const getReadingTime = (content?: string) => {
    const wordCount = content ? content.split(/\s+/u).length : 120;
    return Math.max(3, Math.ceil(wordCount / 200));
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/50 text-slate-900 antialiased">
      {/* Shared Public Header */}
      <PublicHeader navigate={navigate} />

      <main className="flex-grow">
        {/* HERO BANNER SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 to-transparent px-4 py-12">
          {/* Decorative background elements */}
          <div className="pointer-events-none absolute -top-12 left-1/4 h-32 w-32 rounded-full border-4 border-teal-200 opacity-40" />
          <div className="pointer-events-none absolute top-8 right-1/4 h-16 w-16 rotate-45 rounded-lg bg-purple-200/50" />

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <p className="mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              UPNEXT BLOGS
            </p>
            <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Your Key to Learning
            </h1>

            {/* Search Bar & Dropdown */}
            <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:flex-row">
              <select
                className="w-full cursor-pointer border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 focus:outline-none sm:w-auto sm:border-r sm:border-b-0"
                value={selectedCategorySlug}
                onChange={(e) => {
                  setSelectedCategorySlug(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Categories (All)</option>
                <option value="blog-upnext">Blog UpNext</option>
                <option value="su-nghiep-it">Sự nghiệp IT</option>
                <option value="chuyen-mon-it">Chuyên môn IT</option>
                {categories
                  .filter((c) => !["blog-upnext", "su-nghiep-it", "chuyen-mon-it"].includes(c.slug))
                  .map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
              </select>

              <div className="relative w-full flex-1">
                <input
                  type="text"
                  placeholder="Search Blogs"
                  className="w-full px-4 py-2.5 text-sm text-slate-800 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Search"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Loading Spinner */}
        {loading ? (
          <div className="mx-auto max-w-7xl px-4 py-24 text-center">
            <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading articles...</p>
          </div>
        ) : (
          <>
            {/* FEATURED SECTION & SIDEBAR */}
            <section className="mx-auto max-w-7xl px-4 py-8">
              <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
                {/* Featured Main Post (Left - 2 Cols) */}
                {featuredPost ? (
                  <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                    <div className="group relative aspect-video overflow-hidden bg-indigo-900">
                      <img
                        src={
                          featuredPost.thumbnailFile?.publicUrl ||
                          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80"
                        }
                        alt={featuredPost.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80";
                        }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                      <div>
                        <h2 className="mb-4 cursor-pointer text-2xl font-bold text-slate-900 transition hover:text-teal-600">
                          <Link href={`/posts/${featuredPost.slug}`}>{featuredPost.title}</Link>
                        </h2>
                        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                            U
                          </div>
                          <span className="font-medium text-slate-700">UpNext Editorial</span>
                          <span>•</span>
                          <span>{getReadingTime(featuredPost.content)} min read</span>
                          <span>•</span>
                          <span>{formatDate(featuredPost.createdAt)}</span>
                        </div>
                      </div>
                      <div>
                        <Link
                          href={`/posts/${featuredPost.slug}`}
                          className="inline-flex items-center gap-2 rounded-md bg-[#10a778] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0b7f5f]"
                        >
                          Read article
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 lg:col-span-2">
                    No featured articles found.
                  </div>
                )}

                {/* Right Sidebar (Updates & Popular) */}
                <div className="flex flex-col gap-6">
                  {/* Subscribe Card */}
                  <div
                    className="relative flex-shrink-0 overflow-hidden rounded-2xl border border-[#e1f5eb] bg-cover bg-center bg-no-repeat p-6 shadow-xs"
                    style={{ backgroundImage: "url('/assets/images/newsletter-bg.png')" }}
                  >
                    {/* Circle Mail Icon */}
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white text-[#10a778] shadow-xs">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>

                    <h3 className="mb-1 text-base leading-snug font-bold text-slate-900 md:text-lg">
                      Đừng bỏ lỡ những cập nhật mới nhất
                    </h3>
                    <p className="mb-4 text-xs leading-relaxed text-slate-600">
                      Nhận thông tin hữu ích và bài viết mới nhất từ UpNext.
                    </p>

                    {subscribed ? (
                      <div className="mb-3 rounded-xl bg-emerald-100 p-3 text-xs font-medium text-emerald-900">
                        ✓ Cảm ơn bạn đã đăng ký nhận bản tin từ UpNext!
                      </div>
                    ) : (
                      <form
                        className="mb-3 flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setSubscribed(true);
                        }}
                      >
                        <input
                          type="email"
                          placeholder="Email của bạn"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-2xs focus:border-[#10a778] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="flex-shrink-0 rounded-xl bg-[#10a778] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b7f5f]"
                        >
                          Đăng ký
                        </button>
                      </form>
                    )}

                    <button
                      type="button"
                      className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-[#10a778] hover:underline"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + "/rss.xml");
                        alert("Đã sao chép đường dẫn RSS feed vào bộ nhớ tạm!");
                      }}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="6.18" cy="17.82" r="2.18" />
                        <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
                      </svg>
                      Sao chép RSS feed
                    </button>
                  </div>

                  {/* Popular Articles Widget */}
                  <div className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div>
                      <h3 className="mb-1 text-base font-bold text-slate-900 md:text-lg">
                        Bài viết phổ biến
                      </h3>
                      {/* Short Green Accent Line */}
                      <div className="mb-5 h-1 w-8 rounded-full bg-[#10a778]" />

                      {/* Popular Posts List */}
                      <div className="space-y-4">
                        {popularPosts.map((popPost, idx) => (
                          <div
                            key={popPost.id}
                            className={
                              idx < popularPosts.length - 1 ? "border-b border-slate-100 pb-4" : ""
                            }
                          >
                            <Link href={`/posts/${popPost.slug}`} className="group flex gap-3.5">
                              <div className="h-18 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-xs">
                                <img
                                  src={
                                    popPost.thumbnailFile?.publicUrl ||
                                    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=120&q=80"
                                  }
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                  alt={popPost.title}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=120&q=80";
                                  }}
                                />
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                                <h4 className="mb-1.5 line-clamp-2 text-xs leading-snug font-bold text-slate-900 transition group-hover:text-[#10a778] md:text-sm">
                                  {popPost.title}
                                </h4>
                                <div className="text-[11px] font-medium text-slate-400">
                                  {getReadingTime(popPost.content)} min read
                                </div>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Button: Xem tất cả bài viết */}
                    <div className="mt-5 pt-3">
                      <Link
                        href="/posts"
                        className="group flex w-full items-center justify-between rounded-xl bg-[#f0fdf4] px-4 py-2.5 text-xs font-bold text-[#0b7f5f] shadow-2xs transition hover:bg-[#dcfce7]"
                      >
                        <span>Xem tất cả bài viết</span>
                        <svg
                          className="h-4 w-4 text-[#10a778] transition group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* EXPLORE MORE ARTICLES (GRID 3 COLUMNS) */}
            <section className="mx-auto max-w-7xl px-4 py-8">
              <h3 className="mb-6 text-lg font-bold text-slate-900">Explore More Articles</h3>

              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative aspect-video overflow-hidden bg-slate-900">
                        <img
                          src={
                            post.thumbnailFile?.publicUrl ||
                            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80"
                          }
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          alt={post.title}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80";
                          }}
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <div className="mb-2 text-[11px] text-slate-400">
                            {getReadingTime(post.content)} min read • {formatDate(post.createdAt)}
                          </div>
                          <h4 className="mb-4 line-clamp-3 cursor-pointer text-sm font-bold text-slate-900 transition hover:text-[#10a778]">
                            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ecfdf5] text-[10px] font-bold text-[#0b7f5f]">
                            {(post.category?.name || "U")[0]}
                          </div>
                          <span>{post.category?.name || "UpNext Blog"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                  No articles found in this category.
                </div>
              )}

              {/* PAGINATION */}
              {meta && meta.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    className="rounded p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    aria-label="First page"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    className="rounded p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>

                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`flex h-7 w-7 items-center justify-center rounded transition ${
                        pageNum === currentPage
                          ? "bg-slate-900 font-bold text-white"
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
                    disabled={currentPage === meta.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="rounded p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                    disabled={currentPage === meta.totalPages}
                    onClick={() => setCurrentPage(meta.totalPages)}
                    aria-label="Last page"
                  >
                    »
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Shared Public Footer */}
      <PublicFooter navigate={navigate} />
    </div>
  );
}
