"use client";

import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Post } from "@/features/posts/types/post";
import { Link } from "@/i18n/navigation";

type InsightArticle = {
  id: string;
  image: string;
  imageAlt: string;
  slug: string;
  title: string;
};

type InsightsCarouselProps = {
  isLoading: boolean;
  posts: Post[];
};

type InsightsCarouselRailProps = {
  articles: InsightArticle[];
  locale: "en" | "vi";
};

const fallbackImages = [
  "/assets/marketing/home/market-ai.png",
  "/assets/company-profile/office1.png",
  "/assets/company-profile/office2.png",
  "/assets/company-profile/office3.png",
  "/anh.png",
];

const copyByLocale = {
  vi: {
    all: "Xem tất cả",
    carousel: "Danh sách bài viết và định hướng nghề nghiệp",
    instructions: "Kéo ngang hoặc dùng các nút điều hướng để xem thêm bài viết.",
    loading: "Đang tải bài viết mới nhất",
    more: "Xem chi tiết",
    next: "Bài viết tiếp theo",
    position: (position: number, total: number) => `Bài viết ${position} trên ${total}`,
    previous: "Bài viết trước",
    title: "Cẩm nang nghề nghiệp",
  },
  en: {
    all: "View all",
    carousel: "Career and article carousel",
    instructions: "Drag horizontally or use the navigation controls to see more articles.",
    loading: "Loading latest articles",
    more: "Read article",
    next: "Next article",
    position: (position: number, total: number) => `Article ${position} of ${total}`,
    previous: "Previous article",
    title: "Career insights",
  },
} as const;

function getInsightImage(post: Post, index: number) {
  const image = post.coverImageFile?.publicUrl ?? post.thumbnailFile?.publicUrl;
  return image && (/^https?:\/\//u.test(image) || image.startsWith("/"))
    ? image
    : fallbackImages[index % fallbackImages.length]!;
}

function InsightsCarouselSkeleton({ title, loading }: { title: string; loading: string }) {
  return (
    <section
      className="marketing-home-insights"
      aria-busy="true"
      aria-labelledby="insights-heading"
    >
      <header className="marketing-home-insights-head">
        <h2 id="insights-heading">{title}</h2>
      </header>
      <div className="marketing-home-insights-skeleton" aria-live="polite">
        <span className="sr-only">{loading}</span>
        {Array.from({ length: 3 }, (_, index) => (
          <article
            className={`marketing-home-insights-skeleton-card${index === 1 ? " is-featured" : ""}`}
            key={index}
            aria-hidden="true"
          >
            <span className="marketing-home-skeleton marketing-home-insights-skeleton-image" />
            <span className="marketing-home-skeleton marketing-home-skeleton-line is-title" />
            {index === 1 && (
              <span className="marketing-home-skeleton marketing-home-skeleton-line is-company" />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function InsightsCarousel({ isLoading, posts }: InsightsCarouselProps) {
  const locale = useLocale() === "en" ? "en" : "vi";
  const copy = copyByLocale[locale];
  const articles = useMemo(
    () =>
      posts.map((post, index) => ({
        id: post.id,
        image: getInsightImage(post, index),
        imageAlt: post.title,
        slug: post.slug,
        title: post.title,
      })),
    [posts],
  );

  if (articles.length === 0) {
    if (!isLoading) return null;

    return <InsightsCarouselSkeleton title={copy.title} loading={copy.loading} />;
  }

  return (
    <InsightsCarouselRail
      key={articles.map((article) => article.id).join("-")}
      articles={articles}
      locale={locale}
    />
  );
}

function InsightsCarouselRail({ articles, locale }: InsightsCarouselRailProps) {
  const copy = copyByLocale[locale];
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    duration: 28,
    loop: true,
    startIndex: Math.min(1, articles.length - 1),
  });
  const [activeIndex, setActiveIndex] = useState(Math.min(1, articles.length - 1));
  const [isDragging, setIsDragging] = useState(false);
  const updateActiveIndex = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const markDragging = () => setIsDragging(true);
    const markIdle = () => setIsDragging(false);

    emblaApi.scrollTo(Math.min(1, articles.length - 1), true);
    updateActiveIndex();
    emblaApi
      .on("pointerDown", markDragging)
      .on("pointerUp", markIdle)
      .on("reInit", updateActiveIndex)
      .on("select", updateActiveIndex);

    return () => {
      emblaApi
        .off("pointerDown", markDragging)
        .off("pointerUp", markIdle)
        .off("reInit", updateActiveIndex)
        .off("select", updateActiveIndex);
    };
  }, [articles.length, emblaApi, updateActiveIndex]);

  return (
    <section className="marketing-home-insights" aria-labelledby="insights-heading">
      <header className="marketing-home-insights-head">
        <h2 id="insights-heading">{copy.title}</h2>
        <Link className="marketing-home-insights-all" href="/posts">
          {copy.all}
          <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
      </header>

      <p className="sr-only" aria-live="polite">
        {copy.position(activeIndex + 1, articles.length)}. {copy.instructions}
      </p>

      <div className="marketing-home-insights-stage">
        <button
          type="button"
          className="marketing-home-carousel-nav marketing-home-insights-arrow marketing-home-insights-arrow-prev"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label={copy.previous}
        >
          <CaretLeft size={22} weight="regular" aria-hidden="true" />
        </button>

        <section
          ref={emblaRef}
          className={`marketing-home-insights-viewport${isDragging ? " is-dragging" : ""}`}
          aria-label={copy.carousel}
          aria-roledescription="carousel"
        >
          <div className="marketing-home-insights-track">
            {articles.map((article, index) => {
              const distanceFromActive = Math.abs(index - activeIndex);
              const loopDistance = Math.min(
                distanceFromActive,
                articles.length - distanceFromActive,
              );
              const isFeatured = activeIndex === index;
              const isAdjacent = loopDistance === 1;
              const isPeripheral = loopDistance === 2;
              return (
                <div className="marketing-home-insights-slide" key={article.id}>
                  <article
                    data-insight-index={index}
                    aria-current={isFeatured ? "true" : undefined}
                    className={`marketing-home-insights-card${isFeatured ? " is-featured" : ""}${isAdjacent ? " is-adjacent" : ""}${isPeripheral ? " is-peripheral" : ""}`}
                  >
                    <div className="marketing-home-insights-image">
                      <Image
                        src={article.image}
                        alt={article.imageAlt}
                        width={960}
                        height={620}
                        sizes="(max-width: 760px) 84vw, 650px"
                        unoptimized
                        loader={({ src }) => src}
                        draggable={false}
                      />
                    </div>
                    <h3>
                      <Link href={`/posts/${article.slug}`}>{article.title}</Link>
                    </h3>
                    {isFeatured ? (
                      <Link
                        className="marketing-home-insights-more"
                        href={`/posts/${article.slug}`}
                      >
                        {copy.more}
                        <ArrowRight size={15} weight="bold" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </article>
                </div>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          className="marketing-home-carousel-nav marketing-home-insights-arrow marketing-home-insights-arrow-next"
          onClick={() => emblaApi?.scrollNext()}
          aria-label={copy.next}
        >
          <CaretRight size={22} weight="regular" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
