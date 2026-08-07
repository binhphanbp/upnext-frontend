"use client";

import { ArrowDown } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import type { AiMessage, AiMessageFeedback } from "../types";
import { AiMessageItem } from "./ai-message-item";

type AiMessageListProps = {
  messages: AiMessage[];
  isResolvingAction: boolean;
  onFeedback: (messageId: string, feedback: AiMessageFeedback) => void;
  onResolveAction: (actionId: string, decision: "CONFIRMED" | "REJECTED") => void;
  onSuggestion: (prompt: string) => void;
  onRetry: () => void;
  /** Rendered inside the scroller when there are no messages yet. */
  emptyState: ReactNode;
  className?: string;
};

/** Within this many pixels of the bottom still counts as "following along". */
const STICK_THRESHOLD_PX = 120;

export function AiMessageList({
  messages,
  isResolvingAction,
  onFeedback,
  onResolveAction,
  onSuggestion,
  onRetry,
  emptyState,
  className,
}: AiMessageListProps) {
  const t = useTranslations("AiCopilot");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);

  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    setIsPinnedToBottom(distanceFromBottom <= STICK_THRESHOLD_PX);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior });
  }, []);

  // Follow the stream only while the user is actually at the bottom. Yanking the
  // viewport back down while someone is re-reading an earlier answer is the most
  // common way chat UIs become unusable during long generations.
  const lastMessage = messages.at(-1);
  const streamedLength = lastMessage?.content.length ?? 0;
  useEffect(() => {
    if (isPinnedToBottom) scrollToBottom("auto");
  }, [isPinnedToBottom, messages.length, streamedLength, scrollToBottom]);

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="ai-copilot-scroller h-full overflow-y-auto overscroll-contain"
      >
        {messages.length === 0 ? (
          emptyState
        ) : (
          <ol
            aria-live="polite"
            aria-relevant="additions text"
            aria-busy={lastMessage?.status === "streaming"}
            className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6"
          >
            {messages.map((message, index) => (
              <AiMessageItem
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
                isResolvingAction={isResolvingAction}
                onFeedback={onFeedback}
                onResolveAction={onResolveAction}
                onSuggestion={onSuggestion}
                onRetry={onRetry}
              />
            ))}
          </ol>
        )}
      </div>

      {!isPinnedToBottom && messages.length > 0 ? (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="upnext-focus absolute bottom-4 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-colors hover:bg-slate-50"
          aria-label={t("list.scrollToBottom")}
        >
          <ArrowDown className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
