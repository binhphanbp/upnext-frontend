"use client";

import { WifiSlash } from "@phosphor-icons/react";

import { useIsOnline } from "./hooks/use-is-online";

type OfflineBannerProps = Readonly<{
  locale: string;
}>;

const copyByLocale = {
  vi: {
    message: "Bạn đang ngoại tuyến. Một số nội dung có thể chưa được cập nhật.",
  },
  en: {
    message: "You're offline. Some content may be out of date.",
  },
} as const;

// Rendered inline right below the header rather than as a fixed toast: the
// bottom of the candidate workspace is already crowded (tab bar, AI Copilot
// launcher, the PWA update toast), and connectivity status is exactly the
// kind of thing that should stay visible while scrolling, not disappear
// under other floating chrome.
export function OfflineBanner({ locale }: OfflineBannerProps) {
  const isOnline = useIsOnline();

  if (isOnline) return null;

  const copy = locale === "en" ? copyByLocale.en : copyByLocale.vi;

  return (
    <output
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900"
    >
      <WifiSlash size={16} aria-hidden="true" className="shrink-0" />
      {copy.message}
    </output>
  );
}
