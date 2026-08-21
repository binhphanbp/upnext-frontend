"use client";

import { Robot, User } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/cn";

import type { TranscriptSegment } from "../../types";

/**
 * The running transcript.
 *
 * Interim results render dimmed and italic; finals render solid. That
 * distinction is the whole point — speech recognition revises itself, and a
 * candidate who sees a wrong word freeze on screen assumes the system
 * misheard them permanently. Dimming says "still deciding".
 *
 * The list is an `aria-live` log so a screen-reader user hears the interviewer's
 * lines without having to move focus away from the answer controls.
 */
export function LiveTranscript({
  segments,
  interimSegment,
  className,
}: {
  segments: TranscriptSegment[];
  interimSegment: TranscriptSegment | null;
  className?: string;
}) {
  const t = useTranslations("AiInterview");
  const endRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPinnedRef = useRef(true);

  // Follow the tail, but stop following the moment the user scrolls up to read
  // something earlier — nothing is more hostile than being yanked back down.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const onScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isPinnedRef.current = distanceFromBottom < 48;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isPinnedRef.current) endRef.current?.scrollIntoView({ block: "end" });
  }, [segments, interimSegment]);

  const isEmpty = segments.length === 0 && !interimSegment;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        ref={containerRef}
        role="log"
        aria-live="polite"
        aria-label={t("transcript.title")}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {isEmpty ? (
          <p className="py-8 text-center text-sm text-slate-500">{t("transcript.empty")}</p>
        ) : null}

        {segments.map((segment) => (
          <TranscriptLine key={segment.id} segment={segment} />
        ))}

        {interimSegment ? <TranscriptLine segment={interimSegment} /> : null}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function TranscriptLine({ segment }: { segment: TranscriptSegment }) {
  const t = useTranslations("AiInterview");
  const isInterviewer = segment.speaker === "interviewer";
  const Icon = isInterviewer ? Robot : User;

  return (
    <div className="flex gap-2.5">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg",
          isInterviewer ? "bg-slate-700/80 text-slate-300" : "bg-emerald-500/15 text-emerald-300",
        )}
      >
        <Icon weight="fill" className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[11px] font-bold tracking-[0.06em] uppercase",
            isInterviewer ? "text-slate-500" : "text-emerald-500/80",
          )}
        >
          {isInterviewer ? t("transcript.interviewer") : t("transcript.you")}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm leading-relaxed text-pretty",
            segment.isFinal ? "text-slate-200" : "text-slate-400 italic",
          )}
        >
          {segment.text}
          {segment.isFinal ? null : (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse rounded-full bg-emerald-400 align-middle"
            />
          )}
        </p>
      </div>
    </div>
  );
}
