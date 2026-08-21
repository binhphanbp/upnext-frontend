"use client";

import { MicrophoneSlash, VideoCameraSlash } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Self-view.
 *
 * Mirrored, because an un-mirrored self-view is disorienting — every video call
 * app does this and people notice its absence without being able to name it.
 * The ring around the frame tracks microphone input, which doubles as the "you
 * are being heard" indicator so the candidate never has to trust a static icon.
 *
 * Nothing in this component analyses the image. The video element exists so the
 * candidate can see their own framing; no frame is read, scored or transmitted.
 */
export function CandidateVideo({
  stream,
  micLevel,
  isMuted,
  isCameraEnabled,
  className,
}: {
  stream: MediaStream | null;
  micLevel: number;
  isMuted: boolean;
  isCameraEnabled: boolean;
  className?: string;
}) {
  const t = useTranslations("AiInterview");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      void video.play().catch(() => {
        /* autoplay policy — the placeholder below covers it */
      });
    }
  }, [stream]);

  const hasVideoTrack = Boolean(stream?.getVideoTracks().length) && isCameraEnabled;
  const ringScale = isMuted ? 0 : micLevel;

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl border bg-slate-800 transition-colors",
        ringScale > 0.12 ? "border-emerald-500/70" : "border-slate-700",
        className,
      )}
    >
      {/* Level ring: a border glow rather than a meter, so it reads peripherally. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-100"
        style={{
          boxShadow: `inset 0 0 0 2px rgba(16,185,129,${Math.min(0.85, ringScale * 1.1)})`,
          opacity: isMuted ? 0 : 1,
        }}
      />

      {hasVideoTrack ? (
        <video
          ref={videoRef}
          muted
          playsInline
          className="size-full scale-x-[-1] object-cover"
          aria-label={t("video.selfView")}
        />
      ) : (
        <div className="grid size-full place-items-center gap-1.5 text-center">
          <VideoCameraSlash aria-hidden className="size-7 text-slate-600" />
          <p className="px-3 text-[11px] leading-snug text-slate-500">{t("video.cameraOff")}</p>
        </div>
      )}

      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-slate-950/70 px-1.5 py-0.5 backdrop-blur-sm">
        {isMuted ? (
          <MicrophoneSlash weight="fill" aria-hidden className="size-3 text-red-400" />
        ) : null}
        <span className="text-[10px] font-semibold text-slate-200">{t("video.you")}</span>
      </div>
    </div>
  );
}
