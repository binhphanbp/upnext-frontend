"use client";

import { ClockCounterClockwise, Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { env } from "@/shared/lib/env";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { useAiConversation, useAiConversationList } from "../hooks/use-ai-conversation";
import { useCopilotSession } from "../hooks/use-copilot-session";
import { resolvePageContext } from "../lib/page-context";
import { AiConversationSidebar } from "./ai-conversation-sidebar";
import { AiCopilotConversation } from "./ai-copilot-conversation";
import { AiSignedOutState } from "./ai-signed-out-state";
import { AiStatePreview } from "./ai-state-preview";

/**
 * `/{locale}/candidate/ai` — the full Copilot workspace.
 *
 * Deliberately not wrapped in `CandidatePageHeader`: a conversation needs the
 * vertical space, and a second page title above a chat that already names itself
 * only pushes the thread below the fold.
 */
export function AiCopilotPage() {
  const t = useTranslations("AiCopilot");
  const pathname = usePathname();
  const context = resolvePageContext(pathname);
  const controller = useAiConversation(context);
  const conversationList = useAiConversationList();
  const { isSessionResolved, isSignedIn } = useCopilotSession();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Chỉ kết luận "chưa đăng nhập" sau khi đã đọc xong localStorage, nếu không
  // người đã đăng nhập sẽ thấy màn hình mời đăng nhập nháy qua ở render đầu.
  const isSignedOut = isSessionResolved && !isSignedIn;

  const sidebar = (
    <AiConversationSidebar
      conversations={conversationList.data ?? []}
      isLoading={conversationList.isPending}
      activeId={controller.conversationId}
      onSelect={(id) => {
        void controller.openConversation(id);
        setIsHistoryOpen(false);
      }}
      onCreate={() => {
        controller.startNewConversation();
        setIsHistoryOpen(false);
      }}
      onDelete={controller.deleteConversation}
      className="h-full"
    />
  );

  return (
    <section
      className={cn(
        "flex h-[calc(100dvh-11rem)] min-h-[540px] overflow-hidden rounded-2xl border border-slate-200 bg-white",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-32px_rgba(15,23,42,0.25)]",
        "md:h-[calc(100dvh-12.5rem)]",
      )}
      aria-label={t("page.title")}
    >
      {isSignedOut ? null : <div className="hidden w-[264px] shrink-0 lg:block">{sidebar}</div>}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"
          >
            <Sparkle weight="fill" className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold text-slate-950">{t("page.title")}</h1>
            <p className="truncate text-xs text-slate-500">
              {t("page.contextPrefix")} {t(context.labelKey)}
            </p>
          </div>

          {isSignedOut ? null : (
            <>
              {env.NEXT_PUBLIC_AI_COPILOT_STATE_PREVIEW === "enabled" ? (
                <AiStatePreview
                  onPreview={(scenario) =>
                    void controller.send(t("statePreview.prompt"), { forceScenario: scenario })
                  }
                  isDisabled={controller.isBusy}
                />
              ) : null}

              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="upnext-focus grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
                aria-label={t("page.openHistory")}
              >
                <ClockCounterClockwise className="size-4.5" />
              </button>
            </>
          )}
        </header>

        {isSignedOut ? (
          <AiSignedOutState />
        ) : (
          <AiCopilotConversation controller={controller} context={context} variant="page" />
        )}
      </div>

      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent side="left" className="w-[300px] gap-0 p-0 sm:max-w-[300px]">
          {/* `SheetContent` renders its own close button at top-right, so the
              header only needs room for it. */}
          <div className="flex h-13 items-center border-b border-slate-200 px-4 pr-12">
            <SheetTitle className="text-[15px] font-bold text-slate-900">
              {t("page.history")}
            </SheetTitle>
          </div>
          <div className="h-[calc(100%-3.25rem)]">{sidebar}</div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
