import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./message-attachment", () => ({ MessageAttachmentItem: () => null }));

import type { ChatMessage } from "../types/contracts";
import { MessageItem } from "./message-item";

const message: ChatMessage = {
  id: "message-id",
  conversationId: "conversation-id",
  senderParticipantId: "participant-id",
  clientMessageId: "client-id",
  type: "TEXT",
  content: "Xem https://upnext.works/jobs",
  attachments: [],
  createdAt: "2026-07-17T10:00:00.000Z",
  deliveryState: "sent",
};

describe("MessageItem", () => {
  it("renders links safely in a new isolated tab", () => {
    render(<MessageItem message={message} mine={false} />);
    const link = screen.getByRole("link", { name: "https://upnext.works/jobs" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("offers retry for a failed optimistic message", () => {
    const onRetry = vi.fn<(failedMessage: ChatMessage) => void>();
    render(
      <MessageItem message={{ ...message, deliveryState: "failed" }} mine onRetry={onRetry} />,
    );
    screen.getByRole("button", { name: "Gửi lại" }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
