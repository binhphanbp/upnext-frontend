import type { Post } from "./types/post";

/**
 * A consistent visual fallback while an article has no uploaded media yet.
 * Uploaded thumbnail/cover assets always take precedence over this image.
 */
export const DEFAULT_POST_COVER_URL =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80";

type PostCoverSource = Pick<Post, "thumbnailFile" | "coverImageFile">;

function isDisplayableImageUrl(value: string | null | undefined): value is string {
  return Boolean(value && (/^https?:\/\//u.test(value) || value.startsWith("/")));
}

export function getPostCover(post: PostCoverSource): { src: string; isFallback: boolean } {
  const source = [post.thumbnailFile?.publicUrl, post.coverImageFile?.publicUrl].find(
    isDisplayableImageUrl,
  );

  return source
    ? { src: source, isFallback: false }
    : { src: DEFAULT_POST_COVER_URL, isFallback: true };
}
