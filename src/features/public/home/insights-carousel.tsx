"use client";

import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

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

type DragState = {
  pointerId: number;
  startScrollLeft: number;
  startX: number;
};

type PendingAlignment = {
  behavior: ScrollBehavior;
  slot: number;
};

const fallbackImages = [
  "/assets/marketing/home/market-ai.png",
  "/assets/company-profile/office1.png",
  "/assets/company-profile/office2.png",
  "/assets/company-profile/office3.png",
  "/anh.png",
];

const CAROUSEL_COPIES = 7;
const CENTER_COPY = Math.floor(CAROUSEL_COPIES / 2);
const DRAG_START_DISTANCE = 4;
const SCROLL_SETTLE_DELAY = 140;

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

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function getWrappedIndex(index: number, articleCount: number) {
  return (index + articleCount) % articleCount;
}

function getCenteredSlot(slot: number, articleCount: number) {
  return CENTER_COPY * articleCount + getWrappedIndex(slot, articleCount);
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
  const articleCount = articles.length;
  const initialSlot = CENTER_COPY * articleCount + Math.min(1, articleCount - 1);
  const carouselItems = useMemo(
    () =>
      Array.from({ length: articleCount * CAROUSEL_COPIES }, (_, slot) => ({
        article: articles[slot % articleCount]!,
        slot,
      })),
    [articleCount, articles],
  );
  const viewportRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const draggedRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const activeSlotRef = useRef(initialSlot);
  const initialFrameRef = useRef<number | null>(null);
  const dragReleaseTimerRef = useRef<number | null>(null);
  const scrollSettleTimerRef = useRef<number | null>(null);
  const pendingAlignmentRef = useRef<PendingAlignment | null>(null);
  const [activeSlot, setActiveSlot] = useState(initialSlot);
  const [isDragging, setIsDragging] = useState(false);
  const activeIndex = getWrappedIndex(activeSlot, articleCount);

  const normalizeSlot = useCallback(
    (slot: number) => {
      if (!Number.isInteger(slot)) return activeSlotRef.current;

      return slot < 0 || slot >= carouselItems.length ? getCenteredSlot(slot, articleCount) : slot;
    },
    [articleCount, carouselItems.length],
  );

  const setCurrentSlot = useCallback((slot: number) => {
    if (slot === activeSlotRef.current) return;
    activeSlotRef.current = slot;
    setActiveSlot(slot);
  }, []);

  const alignSlot = useCallback((slot: number, behavior: ScrollBehavior) => {
    const viewport = viewportRef.current;
    const target = viewport?.querySelector<HTMLElement>(`[data-insight-slot="${slot}"]`);
    if (!viewport || !target) return;

    const left = Math.max(0, target.offsetLeft - (viewport.clientWidth - target.clientWidth) / 2);
    if (Math.abs(viewport.scrollLeft - left) < 1) return;

    isProgrammaticScrollRef.current = true;
    viewport.scrollTo({ left, behavior });
  }, []);

  const requestAlignment = useCallback(
    (slot: number, behavior: ScrollBehavior) => {
      const nextSlot = normalizeSlot(slot);
      if (nextSlot === activeSlotRef.current) {
        window.requestAnimationFrame(() => alignSlot(nextSlot, behavior));
        return;
      }

      pendingAlignmentRef.current = { slot: nextSlot, behavior };
      setCurrentSlot(nextSlot);
    },
    [alignSlot, normalizeSlot, setCurrentSlot],
  );

  useLayoutEffect(() => {
    const pendingAlignment = pendingAlignmentRef.current;
    if (!pendingAlignment || pendingAlignment.slot !== activeSlot) return;

    pendingAlignmentRef.current = null;
    alignSlot(activeSlot, pendingAlignment.behavior);
  }, [activeSlot, alignSlot]);

  const getNearestSlot = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return activeSlotRef.current;

    const viewportCenter = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
    let nearestSlot = activeSlotRef.current;
    let shortestDistance = Number.POSITIVE_INFINITY;

    viewport.querySelectorAll<HTMLElement>("[data-insight-slot]").forEach((article) => {
      const articleRect = article.getBoundingClientRect();
      const slot = Number(article.dataset.insightSlot);
      if (!Number.isInteger(slot)) return;

      const distance = Math.abs(articleRect.left + articleRect.width / 2 - viewportCenter);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestSlot = slot;
      }
    });

    return nearestSlot;
  }, []);

  const settleToNearestCard = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const currentSlot = getNearestSlot();
      const needsRecentering =
        currentSlot <= articleCount || currentSlot >= articleCount * (CAROUSEL_COPIES - 1);

      requestAlignment(
        needsRecentering ? getCenteredSlot(currentSlot, articleCount) : currentSlot,
        behavior,
      );
    },
    [articleCount, getNearestSlot, requestAlignment],
  );

  const queueScrollSettle = useCallback(() => {
    if (scrollSettleTimerRef.current !== null) window.clearTimeout(scrollSettleTimerRef.current);

    scrollSettleTimerRef.current = window.setTimeout(() => {
      scrollSettleTimerRef.current = null;
      if (!dragRef.current) settleToNearestCard();
    }, SCROLL_SETTLE_DELAY);
  }, [settleToNearestCard]);

  const selectSlot = useCallback(
    (slot: number, behavior = getScrollBehavior()) => {
      if (scrollSettleTimerRef.current !== null) window.clearTimeout(scrollSettleTimerRef.current);

      requestAlignment(slot, behavior);
    },
    [requestAlignment],
  );

  useLayoutEffect(() => {
    initialFrameRef.current = window.requestAnimationFrame(() => alignSlot(initialSlot, "auto"));
    return () => {
      if (initialFrameRef.current !== null) window.cancelAnimationFrame(initialFrameRef.current);
      if (dragReleaseTimerRef.current !== null) window.clearTimeout(dragReleaseTimerRef.current);
      if (scrollSettleTimerRef.current !== null) window.clearTimeout(scrollSettleTimerRef.current);
    };
  }, [alignSlot, initialSlot]);

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    if (dragRef.current) return;

    const viewport = event.currentTarget;
    isProgrammaticScrollRef.current = false;
    viewport.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startScrollLeft: viewport.scrollLeft,
      startX: event.clientX,
    };
    draggedRef.current = false;
    if (event.pointerType === "mouse") event.preventDefault();
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > DRAG_START_DISTANCE) draggedRef.current = true;
    if (draggedRef.current && event.cancelable) event.preventDefault();
    event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
  }

  function finishDragging(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
    settleToNearestCard(getScrollBehavior());

    if (dragReleaseTimerRef.current !== null) window.clearTimeout(dragReleaseTimerRef.current);
    dragReleaseTimerRef.current = window.setTimeout(() => {
      draggedRef.current = false;
      dragReleaseTimerRef.current = null;
    }, 0);
  }

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
        {copy.position(activeIndex + 1, articleCount)}. {copy.instructions}
      </p>

      <div className="marketing-home-insights-stage">
        <button
          type="button"
          className="marketing-home-carousel-nav marketing-home-insights-arrow marketing-home-insights-arrow-prev"
          onClick={() => selectSlot(activeSlotRef.current - 1)}
          aria-label={copy.previous}
        >
          <CaretLeft size={22} weight="regular" aria-hidden="true" />
        </button>

        <section
          ref={viewportRef}
          className={`marketing-home-insights-viewport${isDragging ? " is-dragging" : ""}`}
          aria-label={copy.carousel}
          aria-roledescription="carousel"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDragging}
          onPointerCancel={finishDragging}
          onLostPointerCapture={() => {
            if (!dragRef.current) return;
            dragRef.current = null;
            setIsDragging(false);
            settleToNearestCard(getScrollBehavior());
          }}
          onDragStart={(event) => event.preventDefault()}
          onScroll={() => {
            if (!isProgrammaticScrollRef.current) queueScrollSettle();
          }}
          onScrollEnd={() => {
            isProgrammaticScrollRef.current = false;
            settleToNearestCard();
          }}
          onClickCapture={(event) => {
            if (draggedRef.current) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          <div className="marketing-home-insights-track">
            {carouselItems.map(({ article, slot }) => {
              const distanceFromActive = Math.abs(slot - activeSlot);
              const isFeatured = activeSlot === slot;
              const isAdjacent = distanceFromActive === 1;
              const isPeripheral = distanceFromActive === 2;
              return (
                <article
                  data-insight-index={slot % articleCount}
                  data-insight-slot={slot}
                  aria-current={isFeatured ? "true" : undefined}
                  className={`marketing-home-insights-card${isFeatured ? " is-featured" : ""}${isAdjacent ? " is-adjacent" : ""}${isPeripheral ? " is-peripheral" : ""}`}
                  key={`${article.id}-${slot}`}
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
                    <Link className="marketing-home-insights-more" href={`/posts/${article.slug}`}>
                      {copy.more}
                      <ArrowRight size={15} weight="bold" aria-hidden="true" />
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          className="marketing-home-carousel-nav marketing-home-insights-arrow marketing-home-insights-arrow-next"
          onClick={() => selectSlot(activeSlotRef.current + 1)}
          aria-label={copy.next}
        >
          <CaretRight size={22} weight="regular" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
