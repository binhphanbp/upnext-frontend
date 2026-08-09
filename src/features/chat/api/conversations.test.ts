import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/shared/api/http";

import { getConversations, getMessages } from "./conversations";

vi.mock("@/shared/api/http", () => ({
  apiRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

const conversation = {
  id: "conversation-1",
  updatedAt: "2026-08-09T00:00:00.000Z",
};

const message = {
  id: "message-1",
  createdAt: "2026-08-09T00:00:00.000Z",
};

describe("chat cursor response compatibility", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("normalizes a legacy plain conversation array into the cursor contract", async () => {
    vi.mocked(apiRequest).mockResolvedValue([conversation]);

    await expect(getConversations("token", {})).resolves.toEqual({
      data: [conversation],
      meta: { nextCursor: null },
    });
  });

  it("normalizes an envelope without cursor metadata instead of crashing pagination", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ data: [message] });

    await expect(getMessages("token", "conversation-1")).resolves.toEqual({
      data: [message],
      meta: { nextCursor: null },
    });
  });

  it("preserves a real cursor returned by the API", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      data: [conversation],
      meta: { nextCursor: "next-page" },
    });

    await expect(getConversations("token", {})).resolves.toEqual({
      data: [conversation],
      meta: { nextCursor: "next-page" },
    });
  });

  it("rejects malformed successful payloads instead of treating them as an empty inbox", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ items: [] });

    await expect(getConversations("token", {})).rejects.toThrow(
      "Phản hồi hội thoại không đúng định dạng.",
    );
  });

  it("does not swallow transport or HTTP errors", async () => {
    const failure = new Error("Service unavailable");
    vi.mocked(apiRequest).mockRejectedValue(failure);

    await expect(getMessages("token", "conversation-1")).rejects.toBe(failure);
  });
});
