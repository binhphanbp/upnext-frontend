"use client";

import { Headset, MagnifyingGlass, User, Users, Plus } from "@phosphor-icons/react";
import Image from "next/image";
import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

import { ChatThread } from "../../api/chat";

export type ConversationListProps = {
  activeTab: "candidates" | "support";
  onTabChange: (tab: "candidates" | "support") => void;
  activeThreadId?: string | undefined;
  onSelectThread: (thread: ChatThread) => void;
  candidateThreads: ChatThread[];
  supportThreads: ChatThread[];
  onCreateTicket: (subject: string, category: string, content: string) => void;
};

export function ConversationList({
  activeTab,
  onTabChange,
  activeThreadId,
  onSelectThread,
  candidateThreads,
  supportThreads,
  onCreateTicket,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [content, setContent] = React.useState("");

  const filteredCandidateThreads = React.useMemo(() => {
    return candidateThreads.filter((t) =>
      t.participants[0]?.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [candidateThreads, searchQuery]);

  const filteredSupportThreads = React.useMemo(() => {
    return supportThreads.filter((t) =>
      t.ticketSubject?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [supportThreads, searchQuery]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !category || !content.trim()) return;
    onCreateTicket(subject.trim(), category, content.trim());
    setIsDialogOpen(false);
    setSubject("");
    setCategory("");
    setContent("");
  };

  const renderThread = (thread: ChatThread) => {
    const isActive = activeThreadId === thread.id;
    const participant = thread.participants[0];
    const isSupport = thread.type === "support_ticket";

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
            <h4 className="truncate text-sm font-semibold text-slate-900">
              {isSupport ? thread.ticketSubject : participant?.name}
            </h4>
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
          {isSupport && (
            <div className="mt-2 flex items-center gap-2">
              <Badge tone={thread.ticketStatus === "resolved" ? "success" : "warning"}>
                {thread.ticketStatus === "resolved" ? "Đã đóng" : "Đang xử lý"}
              </Badge>
              {thread.ticketCategory && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {thread.ticketCategory}
                </span>
              )}
            </div>
          )}
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
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-bold text-slate-900">Tin nhắn</h2>

        {activeTab === "support" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 px-3">
                <Plus size={14} weight="bold" />
                Tạo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle>Tạo Ticket Hỗ Trợ Mới</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-3">
                    <Label htmlFor="subject" className="font-medium text-slate-800">
                      Chủ đề
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Ví dụ: Lỗi thanh toán gói Pro"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      autoFocus
                      className="!focus-visible:ring-0 !focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="category" className="font-medium text-slate-800">
                      Loại vấn đề
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger
                        id="category"
                        className="!focus-visible:ring-0 !focus-visible:ring-offset-0"
                      >
                        <SelectValue placeholder="Chọn loại vấn đề" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Thanh toán & Dịch vụ">Thanh toán & Dịch vụ</SelectItem>
                        <SelectItem value="Đăng tin & Tuyển dụng">Đăng tin & Tuyển dụng</SelectItem>
                        <SelectItem value="Tài khoản & Bảo mật">Tài khoản & Bảo mật</SelectItem>
                        <SelectItem value="Lỗi kỹ thuật">Lỗi kỹ thuật</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="content" className="font-medium text-slate-800">
                      Nội dung chi tiết
                    </Label>
                    <Textarea
                      id="content"
                      placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                      className="!focus-visible:ring-0 !focus-visible:ring-offset-0 min-h-[120px] resize-none"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={!subject.trim() || !category || !content.trim()}>
                    Gửi yêu cầu
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="px-4 pb-4">
        <Tabs
          value={activeTab}
          onValueChange={(val) => onTabChange(val as "candidates" | "support")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="candidates">
              <Users size={16} className="mr-2" />
              Ứng viên
            </TabsTrigger>
            <TabsTrigger value="support">
              <Headset size={16} className="mr-2" />
              Hỗ trợ
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 pb-2">
        <div className="relative">
          <MagnifyingGlass
            className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            placeholder={activeTab === "candidates" ? "Tìm kiếm ứng viên..." : "Tìm kiếm ticket..."}
            className="h-9 pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "candidates" ? (
          filteredCandidateThreads.length > 0 ? (
            filteredCandidateThreads.map(renderThread)
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy hội thoại.</div>
          )
        ) : filteredSupportThreads.length > 0 ? (
          filteredSupportThreads.map(renderThread)
        ) : (
          <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy ticket.</div>
        )}
      </div>
    </div>
  );
}
