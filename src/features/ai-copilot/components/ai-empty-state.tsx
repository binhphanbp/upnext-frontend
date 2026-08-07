"use client";

import { LockKey, Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";

import type { AiQuickAction } from "../types";
import { AiQuickActions } from "./ai-quick-actions";

/**
 * First impression of the Copilot. It states what the assistant can reach and
 * what it will never do on its own — §32 argues the product is not "a chatbot on
 * a job board", and the empty state is where that claim has to be legible before
 * the user types anything.
 */
export function AiEmptyState({
  actions,
  onSelect,
  isDisabled,
  contextLabel,
  compact = false,
}: {
  actions: AiQuickAction[];
  onSelect: (prompt: string) => void;
  isDisabled: boolean;
  contextLabel?: string;
  compact?: boolean;
}) {
  const t = useTranslations("AiCopilot");

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col justify-center px-4 sm:px-6",
        compact ? "py-8" : "min-h-full py-10",
      )}
    >
      <div className={cn("grid place-items-center", compact ? "mb-4" : "mb-5")}>
        <span
          aria-hidden
          className={cn(
            "grid place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20",
            compact ? "size-11" : "size-14",
          )}
        >
          <Sparkle weight="fill" className={compact ? "size-5" : "size-7"} />
        </span>
      </div>

      <h2
        className={cn(
          "text-center font-bold tracking-[-0.02em] text-balance text-slate-950",
          compact ? "text-lg" : "text-2xl",
        )}
      >
        {t("empty.title")}
      </h2>
      <p
        className={cn(
          "mx-auto mt-2 max-w-md text-center leading-relaxed text-pretty text-slate-600",
          compact ? "text-[13px]" : "text-sm",
        )}
      >
        {t("empty.description")}
      </p>

      {contextLabel ? (
        <p className="mt-3 text-center text-[12px] text-slate-500">
          {t("empty.contextHint", { context: contextLabel })}
        </p>
      ) : null}

      <div className={compact ? "mt-5" : "mt-7"}>
        <AiQuickActions
          actions={actions}
          onSelect={onSelect}
          isDisabled={isDisabled}
          variant={compact ? "chips" : "grid"}
        />
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
        <LockKey weight="fill" className="mt-px size-4 shrink-0 text-slate-400" />
        <div>
          <p className="text-[12.5px] font-semibold text-slate-700">{t("empty.safetyTitle")}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">
            {t("empty.safetyBody")}
          </p>
        </div>
      </div>
    </div>
  );
}
