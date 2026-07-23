"use client";

import {
  SignOut,
  List,
  DiamondsFour,
  Sliders,
  GridFour,
  PencilSimple,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { WorkspaceIdentity, WorkspaceRole } from "./types";

export type WorkspaceHeaderProps = Readonly<{
  workspaceRole: WorkspaceRole;
  identity: WorkspaceIdentity;
  setMobileOpen: (open: boolean) => void;
  onLogout?: (() => void) | undefined;
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

export function WorkspaceHeader({
  workspaceRole,
  identity,
  setMobileOpen,
  onLogout,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const currentLocale = locale === "en" ? "en" : "vi";

  const tNamespace = workspaceRole.charAt(0).toUpperCase() + workspaceRole.slice(1);
  const t = useTranslations(tNamespace as any);
  const tShell = useTranslations("WorkspaceShell");

  function switchLanguage(nextLocale: "en" | "vi") {
    if (nextLocale === currentLocale) return;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <header
      className={cn(
        "relative z-30 flex h-[76px] flex-shrink-0 items-center justify-between px-8",
        workspaceRole === "admin" ? "bg-white border-b border-slate-200" : "bg-[#212f3f]",
      )}
    >
      <div className="flex items-center gap-5 text-slate-500">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="mr-2 flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation drawer"
        >
          <List size={22} />
        </button>
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

                <span className="mt-1 text-[12px] whitespace-nowrap text-slate-400">9:30 AM</span>
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

                <span className="mt-1 text-[12px] whitespace-nowrap text-slate-400">9:15 AM</span>
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

                <span className="mt-1 text-[12px] whitespace-nowrap text-slate-400">4:36 PM</span>
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
                  {workspaceRole !== "admin" && (
                    <span className="ml-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-500">
                      Pro
                    </span>
                  )}
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
                  {tShell("account.profile")}
                </Link>
              </DropdownMenuItem>

              {workspaceRole !== "admin" && (
                <>
                  <DropdownMenuItem className="hover:text-primary flex cursor-pointer items-center px-5 py-2.5 text-[14px] text-slate-700 transition hover:bg-indigo-50">
                    {t("shell.subscription")}
                  </DropdownMenuItem>

                  <DropdownMenuItem className="hover:text-primary flex cursor-pointer items-center justify-between px-5 py-2.5 text-[14px] text-slate-700 transition hover:bg-indigo-50">
                    <span>{t("shell.invoice")}</span>
                    <span className="text-primary rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold">
                      4
                    </span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem
                asChild
                className="hover:text-primary flex cursor-pointer items-center p-0 text-[14px] text-slate-700 transition hover:bg-indigo-50"
              >
                <Link
                  href={workspaceRole === "recruiter" ? "/recruiter/settings" : "#"}
                  className="flex w-full items-center px-5 py-2.5"
                >
                  {tShell("account.settings")}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-slate-100" />

              <DropdownMenuItem
                onClick={onLogout}
                className="flex w-full cursor-pointer items-center px-5 py-2.5 text-left text-[14px] text-red-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <SignOut className="mr-2" size={16} />
                {tShell("account.logout")}
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
