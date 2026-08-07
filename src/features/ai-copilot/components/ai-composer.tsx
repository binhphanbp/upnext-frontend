"use client";

import { ArrowUp, Stop } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import { cn } from "@/shared/lib/cn";

const MAX_LENGTH = 2_000;
const MAX_HEIGHT_PX = 168;

export type AiComposerHandle = { focus: () => void };

export function AiComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isBusy,
  isDisabled = false,
  placeholder,
  handleRef,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isBusy: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  handleRef?: Ref<AiComposerHandle>;
  className?: string;
}) {
  const t = useTranslations("AiCopilot");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(handleRef, () => ({ focus: () => textareaRef.current?.focus() }), []);

  // Grow with the content up to a ceiling, then scroll internally — a composer
  // that eats the transcript is worse than one that scrolls.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  const canSubmit = value.trim().length > 0 && !isBusy && !isDisabled;

  return (
    <div className={cn("px-4 pb-3 sm:px-6", className)}>
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border bg-white p-2 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.12)] transition-colors",
            isDisabled
              ? "border-slate-200 bg-slate-50"
              : "border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10",
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            maxLength={MAX_LENGTH}
            disabled={isDisabled}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            placeholder={placeholder ?? t("composer.placeholder")}
            aria-label={t("composer.label")}
            className="max-h-42 min-h-9 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />

          {isBusy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label={t("composer.stop")}
              className="upnext-focus grid size-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800"
            >
              <Stop weight="fill" className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              aria-label={t("composer.send")}
              className={cn(
                "upnext-focus grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                canSubmit
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed bg-slate-100 text-slate-300",
              )}
            >
              <ArrowUp weight="bold" className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
          <p className="text-[11px] leading-tight text-slate-400">{t("composer.disclaimer")}</p>
          {value.length > MAX_LENGTH * 0.75 ? (
            <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
              {value.length}/{MAX_LENGTH}
            </span>
          ) : (
            <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-400 sm:inline-block">
              {t("composer.hint")}
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
}
