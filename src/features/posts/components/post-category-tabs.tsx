"use client";

import { useLocale } from "next-intl";

import { getPostLocale, postCopy } from "../post-localization";
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
  const locale = getPostLocale(useLocale());
  const copy = postCopy[locale];
  const defaultTabs = [
    { label: copy.list.allArticles, slug: "" },
    { label: copy.categories.blogUpNext, slug: "blog-upnext" },
    { label: copy.categories.itCareer, slug: "su-nghiep-it" },
    { label: copy.categories.itExpertise, slug: "chuyen-mon-it" },
  ];

  // Merge backend categories if any additional ones exist.
  // Their names remain source data until article taxonomy translations are available in the API.
  const additionalCategories = categories
    .filter((category) => !["blog-upnext", "su-nghiep-it", "chuyen-mon-it"].includes(category.slug))
    .map((category) => ({ label: category.name, slug: category.slug }));

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
