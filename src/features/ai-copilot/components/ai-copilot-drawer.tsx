"use client";

import { ArrowsOut, NotePencil, Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { useAiConversation } from "../hooks/use-ai-conversation";
import { useCopilotSession } from "../hooks/use-copilot-session";
import { resolvePageContext } from "../lib/page-context";
import { useAiCopilotUiStore } from "../stores/ai-copilot-ui.store";
import { AiCopilotConversation } from "./ai-copilot-conversation";

type AiCopilotDrawerProps = Readonly<{
  // Set by the candidate workspace shell, which has its own bottom tab bar
  // on narrow viewports (<=820px, matching the header's own compact
  // breakpoint) that would otherwise sit directly under this launcher.
  raised?: boolean;
}>;

/**
 * The Copilot follows the candidate around the workspace: it opens beside
 * whatever page they are on and inherits that page's context (§8.3), so "so
 * sánh tôi với công việc này" resolves without the user naming the job.
 *
 * Suppressed on `/candidate/ai`, where the full page already owns the thread.
 */
export function AiCopilotDrawer({ raised = false }: AiCopilotDrawerProps = {}) {
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
        className={cn(
          "upnext-focus group fixed right-5 bottom-5 z-40 flex h-14 items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 text-white shadow-lg shadow-emerald-600/25 transition-shadow hover:shadow-xl hover:shadow-emerald-600/30 active:scale-95 motion-reduce:transition-none",
          raised && "max-[820px]:bottom-[calc(80px+env(safe-area-inset-bottom))]",
        )}
      >
        {/*
          `h-14` (56px) và `px-4` (16px mỗi bên) cộng với icon `size-6` (24px)
          cho đúng 56px bề ngang lúc nghỉ — một hình tròn thật, không phải hình
          gần-tròn. Nhãn bên dưới dùng `margin-left` thay vì `gap` của flex:
          `gap` cộng khoảng cách ngay cả khi span co về `max-w-0`, nên trước đây
          nút luôn rộng hơn cao — không tròn mà cũng không rõ ràng là viên
          thuốc (pill), lỡ cỡ ở giữa.
        */}
        <Sparkle weight="fill" className="size-6 shrink-0" />
        <span className="ml-0 max-w-0 overflow-hidden text-sm font-bold whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-32 group-hover:opacity-100 motion-reduce:transition-none">
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
