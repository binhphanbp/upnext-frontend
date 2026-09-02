"use client";
import { Camera, Eye, Smile, ShieldAlert, Sparkles, Layers, Sliders } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";

import {
  detectFaceMetrics,
  drawFaceDetectionHUD,
  areModelsLoaded,
} from "../services/faceDetection";
import { FaceMetrics, EmotionType } from "../types";

interface CandidateVideoProps {
  stream: MediaStream | null;
  onMetricsUpdate?: (metrics: FaceMetrics) => void;
  isActive?: boolean;
}

export const CandidateVideo: React.FC<CandidateVideoProps> = ({
  stream,
  onMetricsUpdate,
  isActive = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentMetrics, setCurrentMetrics] = useState<FaceMetrics | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showBox, setShowBox] = useState(true);
  const [showEmotionBadge, setShowEmotionBadge] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Bind media stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // High-performance Detection & Render Loop
  useEffect(() => {
    if (!stream || !isActive) return;

    let isUnmounted = false;
    let isDetecting = false;
    let animFrameId: number;
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL_MS = 60; // Throttled inference (~16 FPS) prevents CPU lag

    let latestResult: any = null;

    const runDetection = async () => {
      const video = videoRef.current;
      if (
        !video ||
        video.readyState < 2 ||
        video.paused ||
        video.ended ||
        !areModelsLoaded() ||
        isDetecting
      ) {
        return;
      }

      const now = performance.now();
      if (now - lastDetectionTime < DETECTION_INTERVAL_MS) {
        return;
      }

      isDetecting = true;
      lastDetectionTime = now;

      try {
        const result = await detectFaceMetrics(video);
        if (!isUnmounted) {
          latestResult = result;
          setCurrentMetrics(result.metrics);
          onMetricsUpdate?.(result.metrics);
        }
      } catch (err) {
        console.error("[CandidateVideo] Detection error:", err);
      } finally {
        isDetecting = false;
      }
    };

    const renderHUD = () => {
      if (isUnmounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && latestResult && video.videoWidth > 0) {
        drawFaceDetectionHUD(canvas, video.videoWidth, video.videoHeight, latestResult, {
          showLandmarks,
          showBox,
          showEmotionBadge,
          showGazeGuide: true,
          isMirrored: true,
        });
      }

      runDetection();
      animFrameId = requestAnimationFrame(renderHUD);
    };

    animFrameId = requestAnimationFrame(renderHUD);

    return () => {
      isUnmounted = true;
      cancelAnimationFrame(animFrameId);
    };
  }, [stream, isActive, showLandmarks, showBox, showEmotionBadge, onMetricsUpdate]);

  const emotionColorMap: Record<EmotionType, string> = {
    happy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    neutral: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
    sad: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    angry: "bg-rose-500/20 text-rose-400 border-rose-500/40",
    fearful: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    disgusted: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    surprised: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  };

  return (
    <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-2xl">
      {/* Video Viewport */}
      <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-950">
        {stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full -scale-x-100 transform object-cover"
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500">
            <Camera className="mb-2 h-12 w-12 stroke-1 text-slate-600" />
            <p className="text-sm font-medium">Chưa bật Webcam</p>
          </div>
        )}

        {/* Live Recording Pulsing Dot & Face Lock Tag */}
        <div className="absolute top-3 left-3 z-20 flex items-center space-x-2">
          <div className="flex items-center space-x-2 rounded-full border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
            <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
            <span className="text-slate-200">LIVE FEED</span>
          </div>

          <div className="hidden items-center space-x-1 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-1 text-[11px] font-bold text-emerald-300 shadow-md backdrop-blur-md sm:flex">
            <span>🔒 ĐÃ KHÓA ỨNG VIÊN</span>
          </div>
        </div>

        {/* Controls Overlay Button */}
        <button
          onClick={() => setShowControls(!showControls)}
          title="Tùy chỉnh lớp phủ AI HUD"
          className="absolute top-3 right-3 z-20 rounded-lg border border-slate-800 bg-slate-950/70 p-1.5 text-slate-300 backdrop-blur-md transition hover:bg-slate-800"
        >
          <Sliders className="h-4 w-4" />
        </button>

        {/* HUD Layer Toggle Menu */}
        {showControls && (
          <div className="absolute top-12 right-3 z-30 flex flex-col space-y-2 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md">
            <div className="mb-1 flex items-center gap-1 font-bold text-slate-200">
              <Layers className="h-3.5 w-3.5 text-indigo-400" /> Lớp phủ AI Vision
            </div>
            <label className="flex cursor-pointer items-center space-x-2 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showBox}
                onChange={(e) => setShowBox(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>Khung khuôn mặt & Khóa đối tượng</span>
            </label>
            <label className="flex cursor-pointer items-center space-x-2 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showLandmarks}
                onChange={(e) => setShowLandmarks(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>68 Điểm mốc & Khẩu hình miệng</span>
            </label>
            <label className="flex cursor-pointer items-center space-x-2 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showEmotionBadge}
                onChange={(e) => setShowEmotionBadge(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>Hộp chỉ số cảm xúc & Trạng thái nói</span>
            </label>
          </div>
        )}

        {/* Real-time Status Overlay Bar at Bottom of Video */}
        {currentMetrics && (
          <div className="absolute inset-x-2 bottom-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/85 px-3 py-1.5 text-xs backdrop-blur-md">
            {/* Dominant Emotion & Mouth Tracker */}
            <div className="flex items-center space-x-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ${
                  emotionColorMap[currentMetrics.dominantEmotion]
                }`}
              >
                {currentMetrics.dominantEmotion} (
                {currentMetrics.emotions[currentMetrics.dominantEmotion]}%)
              </span>

              {/* Real-time Mouth Talking Status */}
              <span
                className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold transition-all duration-200 ${
                  currentMetrics.isMouthTalking
                    ? "animate-pulse border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-700 bg-slate-800/90 text-slate-400"
                }`}
              >
                {currentMetrics.isMouthTalking
                  ? `👄 Đang nói (${currentMetrics.mouthOpenness}%)`
                  : "🤐 Im lặng (Khoảng nghỉ 1s)"}
              </span>
            </div>

            {/* Metrics Chips */}
            <div className="flex items-center space-x-3">
              {/* Eye Contact */}
              <div className="flex items-center space-x-1" title="Điểm giao tiếp mắt với Camera">
                <Eye
                  className={`h-3.5 w-3.5 ${
                    currentMetrics.isLookingAtCamera ? "text-emerald-400" : "text-amber-400"
                  }`}
                />
                <span className="font-semibold text-slate-200">
                  {currentMetrics.eyeContactScore}%
                </span>
              </div>

              {/* Confidence */}
              <div className="flex items-center space-x-1" title="Chỉ số tự tin & thần thái">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold text-slate-200">
                  {currentMetrics.confidenceScore}%
                </span>
              </div>

              {/* Smile */}
              <div className="flex items-center space-x-1" title="Mức độ tươi cười">
                <Smile className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold text-slate-200">{currentMetrics.smileScore}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
