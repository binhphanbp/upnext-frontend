import type { ReactNode } from "react";

import { useBoostImpression } from "./use-boost-impression";

/**
 * `useBoostImpression` is a hook, so it cannot be called inside a
 * `.map(...)` callback directly -- this wraps each rendered card in its own
 * component instance instead, without extracting the card's (often large)
 * JSX body into a separate named component. No-ops (no IntersectionObserver)
 * for an organic card, since `deliveryToken` is undefined there. Shared by
 * `jobs-page.tsx` and `featured-jobs.tsx` -- both interleave sponsored cards
 * into an otherwise-organic results list.
 */
export function SponsoredCardImpressionBoundary({
  deliveryToken,
  children,
}: {
  deliveryToken?: string | undefined;
  children: (ref: (node: Element | null) => void) => ReactNode;
}) {
  const impressionRef = useBoostImpression(deliveryToken ?? null);
  return <>{children(impressionRef)}</>;
}
