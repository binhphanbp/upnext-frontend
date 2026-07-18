"use client";

import * as React from "react";

import { ChatThread, mockCandidateThreads } from "../../../recruiter/api/chat";
import { ChatWindow } from "../../../recruiter/components/chat/chat-window";
import { CandidateConversationList } from "./candidate-conversation-list";

export function CandidateChatLayout() {
  const [activeThread, setActiveThread] = React.useState<ChatThread | undefined>(undefined);

  // Use mockCandidateThreads directly for demo
  // In a real app this would be a query
  const [candidateThreads, setCandidateThreads] =
    React.useState<ChatThread[]>(mockCandidateThreads);

  React.useEffect(() => {
    // Keep synced with mock array changes
    const interval = setInterval(() => {
      setCandidateThreads([...mockCandidateThreads]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentUserId = "can-1"; // MOCK CANDIDATE ID

  return (
    <div className="flex h-[calc(100vh-200px)] max-h-[800px] min-h-[600px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Sidebar List */}
      <div className="w-[320px] shrink-0 border-r border-slate-200">
        <CandidateConversationList
          activeThreadId={activeThread?.id}
          onSelectThread={setActiveThread}
          threads={candidateThreads}
          currentUserId={currentUserId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="min-w-0 flex-1">
        <ChatWindow
          thread={activeThread}
          currentUserId={currentUserId}
          currentUserRole="candidate"
        />
      </div>
    </div>
  );
}
