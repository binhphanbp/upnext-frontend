"use client";

import { CaretDown, CheckCircle, Prohibit, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { cn } from "@/shared/lib/cn";

import type { AiRunStatus, AiToolCall } from "../types";

/**
 * The user-facing progress surface for a single run: which data sources were
 * checked, whether they succeeded, and how long each took. §1.3 requires every AI call to be
 * inspectable, and this is the user-facing half of that promise — the run log in
 * §19 is the operator-facing half.
 */
export function AiRunTimeline({
  toolCalls,
  status,
  className,
}: {
  toolCalls: AiToolCall[];
  status: AiRunStatus;
  className?: string;
}) {
  const t = useTranslations("AiCopilot");
  const isRunning = status === "queued" || status === "processing" || status === "streaming";
  // Open while working so the user sees progress, collapsed once the answer
  // lands — by then the answer is the thing worth reading. The exception is a
  // run where a tool was blocked or failed: that timeline *is* the explanation,
  // so it stays open. A click pins it either way for this message.
  const hasProblem = toolCalls.some(
    (tool) => tool.status === "blocked" || tool.status === "failed",
  );
  const [userOverride, setUserOverride] = useState<boolean | null>(null);
  const isExpanded = userOverride ?? (isRunning || hasProblem);
  const detailsId = useId();

  if (toolCalls.length === 0) {
    return isRunning ? (
      <p className={cn("flex items-center gap-2 text-sm text-slate-500", className)}>
        <SpinnerGap className="size-4 animate-spin text-emerald-600" />
        {t(`status.${status}`)}
      </p>
    ) : null;
  }

  const succeeded = toolCalls.filter((tool) => tool.status === "succeeded").length;

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-slate-50/70", className)}>
      <button
        type="button"
        onClick={() => setUserOverride(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        className="upnext-focus flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left"
      >
        {isRunning ? (
          <SpinnerGap className="size-4 shrink-0 animate-spin text-emerald-600" />
        ) : (
          <CheckCircle weight="fill" className="size-4 shrink-0 text-emerald-600" />
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-700">
          {isRunning
            ? t(`status.${status}`)
            : t("runTimeline.summary", { count: succeeded, total: toolCalls.length })}
        </span>
        <CaretDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-slate-400 transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded ? (
        <ol id={detailsId} className="space-y-0.5 border-t border-slate-200/80 px-3 py-2">
          {toolCalls.map((tool) => (
            <li key={tool.id} className="flex items-start gap-2.5 py-1">
              <ToolStatusIcon status={tool.status} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium break-words text-slate-700">{tool.label}</p>
                {tool.detail ? (
                  <p className="mt-0.5 text-xs leading-relaxed break-words text-slate-500">
                    {tool.detail}
                  </p>
                ) : null}
              </div>
              {tool.durationMs === undefined ? null : (
                <span className="mt-0.5 shrink-0 text-[11px] text-slate-400 tabular-nums">
                  {(tool.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function ToolStatusIcon({ status }: { status: AiToolCall["status"] }) {
  const className = "mt-0.5 size-4 shrink-0";
  if (status === "running")
    return <SpinnerGap className={cn(className, "animate-spin text-emerald-600")} />;
  if (status === "failed")
    return <WarningCircle weight="fill" className={cn(className, "text-amber-500")} />;
  if (status === "blocked")
    return <Prohibit weight="fill" className={cn(className, "text-red-500")} />;
  return <CheckCircle weight="fill" className={cn(className, "text-emerald-500")} />;
}
