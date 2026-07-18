"use client";

import {
  ChatCircleText,
  Info,
  PaperPlaneRight,
  Paperclip,
  Smiley,
  Ticket,
} from "@phosphor-icons/react";
import Image from "next/image";
import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { ChatThread, Message, mockMessages } from "../../api/chat";

export type ChatWindowProps = {
  thread?: ChatThread | undefined;
  currentUserId?: string;
  currentUserRole?: "admin" | "recruiter" | "candidate";
};

export function ChatWindow({
  thread,
  currentUserId = "recruiter-1",
  currentUserRole = "recruiter",
}: ChatWindowProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (thread) {
      setMessages(mockMessages[thread.id] || []);
    } else {
      setMessages([]);
    }
  }, [thread]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !thread) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      content: inputValue,
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Update global mock store
    if (!mockMessages[thread.id]) {
      mockMessages[thread.id] = [];
    }
    const msgs = mockMessages[thread.id];
    if (msgs) {
      msgs.push(newMessage);
    }

    // Update thread lastMessage mock
    thread.lastMessage = newMessage;

    setInputValue("");
  };

  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50">
        <div className="flex size-16 items-center justify-center rounded-full bg-slate-200 text-slate-400">
          <ChatCircleText size={32} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-700">Chọn một đoạn hội thoại</h3>
        <p className="text-sm text-slate-500">
          Hãy chọn một tin nhắn bên cột trái để bắt đầu trò chuyện
        </p>
      </div>
    );
  }

  const isSupport = thread.type === "support_ticket";
  const participant =
    thread.participants.find((p) => p.id !== currentUserId) || thread.participants[0];

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          {isSupport ? (
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Ticket size={20} weight="fill" />
            </div>
          ) : (
            <div className="relative">
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
                <div className="size-10 rounded-full bg-slate-200" />
              )}
              {participant?.isOnline && (
                <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </div>
          )}
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              {isSupport ? thread.ticketSubject : participant?.name}
            </h2>
            <div className="flex items-center gap-2">
              {isSupport ? (
                <>
                  <span className="text-[13px] font-medium text-slate-500">
                    ID: {thread.id.toUpperCase()}
                  </span>
                  <Badge tone={thread.ticketStatus === "resolved" ? "success" : "warning"}>
                    {thread.ticketStatus === "resolved" ? "Đã đóng" : "Đang xử lý"}
                  </Badge>
                  {thread.ticketCategory && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                      {thread.ticketCategory}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[13px] text-slate-500">
                  {participant?.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
          <Info size={24} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn("flex w-full max-w-[75%]", isMe ? "ml-auto justify-end" : "")}
              >
                {!isMe &&
                  !isSupport &&
                  (participant?.avatarUrl ? (
                    <Image
                      src={participant.avatarUrl}
                      alt="avatar"
                      width={28}
                      height={28}
                      className="mt-auto mr-2 size-7 shrink-0 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="mt-auto mr-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200" />
                  ))}
                <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-[14px]",
                      isMe
                        ? "bg-primary text-white"
                        : "bg-white border border-slate-200 text-slate-800",
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="mt-1 text-[11px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      {isSupport && thread.ticketStatus === "resolved" ? (
        <div className="border-t border-slate-200 bg-white p-4 text-center">
          <p className="text-sm font-medium text-slate-500">Ticket này đã được đóng.</p>
        </div>
      ) : (
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="focus-within:border-primary focus-within:ring-primary/20 flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:bg-white focus-within:ring-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full text-slate-400 hover:text-slate-600"
            >
              <Paperclip size={20} />
            </Button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isSupport ? "Nhập tin nhắn phản hồi..." : "Nhập tin nhắn..."}
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[14px] outline-none placeholder:text-slate-400"
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full text-slate-400 hover:text-slate-600"
            >
              <Smiley size={20} />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="shrink-0 rounded-full"
              size="icon"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Nhấn Enter để gửi, Shift + Enter để xuống dòng
          </p>
        </div>
      )}
    </div>
  );
}
