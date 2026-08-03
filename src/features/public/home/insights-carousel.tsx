"use client";

import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getPostCover } from "@/features/posts/post-cover";
import type { Post } from "@/features/posts/types/post";
import { Link } from "@/i18n/navigation";

type InsightArticle = {
  id: string;
  image: string;
  isFallbackImage: boolean;
  slug: string;
  title: string;
};

type InsightsCarouselProps = {
  isLoading: boolean;
  isError?: boolean;
  isRetrying?: boolean;
  onRetry?: () => void;
  posts: Post[];
};

type InsightsCarouselRailProps = {
  articles: InsightArticle[];
  locale: "en" | "vi";
};

const copyByLocale = {
  vi: {
    all: "Xem tất cả",
    carousel: "Danh sách bài viết và định hướng nghề nghiệp",
    instructions: "Kéo ngang hoặc dùng các nút điều hướng để xem thêm bài viết.",
    loading: "Đang tải bài viết mới nhất",
    error: "Chưa thể tải cẩm nang nghề nghiệp.",
    retry: "Thử lại",
    retrying: "Đang thử lại…",
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
    error: "We could not load career insights.",
    retry: "Try again",
    retrying: "Trying again…",
    more: "Read article",
    next: "Next article",
    position: (position: number, total: number) => `Article ${position} of ${total}`,
    previous: "Previous article",
    title: "Career insights",
  },
} as const;

export function InsightsCarousel({
  isLoading,
  isError = false,
  isRetrying = false,
  onRetry,
  posts,
}: InsightsCarouselProps) {
  const locale = useLocale() === "en" ? "en" : "vi";
  const copy = copyByLocale[locale];
  const articles = useMemo(
    () =>
      posts.map((post) => {
        const cover = getPostCover(post);
        return {
          id: post.id,
          image: cover.src,
          isFallbackImage: cover.isFallback,
          slug: post.slug,
          title: post.title,
        };
      }),
    [posts],
  );

  if (isError && articles.length === 0) {
    return (
      <section className="marketing-home-insights" aria-labelledby="insights-heading">
        <header className="marketing-home-insights-head">
          <h2 id="insights-heading">{copy.title}</h2>
        </header>
        <div className="marketing-home-action-state" role="alert">
          <p className="marketing-home-action-error">{copy.error}</p>
          {onRetry ? (
            <button
              type="button"
              className="marketing-home-action-retry"
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? copy.retrying : copy.retry}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    if (!isLoading) return null;

    return (
      <section
        className="marketing-home-insights"
        aria-busy="true"
        aria-labelledby="insights-heading"
      >
        <header className="marketing-home-insights-head">
          <h2 id="insights-heading">{copy.title}</h2>
        </header>
        <output className="marketing-home-insights-loading">
          <span className="sr-only">{copy.loading}</span>
        </output>
      </section>
    );
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
                        alt={article.isFallbackImage ? "" : article.title}
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
