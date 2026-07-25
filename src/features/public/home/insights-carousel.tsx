"use client";

import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type InsightArticle = {
  id: string;
  title: { vi: string; en: string };
  image: string;
  imageAlt: { vi: string; en: string };
};

const articles: InsightArticle[] = [
  {
    id: "it-market-report",
    title: {
      vi: "Xu hướng tuyển dụng IT nửa cuối 2026: kỹ năng nào đang được săn đón?",
      en: "IT hiring trends for late 2026: which skills are in demand?",
    },
    image: "/assets/marketing/home/market-ai.png",
    imageAlt: {
      vi: "Minh hoạ AI và phân tích dữ liệu",
      en: "An illustration of AI and data analysis",
    },
  },
  {
    id: "backend-roadmap",
    title: {
      vi: "Lộ trình trở thành Backend Developer trong 12 tháng cho người mới bắt đầu",
      en: "A 12-month backend developer roadmap for beginners",
    },
    image: "/assets/company-profile/office1.png",
    imageAlt: {
      vi: "Không gian làm việc của đội ngũ công nghệ",
      en: "A technology team's workspace",
    },
  },
  {
    id: "cv-checklist",
    title: {
      vi: "7 điểm cần kiểm tra trước khi gửi CV cho một vị trí công nghệ",
      en: "7 things to check before submitting a CV for a tech role",
    },
    image: "/assets/company-profile/office2.png",
    imageAlt: {
      vi: "Buổi họp trao đổi chiến lược của đội ngũ công nghệ",
      en: "A technology team strategy meeting",
    },
  },
  {
    id: "team-culture",
    title: {
      vi: "Cách đánh giá văn hoá đội ngũ trước khi nhận lời mời làm việc",
      en: "How to evaluate team culture before accepting an offer",
    },
    image: "/assets/company-profile/office3.png",
    imageAlt: {
      vi: "Không gian sinh hoạt chung tại văn phòng",
      en: "A shared space in an office",
    },
  },
  {
    id: "portfolio-for-developers",
    title: {
      vi: "Portfolio cho Developer: chọn dự án nào để thể hiện năng lực đúng cách?",
      en: "Developer portfolios: how to choose projects that show your strengths",
    },
    image: "/anh.png",
    imageAlt: {
      vi: "Minh hoạ hồ sơ nghề nghiệp và cơ hội việc làm",
      en: "An illustration of a professional profile and job opportunities",
    },
  },
  {
    id: "career-switch",
    title: {
      vi: "Chuyển hướng sang công nghệ: lập kế hoạch học và tìm việc không bị quá tải",
      en: "Moving into tech: a sustainable plan for learning and job searching",
    },
    image: "/assets/company-profile/office1.png",
    imageAlt: {
      vi: "Đội ngũ cùng nhau làm việc tại văn phòng công nghệ",
      en: "A team working together in a technology office",
    },
  },
];

const CAROUSEL_COPIES = 7;
const CENTER_COPY = Math.floor(CAROUSEL_COPIES / 2);
const INITIAL_ARTICLE_INDEX = 1;
const INITIAL_SLOT = CENTER_COPY * articles.length + INITIAL_ARTICLE_INDEX;
const DRAG_START_DISTANCE = 4;
const SWIPE_DISTANCE_MIN = 36;
const SWIPE_DISTANCE_MAX = 96;
const carouselItems = Array.from({ length: articles.length * CAROUSEL_COPIES }, (_, slot) => ({
  article: articles[slot % articles.length]!,
  slot,
}));

const copyByLocale = {
  vi: {
    title: "Cẩm nang nghề nghiệp",
    all: "Xem tất cả",
    previous: "Bài viết trước",
    next: "Bài viết tiếp theo",
    carousel: "Danh sách bài viết và định hướng nghề nghiệp",
    instructions: "Kéo ngang hoặc dùng các nút điều hướng để xem thêm bài viết.",
    more: "Xem chi tiết",
    position: (position: number, total: number) => `Bài viết ${position} trên ${total}`,
  },
  en: {
    title: "Career insights",
    all: "View all",
    previous: "Previous article",
    next: "Next article",
    carousel: "Career and article carousel",
    instructions: "Drag horizontally or use the navigation controls to see more articles.",
    more: "View details",
    position: (position: number, total: number) => `Article ${position} of ${total}`,
  },
} as const;

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
};

type PendingAlignment = {
  slot: number;
  behavior: ScrollBehavior;
};

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function getWrappedIndex(index: number) {
  return (index + articles.length) % articles.length;
}

function getCenteredSlot(slot: number) {
  return CENTER_COPY * articles.length + getWrappedIndex(slot);
}

export function InsightsCarousel() {
  const locale = useLocale() === "en" ? "en" : "vi";
  const copy = copyByLocale[locale];
  const viewportRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const draggedRef = useRef(false);
  const activeSlotRef = useRef(INITIAL_SLOT);
  const initialFrameRef = useRef<number | null>(null);
  const dragReleaseTimerRef = useRef<number | null>(null);
  const recenterTimerRef = useRef<number | null>(null);
  const pendingAlignmentRef = useRef<PendingAlignment | null>(null);
  const [activeSlot, setActiveSlot] = useState(INITIAL_SLOT);
  const [isDragging, setIsDragging] = useState(false);
  const activeIndex = getWrappedIndex(activeSlot);

  const setCurrentSlot = useCallback((slot: number) => {
    activeSlotRef.current = slot;
    setActiveSlot(slot);
  }, []);

  const alignSlot = useCallback((slot: number, behavior: ScrollBehavior) => {
    const viewport = viewportRef.current;
    const target = viewport?.querySelector<HTMLElement>(`[data-insight-slot="${slot}"]`);
    if (!viewport || !target) return;

    const left = Math.max(0, target.offsetLeft - (viewport.clientWidth - target.clientWidth) / 2);
    viewport.scrollTo({ left, behavior });
  }, []);

  const requestAlignment = useCallback(
    (slot: number, behavior: ScrollBehavior) => {
      if (slot === activeSlotRef.current) {
        window.requestAnimationFrame(() => alignSlot(slot, behavior));
        return;
      }

      pendingAlignmentRef.current = { slot, behavior };
      setCurrentSlot(slot);
    },
    [alignSlot, setCurrentSlot],
  );

  useLayoutEffect(() => {
    const pendingAlignment = pendingAlignmentRef.current;
    if (!pendingAlignment || pendingAlignment.slot !== activeSlot) return;

    pendingAlignmentRef.current = null;
    alignSlot(activeSlot, pendingAlignment.behavior);
  }, [activeSlot, alignSlot]);

  const recenterToMiddle = useCallback(() => {
    const currentSlot = activeSlotRef.current;
    const needsRecentering =
      currentSlot <= articles.length || currentSlot >= articles.length * (CAROUSEL_COPIES - 1);

    if (!needsRecentering) return;

    const centeredSlot = getCenteredSlot(currentSlot);
    requestAlignment(centeredSlot, "auto");
  }, [requestAlignment]);

  const queueRecentering = useCallback(() => {
    if (recenterTimerRef.current !== null) window.clearTimeout(recenterTimerRef.current);

    recenterTimerRef.current = window.setTimeout(() => {
      recenterTimerRef.current = null;
      if (!dragRef.current) recenterToMiddle();
    }, 600);
  }, [recenterToMiddle]);

  const selectSlot = useCallback(
    (slot: number, behavior = getScrollBehavior()) => {
      const nextSlot = slot < 0 || slot >= carouselItems.length ? getCenteredSlot(slot) : slot;
      if (recenterTimerRef.current !== null) window.clearTimeout(recenterTimerRef.current);

      requestAlignment(nextSlot, behavior);
      queueRecentering();
    },
    [queueRecentering, requestAlignment],
  );

  const findNearestSlot = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return activeSlotRef.current;

    const viewportCenter = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
    let nearestSlot = activeSlotRef.current;
    let shortestDistance = Number.POSITIVE_INFINITY;

    viewport.querySelectorAll<HTMLElement>("[data-insight-slot]").forEach((article) => {
      const articleRect = article.getBoundingClientRect();
      const distance = Math.abs(articleRect.left + articleRect.width / 2 - viewportCenter);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestSlot = Number(article.dataset.insightSlot);
      }
    });

    return nearestSlot;
  }, []);

  useLayoutEffect(() => {
    initialFrameRef.current = window.requestAnimationFrame(() => alignSlot(INITIAL_SLOT, "auto"));
    return () => {
      if (initialFrameRef.current !== null) window.cancelAnimationFrame(initialFrameRef.current);
      if (dragReleaseTimerRef.current !== null) window.clearTimeout(dragReleaseTimerRef.current);
      if (recenterTimerRef.current !== null) window.clearTimeout(recenterTimerRef.current);
    };
  }, [alignSlot]);

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    if (dragRef.current) return;

    const viewport = event.currentTarget;
    viewport.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: viewport.scrollLeft,
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

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const distance = event.clientX - drag.startX;
    const viewport = event.currentTarget;
    dragRef.current = null;
    setIsDragging(false);

    const swipeDistance = Math.min(
      SWIPE_DISTANCE_MAX,
      Math.max(SWIPE_DISTANCE_MIN, viewport.clientWidth * 0.055),
    );

    if (Math.abs(distance) >= swipeDistance) {
      const steps = Math.min(
        2,
        Math.max(1, Math.round(Math.abs(distance) / Math.max(1, viewport.clientWidth * 0.45))),
      );
      selectSlot(activeSlotRef.current + (distance < 0 ? steps : -steps));
    } else {
      selectSlot(findNearestSlot());
    }

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
        <span className="marketing-home-insights-all" aria-hidden="true">
          {copy.all}
          <ArrowRight size={16} weight="bold" />
        </span>
      </header>

      <p className="sr-only" aria-live="polite">
        {copy.position(activeIndex + 1, articles.length)}. {copy.instructions}
      </p>

      <div className="marketing-home-insights-stage">
        <button
          type="button"
          className="marketing-home-insights-arrow marketing-home-insights-arrow-prev"
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
          onDragStart={(event) => event.preventDefault()}
          onScroll={queueRecentering}
          onScrollEnd={recenterToMiddle}
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
                  data-insight-index={slot % articles.length}
                  data-insight-slot={slot}
                  aria-current={isFeatured ? "true" : undefined}
                  className={`marketing-home-insights-card${isFeatured ? " is-featured" : ""}${isAdjacent ? " is-adjacent" : ""}${isPeripheral ? " is-peripheral" : ""}`}
                  key={`${article.id}-${slot}`}
                >
                  <div className="marketing-home-insights-image">
                    <Image
                      src={article.image}
                      alt={article.imageAlt[locale]}
                      width={960}
                      height={620}
                      sizes="(max-width: 760px) 84vw, 650px"
                      draggable={false}
                    />
                  </div>
                  <h3>{article.title[locale]}</h3>
                  {isFeatured && (
                    <span className="marketing-home-insights-more">
                      {copy.more}
                      <ArrowRight size={15} weight="bold" aria-hidden="true" />
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          className="marketing-home-insights-arrow marketing-home-insights-arrow-next"
          onClick={() => selectSlot(activeSlotRef.current + 1)}
          aria-label={copy.next}
        >
          <CaretRight size={22} weight="regular" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
