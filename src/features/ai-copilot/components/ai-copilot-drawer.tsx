"use client";

import { ArrowsOut, NotePencil, Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { useAiConversation } from "../hooks/use-ai-conversation";
import { useCopilotSession } from "../hooks/use-copilot-session";
import { resolvePageContext } from "../lib/page-context";
import { useAiCopilotUiStore } from "../stores/ai-copilot-ui.store";
import { AiCopilotConversation } from "./ai-copilot-conversation";

/**
 * The Copilot follows the candidate around the workspace: it opens beside
 * whatever page they are on and inherits that page's context (§8.3), so "so
 * sánh tôi với công việc này" resolves without the user naming the job.
 *
 * Suppressed on `/candidate/ai`, where the full page already owns the thread.
 */
export function AiCopilotDrawer() {
  const t = useTranslations("AiCopilot");
  const pathname = usePathname();
  const isOpen = useAiCopilotUiStore((state) => state.isDrawerOpen);
  const openDrawer = useAiCopilotUiStore((state) => state.openDrawer);
  const closeDrawer = useAiCopilotUiStore((state) => state.closeDrawer);

  const context = resolvePageContext(pathname);
  const controller = useAiConversation(context);
  const { isSignedIn, isSessionResolved } = useCopilotSession();

  if (pathname.startsWith("/candidate/ai")) return null;

  // Nút nổi chỉ là lối vào; mở ra một khung chat không gửi được thì thà đừng mời.
  // Người chưa đăng nhập vào được khu vực này khi phiên hết hạn giữa chừng.
  if (!isSessionResolved || !isSignedIn) return null;

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        aria-label={t("drawer.open")}
        aria-expanded={isOpen}
        className="upnext-focus group fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 pr-4 pl-3.5 text-white shadow-lg shadow-emerald-600/25 transition-all hover:shadow-xl hover:shadow-emerald-600/30 active:scale-95 motion-reduce:transition-none"
      >
        <Sparkle weight="fill" className="size-5" />
        <span className="max-w-0 overflow-hidden text-sm font-bold whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-32 group-hover:opacity-100 motion-reduce:transition-none">
          {t("drawer.launcher")}
        </span>
      </button>

      <Sheet open={isOpen} onOpenChange={(open) => (open ? openDrawer() : closeDrawer())}>
        <SheetContent
          side="right"
          closeLabel={t("drawer.close")}
          className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]"
        >
          <header className="flex shrink-0 items-center gap-2.5 border-b border-slate-200 px-4 py-3 pr-12">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
            >
              <Sparkle weight="fill" className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-[14.5px] font-bold text-slate-950">
                {t("page.title")}
              </SheetTitle>
              <p className="truncate text-[11.5px] text-slate-500">
                {t("page.contextPrefix")} {t(context.labelKey)}
              </p>
            </div>
            <button
              type="button"
              onClick={controller.startNewConversation}
              aria-label={t("sidebar.newConversation")}
              title={t("sidebar.newConversation")}
              className="upnext-focus grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <NotePencil className="size-4" />
            </button>
            <Link
              href="/candidate/ai"
              onClick={closeDrawer}
              aria-label={t("drawer.expand")}
              title={t("drawer.expand")}
              className="upnext-focus grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowsOut className="size-4" />
            </Link>
          </header>

          <AiCopilotConversation controller={controller} context={context} variant="drawer" />
        </SheetContent>
      </Sheet>
    </>
  );
}
