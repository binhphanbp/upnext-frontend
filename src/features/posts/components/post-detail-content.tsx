"use client";

import { useEffect, useState } from "react";

import { PublicFooter } from "@/features/public/shared/public-footer";
import { PublicHeader } from "@/features/public/shared/public-header";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";

import { getPublicPostBySlug, getPublicPosts } from "../api/posts";
import { DEFAULT_POST_COVER_URL, getPostCover } from "../post-cover";
import type { Post } from "../types/post";
import { PostCard } from "./post-card";

import "./posts.css";

type PostDetailContentProps = {
  slug: string;
};

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

function parseTocHeadings(htmlContent: string): { cleanedHtml: string; tocItems: TocItem[] } {
  const tocItems: TocItem[] = [];
  let itemCounter = 0;

  // 1. Strip out any raw WordPress ez-toc or residual toggle widget markup
  let html = htmlContent.replace(
    /<div[^>]*class="[^"]*(?:ez-toc|table-of-contents|toc|ct-toc)[^"]*"[\s\S]*?<\/div>/gi,
    "",
  );
  html = html.replace(/<nav[^>]*class="[^"]*(?:toc|table-of-contents)[^"]*"[\s\S]*?<\/nav>/gi, "");
  html = html.replace(/Nội dung bài viết[\s\S]*?Toggle[\s\S]*?(?=<h[1-6]|<p|<figure)/gi, "");
  html = html.replace(/^[\s\S]*?Toggle\s*/i, "");

  // 2. Inject unique IDs into h2/h3 headings and build TOC items
  const cleanedHtml = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, levelStr, attrs, innerText) => {
      itemCounter++;
      const level = parseInt(levelStr, 10);
      const plainText = innerText
        .replace(/<[^>]+>/g, "")
        .replace(/&#8220;/g, "“")
        .replace(/&#8221;/g, "”")
        .replace(/&amp;/g, "&")
        .trim();

      const id = `toc-heading-${itemCounter}`;

      if (plainText) {
        tocItems.push({ id, text: plainText, level });
      }

      const hasId = /id="[^"]*"/i.test(attrs);
      const updatedAttrs = hasId ? attrs : ` id="${id}" ${attrs}`;
      return `<h${levelStr}${updatedAttrs}>${innerText}</h${levelStr}>`;
    },
  );

  return { cleanedHtml, tocItems };
}

export function PostDetailContent({ slug }: PostDetailContentProps) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    getPublicPostBySlug(slug)
      .then((data) => {
        if (!ignore) {
          setPost(data);
          setLoading(false);

          // Fetch related posts from same category
          if (data.categoryId) {
            getPublicPosts({ categoryId: data.categoryId, limit: 4 })
              .then((res) => {
                if (!ignore) {
                  setRelatedPosts(res.items.filter((p) => p.slug !== slug).slice(0, 3));
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch((err) => {
        console.error("Error loading post detail:", err);
        if (!ignore) {
          setError("Không tìm thấy bài viết hoặc bài viết đã bị xóa.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  const formattedDate = post
    ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const wordCount = post?.content ? post.content.split(/\s+/u).length : 100;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const categoryName = post?.category?.name || "Bài viết UpNext";
  const cover = post ? getPostCover(post) : { src: DEFAULT_POST_COVER_URL, isFallback: true };

  const [isTocOpen, setIsTocOpen] = useState(true);

  // Parse Headings for Table of Contents (EZ-TOC)
  const { cleanedHtml, tocItems } = post?.content
    ? parseTocHeadings(post.content)
    : { cleanedHtml: "", tocItems: [] };

  // Attach interactive Copy buttons to code blocks (<pre>) when content renders
  useEffect(() => {
    if (!post || !cleanedHtml) return;

    const timer = setTimeout(() => {
      const preElements = document.querySelectorAll(".post-detail-content pre");
      preElements.forEach((pre) => {
        if (pre.querySelector(".code-copy-btn")) return;

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "code-copy-btn";
        copyBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Sao chép</span>
        `;

        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const codeElement = pre.querySelector("code") || pre;
          const textToCopy = Array.from(codeElement.childNodes)
            .filter((node) => node !== copyBtn && !copyBtn.contains(node))
            .map((node) => node.textContent)
            .join("");

          navigator.clipboard.writeText(textToCopy.trim()).then(() => {
            copyBtn.innerHTML = `
              <svg class="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-teal-400">Đã chép!</span>
            `;
            setTimeout(() => {
              copyBtn.innerHTML = `
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Sao chép</span>
              `;
            }, 2000);
          });
        });

        pre.appendChild(copyBtn);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [post, cleanedHtml]);

  const handleScrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50/50 text-slate-900 antialiased">
      <PublicHeader navigate={navigate} />

      <main className="mx-auto w-full max-w-5xl flex-grow px-4 py-12">
        {loading ? (
          <div className="py-24 text-center">
            <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            <p className="font-medium text-slate-500">Đang tải nội dung bài viết...</p>
          </div>
        ) : error || !post ? (
          <div className="py-24 text-center">
            <h2 className="mb-3 text-2xl font-bold text-slate-800">Rất tiếc!</h2>
            <p className="mb-6 text-slate-600">{error || "Bài viết không tồn tại."}</p>
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 rounded-md bg-[#10a778] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b7f5f]"
            >
              Quay lại danh sách bài viết
            </Link>
          </div>
        ) : (
          <article className="post-detail-container">
            {/* Breadcrumb */}
            <nav className="post-breadcrumb mb-6 flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:underline">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/posts" className="hover:underline">
                Bài viết
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-900">{categoryName}</span>
            </nav>

            {/* Article Header */}
            <header className="post-detail-header mb-8">
              <span className="mb-4 inline-block rounded border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-1 text-xs font-bold tracking-wider text-[#0b7f5f] uppercase">
                {categoryName}
              </span>
              <h1 className="post-detail-title mb-4 text-3xl leading-tight font-extrabold text-slate-900 md:text-4xl">
                {post.title}
              </h1>

              <div className="post-detail-meta flex items-center gap-3 text-xs text-slate-500">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10a778] text-xs font-bold text-white">
                  U
                </div>
                <span className="font-semibold text-slate-800">UpNext Editorial Team</span>
                <span>•</span>
                <span>{formattedDate}</span>
                <span>•</span>
                <span>{readingTimeMinutes} phút đọc</span>
                {typeof post.viewCount === "number" && (
                  <>
                    <span>•</span>
                    <span>{post.viewCount.toLocaleString("vi-VN")} lượt xem</span>
                  </>
                )}
              </div>
            </header>

            {/* Cover Image */}
            <div className="mb-10 aspect-video w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <img
                src={cover.src}
                alt={cover.isFallback ? "" : post.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_POST_COVER_URL;
                }}
              />
            </div>

            {/* Table of Contents / EZ-TOC Component */}
            {tocItems.length > 0 && (
              <div className="ez-toc-box">
                <div className="ez-toc-header">
                  <h3 className="ez-toc-title">Nội dung bài viết</h3>
                  <button
                    onClick={() => setIsTocOpen(!isTocOpen)}
                    className="ez-toc-toggle-btn"
                    title={isTocOpen ? "Thu gọn mục lục" : "Mở rộng mục lục"}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h7"
                      />
                    </svg>
                  </button>
                </div>

                {isTocOpen && (
                  <div className="ez-toc-list">
                    {tocItems.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => handleScrollToHeading(item.id)}
                        className={`ez-toc-item-link ${item.level === 3 ? "ez-toc-item-h3" : "ez-toc-item-h2"}`}
                      >
                        <span className="font-semibold text-slate-400">{idx + 1}.</span>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Main Content Body */}
            <div className="post-detail-content space-y-6 text-base leading-relaxed text-slate-700">
              {cleanedHtml.includes("<") ? (
                <div
                  className="prose prose-slate prose-headings:font-bold prose-a:text-[#0b7f5f] prose-img:rounded-xl max-w-none"
                  dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                />
              ) : (
                cleanedHtml.split("\n\n").map((paragraph, index) => {
                  if (paragraph.startsWith("# ")) {
                    return (
                      <h2 key={index} className="mt-8 mb-4 text-2xl font-bold text-slate-900">
                        {paragraph.replace("# ", "")}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith("## ")) {
                    return (
                      <h3 key={index} className="mt-6 mb-3 text-xl font-bold text-slate-900">
                        {paragraph.replace("## ", "")}
                      </h3>
                    );
                  }
                  return <p key={index}>{paragraph}</p>;
                })
              )}
            </div>

            {/* Tags List */}
            {post.postTags && post.postTags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-8">
                <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                  Thẻ bài viết:
                </span>
                {post.postTags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Related Posts Section */}
            {relatedPosts.length > 0 && (
              <section className="mt-16 border-t border-slate-200 pt-12">
                <h3 className="mb-6 text-xl font-bold text-slate-900">Bài viết liên quan</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {relatedPosts.map((relPost) => (
                    <PostCard key={relPost.id} post={relPost} />
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
}
