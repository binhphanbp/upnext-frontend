"use client";

import {
  ArrowsIn,
  ArrowsOut,
  ImagesSquare,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  TransitionEvent as ReactTransitionEvent,
} from "react";

import { ChevronLeft, ChevronRight, X } from "../../home/marketing-icons";
import { getSlideReleaseDirection } from "./company-gallery-gesture";

type CompanyGalleryDialogProps = {
  activeIndex: number | null;
  images: readonly string[];
  label: string;
  onActiveIndexChange: (index: number | null) => void;
};

type PanPosition = {
  x: number;
  y: number;
};

type PointerSession = {
  axis: "horizontal" | "pending" | "vertical";
  mode: "pan" | "slide";
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastTime: number;
  velocityX: number;
  originPan: PanPosition;
  moved: boolean;
};

type SlideGesturePhase = "dragging" | "idle" | "settling";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const DRAG_THRESHOLD = 5;
const AXIS_LOCK_THRESHOLD = 10;
const FLICK_SAMPLE_MAX_AGE = 80;
const SLIDE_SETTLE_DURATION = 220;

function wrapIndex(index: number, imageCount: number) {
  return (index + imageCount) % imageCount;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function targetIsViewerUi(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, [data-gallery-ui]"));
}

export function CompanyGalleryDialog({
  activeIndex,
  images,
  label,
  onActiveIndexChange,
}: CompanyGalleryDialogProps) {
  const filmstripId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const trackOffsetRef = useRef(0);
  const settleActiveRef = useRef(false);
  const settleDirectionRef = useRef<-1 | 0 | 1>(0);
  const settleAnimationFrameRef = useRef(0);
  const settleFallbackRef = useRef<number | null>(null);
  const resetTrackAfterSelectionRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const suppressStageCloseRef = useRef(false);
  const focusFilmstripOnSelectionRef = useRef(false);
  const focusReturnRef = useRef<HTMLElement | null>(null);
  const previousActiveIndexRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState<PanPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [slideGesturePhase, setSlideGesturePhase] = useState<SlideGesturePhase>("idle");
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  function clearSlideSettleScheduling() {
    window.cancelAnimationFrame(settleAnimationFrameRef.current);
    settleAnimationFrameRef.current = 0;

    if (settleFallbackRef.current !== null) {
      window.clearTimeout(settleFallbackRef.current);
      settleFallbackRef.current = null;
    }
  }

  function setTrackOffset(offset: number) {
    trackOffsetRef.current = offset;
    trackRef.current?.style.setProperty("--gallery-track-offset", `${offset}px`);
  }

  function resetSlideTrack() {
    clearSlideSettleScheduling();
    pointerSessionRef.current = null;
    settleActiveRef.current = false;
    settleDirectionRef.current = 0;
    resetTrackAfterSelectionRef.current = false;
    setTrackOffset(0);
    setSlideGesturePhase("idle");
  }

  function resetView() {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    setImageFailed(false);
  }

  function clampPan(nextPan: PanPosition, zoomLevel: number): PanPosition {
    const stage = stageRef.current;
    const image = imageRef.current;

    if (!stage || !image || zoomLevel <= MIN_ZOOM) {
      return { x: 0, y: 0 };
    }

    const stageRect = stage.getBoundingClientRect();
    const naturalWidth = image.naturalWidth || stageRect.width;
    const naturalHeight = image.naturalHeight || stageRect.height;
    const fitScale = Math.min(stageRect.width / naturalWidth, stageRect.height / naturalHeight);
    const fittedWidth = naturalWidth * fitScale;
    const fittedHeight = naturalHeight * fitScale;
    const maximumX = Math.max(0, (fittedWidth * zoomLevel - stageRect.width) / 2);
    const maximumY = Math.max(0, (fittedHeight * zoomLevel - stageRect.height) / 2);

    return {
      x: clamp(nextPan.x, -maximumX, maximumX),
      y: clamp(nextPan.y, -maximumY, maximumY),
    };
  }

  function setZoomLevel(nextZoom: number) {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    setZoom(clampedZoom);
    setPan((currentPan) => clampPan(currentPan, clampedZoom));
  }

  function selectImage(index: number, preserveSlideTrack = false) {
    if (images.length === 0) {
      return;
    }

    const nextIndex = wrapIndex(index, images.length);
    if (!preserveSlideTrack) {
      resetSlideTrack();
    }
    focusFilmstripOnSelectionRef.current =
      nextIndex !== activeIndex && Boolean(filmstripRef.current?.contains(document.activeElement));
    resetView();
    onActiveIndexChange(nextIndex);
  }

  function selectRelativeImage(offset: number, preserveSlideTrack = false) {
    if (activeIndex === null) {
      return;
    }

    selectImage(activeIndex + offset, preserveSlideTrack);
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => {
      reduceMotionRef.current = mediaQuery.matches;
    };

    syncReducedMotion();
    mediaQuery.addEventListener("change", syncReducedMotion);

    return () => mediaQuery.removeEventListener("change", syncReducedMotion);
  }, []);

  useEffect(
    () => () => {
      clearSlideSettleScheduling();
    },
    [],
  );

  useEffect(() => {
    const wasClosed = previousActiveIndexRef.current === null;

    if (activeIndex !== null && wasClosed) {
      setShowFilmstrip(true);
      resetSlideTrack();
      resetView();
    }

    if (activeIndex === null) {
      resetSlideTrack();
      resetView();

      const fullscreenElement = document.fullscreenElement;
      if (fullscreenElement && panelRef.current?.contains(fullscreenElement)) {
        void document.exitFullscreen().catch(() => undefined);
      }
    }

    previousActiveIndexRef.current = activeIndex;
  }, [activeIndex]);

  useLayoutEffect(() => {
    if (resetTrackAfterSelectionRef.current) {
      resetSlideTrack();
    }

    if (activeIndex === null || !showFilmstrip) {
      focusFilmstripOnSelectionRef.current = false;
      return;
    }

    if (!focusFilmstripOnSelectionRef.current) {
      return;
    }

    focusFilmstripOnSelectionRef.current = false;
    thumbnailRefs.current[activeIndex]?.focus({ preventScroll: true });
  }, [activeIndex, showFilmstrip]);

  useEffect(() => {
    if (activeIndex === null || !showFilmstrip) {
      return;
    }

    const filmstrip = filmstripRef.current;
    const thumbnail = thumbnailRefs.current[activeIndex];

    if (!filmstrip || !thumbnail) {
      return;
    }

    let animationFrame = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const centerActiveThumbnail = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const railRect = filmstrip.getBoundingClientRect();
        const thumbnailRect = thumbnail.getBoundingClientRect();
        const target =
          filmstrip.scrollLeft +
          thumbnailRect.left -
          railRect.left -
          (railRect.width - thumbnailRect.width) / 2;
        const maximumScroll = Math.max(0, filmstrip.scrollWidth - filmstrip.clientWidth);

        filmstrip.scrollTo({
          left: clamp(target, 0, maximumScroll),
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    };

    centerActiveThumbnail();

    const resizeObserver = new ResizeObserver(centerActiveThumbnail);
    resizeObserver.observe(filmstrip);
    resizeObserver.observe(thumbnail);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [activeIndex, showFilmstrip]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const panel = panelRef.current;
    setFullscreenAvailable(
      Boolean(document.fullscreenEnabled && panel && typeof panel.requestFullscreen === "function"),
    );

    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();

    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [activeIndex]);

  useEffect(() => {
    if (zoom <= MIN_ZOOM) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      setPan((currentPan) => clampPan(currentPan, zoom));
    });
    resizeObserver.observe(stage);

    return () => resizeObserver.disconnect();
  }, [zoom]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectRelativeImage(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectRelativeImage(1);
      return;
    }

    if (event.key === "Home" && images.length > 0) {
      event.preventDefault();
      selectImage(0);
      return;
    }

    if (event.key === "End" && images.length > 0) {
      event.preventDefault();
      selectImage(images.length - 1);
      return;
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setZoomLevel(zoom + ZOOM_STEP);
      return;
    }

    if (event.key === "-") {
      event.preventDefault();
      setZoomLevel(zoom - ZOOM_STEP);
      return;
    }

    if (event.key === "0") {
      event.preventDefault();
      resetView();
    }
  }

  function completeSlideSettle() {
    if (!settleActiveRef.current) {
      return;
    }

    clearSlideSettleScheduling();
    settleActiveRef.current = false;
    const direction = settleDirectionRef.current;
    settleDirectionRef.current = 0;

    if (direction === 0) {
      setTrackOffset(0);
      setSlideGesturePhase("idle");
      return;
    }

    resetTrackAfterSelectionRef.current = true;
    selectRelativeImage(direction, true);
  }

  function settleSlide(direction: -1 | 0 | 1) {
    const stageWidth = stageRef.current?.clientWidth ?? 0;

    if (reduceMotionRef.current || stageWidth === 0) {
      if (direction === 0) {
        resetSlideTrack();
      } else {
        selectRelativeImage(direction);
      }
      return;
    }

    clearSlideSettleScheduling();
    settleActiveRef.current = true;
    settleDirectionRef.current = direction;
    setSlideGesturePhase("settling");

    const targetOffset = direction === 0 ? 0 : direction > 0 ? -stageWidth : stageWidth;
    settleAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setTrackOffset(targetOffset);
      settleFallbackRef.current = window.setTimeout(
        completeSlideSettle,
        SLIDE_SETTLE_DURATION + 100,
      );
    });
  }

  function handleTrackTransitionEnd(event: ReactTransitionEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && event.propertyName === "transform") {
      completeSlideSettle();
    }
  }

  function suppressNextStageClick() {
    suppressStageCloseRef.current = true;
    window.setTimeout(() => {
      suppressStageCloseRef.current = false;
    }, 0);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      slideGesturePhase === "settling" ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    const target = event.target;
    if (target instanceof Element && target.closest("button")) {
      return;
    }

    const canPan = zoom > MIN_ZOOM;
    const canSlide = zoom === MIN_ZOOM && images.length > 1;
    if (!canPan && !canSlide) {
      return;
    }

    pointerSessionRef.current = {
      axis: "pending",
      mode: canPan ? "pan" : "slide",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: event.timeStamp,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocityX: 0,
      originPan: pan,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);

    if (canPan) {
      event.preventDefault();
      setIsDragging(true);
    } else if (event.pointerType === "mouse") {
      event.preventDefault();
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const session = pointerSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    const travelX = event.clientX - session.startX;
    const travelY = event.clientY - session.startY;

    if (session.mode === "slide") {
      if (session.axis === "pending") {
        if (Math.hypot(travelX, travelY) < AXIS_LOCK_THRESHOLD) {
          return;
        }

        session.axis = Math.abs(travelX) > Math.abs(travelY) ? "horizontal" : "vertical";
        if (session.axis === "horizontal") {
          setSlideGesturePhase("dragging");
        } else {
          session.moved = true;
          suppressStageCloseRef.current = true;
        }
      }

      if (session.axis !== "horizontal") {
        return;
      }

      event.preventDefault();
      session.moved = true;
      suppressStageCloseRef.current = true;
      const sampleDuration = Math.max(1, event.timeStamp - session.lastTime);
      session.velocityX = (event.clientX - session.lastX) / sampleDuration;
      session.lastX = event.clientX;
      session.lastTime = event.timeStamp;
      const stageWidth = stageRef.current?.clientWidth ?? 0;
      setTrackOffset(clamp(travelX, -stageWidth, stageWidth));
      return;
    }

    event.preventDefault();
    if (Math.hypot(travelX, travelY) >= DRAG_THRESHOLD) {
      session.moved = true;
      suppressStageCloseRef.current = true;
    }

    setPan(
      clampPan(
        {
          x: session.originPan.x + travelX,
          y: session.originPan.y + travelY,
        },
        zoom,
      ),
    );
  }

  function finishPointerSession(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const session = pointerSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    pointerSessionRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (session.moved) {
      suppressNextStageClick();
    }

    if (session.mode === "pan") {
      setIsDragging(false);
      return;
    }

    if (cancelled || session.axis !== "horizontal") {
      resetSlideTrack();
      return;
    }

    const horizontalTravel = event.clientX - session.startX;
    const verticalTravel = event.clientY - session.startY;
    const stageWidth = stageRef.current?.clientWidth ?? 0;
    const elapsed = Math.max(1, event.timeStamp - session.startTime);
    const sampleAge = event.timeStamp - session.lastTime;
    const velocity =
      sampleAge <= FLICK_SAMPLE_MAX_AGE ? session.velocityX : horizontalTravel / elapsed;
    settleSlide(
      getSlideReleaseDirection({
        horizontalTravel,
        verticalTravel,
        releaseVelocity: velocity,
        stageWidth,
      }),
    );
  }

  function pointIsOnImage(clientX: number, clientY: number) {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image) {
      return false;
    }

    const stageRect = stage.getBoundingClientRect();
    const naturalWidth = image.naturalWidth || stageRect.width;
    const naturalHeight = image.naturalHeight || stageRect.height;
    const fitScale = Math.min(stageRect.width / naturalWidth, stageRect.height / naturalHeight);
    const renderedWidth = naturalWidth * fitScale * zoom;
    const renderedHeight = naturalHeight * fitScale * zoom;
    const left = stageRect.left + (stageRect.width - renderedWidth) / 2 + pan.x;
    const top = stageRect.top + (stageRect.height - renderedHeight) / 2 + pan.y;

    return (
      clientX >= left &&
      clientX <= left + renderedWidth &&
      clientY >= top &&
      clientY <= top + renderedHeight
    );
  }

  function handleStageClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (targetIsViewerUi(event.target)) {
      return;
    }

    if (suppressStageCloseRef.current) {
      suppressStageCloseRef.current = false;
      return;
    }

    if (!pointIsOnImage(event.clientX, event.clientY)) {
      onActiveIndexChange(null);
    }
  }

  function handleStageDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (targetIsViewerUi(event.target)) {
      return;
    }

    if (pointIsOnImage(event.clientX, event.clientY)) {
      setZoomLevel(zoom === MIN_ZOOM ? 2 : MIN_ZOOM);
    }
  }

  async function toggleFullscreen() {
    const panel = panelRef.current;
    if (!panel || !fullscreenAvailable) {
      return;
    }

    try {
      if (document.fullscreenElement === panel) {
        await document.exitFullscreen();
      } else {
        await panel.requestFullscreen();
      }
    } catch {
      setIsFullscreen(false);
    }
  }

  const zoomPercentage = Math.round(zoom * 100);
  const gallerySlides =
    activeIndex === null || images.length === 0
      ? []
      : [
          {
            index: wrapIndex(activeIndex - 1, images.length),
            position: "previous" as const,
          },
          { index: activeIndex, position: "current" as const },
          {
            index: wrapIndex(activeIndex + 1, images.length),
            position: "next" as const,
          },
        ];

  return (
    <DialogPrimitive.Root
      open={activeIndex !== null}
      onOpenChange={(open) => {
        if (!open) {
          onActiveIndexChange(null);
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="company-gallery-lightbox-backdrop" />
        <DialogPrimitive.Content
          ref={panelRef}
          className={`company-gallery-lightbox-panel${showFilmstrip ? "" : " is-filmstrip-hidden"}`}
          onClick={handleStageClick}
          onDoubleClick={handleStageDoubleClick}
          onKeyDown={handleKeyDown}
          onOpenAutoFocus={() => {
            focusReturnRef.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            const focusReturnTarget = focusReturnRef.current;
            focusReturnRef.current = null;

            if (focusReturnTarget?.isConnected) {
              event.preventDefault();
              focusReturnTarget.focus();
            }
          }}
        >
          {activeIndex !== null && images[activeIndex] ? (
            <>
              <DialogPrimitive.Title className="company-gallery-lightbox-sr-only">
                {label}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="company-gallery-lightbox-sr-only">
                Dùng phím mũi tên, kéo hoặc vuốt ảnh, hoặc chọn trong dải ảnh thu nhỏ để chuyển ảnh.
                Dùng các nút thu phóng để xem chi tiết.
              </DialogPrimitive.Description>

              <span
                className="company-gallery-lightbox-count"
                data-gallery-ui
                aria-live="polite"
                aria-atomic="true"
              >
                {activeIndex + 1}/{images.length}
              </span>

              <div
                className="company-gallery-lightbox-toolbar"
                data-gallery-ui
                role="toolbar"
                aria-label="Điều khiển bộ sưu tập ảnh"
              >
                <button
                  type="button"
                  className="company-gallery-lightbox-tool"
                  aria-label="Thu nhỏ ảnh"
                  title="Thu nhỏ ảnh"
                  disabled={zoom <= MIN_ZOOM}
                  onClick={() => setZoomLevel(zoom - ZOOM_STEP)}
                >
                  <MagnifyingGlassMinus size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="company-gallery-lightbox-zoom-value"
                  aria-label="Đặt lại thu phóng về 100%"
                  title="Đặt lại thu phóng về 100%"
                  onClick={resetView}
                >
                  {zoomPercentage}%
                </button>
                <button
                  type="button"
                  className="company-gallery-lightbox-tool"
                  aria-label="Phóng to ảnh"
                  title="Phóng to ảnh"
                  disabled={zoom >= MAX_ZOOM}
                  onClick={() => setZoomLevel(zoom + ZOOM_STEP)}
                >
                  <MagnifyingGlassPlus size={20} aria-hidden="true" />
                </button>
                {fullscreenAvailable ? (
                  <button
                    type="button"
                    className="company-gallery-lightbox-tool"
                    aria-label={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
                    aria-pressed={isFullscreen}
                    title={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
                    onClick={() => void toggleFullscreen()}
                  >
                    {isFullscreen ? (
                      <ArrowsIn size={20} aria-hidden="true" />
                    ) : (
                      <ArrowsOut size={20} aria-hidden="true" />
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="company-gallery-lightbox-tool"
                  aria-label={showFilmstrip ? "Ẩn dải ảnh thu nhỏ" : "Hiện dải ảnh thu nhỏ"}
                  aria-controls={filmstripId}
                  aria-pressed={showFilmstrip}
                  title={showFilmstrip ? "Ẩn dải ảnh thu nhỏ" : "Hiện dải ảnh thu nhỏ"}
                  onClick={() => setShowFilmstrip((current) => !current)}
                >
                  <ImagesSquare size={20} aria-hidden="true" />
                </button>
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="company-gallery-lightbox-tool company-gallery-lightbox-close"
                    aria-label="Đóng bộ sưu tập ảnh"
                    title="Đóng bộ sưu tập ảnh"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </DialogPrimitive.Close>
              </div>

              <div
                ref={stageRef}
                className={`company-gallery-lightbox-stage${isDragging ? " is-dragging" : ""}${zoom > MIN_ZOOM ? " is-zoomed" : ""}${slideGesturePhase === "dragging" ? " is-slide-dragging" : ""}${slideGesturePhase === "settling" ? " is-slide-settling" : ""}`}
                data-gallery-gesture={slideGesturePhase}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => finishPointerSession(event)}
                onPointerCancel={(event) => finishPointerSession(event, true)}
              >
                <div
                  ref={trackRef}
                  className="company-gallery-lightbox-track"
                  onTransitionEnd={handleTrackTransitionEnd}
                >
                  {gallerySlides.map(({ index, position }) => {
                    const isCurrent = position === "current";

                    return (
                      <div
                        key={`${position}-${index}`}
                        className={`company-gallery-lightbox-slide is-${position}`}
                        data-gallery-slide={position}
                        aria-hidden={isCurrent ? undefined : "true"}
                      >
                        <Image
                          ref={isCurrent ? imageRef : undefined}
                          className="company-gallery-lightbox-image"
                          src={images[index]!}
                          alt={isCurrent ? `Môi trường làm việc ${index + 1}` : ""}
                          fill
                          sizes="100vw"
                          priority={isCurrent}
                          loading={isCurrent ? undefined : "eager"}
                          draggable={false}
                          onLoad={isCurrent ? () => setImageFailed(false) : undefined}
                          onError={isCurrent ? () => setImageFailed(true) : undefined}
                          style={
                            isCurrent
                              ? {
                                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                                }
                              : undefined
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                {imageFailed ? (
                  <output
                    className="company-gallery-lightbox-error"
                    data-gallery-ui
                    aria-live="polite"
                  >
                    Không thể tải ảnh này. Hãy thử chuyển sang ảnh khác.
                  </output>
                ) : null}
              </div>

              <button
                type="button"
                className="company-gallery-lightbox-nav is-prev"
                aria-label="Xem ảnh trước"
                title="Xem ảnh trước"
                onClick={() => selectRelativeImage(-1)}
              >
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="company-gallery-lightbox-nav is-next"
                aria-label="Xem ảnh tiếp theo"
                title="Xem ảnh tiếp theo"
                onClick={() => selectRelativeImage(1)}
              >
                <ChevronRight size={24} aria-hidden="true" />
              </button>

              <footer
                id={filmstripId}
                className="company-gallery-lightbox-filmstrip"
                data-gallery-ui
                hidden={!showFilmstrip}
              >
                <fieldset className="company-gallery-lightbox-filmstrip-group">
                  <legend className="company-gallery-lightbox-sr-only">Danh sách ảnh</legend>
                  <div className="company-gallery-lightbox-filmstrip-shell">
                    <div
                      ref={filmstripRef}
                      className="company-gallery-lightbox-thumbs"
                      data-gallery-filmstrip
                    >
                      {images.map((src, index) => (
                        <button
                          key={`${src}-thumb-${index}`}
                          ref={(thumbnail) => {
                            thumbnailRefs.current[index] = thumbnail;
                          }}
                          type="button"
                          className={index === activeIndex ? "is-active" : undefined}
                          tabIndex={index === activeIndex ? 0 : -1}
                          onClick={() => selectImage(index)}
                          aria-label={`Chọn ảnh ${index + 1}`}
                          aria-current={index === activeIndex ? "true" : undefined}
                        >
                          <Image src={src} alt="" width={120} height={80} sizes="84px" />
                        </button>
                      ))}
                    </div>
                  </div>
                </fieldset>
              </footer>
            </>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
