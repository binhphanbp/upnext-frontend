"use client";
import { Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";

import { lipSyncAnalyzer, LipSyncFrame, VisemeShape } from "../services/lipSyncAnalyzer";

interface UpNextAvatarProps {
  isSpeaking: boolean;
  isEvaluating?: boolean;
  isLoadingVoice?: boolean;
}

export const UpNextAvatar: React.FC<UpNextAvatarProps> = ({
  isSpeaking,
  isEvaluating = false,
  isLoadingVoice = false,
}) => {
  const [lipFrame, setLipFrame] = useState<LipSyncFrame>({
    mouthOpenness: 0,
    viseme: "closed",
    volume: 0,
    pitchBand: "mid",
  });

  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  // Subscribe to real-time Web Audio API Lip-Sync Analyser
  useEffect(() => {
    const unsubscribe = lipSyncAnalyzer.subscribe((frame) => {
      setLipFrame(frame);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Natural Eye Blinking Timer (every 3.2 - 4.8 seconds)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextBlink = () => {
      const delay = 3200 + Math.random() * 1600;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 120);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  const openness = isSpeaking ? lipFrame.mouthOpenness : 0;
  const viseme: VisemeShape = isSpeaking ? lipFrame.viseme : "smile";

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Dynamic Ambient Glow Behind Avatar */}
      <div
        className={`absolute -inset-4 rounded-3xl opacity-70 blur-2xl transition-all duration-500 ${
          isSpeaking
            ? "animate-pulse bg-gradient-to-tr from-emerald-500/40 via-teal-500/30 to-indigo-500/30"
            : isEvaluating || isLoadingVoice
              ? "animate-pulse-slow bg-gradient-to-tr from-purple-500/40 via-indigo-500/30 to-cyan-500/30"
              : "bg-gradient-to-tr from-slate-700/20 via-emerald-950/20 to-slate-900/20"
        }`}
      />

      {/* Main 3D Mascot Stage Card */}
      <div
        className={`relative h-52 w-48 overflow-hidden rounded-2xl border-2 shadow-2xl transition-all duration-300 sm:h-60 sm:w-56 ${
          isSpeaking
            ? "scale-[1.02] border-emerald-400/80 shadow-emerald-500/30"
            : isEvaluating || isLoadingVoice
              ? "scale-[0.98] rotate-[-1deg] border-purple-400/80 shadow-purple-500/30"
              : "border-slate-800 shadow-slate-950/80"
        }`}
      >
        {/* Authentic 3D UpNext Mascot Image */}
        <img
          src="/upnext_avatar.png"
          alt="UpNext AI Interviewer"
          className={`h-full w-full object-cover transition-transform duration-300 ${
            isSpeaking ? "animate-speech-bob" : ""
          }`}
        />

        {/* Dynamic Natural Eye Blinking Overlays */}
        {isBlinking && (
          <>
            {/* Left Eyelid */}
            <div
              className="pointer-events-none absolute rounded-full bg-[#302624]"
              style={{
                left: "42%",
                top: "41.5%",
                width: "10.5%",
                height: "3%",
                transform: "rotate(-3deg)",
              }}
            />
            {/* Right Eyelid */}
            <div
              className="pointer-events-none absolute rounded-full bg-[#302624]"
              style={{
                left: "67%",
                top: "41.5%",
                width: "10.5%",
                height: "3%",
                transform: "rotate(3deg)",
              }}
            />
          </>
        )}

        {/* Dynamic Real-Time Lip-Sync Mouth Overlay */}
        {isSpeaking && (
          <div
            className="pointer-events-none absolute flex items-center justify-center transition-all duration-75"
            style={{
              left: "49%",
              top: "51%",
              width: "18%",
              height: "9%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <svg viewBox="0 0 100 60" className="h-full w-full overflow-visible">
              <defs>
                {/* Skin tone to blend with character face */}
                <radialGradient id="patchSkinGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F5D0BB" />
                  <stop offset="100%" stopColor="#ECC2AA" />
                </radialGradient>
                {/* Mouth Cavity */}
                <linearGradient id="patchMouthCavity" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#55121B" />
                  <stop offset="100%" stopColor="#2A0509" />
                </linearGradient>
                {/* Tongue */}
                <linearGradient id="patchTongue" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF7A8A" />
                  <stop offset="100%" stopColor="#D84355" />
                </linearGradient>
              </defs>

              {openness <= 10 ? (
                // Closed smiling lips
                <path
                  d="M 10 30 Q 50 42 90 30"
                  stroke="#9E3B30"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : viseme === "o_shape" ? (
                // O-Shape (Chu môi)
                <g>
                  <ellipse
                    cx="50"
                    cy="30"
                    rx={18 + (openness / 100) * 10}
                    ry={14 + (openness / 100) * 16}
                    fill="url(#patchMouthCavity)"
                    stroke="#8B2E24"
                    strokeWidth="4"
                  />
                  <ellipse
                    cx="50"
                    cy={36 + (openness / 100) * 5}
                    rx={14}
                    ry={8}
                    fill="url(#patchTongue)"
                  />
                </g>
              ) : viseme === "wide" || openness > 50 ? (
                // Wide Open (Nói to / âm A, E, O)
                <g>
                  <path
                    d={`M 10 24 Q 50 18 90 24 Q 84 ${42 + (openness / 100) * 18} 50 ${46 + (openness / 100) * 20} Q 16 ${42 + (openness / 100) * 18} 10 24 Z`}
                    fill="url(#patchMouthCavity)"
                    stroke="#82261C"
                    strokeWidth="4"
                  />
                  {/* Upper Teeth */}
                  <path d="M 22 23 Q 50 20 78 23 L 74 30 Q 50 28 26 30 Z" fill="#FFFFFF" />
                  {/* Lower Tongue */}
                  <path
                    d={`M 22 ${36 + (openness / 100) * 10} Q 50 ${30 + (openness / 100) * 8} 78 ${36 + (openness / 100) * 10} Q 50 ${54 + (openness / 100) * 14} 22 ${36 + (openness / 100) * 10} Z`}
                    fill="url(#patchTongue)"
                  />
                </g>
              ) : (
                // Medium Speaking
                <g>
                  <path
                    d={`M 14 26 Q 50 22 86 26 Q 80 ${36 + (openness / 100) * 14} 50 ${40 + (openness / 100) * 16} Q 20 ${36 + (openness / 100) * 14} 14 26 Z`}
                    fill="url(#patchMouthCavity)"
                    stroke="#8E2D23"
                    strokeWidth="3.5"
                  />
                  {/* Upper Teeth */}
                  <path d="M 24 25 Q 50 23 76 25 L 72 30 Q 50 29 28 30 Z" fill="#FFFFFF" />
                  {/* Tongue */}
                  <ellipse
                    cx="50"
                    cy={34 + (openness / 100) * 6}
                    rx={18}
                    ry={8}
                    fill="url(#patchTongue)"
                  />
                </g>
              )}
            </svg>
          </div>
        )}

        {/* Live Audio Glow Wave when Speaking */}
        {isSpeaking && (
          <div
            className="pointer-events-none absolute inset-0 animate-ping rounded-2xl border-2 border-emerald-400/60 opacity-30"
            style={{ animationDuration: "1.4s" }}
          />
        )}
      </div>

      {/* Character Info Pill with Real-time Equalizer */}
      <div className="relative z-10 mt-2 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/90 px-3.5 py-1.5 text-xs shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-[11px] tracking-wider text-transparent uppercase">
            UpNext Interviewer
          </span>
        </div>

        {/* Live Audio Equalizer Bars when speaking */}
        {isSpeaking ? (
          <div className="ml-1 flex h-3 items-center gap-0.5">
            <span
              className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
              style={{ height: `${Math.max(4, (lipFrame.volume / 100) * 14)}px` }}
            />
            <span
              className="w-1 rounded-full bg-teal-400 transition-all duration-75"
              style={{ height: `${Math.max(4, ((lipFrame.volume * 1.2) / 100) * 14)}px` }}
            />
            <span
              className="w-1 rounded-full bg-emerald-300 transition-all duration-75"
              style={{ height: `${Math.max(4, (openness / 100) * 14)}px` }}
            />
            <span
              className="w-1 rounded-full bg-emerald-500 transition-all duration-75"
              style={{ height: `${Math.max(4, ((lipFrame.volume * 0.8) / 100) * 14)}px` }}
            />
          </div>
        ) : isEvaluating || isLoadingVoice ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-300">
            <Sparkles className="h-3 w-3 animate-spin text-amber-400" /> Đang chuẩn bị...
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400">Đang lắng nghe</span>
        )}
      </div>
    </div>
  );
};
