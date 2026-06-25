"use client";

import {
  SignOut,
  Sparkle,
  List,
  X,
  DiamondsFour,
  Browser,
  ChatCircleDots,
  Sliders,
  ChartBar,
  GridFour,
  Shield,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Logo } from "@/shared/ui/logo";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { TooltipProvider } from "@/shared/ui/tooltip";

import type { WorkspaceIdentity, WorkspaceNavGroup, WorkspaceRole } from "./types";

type WorkspaceShellProps = Readonly<{
  workspaceRole: WorkspaceRole;
  navGroups: WorkspaceNavGroup[];
  identity: WorkspaceIdentity;
  onLogout?: () => void;
  children: React.ReactNode;
}>;

function UkFlag() {
  return (
    <Image
      src="/assets/flags/uk-flag.png"
      alt="English"
      width={32}
      height={32}
      className="size-full object-cover"
    />
  );
}

function VnFlag() {
  return (
    <Image
      src="/assets/flags/vietnam-flag.png"
      alt="Tiếng Việt"
      width={32}
      height={32}
      className="size-full object-cover"
    />
  );
}

export function WorkspaceShell({
  workspaceRole,
  navGroups,
  identity,
  onLogout,
  children,
}: WorkspaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const currentLocale = locale === "en" ? "en" : "vi";

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0);
  };
  const tNamespace = workspaceRole.charAt(0).toUpperCase() + workspaceRole.slice(1);
  const t = useTranslations(tNamespace as any);
  const tShell = useTranslations("WorkspaceShell");

  function switchLanguage(nextLocale: "en" | "vi") {
    if (nextLocale === currentLocale) return;

    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex h-screen overflow-hidden overscroll-none bg-[#f4f6fa] font-sans text-[#2a3547] antialiased">
        {/* 1. MINI SIDEBAR (Lớp 1 ngoài cùng) */}
        <aside className="relative z-20 flex hidden w-[80px] flex-shrink-0 flex-col items-center border-r border-slate-200 bg-[#f4f6fa] py-5 md:flex">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hover:text-primary mb-8 text-slate-800 transition"
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

          <nav className="flex flex-col gap-4">
            <button className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl text-white">
              <DiamondsFour size={24} />
            </button>
            <button className="hover:text-primary flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-50">
              <Browser size={24} />
            </button>
            <button className="hover:text-primary flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-50">
              <ChatCircleDots size={24} />
            </button>
            <button className="hover:text-primary flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-50">
              <Sliders size={24} />
            </button>
            <button className="hover:text-primary flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-50">
              <ChartBar size={24} />
            </button>
            <button className="hover:text-primary flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-50">
              <GridFour size={24} />
            </button>
            <button className="hover:text-primary flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-50">
              <Shield size={24} />
            </button>
          </nav>
        </aside>

        {/* 2. MAIN SIDEBAR (Lớp 2 màu trắng) */}
        <aside
          className={cn(
            "w-[260px] bg-white flex flex-col flex-shrink-0 z-10 transition-all duration-200",
            collapsed ? "hidden md:hidden lg:hidden" : "hidden lg:flex",
          )}
        >
          <div className="flex h-[76px] items-center border-b border-transparent px-6">
            <Logo className="w-[67%]" />
          </div>
          <ScrollArea className="flex-1 space-y-1 px-4 py-4">
            <nav className="space-y-6" aria-label={`Điều hướng ${workspaceRole}`}>
              {navGroups.map((group, groupIdx) => (
                <section key={group.label} className={groupIdx > 0 ? "mt-6" : "mt-2"}>
                  <h2 className="mb-2 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    {group.label}
                  </h2>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isRootNode =
                        item.href === "/admin" ||
                        item.href === "/recruiter" ||
                        item.href === "/candidate";
                      const active =
                        pathname === item.href ||
                        (!isRootNode && pathname.startsWith(`${item.href}/`));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-[10px] rounded-lg font-medium text-[14px] transition-all duration-150",
                            active
                              ? "bg-primary text-white"
                              : "text-slate-700 hover:bg-slate-50 hover:text-primary",
                          )}
                        >
                          <Icon size={20} />
                          {!collapsed ? (
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          ) : null}
                          {!collapsed && item.badge ? (
                            <Badge tone={item.badgeTone || "neutral"}>{item.badge}</Badge>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>
          </ScrollArea>

          <div className="border-border space-y-2 border-t p-3">
            {workspaceRole !== "admin" ? (
              <Button
                className="w-full justify-start"
                variant="secondary"
                size={collapsed ? "icon" : "md"}
              >
                <Sparkle />
                {!collapsed ? t("shell.proPackage") : null}
              </Button>
            ) : null}
            <Button
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
              variant="ghost"
              size={collapsed ? "icon" : "md"}
            >
              <SignOut />
              {!collapsed ? t("shell.signOut") : null}
            </Button>
          </div>
        </aside>

        {/* 3. MOBILE SIDEBAR DRAWER OVERLAY */}
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close navigation drawer"
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-white border-r border-slate-100 transition-transform duration-200 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
            <Logo className="w-[67%]" />
            <button
              onClick={() => setMobileOpen(false)}
              className="hover:text-primary text-slate-500"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <ScrollArea className="flex-1 space-y-1 px-4 py-4">
            <nav className="space-y-6">
              {navGroups.map((group, groupIdx) => (
                <section key={group.label} className={groupIdx > 0 ? "mt-6" : "mt-2"}>
                  <h2 className="mb-2 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    {group.label}
                  </h2>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-[10px] rounded-lg font-medium text-[14px] transition-all duration-150",
                            active
                              ? "bg-primary text-white"
                              : "text-slate-700 hover:bg-slate-50 hover:text-primary",
                          )}
                        >
                          <Icon
                            size={18}
                            className={cn(
                              "flex-shrink-0",
                              active ? "text-white" : "text-slate-400",
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.badge ? (
                            <span
                              className={cn(
                                "ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full",
                                active ? "bg-white/20 text-white" : "bg-emerald-50 text-primary",
                              )}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>
          </ScrollArea>
          <div className="border-t border-slate-100 p-4">
            <Button
              className="text-primary hover:text-primary/90 w-full justify-start gap-2 border-0 bg-indigo-50 font-bold hover:bg-indigo-100"
              variant="outline"
              asChild
            >
              <Link href="#">
                <Sparkle weight="fill" />
                <span>{t("shell.proPackage")}</span>
              </Link>
            </Button>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <div className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f6fa] dark:bg-slate-950">
          {/* TOP HEADER */}
          <header className="relative z-30 flex h-[76px] flex-shrink-0 items-center justify-between bg-white px-8">
            <div className="flex items-center gap-5 text-slate-500">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="mr-2 flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Open navigation drawer"
              >
                <List size={22} />
              </button>

              <button className="hover:text-primary transition" aria-label="Search">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="iconify iconify--solar"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <defs>
                    <mask id="iconifyReactSearch">
                      <g fill="none" strokeWidth="1.5">
                        <circle cx="11.5" cy="11.5" r="9.5" stroke="gray"></circle>
                        <path stroke="#fff" strokeLinecap="round" d="M18.5 18.5L22 22"></path>
                      </g>
                    </mask>
                  </defs>
                  <path
                    fill="currentColor"
                    d="M0 0h24v24H0z"
                    mask="url(#iconifyReactSearch)"
                  ></path>
                </svg>
              </button>
              <button className="hover:text-primary transition" aria-label="Grid Menu">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="iconify iconify--solar"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <g fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path
                      d="M2.5 6.5a4 4 0 1 1 8 0a4 4 0 0 1-8 0Zm11 11a4 4 0 1 1 8 0a4 4 0 0 1-8 0Z"
                      opacity=".5"
                    ></path>
                    <path d="M21.5 6.5a4 4 0 1 0-8 0a4 4 0 0 0 8 0Zm-11 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0Z"></path>
                  </g>
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-5 text-slate-500">
              {/* Notification dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#10a778] text-white transition hover:opacity-85 focus:outline-none"
                    aria-label="Notifications"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      className="size-[18px]"
                      viewBox="0 0 24 24"
                    >
                      <g fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18.75 9.71v-.705C18.75 5.136 15.726 2 12 2S5.25 5.136 5.25 9.005v.705a4.4 4.4 0 0 1-.692 2.375L3.45 13.81c-1.011 1.575-.239 3.716 1.52 4.214a25.8 25.8 0 0 0 14.06 0c1.759-.498 2.531-2.639 1.52-4.213l-1.108-1.725a4.4 4.4 0 0 1-.693-2.375Z" />
                        <path
                          strokeLinecap="round"
                          d="M7.5 19c.655 1.748 2.422 3 4.5 3s3.845-1.252 4.5-3M12 6v4"
                          opacity=".5"
                        />
                      </g>
                    </svg>

                    <span className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                      0
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="z-50 w-[360px] overflow-hidden rounded-xl border-slate-100 bg-white p-0"
                >
                  <div className="flex items-center justify-between border-b border-slate-50 p-5">
                    <h4 className="text-[17px] font-semibold text-slate-800">
                      {t("shell.notifications")}
                    </h4>
                  </div>

                  <div className="max-h-[340px] overflow-y-auto">
                    <div className="flex items-start gap-4 border-b border-slate-50/50 p-5 transition hover:bg-slate-50">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-400">
                        <GridFour size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className="text-[14px] font-bold text-slate-800">Launch Admin</h5>
                        <p className="mt-0.5 truncate text-[13px] text-slate-500">
                          Just see the my new admin!
                        </p>
                      </div>

                      <span className="mt-1 text-[12px] whitespace-nowrap text-slate-400">
                        9:30 AM
                      </span>
                    </div>

                    <div className="flex items-start gap-4 border-b border-slate-50/50 p-5 transition hover:bg-slate-50">
                      <div className="text-primary flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                        <DiamondsFour size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className="text-[14px] font-bold text-slate-800">Event Today</h5>
                        <p className="mt-0.5 truncate text-[13px] text-slate-500">
                          Just a reminder that you...
                        </p>
                      </div>

                      <span className="mt-1 text-[12px] whitespace-nowrap text-slate-400">
                        9:15 AM
                      </span>
                    </div>

                    <div className="flex items-start gap-4 border-b border-slate-50/50 p-5 transition hover:bg-slate-50">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                        <Sliders size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className="text-[14px] font-bold text-slate-800">Settings</h5>
                        <p className="mt-0.5 truncate text-[13px] text-slate-500">
                          You can customize this...
                        </p>
                      </div>

                      <span className="mt-1 text-[12px] whitespace-nowrap text-slate-400">
                        4:36 PM
                      </span>
                    </div>
                  </div>

                  <div className="p-4 pt-2">
                    <button
                      className="bg-primary hover:bg-primary/95 w-full rounded-xl py-2.5 text-[14px] font-medium text-white transition"
                      type="button"
                    >
                      {t("shell.allNotifications")}
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Language dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-85 focus:outline-none"
                    aria-label="Select Language"
                    type="button"
                  >
                    <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-white">
                      <span className="block size-12 h-auto">
                        {currentLocale === "en" ? <UkFlag /> : <VnFlag />}
                      </span>
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="z-50 w-[200px] rounded-xl border-slate-100 bg-white py-1"
                >
                  <DropdownMenuItem
                    onClick={() => switchLanguage("en")}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-4 py-2.5 text-[14px] hover:bg-slate-50",
                      currentLocale === "en" && "font-semibold text-primary",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center overflow-hidden rounded-full">
                        <span className="block size-8">
                          <UkFlag />
                        </span>
                      </span>
                      <span>English (UK)</span>
                    </div>

                    {currentLocale === "en" ? (
                      <span className="text-primary text-[10px] font-bold">✔</span>
                    ) : null}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => switchLanguage("vi")}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-4 py-2.5 text-[14px] hover:bg-slate-50",
                      currentLocale === "vi" && "font-semibold text-primary",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center overflow-hidden rounded-full">
                        <span className="block size-8">
                          <VnFlag />
                        </span>
                      </span>
                      <span>Viet Nam</span>
                    </div>

                    {currentLocale === "vi" ? (
                      <span className="text-primary text-[10px] font-bold">✔</span>
                    ) : null}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#10a778] py-1 pr-2 pl-1 text-white transition hover:opacity-85 focus:outline-none"
                    aria-label="Open profile menu"
                    type="button"
                  >
                    <Image
                      src={
                        identity.avatarUrl ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(identity.name)}`
                      }
                      alt="Avatar"
                      width={32}
                      height={32}
                      unoptimized
                      className="size-8 rounded-full border border-white/40 bg-white object-cover"
                    />

                    <svg
                      aria-hidden="true"
                      className="iconify iconify--solar hover:text-primary dark:text-primary group-hover/menu:text-primary"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="m12.37 15.835l6.43-6.63C19.201 8.79 18.958 8 18.43 8H5.57c-.528 0-.771.79-.37 1.205l6.43 6.63c.213.22.527.22.74 0"
                      />
                    </svg>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="z-50 w-[280px] overflow-hidden rounded-xl border-slate-100 bg-white p-0"
                >
                  <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/50 p-5">
                    <Image
                      src={
                        identity.avatarUrl ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(identity.name)}`
                      }
                      alt="Avatar"
                      width={56}
                      height={56}
                      unoptimized
                      className="size-14 rounded-full border border-slate-200 bg-slate-100 object-cover"
                    />

                    <div className="min-w-0">
                      <h4 className="flex items-center gap-1 truncate text-[15px] font-bold text-slate-800">
                        {identity.name}
                        <span className="ml-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-500">
                          Pro
                        </span>
                      </h4>

                      <p className="mt-0.5 truncate text-[13px] text-slate-500">
                        {identity.email || `${identity.initials.toLowerCase()}@upnext.com`}
                      </p>
                    </div>
                  </div>

                  <div className="py-2">
                    <DropdownMenuItem asChild>
                      <Link
                        href={workspaceRole === "recruiter" ? "/recruiter/settings" : "#"}
                        className="hover:text-primary flex cursor-pointer items-center px-5 py-2.5 text-[14px] text-slate-700 transition hover:bg-indigo-50"
                      >
                        {t("shell.profile")}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="hover:text-primary flex cursor-pointer items-center px-5 py-2.5 text-[14px] text-slate-700 transition hover:bg-indigo-50">
                      {t("shell.subscription")}
                    </DropdownMenuItem>

                    <DropdownMenuItem className="hover:text-primary flex cursor-pointer items-center justify-between px-5 py-2.5 text-[14px] text-slate-700 transition hover:bg-indigo-50">
                      <span>{t("shell.invoice")}</span>
                      <span className="text-primary rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold">
                        4
                      </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="hover:text-primary flex cursor-pointer items-center p-0 text-[14px] text-slate-700 transition hover:bg-indigo-50"
                    >
                      <Link
                        href={workspaceRole === "recruiter" ? "/recruiter/settings" : "#"}
                        className="flex w-full items-center px-5 py-2.5"
                      >
                        {t("shell.settings")}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 bg-slate-100" />

                    <DropdownMenuItem
                      onClick={onLogout}
                      className="flex w-full cursor-pointer items-center px-5 py-2.5 text-left text-[14px] text-red-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <SignOut className="mr-2" size={16} />
                      {t("shell.signOut")}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* White square behind top-left corner to maintain the curve illusion */}
          <div className="absolute top-[76px] left-0 z-0 h-8 w-8 bg-white" aria-hidden="true" />

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
