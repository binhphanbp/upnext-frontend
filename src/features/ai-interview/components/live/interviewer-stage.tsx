"use client";

import { Robot } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";

import type { InterviewPhase } from "../../types";

/**
 * The AI interviewer's presence on stage.
 *
 * A voice interface has no face to read, so the state has to be legible at a
 * glance from across the room: is it talking, is it waiting for me, is it
 * thinking? Each phase gets its own motion signature rather than the same
 * spinner with different text — motion is the fastest channel here, and the
 * label underneath is the fallback for anyone with reduced motion enabled.
 */
export function InterviewerStage({
  phase,
  amplitude,
  className,
}: {
  phase: InterviewPhase;
  /** 0–1 speech envelope. Zero when silent. */
  amplitude: number;
  className?: string;
}) {
  const t = useTranslations("AiInterview");
  const isSpeaking = phase === "interviewer_speaking";
  const isListening = phase === "listening";
  const isThinking = phase === "evaluating" || phase === "connecting";

  // Bars sample the same envelope at different offsets so the waveform reads as
  // one voice rather than five independent meters.
  const bars = [0.55, 0.85, 1, 0.8, 0.5].map((weight, index) => {
    const wobble = isSpeaking ? 0.75 + 0.25 * Math.sin(index * 1.7 + amplitude * 9) : 0;
    return Math.max(0.12, amplitude * weight * wobble);
  });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative grid size-40 place-items-center sm:size-48">
        {/* Halo scales with the voice; parked at rest so the layout never jumps. */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full transition-opacity duration-500",
            isSpeaking ? "opacity-100" : "opacity-0",
          )}
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0) 68%)",
            transform: `scale(${1 + amplitude * 0.35})`,
          }}
        />
        <div
          aria-hidden
          className={cn(
            "absolute rounded-full border transition-all duration-300",
            isListening
              ? "size-full animate-[ping_2.4s_ease-out_infinite] border-sky-500/40 motion-reduce:animate-none"
              : "size-0 border-transparent",
          )}
        />

        <div
          className={cn(
            "relative grid size-28 place-items-center rounded-full border transition-colors duration-300 sm:size-32",
            isSpeaking && "border-emerald-400/60 bg-emerald-500/10",
            isListening && "border-sky-400/50 bg-sky-500/10",
            isThinking && "border-slate-600 bg-slate-800/80",
            !isSpeaking && !isListening && !isThinking && "border-slate-700 bg-slate-800/60",
          )}
        >
          {isSpeaking ? (
            <div className="flex h-12 items-center gap-1.5" aria-hidden>
              {bars.map((height, index) => (
                <span
                  key={index}
                  className="w-1.5 rounded-full bg-emerald-400 transition-[height] duration-75 ease-out motion-reduce:transition-none"
                  style={{ height: `${Math.round(height * 100)}%` }}
                />
              ))}
            </div>
          ) : isThinking ? (
            <div className="flex gap-1.5" aria-hidden>
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="size-2 animate-bounce rounded-full bg-slate-400 motion-reduce:animate-none"
                  style={{ animationDelay: `${index * 140}ms` }}
                />
              ))}
            </div>
          ) : (
            <Robot
              weight="duotone"
              aria-hidden
              className={cn("size-11", isListening ? "text-sky-300" : "text-slate-400")}
            />
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-slate-100">{t("stage.interviewer")}</p>
        <p
          className={cn(
            "mt-0.5 text-xs font-medium",
            isSpeaking && "text-emerald-400",
            isListening && "text-sky-400",
            !isSpeaking && !isListening && "text-slate-400",
          )}
          aria-live="polite"
        >
          {t(`phase.${phase}`)}
        </p>
      </div>
    </div>
  );
}
