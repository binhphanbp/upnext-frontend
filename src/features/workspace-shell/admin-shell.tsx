"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { TooltipProvider } from "@/shared/ui/tooltip";

import type { WorkspaceIdentity, WorkspaceNavGroup } from "./types";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceSidebar } from "./workspace-sidebar";

type AdminShellProps = Readonly<{
  navGroups: WorkspaceNavGroup[];
  identity: WorkspaceIdentity;
  onLogout?: () => void;
  children: React.ReactNode;
}>;

export function AdminShell({ navGroups, identity, onLogout, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0);
  };
  const t = useTranslations("Admin");

  // Find current active item/sub-item and construct breadcrumbs
  let activeItemLabel = "";

  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.children) {
        for (const child of item.children) {
          const match = pathname === child.href || pathname.startsWith(`${child.href}/`);
          if (match) {
            activeItemLabel = child.label;
            break;
          }
        }
      }
      if (activeItemLabel) break;
      const isRootNode = item.href === "/admin";
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
          workspaceRole="admin"
          navGroups={navGroups}
          identity={identity}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onLogout={onLogout}
        />

        {/* RIGHT CONTENT AREA */}
        <div className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f6fa] dark:bg-slate-950">
          <WorkspaceHeader
            workspaceRole="admin"
            identity={identity}
            setMobileOpen={setMobileOpen}
            onLogout={onLogout}
          />

          {/* PAGE TITLE & BREADCRUMB BAR */}
          <div className="relative z-20 flex h-14 shrink-0 items-center bg-white px-8 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-slate-800 dark:text-slate-200">
                {activeItemLabel || t("dashboard.title")}
              </span>
            </div>
          </div>

          {/* White square behind top-left corner to maintain the curve illusion */}
          <div
            className="absolute top-[132px] left-0 z-0 h-8 w-8 bg-white dark:bg-[#0f1d30]"
            aria-hidden="true"
          />

          {/* MAIN DASHBOARD CONTENT AREA */}
          <main
            onScroll={handleScroll}
            className={cn(
              "relative z-10 flex-1 overflow-y-auto overflow-x-hidden min-w-0 min-h-0 overscroll-none p-4 md:p-8 bg-[#f4f6fa] dark:bg-slate-900 transition-all duration-200",
              isScrolled ? "rounded-tl-none" : "rounded-tl-[24px] lg:rounded-tl-[32px]",
            )}
          >
            <div className="mx-auto w-full max-w-[1400px] min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
