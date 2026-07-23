"use client";

import { useEffect, useState } from "react";

import { PublicFooter } from "@/features/public/shared/public-footer";
import { PublicHeader } from "@/features/public/shared/public-header";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";

import { getPublicPostBySlug, getPublicPosts } from "../api/posts";
import type { Post } from "../types/post";
import { PostCard } from "./post-card";

import "./posts.css";

type PostDetailContentProps = {
  slug: string;
};

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
  const coverUrl =
    post?.thumbnailFile?.publicUrl ||
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80";

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
              </div>
            </header>

            {/* Cover Image */}
            <div className="mb-10 aspect-video w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <img
                src={coverUrl}
                alt={post.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80";
                }}
              />
            </div>

            {/* Main Content Body */}
            <div className="post-detail-content space-y-6 text-base leading-relaxed text-slate-700">
              {post.content.split("\n\n").map((paragraph, index) => {
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
              })}
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
