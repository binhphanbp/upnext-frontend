"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";

type PreviewPlacement = "bottom" | "left" | "right" | "sheet" | "top";

type PreviewPosition = {
  arrowOffset: number;
  left: number;
  maxHeight: number;
  placement: PreviewPlacement;
  ready: boolean;
  top: number;
};

type PreviewStyle = CSSProperties & {
  "--job-preview-arrow-offset": string;
};

const VIEWPORT_GAP = 12;
const PREVIEW_GAP = 14;
const COMPACT_BREAKPOINT = 900;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function getSafeViewportTop() {
  const header = document.querySelector<HTMLElement>(".marketing-home-header");
  const headerRect = header?.getBoundingClientRect();

  if (!headerRect || headerRect.bottom <= 0 || headerRect.top >= window.innerHeight) {
    return VIEWPORT_GAP;
  }

  return Math.max(VIEWPORT_GAP, Math.round(headerRect.bottom + VIEWPORT_GAP));
}

/**
 * Positions a non-modal job preview next to its source card and flips it before
 * it can collide with the sticky header or a viewport edge.
 */
export function useAnchoredJobPreview(activeId: string | null): {
  placement: PreviewPlacement;
  previewRef: RefObject<HTMLDialogElement | null>;
  previewStyle: PreviewStyle;
  setPreviewAnchor: (trigger: HTMLElement, cardSelector: string) => void;
} {
  const anchorRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLDialogElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [position, setPosition] = useState<PreviewPosition>({
    arrowOffset: 40,
    left: VIEWPORT_GAP,
    maxHeight: 520,
    placement: "bottom",
    ready: false,
    top: VIEWPORT_GAP,
  });

  const setPreviewAnchor = useCallback((trigger: HTMLElement, cardSelector: string) => {
    anchorRef.current = trigger.closest<HTMLElement>(cardSelector) ?? trigger;
    setPosition((current) => ({ ...current, ready: false }));
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const preview = previewRef.current;
    if (!activeId || !anchor || !preview) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeTop = getSafeViewportTop();
    const safeBottom = viewportHeight - VIEWPORT_GAP;
    const availableHeight = Math.max(0, safeBottom - safeTop);
    const anchorRect = anchor.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    const previewWidth = Math.min(previewRect.width, viewportWidth - VIEWPORT_GAP * 2);
    const previewHeight = Math.min(previewRect.height, availableHeight);

    if (anchorRect.bottom < safeTop || anchorRect.top > safeBottom) {
      setPosition((current) => ({ ...current, ready: false }));
      return;
    }

    let placement: PreviewPlacement;
    let left: number;
    let top: number;
    let arrowOffset = 40;

    if (viewportWidth <= COMPACT_BREAKPOINT) {
      placement = "sheet";
      left = VIEWPORT_GAP;
      top = Math.max(safeTop, safeBottom - previewHeight);
    } else {
      const roomOnRight = viewportWidth - anchorRect.right - VIEWPORT_GAP;
      const roomOnLeft = anchorRect.left - VIEWPORT_GAP;
      const canFitRight = roomOnRight >= previewWidth + PREVIEW_GAP;
      const canFitLeft = roomOnLeft >= previewWidth + PREVIEW_GAP;
      const alignToAnchorTop = clamp(anchorRect.top, safeTop, safeBottom - previewHeight);

      if (canFitRight && (!canFitLeft || roomOnRight >= roomOnLeft)) {
        placement = "right";
        left = clamp(
          anchorRect.right + PREVIEW_GAP,
          VIEWPORT_GAP,
          viewportWidth - previewWidth - VIEWPORT_GAP,
        );
        top = alignToAnchorTop;
        arrowOffset = clamp(
          anchorRect.top + Math.min(anchorRect.height / 2, 52) - top,
          28,
          previewHeight - 28,
        );
      } else if (canFitLeft) {
        placement = "left";
        left = clamp(
          anchorRect.left - previewWidth - PREVIEW_GAP,
          VIEWPORT_GAP,
          viewportWidth - previewWidth - VIEWPORT_GAP,
        );
        top = alignToAnchorTop;
        arrowOffset = clamp(
          anchorRect.top + Math.min(anchorRect.height / 2, 52) - top,
          28,
          previewHeight - 28,
        );
      } else {
        const roomBelow = safeBottom - anchorRect.bottom;
        const roomAbove = anchorRect.top - safeTop;
        placement =
          roomBelow >= previewHeight + PREVIEW_GAP || roomBelow >= roomAbove ? "bottom" : "top";
        left = clamp(
          anchorRect.left + anchorRect.width / 2 - previewWidth / 2,
          VIEWPORT_GAP,
          viewportWidth - previewWidth - VIEWPORT_GAP,
        );
        top =
          placement === "bottom"
            ? clamp(anchorRect.bottom + PREVIEW_GAP, safeTop, safeBottom - previewHeight)
            : clamp(
                anchorRect.top - previewHeight - PREVIEW_GAP,
                safeTop,
                safeBottom - previewHeight,
              );
        arrowOffset = clamp(anchorRect.left + anchorRect.width / 2 - left, 28, previewWidth - 28);
      }
    }

    setPosition({
      arrowOffset,
      left: Math.round(left),
      maxHeight: Math.round(availableHeight),
      placement,
      ready: true,
      top: Math.round(top),
    });
  }, [activeId]);

  useEffect(() => {
    if (!activeId) {
      setPosition((current) => ({ ...current, ready: false }));
      return undefined;
    }

    updatePosition();
    frameRef.current = window.requestAnimationFrame(updatePosition);

    function schedulePositionUpdate() {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(updatePosition);
    }

    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("scroll", schedulePositionUpdate, true);

    return () => {
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate, true);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [activeId, updatePosition]);

  return {
    placement: position.placement,
    previewRef,
    previewStyle: {
      "--job-preview-arrow-offset": `${position.arrowOffset}px`,
      left: position.left,
      maxHeight: position.maxHeight,
      top: position.top,
      visibility: position.ready ? "visible" : "hidden",
    },
    setPreviewAnchor,
  };
}
