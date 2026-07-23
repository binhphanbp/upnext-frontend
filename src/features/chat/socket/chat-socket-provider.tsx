"use client";

import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentIdentity } from "../api/conversations";
import { clearChatSession, getChatAccessToken, refreshChatAccessToken } from "../auth/chat-session";
import { useChatUiStore } from "../store/chat-ui.store";
import type {
  ActorRole,
  ConnectionState,
  ConversationListResponse,
  CurrentIdentity,
  MessageListResponse,
} from "../types/contracts";
import {
  acquireChatSocket,
  releaseChatSocket,
  type ChatSocket,
  type MessageCreatedPayload,
} from "./chat-socket";

type ChatSocketContextValue = {
  actor: ActorRole;
  token: string | null;
  identity: CurrentIdentity | null;
  socket: ChatSocket | null;
  connectionState: ConnectionState;
};

const ChatSocketContext = createContext<ChatSocketContextValue | null>(null);

export function ChatSocketProvider({ actor, children }: { actor: ActorRole; children: ReactNode }) {
  const queryClient = useQueryClient();
  const setTyping = useChatUiStore((state) => state.setTyping);
  const resetUi = useChatUiStore((state) => state.reset);
  const [token, setToken] = useState<string | null>(null);
  const [identity, setIdentity] = useState<CurrentIdentity | null>(null);
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");

  useEffect(() => {
    let cancelled = false;
    let activeSocket: ChatSocket | null = null;

    const connect = async () => {
      const accessToken = getChatAccessToken(actor);
      setToken(accessToken);
      if (!accessToken) {
        setConnectionState("idle");
        return;
      }
      setConnectionState("connecting");
      try {
        const response = await getCurrentIdentity(accessToken);
        if (cancelled || response.data.role !== actor) return;
        setIdentity(response.data);
        activeSocket = acquireChatSocket(accessToken);
        setSocket(activeSocket);

        const onConnect = () => setConnectionState("connected");
        const onDisconnect = () => setConnectionState("reconnecting");
        const onConnectError = () => setConnectionState("reconnecting");
        const onAuthRevoked = () => {
          setConnectionState("reconnecting");
          void refreshChatAccessToken(actor).then(async (refreshedToken) => {
            if (!refreshedToken || !activeSocket) {
              setConnectionState("expired");
              clearChatSession(actor);
              resetUi();
              setToken(null);
              setIdentity(null);
              return;
            }
            const response = await getCurrentIdentity(refreshedToken);
            setToken(refreshedToken);
            setIdentity(response.data);
            activeSocket.auth = { token: refreshedToken };
            activeSocket.connect();
          });
        };
        const onMessageCreated = (event: MessageCreatedPayload) => {
          queryClient.setQueryData<InfiniteData<MessageListResponse>>(
            ["chat", "messages", event.conversationId],
            (current) => {
              if (!current) return current;
              if (
                current.pages.some((page) => page.data.some((item) => item.id === event.message.id))
              ) {
                return current;
              }
              const pages = [...current.pages];
              const latest = pages[0];
              if (!latest) return current;
              pages[0] = { ...latest, data: [...latest.data, event.message] };
              return { ...current, pages };
            },
          );
          queryClient.setQueriesData<InfiniteData<ConversationListResponse>>(
            { queryKey: ["chat", "conversations"] },
            (current) => {
              if (!current) return current;
              return {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  data: page.data.map((conversation) =>
                    conversation.id === event.conversationId
                      ? {
                          ...conversation,
                          latestMessageId: event.message.id,
                          latestMessageAt: event.message.createdAt,
                          latestMessage: event.message,
                          updatedAt: event.message.createdAt,
                        }
                      : conversation,
                  ),
                })),
              };
            },
          );
        };
        const onMessageRead = (payload: {
          conversationId: string;
          participantId: string;
          lastReadAt: string;
        }) => {
          queryClient.setQueriesData<InfiniteData<ConversationListResponse>>(
            { queryKey: ["chat", "conversations"] },
            (current) => {
              if (!current) return current;
              return {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  data: page.data.map((conversation) =>
                    conversation.id === payload.conversationId
                      ? {
                          ...conversation,
                          participants: conversation.participants.map((participant) =>
                            participant.id === payload.participantId
                              ? { ...participant, lastReadAt: payload.lastReadAt }
                              : participant,
                          ),
                        }
                      : conversation,
                  ),
                })),
              };
            },
          );
          void queryClient.invalidateQueries({
            queryKey: ["chat", "conversation", payload.conversationId],
          });
        };
        const onTyping = (payload: {
          conversationId: string;
          participantId: string;
          isTyping: boolean;
          expiresAt: string;
        }) => {
          setTyping(
            payload.conversationId,
            payload.participantId,
            payload.isTyping ? payload.expiresAt : null,
          );
        };
        const refreshSupport = () => {
          void queryClient.invalidateQueries({ queryKey: ["chat", "support-cases"] });
          void queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
        };
        const refreshTalent = () => {
          void queryClient.invalidateQueries({ queryKey: ["chat", "talent-contact-requests"] });
          void queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
          void queryClient.invalidateQueries({ queryKey: ["chat", "conversation"] });
          void queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
        };

        activeSocket.on("connect", onConnect);
        activeSocket.on("disconnect", onDisconnect);
        activeSocket.on("connect_error", onConnectError);
        activeSocket.on("auth:revoked", onAuthRevoked);
        activeSocket.on("message:created", onMessageCreated);
        activeSocket.on("message:read", onMessageRead);
        activeSocket.on("typing:updated", onTyping);
        activeSocket.on("support:updated", refreshSupport);
        activeSocket.on("talent_request:updated", refreshTalent);
        activeSocket.connect();

        return () => {
          activeSocket?.off("connect", onConnect);
          activeSocket?.off("disconnect", onDisconnect);
          activeSocket?.off("connect_error", onConnectError);
          activeSocket?.off("auth:revoked", onAuthRevoked);
          activeSocket?.off("message:created", onMessageCreated);
          activeSocket?.off("message:read", onMessageRead);
          activeSocket?.off("typing:updated", onTyping);
          activeSocket?.off("support:updated", refreshSupport);
          activeSocket?.off("talent_request:updated", refreshTalent);
        };
      } catch {
        if (!cancelled) setConnectionState("expired");
      }
    };

    let cleanupListeners: (() => void) | undefined;
    void connect().then((cleanup) => {
      cleanupListeners = cleanup;
      if (cancelled) cleanup?.();
    });

    return () => {
      cancelled = true;
      cleanupListeners?.();
      if (activeSocket) releaseChatSocket(activeSocket);
    };
  }, [actor, queryClient, resetUi, setTyping]);

  const value = useMemo(
    () => ({ actor, token, identity, socket, connectionState }),
    [actor, token, identity, socket, connectionState],
  );
  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket() {
  const context = useContext(ChatSocketContext);
  if (!context) throw new Error("useChatSocket must be used inside ChatSocketProvider");
  return context;
}
