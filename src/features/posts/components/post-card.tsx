"use client";

import { useLocale } from "next-intl";
import Image from "next/image";

import { Link } from "@/i18n/navigation";

import {
  formatPostDate,
  formatPostNumber,
  getPostLocale,
  localizePostCategory,
  postCopy,
} from "../post-localization";
import type { Post } from "../types/post";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  const locale = getPostLocale(useLocale());
  const copy = postCopy[locale];
  const formattedDate = formatPostDate(post.createdAt, locale);

  // Calculate reading time (approx 200 words per min)
  const wordCount = post.content ? post.content.split(/\s+/u).length : 100;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const thumbnailUrl = post.thumbnailFile?.publicUrl || "/images/placeholder-post.jpg";
  const categoryName = localizePostCategory(post.category?.slug, post.category?.name, locale);

  return (
    <article className="post-card">
      <div className="post-card-thumb-wrapper">
        {thumbnailUrl.startsWith("http") || thumbnailUrl.startsWith("/") ? (
          <Image
            fill
            src={thumbnailUrl}
            alt={post.title}
            className="post-card-thumb"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
            loader={({ src }) => src}
            onError={(event) => {
              event.currentTarget.src = "/images/placeholder-post.jpg";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-sm font-semibold text-slate-400">
            {copy.categories.fallback}
          </div>
        )}
        <span className="post-card-badge">{categoryName}</span>
      </div>

      <div className="post-card-body">
        <div className="post-card-meta">
          <span>{formattedDate}</span>
          <span>•</span>
          <span>{copy.common.readingTime(readingTimeMinutes)}</span>
          {typeof post.viewCount === "number" && (
            <>
              <span>•</span>
              <span>{copy.common.views(formatPostNumber(post.viewCount, locale))}</span>
            </>
          )}
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
