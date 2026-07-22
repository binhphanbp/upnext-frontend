"use client";

import { ChatCircleDots, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/shared/ui/button";

import { useConversation, useConversations, useConversationTags } from "../hooks/use-conversations";
import { useChatSocket } from "../socket/chat-socket-provider";
import { useChatUiStore } from "../store/chat-ui.store";
import type { ActorRole, ConversationType } from "../types/contracts";
import { ConversationContextPanel } from "./conversation-context-panel";
import { ConversationList } from "./conversation-list";
import { ConversationThread } from "./conversation-thread";
import { SupportCaseForm } from "./support-case-form";

type ChatTab = { type: ConversationType; label: string };

const tabsByActor: Record<ActorRole, ChatTab[]> = {
  CANDIDATE: [
    { type: "APPLICATION_CHAT", label: "Ứng tuyển" },
    { type: "TALENT_OUTREACH", label: "Lời mời kết nối" },
  ],
  RECRUITER: [
    { type: "APPLICATION_CHAT", label: "Ứng viên" },
    { type: "TALENT_OUTREACH", label: "Ứng viên đề xuất" },
    { type: "SUPPORT", label: "Hỗ trợ" },
  ],
  ADMIN: [{ type: "SUPPORT", label: "Hỗ trợ" }],
};

export function ChatWorkspace({
  actor,
  initialType,
  standalone = false,
}: {
  actor: ActorRole;
  initialType?: ConversationType;
  standalone?: boolean;
}) {
  const tabs = tabsByActor[actor];
  const [type, setType] = useState<ConversationType>(initialType ?? tabs[0]!.type);
  const [tag, setTag] = useState("");
  const activeId = useChatUiStore((state) => state.activeConversationId);
  const mobilePane = useChatUiStore((state) => state.mobilePane);
  const setActive = useChatUiStore((state) => state.setActiveConversation);
  const setMobilePane = useChatUiStore((state) => state.setMobilePane);
  const { identity, connectionState } = useChatSocket();
  const tags = useConversationTags(type);
  const list = useConversations(type, undefined, tag || undefined);
  const detail = useConversation(activeId);

  useEffect(() => {
    setActive(null);
    setTag("");
  }, [type, setActive]);
  const connectionCopy = useMemo(() => {
    if (connectionState === "expired") return "Phiên đăng nhập đã hết hạn.";
    if (connectionState === "connecting" || connectionState === "reconnecting")
      return "Đang kết nối lại realtime…";
    return null;
  }, [connectionState]);

  return (
    <div
      className={
        standalone
          ? "flex h-full min-h-0 flex-col overflow-hidden bg-white"
          : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      }
    >
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <ChatCircleDots className="text-primary shrink-0" size={24} weight="fill" />
          <h1 className="font-bold text-slate-900">Tin nhắn</h1>
        </div>
        <div
          className="flex min-w-0 gap-1 overflow-x-auto py-2"
          role="tablist"
          aria-label="Loại hội thoại"
        >
          {tabs.map((tab) => (
            <button
              key={tab.type}
              type="button"
              role="tab"
              aria-selected={type === tab.type}
              onClick={() => setType(tab.type)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${type === tab.type ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {connectionCopy ? (
        <output
          className={`block w-full px-4 py-2 text-center text-xs ${connectionState === "expired" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
        >
          {connectionCopy}
        </output>
      ) : null}
      {actor === "RECRUITER" && type === "SUPPORT" ? (
        <SupportCaseForm onCreated={setActive} />
      ) : null}
      <div
        className={`grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_320px] ${
          standalone ? "min-h-0 flex-1" : "h-[calc(100dvh-220px)] min-h-[520px]"
        }`}
      >
        <div
          className={`${activeId && mobilePane !== "list" ? "hidden lg:block" : "block"} min-h-0`}
        >
          <ConversationList
            conversations={list.conversations}
            identity={identity}
            loading={list.isLoading}
            error={list.isError}
            hasMore={Boolean(list.hasNextPage)}
            loadingMore={list.isFetchingNextPage}
            availableTags={tags.data ?? []}
            selectedTag={tag}
            tagsLoading={tags.isLoading}
            onTagChange={setTag}
            onLoadMore={() => void list.fetchNextPage()}
          />
        </div>
        <div
          className={`${!activeId || mobilePane === "list" ? "hidden lg:grid" : "grid"} min-h-0`}
        >
          {activeId ? <ConversationThread conversationId={activeId} /> : <EmptyThread />}
        </div>
        <div className="hidden min-h-0 border-l border-slate-200 xl:block">
          {detail.data ? (
            <ConversationContextPanel conversation={detail.data} />
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-slate-400">
              Chọn hội thoại để xem thông tin.
            </div>
          )}
        </div>
      </div>
      {activeId && mobilePane === "context" && detail.data ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/30"
            onClick={() => setMobilePane("thread")}
            aria-label="Đóng bảng thông tin"
          />
          <aside className="relative ml-auto h-full w-[min(90vw,380px)] bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <strong>Thông tin</strong>
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => setMobilePane("thread")}
              >
                <X />
              </Button>
            </div>
            <ConversationContextPanel conversation={detail.data} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="grid h-full place-items-center bg-slate-50 p-8 text-center">
      <div>
        <ChatCircleDots className="mx-auto mb-3 text-slate-300" size={56} />
        <p className="font-semibold text-slate-600">Chọn một hội thoại</p>
        <p className="mt-1 text-sm text-slate-400">Tin nhắn của bạn sẽ xuất hiện tại đây.</p>
      </div>
    </div>
  );
}
