import { describe, expect, it } from "vitest";

import { DEFAULT_POST_COVER_URL, getPostCover } from "./post-cover";

function asset(publicUrl: string) {
  return {
    id: "asset-1",
    purpose: "POST_IMAGE",
    visibility: "PUBLIC",
    storageKey: "posts/asset-1.jpg",
    originalName: "asset-1.jpg",
    mimeType: "image/jpeg",
    sizeBytes: "1024",
    publicUrl,
  };
}

describe("getPostCover", () => {
  it("prefers an uploaded thumbnail", () => {
    expect(
      getPostCover({
        thumbnailFile: asset("https://cdn.upnext.works/article-thumbnail.jpg"),
        coverImageFile: asset("https://cdn.upnext.works/article-cover.jpg"),
      }),
    ).toEqual({
      src: "https://cdn.upnext.works/article-thumbnail.jpg",
      isFallback: false,
    });
  });

  it("uses the uploaded cover when a thumbnail is unavailable", () => {
    expect(
      getPostCover({
        thumbnailFile: null,
        coverImageFile: asset("/uploads/article-cover.jpg"),
      }),
    ).toEqual({ src: "/uploads/article-cover.jpg", isFallback: false });
  });

  it("falls back safely when the API has no displayable media URL", () => {
    expect(
      getPostCover({
        thumbnailFile: asset("javascript:alert('unsafe')"),
        coverImageFile: null,
      }),
    ).toEqual({ src: DEFAULT_POST_COVER_URL, isFallback: true });
  });
});
