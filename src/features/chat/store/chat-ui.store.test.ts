import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { selectTypingExpiresAt, useChatUiStore } from "./chat-ui.store";

describe("chat UI store", () => {
  beforeEach(() => useChatUiStore.getState().reset());

  it("keeps drafts isolated per conversation", () => {
    useChatUiStore.getState().setDraft("conversation-a", "Xin chào");
    useChatUiStore.getState().setDraft("conversation-b", "Hello");
    expect(useChatUiStore.getState().drafts).toEqual({
      "conversation-a": "Xin chào",
      "conversation-b": "Hello",
    });
  });

  it("moves mobile UI to the thread when a conversation is selected", () => {
    useChatUiStore.getState().setActiveConversation("conversation-a");
    expect(useChatUiStore.getState()).toMatchObject({
      activeConversationId: "conversation-a",
      mobilePane: "thread",
    });
  });

  it("removes transient state on reset", () => {
    useChatUiStore.getState().setDraft("conversation-a", "draft");
    useChatUiStore
      .getState()
      .setTyping("conversation-a", "participant-a", new Date(Date.now() + 5_000).toISOString());
    useChatUiStore.getState().reset();
    expect(useChatUiStore.getState()).toMatchObject({ drafts: {}, typingExpiresAt: {} });
  });

  it("returns a stable empty typing snapshot for conversations without typing state", () => {
    const { result, rerender } = renderHook(() =>
      useChatUiStore((state) => selectTypingExpiresAt(state, "conversation-a")),
    );
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
