"use client";

import { CheckCircle, Microphone, MicrophoneSlash, PhoneX } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";

import type { InterviewPhase } from "../../types";

/**
 * The control bar.
 *
 * One primary action at a time. During an answer that is "I'm done" — the single
 * thing a candidate needs to reach without looking. Mute and leave sit on either
 * side as secondary, icon-led controls, matching the muscle memory people
 * already have from video calls.
 *
 * "I'm done" stays mounted but disabled outside the listening phase rather than
 * disappearing, so the button never moves under a finger mid-session.
 */
export function SessionControls({
  phase,
  isMuted,
  canMute,
  onFinishAnswer,
  onToggleMute,
  onEnd,
  className,
}: {
  phase: InterviewPhase;
  isMuted: boolean;
  /** False in scripted mode — there is no real track to mute. */
  canMute: boolean;
  onFinishAnswer: () => void;
  onToggleMute: () => void;
  onEnd: () => void;
  className?: string;
}) {
  const t = useTranslations("AiInterview");
  const isListening = phase === "listening";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 border-t border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggleMute}
        disabled={!canMute}
        aria-pressed={isMuted}
        aria-label={isMuted ? t("controls.unmute") : t("controls.mute")}
        title={canMute ? undefined : t("controls.muteUnavailable")}
        className={cn(
          "upnext-focus grid size-11 shrink-0 place-items-center rounded-full border transition-colors",
          isMuted
            ? "border-red-500/50 bg-red-500/15 text-red-400 hover:bg-red-500/25"
            : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700",
          !canMute && "cursor-not-allowed opacity-40 hover:bg-slate-800",
        )}
      >
        {isMuted ? (
          <MicrophoneSlash weight="fill" aria-hidden className="size-5" />
        ) : (
          <Microphone weight="fill" aria-hidden className="size-5" />
        )}
      </button>

      <button
        type="button"
        onClick={onFinishAnswer}
        disabled={!isListening}
        className={cn(
          "upnext-focus inline-flex h-11 min-w-48 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition-colors",
          isListening
            ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            : "cursor-not-allowed bg-slate-800 text-slate-600",
        )}
      >
        <CheckCircle weight="fill" aria-hidden className="size-4.5" />
        {isListening ? t("controls.finishAnswer") : t("controls.waiting")}
      </button>

      <button
        type="button"
        onClick={onEnd}
        aria-label={t("controls.end")}
        className="upnext-focus grid size-11 shrink-0 place-items-center rounded-full border border-red-500/40 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
      >
        <PhoneX weight="fill" aria-hidden className="size-5" />
      </button>
    </div>
  );
}
