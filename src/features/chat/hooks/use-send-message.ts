"use client";

import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";

import { sendMessageRest } from "../api/conversations";
import { useChatSocket } from "../socket/chat-socket-provider";
import {
  CHAT_SCHEMA_VERSION,
  type ChatAck,
  type ChatMessage,
  type MessageListResponse,
} from "../types/contracts";
import { chatQueryKeys } from "./use-conversations";

type SendVariables = {
  content: string;
  clientMessageId: string;
  attachmentIds?: string[];
  replyToMessageId?: string;
};

export function useSendMessage(conversationId: string, senderParticipantId: string | null) {
  const queryClient = useQueryClient();
  const { socket, token, connectionState } = useChatSocket();

  const mutation = useMutation({
    mutationFn: async (variables: SendVariables) => {
      const input = {
        clientMessageId: variables.clientMessageId,
        content: variables.content,
        ...(variables.attachmentIds?.length ? { attachmentIds: variables.attachmentIds } : {}),
        ...(variables.replyToMessageId ? { replyToMessageId: variables.replyToMessageId } : {}),
      };
      if (!socket || connectionState !== "connected") {
        if (!token) throw new Error("Phiên đăng nhập đã hết hạn");
        return sendMessageRest(token, conversationId, input);
      }
      return new Promise<ChatMessage>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Không nhận được phản hồi từ máy chủ")),
          8_000,
        );
        socket.emit(
          "message:send",
          { schemaVersion: CHAT_SCHEMA_VERSION, conversationId, ...input },
          (ack: ChatAck<ChatMessage>) => {
            clearTimeout(timer);
            if (ack.ok) resolve(ack.data);
            else reject(new Error(ack.error.message));
          },
        );
      });
    },
    onMutate: async (variables) => {
      const key = chatQueryKeys.messages(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const optimistic: ChatMessage = {
        id: `optimistic:${variables.clientMessageId}`,
        conversationId,
        senderParticipantId,
        clientMessageId: variables.clientMessageId,
        type: variables.attachmentIds?.length ? "MIXED" : "TEXT",
        content: variables.content,
        attachments: [],
        createdAt: new Date().toISOString(),
        deliveryState: "pending",
      };
      patchMessagePages(queryClient, conversationId, (messages) => [...messages, optimistic]);
      return { optimisticId: optimistic.id };
    },
    onSuccess: (message, variables) => {
      patchMessagePages(queryClient, conversationId, (messages) => {
        const withoutDuplicates = messages.filter(
          (item) => item.id !== `optimistic:${variables.clientMessageId}` && item.id !== message.id,
        );
        return [...withoutDuplicates, { ...message, deliveryState: "sent" }];
      });
    },
    onError: (error, variables) => {
      patchMessagePages(queryClient, conversationId, (messages) =>
        messages.map((message) =>
          message.id === `optimistic:${variables.clientMessageId}`
            ? {
                ...message,
                deliveryState: "failed" as const,
                deliveryError: error instanceof Error ? error.message : "Gửi thất bại",
              }
            : message,
        ),
      );
    },
  });

  return {
    ...mutation,
    send: (content: string, clientMessageId = crypto.randomUUID(), attachmentIds?: string[]) =>
      mutation.mutateAsync({
        content,
        clientMessageId,
        ...(attachmentIds ? { attachmentIds } : {}),
      }),
  };
}

function patchMessagePages(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  update: (messages: ChatMessage[]) => ChatMessage[],
) {
  queryClient.setQueryData<InfiniteData<MessageListResponse>>(
    chatQueryKeys.messages(conversationId),
    (current) => {
      const latest = current?.pages[0];
      if (!current || !latest) return current;
      const pages = [...current.pages];
      pages[0] = { ...latest, data: update([...latest.data]) };
      return { ...current, pages };
    },
  );
}
