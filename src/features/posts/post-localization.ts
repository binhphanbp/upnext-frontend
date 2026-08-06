export type PostLocale = "vi" | "en";

type PostCopy = {
  metadata: {
    listTitle: string;
    listDescription: string;
    detailTitle: string;
    detailDescription: string;
  };
  categories: {
    all: string;
    blogUpNext: string;
    itCareer: string;
    itExpertise: string;
    fallback: string;
  };
  common: {
    justPublished: string;
    readingTime: (minutes: number) => string;
    views: (count: string) => string;
  };
  list: {
    eyebrow: string;
    title: string;
    featuredArticle: string;
    allArticles: string;
    searchPlaceholder: string;
    searchAriaLabel: string;
    loading: string;
    editorial: string;
    readArticle: string;
    noFeaturedArticles: string;
    newsletterTitle: string;
    newsletterDescription: string;
    newsletterSuccess: string;
    emailPlaceholder: string;
    subscribe: string;
    copyRss: string;
    rssCopied: string;
    popularArticles: string;
    viewAllArticles: string;
    exploreArticles: string;
    noResults: string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
  };
  detail: {
    loading: string;
    errorTitle: string;
    notFound: string;
    backToPosts: string;
    home: string;
    posts: string;
    editorial: string;
    tocTitle: string;
    collapseToc: string;
    expandToc: string;
    tags: string;
    relatedPosts: string;
    copy: string;
    copied: string;
  };
};

/**
 * Article data currently has one source language in the API. These strings only cover the
 * surrounding interface so the article title, excerpt and HTML content can be translated later
 * without changing what a reader sees from the API today.
 */
export const postCopy = {
  vi: {
    metadata: {
      listTitle: "Blog & Bài viết IT | UpNext",
      listDescription:
        "Cập nhật xu hướng công nghệ, cẩm nang phỏng vấn, dải lương IT và các bài viết chuyên môn từ UpNext.",
      detailTitle: "Bài viết | UpNext",
      detailDescription: "Đọc các bài viết và kiến thức dành cho cộng đồng IT trên UpNext.",
    },
    categories: {
      all: "Tất cả chủ đề",
      blogUpNext: "Blog UpNext",
      itCareer: "Sự nghiệp IT",
      itExpertise: "Chuyên môn IT",
      fallback: "Bài viết UpNext",
    },
    common: {
      justPublished: "Vừa đăng",
      readingTime: (minutes: number) => `${minutes} phút đọc`,
      views: (count: string) => `${count} lượt xem`,
    },
    list: {
      eyebrow: "BLOG UPNEXT",
      title: "Chìa khóa để học hỏi",
      featuredArticle: "Bài viết nổi bật",
      allArticles: "Tất cả bài viết",
      searchPlaceholder: "Tìm kiếm bài viết",
      searchAriaLabel: "Tìm kiếm bài viết",
      loading: "Đang tải bài viết...",
      editorial: "Ban biên tập UpNext",
      readArticle: "Đọc bài viết",
      noFeaturedArticles: "Chưa có bài viết nổi bật.",
      newsletterTitle: "Đừng bỏ lỡ những cập nhật mới nhất",
      newsletterDescription: "Nhận thông tin hữu ích và bài viết mới nhất từ UpNext.",
      newsletterSuccess: "Cảm ơn bạn đã đăng ký nhận bản tin từ UpNext!",
      emailPlaceholder: "Email của bạn",
      subscribe: "Đăng ký",
      copyRss: "Sao chép RSS feed",
      rssCopied: "Đã sao chép đường dẫn RSS feed vào bộ nhớ tạm!",
      popularArticles: "Bài viết phổ biến",
      viewAllArticles: "Xem tất cả bài viết",
      exploreArticles: "Khám phá thêm bài viết",
      noResults: "Không tìm thấy bài viết phù hợp.",
      firstPage: "Trang đầu",
      previousPage: "Trang trước",
      nextPage: "Trang sau",
      lastPage: "Trang cuối",
    },
    detail: {
      loading: "Đang tải nội dung bài viết...",
      errorTitle: "Rất tiếc!",
      notFound: "Không tìm thấy bài viết hoặc bài viết đã bị xóa.",
      backToPosts: "Quay lại danh sách bài viết",
      home: "Trang chủ",
      posts: "Bài viết",
      editorial: "Ban biên tập UpNext",
      tocTitle: "Nội dung bài viết",
      collapseToc: "Thu gọn mục lục",
      expandToc: "Mở rộng mục lục",
      tags: "Thẻ bài viết:",
      relatedPosts: "Bài viết liên quan",
      copy: "Sao chép",
      copied: "Đã chép!",
    },
  },
  en: {
    metadata: {
      listTitle: "IT Blog & Articles | UpNext",
      listDescription:
        "Explore technology trends, interview guides, IT salary insights, and practical articles from UpNext.",
      detailTitle: "Article | UpNext",
      detailDescription: "Read articles and practical knowledge for the IT community on UpNext.",
    },
    categories: {
      all: "All categories",
      blogUpNext: "UpNext Blog",
      itCareer: "IT Careers",
      itExpertise: "IT Expertise",
      fallback: "UpNext article",
    },
    common: {
      justPublished: "Just published",
      readingTime: (minutes: number) => `${minutes} min read`,
      views: (count: string) => `${count} views`,
    },
    list: {
      eyebrow: "UPNEXT BLOG",
      title: "Your Key to Learning",
      featuredArticle: "Featured article",
      allArticles: "All articles",
      searchPlaceholder: "Search articles",
      searchAriaLabel: "Search articles",
      loading: "Loading articles...",
      editorial: "UpNext Editorial",
      readArticle: "Read article",
      noFeaturedArticles: "No featured articles found.",
      newsletterTitle: "Never miss an update",
      newsletterDescription: "Get useful insights and the latest articles from UpNext.",
      newsletterSuccess: "Thank you for subscribing to the UpNext newsletter!",
      emailPlaceholder: "Your email",
      subscribe: "Subscribe",
      copyRss: "Copy RSS feed",
      rssCopied: "The RSS feed link has been copied to your clipboard!",
      popularArticles: "Popular articles",
      viewAllArticles: "View all articles",
      exploreArticles: "Explore more articles",
      noResults: "No articles match your search.",
      firstPage: "First page",
      previousPage: "Previous page",
      nextPage: "Next page",
      lastPage: "Last page",
    },
    detail: {
      loading: "Loading article...",
      errorTitle: "Sorry!",
      notFound: "This article could not be found or has been removed.",
      backToPosts: "Back to articles",
      home: "Home",
      posts: "Articles",
      editorial: "UpNext Editorial",
      tocTitle: "Table of contents",
      collapseToc: "Collapse table of contents",
      expandToc: "Expand table of contents",
      tags: "Article tags:",
      relatedPosts: "Related articles",
      copy: "Copy",
      copied: "Copied!",
    },
  },
} as const satisfies Record<PostLocale, PostCopy>;

export function getPostLocale(locale: string): PostLocale {
  return locale === "en" ? "en" : "vi";
}

export function getPostIntlLocale(locale: PostLocale) {
  return locale === "en" ? "en-US" : "vi-VN";
}

export function formatPostDate(value: string | null | undefined, locale: PostLocale) {
  if (!value) return postCopy[locale].common.justPublished;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return postCopy[locale].common.justPublished;

  return new Intl.DateTimeFormat(getPostIntlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatPostNumber(value: number, locale: PostLocale) {
  return new Intl.NumberFormat(getPostIntlLocale(locale)).format(value);
}

/** Localize the three taxonomy labels that are part of the public posts UI. */
export function localizePostCategory(
  slug: string | null | undefined,
  name: string | null | undefined,
  locale: PostLocale,
) {
  if (slug === "blog-upnext") return postCopy[locale].categories.blogUpNext;
  if (slug === "su-nghiep-it") return postCopy[locale].categories.itCareer;
  if (slug === "chuyen-mon-it") return postCopy[locale].categories.itExpertise;

  return name || postCopy[locale].categories.fallback;
}
