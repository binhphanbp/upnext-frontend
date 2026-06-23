"use client";

import {
  Bell,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  SignOut,
  Sparkle,
} from "@phosphor-icons/react";
import { useState } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Logo } from "@/shared/ui/logo";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

import type { WorkspaceIdentity, WorkspaceNavGroup, WorkspaceRole } from "./types";

type WorkspaceShellProps = Readonly<{
  workspaceRole: WorkspaceRole;
  navGroups: WorkspaceNavGroup[];
  identity: WorkspaceIdentity;
  children: React.ReactNode;
}>;

export function WorkspaceShell({
  workspaceRole,
  navGroups,
  identity,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="bg-background-subtle text-foreground min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-sidebar transition-[width] duration-200 lg:flex lg:flex-col",
            collapsed ? "w-[84px]" : "w-[292px]",
          )}
        >
          <div className="border-border flex h-18 items-center justify-between gap-3 border-b px-4">
            <Logo markOnly={collapsed} className={cn(collapsed && "mx-auto")} />
            {!collapsed ? (
              <Button
                aria-label="Thu gọn sidebar"
                className="border-slate-200 bg-white"
                size="icon"
                variant="outline"
                onClick={() => setCollapsed(true)}
              >
                <CaretLeft />
              </Button>
            ) : null}
          </div>

          {collapsed ? (
            <Button
              aria-label="Mở rộng sidebar"
              className="mx-auto mt-4 border-slate-200 bg-white"
              size="icon"
              variant="outline"
              onClick={() => setCollapsed(false)}
            >
              <CaretRight />
            </Button>
          ) : null}

          <ScrollArea className="flex-1 px-3 py-5">
            <nav className="space-y-6" aria-label={`Điều hướng ${workspaceRole}`}>
              {navGroups.map((group) => (
                <section key={group.label}>
                  {!collapsed ? (
                    <h2 className="text-muted-foreground px-3 text-xs font-extrabold tracking-wide uppercase">
                      {group.label}
                    </h2>
                  ) : null}
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const Icon = item.icon;
                      const link = (
                        <Link
                          href={item.href}
                          className={cn(
                            "upnext-focus flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            active &&
                              "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--brand)]",
                            collapsed && "justify-center px-0",
                          )}
                        >
                          <Icon size={20} />
                          {!collapsed ? (
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          ) : null}
                          {!collapsed && item.badge ? (
                            <Badge tone="neutral">{item.badge}</Badge>
                          ) : null}
                        </Link>
                      );

                      if (!collapsed) {
                        return <div key={item.href}>{link}</div>;
                      }

                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>
          </ScrollArea>

          <div className="border-border border-t p-3">
            <Button
              className="w-full justify-start"
              variant="secondary"
              size={collapsed ? "icon" : "md"}
            >
              <Sparkle />
              {!collapsed ? "Gói tuyển dụng Pro" : null}
            </Button>
          </div>
        </aside>

        <div
          className={cn(
            "min-h-screen transition-[padding] duration-200",
            collapsed ? "lg:pl-[84px]" : "lg:pl-[292px]",
          )}
        >
          <header className="border-border bg-background/92 sticky top-0 z-30 border-b backdrop-blur">
            <div className="flex h-18 items-center gap-4 px-4 sm:px-6 lg:px-8">
              <div className="lg:hidden">
                <Logo markOnly />
              </div>
              <div className="relative hidden max-w-xl flex-1 md:block">
                <MagnifyingGlass
                  className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                  size={18}
                />
                <Input
                  className="bg-muted h-10 rounded-xl pl-10"
                  placeholder="Tìm việc, CV, công ty, kỹ năng..."
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Thông báo">
                  <Bell />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="upnext-focus border-border flex items-center gap-3 rounded-full border bg-white py-1 pr-3 pl-1.5">
                      <span className="bg-brand text-brand-foreground grid size-9 place-items-center rounded-full text-sm font-extrabold">
                        {identity.initials}
                      </span>
                      <span className="hidden text-left sm:block">
                        <span className="text-foreground block text-sm font-bold">
                          {identity.name}
                        </span>
                        <span className="text-muted-foreground block text-xs font-medium">
                          {identity.roleLabel}
                        </span>
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Hồ sơ</DropdownMenuItem>
                    <DropdownMenuItem>Cài đặt</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <SignOut />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
