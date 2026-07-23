import { io, type Socket } from "socket.io-client";

import { env } from "@/shared/lib/env";

import type { ChatAck, ChatMessage, CurrentIdentity } from "../types/contracts";

type ReadyPayload = {
  schemaVersion: 1;
  actor: Pick<CurrentIdentity, "id" | "role">;
  serverTime: string;
  connectionId: string;
};

export type MessageCreatedPayload = {
  schemaVersion: 1;
  conversationId: string;
  message: ChatMessage;
};

export type MessageReadPayload = {
  schemaVersion: 1;
  conversationId: string;
  participantId: string;
  lastReadMessageId: string;
  lastReadAt: string;
};

export type TypingPayload = {
  schemaVersion: 1;
  conversationId: string;
  participantId: string;
  isTyping: boolean;
  expiresAt: string;
};

type ServerToClientEvents = {
  "connection:ready": (payload: ReadyPayload) => void;
  "auth:revoked": (payload: { schemaVersion: 1; code: "AUTH_EXPIRED"; reason: string }) => void;
  "message:created": (payload: MessageCreatedPayload) => void;
  "message:read": (payload: MessageReadPayload) => void;
  "typing:updated": (payload: TypingPayload) => void;
  "conversation:updated": (payload: unknown) => void;
  "support:updated": (payload: unknown) => void;
  "talent_request:updated": (payload: unknown) => void;
};

type ClientToServerEvents = {
  "conversation:join": (
    payload: { schemaVersion: 1; conversationId: string },
    callback: (ack: ChatAck<{ conversationId: string }>) => void,
  ) => void;
  "conversation:leave": (
    payload: { schemaVersion: 1; conversationId: string },
    callback: (ack: ChatAck<{ conversationId: string }>) => void,
  ) => void;
  "message:send": (
    payload: {
      schemaVersion: 1;
      conversationId: string;
      clientMessageId: string;
      content?: string;
      attachmentIds?: string[];
      replyToMessageId?: string;
    },
    callback: (ack: ChatAck<ChatMessage>) => void,
  ) => void;
  "message:read": (
    payload: { schemaVersion: 1; conversationId: string; messageId: string },
    callback: (ack: ChatAck<unknown>) => void,
  ) => void;
  "typing:start": (payload: { schemaVersion: 1; conversationId: string }) => void;
  "typing:stop": (payload: { schemaVersion: 1; conversationId: string }) => void;
};

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function acquireChatSocket(token: string): ChatSocket {
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }
  if (!socket) {
    socket = io(`${env.NEXT_PUBLIC_SOCKET_URL.replace(/\/$/u, "")}/chat`, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8_000,
      randomizationFactor: 0.35,
    });
  } else {
    socket.auth = { token };
  }
  return socket;
}

export function releaseChatSocket(activeSocket: ChatSocket) {
  if (activeSocket !== socket) return;
  disconnectTimer = setTimeout(() => {
    activeSocket.disconnect();
    activeSocket.removeAllListeners();
    if (socket === activeSocket) socket = null;
    disconnectTimer = null;
  }, 250);
}

export function peekChatSocket() {
  return socket;
}
