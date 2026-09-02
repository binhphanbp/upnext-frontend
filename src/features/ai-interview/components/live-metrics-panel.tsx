"use client";
import {
  Activity,
  ShieldCheck,
  Eye,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import React from "react";

import { FaceMetrics, AudioMetrics, EmotionType } from "../types";

interface LiveMetricsPanelProps {
  faceMetrics: FaceMetrics;
  audioMetrics: AudioMetrics;
}

export const LiveMetricsPanel: React.FC<LiveMetricsPanelProps> = ({
  faceMetrics,
  audioMetrics,
}) => {
  // Compute composite Stress / Nervousness index (0-100)
  const stressIndex = Math.min(
    100,
    Math.round(
      faceMetrics.emotions.fearful * 1.5 +
        faceMetrics.emotions.angry * 1.2 +
        faceMetrics.emotions.sad * 0.8 +
        (100 - audioMetrics.pitchStability) * 0.3,
    ),
  );

  // Dynamic Realtime Coaching Tip
  let coachingTip = {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    text: "Thần thái và âm điệu đang rất ổn định! Hãy tiếp tục duy trì.",
    color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };

  if (!faceMetrics.detected) {
    coachingTip = {
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
      text: "Chưa phát hiện khuôn mặt. Hãy ngồi chính diện với khung hình.",
      color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  } else if (!faceMetrics.isLookingAtCamera) {
    coachingTip = {
      icon: <Eye className="h-4 w-4 text-indigo-400" />,
      text: "Mẹo: Nhìn thẳng vào mắt camera để thể hiện sự tự tin và gắn kết.",
      color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    };
  } else if (stressIndex > 45) {
    coachingTip = {
      icon: <Zap className="h-4 w-4 text-amber-400" />,
      text: "Hít sâu 1 nhịp, thả lỏng cơ mặt và mỉm cười nhẹ để giảm căng thẳng.",
      color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  } else if (audioMetrics.volumeLevel === "too_quiet") {
    coachingTip = {
      icon: <TrendingUp className="h-4 w-4 text-sky-400" />,
      text: "Giọng nói hơi nhỏ. Bạn hãy nói to và dứt khoát hơn một chút.",
      color: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    };
  }

  const emotionList: { key: EmotionType; label: string; color: string }[] = [
    { key: "neutral", label: "Điềm tĩnh (Neutral)", color: "bg-indigo-500" },
    { key: "happy", label: "Tươi cười (Happy)", color: "bg-emerald-500" },
    { key: "fearful", label: "Hồi hộp (Fear)", color: "bg-amber-500" },
    { key: "sad", label: "Buồn bã (Sad)", color: "bg-blue-500" },
    { key: "angry", label: "Căng thẳng (Angry)", color: "bg-rose-500" },
    { key: "surprised", label: "Bất ngờ (Surprise)", color: "bg-yellow-500" },
  ];

  return (
    <div className="flex flex-col space-y-3.5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            Phân Tích Đa Phương Thức Realtime
          </h4>
        </div>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
          60 FPS AI
        </span>
      </div>

      {/* Realtime Live Coaching Tip */}
      <div
        className={`flex items-start space-x-2 rounded-xl border p-2.5 text-xs leading-snug ${coachingTip.color}`}
      >
        <div className="mt-0.5 shrink-0">{coachingTip.icon}</div>
        <span className="font-medium">{coachingTip.text}</span>
      </div>

      {/* Key Metric Gauges */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Confidence Gauge */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Tự tin & Thần thái
            </span>
            <span className="font-bold text-indigo-300">{faceMetrics.confidenceScore}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${faceMetrics.confidenceScore}%` }}
            />
          </div>
        </div>

        {/* Eye Contact Gauge */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-emerald-400" /> Giao tiếp mắt
            </span>
            <span className="font-bold text-emerald-300">{faceMetrics.eyeContactScore}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                faceMetrics.isLookingAtCamera
                  ? "bg-gradient-to-r from-teal-500 to-emerald-400"
                  : "bg-amber-500"
              }`}
              style={{ width: `${faceMetrics.eyeContactScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6 Facial Emotion Bars */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-300 uppercase">
          <span>Phổ Biểu Cảm Khuôn Mặt</span>
          <span className="text-[10px] font-normal text-slate-400">7 sắc thái</span>
        </div>

        <div className="space-y-1.5">
          {emotionList.map((emo) => {
            const val = faceMetrics.emotions[emo.key] || 0;
            return (
              <div key={emo.key} className="flex items-center text-xs">
                <span className="w-36 truncate text-[11px] text-slate-400">{emo.label}</span>
                <div className="mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full ${emo.color} rounded-full transition-all duration-300`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] font-semibold text-slate-300">
                  {val}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
