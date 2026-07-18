"use client";

import { useEffect } from "react";

import { useChatSocket } from "../socket/chat-socket-provider";
import { CHAT_SCHEMA_VERSION } from "../types/contracts";

export function useConversationRoom(conversationId: string | null) {
  const { socket, connectionState } = useChatSocket();

  useEffect(() => {
    if (!socket || !conversationId || connectionState !== "connected") return;
    socket.emit(
      "conversation:join",
      { schemaVersion: CHAT_SCHEMA_VERSION, conversationId },
      () => undefined,
    );
    return () => {
      socket.emit(
        "conversation:leave",
        { schemaVersion: CHAT_SCHEMA_VERSION, conversationId },
        () => undefined,
      );
    };
  }, [socket, connectionState, conversationId]);
}
