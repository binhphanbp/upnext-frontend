"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getConversation, getConversations, getConversationTags } from "../api/conversations";
import { useChatSocket } from "../socket/chat-socket-provider";
import type { ConversationStatus, ConversationType } from "../types/contracts";

export const chatQueryKeys = {
  conversations: (type?: ConversationType, status?: ConversationStatus, tag?: string) =>
    ["chat", "conversations", type ?? "all", status ?? "open", tag ?? "all-tags"] as const,
  conversation: (id: string) => ["chat", "conversation", id] as const,
  tags: (type?: ConversationType, identityId?: string) =>
    ["chat", "conversation-tags", type ?? "all", identityId ?? "anonymous"] as const,
  messages: (id: string) => ["chat", "messages", id] as const,
};

export function useConversations(
  type?: ConversationType,
  status?: ConversationStatus,
  tag?: string,
) {
  const { token } = useChatSocket();
  const query = useInfiniteQuery({
    queryKey: chatQueryKeys.conversations(type, status, tag),
    enabled: Boolean(token),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getConversations(token!, {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(tag ? { tag } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
        limit: 20,
      }),
    getNextPageParam: (page) => page.meta.nextCursor ?? undefined,
    staleTime: 15_000,
  });

  const conversations = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages ?? [])
      .flatMap((page) => page.data)
      .filter((conversation) => {
        if (seen.has(conversation.id)) return false;
        seen.add(conversation.id);
        return true;
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [query.data]);

  return { ...query, conversations };
}

export function useConversationTags(type?: ConversationType) {
  const { token, identity } = useChatSocket();
  return useQuery({
    queryKey: chatQueryKeys.tags(type, identity?.id),
    enabled: Boolean(token && identity),
    queryFn: () => getConversationTags(token!, type),
    select: (response) => response.data,
  });
}

export function useConversation(conversationId: string | null) {
  const { token } = useChatSocket();
  return useQuery({
    queryKey: chatQueryKeys.conversation(conversationId ?? "none"),
    enabled: Boolean(token && conversationId),
    queryFn: () => getConversation(token!, conversationId!),
    select: (response) => response.data,
  });
}
