import type { Metadata } from "next";

import { CandidateConversationPortal, ChatSocketProvider } from "@/features/chat";

export const metadata: Metadata = {
  title: "Chat với nhà tuyển dụng | UpNext Connect",
  description: "Trao đổi trực tiếp với nhà tuyển dụng về các cơ hội việc làm trên UpNext.",
};

export default function CandidateRecruiterChatPage() {
  return (
    <ChatSocketProvider actor="CANDIDATE">
      <CandidateConversationPortal />
    </ChatSocketProvider>
  );
}
