"use client";

import { ArrowClockwise, Check, Clock } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/cn";

import type { ChatMessage } from "../types/contracts";
import { MessageAttachmentItem } from "./message-attachment";

export function MessageItem({
  message,
  mine,
  onRetry,
}: {
  message: ChatMessage;
  mine: boolean;
  onRetry?: (message: ChatMessage) => void;
}) {
  if (message.type === "SYSTEM") {
    return (
      <div className="my-3 flex justify-center px-4">
        <p className="max-w-xl rounded-full bg-slate-100 px-4 py-2 text-center text-xs text-slate-600">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex px-4 py-1.5", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(78%,620px)] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
          mine
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
        )}
      >
        {message.content ? (
          <p className="break-words whitespace-pre-wrap">{linkify(message.content, mine)}</p>
        ) : null}
        {message.attachments.map((attachment) => (
          <MessageAttachmentItem
            key={attachment.id}
            attachment={attachment}
            conversationId={message.conversationId}
          />
        ))}
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            mine ? "text-blue-100" : "text-slate-400",
          )}
        >
          <time dateTime={message.createdAt}>
            {new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
              new Date(message.createdAt),
            )}
          </time>
          {mine && message.deliveryState === "pending" ? <Clock aria-label="Đang gửi" /> : null}
          {mine && (!message.deliveryState || message.deliveryState === "sent") ? (
            <Check aria-label="Đã gửi" />
          ) : null}
        </div>
        {message.deliveryState === "failed" ? (
          <button
            type="button"
            onClick={() => onRetry?.(message)}
            className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-100 underline"
          >
            <ArrowClockwise /> Gửi lại
          </button>
        ) : null}
      </div>
    </div>
  );
}

function linkify(content: string, light: boolean) {
  const parts = content.split(/(https?:\/\/[^\s]+)/gu);
  return parts.map((part, index) =>
    /^https?:\/\//u.test(part) ? (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("underline", light ? "text-white" : "text-blue-700")}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}
