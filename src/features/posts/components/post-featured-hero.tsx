"use client";

import { useLocale } from "next-intl";

import { Link } from "@/i18n/navigation";

import {
  formatPostDate,
  getPostLocale,
  localizePostCategory,
  postCopy,
} from "../post-localization";
import type { Post } from "../types/post";

type PostFeaturedHeroProps = {
  post: Post;
};

export function PostFeaturedHero({ post }: PostFeaturedHeroProps) {
  const locale = getPostLocale(useLocale());
  const copy = postCopy[locale];
  const formattedDate = formatPostDate(post.createdAt, locale);
  const wordCount = post.content ? post.content.split(/\s+/u).length : 100;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const thumbnailUrl =
    post.thumbnailFile?.publicUrl ||
    "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&q=80";
  const categoryName = localizePostCategory(post.category?.slug, post.category?.name, locale);

  return (
    <article className="post-featured-card">
      <div className="post-featured-img-wrapper">
        <img
          src={thumbnailUrl}
          alt={post.title}
          className="post-featured-img"
          onError={(event) => {
            event.currentTarget.src =
              "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&q=80";
          }}
        />
      </div>

      <div className="post-featured-body">
        <span className="post-featured-tag">🔥 {copy.list.featuredArticle}</span>
        <h2 className="post-featured-title">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="post-featured-excerpt">
          {post.metaDescription || post.content.substring(0, 180)}...
        </p>

        <div className="post-featured-footer">
          <span className="font-semibold text-slate-700">{categoryName}</span>
          <span>
            {formattedDate} • {copy.common.readingTime(readingTimeMinutes)}
          </span>
        </div>
      </div>
    </article>
  );
}
