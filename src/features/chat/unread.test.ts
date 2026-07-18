import { describe, expect, it } from "vitest";

import type { ConversationSummary, CurrentIdentity } from "./types/contracts";
import { conversationHasUnread, hasNewCandidateMessage } from "./unread";

describe("conversation unread state", () => {
  it("treats only a newer peer message as unread", () => {
    expect(conversationHasUnread(conversation, candidate)).toBe(true);
    expect(
      conversationHasUnread(
        {
          ...conversation,
          latestMessage: {
            ...conversation.latestMessage!,
            senderParticipantId: "candidate-participant",
          },
        },
        candidate,
      ),
    ).toBe(false);
  });

  it("does not show the global indicator after the candidate has entered chat", () => {
    expect(hasNewCandidateMessage([conversation], candidate, null)).toBe(true);
    expect(hasNewCandidateMessage([conversation], candidate, "2026-07-18T10:01:00.000Z")).toBe(
      false,
    );
  });
});

const candidate: CurrentIdentity = {
  id: "candidate-id",
  email: "candidate@upnext.dev",
  role: "CANDIDATE",
  permissions: [],
};

const conversation: ConversationSummary = {
  id: "conversation-id",
  type: "APPLICATION_CHAT",
  status: "ACTIVE",
  companyId: "company-id",
  applicationId: "application-id",
  jobPostId: "job-id",
  latestMessageId: "message-id",
  latestMessageAt: "2026-07-18T10:00:00.000Z",
  writableUntil: null,
  readOnlyAt: null,
  closeReason: null,
  tags: [],
  version: 1,
  createdAt: "2026-07-18T09:00:00.000Z",
  updatedAt: "2026-07-18T10:00:00.000Z",
  latestMessage: {
    id: "message-id",
    type: "TEXT",
    content: "Tin nhắn mới",
    createdAt: "2026-07-18T10:00:00.000Z",
    senderParticipantId: "recruiter-participant",
  },
  participants: [
    {
      id: "candidate-participant",
      role: "CANDIDATE",
      lastReadAt: "2026-07-18T09:59:00.000Z",
      candidateAccount: { id: "candidate-id", fullName: "Ứng viên" },
    },
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
  ],
};
