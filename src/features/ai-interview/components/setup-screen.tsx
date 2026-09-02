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
  Play,
  SpeakerHigh,
  User,
  Lightning,
  ArrowsClockwise,
  Globe,
  Student,
} from "@phosphor-icons/react";
import React, { useState, useEffect, useRef } from "react";

import { checkBackendHealth } from "../config/api";
import { apiClient } from "../services/apiClient";
import { loadFaceDetectionModels } from "../services/faceDetection";
import { SpeechSynthesisService } from "../services/speechSynthesis";
import {
  InterviewRole,
  ExperienceLevel,
  EducationType,
  Language,
  InterviewMode,
  InterviewSessionConfig,
  TTSVoiceInfo,
} from "../types";

interface SetupScreenProps {
  onStartInterview: (config: InterviewSessionConfig, stream: MediaStream | null) => void;
}

interface RoleOption {
  value: InterviewRole;
  label: string;
  labelVi: string;
  desc: string;
  iconName: string;
  tags: string[];
}

const ROLES: RoleOption[] = [
  {
    value: "frontend",
    label: "Frontend Developer",
    labelVi: "Lập trình viên Frontend",
    desc: "React 19, Next.js App Router, TypeScript, Virtual DOM & Core Web Vitals",
    iconName: "Code",
    tags: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    value: "backend",
    label: "Backend Developer",
    labelVi: "Kỹ sư Backend",
    desc: "RESTful API, Microservices, PostgreSQL indexing, Redis & Security",
    iconName: "Server",
    tags: ["Node.js", "NestJS", "PostgreSQL", "Redis", "Docker"],
  },
  {
    value: "fullstack",
    label: "Fullstack Developer",
    labelVi: "Lập trình viên Fullstack",
    desc: "Kiến trúc toàn diện từ Web UI, Server API, CSDL quan hệ đến Cloud DevOps",
    iconName: "Layers",
    tags: ["Next.js", "NestJS", "PostgreSQL", "Prisma", "DevOps"],
  },
  {
    value: "product_manager",
    label: "Product Manager",
    labelVi: "Quản lý Sản phẩm (PM)",
    desc: "Khung RICE, Discovery người dùng, Định hướng Roadmap & Phân tích KPIs",
    iconName: "BrainCircuit",
    tags: ["Product Strategy", "RICE", "User Journey", "KPIs"],
  },
  {
    value: "data_analyst",
    label: "Data Analyst",
    labelVi: "Chuyên viên Phân tích Dữ liệu",
    desc: "Truy vấn SQL nâng cao, EDA, Mô hình hóa dữ liệu & Trực quan hóa Dashboard",
    iconName: "Cloud",
    tags: ["SQL", "PostgreSQL", "Python", "Data Viz"],
  },
  {
    value: "hr_behavioral",
    label: "HR Behavioral (STAR)",
    labelVi: "Phỏng vấn Nhân sự & Tác phong",
    desc: "Kỹ thuật phỏng vấn hành vi STAR, Xử lý xung đột nhóm, Đạo đức & Thích ứng",
    iconName: "Palette",
    tags: ["STAR Method", "Leadership", "Teamwork", "Culture Fit"],
  },
];

const LEVELS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: "intern", label: "Intern", desc: "Thực tập sinh, sinh viên năm 3-4" },
  { value: "fresher", label: "Fresher", desc: "Mới tốt nghiệp, 0-1 năm kinh nghiệm" },
  { value: "junior", label: "Junior", desc: "1-2 năm kinh nghiệm thực chiến" },
  { value: "middle", label: "Middle", desc: "2-4 năm kinh nghiệm chuyên sâu" },
  { value: "senior", label: "Senior", desc: "5+ năm kinh nghiệm & cố vấn" },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartInterview }) => {
  // Config Form State
  const [candidateName, setCandidateName] = useState<string>("Ứng viên");
  const [role, setRole] = useState<InterviewRole>("frontend");
  const [level, setLevel] = useState<ExperienceLevel>("intern");
  const [educationType, setEducationType] = useState<EducationType>("university");
  const [language, setLanguage] = useState<Language>("vi");
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("deep");
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("vi-VN-HoaiMyNeural");
  const [enableNoiseSuppression, setEnableNoiseSuppression] = useState<boolean>(true);
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");

  // Devices & Hardware State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Backend Health State
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [availableVoices, setAvailableVoices] = useState<TTSVoiceInfo[]>([]);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ttsServiceRef = useRef<SpeechSynthesisService>(new SpeechSynthesisService());

  // 1. Check Backend Health & Fetch Voices
  useEffect(() => {
    let isMounted = true;
    const initBackend = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        if (isMounted) {
          setBackendStatus(isHealthy ? "online" : "offline");
        }

        const voices = await apiClient.getTTSVoices(language);
        if (isMounted && voices.length > 0) {
          setAvailableVoices(voices);
          const defaultVoice = voices.find((v: TTSVoiceInfo) => v.isDefault) || voices[0];
          if (defaultVoice) {
            setSelectedVoiceId(defaultVoice.id);
          }
        }
      } catch (err) {
        console.warn("[SetupScreen] Backend init warning:", err);
        if (isMounted) setBackendStatus("offline");
      }
    };

    initBackend();
    loadFaceDetectionModels();

    return () => {
      isMounted = false;
    };
  }, [language]);

  // 2. Initialize Camera & Mic Stream
  useEffect(() => {
    let animFrame: number;
    let localStream: MediaStream | null = null;

    const startMedia = async () => {
      try {
        setDeviceError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        localStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] ?? 0;
          }
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrame = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (err) {
        console.warn("[SetupScreen] Device access error:", err);
        setDeviceError(
          "Không thể truy cập Camera/Microphone. Vui lòng cấp quyền trên trình duyệt.",
        );
      }
    };

    startMedia();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
    }
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
  };

  const handleTestVoice = () => {
    if (isPlayingTestVoice) return;
    setIsPlayingTestVoice(true);

    const testText =
      language === "vi"
        ? "Xin chào! Tôi là AI phỏng vấn viên của UpNext. Hệ thống âm thanh đã sẵn sàng!"
        : "Hello! I am your UpNext AI interviewer. The speech system is ready!";

    ttsServiceRef.current.speak(testText, {
      language,
      voiceId: selectedVoiceId,
      onEnd: () => setIsPlayingTestVoice(false),
      onError: () => setIsPlayingTestVoice(false),
    });
  };

  const handleStart = () => {
    const config: InterviewSessionConfig = {
      candidateName: candidateName.trim() || "Ứng viên",
      role,
      level,
      educationType,
      language,
      interviewMode,
      questionCount,
      enableTTS: true,
      enableCamera: isCameraOn,
      enableMic: isMicOn,
      enableNoiseSuppression,
      selectedVoiceId,
      geminiApiKey: geminiApiKey.trim() || undefined,
    };

    onStartInterview(config, stream);
  };

  const getRoleIcon = (name: string) => {
    switch (name) {
      case "Code":
        return <Code size={20} weight="duotone" />;
      case "Server":
        return <HardDrives size={20} weight="duotone" />;
      case "Layers":
        return <Stack size={20} weight="duotone" />;
      case "BrainCircuit":
        return <Cpu size={20} weight="duotone" />;
      case "Cloud":
        return <Cloud size={20} weight="duotone" />;
      case "Palette":
        return <Palette size={20} weight="duotone" />;
      default:
        return <Code size={20} weight="duotone" />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      {/* Top UpNext Header */}
      <div className="mx-auto mb-8 max-w-2xl space-y-2.5 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Sparkle size={15} weight="fill" className="text-emerald-500" />
          UpNext AI Interview Studio
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          Luyện Phỏng Vấn{" "}
          <span className="text-emerald-600 dark:text-emerald-400">AI Trực Tiếp</span>
        </h1>
        <p className="text-sm leading-relaxed font-normal text-slate-500 sm:text-base dark:text-slate-400">
          Mô phỏng phỏng vấn video 1-on-1 theo vị trí chuyên môn. Trải nghiệm hệ thống AI Lead chấm
          điểm đa phương thức, phân tích giọng nói & cử chỉ thời gian thực.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Role, Level, Mode & Language Configuration (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Step 1: Vị Trí Chuyên Môn */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-50 text-xs font-semibold text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950 dark:text-emerald-400">
                  1
                </span>
                Vị Trí Chuyên Môn
              </h2>
              <span className="text-xs font-normal text-slate-400">
                {ROLES.length} chuyên ngành
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ROLES.map((r) => {
                const isSelected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-950/25"
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
                          {getRoleIcon(r.iconName)}
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
                        {r.labelVi}
                      </h3>
                      <p className="line-clamp-2 text-[11px] leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                        {r.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {r.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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

          {/* Step 2: Cấp Bậc & Chế Độ Phỏng Vấn */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-50 text-xs font-semibold text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950 dark:text-emerald-400">
                  2
                </span>
                Cấp Bậc & Chế Độ Luyện Tập
              </h2>
            </div>

            {/* Cấp bậc pills */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cấp Bậc Mục Tiêu
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {LEVELS.map((lvl) => {
                  const isSelected = level === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setLevel(lvl.value)}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-xs font-bold">{lvl.label}</span>
                      <span className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {lvl.desc.split(",")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chế độ phỏng vấn (Basic vs Deep) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Chế Độ Phỏng Vấn
              </label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setInterviewMode("basic")}
                  className={`flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all ${
                    interviewMode === "basic"
                      ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-950/25"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <Lightning size={14} className="text-amber-500" /> Phỏng Vấn Cơ Bản
                    </span>
                    {interviewMode === "basic" && (
                      <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Hỏi 1 lượt các câu hỏi trọng tâm, chuyển tiếp nhanh. Phù hợp làm quen phản xạ và
                    kiểm tra tổng quát.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setInterviewMode("deep")}
                  className={`flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-all ${
                    interviewMode === "deep"
                      ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-950/25"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <Sparkle size={14} weight="fill" className="text-emerald-500" /> Đào Sâu Ngữ
                      Cảnh (Deep Dive)
                    </span>
                    {interviewMode === "deep" && (
                      <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    AI Lead tự động lắng nghe câu trả lời và đặt câu hỏi đào sâu bám sát ý thực tế
                    như phỏng vấn thật.
                  </p>
                </button>
              </div>
            </div>

            {/* Thông số phụ: Ngôn ngữ, Số câu hỏi, Giọng đọc AI */}
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
              <div>
                <label className="mb-1 block flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Globe size={14} className="text-emerald-600" /> Ngôn Ngữ
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Student size={14} className="text-emerald-600" /> Khối Đào Tạo
                </label>
                <select
                  value={educationType}
                  onChange={(e) => setEducationType(e.target.value as EducationType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="university">Đại học</option>
                  <option value="college">Cao đẳng / Nghề</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Số Lượng Câu Hỏi
                </label>
                <div className="flex items-center gap-1.5">
                  {[3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 cursor-pointer rounded-xl py-1.5 text-xs font-semibold transition ${
                        questionCount === num
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Giọng đọc AI & Thử âm thanh */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <SpeakerHigh size={15} className="text-emerald-600" /> Giọng Đọc AI Phỏng Vấn
                  (Edge-TTS Studio)
                </span>
                <button
                  type="button"
                  onClick={handleTestVoice}
                  disabled={isPlayingTestVoice}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400"
                >
                  {isPlayingTestVoice ? (
                    <>
                      <ArrowsClockwise size={12} className="animate-spin" /> Đang phát...
                    </>
                  ) : (
                    <>
                      <SpeakerHigh size={12} /> Nghe thử giọng
                    </>
                  )}
                </button>
              </div>

              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {availableVoices.length > 0 ? (
                  availableVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.description}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="vi-VN-HoaiMyNeural">
                      Hoài My (Nữ VTV - Truyền cảm, tự nhiên)
                    </option>
                    <option value="vi-VN-NamMinhNeural">
                      Nam Minh (Nam - Trầm ấm, chuyên nghiệp)
                    </option>
                    <option value="en-US-JennyNeural">Jenny (English US - Female Studio)</option>
                    <option value="en-US-GuyNeural">Guy (English US - Male Professional)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Camera & Microphone Preview & Action (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Hardware Testing Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Camera size={18} className="text-emerald-600" />
                Kiểm Tra Thiết Bị & Âm Thanh
              </h2>
              {backendStatus === "online" ? (
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Backend Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Local AI Ready
                </span>
              )}
            </div>

            {/* Video Viewport Preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-950 shadow-inner dark:border-slate-800">
              {stream && isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full -scale-x-100 transform object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-slate-400">
                  <CameraSlash size={36} className="mb-1.5 text-slate-600" />
                  <p className="text-xs">Camera đang tắt</p>
                </div>
              )}

              {/* Top controls on camera */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`cursor-pointer rounded-lg p-2 transition ${
                    isCameraOn
                      ? "bg-slate-900/80 text-white backdrop-blur-md hover:bg-slate-800"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                  title={isCameraOn ? "Tắt Camera" : "Bật Camera"}
                >
                  {isCameraOn ? <Camera size={16} /> : <CameraSlash size={16} />}
                </button>
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`cursor-pointer rounded-lg p-2 transition ${
                    isMicOn
                      ? "bg-slate-900/80 text-white backdrop-blur-md hover:bg-slate-800"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                  title={isMicOn ? "Tắt Micro" : "Bật Micro"}
                >
                  {isMicOn ? <Microphone size={16} /> : <MicrophoneSlash size={16} />}
                </button>
              </div>

              {/* Bottom tag on camera */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] text-slate-200 backdrop-blur-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Camera 60 FPS HUD Ready</span>
              </div>
            </div>

            {deviceError && <p className="mt-2 text-xs font-medium text-red-500">{deviceError}</p>}

            {/* Live Audio Level Meter */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <Microphone size={14} className="text-emerald-600" /> Mức Tín Hiệu Micro
                </span>
                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                  {micVolume > 5 ? `${micVolume}%` : "Chờ giọng nói..."}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, micVolume * 1.3)}%` }}
                />
              </div>
            </div>

            {/* Candidate Name Input */}
            <div className="mt-4 space-y-1.5">
              <label className="block flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <User size={14} className="text-emerald-600" /> Họ & Tên Ứng Viên
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Nhập tên của bạn để hiển thị trong báo cáo..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Optional Gemini API Key */}
            <div className="mt-3">
              <details className="text-[11px] text-slate-500">
                <summary className="cursor-pointer font-medium hover:text-slate-700 dark:hover:text-slate-300">
                  Cấu hình nâng cao (Tùy chọn Gemini API Key)
                </summary>
                <div className="mt-2 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-[10px] text-slate-400">
                    Nếu để trống, hệ thống sẽ tự động dùng máy chủ Backend AI tại
                    100.85.145.47:5000.
                  </p>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
              </details>
            </div>

            {/* Start Button */}
            <div className="mt-5 pt-1">
              <button
                type="button"
                onClick={handleStart}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700"
              >
                <Play size={18} weight="fill" /> Bắt Đầu Phỏng Vấn Ngay
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Buổi phỏng vấn được ghi nhận bảo mật và chỉ sử dụng để đánh giá năng lực của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
