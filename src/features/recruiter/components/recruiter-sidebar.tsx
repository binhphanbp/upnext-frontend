"use client";

import { sidebarItems } from "@/features/recruiter/data/dashboard-data";
import { ChevronsLeft, Headphones } from "@/features/recruiter/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/logo";

export function RecruiterSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[280px] lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
      <div className="flex h-full flex-col overflow-y-auto px-5 py-7">
        <Logo className="mb-8 ml-1" href="/recruiter" />

        <nav className="space-y-2.5">
          {sidebarItems.map((item) => {
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
              >
                <Icon aria-hidden className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

      

 
      </div>
    </aside>
  );
}
