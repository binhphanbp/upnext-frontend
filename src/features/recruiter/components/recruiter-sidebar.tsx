"use client";

import { sidebarItems } from "@/features/recruiter/data/dashboard-data";
import { ChevronsLeft, Headphones, UserGear } from "@/features/recruiter/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/logo";

export function RecruiterSidebar() {
  const pathname = usePathname();
  const settingsItem = sidebarItems.find((item) => item.href === "/recruiter/settings");
  const SettingsIcon = settingsItem?.icon;
  const primaryItems = sidebarItems.filter((item) => item.href !== "/recruiter/settings");
  const teamActive = pathname.startsWith("/recruiter/team");

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[280px] lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
      <div className="flex h-full flex-col overflow-y-auto px-5 py-7">
        <Logo className="mb-8 ml-1" href="/recruiter" />

        <nav className="space-y-2.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/recruiter" && pathname.startsWith(item.href));

            return (
              <Link
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition",
                  active
                    ? "border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.08)]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                )}
                href={item.href}
                key={item.href}
                prefetch={false}
              >
                <Icon aria-hidden className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            className={cn(
              "flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition",
              teamActive
                ? "border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.08)]"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
            )}
            href="/recruiter/team"
            prefetch={false}
          >
            <UserGear aria-hidden className="h-5 w-5" />
            <span>Thành viên & phân quyền</span>
          </Link>
          {settingsItem && SettingsIcon ? (
            <Link
              className={cn(
                "flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition",
                pathname.startsWith(settingsItem.href)
                  ? "border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.08)]"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
              )}
              href={settingsItem.href}
              prefetch={false}
            >
              <SettingsIcon aria-hidden className="h-5 w-5" />
              <span>{settingsItem.label}</span>
            </Link>
          ) : null}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <div className="flex gap-3">
            <Headphones aria-hidden className="mt-0.5 h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-slate-950">Bạn cần hỗ trợ?</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Đội ngũ UpNext luôn sẵn sàng hỗ trợ bạn 24/7.
              </p>
            </div>
          </div>
          <button className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-[0_10px_24px_rgba(5,150,105,0.24)] transition hover:bg-emerald-700">
            Liên hệ hỗ trợ
            <span aria-hidden>→</span>
          </button>
        </div>

        <button className="mt-5 inline-flex items-center gap-3 px-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
          <ChevronsLeft aria-hidden className="h-5 w-5" />
          Thu gọn
        </button>
      </div>
    </aside>
  );
}
