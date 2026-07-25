import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/conversations", () => ({
  updateConversationTags: vi.fn<() => void>(),
  getConversationRecruiters: vi.fn<() => void>(),
  getHiringTeam: vi.fn<() => void>(),
  addRecruiterToConversation: vi.fn<() => void>(),
  addRecruiterToHiringTeam: vi.fn<() => void>(),
}));

vi.mock("../socket/chat-socket-provider", () => ({
  useChatSocket: () => ({ token: "recruiter-token" }),
}));

import { updateConversationTags } from "../api/conversations";
import type { ConversationDetail } from "../types/contracts";
import { ConversationContextPanel } from "./conversation-context-panel";

function renderPanel(tags: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(<ConversationContextPanel conversation={conversation(tags)} />, {
    wrapper: Wrapper,
  });
}

describe("ConversationContextPanel tags", () => {
  beforeEach(() => {
    vi.mocked(updateConversationTags).mockReset();
    vi.mocked(updateConversationTags).mockResolvedValue({
      data: { conversationId: "conversation-id", tags: [] },
    });
  });

  it("normalizes and adds a personal conversation tag", async () => {
    const user = userEvent.setup();
    renderPanel(["vip"]);

    await user.type(screen.getByRole("textbox", { name: /tag/i }), "  Cần   phản hồi  ");
    await user.click(screen.getByRole("button", { name: /thêm tag/i }));

    await waitFor(() =>
      expect(updateConversationTags).toHaveBeenCalledWith("recruiter-token", "conversation-id", [
        "vip",
        "cần phản hồi",
      ]),
    );
  });

  it("removes a personal conversation tag", async () => {
    const user = userEvent.setup();
    renderPanel(["vip", "cần phản hồi"]);

    await user.click(screen.getByRole("button", { name: /gỡ tag vip/i }));

    await waitFor(() =>
      expect(updateConversationTags).toHaveBeenCalledWith("recruiter-token", "conversation-id", [
        "cần phản hồi",
      ]),
    );
  });
});

function conversation(tags: string[]): ConversationDetail {
  return {
    id: "conversation-id",
    type: "APPLICATION_CHAT",
    status: "ACTIVE",
    companyId: "company-id",
    applicationId: "application-id",
    jobPostId: "job-post-id",
    latestMessageId: null,
    latestMessageAt: null,
    writableUntil: null,
    readOnlyAt: null,
    closeReason: null,
    tags,
    version: 1,
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
    latestMessage: null,
    participants: [],
  };
}
