"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Visual vocabulary shared by the live stage (dark) and the report (light).
 *
 * Every primitive takes a `tone` rather than reading a theme, because the two
 * surfaces sit on opposite backgrounds and a single component rendering both is
 * cheaper to keep consistent than two near-copies drifting apart.
 */

export type Surface = "dark" | "light";

/** Bands are shared with `lib/rubric.ts`. Never red: a low score is information. */
export function bandColors(score: number) {
  if (score >= 80) return { stroke: "#10b981", text: "text-emerald-500", bar: "bg-emerald-500" };
  if (score >= 60) return { stroke: "#38bdf8", text: "text-sky-500", bar: "bg-sky-500" };
  return { stroke: "#f59e0b", text: "text-amber-500", bar: "bg-amber-500" };
}

export function ScoreDial({
  score,
  size = 92,
  surface = "light",
  caption,
}: {
  score: number;
  size?: number;
  surface?: Surface;
  caption?: string;
}) {
  const colors = bandColors(score);
  const stroke = size >= 80 ? 7 : 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={surface === "dark" ? "#1e293b" : "#e2e8f0"}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-[stroke-dasharray] duration-1000 ease-out motion-reduce:transition-none"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center">
          <span
            className={cn(
              "font-bold tabular-nums",
              colors.text,
              size >= 80 ? "text-2xl" : "text-base",
            )}
          >
            {score}
          </span>
        </span>
      </div>
      {caption ? (
        <span
          className={cn(
            "text-[11px] font-semibold",
            surface === "dark" ? "text-slate-400" : "text-slate-500",
          )}
        >
          {caption}
        </span>
      ) : null}
    </div>
  );
}

export function DimensionBar({
  label,
  value,
  max,
  surface = "light",
}: {
  label: string;
  value: number;
  max: number;
  surface?: Surface;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const colors = bandColors(ratio * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-[13px] font-medium",
            surface === "dark" ? "text-slate-300" : "text-slate-700",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            surface === "dark" ? "text-slate-400" : "text-slate-500",
          )}
        >
          {value}
          <span className={surface === "dark" ? "text-slate-600" : "text-slate-400"}>/{max}</span>
        </span>
      </div>
      <div
        className={cn(
          "mt-1.5 h-1.5 w-full overflow-hidden rounded-full",
          surface === "dark" ? "bg-slate-800" : "bg-slate-100",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
            colors.bar,
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  surface = "dark",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "good" | "watch";
  surface?: Surface;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2.5",
        surface === "dark" ? "bg-slate-800/60" : "border border-slate-200 bg-white",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold tracking-[0.08em] uppercase",
          surface === "dark" ? "text-slate-500" : "text-slate-400",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg leading-none font-bold tabular-nums",
          tone === "good" && "text-emerald-400",
          tone === "watch" && "text-amber-400",
          tone === "neutral" && (surface === "dark" ? "text-slate-100" : "text-slate-900"),
        )}
      >
        {value}
      </p>
      {hint ? (
        <p
          className={cn(
            "mt-1 text-[11px] leading-snug",
            surface === "dark" ? "text-slate-500" : "text-slate-500",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SectionLabel({
  children,
  surface = "light",
}: {
  children: ReactNode;
  surface?: Surface;
}) {
  return (
    <p
      className={cn(
        "mb-2.5 text-[11px] font-bold tracking-[0.08em] uppercase",
        surface === "dark" ? "text-slate-500" : "text-slate-400",
      )}
    >
      {children}
    </p>
  );
}

/**
 * Props that turn a container into a real ARIA `radiogroup`.
 *
 * Honouring the role means honouring the whole pattern, not just the attribute:
 * arrow keys move the selection and focus follows it. A `role="radio"` without
 * that is worse than a row of plain buttons, because it promises keyboard
 * behaviour that is not there. Each option button must carry
 * `role="radio"`, `data-value`, and `tabIndex={isSelected ? 0 : -1}`.
 */
export function useRadioGroupProps<T extends string | number>({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: T;
  /** Selectable values in visual order; omit disabled ones. */
  values: T[];
  onChange: (value: T) => void;
}) {
  const move = (group: HTMLElement, delta: number) => {
    const currentIndex = values.indexOf(value);
    if (currentIndex === -1) return;
    const next = values[(currentIndex + delta + values.length) % values.length];
    if (next === undefined) return;
    onChange(next);
    const radios = [...group.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    radios.find((radio) => radio.dataset.value === String(next))?.focus();
  };

  return {
    role: "radiogroup" as const,
    "aria-label": label,
    // The group itself is never a tab stop — the selected option is.
    tabIndex: -1,
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        move(event.currentTarget, 1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        move(event.currentTarget, -1);
      }
    },
  };
}

export function SegmentedControl<T extends string | number>({
  name,
  value,
  options,
  onChange,
  className,
}: {
  name: string;
  value: T;
  options: { value: T; label: string; hint?: string; disabled?: boolean }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const groupProps = useRadioGroupProps({
    label: name,
    value,
    values: options.filter((option) => !option.disabled).map((option) => option.value),
    onChange,
  });

  return (
    <div {...groupProps} className={cn("flex flex-wrap gap-2 outline-none", className)}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            data-value={String(option.value)}
            // Roving tabindex: the group is a single tab stop.
            tabIndex={isSelected ? 0 : -1}
            disabled={option.disabled ?? false}
            onClick={() => onChange(option.value)}
            className={cn(
              "upnext-focus rounded-xl border px-3.5 py-2 text-left transition-colors",
              isSelected
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              option.disabled &&
                "cursor-not-allowed opacity-50 hover:border-slate-200 hover:bg-white",
            )}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            {option.hint ? (
              <span
                className={cn(
                  "mt-0.5 block text-xs",
                  isSelected ? "text-emerald-700" : "text-slate-500",
                )}
              >
                {option.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
