import { apiRequest } from "@/shared/api/http";

import type {
  ConversationDetailResponse,
  ConversationListResponse,
  CursorMeta,
  ConversationStatus,
  ConversationType,
  CurrentIdentity,
  MessageListResponse,
  MessageAttachment,
  SendMessageInput,
  ChatMessage,
  ConversationRecruiterOption,
  JobHiringTeamMember,
} from "../types/contracts";

type CursorPage<T> = Readonly<{
  data: T[];
  meta: CursorMeta;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Earlier clients and test adapters may still return a plain array. Accept that
 * known legacy shape at the API boundary, then give React Query one stable
 * cursor contract.
 *
 * We intentionally do not catch request failures here: non-2xx responses and
 * malformed payloads must still reach the query error state instead of making a
 * broken service look like an empty inbox.
 */
function normalizeCursorPage<T>(response: unknown, resource: string): CursorPage<T> {
  if (Array.isArray(response)) {
    return { data: response as T[], meta: { nextCursor: null } };
  }

  if (!isRecord(response) || !Array.isArray(response.data)) {
    throw new Error(`Phản hồi ${resource} không đúng định dạng.`);
  }

  if (response.meta === undefined || response.meta === null) {
    return { data: response.data as T[], meta: { nextCursor: null } };
  }

  if (!isRecord(response.meta)) {
    throw new Error(`Phản hồi ${resource} không đúng định dạng.`);
  }

  const nextCursor = response.meta.nextCursor;
  if (nextCursor !== undefined && nextCursor !== null && typeof nextCursor !== "string") {
    throw new Error(`Phản hồi ${resource} không đúng định dạng.`);
  }

  return {
    data: response.data as T[],
    meta: { nextCursor: typeof nextCursor === "string" ? nextCursor : null },
  };
}

function authHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export function getCurrentIdentity(token: string) {
  return apiRequest<{ data: CurrentIdentity }>("/auth/me", { headers: authHeaders(token) });
}

export function getConversations(
  token: string,
  options: {
    type?: ConversationType;
    status?: ConversationStatus;
    cursor?: string;
    tag?: string;
    limit?: number;
  },
): Promise<ConversationListResponse> {
  const params = new URLSearchParams();
  if (options.type) params.set("type", options.type);
  if (options.status) params.set("status", options.status);
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.tag) params.set("tag", options.tag);
  params.set("limit", String(options.limit ?? 20));
  return apiRequest<unknown>(`/conversations?${params.toString()}`, {
    headers: authHeaders(token),
  }).then((response) =>
    normalizeCursorPage<ConversationListResponse["data"][number]>(response, "hội thoại"),
  );
}

export function getConversationTags(token: string, type?: ConversationType) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const query = params.toString();
  return apiRequest<{ data: string[] }>(`/conversations/tags${query ? `?${query}` : ""}`, {
    headers: authHeaders(token),
  });
}

export function updateConversationTags(token: string, conversationId: string, tags: string[]) {
  return apiRequest<{ data: { conversationId: string; tags: string[] } }>(
    `/conversations/${conversationId}/tags`,
    {
      method: "PATCH",
      headers: authHeaders(token, true),
      body: JSON.stringify({ tags }),
    },
  );
}

export function getConversation(token: string, conversationId: string) {
  return apiRequest<ConversationDetailResponse>(`/conversations/${conversationId}`, {
    headers: authHeaders(token),
  });
}

export function getConversationRecruiters(token: string, conversationId: string) {
  return apiRequest<{ data: ConversationRecruiterOption[] }>(
    `/conversations/${conversationId}/recruiters`,
    { headers: authHeaders(token) },
  );
}

export function getHiringTeam(token: string, conversationId: string) {
  return apiRequest<{ data: JobHiringTeamMember[] }>(
    `/conversations/${conversationId}/hiring-team`,
    { headers: authHeaders(token) },
  );
}

export function addRecruiterToConversation(
  token: string,
  conversationId: string,
  recruiterAccountId: string,
) {
  return apiRequest(`/conversations/${conversationId}/recruiter-participants`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify({ recruiterAccountId }),
  });
}

export function addRecruiterToHiringTeam(
  token: string,
  conversationId: string,
  recruiterAccountId: string,
) {
  return apiRequest(`/conversations/${conversationId}/hiring-team/recruiters`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify({ recruiterAccountId }),
  });
}

export function getMessages(
  token: string,
  conversationId: string,
  options: { before?: string; limit?: number } = {},
): Promise<MessageListResponse> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 30) });
  if (options.before) params.set("before", options.before);
  return apiRequest<unknown>(`/conversations/${conversationId}/messages?${params.toString()}`, {
    headers: authHeaders(token),
  }).then((response) =>
    normalizeCursorPage<MessageListResponse["data"][number]>(response, "tin nhắn"),
  );
}

export function sendMessageRest(token: string, conversationId: string, input: SendMessageInput) {
  return apiRequest<ChatMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(input),
  });
}

export function markConversationRead(token: string, conversationId: string, messageId: string) {
  return apiRequest(`/conversations/${conversationId}/read`, {
    method: "PATCH",
    headers: authHeaders(token, true),
    body: JSON.stringify({ messageId }),
  });
}

export function uploadMessageAttachment(token: string, conversationId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<{ data: MessageAttachment }>(`/conversations/${conversationId}/attachments`, {
    method: "POST",
    headers: authHeaders(token),
    body,
  });
}

export function getAttachmentAccess(token: string, conversationId: string, attachmentId: string) {
  return apiRequest<{ data: { url: string; expiresAt: string } }>(
    `/conversations/${conversationId}/attachments/${attachmentId}/access`,
    { headers: authHeaders(token) },
  );
}
