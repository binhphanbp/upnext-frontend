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
  CaretDown,
  PencilSimple,
  CaretDoubleRight,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

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
  const [isHovered, setIsHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [showSecurityTooltip, setShowSecurityTooltip] = useState(false);
  const currentLocale = locale === "en" ? "en" : "vi";

  // Auto-expand menu if sub-menu child is active on mount / route change
  useEffect(() => {
    const initialOpen: Record<string, boolean> = {};
    navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children?.some((child) => pathname === child.href)) {
          initialOpen[item.label] = true;
        }
      });
    });
    setOpenMenus((prev) => ({ ...prev, ...initialOpen }));
  }, [pathname, navGroups]);

  // Load initial collapsed state on mount
  useEffect(() => {
    const saved = localStorage.getItem("workspace_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  // Reset hover state when navigating to close the temporary hover overlay
  useEffect(() => {
    setIsHovered(false);
  }, [pathname]);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("workspace_sidebar_collapsed", JSON.stringify(next));
      if (next) {
        setIsHovered(false);
      }
      return next;
    });
  };

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

  // Find current active item/sub-item and construct breadcrumbs
  let activeItemLabel = "";
  let activeGroupLabel = "";

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
            activeGroupLabel = item.label;
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
        activeGroupLabel = group.label;
        break;
      }
    }
    if (activeItemLabel) break;
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex h-screen overflow-hidden overscroll-none bg-[#f4f6fa] font-sans text-[#2a3547] antialiased">
        {/* Sidebars Hover Wrapper */}
        <div
          className="relative z-20 flex h-full flex-shrink-0 bg-white"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 1. MINI SIDEBAR (Lớp 1 ngoài cùng) */}
          <aside
            className={cn(
              "relative z-20 flex hidden w-[80px] flex-shrink-0 flex-col items-center md:flex transition-colors duration-300 bg-transparent",
            )}
          >
            <div className="flex h-[76px] w-full shrink-0 items-center justify-center bg-[#212f3f]">
              <button
                onClick={handleToggleCollapse}
                className="cursor-pointer text-slate-300 transition hover:text-white"
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
            </div>

            <nav className="flex w-full flex-1 flex-col items-center gap-4 border-r border-slate-100 py-5">
              <button className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl text-white">
                <DiamondsFour size={24} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900">
                <Browser size={24} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900">
                <ChatCircleDots size={24} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900">
                <Sliders size={24} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900">
                <ChartBar size={24} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900">
                <GridFour size={24} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900">
                <Shield size={24} />
              </button>
            </nav>
          </aside>

          {/* 2. MAIN SIDEBAR (Lớp 2 màu trắng) */}
          <aside
            className={cn(
              "bg-transparent flex-shrink-0 transition-[width,opacity] duration-300 ease-in-out h-full relative z-10 hidden lg:flex",
              !collapsed || isHovered
                ? "w-[260px] opacity-100 border-transparent"
                : "w-0 opacity-0 overflow-hidden border-r-0 lg:w-0 lg:border-r-0",
            )}
          >
            <div className="flex h-full w-[260px] flex-shrink-0 flex-col">
              <div className="flex h-[76px] items-center border-b border-transparent bg-[#212f3f] px-6">
                {workspaceRole === "recruiter" ? (
                  <Link href="/recruiter" className="upnext-focus inline-flex rounded-md">
                    <Image
                      src="/upnext-logo/upnext-recruiter.svg"
                      alt="UpNext Recruiter"
                      width={150}
                      height={38}
                      priority
                      className="h-8 w-auto object-contain"
                    />
                  </Link>
                ) : (
                  <Logo className="w-[67%]" />
                )}
              </div>
              <ScrollArea className="flex-1 space-y-1 px-4 py-4">
                <nav className="space-y-1" aria-label={`Điều hướng ${workspaceRole}`}>
                  {navGroups.map((group, groupIdx) => (
                    <section key={group.label} className="mt-0">
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const hasChildren = item.children && item.children.length > 0;

                          if (hasChildren) {
                            const isMenuOpen = !!openMenus[item.label];
                            const isAnyChildActive = item.children?.some(
                              (child) => pathname === child.href,
                            );
                            const Icon = item.icon;

                            return (
                              <div key={item.label} className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenus((prev) => ({
                                      ...prev,
                                      [item.label]: !prev[item.label],
                                    }));
                                  }}
                                  className={cn(
                                    "flex w-full items-center gap-3 px-4 py-[10px] rounded-lg font-medium text-[14px] transition-all duration-150 text-left cursor-pointer",
                                    isAnyChildActive
                                      ? "bg-slate-100 text-slate-900 font-semibold"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-primary",
                                  )}
                                >
                                  <Icon size={20} />
                                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                  <CaretDown
                                    size={16}
                                    className={cn(
                                      "text-slate-400 transition-transform duration-200",
                                      isMenuOpen && "rotate-180",
                                    )}
                                  />
                                </button>

                                {isMenuOpen && (
                                  <div className="space-y-1 pl-9 transition-all">
                                    {item.children?.map((child) => {
                                      const active = pathname === child.href;
                                      return (
                                        <Link
                                          key={child.href}
                                          href={child.href}
                                          className={cn(
                                            "flex items-center px-4 py-[8px] rounded-lg font-medium text-[13px] transition-all duration-150",
                                            active
                                              ? "text-primary bg-emerald-50 font-semibold"
                                              : "text-slate-500 hover:text-primary hover:bg-slate-50",
                                          )}
                                        >
                                          <span className="truncate">{child.label}</span>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }

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
                                  : "text-slate-600 hover:bg-slate-50 hover:text-primary",
                              )}
                            >
                              <Icon size={20} />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                              {item.badge ? (
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

              {/* User Profile Card */}
              <div className="border-t border-slate-100 p-4">
                <div>
                  {/* Top Row: Avatar + Info + Logout */}
                  <div className="flex items-center gap-3">
                    {identity.avatarUrl ? (
                      <Image
                        src={identity.avatarUrl}
                        alt="Avatar"
                        width={38}
                        height={38}
                        unoptimized
                        className="size-[38px] shrink-0 rounded-full border border-slate-200 bg-white object-cover"
                      />
                    ) : (
                      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-emerald-50 text-xs font-bold text-emerald-600">
                        {identity.initials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[13px] font-bold text-slate-800">
                        {identity.name}
                      </h4>
                      <p className="truncate text-[11px] font-semibold text-slate-500">
                        {identity.roleLabel}
                      </p>
                    </div>

                    <Button
                      onClick={onLogout}
                      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg p-0 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                      variant="ghost"
                      aria-label={t("shell.signOut")}
                    >
                      <SignOut size={18} />
                    </Button>
                  </div>

                  <div
                    className="relative mt-3"
                    onMouseEnter={() => setShowSecurityTooltip(true)}
                    onMouseLeave={() => setShowSecurityTooltip(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setShowSecurityTooltip(!showSecurityTooltip)}
                      className="flex w-full cursor-pointer items-center justify-between gap-1.5 rounded-full bg-[#e03a3a] px-4 py-1.5 text-left text-[11px] font-bold text-white shadow-xs transition hover:bg-[#c62828]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Shield size={14} weight="fill" className="shrink-0 text-white" />
                        <span>Tài khoản chưa đủ an toàn</span>
                      </div>
                      <CaretDoubleRight
                        size={10}
                        weight="bold"
                        className="shrink-0 text-white/80"
                      />
                    </button>

                    {/* Popover */}
                    {showSecurityTooltip && (
                      <div className="absolute bottom-full left-1/2 z-50 w-[220px] -translate-x-1/2 cursor-default pb-2.5">
                        {/* Actual visible box */}
                        <div className="animate-in fade-in slide-in-from-bottom-2 relative rounded-lg bg-slate-900 p-3 text-white shadow-lg duration-200">
                          {/* Arrow pointing down */}
                          <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
                          <p className="text-[12px] leading-relaxed font-medium text-slate-100">
                            Bật xác thực bảo mật 2 yếu tố để bảo vệ tài khoản tốt hơn.
                          </p>
                          <Link
                            href={
                              workspaceRole === "recruiter"
                                ? "/recruiter/settings?tab=security"
                                : "#"
                            }
                            className="mt-2.5 inline-block text-[12px] font-bold text-emerald-400 transition-colors hover:text-emerald-300"
                            onClick={() => setShowSecurityTooltip(false)}
                          >
                            Bật ngay
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

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
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-800 transition-transform duration-200 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          style={{ background: "linear-gradient(180deg, #10243A 0%, #0F1F31 55%, #0B1B2D 100%)" }}
        >
          <div className="flex h-[76px] items-center justify-between border-b border-slate-800 bg-[#212f3f] px-6">
            {workspaceRole === "recruiter" ? (
              <Link href="/recruiter" className="upnext-focus inline-flex rounded-md">
                <Image
                  src="/upnext-logo/upnext-recruiter.svg"
                  alt="UpNext Recruiter"
                  width={150}
                  height={38}
                  priority
                  className="h-9 w-auto object-contain"
                />
              </Link>
            ) : (
              <Logo className="w-[67%]" />
            )}
            <button
              onClick={() => setMobileOpen(false)}
              className="text-slate-400 transition hover:text-white"
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
                      const hasChildren = item.children && item.children.length > 0;

                      if (hasChildren) {
                        const isMenuOpen = !!openMenus[item.label];
                        const isAnyChildActive = item.children?.some(
                          (child) => pathname === child.href,
                        );
                        const Icon = item.icon;

                        return (
                          <div key={item.label} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenus((prev) => ({
                                  ...prev,
                                  [item.label]: !prev[item.label],
                                }));
                              }}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-[10px] rounded-lg font-medium text-[14px] transition-all duration-150 text-left cursor-pointer",
                                isAnyChildActive
                                  ? "bg-slate-800 text-white font-semibold"
                                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
                              )}
                            >
                              <Icon
                                size={18}
                                className={cn(
                                  "flex-shrink-0",
                                  isAnyChildActive ? "text-white" : "text-slate-400",
                                )}
                              />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                              <CaretDown
                                size={14}
                                className={cn(
                                  "text-slate-400 transition-transform duration-200",
                                  isMenuOpen && "rotate-180",
                                )}
                              />
                            </button>

                            {isMenuOpen && (
                              <div className="space-y-1 pl-9 transition-all">
                                {item.children?.map((child) => {
                                  const active = pathname === child.href;
                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={() => setMobileOpen(false)}
                                      className={cn(
                                        "flex items-center px-4 py-[8px] rounded-lg font-medium text-[13px] transition-all duration-150",
                                        active
                                          ? "text-primary bg-emerald-50/50 font-semibold"
                                          : "text-slate-600 hover:text-primary hover:bg-slate-50/50",
                                      )}
                                    >
                                      <span className="truncate">{child.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

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
                              : "text-slate-300 hover:bg-slate-800 hover:text-white",
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
              className="w-full justify-start gap-2 border-0 bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
              variant="outline"
              asChild
            >
              <Link href="#">
                <Sparkle className="text-amber-500" weight="fill" />
                <span>{t("shell.proPackage")}</span>
              </Link>
            </Button>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <div className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f6fa] dark:bg-slate-950">
          {/* TOP HEADER */}
          <header className="relative z-30 flex h-[76px] flex-shrink-0 items-center justify-between bg-[#212f3f] px-8">
            <div className="flex items-center gap-5 text-slate-500">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="mr-2 flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Open navigation drawer"
              >
                <List size={22} />
              </button>

              {/* <button className="hover:text-primary transition" aria-label="Search">
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
              </button> */}
            </div>

            <div className="flex items-center gap-5 text-slate-500">
              {workspaceRole === "recruiter" && (
                <Button
                  className="hidden h-10 items-center justify-center gap-1.5 rounded-full bg-[#10a778] px-4 font-semibold text-white hover:bg-[#0d966d] lg:flex"
                  asChild
                >
                  <Link href="/recruiter/job-posts?action=create">
                    <PencilSimple size={16} className="shrink-0" weight="bold" />
                    <span>{t("shell.postJob")}</span>
                  </Link>
                </Button>
              )}

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
                    <span className="flex size-12 items-center justify-center overflow-hidden rounded-full">
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
                    {identity.avatarUrl ? (
                      <Image
                        src={identity.avatarUrl}
                        alt="Avatar"
                        width={32}
                        height={32}
                        unoptimized
                        className="size-8 rounded-full border border-white/40 bg-white object-cover"
                      />
                    ) : (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white text-xs font-bold text-[#10a778]">
                        {identity.initials}
                      </div>
                    )}

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
                    {identity.avatarUrl ? (
                      <Image
                        src={identity.avatarUrl}
                        alt="Avatar"
                        width={56}
                        height={56}
                        unoptimized
                        className="size-14 rounded-full border border-slate-200 bg-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-emerald-50 text-lg font-bold text-emerald-600">
                        {identity.initials}
                      </div>
                    )}

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
