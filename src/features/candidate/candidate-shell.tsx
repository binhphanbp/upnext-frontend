"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AiCopilotDrawer } from "@/features/ai-copilot";
import {
  candidateChatSeenStorageKey,
  ChatSocketProvider,
  hasNewCandidateMessage,
  useChatSocket,
  useConversations,
} from "@/features/chat";
import { InstallPromptBanner } from "@/features/pwa/install-prompt-banner";
import { OfflineBanner } from "@/features/pwa/offline-banner";
import { usePathname, useRouter } from "@/i18n/navigation";

import { PublicHeader } from "../public/shared/public-header";
import { CandidateTabBar } from "./candidate-tab-bar";
import { getCandidateSession } from "./session";

type CandidateShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function CandidateShell({ children }: CandidateShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isCvBuilder = pathname.endsWith("/cv-builder");

  if (isCvBuilder) {
    return (
      <ChatSocketProvider actor="CANDIDATE">
        <div className="min-h-screen bg-slate-50">{children}</div>
      </ChatSocketProvider>
    );
  }

  return (
    <ChatSocketProvider actor="CANDIDATE">
      <CandidateWorkspace onNavigate={(path) => router.push(path)}>{children}</CandidateWorkspace>
    </ChatSocketProvider>
  );
}

function CandidateWorkspace({
  children,
  onNavigate,
}: Readonly<{
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}>) {
  const pathname = usePathname();
  const locale = useLocale();
  const { identity } = useChatSocket();
  const conversations = useConversations();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [lastChatSeenAt, setLastChatSeenAt] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const resolvedCandidateId = identity?.id ?? getCandidateSession()?.user.id ?? null;
    setCandidateId(resolvedCandidateId);
    if (!resolvedCandidateId) {
      setLastChatSeenAt(undefined);
      return undefined;
    }

    const storageKey = candidateChatSeenStorageKey(resolvedCandidateId);
    setLastChatSeenAt(window.localStorage.getItem(storageKey));
    const syncSeenState = (event: StorageEvent) => {
      if (event.key === storageKey) setLastChatSeenAt(event.newValue);
    };
    window.addEventListener("storage", syncSeenState);
    return () => window.removeEventListener("storage", syncSeenState);
  }, [identity?.id]);

  const hasNewRecruiterMessages = useMemo(
    () =>
      lastChatSeenAt !== undefined &&
      hasNewCandidateMessage(conversations.conversations, identity, lastChatSeenAt),
    [conversations.conversations, identity, lastChatSeenAt],
  );

  const markRecruiterChatViewed = useCallback(() => {
    const seenAt = new Date().toISOString();
    const resolvedCandidateId = candidateId ?? getCandidateSession()?.user.id ?? null;
    if (resolvedCandidateId) {
      window.localStorage.setItem(candidateChatSeenStorageKey(resolvedCandidateId), seenAt);
    }
    setLastChatSeenAt(seenAt);
  }, [candidateId]);

  return (
    <div
      className="candidate-workspace min-h-screen bg-slate-50 text-slate-950"
      suppressHydrationWarning
    >
      <PublicHeader
        navigate={onNavigate}
        hasNewRecruiterMessages={hasNewRecruiterMessages}
        onRecruiterChatViewed={markRecruiterChatViewed}
      />

      <OfflineBanner locale={locale} />
      <InstallPromptBanner locale={locale} />

      <main className="mx-auto w-[min(1400px,calc(100vw-32px))] pt-6 pb-10 md:w-[min(1400px,calc(100vw-60px))] md:pt-8 md:pb-14 xl:w-[min(1400px,calc(100vw-96px))]">
        {children}
      </main>

      {/* Reserves the tab bar's own height so it doesn't cover the last bit of
          page content — a sibling spacer rather than tweaking `main`'s
          existing responsive padding chain above, which already has a
          separate desktop/tablet progression. */}
      <div
        aria-hidden="true"
        className="hidden max-[820px]:block"
        style={{ height: "calc(56px + env(safe-area-inset-bottom))" }}
      />

      <CandidateTabBar
        activePath={pathname}
        hasNewMessages={hasNewRecruiterMessages}
        onMessagesTabClick={markRecruiterChatViewed}
      />

      {/* Follows the candidate across the workspace and reads the current route
          as context (§8.3). Left off the CV builder branch above on purpose: that
          screen is a full-bleed editor with its own bottom action bar. */}
      <AiCopilotDrawer raised />
    </div>
  );
}
