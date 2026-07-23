"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { TooltipProvider } from "@/shared/ui/tooltip";

import type { WorkspaceIdentity, WorkspaceNavGroup, WorkspaceRole } from "./types";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceSidebar } from "./workspace-sidebar";

type WorkspaceShellProps = Readonly<{
  workspaceRole: WorkspaceRole;
  navGroups: WorkspaceNavGroup[];
  identity: WorkspaceIdentity;
  onLogout?: () => void;
  children: React.ReactNode;
}>;

export function WorkspaceShell({
  workspaceRole,
  navGroups,
  identity,
  onLogout,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0);
  };

  const tNamespace = workspaceRole.charAt(0).toUpperCase() + workspaceRole.slice(1);
  const t = useTranslations(tNamespace as any);

  const isMessagesPage =
    pathname.startsWith("/recruiter/messages") || pathname.startsWith("/candidate/messages");

  // Find current active item/sub-item and construct breadcrumbs
  let activeItemLabel = "";

  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.children) {
        for (const child of item.children) {
          const isRootNode =
            child.href === "/admin" || child.href === "/recruiter" || child.href === "/candidate";
          const match = isRootNode
            ? pathname === child.href
            : pathname === child.href || pathname.startsWith(`${child.href}/`);
          if (match) {
            activeItemLabel = child.label;
            break;
          }
        }
      }
      if (activeItemLabel) break;
      const isRootNode =
        item.href === "/admin" || item.href === "/recruiter" || item.href === "/candidate";
      const match = isRootNode
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (match) {
        activeItemLabel = item.label;
        break;
      }
    }
    if (activeItemLabel) break;
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex h-screen overflow-hidden overscroll-none bg-[#f4f6fa] font-sans text-[#2a3547] antialiased">
        <WorkspaceSidebar
          workspaceRole={workspaceRole}
          navGroups={navGroups}
          identity={identity}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onLogout={onLogout}
        />

        {/* RIGHT CONTENT AREA */}
        <div className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f6fa] dark:bg-slate-950">
          <WorkspaceHeader
            workspaceRole={workspaceRole}
            identity={identity}
            setMobileOpen={setMobileOpen}
            onLogout={onLogout}
          />

          {/* PAGE TITLE & BREADCRUMB BAR */}
          {!isMessagesPage && (
            <div className="relative z-20 flex h-14 shrink-0 items-center bg-white px-8 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold text-slate-800 dark:text-slate-200">
                  {activeItemLabel || t("dashboard.title")}
                </span>
              </div>
            </div>
          )}

          {/* White square behind top-left corner to maintain the curve illusion */}
          {!isMessagesPage && (
            <div
              className="absolute top-[132px] left-0 z-0 h-8 w-8 bg-white dark:bg-[#0f1d30]"
              aria-hidden="true"
            />
          )}

          {/* MAIN DASHBOARD CONTENT AREA */}
          <main
            onScroll={handleScroll}
            className={cn(
              "relative z-10 flex-1 overflow-y-auto overflow-x-hidden min-w-0 min-h-0 overscroll-none transition-all duration-200",
              isMessagesPage
                ? "bg-white p-0 rounded-none"
                : cn(
                    "bg-[#f4f6fa] dark:bg-slate-900 p-4 md:p-8",
                    isScrolled ? "rounded-tl-none" : "rounded-tl-[24px] lg:rounded-tl-[32px]",
                  ),
            )}
          >
            <div
              className={cn(
                "mx-auto w-full min-w-0",
                isMessagesPage ? "max-w-none h-full" : "max-w-[1400px]",
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
