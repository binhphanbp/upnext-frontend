"use client";

import {
  ArrowClockwise,
  CloudSlash,
  Hourglass,
  Prohibit,
  WarningCircle,
  WarningDiamond,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import type { AiRunStatus } from "../types";

type NoticeTone = "error" | "warning" | "neutral";

const TONE_CLASS: Record<NoticeTone, string> = {
  error: "border-red-200 bg-red-50/70",
  warning: "border-amber-200 bg-amber-50/70",
  neutral: "border-slate-200 bg-slate-50",
};

const ICON_CLASS: Record<NoticeTone, string> = {
  error: "text-red-500",
  warning: "text-amber-500",
  neutral: "text-slate-400",
};

const STATE_PRESENTATION: Partial<
  Record<
    AiRunStatus,
    { tone: NoticeTone; icon: ComponentType<{ className?: string }>; retry: boolean }
  >
> = {
  failed: { tone: "error", icon: WarningCircle, retry: true },
  rate_limited: { tone: "warning", icon: Hourglass, retry: false },
  permission_denied: { tone: "error", icon: Prohibit, retry: false },
  model_unavailable: { tone: "neutral", icon: CloudSlash, retry: true },
  partial: { tone: "warning", icon: WarningDiamond, retry: true },
};

/**
 * §15.4 — the failure half of the required state set. Each state gets its own
 * wording and its own affordance: a rate limit is not retryable, a blocked tool
 * is not a bug, and a partial result still shows whatever did arrive.
 */
export function AiStateNotice({
  status,
  detail,
  onRetry,
}: {
  status: AiRunStatus;
  detail?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations("AiCopilot");
  const presentation = STATE_PRESENTATION[status];
  if (!presentation) return null;

  const Icon = presentation.icon;

  return (
    <div
      role="alert"
      className={cn("mt-3 rounded-xl border px-3.5 py-3", TONE_CLASS[presentation.tone])}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-px size-4.5 shrink-0", ICON_CLASS[presentation.tone])} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-slate-900">{t(`stateNotice.${status}`)}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">
            {detail ?? t(`stateNoticeDescription.${status}`)}
          </p>
        </div>
        {presentation.retry && onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0">
            <ArrowClockwise />
            {t("stateNotice.retry")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
