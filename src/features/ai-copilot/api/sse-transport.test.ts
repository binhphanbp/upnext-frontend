import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AiPageContext, AiStreamEvent } from "../types";

/**
 * Phần dễ hỏng nhất của transport là ranh giới chunk: TCP có thể cắt ngang giữa
 * `event:` và `data:`, hoặc giữa một chuỗi JSON. Các test dưới đây cắt stream ở
 * đúng những chỗ đó — loại lỗi này không xuất hiện trên localhost và xuất hiện
 * ngay khi có mạng thật.
 */

const context: AiPageContext = { type: "GENERAL", labelKey: "context.general" };

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

function okResponse(chunks: string[]): Response {
  return { ok: true, status: 200, body: streamOf(chunks) } as unknown as Response;
}

async function collect(chunks: string[]): Promise<AiStreamEvent[]> {
  vi.stubGlobal(
    "fetch",
    vi
      .fn<(input: unknown, init?: unknown) => Promise<Response>>()
      .mockResolvedValue(okResponse(chunks)),
  );
  const { sseTransport } = await import("./sse-transport");

  const events: AiStreamEvent[] = [];
  for await (const event of sseTransport({
    conversationId: "conv-1",
    prompt: "Phân tích CV của tôi",
    context,
    signal: new AbortController().signal,
  })) {
    events.push(event);
  }
  return events;
}

beforeEach(() => {
  vi.resetModules();
  localStorage.setItem("upnext.candidate.accessToken", "token-abc");
  localStorage.setItem(
    "upnext.candidate.user",
    JSON.stringify({ id: "acc-1", email: "a@b.co", role: "CANDIDATE" }),
  );
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("sseTransport", () => {
  it("đọc được nhiều event trong một chunk", async () => {
    const events = await collect([
      'event: status\ndata: {"step":"queued"}\n\n',
      'event: content_delta\ndata: {"text":"Xin "}\n\nevent: content_delta\ndata: {"text":"chào"}\n\n',
    ]);

    expect(events.map((event) => event.event)).toEqual([
      "status",
      "content_delta",
      "content_delta",
    ]);
  });

  it("ghép lại event bị cắt giữa hai chunk", async () => {
    const events = await collect(["event: content_de", 'lta\ndata: {"text":"ok"}\n\n']);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "content_delta", data: { text: "ok" } });
  });

  it("ghép lại JSON bị cắt giữa hai chunk", async () => {
    const events = await collect([
      'event: content_delta\ndata: {"text":"NestJS ',
      'và Redis"}\n\n',
    ]);
    expect(events[0]).toEqual({ event: "content_delta", data: { text: "NestJS và Redis" } });
  });

  it("bỏ qua heartbeat mà không sinh event", async () => {
    const events = await collect([
      ": ping\n\n",
      'event: status\ndata: {"step":"streaming"}\n\n',
      ": ping\n\n",
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("status");
  });

  it("bỏ qua event lạ thay vì làm đứt cả stream", async () => {
    const events = await collect([
      'event: something_new\ndata: {"x":1}\n\n',
      'event: content_delta\ndata: {"text":"vẫn chạy"}\n\n',
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "content_delta", data: { text: "vẫn chạy" } });
  });

  it("bỏ qua data không parse được JSON", async () => {
    const events = await collect([
      "event: content_delta\ndata: {khong-phai-json}\n\n",
      'event: done\ndata: {"messageId":"m1","meta":{"model":"m","promptVersion":"v","latencyMs":1,"inputTokens":1,"outputTokens":1}}\n\n',
    ]);
    expect(events.map((event) => event.event)).toEqual(["done"]);
  });

  it("trả event error khi chưa đăng nhập, không throw", async () => {
    localStorage.clear();
    const events = await collect([]);
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("error");
    if (events[0]?.event === "error") {
      expect(events[0].data.status).toBe("permission_denied");
    }
  });

  it("đổi 429 thành thông báo hết hạn mức", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, body: null } as unknown as Response),
    );
    const { sseTransport } = await import("./sse-transport");

    const events: AiStreamEvent[] = [];
    for await (const event of sseTransport({
      conversationId: "conv-1",
      prompt: "x",
      context,
      signal: new AbortController().signal,
    })) {
      events.push(event);
    }

    expect(events[0]?.event).toBe("error");
    if (events[0]?.event === "error") {
      expect(events[0].data.code).toBe("AI_MODEL_RATE_LIMIT");
      expect(events[0].data.status).toBe("rate_limited");
    }
  });

  it("không phát event nào khi người dùng bấm Dừng", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("aborted")));
    const { sseTransport } = await import("./sse-transport");

    const events: AiStreamEvent[] = [];
    for await (const event of sseTransport({
      conversationId: "conv-1",
      prompt: "x",
      context,
      signal: controller.signal,
    })) {
      events.push(event);
    }

    // Huỷ là hành động của người dùng, không phải lỗi — không hiện thông báo đỏ.
    expect(events).toEqual([]);
  });
});
