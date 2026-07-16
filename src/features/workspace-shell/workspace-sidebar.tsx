"use client";

import {
  SignOut,
  Sparkle,
  X,
  DiamondsFour,
  Browser,
  ChatCircleDots,
  Sliders,
  ChartBar,
  GridFour,
  Shield,
  CaretDown,
  CaretDoubleRight,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type { WorkspaceIdentity, WorkspaceNavGroup, WorkspaceRole } from "./types";

export type WorkspaceSidebarProps = Readonly<{
  workspaceRole: WorkspaceRole;
  navGroups: WorkspaceNavGroup[];
  identity: WorkspaceIdentity;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout?: (() => void) | undefined;
}>;

export function WorkspaceSidebar({
  workspaceRole,
  navGroups,
  identity,
  mobileOpen,
  setMobileOpen,
  onLogout,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [showSecurityTooltip, setShowSecurityTooltip] = useState(false);

  const [activeGroupIndex, setActiveGroupIndex] = useState(() => {
    if (!navGroups || navGroups.length === 0) return 0;
    const index = navGroups.findIndex((group) =>
      group.items.some(
        (item) =>
          item.href === pathname ||
          (!["/admin", "/recruiter", "/candidate"].includes(item.href) &&
            pathname.startsWith(`${item.href}/`)) ||
          item.children?.some(
            (child) => pathname === child.href || pathname.startsWith(`${child.href}/`),
          ),
      ),
    );
    return index >= 0 ? index : 0;
  });

  useEffect(() => {
    if (!navGroups || navGroups.length === 0) return;
    const index = navGroups.findIndex((group) =>
      group.items.some(
        (item) =>
          item.href === pathname ||
          (!["/admin", "/recruiter", "/candidate"].includes(item.href) &&
            pathname.startsWith(`${item.href}/`)) ||
          item.children?.some(
            (child) => pathname === child.href || pathname.startsWith(`${child.href}/`),
          ),
      ),
    );
    if (index >= 0) {
      setActiveGroupIndex(index);
    }
  }, [pathname, navGroups]);

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

  useEffect(() => {
    const saved = localStorage.getItem("workspace_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

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

  const tNamespace = workspaceRole.charAt(0).toUpperCase() + workspaceRole.slice(1);
  const t = useTranslations(tNamespace as any);
  const tShell = useTranslations("WorkspaceShell");

  return (
    <>
      <div
        className="relative z-20 flex h-full flex-shrink-0 bg-white"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <aside
          className={cn(
            "relative z-20 flex hidden w-[80px] flex-shrink-0 flex-col items-center md:flex transition-colors duration-300 bg-transparent",
          )}
        >
          <div
            className={cn(
              "flex h-[76px] w-full shrink-0 items-center justify-center",
              workspaceRole === "admin" ? "bg-white border-b border-slate-200" : "bg-[#212f3f]",
            )}
          >
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
            {navGroups.map((group, index) => {
              const Icon = group.icon || DiamondsFour; // fallback
              const isActive = index === activeGroupIndex;
              // Attempt to translate group label for tooltip
              const labelTrans = group.label.includes(".") ? t(group.label as any) : group.label;
              return (
                <button
                  key={group.label}
                  onClick={() => {
                    setActiveGroupIndex(index);
                    if (collapsed) setCollapsed(false);
                  }}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition",
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-900",
                  )}
                  title={labelTrans}
                >
                  <Icon size={24} />
                </button>
              );
            })}
          </nav>

          {workspaceRole === "admin" && (
            <div className="mt-auto mb-6 flex w-full justify-center">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white shadow-sm">
                N
              </div>
            </div>
          )}
        </aside>

        <aside
          className={cn(
            "bg-transparent flex-shrink-0 transition-[width,opacity] duration-300 ease-in-out h-full relative z-10 hidden lg:flex",
            !collapsed || isHovered
              ? "w-[260px] opacity-100 border-transparent"
              : "w-0 opacity-0 overflow-hidden border-r-0 lg:w-0 lg:border-r-0",
          )}
        >
          <div className="flex h-full w-[260px] flex-shrink-0 flex-col">
            <div
              className={cn(
                "flex h-[76px] items-center justify-between px-6",
                workspaceRole === "admin"
                  ? "bg-white border-b border-slate-200"
                  : "bg-[#212f3f] border-b border-transparent",
              )}
            >
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
                <div className="flex items-center gap-4">
                  <Logo className="w-[150px]" />
                </div>
              )}
            </div>
            <ScrollArea className="flex-1 space-y-1 px-4 py-4">
              <nav className="space-y-6" aria-label={`Điều hướng ${workspaceRole}`}>
                {(workspaceRole === "admin" && navGroups[activeGroupIndex]
                  ? [navGroups[activeGroupIndex]]
                  : navGroups
                ).map((group, groupIdx) => (
                  <section
                    key={group.label}
                    id={`sidebar-section-${groupIdx}`}
                    className={groupIdx > 0 ? "mt-2" : "mt-0"}
                  >
                    {workspaceRole === "admin" && (
                      <h2 className="mb-2 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                        {group.label.includes(".") ? t(group.label as any) : group.label}
                      </h2>
                    )}
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

            <div className="border-t border-slate-100 p-4">
              {workspaceRole === "admin" ? (
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-[10px] text-[14px] font-bold text-red-500 transition-all duration-150 hover:bg-red-50 hover:text-red-600"
                >
                  <SignOut size={20} weight="bold" />
                  <span>{tShell("account.logout")}</span>
                </button>
              ) : (
                <div>
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
                      aria-label={tShell("account.logout")}
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

                    {showSecurityTooltip && (
                      <div className="absolute bottom-full left-1/2 z-50 w-[220px] -translate-x-1/2 cursor-default pb-2.5">
                        <div className="animate-in fade-in slide-in-from-bottom-2 relative rounded-lg bg-slate-900 p-3 text-white shadow-lg duration-200">
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
              )}
            </div>
          </div>
        </aside>
      </div>

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
        <div
          className={cn(
            "flex h-[76px] items-center justify-between border-b px-6",
            workspaceRole === "admin"
              ? "bg-white border-slate-200"
              : "bg-[#212f3f] border-slate-800",
          )}
        >
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
            className={cn(
              "transition",
              workspaceRole === "admin"
                ? "text-slate-500 hover:text-slate-800"
                : "text-slate-400 hover:text-white",
            )}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <ScrollArea className="flex-1 space-y-1 px-4 py-4">
          <nav className="space-y-6">
            {(workspaceRole === "admin" && navGroups[activeGroupIndex]
              ? [navGroups[activeGroupIndex]]
              : navGroups
            ).map((group, groupIdx) => (
              <section
                key={group.label}
                id={`mobile-sidebar-section-${groupIdx}`}
                className={groupIdx > 0 ? "mt-6" : "mt-2"}
              >
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
                          className={cn("flex-shrink-0", active ? "text-white" : "text-slate-400")}
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
    </>
  );
}
