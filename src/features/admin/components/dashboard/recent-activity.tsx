"use client";

import { useLocale, useTranslations } from "next-intl";

import { formatRelativeTime } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

import type { AdminRecentActivity } from "../../api/dashboard";

export function RecentActivity({ activities }: { activities?: AdminRecentActivity[] | undefined }) {
  const t = useTranslations("Admin.dashboard");
  const locale = useLocale();

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>{t("recentActivity.title")}</CardTitle>
        <CardDescription>{t("recentActivity.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!Array.isArray(activities) || activities.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">{t("recentActivity.empty")}</p>
          ) : (
            activities.map((task) => {
              const status = task.status?.toLowerCase() || "neutral";
              return (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-foreground text-sm leading-none font-bold">{task.title}</p>
                    <p className="text-muted-foreground text-sm">{task.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge
                        tone={
                          status === "pending"
                            ? "warning"
                            : status === "approved" || status === "verified"
                              ? "success"
                              : status === "rejected"
                                ? "error"
                                : "neutral"
                        }
                      >
                        {t(`recentActivity.status.${status}` as any)}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground hidden min-w-20 text-right text-xs sm:block">
                      {formatRelativeTime(task.createdAt, locale as any)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
