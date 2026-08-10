"use client";

import {
  BellSimple,
  BriefcaseMetal,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ChatCircleText,
  CheckCircle,
  ShieldCheck,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { CandidatePageHeader } from "@/features/candidate/candidate-page-header";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from "@/features/notifications/api/notifications";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { toast } from "@/shared/ui/toast";

// Mirrors the fallback viewer/`syncViewer` re-sync in public-header.tsx --
// dispatched after a mutation here so the header's bell badge (a separate
// fetch, not a shared React Query cache) drops its count immediately.
const notificationsReadEvent = "upnext-notifications-read";

const pageSize = 15;

function targetHref(notification: Notification): string | null {
  if (notification.targetType === "APPLICATION" && notification.targetId) {
    return `/candidate/applications/${notification.targetId}`;
  }
  return null;
}

function NotificationIcon({ targetType }: Readonly<{ targetType: string | null }>) {
  switch (targetType) {
    case "APPLICATION":
      return <BriefcaseMetal aria-hidden="true" />;
    case "INTERVIEW":
      return <CalendarBlank aria-hidden="true" />;
    case "CONVERSATION":
      return <ChatCircleText aria-hidden="true" />;
    default:
      return <BellSimple aria-hidden="true" />;
  }
}

export function CandidateNotificationsPage() {
  const t = useTranslations("CandidateWorkspace");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSessionResolved, session } = useCandidateProfileWorkspace();
  const [page, setPage] = useState(1);
  const notificationsQueryKey = ["candidate-notifications", session?.user.id, page] as const;

  const notificationsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getNotifications(session!.accessToken, page, pageSize),
    queryKey: notificationsQueryKey,
  });
  const isUnauthorized =
    notificationsQuery.error instanceof ApiError && notificationsQuery.error.status === 401;

  // Deleting the last row on a trailing page shrinks totalPages out from
  // under `page`, which would otherwise strand the candidate on an empty
  // page showing the "no notifications yet" state while earlier pages are
  // still full. Step back to the last page that still exists.
  useEffect(() => {
    const meta = notificationsQuery.data?.meta;
    if (!meta) return;
    if (page > 1 && page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [notificationsQuery.data?.meta, page]);

  const invalidateAndNotifyHeader = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["candidate-notifications", session?.user.id],
    });
    window.dispatchEvent(new Event(notificationsReadEvent));
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(session!.accessToken, id),
    onSettled: invalidateAndNotifyHeader,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(session!.accessToken),
    onSettled: invalidateAndNotifyHeader,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(session!.accessToken, id),
    onError: () => toast.error(t("notifications.feedback.error")),
    onSettled: invalidateAndNotifyHeader,
  });

  const handleOpen = (notification: Notification) => {
    if (!notification.readAt) markReadMutation.mutate(notification.id);
    const href = targetHref(notification);
    if (href) router.push(href);
  };

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const data = notificationsQuery.data;

  const pageHeader = (
    <CandidatePageHeader
      breadcrumbItems={[
        { href: "/", label: t("common.home") },
        { label: t("notifications.page.title") },
      ]}
      description={t("notifications.page.description")}
      title={t("notifications.page.title")}
      action={
        data && data.meta.unreadCount > 0 ? (
          <Button
            variant="outline"
            className="w-full rounded-xl sm:w-auto"
            disabled={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            <CheckCircle aria-hidden="true" />
            {t("notifications.markAllRead")}
          </Button>
        ) : undefined
      }
    />
  );

  if (!isSessionResolved) {
    return (
      <div className="space-y-6 pb-4">
        {pageHeader}
        <CandidateNotificationsLoading />
      </div>
    );
  }

  if (!session || isUnauthorized) {
    return (
      <div className="space-y-6 pb-4">
        {pageHeader}
        <NotificationsState
          icon={<ShieldCheck />}
          title={t("common.signInTitle")}
          description={t("common.signInDescription")}
          action={
            <Button asChild className="rounded-xl">
              <Link href="/login">{t("common.signIn")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {pageHeader}
      {notificationsQuery.isLoading ? <CandidateNotificationsLoading /> : null}
      {notificationsQuery.isError ? (
        <NotificationsState
          tone="error"
          icon={<WarningCircle />}
          title={t("notifications.states.errorTitle")}
          description={t("notifications.states.errorDescription")}
          action={
            <Button className="rounded-xl" onClick={() => notificationsQuery.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : null}
      {data && data.data.length === 0 ? (
        <NotificationsState
          icon={<BellSimple />}
          title={t("notifications.states.emptyTitle")}
          description={t("notifications.states.emptyDescription")}
          action={null}
        />
      ) : null}
      {data && data.data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <ul className="divide-y divide-slate-200">
            {data.data.map((notification) => {
              const href = targetHref(notification);
              const isUnread = !notification.readAt;

              return (
                <li key={notification.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                  <button
                    type="button"
                    onClick={() => handleOpen(notification)}
                    className={cn(
                      "upnext-focus flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left transition-colors",
                      href ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-5",
                        isUnread ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <NotificationIcon targetType={notification.targetType} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm",
                            isUnread ? "font-bold text-slate-950" : "font-medium text-slate-700",
                          )}
                        >
                          {notification.title}
                        </span>
                        {isUnread ? (
                          <span
                            aria-label={t("notifications.unread")}
                            className="size-2 shrink-0 rounded-full bg-emerald-600"
                          />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-sm leading-6 text-slate-600">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {dateFormatter.format(new Date(notification.createdAt))}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("notifications.delete", { title: notification.title })}
                    disabled={
                      deleteMutation.isPending && deleteMutation.variables === notification.id
                    }
                    onClick={() => deleteMutation.mutate(notification.id)}
                    className="upnext-focus grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Trash aria-hidden="true" size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
          {data.meta.totalPages > 1 ? (
            <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CandidateNotificationsLoading() {
  const t = useTranslations("CandidateWorkspace");

  return (
    <div aria-busy="true" className="space-y-5">
      <span className="sr-only">{t("common.loading")}</span>
      <Skeleton className="h-[420px] rounded-xl" />
    </div>
  );
}

function NotificationsState({
  action,
  description,
  icon,
  title,
  tone = "neutral",
}: Readonly<{
  action: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
  tone?: "error" | "neutral";
}>) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className={cn(
          "mx-auto grid size-14 place-items-center rounded-2xl [&_svg]:size-7",
          tone === "error" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600",
        )}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

function Pagination({
  onPageChange,
  page,
  totalPages,
}: Readonly<{ onPageChange: (page: number) => void; page: number; totalPages: number }>) {
  const t = useTranslations("CandidateWorkspace");
  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-5"
      aria-label={t("common.pagination")}
    >
      <p className="text-xs font-medium text-slate-500 tabular-nums">
        {t("common.pageCount", { page, totalPages })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("common.previousPage")}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl"
        >
          <CaretLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("common.nextPage")}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl"
        >
          <CaretRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
