"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";

type PwaServiceWorkerProps = {
  locale: string;
};

// This toast is mounted once in the root layout, outside
// NextIntlClientProvider, for every role -- so it can't use the
// locale-aware usePathname from "@/i18n/navigation" (that needs the
// provider context) and instead strips the locale prefix itself from
// next/navigation's raw pathname. The candidate workspace has its own
// bottom tab bar on narrow viewports (<=820px, matching the header's
// compact-menu breakpoint) that a bottom-4 toast would otherwise land on
// top of.
function useIsCandidateWorkspaceWithTabBar(locale: string) {
  const pathname = usePathname();
  const localePrefix = `/${locale}`;
  const path = pathname.startsWith(localePrefix) ? pathname.slice(localePrefix.length) : pathname;
  return path.startsWith("/candidate") && !path.endsWith("/cv-builder");
}

const copyByLocale = {
  vi: {
    message: "Phiên bản mới của UpNext đã sẵn sàng.",
    update: "Cập nhật",
    dismiss: "Để sau",
  },
  en: {
    message: "A new version of UpNext is ready.",
    update: "Update now",
    dismiss: "Later",
  },
} as const;

export function PwaServiceWorker({ locale }: PwaServiceWorkerProps) {
  const [updateWorker, setUpdateWorker] = useState<ServiceWorker | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const shouldReload = useRef(false);
  const isCandidateWithTabBar = useIsCandidateWorkspaceWithTabBar(locale);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let isActive = true;

    const handleControllerChange = () => {
      if (shouldReload.current) {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (!isActive) return;

        const revealWaitingUpdate = () => {
          if (navigator.serviceWorker.controller && registration.waiting) {
            setUpdateWorker(registration.waiting);
          }
        };

        revealWaitingUpdate();
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              revealWaitingUpdate();
            }
          });
        });
      })
      .catch(() => {
        // Service workers are progressive enhancement; the web app stays fully usable.
      });

    return () => {
      isActive = false;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const copy = locale === "en" ? copyByLocale.en : copyByLocale.vi;

  if (!updateWorker || isDismissed) return null;

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 left-4 z-[100] mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.16)] sm:left-auto",
        isCandidateWithTabBar && "max-[820px]:bottom-[calc(72px+env(safe-area-inset-bottom))]",
      )}
    >
      <output className="text-sm leading-5 font-medium text-slate-700" aria-live="polite">
        {copy.message}
      </output>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="min-h-9 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => {
            shouldReload.current = true;
            updateWorker.postMessage({ type: "SKIP_WAITING" });
          }}
        >
          {copy.update}
        </button>
        <button
          type="button"
          className="min-h-9 rounded-lg px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => setIsDismissed(true)}
        >
          {copy.dismiss}
        </button>
      </div>
    </div>
  );
}
