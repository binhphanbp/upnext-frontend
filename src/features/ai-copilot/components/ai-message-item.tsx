"use client";

import { Check, Copy, Info, Sparkle, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";

import type { AiMessage, AiMessageFeedback } from "../types";
import { AiActionConfirmation } from "./ai-action-confirmation";
import { AiCitationList } from "./ai-citation-list";
import { AiMarkdown } from "./ai-markdown";
import { AiRunTimeline } from "./ai-run-timeline";
import { AiStateNotice } from "./ai-state-notice";
import { AiCardRenderer } from "./cards/ai-card-renderer";

type AiMessageItemProps = {
  message: AiMessage;
  isLast: boolean;
  isResolvingAction: boolean;
  onFeedback: (messageId: string, feedback: AiMessageFeedback) => void;
  onResolveAction: (actionId: string, decision: "CONFIRMED" | "REJECTED") => void;
  onSuggestion: (prompt: string) => void;
  onRetry: () => void;
};

export function AiMessageItem({
  message,
  isLast,
  isResolvingAction,
  onFeedback,
  onResolveAction,
  onSuggestion,
  onRetry,
}: AiMessageItemProps) {
  const t = useTranslations("AiCopilot");
  const [highlightedCitationId, setHighlightedCitationId] = useState<string | null>(null);
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  if (message.role === "user") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-600 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
          {message.content}
        </div>
      </li>
    );
  }

  const isStreaming = message.status === "streaming";
  const hasBody = message.content.length > 0;
  const actionRequest = message.actionRequest;

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 1_600);
    } catch {
      // Clipboard is permission-gated; silently keeping the old state is the
      // right failure mode here — nothing was lost.
    }
  };

  const focusCitation = (citationId: string) => {
    setHighlightedCitationId(citationId);
    document
      .getElementById(`citation-${citationId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => setHighlightedCitationId(null), 1_800);
  };

  return (
    <li className="flex gap-3">
      <div
        aria-hidden
        className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"
      >
        <Sparkle weight="fill" className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        {message.intent ? (
          <p className="mb-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
            {t(`intent.${message.intent}`)}
          </p>
        ) : null}

        <AiRunTimeline toolCalls={message.toolCalls} status={message.status} className="mb-3" />

        {hasBody ? (
          <AiMarkdown
            content={message.content}
            citations={message.citations}
            onCitationClick={(citation) => focusCitation(citation.id)}
            isStreaming={isStreaming}
          />
        ) : null}

        {message.cards.length > 0 ? (
          <div className="mt-3 space-y-2.5">
            {message.cards.map((card, index) => (
              <div key={`${card.type}-${index}`} className="ai-copilot-enter">
                <AiCardRenderer card={card} />
              </div>
            ))}
          </div>
        ) : null}

        {actionRequest ? (
          <AiActionConfirmation
            actionRequest={actionRequest}
            isPending={isResolvingAction}
            onResolve={(decision) => onResolveAction(actionRequest.id, decision)}
          />
        ) : null}

        <AiCitationList citations={message.citations} highlightedId={highlightedCitationId} />

        <AiStateNotice
          status={message.status}
          {...(message.errorCode === undefined ? {} : { errorCode: message.errorCode })}
          {...(message.errorDetail === undefined ? {} : { detail: message.errorDetail })}
          onRetry={onRetry}
        />

        {!isStreaming && hasBody ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-0.5">
            <IconAction
              label={t("feedback.up")}
              isActive={message.feedback === "up"}
              onClick={() => onFeedback(message.id, "up")}
            >
              <ThumbsUp weight={message.feedback === "up" ? "fill" : "regular"} />
            </IconAction>
            <IconAction
              label={t("feedback.down")}
              isActive={message.feedback === "down"}
              onClick={() => onFeedback(message.id, "down")}
            >
              <ThumbsDown weight={message.feedback === "down" ? "fill" : "regular"} />
            </IconAction>
            <IconAction label={t("feedback.copy")} onClick={() => void copyAnswer()}>
              {hasCopied ? <Check className="text-emerald-600" /> : <Copy />}
            </IconAction>
            {message.meta ? (
              <IconAction
                label={t("meta.toggle")}
                isActive={isMetaOpen}
                onClick={() => setIsMetaOpen((current) => !current)}
              >
                <Info />
              </IconAction>
            ) : null}
            {message.feedback === "down" ? (
              <span className="ml-1.5 text-[11px] text-slate-400">{t("feedback.thanks")}</span>
            ) : null}
          </div>
        ) : null}

        {isMetaOpen && message.meta ? (
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:grid-cols-3">
            <MetaRow label={t("meta.model")} value={message.meta.model} />
            <MetaRow label={t("meta.promptVersion")} value={message.meta.promptVersion} />
            <MetaRow
              label={t("meta.latency")}
              value={`${(message.meta.latencyMs / 1000).toFixed(2)}s`}
            />
            <MetaRow
              label={t("meta.inputTokens")}
              value={message.meta.inputTokens.toLocaleString("vi-VN")}
            />
            <MetaRow
              label={t("meta.outputTokens")}
              value={message.meta.outputTokens.toLocaleString("vi-VN")}
            />
            <MetaRow label={t("meta.messageId")} value={message.id} />
          </dl>
        ) : null}

        {isLast && !isStreaming && message.suggestions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestion(suggestion)}
                className="upnext-focus rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function IconAction({
  children,
  label,
  isActive = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        "upnext-focus grid size-8 place-items-center rounded-lg transition-colors [&_svg]:size-4",
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold tracking-[0.06em] text-slate-400 uppercase">{label}</dt>
      <dd className="truncate font-mono text-[11.5px] text-slate-700">{value}</dd>
    </div>
  );
}
