"use client";

import { DownloadSimple, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type InstallPromptBannerProps = Readonly<{
  locale: string;
}>;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_STORAGE_KEY = "upnext.pwa.installPromptDismissedAt";
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
// The browser fires beforeinstallprompt as soon as its own install
// heuristics pass, which can be on first paint -- showing our own CTA that
// instant would ambush a candidate who just landed on the page. A short
// dwell delay is a cheap stand-in for "only after a meaningful action"
// without needing a page-to-shell event bus to detect one.
const MIN_DWELL_MS = 4000;

const copyByLocale = {
  vi: {
    message: "Cài UpNext vào máy để mở nhanh hơn, kể cả khi mất mạng.",
    install: "Cài đặt",
    dismissAria: "Đóng gợi ý cài đặt",
  },
  en: {
    message: "Install UpNext for faster access, even when you're offline.",
    install: "Install",
    dismissAria: "Dismiss install prompt",
  },
} as const;

export function InstallPromptBanner({ locale }: InstallPromptBannerProps) {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_STORAGE_KEY) ?? 0);
    if (Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;

    let revealTimer: number | undefined;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
      revealTimer = window.setTimeout(() => setIsVisible(true), MIN_DWELL_MS);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.clearTimeout(revealTimer);
    };
  }, []);

  if (!isVisible || !deferredEvent) return null;

  const copy = locale === "en" ? copyByLocale.en : copyByLocale.vi;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    setIsVisible(false);
  };

  const install = async () => {
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    if (choice.outcome === "dismissed") {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    }
    setIsVisible(false);
    setDeferredEvent(null);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
      <span className="flex items-center gap-2 text-center font-medium">
        <DownloadSimple size={16} aria-hidden="true" className="shrink-0" />
        {copy.message}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void install()}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {copy.install}
        </button>
        <button
          type="button"
          aria-label={copy.dismissAria}
          onClick={dismiss}
          className="grid size-7 place-items-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
