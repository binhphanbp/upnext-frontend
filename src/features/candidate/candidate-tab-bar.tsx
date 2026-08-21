"use client";

import { BookmarkSimple, Briefcase, ChatCircleText, FileText, House } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";

type CandidateTabBarProps = Readonly<{
  activePath: string;
  hasNewMessages: boolean;
  onMessagesTabClick: () => void;
}>;

function isTabActive(activePath: string, href: string) {
  return activePath === href || activePath.startsWith(`${href}/`);
}

// Mirrors the header's own compact-menu breakpoint (marketing-home.css,
// max-width: 820px) so the two mobile chrome pieces switch on together —
// splitting them at Tailwind's default 768px would leave a hybrid layout
// with a bottom bar but no compact header, or vice versa, for ~50px of
// viewport width.
export function CandidateTabBar({
  activePath,
  hasNewMessages,
  onMessagesTabClick,
}: CandidateTabBarProps) {
  const t = useTranslations("CandidateWorkspace.tabBar");

  const items = [
    { href: "/candidate/profile", label: t("profile"), icon: House },
    { href: "/candidate/applications", label: t("applications"), icon: Briefcase },
    { href: "/candidate/saved-jobs", label: t("savedJobs"), icon: BookmarkSimple },
    {
      href: "/candidate/messages",
      label: t("messages"),
      icon: ChatCircleText,
      badge: hasNewMessages,
      onClick: onMessagesTabClick,
    },
    { href: "/candidate/cv-builder", label: t("cv"), icon: FileText },
  ] as const;

  return (
    <nav
      aria-label={t("navigationLabel")}
      className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-slate-200 bg-white/95 backdrop-blur-sm max-[820px]:flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = isTabActive(activePath, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={"onClick" in item ? item.onClick : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "upnext-focus flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold transition-colors",
              active ? "text-emerald-600" : "text-slate-500",
            )}
          >
            <span className="relative">
              <Icon size={22} weight={active ? "fill" : "regular"} aria-hidden="true" />
              {"badge" in item && item.badge ? (
                <span
                  className="absolute -top-0.5 -right-1 size-2 rounded-full bg-red-500"
                  aria-hidden="true"
                />
              ) : null}
            </span>
            {item.label}
            {"badge" in item && item.badge ? (
              <span className="sr-only">{t("hasUnread")}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
