"use client";

import { ArrowLeft, ChatCircleDots, House } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { upnextLogo } from "@/features/public/home/brand";

import { useChatSocket } from "../socket/chat-socket-provider";
import { candidateChatSeenStorageKey } from "../unread";
import { ChatWorkspace } from "./chat-workspace";

export function CandidateConversationPortal() {
  const { identity } = useChatSocket();

  useEffect(() => {
    if (!identity) return;
    window.localStorage.setItem(candidateChatSeenStorageKey(identity.id), new Date().toISOString());
  }, [identity]);

  return (
    <div className="flex h-dvh min-h-[620px] flex-col overflow-hidden bg-slate-50 text-slate-950">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/vi"
            aria-label="Về trang chủ UpNext"
            className="focus-visible:ring-primary shrink-0 rounded-lg outline-none focus-visible:ring-2"
          >
            <Image
              src={upnextLogo.wordmark}
              alt="UpNext"
              width={132}
              height={32}
              priority
              className="h-auto w-[112px] sm:w-[132px]"
            />
          </Link>
          <span className="hidden h-7 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <span className="hidden items-center gap-2 text-sm font-bold text-slate-700 sm:flex">
            <ChatCircleDots className="text-primary" size={20} weight="fill" />
            Connect
          </span>
        </div>

        <p className="hidden truncate text-sm font-semibold text-slate-500 md:block">
          Trao đổi trực tiếp với nhà tuyển dụng về cơ hội của bạn
        </p>

        <Link
          href="/vi"
          className="hover:border-primary/30 hover:bg-primary/5 hover:text-primary inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition sm:px-4"
        >
          <ArrowLeft className="sm:hidden" size={18} />
          <House className="hidden sm:block" size={18} />
          <span className="hidden sm:inline">Về trang chủ</span>
          <span className="sm:hidden">Quay lại</span>
        </Link>
      </header>

      <main className="min-h-0 flex-1" aria-label="Chat với nhà tuyển dụng">
        <ChatWorkspace actor="CANDIDATE" initialType="APPLICATION_CHAT" standalone />
      </main>
    </div>
  );
}
