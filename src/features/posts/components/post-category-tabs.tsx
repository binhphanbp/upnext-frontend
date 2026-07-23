"use client";

import type { PostCategory } from "../types/post";

type PostCategoryTabsProps = {
  categories: PostCategory[];
  activeCategorySlug: string;
  onSelectCategory: (slug: string) => void;
};

export function PostCategoryTabs({
  categories,
  activeCategorySlug,
  onSelectCategory,
}: PostCategoryTabsProps) {
  // Main parent category options
  const defaultTabs = [
    { label: "Tất cả bài viết", slug: "" },
    { label: "Blog UpNext", slug: "blog-upnext" },
    { label: "Sự nghiệp IT", slug: "su-nghiep-it" },
    { label: "Chuyên môn IT", slug: "chuyen-mon-it" },
  ];

  // Merge backend categories if any additional ones exist
  const additionalCategories = categories
    .filter((c) => !["blog-upnext", "su-nghiep-it", "chuyen-mon-it"].includes(c.slug))
    .map((c) => ({ label: c.name, slug: c.slug }));

  const allTabs = [...defaultTabs, ...additionalCategories];

  return (
    <div className="posts-filter-section">
      <div className="posts-category-tabs">
        {allTabs.map((tab) => {
          const isActive = activeCategorySlug === tab.slug;
          return (
            <button
              key={tab.slug || "all"}
              type="button"
              className={`posts-tab-pill${isActive ? " is-active" : ""}`}
              onClick={() => onSelectCategory(tab.slug)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
