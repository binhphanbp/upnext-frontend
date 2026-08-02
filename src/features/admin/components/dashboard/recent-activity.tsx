"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { formatRelativeTime } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

import type { AdminRecentActivity } from "../../api/dashboard";

export function RecentActivity({ activities }: { activities?: AdminRecentActivity[] | undefined }) {
  const t = useTranslations("Admin.dashboard");
  const locale = useLocale();

  const validActivities = Array.isArray(activities) ? activities : [];

  return (
    <Card className="col-span-1 flex flex-col lg:col-span-3">
      <CardHeader>
        <CardTitle>{t("recentActivity.title")}</CardTitle>
        <CardDescription>{t("recentActivity.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between">
        <div className="max-h-[350px] scrollbar-thin space-y-6 overflow-y-auto pr-4">
          {validActivities.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">{t("recentActivity.empty")}</p>
          ) : (
            validActivities.map((task) => {
              const status = task.status?.toLowerCase() || "neutral";
              return (
                <div key={task.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className="text-foreground line-clamp-2 text-sm leading-tight font-semibold"
                      title={task.title}
                    >
                      {task.title}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">{task.subtitle}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right whitespace-nowrap">
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
