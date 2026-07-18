export const CHAT_SCHEMA_VERSION = 1 as const;

export type ActorRole = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type ConversationType = "APPLICATION_CHAT" | "TALENT_OUTREACH" | "SUPPORT";
export type ConversationStatus = "PENDING" | "ACTIVE" | "READ_ONLY" | "CLOSED";
export type MessageType = "TEXT" | "ATTACHMENT" | "MIXED" | "SYSTEM";
export type DeliveryState = "pending" | "sent" | "failed";

export type CurrentIdentity = Readonly<{
  id: string;
  email: string;
  role: ActorRole;
  companyId?: string | null;
  recruiterRoleId?: string | null;
  adminRoleId?: string | null;
  permissions: string[];
}>;

export type ConversationParticipant = Readonly<{
  id: string;
  role: ActorRole;
  lastReadAt: string | null;
  candidateAccount?: { id: string; fullName: string } | null;
  recruiterAccount?: {
    id: string;
    profile: { fullName: string; avatarUrl: string | null } | null;
    company: { id: string; name: string } | null;
  } | null;
  adminUser?: { id: string; fullName: string; avatarUrl: string | null } | null;
}>;

export type MessageAttachment = Readonly<{
  id: string;
  status: "UPLOADED" | "CLAIMED" | "QUARANTINED" | "DELETED";
  fileAsset: {
    originalName: string;
    mimeType: string;
    sizeBytes: string | number;
  };
}>;

export type ChatMessage = Readonly<{
  id: string;
  conversationId: string;
  senderParticipantId: string | null;
  clientMessageId: string | null;
  type: MessageType;
  content: string | null;
  systemEventType?: string | null;
  replyToMessageId?: string | null;
  attachments: MessageAttachment[];
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  deliveryState?: DeliveryState;
  deliveryError?: string;
}>;

export type ConversationSummary = Readonly<{
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  companyId: string | null;
  applicationId: string | null;
  jobPostId: string | null;
  latestMessageId: string | null;
  latestMessageAt: string | null;
  writableUntil: string | null;
  readOnlyAt: string | null;
  closeReason: string | null;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  latestMessage: Pick<
    ChatMessage,
    "id" | "type" | "content" | "createdAt" | "senderParticipantId"
  > | null;
  participants: ConversationParticipant[];
}>;

export type TalentContactStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "BLOCKED"
  | "CLOSED";

export type ConversationDetail = ConversationSummary &
  Readonly<{
    application?: {
      id: string;
      status: string;
      jobPost: { id: string; title: string; company: { id: string; name: string } };
      candidateProfile: { id: string; account: { id: string; fullName: string } };
    } | null;
    talentContactRequest?: {
      id: string;
      status: TalentContactStatus;
      expiresAt: string;
      version?: number;
      jobPost: { id: string; title: string };
    } | null;
    supportCase?: {
      id: string;
      caseNumber: string;
      title: string;
      department: SupportDepartment;
      categoryCode: string;
      priority: SupportPriority;
      status: SupportCaseStatus;
      assignedAdminUserId: string | null;
    } | null;
  }>;

export type CursorMeta = Readonly<{ nextCursor: string | null }>;
export type ConversationListResponse = Readonly<{
  data: ConversationSummary[];
  meta: CursorMeta;
}>;
export type ConversationDetailResponse = Readonly<{ data: ConversationDetail }>;
export type MessageListResponse = Readonly<{ data: ChatMessage[]; meta: CursorMeta }>;

export type SendMessageInput = Readonly<{
  clientMessageId: string;
  content?: string;
  attachmentIds?: string[];
  replyToMessageId?: string;
}>;

export type ChatAck<T> =
  | Readonly<{ ok: true; data: T; serverTime: string }>
  | Readonly<{
      ok: false;
      error: { code: string; message: string; retryable: boolean };
      serverTime: string;
    }>;

export type SupportDepartment =
  | "SALES"
  | "BILLING"
  | "JOB_REVIEW"
  | "COMPANY_VERIFICATION"
  | "TECHNICAL"
  | "GENERAL";
export type SupportPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type SupportCaseStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "WAITING_ON_RECRUITER"
  | "WAITING_ON_SUPPORT"
  | "RESOLVED"
  | "CLOSED";

export type SupportCase = Readonly<{
  id: string;
  caseNumber: string;
  clientRequestId: string;
  conversationId: string;
  companyId: string;
  createdByRecruiterId: string;
  assignedAdminUserId: string | null;
  department: SupportDepartment;
  categoryCode: string;
  priority: SupportPriority;
  status: SupportCaseStatus;
  title: string;
  description: string;
  resolutionCode: string | null;
  resolutionSummary: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  conversation: { id: string; status: ConversationStatus; latestMessageAt: string | null };
  assignedAdmin?: { id: string; fullName: string; avatarUrl: string | null } | null;
  jobPost?: { id: string; title: string; moderationStatus: string } | null;
  invoice?: { id: string; invoiceCode: string; paymentStatus: string; amount: string } | null;
  companySubscription?: {
    id: string;
    status: string;
    startedAt: string;
    expiredAt: string;
  } | null;
}>;

export type TalentContactRequest = Readonly<{
  id: string;
  companyId: string;
  candidateProfileId: string;
  jobPostId: string;
  conversationId: string;
  status: TalentContactStatus;
  expiresAt: string;
  version: number;
  jobPost: { id: string; title: string };
  company: { id: string; name: string };
  conversation: { id: string; status: ConversationStatus; latestMessageAt: string | null };
}>;

export type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "expired";
