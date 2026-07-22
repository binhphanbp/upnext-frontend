"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

import { useChatUiStore } from "../store/chat-ui.store";
import type { ConversationSummary, CurrentIdentity } from "../types/contracts";
import { compareConversationsByUnread, conversationHasUnread } from "../unread";

type Props = {
  conversations: ConversationSummary[];
  identity: CurrentIdentity | null;
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  availableTags: string[];
  selectedTag: string;
  tagsLoading: boolean;
  onTagChange: (tag: string) => void;
  onLoadMore: () => void;
};

export function ConversationList({
  conversations,
  identity,
  loading,
  error,
  hasMore,
  loadingMore,
  availableTags,
  selectedTag,
  tagsLoading,
  onTagChange,
  onLoadMore,
}: Props) {
  const activeId = useChatUiStore((state) => state.activeConversationId);
  const setActive = useChatUiStore((state) => state.setActiveConversation);
  const [search, setSearch] = useState("");
  const normalized = search.trim().toLocaleLowerCase("vi");
  const filtered = useMemo(
    () =>
      conversations
        .filter((conversation) =>
          `${conversationTitle(conversation, identity)} ${conversation.latestMessage?.content ?? ""}`
            .toLocaleLowerCase("vi")
            .includes(normalized),
        )
        .sort((left, right) => compareConversationsByUnread(left, right, identity)),
    [conversations, identity, normalized],
  );

  return (
    <section
      className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white"
      aria-label="Danh sách hội thoại"
    >
      <div className="border-b border-slate-200 p-3">
        <div className="relative block">
          <MagnifyingGlass className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            aria-label="Tìm hội thoại"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm hội thoại"
            className="pl-9"
          />
        </div>
        <Select
          value={selectedTag || "__all_tags__"}
          onValueChange={(value) => onTagChange(value === "__all_tags__" ? "" : value)}
          disabled={tagsLoading}
        >
          <SelectTrigger className="mt-2" aria-label="Lọc theo tag hội thoại">
            <SelectValue placeholder="Lọc theo tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all_tags__">Tất cả tag</SelectItem>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? <ListSkeleton /> : null}
        {error ? (
          <p className="p-6 text-center text-sm text-red-600">Không thể tải hội thoại.</p>
        ) : null}
        {!loading && !error && filtered.length === 0 ? (
          <div className="grid h-48 place-items-center p-6 text-center text-sm text-slate-500">
            Chưa có hội thoại phù hợp.
          </div>
        ) : null}
        {filtered.map((conversation) => {
          const unread = conversationHasUnread(conversation, identity);
          return (
            <button
              type="button"
              key={conversation.id}
              data-conversation-id={conversation.id}
              onClick={() => setActive(conversation.id)}
              className={cn(
                "flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50",
                activeId === conversation.id && "bg-emerald-50 hover:bg-emerald-50",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {initials(conversationTitle(conversation, identity))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm", unread ? "font-bold" : "font-semibold")}>
                    {conversationTitle(conversation, identity)}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatTime(conversation.latestMessageAt ?? conversation.updatedAt)}
                  </span>
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "line-clamp-1 flex-1 text-xs text-slate-500",
                      unread && "font-semibold text-slate-700",
                    )}
                  >
                    {conversation.latestMessage?.content ??
                      messageTypeLabel(conversation.latestMessage?.type)}
                  </span>
                  {unread ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100"
                      aria-label="Chưa đọc"
                    />
                  ) : null}
                </span>
                {conversation.tags.length ? (
                  <span className="mt-2 flex flex-wrap gap-1">
                    {conversation.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
        {hasMore ? (
          <div className="p-3 text-center">
            <Button type="button" variant="ghost" disabled={loadingMore} onClick={onLoadMore}>
              {loadingMore ? "Đang tải…" : "Xem thêm"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function conversationTitle(
  conversation: ConversationSummary,
  identity: CurrentIdentity | null,
) {
  const peer = conversation.participants.find(
    (participant) => !isOwnParticipant(participant, identity),
  );
  return (
    peer?.candidateAccount?.fullName ??
    peer?.recruiterAccount?.profile?.fullName ??
    peer?.recruiterAccount?.company?.name ??
    peer?.adminUser?.fullName ??
    (conversation.type === "SUPPORT" ? "Bộ phận hỗ trợ" : "Hội thoại")
  );
}

export function isOwnParticipant(
  participant: ConversationSummary["participants"][number],
  identity: CurrentIdentity | null,
) {
  if (!identity) return false;
  return (
    participant.candidateAccount?.id === identity.id ||
    participant.recruiterAccount?.id === identity.id ||
    participant.adminUser?.id === identity.id
  );
}

function initials(value: string) {
  return value
    .split(/\s+/u)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}

function messageTypeLabel(type?: string) {
  if (type === "ATTACHMENT" || type === "MIXED") return "Tệp đính kèm";
  if (type === "SYSTEM") return "Cập nhật hệ thống";
  return "Chưa có tin nhắn";
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-px">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex gap-3 p-4">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-slate-200" />
            <div className="h-3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
