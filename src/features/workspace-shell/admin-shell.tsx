"use client";

import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";

import { usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/logo";
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

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("workspace_sidebar_collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleCollapse = () => {
    setCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("workspace_sidebar_collapsed", JSON.stringify(next));
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex h-screen flex-col overflow-hidden overscroll-none bg-[#f4f6fa] font-sans text-[#2a3547] antialiased">
        {/* TOP UNIFIED HEADER BAR */}
        <div className="relative z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 bg-white">
          {/* Logo & Toggle Section (always fixed 260px on desktop) */}
          <div className="hidden h-full w-[260px] shrink-0 items-center justify-start gap-4 bg-white px-6 lg:flex">
            {/* Toggle Sidebar Button */}
            <button
              onClick={handleToggleCollapse}
              className="mr-1 shrink-0 cursor-pointer text-slate-400 transition hover:text-slate-600"
              aria-label="Toggle Sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="iconify iconify--solar"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
                  <path d="M20 7H4"></path>
                  <path d="M20 12H4" opacity=".5"></path>
                  <path d="M20 17H4"></path>
                </g>
              </svg>
            </button>

            <div className="flex shrink-0 items-center gap-4">
              <Logo className="w-[150px]" />
            </div>
          </div>

          {/* Rest of the Header (stretches to full width) */}
          <div className="h-full min-w-0 flex-1">
            <WorkspaceHeader
              workspaceRole="admin"
              identity={identity}
              setMobileOpen={setMobileOpen}
              onLogout={onLogout}
              collapsed={collapsed}
              onToggleCollapse={handleToggleCollapse}
            />
          </div>
        </div>

        {/* BOTTOM AREA */}
        <div className="flex flex-1 overflow-hidden">
          <Suspense
            fallback={
              <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex" />
            }
          >
            <WorkspaceSidebar
              workspaceRole="admin"
              navGroups={navGroups}
              identity={identity}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
              onLogout={onLogout}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
            />
          </Suspense>

          {/* RIGHT CONTENT AREA */}
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f6fa] dark:bg-slate-950">
            {/* PAGE TITLE & BREADCRUMB BAR */}
            <div className="relative z-20 flex flex-col bg-white pt-6 transition-colors">
              <div className="flex items-center gap-2 px-8 pb-4">
                <span className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-200">
                  {activeItemLabel || t("dashboard.title")}
                </span>
              </div>
              <div id="admin-header-actions" className="flex w-full items-center empty:hidden" />
            </div>

            {/* MAIN DASHBOARD CONTENT AREA */}
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
              {/* White square behind top-left corner to maintain the curve illusion */}
              <div
                className="absolute top-0 left-0 z-0 h-8 w-8 bg-white dark:bg-[#0f1d30]"
                aria-hidden="true"
              />
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
        </div>
      </div>
    </TooltipProvider>
  );
}
