import type { ConversationSummary, CurrentIdentity } from "./types/contracts";

const candidateChatSeenStoragePrefix = "upnext.candidate.chat.seen";

export function candidateChatSeenStorageKey(candidateId: string) {
  return `${candidateChatSeenStoragePrefix}:${candidateId}`;
}

export function conversationHasUnread(
  conversation: ConversationSummary,
  identity: CurrentIdentity | null,
) {
  const latest = conversation.latestMessage;
  if (!latest || !identity) return false;
  const self = conversation.participants.find(
    (participant) =>
      participant.candidateAccount?.id === identity.id ||
      participant.recruiterAccount?.id === identity.id ||
      participant.adminUser?.id === identity.id,
  );
  if (!self || latest.senderParticipantId === self.id) return false;
  return !self.lastReadAt || latest.createdAt > self.lastReadAt;
}

export function compareConversationsByUnread(
  left: ConversationSummary,
  right: ConversationSummary,
  identity: CurrentIdentity | null,
) {
  const unreadDifference =
    Number(conversationHasUnread(right, identity)) - Number(conversationHasUnread(left, identity));
  if (unreadDifference !== 0) return unreadDifference;
  return conversationActivityTime(right) - conversationActivityTime(left);
}

export function hasNewCandidateMessage(
  conversations: ConversationSummary[],
  identity: CurrentIdentity | null,
  lastSeenAt: string | null,
) {
  const seenTime = lastSeenAt ? Date.parse(lastSeenAt) : Number.NEGATIVE_INFINITY;
  return conversations.some((conversation) => {
    if (!conversationHasUnread(conversation, identity)) return false;
    return conversationActivityTime(conversation) > seenTime;
  });
}

function conversationActivityTime(conversation: ConversationSummary) {
  return Date.parse(
    conversation.latestMessage?.createdAt ?? conversation.latestMessageAt ?? conversation.updatedAt,
  );
}
