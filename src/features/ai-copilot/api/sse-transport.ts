import { getCandidateSession } from "@/features/candidate/session";
import { createApiUrl } from "@/shared/api/http";

import type { AiStreamEvent } from "../types";
import type { SendMessageInput } from "./copilot-transport";

/**
 * Transport thật: đọc SSE từ `POST /api/v1/ai/conversations/:id/messages`.
 *
 * Dùng `fetch` + đọc `ReadableStream` chứ không dùng `EventSource`, vì
 * `EventSource` chỉ làm được GET và không gửi được header `Authorization` —
 * hai thứ cả hai đều cần ở đây.
 *
 * Hình dạng event đã trùng khớp với `mockTransport` (§13.3), nên không component
 * nào biết mình đang đọc dữ liệu thật hay kịch bản mẫu.
 */

/** Server chỉ định nghĩa những tên event này; tên khác là lỗi phía backend. */
const KNOWN_EVENTS = new Set([
  "status",
  "intent",
  "tool_start",
  "tool_result",
  "content_delta",
  "card",
  "citation",
  "action_request",
  "suggestions",
  "error",
  "done",
]);

export async function* sseTransport(input: SendMessageInput): AsyncGenerator<AiStreamEvent> {
  const session = getCandidateSession();
  if (!session) {
    yield {
      event: "error",
      data: {
        code: "AI_CONTEXT_FORBIDDEN",
        detail: "Bạn cần đăng nhập để dùng AI Copilot.",
        status: "permission_denied",
      },
    };
    return;
  }

  let response: Response;
  try {
    response = await fetch(createApiUrl(`/ai/conversations/${input.conversationId}/messages`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        prompt: input.prompt,
        contextType: toServerContextType(input.context.type),
        ...(input.context.id ? { contextId: input.context.id } : {}),
      }),
      signal: input.signal,
    });
  } catch {
    // Bao gồm cả trường hợp người dùng bấm "Dừng" — abort làm fetch reject.
    if (input.signal.aborted) return;
    yield networkError();
    return;
  }

  if (!response.ok || !response.body) {
    yield await httpError(response);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE phân tách bản tin bằng một dòng trống. Tách theo "\n\n" thay vì
      // theo từng dòng vì một bản tin gồm nhiều dòng (event: + data:), và một
      // chunk TCP có thể cắt ngang giữa chúng.
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseFrame(frame);
        if (parsed) yield parsed;
        boundary = buffer.indexOf("\n\n");
      }
    }
  } catch {
    if (input.signal.aborted) return;
    yield networkError();
  } finally {
    reader.releaseLock();
  }
}

/**
 * Một bản tin SSE → event có kiểu.
 *
 * Trả `null` cho heartbeat (dòng bắt đầu bằng ":") và cho bản tin không hiểu
 * được. Bỏ qua thay vì ném lỗi: một event lạ do backend mới hơn frontend không
 * nên làm đứt cả câu trả lời đang hiển thị.
 */
function parseFrame(frame: string): AiStreamEvent | null {
  let eventName = "";
  const dataLines: string[] = [];

  for (const line of frame.split("\n")) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }

  if (!eventName || !KNOWN_EVENTS.has(eventName) || dataLines.length === 0) return null;

  try {
    return { event: eventName, data: JSON.parse(dataLines.join("\n")) } as AiStreamEvent;
  } catch {
    return null;
  }
}

function networkError(): AiStreamEvent {
  return {
    event: "error",
    data: {
      code: "AI_SERVICE_UNAVAILABLE",
      detail: "Mất kết nối tới dịch vụ AI. Bạn thử lại sau ít phút nhé.",
      status: "model_unavailable",
    },
  };
}

/** Đổi mã HTTP thành thông báo người dùng đọc được, không phải "Error 429". */
async function httpError(response: Response): Promise<AiStreamEvent> {
  if (response.status === 401 || response.status === 403) {
    return {
      event: "error",
      data: {
        code: "AI_CONTEXT_FORBIDDEN",
        detail: "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại nhé.",
        status: "permission_denied",
      },
    };
  }
  if (response.status === 429) {
    return {
      event: "error",
      data: {
        code: "AI_MODEL_RATE_LIMIT",
        detail: "Bạn đã hỏi quá nhiều trong thời gian ngắn. Chờ một chút rồi thử lại nhé.",
        status: "rate_limited",
      },
    };
  }
  return networkError();
}

/**
 * Ngữ cảnh trang của frontend có nhiều giá trị hơn enum của backend
 * (`CANDIDATE`, `REPORT` dành cho recruiter/admin sau này). Gộp phần chưa hỗ trợ
 * về `GENERAL` thay vì gửi giá trị backend sẽ từ chối bằng lỗi 400.
 */
function toServerContextType(type: string): string {
  return type === "CV" || type === "JOB" || type === "APPLICATION" || type === "MOCK_INTERVIEW"
    ? type
    : "GENERAL";
}
