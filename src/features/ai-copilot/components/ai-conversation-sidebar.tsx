"use client";

import { ChatCircleDots, NotePencil, Trash } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/skeleton";

import type { AiConversationSummary } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

type Bucket = "today" | "week" | "older";

function bucketOf(updatedAt: string): Bucket {
  const age = Date.now() - new Date(updatedAt).getTime();
  if (age < DAY_MS) return "today";
  if (age < 7 * DAY_MS) return "week";
  return "older";
}

export function AiConversationSidebar({
  conversations,
  isLoading,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  className,
}: {
  conversations: AiConversationSummary[];
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  const t = useTranslations("AiCopilot");

  const buckets: { key: Bucket; items: AiConversationSummary[] }[] = (
    ["today", "week", "older"] as const
  )
    .map((key) => ({
      key,
      items: conversations.filter((item) => bucketOf(item.updatedAt) === key),
    }))
    .filter((bucket) => bucket.items.length > 0);

  return (
    <aside
      className={cn("flex min-h-0 flex-col border-r border-slate-200 bg-slate-50/60", className)}
    >
      <div className="p-3">
        <button
          type="button"
          onClick={onCreate}
          className="upnext-focus flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] font-semibold text-slate-800 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-700"
        >
          <NotePencil className="size-4 text-slate-400" />
          {t("sidebar.newConversation")}
        </button>
      </div>

      <div className="ai-copilot-scroller min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="space-y-1.5 px-1">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] leading-relaxed text-slate-400">
            {t("sidebar.empty")}
          </p>
        ) : (
          buckets.map((bucket) => (
            <section key={bucket.key} className="mb-3">
              <h3 className="px-2 py-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                {t(`sidebar.bucket.${bucket.key}`)}
              </h3>
              <ul className="space-y-0.5">
                {bucket.items.map((conversation) => {
                  const isActive = conversation.id === activeId;
                  return (
                    <li key={conversation.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => onSelect(conversation.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "upnext-focus flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 pr-9 text-left transition-colors",
                          isActive
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-600 hover:bg-white/70",
                        )}
                      >
                        <ChatCircleDots
                          weight={isActive ? "fill" : "regular"}
                          className={cn(
                            "size-4 shrink-0",
                            isActive ? "text-emerald-600" : "text-slate-400",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">
                            {conversation.title || t("sidebar.untitled")}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {t("sidebar.messageCount", { count: conversation.messageCount })}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(conversation.id)}
                        aria-label={t("sidebar.delete", { title: conversation.title })}
                        className="upnext-focus absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100"
                      >
                        <Trash className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </aside>
  );
}
