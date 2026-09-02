"use client";

import {
  Code,
  HardDrives,
  Stack,
  Cpu,
  Cloud,
  Palette,
  Camera,
  CameraSlash,
  Microphone,
  MicrophoneSlash,
  Sparkle,
  CheckCircle,
  ShieldCheck,
  Clock,
  Play,
  Sliders,
  User,
} from "@phosphor-icons/react";
import React, { useState, useEffect, useRef } from "react";

import { ROLE_PRESETS } from "../mock-data";
import { RolePreset, SeniorityLevel, InterviewType } from "../types";

interface SetupScreenProps {
  onStartInterview: (config: {
    role: RolePreset;
    level: SeniorityLevel;
    interviewType: InterviewType;
    isCameraEnabled: boolean;
    isMicEnabled: boolean;
    candidateName: string;
  }) => void;
}

const defaultRole: RolePreset = ROLE_PRESETS[0] ?? {
  id: "frontend-developer",
  category: "frontend",
  title: "Senior Frontend Developer",
  titleVi: "Lập trình viên Frontend (React/Next.js)",
  description:
    "Deep dive into React 19, Next.js App Router, Performance Optimization, State Management & Modern CSS.",
  descriptionVi:
    "Phỏng vấn chuyên sâu React 19, Next.js App Router, Tối ưu hiệu năng Core Web Vitals, Quản lý State & Kiến trúc Frontend.",
  iconName: "Code",
  tags: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  recommendedLevel: "senior",
  totalQuestions: 5,
  durationMinutes: 20,
};

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartInterview }) => {
  const [selectedRole, setSelectedRole] = useState<RolePreset>(defaultRole);
  const [selectedLevel, setSelectedLevel] = useState<SeniorityLevel>("senior");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [candidateName, setCandidateName] = useState<string>("Nguyễn Quốc Vượng");

  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Camera & Mic stream
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number;

    const startMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);

          try {
            audioContext = new (
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            )();
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateAudio = () => {
              if (analyser) {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
              }
              animationFrameId = requestAnimationFrame(updateAudio);
            };
            updateAudio();
          } catch {
            // Audio context fallback
          }
        }
      } catch {
        setHasCameraPermission(false);
      }
    };

    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isCameraOn;
      });
    }
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
  };

  const getRoleIcon = (name: string) => {
    switch (name) {
      case "Code":
        return <Code size={18} weight="duotone" />;
      case "Server":
        return <HardDrives size={18} weight="duotone" />;
      case "Layers":
        return <Stack size={18} weight="duotone" />;
      case "BrainCircuit":
        return <Cpu size={18} weight="duotone" />;
      case "Cloud":
        return <Cloud size={18} weight="duotone" />;
      case "Palette":
        return <Palette size={18} weight="duotone" />;
      default:
        return <Code size={18} weight="duotone" />;
    }
  };

  const handleStart = () => {
    onStartInterview({
      role: selectedRole,
      level: selectedLevel,
      interviewType,
      isCameraEnabled: isCameraOn,
      isMicEnabled: isMicOn,
      candidateName,
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      {/* Top Refined Header */}
      <div className="mx-auto mb-10 max-w-2xl space-y-2.5 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium tracking-wide text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Sparkle size={14} weight="fill" className="text-emerald-500" />
          UpNext AI Interview Studio
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          Luyện Phỏng Vấn{" "}
          <span className="text-emerald-600 dark:text-emerald-400">AI Trực Tiếp</span>
        </h1>
        <p className="text-sm leading-relaxed font-normal text-slate-500 sm:text-base dark:text-slate-400">
          Mô phỏng phỏng vấn video 1-on-1 theo vị trí chuyên môn. Nhận bộ câu hỏi thực chiến và phản
          hồi phân tích đa chiều ngay sau buổi phỏng vấn.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Role & Level Configuration (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Step 1: Role Selection */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-50 text-xs font-semibold text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950 dark:text-emerald-400">
                  1
                </span>
                Vị Trí Chuyên Môn
              </h2>
              <span className="text-xs font-normal text-slate-400">
                {ROLE_PRESETS.length} chuyên ngành
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ROLE_PRESETS.map((role) => {
                const isSelected = selectedRole.id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 dark:bg-emerald-950/20"
                        : "border-slate-200/70 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div
                          className={`rounded-lg p-1.5 transition-colors ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {getRoleIcon(role.iconName)}
                        </div>
                        {isSelected && (
                          <CheckCircle
                            size={18}
                            weight="fill"
                            className="text-emerald-600 dark:text-emerald-400"
                          />
                        )}
                      </div>
                      <h3 className="mb-0.5 text-xs font-semibold text-slate-900 dark:text-white">
                        {role.titleVi}
                      </h3>
                      <p className="line-clamp-2 text-[11px] leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                        {role.descriptionVi}
                      </p>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {role.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-600 dark:bg-slate-800/80 dark:text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Seniority Level & Interview Type */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900/90">
            <div>
              <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-50 text-xs font-semibold text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950 dark:text-emerald-400">
                  2
                </span>
                Cấp Bậc & Dạng Phỏng Vấn
              </h2>

              <label className="mb-1.5 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Cấp bậc kinh nghiệm
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {(
                  [
                    { key: "intern", label: "Intern" },
                    { key: "fresher", label: "Fresher" },
                    { key: "junior", label: "Junior" },
                    { key: "mid", label: "Middle" },
                    { key: "senior", label: "Senior" },
                    { key: "lead", label: "Tech Lead" },
                  ] as const
                ).map((lvl) => (
                  <button
                    key={lvl.key}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.key)}
                    className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                      selectedLevel === lvl.key
                        ? "bg-emerald-600 font-semibold text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Loại hình phỏng vấn
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {(
                  [
                    { key: "technical", label: "Kỹ thuật Chuyên sâu" },
                    { key: "system-design", label: "System Design" },
                    { key: "behavioral", label: "Văn hóa & Xử lý" },
                    { key: "live-coding", label: "Live Coding" },
                  ] as const
                ).map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setInterviewType(type.key)}
                    className={`rounded-lg border px-2.5 py-2 text-center text-xs font-medium transition-all ${
                      interviewType === type.key
                        ? "border-emerald-500 bg-emerald-50/50 font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
                        : "border-slate-200/70 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Họ và tên ứng viên
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pr-3.5 pl-9 text-xs font-normal text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Device Check & Preview (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Sliders
                  size={18}
                  weight="duotone"
                  className="text-emerald-600 dark:text-emerald-400"
                />
                Kiểm Tra Thiết Bị
              </h2>
              <span className="rounded-full border border-emerald-200/50 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                Sẵn sàng
              </span>
            </div>

            {/* Video Camera Preview */}
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950">
              {isCameraOn && hasCameraPermission ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full -scale-x-100 transform object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 p-4 text-center text-slate-400">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-base font-semibold text-slate-300">
                    {candidateName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(-2)
                      .join("")
                      .toUpperCase() || "UN"}
                  </div>
                  <p className="text-[11px] font-normal text-slate-400">
                    {hasCameraPermission === false
                      ? "Chưa cấp quyền Camera. Hệ thống sẽ sử dụng Avatar."
                      : "Camera đang tắt"}
                  </p>
                </div>
              )}

              {/* Status Badge overlay */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-md border border-slate-700/40 bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-slate-200 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span>{candidateName}</span>
              </div>

              {/* Media Controls Bar inside preview */}
              <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`rounded-full p-2 transition-all ${
                    isCameraOn
                      ? "bg-slate-800/90 text-slate-200 hover:bg-slate-700"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                  title={isCameraOn ? "Tắt Camera" : "Bật Camera"}
                >
                  {isCameraOn ? (
                    <Camera size={16} weight="bold" />
                  ) : (
                    <CameraSlash size={16} weight="bold" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMic}
                  className={`rounded-full p-2 transition-all ${
                    isMicOn
                      ? "bg-slate-800/90 text-slate-200 hover:bg-slate-700"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                  title={isMicOn ? "Tắt Micro" : "Bật Micro"}
                >
                  {isMicOn ? (
                    <Microphone size={16} weight="bold" />
                  ) : (
                    <MicrophoneSlash size={16} weight="bold" />
                  )}
                </button>
              </div>
            </div>

            {/* Audio Meter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Microphone size={13} className="text-emerald-500" />
                  Mức độ âm thanh Micro
                </span>
                <span className="font-mono">{isMicOn ? `${audioLevel}%` : "Tắt"}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${isMicOn ? audioLevel : 0}%` }}
                />
              </div>
            </div>

            {/* Interview Session Info Summary */}
            <div className="space-y-2 rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-normal text-slate-500 dark:text-slate-400">
                  <Clock size={14} /> Thời lượng ước tính:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  ~{selectedRole.durationMinutes} phút ({selectedRole.totalQuestions} câu hỏi)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-normal text-slate-500 dark:text-slate-400">
                  <ShieldCheck size={14} className="text-emerald-500" /> Người phỏng vấn:
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Mrs. Tania Shahira (AI Lead)
                </span>
              </div>
            </div>

            {/* Start Interview Action Button */}
            <button
              type="button"
              onClick={handleStart}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.99] sm:text-sm"
            >
              <Play size={16} weight="fill" />
              Bắt Đầu Phỏng Vấn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
