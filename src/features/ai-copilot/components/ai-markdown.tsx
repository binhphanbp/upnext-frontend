"use client";

import { Fragment, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import type { AiCitation } from "../types";

/**
 * A deliberately tiny markdown subset rendered straight to React nodes.
 *
 * §16.1 forbids rendering unsanitised HTML from model output, so there is no
 * `dangerouslySetInnerHTML` anywhere in this feature and no markdown library
 * that could grow an HTML passthrough. Supported: paragraphs, `**bold**`,
 * `` `code` ``, `- ` bullets, `1. ` ordered items, and `[n]` citation markers.
 *
 * The parser also has to be safe on *partial* input: it runs on every streamed
 * token, so an unterminated `**` must render as literal text rather than
 * swallowing the rest of the answer.
 */

type AiMarkdownProps = {
  content: string;
  citations: AiCitation[];
  onCitationClick?: (citation: AiCitation) => void;
  className?: string;
  /** Renders a caret at the end of the last line while tokens are arriving. */
  isStreaming?: boolean;
};

const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[\d+\])/g;

function renderInline(
  text: string,
  citations: AiCitation[],
  onCitationClick: AiMarkdownProps["onCitationClick"],
  keyPrefix: string,
): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const citationMatch = /^\[(\d+)\]$/.exec(part);
    if (citationMatch) {
      const index_ = Number(citationMatch[1]);
      const citation = citations.find((item) => item.index === index_);
      if (!citation) {
        // The marker arrived before its `citation` event — render a placeholder
        // rather than a dead chip that never becomes clickable.
        return (
          <span
            key={key}
            className="mx-0.5 inline-flex h-[1.15em] min-w-[1.15em] items-center justify-center rounded-[5px] bg-slate-100 px-1 align-[0.05em] text-[0.7em] font-semibold text-slate-400"
          >
            {index_}
          </span>
        );
      }
      return (
        <button
          key={key}
          type="button"
          onClick={() => onCitationClick?.(citation)}
          title={citation.title}
          aria-label={`Nguồn ${index_}: ${citation.title}`}
          className="upnext-focus mx-0.5 inline-flex h-[1.15em] min-w-[1.15em] items-center justify-center rounded-[5px] bg-emerald-100 px-1 align-[0.05em] text-[0.7em] font-bold text-emerald-800 transition-colors hover:bg-emerald-200"
        >
          {index_}
        </button>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

type Block =
  | { kind: "paragraph"; lines: string[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "ordered"; items: string[] };

function toBlocks(content: string): Block[] {
  const blocks: Block[] = [];

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const last = blocks.at(-1);

    if (!line.trim()) {
      // Blank line closes whatever block is open.
      if (last) blocks.push({ kind: "paragraph", lines: [] });
      continue;
    }

    // `*` phải có mặt: model thường xuyên xuất `*   mục` thay vì `- mục`, và khi
    // parser không nhận thì cả danh sách rơi xuống thành đoạn văn có dấu sao —
    // trông như lỗi hiển thị. Đặt sau `**bold**` không thành vấn đề vì mẫu này
    // đòi khoảng trắng ngay sau dấu, còn in đậm thì không có.
    const bullet = /^\s*[-•*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (last?.kind === "bullets") last.items.push(bullet[1] ?? "");
      else blocks.push({ kind: "bullets", items: [bullet[1] ?? ""] });
      continue;
    }

    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ordered) {
      if (last?.kind === "ordered") last.items.push(ordered[1] ?? "");
      else blocks.push({ kind: "ordered", items: [ordered[1] ?? ""] });
      continue;
    }

    if (last?.kind === "paragraph" && last.lines.length > 0) last.lines.push(line);
    else blocks.push({ kind: "paragraph", lines: [line] });
  }

  return blocks.filter((block) => (block.kind === "paragraph" ? block.lines.length > 0 : true));
}

export function AiMarkdown({
  content,
  citations,
  onCitationClick,
  className,
  isStreaming = false,
}: AiMarkdownProps) {
  const blocks = toBlocks(content);

  return (
    <div className={cn("space-y-3 text-[15px] leading-[1.7] text-slate-700", className)}>
      {blocks.map((block, blockIndex) => {
        const isLastBlock = blockIndex === blocks.length - 1;
        const caret =
          isStreaming && isLastBlock ? (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse rounded-full bg-emerald-500"
            />
          ) : null;

        if (block.kind === "bullets") {
          return (
            <ul key={blockIndex} className="space-y-1.5 pl-1">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-[0.62em] size-1.5 shrink-0 rounded-full bg-slate-300"
                  />
                  <span className="min-w-0">
                    {renderInline(item, citations, onCitationClick, `${blockIndex}-${itemIndex}`)}
                    {isLastBlock && itemIndex === block.items.length - 1 ? caret : null}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "ordered") {
          return (
            <ol key={blockIndex} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-[0.15em] grid size-5 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600"
                  >
                    {itemIndex + 1}
                  </span>
                  <span className="min-w-0">
                    {renderInline(item, citations, onCitationClick, `${blockIndex}-${itemIndex}`)}
                    {isLastBlock && itemIndex === block.items.length - 1 ? caret : null}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex} className="text-pretty">
            {renderInline(block.lines.join(" "), citations, onCitationClick, `${blockIndex}`)}
            {caret}
          </p>
        );
      })}

      {blocks.length === 0 && isStreaming ? (
        <span
          aria-hidden
          className="inline-block h-[1.05em] w-[2px] animate-pulse rounded-full bg-emerald-500"
        />
      ) : null}
    </div>
  );
}
