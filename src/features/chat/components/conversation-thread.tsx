"use client";

import { ArrowLeft, Info, SpinnerGap } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import { markConversationRead } from "../api/conversations";
import { useConversationRoom } from "../hooks/use-conversation-room";
import { useConversation } from "../hooks/use-conversations";
import { useMessages } from "../hooks/use-messages";
import { useSendMessage } from "../hooks/use-send-message";
import { useChatSocket } from "../socket/chat-socket-provider";
import { selectTypingExpiresAt, useChatUiStore } from "../store/chat-ui.store";
import { CHAT_SCHEMA_VERSION, type ChatMessage } from "../types/contracts";
import { conversationTitle, isOwnParticipant } from "./conversation-list";
import { MessageComposer } from "./message-composer";
import { MessageItem } from "./message-item";
import { TalentRequestActions } from "./talent-request-actions";

export function ConversationThread({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const { socket, token, identity } = useChatSocket();
  const detail = useConversation(conversationId);
  const history = useMessages(conversationId);
  const setActive = useChatUiStore((state) => state.setActiveConversation);
  const setPane = useChatUiStore((state) => state.setMobilePane);
  const typing = useChatUiStore((state) => selectTypingExpiresAt(state, conversationId));
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMarkedRead = useRef<string | null>(null);
  const [clock, setClock] = useState(Date.now());
  useConversationRoom(conversationId);

  const ownParticipant = detail.data?.participants.find((participant) =>
    isOwnParticipant(participant, identity),
  );
  const retry = useSendMessage(conversationId, ownParticipant?.id ?? null);
  const activeTypers = useMemo(
    () =>
      Object.entries(typing).filter(
        ([id, expiresAt]) => id !== ownParticipant?.id && expiresAt > clock,
      ),
    [typing, ownParticipant?.id, clock],
  );

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [history.messages.length, conversationId]);

  useEffect(() => {
    const latest = history.messages.at(-1);
    if (
      !latest ||
      latest.senderParticipantId === ownParticipant?.id ||
      lastMarkedRead.current === latest.id
    )
      return;
    lastMarkedRead.current = latest.id;
    if (socket?.connected) {
      socket.emit(
        "message:read",
        { schemaVersion: CHAT_SCHEMA_VERSION, conversationId, messageId: latest.id },
        () => undefined,
      );
    } else if (token) {
      void markConversationRead(token, conversationId, latest.id)
        .then(async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }),
            queryClient.invalidateQueries({
              queryKey: ["chat", "conversation", conversationId],
            }),
          ]);
        })
        .catch(() => {
          lastMarkedRead.current = null;
        });
    }
  }, [history.messages, ownParticipant?.id, socket, token, conversationId, queryClient]);

  if (detail.isLoading || history.isLoading) {
    return (
      <div className="grid min-h-0 place-items-center bg-slate-50">
        <SpinnerGap className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }
  if (!detail.data || detail.isError || history.isError) {
    return (
      <div className="grid min-h-0 place-items-center bg-slate-50 p-6 text-center text-sm text-red-600">
        Không thể tải nội dung hội thoại.
      </div>
    );
  }

  const conversation = detail.data;
  const disabledReason =
    conversation.status === "PENDING"
      ? "Cần chấp nhận lời mời kết nối trước khi nhắn tin."
      : conversation.status !== "ACTIVE"
        ? "Hội thoại hiện ở chế độ chỉ đọc."
        : conversation.writableUntil && new Date(conversation.writableUntil) <= new Date()
          ? "Thời hạn trao đổi đã kết thúc."
          : undefined;

  return (
    <section className="flex min-h-0 flex-col bg-slate-50" aria-label="Nội dung hội thoại">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0 lg:hidden"
          onClick={() => setActive(null)}
          aria-label="Quay lại danh sách"
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-slate-900">
            {conversationTitle(conversation, identity)}
          </h2>
          <p className="truncate text-xs text-slate-500">
            {conversation.status === "ACTIVE" ? threadTitle(conversation) : disabledReason}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0 xl:hidden"
          onClick={() => setPane("context")}
          aria-label="Xem thông tin"
        >
          <Info />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto py-3" aria-live="polite">
        {history.hasNextPage ? (
          <div className="mb-3 text-center">
            <Button
              type="button"
              variant="ghost"
              disabled={history.isFetchingNextPage}
              onClick={() => void history.fetchNextPage()}
            >
              {history.isFetchingNextPage ? "Đang tải…" : "Tin nhắn cũ hơn"}
            </Button>
          </div>
        ) : null}
        {history.messages.length === 0 ? (
          <p className="grid h-48 place-items-center text-sm text-slate-500">
            Hãy bắt đầu cuộc trò chuyện.
          </p>
        ) : null}
        {history.messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            mine={message.senderParticipantId === ownParticipant?.id}
            onRetry={(failed) => retryFailed(failed, retry.send)}
          />
        ))}
        {activeTypers.length ? (
          <p className="px-5 py-2 text-xs text-slate-500 italic">Đối phương đang nhập…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>
      <TalentRequestActions conversation={conversation} />
      <MessageComposer
        conversationId={conversationId}
        senderParticipantId={ownParticipant?.id ?? null}
        {...(disabledReason ? { disabledReason } : {})}
        allowAttachments={conversation.type !== "TALENT_OUTREACH"}
      />
    </section>
  );
}

function retryFailed(
  message: ChatMessage,
  send: (content: string, id?: string, attachmentIds?: string[]) => Promise<unknown>,
) {
  void send(
    message.content ?? "",
    message.clientMessageId ?? crypto.randomUUID(),
    message.attachments.map((item) => item.id),
  );
}

function threadTitle(conversation: NonNullable<ReturnType<typeof useConversation>["data"]>) {
  return (
    conversation.application?.jobPost.title ??
    conversation.talentContactRequest?.jobPost.title ??
    conversation.supportCase?.title ??
    "Tin nhắn"
  );
}
