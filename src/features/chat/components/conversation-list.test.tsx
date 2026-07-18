import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatUiStore } from "../store/chat-ui.store";
import type { ConversationSummary, CurrentIdentity } from "../types/contracts";
import { ConversationList } from "./conversation-list";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => undefined;
HTMLElement.prototype.releasePointerCapture = () => undefined;
HTMLElement.prototype.scrollIntoView = () => undefined;

describe("ConversationList", () => {
  beforeEach(() => {
    useChatUiStore.getState().reset();
  });

  it("shows conversation tags and filters by a selected personal tag", async () => {
    const user = userEvent.setup();
    const onTagChange = vi.fn<(tag: string) => void>();
    render(
      <ConversationList
        conversations={[conversation]}
        identity={identity}
        loading={false}
        error={false}
        hasMore={false}
        loadingMore={false}
        availableTags={["vip", "cần phản hồi"]}
        selectedTag=""
        tagsLoading={false}
        onTagChange={onTagChange}
        onLoadMore={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByText("vip")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "cần phản hồi" }));

    expect(onTagChange).toHaveBeenCalledWith("cần phản hồi");
  });

  it("moves unread conversations to the top and shows a green dot", () => {
    const unreadConversation = candidateConversation({
      id: "unread-conversation",
      recruiterName: "Recruiter chưa đọc",
      messageCreatedAt: "2026-07-18T09:00:00.000Z",
      lastReadAt: "2026-07-18T08:00:00.000Z",
    });
    const newerReadConversation = candidateConversation({
      id: "read-conversation",
      recruiterName: "Recruiter đã đọc",
      messageCreatedAt: "2026-07-18T10:00:00.000Z",
      lastReadAt: "2026-07-18T10:01:00.000Z",
    });

    render(
      <ConversationList
        conversations={[newerReadConversation, unreadConversation]}
        identity={candidateIdentity}
        loading={false}
        error={false}
        hasMore={false}
        loadingMore={false}
        availableTags={[]}
        selectedTag=""
        tagsLoading={false}
        onTagChange={vi.fn<(tag: string) => void>()}
        onLoadMore={vi.fn<() => void>()}
      />,
    );

    const list = screen.getByRole("region", { name: "Danh sách hội thoại" });
    const renderedIds = Array.from(list.querySelectorAll("[data-conversation-id]")).map((item) =>
      item.getAttribute("data-conversation-id"),
    );
    expect(renderedIds).toEqual(["unread-conversation", "read-conversation"]);

    const unreadItem = list.querySelector('[data-conversation-id="unread-conversation"]');
    expect(unreadItem).not.toBeNull();
    expect(within(unreadItem as HTMLElement).getByLabelText("Chưa đọc")).toHaveClass(
      "bg-emerald-500",
    );
  });
});

const identity: CurrentIdentity = {
  id: "recruiter-id",
  email: "recruiter@upnext.dev",
  role: "RECRUITER",
  companyId: "company-id",
  permissions: [],
};

const conversation: ConversationSummary = {
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
  tags: ["vip"],
  version: 1,
  createdAt: "2026-07-18T00:00:00.000Z",
  updatedAt: "2026-07-18T00:00:00.000Z",
  latestMessage: null,
  participants: [
    {
      id: "recruiter-participant",
      role: "RECRUITER",
      lastReadAt: null,
      recruiterAccount: {
        id: "recruiter-id",
        profile: { fullName: "Recruiter", avatarUrl: null },
        company: { id: "company-id", name: "UpNext" },
      },
    },
    {
      id: "candidate-participant",
      role: "CANDIDATE",
      lastReadAt: null,
      candidateAccount: { id: "candidate-id", fullName: "Nguyễn Ứng Viên" },
    },
  ],
};

const candidateIdentity: CurrentIdentity = {
  id: "candidate-id",
  email: "candidate@upnext.dev",
  role: "CANDIDATE",
  permissions: [],
};

function candidateConversation({
  id,
  recruiterName,
  messageCreatedAt,
  lastReadAt,
}: {
  id: string;
  recruiterName: string;
  messageCreatedAt: string;
  lastReadAt: string | null;
}): ConversationSummary {
  return {
    ...conversation,
    id,
    updatedAt: messageCreatedAt,
    latestMessageAt: messageCreatedAt,
    latestMessageId: `${id}-message`,
    latestMessage: {
      id: `${id}-message`,
      type: "TEXT",
      content: `Tin nhắn từ ${recruiterName}`,
      createdAt: messageCreatedAt,
      senderParticipantId: `${id}-recruiter-participant`,
    },
    participants: [
      {
        id: `${id}-candidate-participant`,
        role: "CANDIDATE",
        lastReadAt,
        candidateAccount: { id: "candidate-id", fullName: "Ứng viên UpNext" },
      },
      {
        id: `${id}-recruiter-participant`,
        role: "RECRUITER",
        lastReadAt: null,
        recruiterAccount: {
          id: `${id}-recruiter`,
          profile: { fullName: recruiterName, avatarUrl: null },
          company: { id: "company-id", name: "UpNext" },
        },
      },
    ],
  };
}
