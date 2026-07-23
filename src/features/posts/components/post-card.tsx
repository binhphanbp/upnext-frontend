"use client";

import Image from "next/image";

import { Link } from "@/i18n/navigation";

import type { Post } from "../types/post";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  // Format publish date
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Vừa đăng";

  // Calculate reading time (approx 200 words per min)
  const wordCount = post.content ? post.content.split(/\s+/u).length : 100;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const thumbnailUrl = post.thumbnailFile?.publicUrl || "/images/placeholder-post.jpg";
  const categoryName = post.category?.name || "Tin tức UpNext";

  return (
    <article className="post-card">
      <div className="post-card-thumb-wrapper">
        {thumbnailUrl.startsWith("http") || thumbnailUrl.startsWith("/") ? (
          <img
            src={thumbnailUrl}
            alt={post.title}
            className="post-card-thumb"
            loading="lazy"
            onError={(e) => {
              // Fallback to stylized SVG placeholder if image fails to load
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-sm font-semibold text-slate-400">
            UpNext Blog
          </div>
        )}
        <span className="post-card-badge">{categoryName}</span>
      </div>

      <div className="post-card-body">
        <div className="post-card-meta">
          <span>{formattedDate}</span>
          <span>•</span>
          <span>{readingTimeMinutes} phút đọc</span>
        </div>

        <h3 className="post-card-title">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className="post-card-excerpt">
          {post.metaDescription || post.content.substring(0, 140)}...
        </p>

        {post.postTags && post.postTags.length > 0 && (
          <div className="post-card-tags">
            {post.postTags.slice(0, 3).map(({ tag }) => (
              <span key={tag.id} className="post-card-tag-chip">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
