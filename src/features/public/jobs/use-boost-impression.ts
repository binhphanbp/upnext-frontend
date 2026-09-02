import { useCallback, useEffect, useRef } from "react";

import { recordBoostImpression } from "./sponsored-jobs-api";

/** How long a card must stay ≥50% visible before it counts as a real
 * impression -- a card that flashes by during a fast scroll should not
 * inflate a number a recruiter is paying to see. */
const VISIBLE_THRESHOLD = 0.5;
const DWELL_MS = 1_000;

/**
 * Fires exactly one impression for a sponsored card once it has stayed ≥50%
 * visible for 1s, no `IntersectionObserver` precedent existed anywhere in
 * `fe/src` before this. Returns a ref callback: attach it to the card's root
 * element.
 */
export function useBoostImpression(deliveryToken: string | null) {
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    firedRef.current = false;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      observerRef.current?.disconnect();
    };
  }, [deliveryToken]);

  return useCallback(
    (node: Element | null) => {
      observerRef.current?.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!node || !deliveryToken || firedRef.current) return;
      if (typeof IntersectionObserver === "undefined") return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_THRESHOLD) {
            timerRef.current = setTimeout(() => {
              if (firedRef.current) return;
              firedRef.current = true;
              void recordBoostImpression(deliveryToken).catch(() => {
                // Tracking is best-effort -- never disrupt the page for it.
              });
              observer.disconnect();
            }, DWELL_MS);
          } else if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        },
        { threshold: VISIBLE_THRESHOLD },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [deliveryToken],
  );
}
