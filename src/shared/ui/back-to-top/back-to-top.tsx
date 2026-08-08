"use client";

import { ArrowUp } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";

const SHOW_THRESHOLD_PX = 400;
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Chỉ đọc `window.scrollY`/`document.documentElement.scrollHeight` — đúng cho
 * các trang nội dung công khai (bài viết, tin tuyển dụng, hồ sơ công ty) vốn
 * cuộn theo `window`. Không dùng được trong workspace (`WorkspaceShell`), nơi
 * vùng nội dung tự cuộn trong một `<main overflow-y-auto>` riêng — mount ở đó
 * cần một cơ chế khác để đọc đúng scroll container.
 */
export function BackToTop() {
  const t = useTranslations("BackToTop");
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? scrollTop / scrollable : 0;

      setProgress(Math.min(1, Math.max(0, ratio)));
      setIsVisible(scrollTop > SHOW_THRESHOLD_PX);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("label")}
      tabIndex={isVisible ? 0 : -1}
      className={cn(
        "upnext-focus fixed bottom-5 left-5 z-40 grid size-12 place-items-center rounded-full bg-white text-slate-600 shadow-lg shadow-slate-900/10 transition-all duration-300 hover:text-emerald-600 hover:shadow-xl motion-reduce:transition-none",
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-slate-200"
        />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          className="text-emerald-500 transition-[stroke-dashoffset] duration-150 ease-out motion-reduce:transition-none"
          stroke="currentColor"
        />
      </svg>
      <ArrowUp weight="bold" className="size-5" />
    </button>
  );
}
