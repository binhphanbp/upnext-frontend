"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Shared vocabulary for every AI result card.
 *
 * The two meters below are deliberately drawn in different visual languages:
 * §11.4 separates *fit* (`ScoreRing`, solid, coloured) from *confidence in the
 * data* (`ConfidenceMeter`, hatched, neutral). Users read a single percentage as
 * a verdict; keeping them visually distinct is what stops "85% match, 58%
 * confidence" from collapsing into one number in the reader's head.
 */

export function AiCardShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function AiCardSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("border-t border-slate-100 px-4 py-3", className)}>{children}</div>;
}

export function AiCardLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
      {children}
    </p>
  );
}

/** Emerald above 80, sky in the middle band, slate below — never red: a low */
/** match is not an error, it is information. */
function scoreTone(score: number) {
  if (score >= 80) return { stroke: "#10a778", text: "text-emerald-700", track: "bg-emerald-500" };
  if (score >= 65) return { stroke: "#3b82f6", text: "text-blue-700", track: "bg-blue-500" };
  return { stroke: "#94a3b8", text: "text-slate-600", track: "bg-slate-400" };
}

export function ScoreRing({
  score,
  size = 56,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const tone = scoreTone(score);
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={5}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tone.stroke}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 grid place-items-center text-sm font-bold tabular-nums",
            tone.text,
          )}
        >
          {score}
        </span>
      </div>
      {label ? <span className="text-[10px] font-semibold text-slate-400">{label}</span> : null}
    </div>
  );
}

export function ScoreBar({
  score,
  unknown = false,
  className,
}: {
  score: number;
  unknown?: boolean;
  className?: string;
}) {
  const tone = scoreTone(score);
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      {unknown ? (
        <div
          className="h-full w-full opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #cbd5e1 0 4px, transparent 4px 8px)",
          }}
        />
      ) : (
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
            tone.track,
          )}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      )}
    </div>
  );
}

/**
 * Hatched, monochrome, and never coloured by band — confidence answers "how
 * much of the data did we actually have?", not "how good is this match?".
 */
export function ConfidenceMeter({
  value,
  label,
  reason,
}: {
  value: number;
  label: string;
  reason?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
          {label}
        </span>
        <span className="text-[13px] font-bold text-slate-600 tabular-nums">{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{
            width: `${Math.min(Math.max(value, 0), 100)}%`,
            backgroundImage: "repeating-linear-gradient(135deg, #64748b 0 3px, #94a3b8 3px 6px)",
          }}
        />
      </div>
      {reason ? <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{reason}</p> : null}
    </div>
  );
}

export function SkillChip({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "matched" | "missing" | "verify";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset",
        tone === "matched" && "bg-emerald-50 text-emerald-800 ring-emerald-100",
        tone === "missing" && "bg-slate-50 text-slate-600 ring-slate-200",
        tone === "verify" && "bg-amber-50 text-amber-800 ring-amber-100",
      )}
    >
      {children}
    </span>
  );
}
