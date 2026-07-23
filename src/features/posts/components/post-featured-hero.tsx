"use client";

import { Link } from "@/i18n/navigation";

import type { Post } from "../types/post";

type PostFeaturedHeroProps = {
  post: Post;
};

export function PostFeaturedHero({ post }: PostFeaturedHeroProps) {
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Vừa đăng";

  const wordCount = post.content ? post.content.split(/\s+/u).length : 100;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const thumbnailUrl =
    post.thumbnailFile?.publicUrl ||
    "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&q=80";
  const categoryName = post.category?.name || "Nổi bật";

  return (
    <article className="post-featured-card">
      <div className="post-featured-img-wrapper">
        <img
          src={thumbnailUrl}
          alt={post.title}
          className="post-featured-img"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&q=80";
          }}
        />
      </div>

      <div className="post-featured-body">
        <span className="post-featured-tag">🔥 Bài viết nổi bật</span>
        <h2 className="post-featured-title">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="post-featured-excerpt">
          {post.metaDescription || post.content.substring(0, 180)}...
        </p>

        <div className="post-featured-footer">
          <span className="font-semibold text-slate-700">{categoryName}</span>
          <span>
            {formattedDate} • {readingTimeMinutes} phút đọc
          </span>
        </div>
      </div>
    </article>
  );
}
