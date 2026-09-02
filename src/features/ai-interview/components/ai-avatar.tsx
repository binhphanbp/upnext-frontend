"use client";
import { Volume2, VolumeX, Sparkles, Bot, RefreshCw } from "lucide-react";
import React from "react";

import { EmotionType } from "../types";
import { ThreeAvatar3D } from "./three-avatar-3d";

interface AIAvatarProps {
  isSpeaking: boolean;
  isEvaluating?: boolean;
  isLoadingVoice?: boolean;
  questionText: string;
  badge?: React.ReactNode;
  onReplayTTS?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  currentEmotion?: EmotionType;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
  isSpeaking,
  isEvaluating = false,
  isLoadingVoice = false,
  questionText,
  badge,
  onReplayTTS,
  isMuted = false,
  onToggleMute,
}) => {
  return (
    <div
      className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 bg-cover bg-center bg-no-repeat p-5 shadow-2xl backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(2, 6, 23, 0.90)), url('/anh-nen.png')",
      }}
    >
      {/* Background ambient glow */}
      <div
        className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${
          isSpeaking
            ? "animate-pulse-slow from-emerald-500/20 via-teal-500/25 to-indigo-500/20"
            : isEvaluating || isLoadingVoice
              ? "animate-pulse from-purple-500/20 via-indigo-500/25 to-cyan-500/20"
              : "from-slate-700/10 via-emerald-950/10 to-slate-800/10"
        } opacity-70 blur-xl transition-all duration-700`}
      />

      {/* Header Bar */}
      <div className="relative z-10 mb-3 flex w-full items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-600/20 text-emerald-400">
            <Bot className="h-5 w-5" />
            <span
              className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ${
                isSpeaking
                  ? "animate-ping bg-emerald-400"
                  : isEvaluating || isLoadingVoice
                    ? "animate-pulse bg-amber-400"
                    : "bg-emerald-500"
              }`}
            />
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-100">
              UpNext AI Recruiter <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </h3>
            <span className="text-[11px] font-medium text-slate-400">
              {isSpeaking
                ? "Đang đọc câu hỏi..."
                : isEvaluating
                  ? "Đang phân tích câu trả lời..."
                  : isLoadingVoice
                    ? "Đang chuẩn bị câu hỏi & giọng đọc..."
                    : "Đang lắng nghe câu trả lời..."}
            </span>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center space-x-2">
          {onReplayTTS && (
            <button
              onClick={onReplayTTS}
              disabled={isSpeaking || isEvaluating || isLoadingVoice}
              title="Đọc lại câu hỏi"
              className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/80 p-2 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nghe lại</span>
            </button>
          )}

          {onToggleMute && (
            <button
              onClick={onToggleMute}
              title={isMuted ? "Bật âm thanh AI" : "Tắt âm thanh AI"}
              className={`rounded-lg border p-2 transition ${
                isMuted
                  ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border-slate-700/60 bg-slate-800/80 text-slate-300 hover:text-white"
              }`}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* UpNext 3D WebGL Animated Mascot with Real-Time Lip-Sync */}
      <div className="relative my-2 flex items-center justify-center">
        <ThreeAvatar3D
          isSpeaking={isSpeaking}
          isEvaluating={isEvaluating}
          isLoadingVoice={isLoadingVoice}
        />
      </div>

      {/* Question Prompt Display Box */}
      <div className="relative z-10 mt-2 flex min-h-[90px] w-full flex-col justify-center rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-center">
        <div className="mb-1.5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
            Câu hỏi hiện tại
          </span>
          {badge}
        </div>
        {isLoadingVoice || !questionText ? (
          <div className="flex animate-pulse items-center justify-center gap-2 py-2 text-xs font-semibold text-indigo-300 sm:text-sm">
            <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
            <span>AI đang khởi tạo câu hỏi & chuẩn bị giọng đọc...</span>
          </div>
        ) : (
          <p className="animate-fadeIn text-sm leading-relaxed font-semibold text-slate-100 sm:text-base">
            &quot;{questionText}&quot;
          </p>
        )}
      </div>
    </div>
  );
};
