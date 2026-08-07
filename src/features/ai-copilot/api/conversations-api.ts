/**
 * Conversation persistence (§14.1).
 *
 * Hai hiện thực sau một API, chọn bằng `NEXT_PUBLIC_AI_COPILOT_SOURCE`:
 *
 * - `api` — gọi REST thật ở NestJS. Mặc định.
 * - `mock` — repository trong bộ nhớ, mất khi reload. Dùng cho demo không cần
 *   backend và cho việc phát triển UI.
 *
 * Một khác biệt nghiệp vụ giữa hai chế độ, cố ý: ở chế độ `api`,
 * `persistConversation` **không làm gì**. Backend đã lưu tin nhắn ngay trong lúc
 * stream (§13.1 bước 4 và 13), nên client gửi lại toàn bộ hội thoại sẽ là hai
 * nguồn sự thật đánh nhau. Hàm vẫn tồn tại để hook không phải biết mình đang ở
 * chế độ nào.
 */

import { getCandidateSession } from "@/features/candidate/session";
import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/lib/env";

import type {
  AiActionRequest,
  AiCard,
  AiCitation,
  AiContextType,
  AiConversation,
  AiConversationSummary,
  AiMessage,
  AiMessageFeedback,
  AiRunStatus,
  AiToolCall,
} from "../types";

const useApi = () => env.NEXT_PUBLIC_AI_COPILOT_SOURCE === "api";

function authHeaders(): HeadersInit {
  const session = getCandidateSession();
  if (!session) throw new Error("Bạn cần đăng nhập để dùng AI Copilot.");
  return { Authorization: `Bearer ${session.accessToken}` };
}

/* -------------------------------------------------------------------------- */
/* Server payloads                                                             */
/* -------------------------------------------------------------------------- */

type ServerConversationSummary = {
  id: string;
  title: string;
  contextType: string;
  updatedAt: string;
  messageCount: number;
};

type ServerMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  status: "PENDING" | "STREAMING" | "COMPLETED" | "PARTIAL" | "FAILED";
  intent: string | null;
  citationsJson: AiCitation[] | null;
  cardsJson: AiCard[] | null;
  toolCallsJson: AiToolCall[] | null;
  suggestionsJson: string[] | null;
  modelName: string | null;
  promptVersion: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  errorCode: string | null;
  createdAt: string;
  feedback: { rating: "UP" | "DOWN" } | null;
  actionRequest: {
    id: string;
    actionType: string;
    payloadJson: unknown;
    status: string;
  } | null;
};

/** Prisma dùng SCREAMING_CASE, UI dùng chữ thường — quy đổi ở một chỗ. */
const STATUS_MAP: Record<ServerMessage["status"], AiRunStatus> = {
  PENDING: "loading",
  STREAMING: "streaming",
  COMPLETED: "completed",
  PARTIAL: "partial",
  FAILED: "failed",
};

/**
 * Xây object theo từng bước thay vì spread có điều kiện.
 *
 * `exactOptionalPropertyTypes` của repo coi `{ intent?: T }` khác
 * `{ intent?: T | undefined }`, nên `...(cond ? { intent: x } : {})` không gán
 * được vào `AiMessage`. Gán tuần tự vừa hợp kiểu vừa đọc dễ hơn.
 */
function toMessage(server: ServerMessage): AiMessage {
  const message: AiMessage = {
    id: server.id,
    role: server.role === "USER" ? "user" : "assistant",
    content: server.content,
    createdAt: server.createdAt,
    status: STATUS_MAP[server.status],
    toolCalls: server.toolCallsJson ?? [],
    citations: server.citationsJson ?? [],
    cards: server.cardsJson ?? [],
    suggestions: server.suggestionsJson ?? [],
  };

  // `NonNullable` vì `AiMessage["intent"]` đã bao gồm `undefined` do là optional;
  // gán `T | undefined` vào một optional property bị `exactOptionalPropertyTypes`
  // từ chối. Cả hai giá trị đến từ backend nên chỉ cast, không tự suy diễn.
  if (server.intent) message.intent = server.intent as NonNullable<AiMessage["intent"]>;
  if (server.errorCode) {
    message.errorCode = server.errorCode as NonNullable<AiMessage["errorCode"]>;
  }
  if (server.feedback) message.feedback = server.feedback.rating === "UP" ? "up" : "down";

  if (server.actionRequest) {
    // Payload lưu cả phần thực thi và phần hiển thị; UI chỉ cần phần hiển thị.
    const payload = server.actionRequest.payloadJson as { display?: AiActionRequest } | null;
    if (payload?.display) {
      message.actionRequest = {
        ...payload.display,
        id: server.actionRequest.id,
        status: server.actionRequest.status as AiActionRequest["status"],
      };
    }
  }

  if (server.modelName && server.promptVersion) {
    message.meta = {
      model: server.modelName,
      promptVersion: server.promptVersion,
      latencyMs: server.latencyMs ?? 0,
      inputTokens: server.inputTokens ?? 0,
      outputTokens: server.outputTokens ?? 0,
    };
  }

  return message;
}

/* -------------------------------------------------------------------------- */
/* In-memory fallback                                                          */
/* -------------------------------------------------------------------------- */

let mockStore: AiConversation[] = [];

function wait<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 180));
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export async function listConversations(): Promise<AiConversationSummary[]> {
  if (!useApi()) {
    return wait(
      [...mockStore]
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(({ messages: _messages, ...summary }) => summary),
    );
  }

  const response = await apiRequest<{ data: ServerConversationSummary[] }>("/ai/conversations", {
    headers: authHeaders(),
  });

  return response.data.map((conversation) => ({
    id: conversation.id,
    // Hội thoại chưa có lượt nào thì tiêu đề rỗng — backend đặt tiêu đề sau lượt
    // đầu tiên. Điền nhãn ở client thay vì để sidebar hiện một dòng trống.
    title: conversation.title || "Hội thoại mới",
    contextType: conversation.contextType as AiContextType,
    updatedAt: conversation.updatedAt,
    messageCount: conversation.messageCount,
  }));
}

export async function getConversation(id: string): Promise<AiConversation | null> {
  if (!useApi()) {
    return wait(mockStore.find((conversation) => conversation.id === id) ?? null);
  }

  const response = await apiRequest<{
    data: ServerConversationSummary & { messages: ServerMessage[] };
  }>(`/ai/conversations/${id}`, { headers: authHeaders() });

  return {
    id: response.data.id,
    title: response.data.title || "Hội thoại mới",
    contextType: response.data.contextType as AiContextType,
    updatedAt: response.data.updatedAt ?? new Date().toISOString(),
    messageCount: response.data.messages.length,
    messages: response.data.messages.map(toMessage),
  };
}

export async function createConversation(contextType: AiContextType): Promise<AiConversation> {
  if (!useApi()) {
    const conversation: AiConversation = {
      id: `conv-${Date.now().toString(36)}`,
      title: "",
      contextType,
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      messages: [],
    };
    mockStore = [conversation, ...mockStore];
    return wait(conversation);
  }

  const response = await apiRequest<{ data: ServerConversationSummary }>("/ai/conversations", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ contextType: toServerContextType(contextType) }),
  });

  return {
    id: response.data.id,
    title: "",
    contextType,
    updatedAt: response.data.updatedAt,
    messageCount: 0,
    messages: [],
  };
}

/**
 * Không làm gì ở chế độ `api` — xem ghi chú đầu file. Ở chế độ mock thì đây là
 * nơi hội thoại thật sự được lưu.
 */
export function persistConversation(conversation: AiConversation): Promise<void> {
  if (useApi()) return Promise.resolve();

  const title = conversation.title || deriveTitle(conversation.messages);
  mockStore = [
    {
      ...conversation,
      title,
      messageCount: conversation.messages.length,
      updatedAt: new Date().toISOString(),
    },
    ...mockStore.filter((item) => item.id !== conversation.id),
  ];
  return wait(undefined);
}

export async function deleteConversation(id: string): Promise<void> {
  if (!useApi()) {
    mockStore = mockStore.filter((conversation) => conversation.id !== id);
    return wait(undefined);
  }

  await apiRequest<void>(`/ai/conversations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function submitMessageFeedback(
  messageId: string,
  feedback: AiMessageFeedback,
): Promise<{ messageId: string; feedback: AiMessageFeedback | null }> {
  if (!useApi()) return wait({ messageId, feedback });

  const response = await apiRequest<{ data: { rating: "UP" | "DOWN" | null } }>(
    `/ai/messages/${messageId}/feedback`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ rating: feedback === "up" ? "UP" : "DOWN" }),
    },
  );

  return {
    messageId,
    feedback: response.data.rating === null ? null : response.data.rating === "UP" ? "up" : "down",
  };
}

/**
 * Xác nhận hoặc từ chối một hành động do AI đề xuất.
 *
 * §4.1: **backend** thực hiện hành động ghi dữ liệu, AI service không bao giờ tự
 * ghi. Client chỉ chuyển quyết định của người dùng.
 */
export async function resolveActionRequest(
  actionId: string,
  decision: "CONFIRMED" | "REJECTED",
): Promise<{ id: string; status: AiActionRequest["status"] }> {
  if (!useApi()) {
    return wait({ id: actionId, status: decision === "CONFIRMED" ? "EXECUTED" : "REJECTED" });
  }

  const response = await apiRequest<{ data: { id: string; status: AiActionRequest["status"] } }>(
    `/ai/actions/${actionId}`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    },
  );
  return response.data;
}

function toServerContextType(type: AiContextType): string {
  return type === "CV" || type === "JOB" || type === "APPLICATION" || type === "MOCK_INTERVIEW"
    ? type
    : "GENERAL";
}

function deriveTitle(messages: AiMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage) return "Hội thoại mới";
  const text = firstUserMessage.content.trim();
  return text.length > 48 ? `${text.slice(0, 48).trimEnd()}…` : text;
}
