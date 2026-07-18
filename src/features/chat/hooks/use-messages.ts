"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getMessages } from "../api/conversations";
import { useChatSocket } from "../socket/chat-socket-provider";
import { chatQueryKeys } from "./use-conversations";

export function useMessages(conversationId: string | null) {
  const { token } = useChatSocket();
  const query = useInfiniteQuery({
    queryKey: chatQueryKeys.messages(conversationId ?? "none"),
    enabled: Boolean(token && conversationId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getMessages(token!, conversationId!, {
        ...(pageParam ? { before: pageParam } : {}),
        limit: 30,
      }),
    getNextPageParam: (page) => page.meta.nextCursor ?? undefined,
    staleTime: 10_000,
  });

  const messages = useMemo(() => {
    const seen = new Set<string>();
    return [...(query.data?.pages ?? [])]
      .reverse()
      .flatMap((page) => page.data)
      .filter((message) => {
        const key = message.id || `${message.senderParticipantId}:${message.clientMessageId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }, [query.data]);

  return { ...query, messages };
}
