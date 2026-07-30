"use client";

import {
  SignOut,
  Sparkle,
  X,
  DiamondsFour,
  Shield,
  CaretDown,
  CaretDoubleRight,
  LockSimple,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

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
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}>;

export function WorkspaceSidebar({
  workspaceRole,
  navGroups,
  identity,
  mobileOpen,
  setMobileOpen,
  onLogout,
  collapsed,
  setCollapsed,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [localCollapsed, setLocalCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("workspace_sidebar_collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const activeCollapsed = collapsed !== undefined ? collapsed : localCollapsed;

  const handleToggleCollapse = () => {
    const nextCollapsed = !activeCollapsed;
    if (setCollapsed) {
      setCollapsed(nextCollapsed);
    } else {
      setLocalCollapsed(nextCollapsed);
    }
    localStorage.setItem("workspace_sidebar_collapsed", JSON.stringify(nextCollapsed));
  };

  const handleLockedClick = (reason?: string) => {
    void Swal.fire({
      icon: "info",
      title: reason || "Tính năng này chưa khả dụng",
      showCancelButton: true,
      confirmButtonText: "Hoàn tất hồ sơ công ty",
      cancelButtonText: "Đóng",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/recruiter");
      }
    });
  };
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [showSecurityTooltip, setShowSecurityTooltip] = useState(false);

  const [activeGroupIndex, setActiveGroupIndex] = useState(() => {
    if (!navGroups || navGroups.length === 0) return 0;
    const index = navGroups.findIndex(
      (group) =>
        group.href === pathname ||
        (group.href && pathname.startsWith(`${group.href}/`)) ||
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
    const index = navGroups.findIndex(
      (group) =>
        group.href === pathname ||
        (group.href && pathname.startsWith(`${group.href}/`)) ||
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
    // Remove hover reset logic
  }, [pathname]);

  const tNamespace = workspaceRole.charAt(0).toUpperCase() + workspaceRole.slice(1);
  const t = useTranslations(tNamespace as any);
  const tShell = useTranslations("WorkspaceShell");

  const isCurrentGroupStandalone = !!(
    navGroups[activeGroupIndex]?.href && navGroups[activeGroupIndex]?.items?.length === 0
  );

  return (
    <>
      <div className="relative z-20 flex h-full flex-shrink-0 bg-white">
        <aside
          className={cn(
            "bg-transparent flex-shrink-0 transition-all duration-300 ease-in-out h-full relative z-10 hidden lg:flex bg-white",
            isCurrentGroupStandalone
              ? "w-0 opacity-0 overflow-hidden border-r-0"
              : !activeCollapsed
                ? "w-[260px]"
                : "w-[80px]",
          )}
        >
          <div
            className={cn(
              "flex h-full flex-shrink-0 flex-col transition-all duration-300",
              isCurrentGroupStandalone
                ? "w-0 overflow-hidden"
                : !activeCollapsed
                  ? "w-[260px]"
                  : "w-[80px]",
            )}
          >
            <ScrollArea className="flex-1 space-y-1 px-4 py-4">
              <nav className="space-y-1" aria-label={`Điều hướng ${workspaceRole}`}>
                {navGroups
                  .filter((group) => group.items && group.items.length > 0)
                  .map((group, groupIdx) => (
                    <section key={group.label} id={`sidebar-section-${groupIdx}`}>
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
                                    if (activeCollapsed) {
                                      handleToggleCollapse();
                                    } else {
                                      setOpenMenus((prev) => ({
                                        ...prev,
                                        [item.label]: !prev[item.label],
                                      }));
                                    }
                                  }}
                                  className={cn(
                                    "rounded-lg font-medium text-[14px] transition-all duration-150 text-left cursor-pointer",
                                    !activeCollapsed
                                      ? "flex w-full items-center gap-3 px-4 py-[10px]"
                                      : "flex h-10 w-10 mx-auto items-center justify-center p-0",
                                    isAnyChildActive
                                      ? "bg-slate-100 text-slate-900 font-semibold"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-primary",
                                  )}
                                  title={activeCollapsed ? item.label : undefined}
                                >
                                  <Icon size={20} className="shrink-0" />
                                  {!activeCollapsed && (
                                    <>
                                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                      <CaretDown
                                        size={16}
                                        className={cn(
                                          "text-slate-400 transition-transform duration-200",
                                          isMenuOpen && "rotate-180",
                                        )}
                                      />
                                    </>
                                  )}
                                </button>

                                {!activeCollapsed && isMenuOpen && (
                                  <div className="space-y-1 pl-9 transition-all">
                                    {item.children?.map((child) => {
                                      const active = pathname === child.href;

                                      if (child.locked) {
                                        return (
                                          <button
                                            key={child.href}
                                            type="button"
                                            onClick={() => handleLockedClick(child.lockedReason)}
                                            className="flex w-full cursor-not-allowed items-center gap-1.5 rounded-lg px-4 py-[8px] text-left text-[13px] font-medium text-slate-400 opacity-70"
                                          >
                                            <span className="min-w-0 flex-1 truncate">
                                              {child.label}
                                            </span>
                                            <LockSimple
                                              size={12}
                                              className="shrink-0 text-slate-300"
                                            />
                                          </button>
                                        );
                                      }

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

                          if (item.locked) {
                            return (
                              <button
                                key={item.href}
                                type="button"
                                onClick={() => handleLockedClick(item.lockedReason)}
                                className={cn(
                                  "cursor-not-allowed items-center font-medium text-slate-400 opacity-70 transition-all duration-150",
                                  !activeCollapsed
                                    ? "flex w-full gap-3 px-4 py-[10px] text-left text-[14px] rounded-lg"
                                    : "flex h-10 w-10 mx-auto justify-center p-0",
                                )}
                                title={activeCollapsed ? item.label : undefined}
                              >
                                <Icon size={20} className="shrink-0" />
                                {!activeCollapsed && (
                                  <>
                                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                    <LockSimple size={14} className="shrink-0 text-slate-300" />
                                  </>
                                )}
                              </button>
                            );
                          }

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "items-center font-medium text-[14px] transition-all duration-150",
                                !activeCollapsed
                                  ? "flex w-full gap-3 px-4 py-[10px] rounded-lg"
                                  : "flex h-10 w-10 mx-auto justify-center p-0",
                                active
                                  ? "bg-primary text-white"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-primary",
                              )}
                              title={activeCollapsed ? item.label : undefined}
                            >
                              <Icon size={20} className="shrink-0" />
                              {!activeCollapsed && (
                                <>
                                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                  {item.badge ? (
                                    <Badge tone={item.badgeTone || "neutral"}>{item.badge}</Badge>
                                  ) : null}
                                </>
                              )}
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
                  className={cn(
                    "rounded-lg font-bold text-red-500 transition-all duration-150 hover:bg-red-50 hover:text-red-600",
                    !activeCollapsed
                      ? "flex w-full items-center gap-3 px-4 py-[10px] text-[14px]"
                      : "flex h-10 w-10 mx-auto items-center justify-center p-0",
                  )}
                  title={tShell("account.logout")}
                >
                  <SignOut size={20} weight="bold" />
                  {!activeCollapsed && <span>{tShell("account.logout")}</span>}
                </button>
              ) : (
                <div>
                  <div
                    className={cn(
                      "flex items-center",
                      !activeCollapsed ? "gap-3 justify-between" : "justify-center",
                    )}
                  >
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

                      {!activeCollapsed && (
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-[13px] font-bold text-slate-800">
                            {identity.name}
                          </h4>
                          <p className="truncate text-[11px] font-semibold text-slate-500">
                            {identity.roleLabel}
                          </p>
                        </div>
                      )}
                    </div>

                    {!activeCollapsed && (
                      <Button
                        onClick={onLogout}
                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg p-0 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        variant="ghost"
                        aria-label={tShell("account.logout")}
                      >
                        <SignOut size={18} />
                      </Button>
                    )}
                  </div>

                  <div
                    className={cn(
                      "relative",
                      !activeCollapsed ? "mt-3" : "mt-3 flex justify-center",
                    )}
                    onMouseEnter={() => setShowSecurityTooltip(true)}
                    onMouseLeave={() => setShowSecurityTooltip(false)}
                  >
                    {activeCollapsed ? (
                      <button
                        type="button"
                        onClick={() => setShowSecurityTooltip(!showSecurityTooltip)}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#e03a3a] text-white shadow-xs transition hover:bg-[#c62828]"
                        title="Tài khoản chưa đủ an toàn"
                      >
                        <Shield size={16} weight="fill" />
                      </button>
                    ) : (
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
                    )}

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
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-white shadow-xl transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex h-[76px] items-center justify-between border-b px-6",
            workspaceRole === "admin"
              ? "bg-white border-slate-200"
              : "bg-[#212f3f] border-transparent",
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
          <nav className="space-y-1">
            {(workspaceRole === "admin" && navGroups[activeGroupIndex]
              ? [navGroups[activeGroupIndex]]
              : navGroups
            ).map((group, groupIdx) => {
              if (!group.items || group.items.length === 0) {
                if (!group.href) return null;
                const active = pathname === group.href || pathname.startsWith(`${group.href}/`);
                const Icon = group.icon || DiamondsFour;
                return (
                  <Link
                    key={group.label}
                    href={group.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-[10px] rounded-lg font-medium text-[14px] transition-all duration-150",
                      active
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-50 hover:text-primary",
                    )}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  </Link>
                );
              }

              return (
                <section key={group.label} id={`mobile-sidebar-section-${groupIdx}`}>
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
                              <Icon
                                size={18}
                                className={cn(
                                  "flex-shrink-0",
                                  isAnyChildActive ? "text-slate-900" : "text-slate-400",
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

                                  if (child.locked) {
                                    return (
                                      <button
                                        key={child.href}
                                        type="button"
                                        onClick={() => handleLockedClick(child.lockedReason)}
                                        className="flex w-full cursor-not-allowed items-center gap-1.5 rounded-lg px-4 py-[8px] text-left text-[13px] font-medium text-slate-400 opacity-70"
                                      >
                                        <span className="min-w-0 flex-1 truncate">
                                          {child.label}
                                        </span>
                                        <LockSimple size={12} className="shrink-0 text-slate-300" />
                                      </button>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={() => setMobileOpen(false)}
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

                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const Icon = item.icon;

                      if (item.locked) {
                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => handleLockedClick(item.lockedReason)}
                            className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-4 py-[10px] text-left text-[14px] font-medium text-slate-400 opacity-70"
                          >
                            <Icon size={18} className="flex-shrink-0 text-slate-400" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            <LockSimple size={14} className="shrink-0 text-slate-300" />
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-[10px] rounded-lg font-medium text-[14px] transition-all duration-150",
                            active
                              ? "bg-primary text-white"
                              : "text-slate-600 hover:bg-slate-50 hover:text-primary",
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
                            <Badge tone={item.badgeTone || "neutral"}>{item.badge}</Badge>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
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
