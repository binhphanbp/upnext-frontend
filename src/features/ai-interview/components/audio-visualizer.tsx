"use client";

import { Mic, Volume2, Activity, ShieldCheck } from "lucide-react";
import React, { useEffect, useRef } from "react";

import { AudioAnalysisService } from "../services/audioAnalysis";
import { AudioMetrics } from "../types";

interface AudioVisualizerProps {
  audioService: AudioAnalysisService | null;
  metrics: AudioMetrics;
  isRecording: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioService,
  metrics,
  isRecording,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!audioService || !isRecording) return;

    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const data = audioService.getVisualizerData();
      if (!data) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const { frequencyData } = data;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Render Frequency Spectrum Bars
      const barCount = 36;
      const barWidth = (width / barCount) * 0.7;
      const barSpacing = (width / barCount) * 0.3;
      const step = Math.floor(frequencyData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = frequencyData[i * step] || 0;
        const percent = val / 255;
        const barHeight = Math.max(3, percent * (height * 0.9));

        const x = i * (barWidth + barSpacing) + barSpacing / 2;
        const y = (height - barHeight) / 2;

        // Gradient coloring
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (percent > 0.7) {
          gradient.addColorStop(0, "#EF4444");
          gradient.addColorStop(1, "#EC4899");
        } else if (percent > 0.35) {
          gradient.addColorStop(0, "#8B5CF6");
          gradient.addColorStop(1, "#6366F1");
        } else {
          gradient.addColorStop(0, "#38BDF8");
          gradient.addColorStop(1, "#3B82F6");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = barWidth / 2;
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioService, isRecording]);

  const getVolumeBadge = () => {
    switch (metrics.volumeLevel) {
      case "optimal":
        return (
          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            Âm lượng tốt
          </span>
        );
      case "too_quiet":
        return (
          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
            Hơi nhỏ
          </span>
        );
      case "too_loud":
        return (
          <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
            Quá to
          </span>
        );
      default:
        return (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
            Yên lặng
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400">
            <Mic className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">Âm Thanh & Giọng Nói Realtime</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {metrics.isNoiseFiltered && (
            <span
              title="Bộ lọc DSP đang triệt tiêu tiếng ồn & nhạc nền"
              className="hidden items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 sm:inline-flex"
            >
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Noise Filter ON
            </span>
          )}
          {getVolumeBadge()}
        </div>
      </div>

      {/* Frequency Visualizer Canvas */}
      <div className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/80">
        {isRecording ? (
          <canvas ref={canvasRef} width={420} height={56} className="h-full w-full" />
        ) : (
          <div className="text-xs font-medium text-slate-500">Chưa kích hoạt Micro</div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-slate-800/60 pt-2 text-center">
        <div className="rounded-lg border border-slate-800/40 bg-slate-950/40 p-1.5">
          <div className="text-[10px] font-medium text-slate-400">Cường độ (RMS)</div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-slate-100">
            <Volume2 className="h-3 w-3 text-indigo-400" />
            {metrics.volume}%
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/40 bg-slate-950/40 p-1.5">
          <div className="text-[10px] font-medium text-slate-400">Độ ổn định giọng</div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-emerald-400">
            <Activity className="h-3 w-3 text-emerald-400" />
            {metrics.pitchStability}%
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/40 bg-slate-950/40 p-1.5">
          <div className="text-[10px] font-medium text-slate-400">Thời lượng nói</div>
          <div className="mt-0.5 text-xs font-bold text-indigo-300">
            {metrics.totalSpeakingSeconds}s
          </div>
        </div>
      </div>
    </div>
  );
};
