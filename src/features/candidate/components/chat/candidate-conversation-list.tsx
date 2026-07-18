"use client";

import { User } from "@phosphor-icons/react";
import Image from "next/image";
import * as React from "react";

import { cn } from "@/shared/lib/cn";

import { ChatThread } from "../../../recruiter/api/chat";

export type CandidateConversationListProps = {
  activeThreadId?: string | undefined;
  onSelectThread: (thread: ChatThread) => void;
  threads: ChatThread[];
  currentUserId: string;
};

export function CandidateConversationList({
  activeThreadId,
  onSelectThread,
  threads,
  currentUserId,
}: CandidateConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredThreads = React.useMemo(() => {
    return threads.filter((t) => {
      const participant = t.participants.find((p) => p.id !== currentUserId) || t.participants[0];
      return participant?.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [threads, searchQuery, currentUserId]);

  const renderThread = (thread: ChatThread) => {
    const isActive = activeThreadId === thread.id;
    const participant =
      thread.participants.find((p) => p.id !== currentUserId) || thread.participants[0];

    return (
      <button
        key={thread.id}
        onClick={() => onSelectThread(thread)}
        className={cn(
          "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50",
          isActive ? "bg-slate-50" : "bg-white",
        )}
      >
        <div className="relative shrink-0">
          {participant?.avatarUrl ? (
            <Image
              src={participant.avatarUrl}
              alt={participant.name}
              width={40}
              height={40}
              className="size-10 rounded-full border border-slate-200 bg-white object-cover"
              unoptimized
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <User size={20} />
            </div>
          )}
          {participant?.isOnline && (
            <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <h4 className="truncate text-sm font-semibold text-slate-900">{participant?.name}</h4>
            <span className="shrink-0 text-xs text-slate-500">
              {thread.lastMessage
                ? new Date(thread.lastMessage.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>
          <p
            className={cn(
              "mt-1 truncate text-sm",
              thread.unreadCount > 0 ? "font-medium text-slate-800" : "text-slate-500",
            )}
          >
            {thread.lastMessage?.content}
          </p>
        </div>
        {thread.unreadCount > 0 && (
          <div className="bg-primary flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
            {thread.unreadCount}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Tin nhắn</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-100">
          {filteredThreads.map(renderThread)}
          {filteredThreads.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">Không có đoạn chat nào</div>
          )}
        </div>
      </div>
    </div>
  );
}
