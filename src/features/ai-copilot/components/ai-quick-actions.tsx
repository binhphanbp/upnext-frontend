"use client";

import {
  ClipboardText,
  MicrophoneStage,
  PuzzlePiece,
  Scales,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

import { cn } from "@/shared/lib/cn";

import type { AiQuickAction } from "../types";

const ICONS: Record<AiQuickAction["icon"], ComponentType<{ className?: string }>> = {
  sparkle: Sparkle,
  target: Target,
  scales: Scales,
  gap: PuzzlePiece,
  interview: MicrophoneStage,
  status: ClipboardText,
};

export function AiQuickActions({
  actions,
  onSelect,
  isDisabled,
  variant = "chips",
}: {
  actions: AiQuickAction[];
  onSelect: (prompt: string) => void;
  isDisabled: boolean;
  variant?: "chips" | "grid";
}) {
  const t = useTranslations("AiCopilot");

  if (variant === "grid") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = ICONS[action.icon];
          return (
            <button
              key={action.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(action.prompt)}
              className="upnext-focus group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-emerald-100 group-hover:text-emerald-700">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 text-[13.5px] font-semibold text-slate-800">
                {t(action.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) => {
        const Icon = ICONS[action.icon];
        return (
          <button
            key={action.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(action.prompt)}
            className={cn(
              "upnext-focus inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition-colors",
              "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Icon className="size-3.5 text-slate-400" />
            {t(action.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
