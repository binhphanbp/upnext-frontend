"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import * as React from "react";

import {
  ChatThread,
  Message,
  mockCandidateThreads,
  mockMessages,
  mockSupportThreads,
} from "../../api/chat";
import { ChatWindow } from "./chat-window";
import { ConversationList } from "./conversation-list";

export function ChatLayout() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const tabParam = searchParams.get("tab") === "support" ? "support" : "candidates";

  const [activeTab, setActiveTab] = React.useState<"candidates" | "support">(tabParam);
  const [activeThread, setActiveThread] = React.useState<ChatThread | undefined>(undefined);

  // Manage state so new tickets appear immediately
  const [supportThreads, setSupportThreads] = React.useState<ChatThread[]>(mockSupportThreads);
  const [candidateThreads, setCandidateThreads] =
    React.useState<ChatThread[]>(mockCandidateThreads);

  // Sync state with URL params on mount
  React.useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (tab: "candidates" | "support") => {
    router.replace(`${pathname}?tab=${tab}`);
    setActiveTab(tab);
    setActiveThread(undefined);
  };

  const handleCreateTicket = (subject: string, category: string, content: string) => {
    const newTicketId = `ticket-${Date.now()}`;
    const newMsgId = `msg-${Date.now()}`;

    const newTicket: ChatThread = {
      id: newTicketId,
      type: "support_ticket",
      ticketSubject: subject,
      ticketCategory: category,
      ticketStatus: "open",
      participants: [
        {
          id: "admin-1",
          name: "UpNext Support",
          isOnline: true,
          role: "admin",
          avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=UpNext",
        },
      ],
      unreadCount: 0,
      lastMessage: {
        id: newMsgId,
        senderId: "recruiter-1",
        content: content,
        timestamp: new Date().toISOString(),
        isRead: true,
      },
    };

    const newMsg: Message = {
      id: newMsgId,
      senderId: "recruiter-1",
      content: content,
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    // Update mocks for simplicity so switching components retains them
    mockSupportThreads.unshift(newTicket);
    mockMessages[newTicketId] = [newMsg];

    setSupportThreads([...mockSupportThreads]);
    setActiveTab("support");
    setActiveThread(newTicket);
  };

  return (
    <div className="flex h-[calc(100vh-76px)] w-full overflow-hidden bg-slate-100">
      {/* Cột danh sách */}
      <div className="w-[340px] shrink-0 border-r border-slate-200 bg-white shadow-sm lg:w-[380px]">
        <ConversationList
          activeTab={activeTab}
          onTabChange={handleTabChange}
          activeThreadId={activeThread?.id}
          onSelectThread={setActiveThread}
          candidateThreads={candidateThreads}
          supportThreads={supportThreads}
          onCreateTicket={handleCreateTicket}
        />
      </div>

      {/* Cột khung chat */}
      <div className="flex-1">
        <ChatWindow thread={activeThread} />
      </div>
    </div>
  );
}
