"use client";
import {
  Sparkles,
  Camera,
  Mic,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Play,
  Briefcase,
  Layers,
  GraduationCap,
  Globe,
  Settings,
  Key,
  ShieldCheck,
  Server,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

import { checkBackendHealth, getApiBaseUrl } from "../config/api";
import { apiClient } from "../services/apiClient";
import { loadFaceDetectionModels, detectFaceMetrics } from "../services/faceDetection";
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

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartInterview }) => {
  // Config Form State
  const [candidateName, setCandidateName] = useState("Ứng viên");
  const [role, setRole] = useState<InterviewRole>("frontend");
  const [level, setLevel] = useState<ExperienceLevel>("middle");
  const [educationType, setEducationType] = useState<EducationType>("university");
  const [language, setLanguage] = useState<Language>("vi");
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("deep");
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("vi-VN-HoaiMyNeural");
  const [availableVoices, setAvailableVoices] = useState<TTSVoiceInfo[]>([]);
  const [enableNoiseSuppression, setEnableNoiseSuppression] = useState<boolean>(true);
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Backend Status
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Device & Calibration State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [ttsTested, setTtsTested] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ttsServiceRef = useRef<SpeechSynthesisService>(new SpeechSynthesisService());

  // Check Backend health and load voices on mount
  useEffect(() => {
    checkBackendHealth().then((status) => {
      setBackendOnline(status.online);
    });
  }, []);

  // Load voices whenever language changes
  useEffect(() => {
    apiClient.getTTSVoices(language).then((voices) => {
      setAvailableVoices(voices);
      if (voices.length > 0) {
        const defaultVoice = voices.find((v) => v.isDefault) || voices[0];
        if (defaultVoice) {
          setSelectedVoiceId(defaultVoice.id);
        }
      }
    });
  }, [language]);

  // Initialize Models and WebCam on mount
  useEffect(() => {
    let streamInstance: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let animId: number;

    const setupDevices = async () => {
      setIsCalibrating(true);
      try {
        // 1. Load Face Models
        const loaded = await loadFaceDetectionModels();
        setModelsLoaded(loaded);

        // 2. Request Camera & Mic with Hardware Voice Isolation & Noise Suppression
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            channelCount: { ideal: 1 },
          },
        });

        streamInstance = stream;
        setMediaStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // 3. Audio Volume Monitor
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkCalibration = () => {
          // Mic volume monitor (smooth 60fps)
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] ?? 0;
          const avg = sum / (dataArray.length || 1);
          setMicVolume(Math.min(100, Math.round(avg * 2)));

          animId = requestAnimationFrame(checkCalibration);
        };

        checkCalibration();

        // Throttled Face Check (every 300ms) to keep setup completely lag-free
        let isCheckingFace = false;
        const faceInterval = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && loaded && !isCheckingFace) {
            isCheckingFace = true;
            try {
              const res = await detectFaceMetrics(videoRef.current);
              setFaceDetected(res.metrics.detected);
            } catch (e) {
              console.warn("[SetupModal] Face check warning:", e);
            } finally {
              isCheckingFace = false;
            }
          }
        }, 300);

        return () => {
          clearInterval(faceInterval);
        };
      } catch (err: any) {
        console.warn("[SetupModal] Device access error:", err);
        setDeviceError(
          "Không thể truy cập Camera/Microphone. Vui lòng cấp quyền trên trình duyệt.",
        );
      } finally {
        setIsCalibrating(false);
      }
    };

    let cleanupFaceInterval: (() => void) | undefined;
    setupDevices().then((cleanup) => {
      if (typeof cleanup === "function") cleanupFaceInterval = cleanup;
    });

    return () => {
      cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
      if (cleanupFaceInterval) cleanupFaceInterval();
    };
  }, []);

  const handleTestTTS = () => {
    const text =
      language === "vi"
        ? "Xin chào, tôi là AI phỏng vấn viên. Hệ thống âm thanh đã sẵn sàng!"
        : "Hello! I am your AI interviewer. The speech system is ready!";
    ttsServiceRef.current.speak(text, {
      language,
      voiceId: selectedVoiceId,
      onStart: () => setTtsTested(true),
    });
  };

  const handleStart = () => {
    onStartInterview(
      {
        candidateName,
        role,
        level,
        educationType,
        language,
        interviewMode,
        questionCount,
        enableTTS: true,
        enableCamera: true,
        enableMic: true,
        enableNoiseSuppression,
        selectedVoiceId,
        geminiApiKey: geminiApiKey.trim() || undefined,
      },
      mediaStream,
    );
  };

  const roleOptions: { value: InterviewRole; label: string; desc: string }[] = [
    {
      value: "frontend",
      label: "Frontend Developer",
      desc: "React, TypeScript, VDOM, Web Vitals, CSS",
    },
    {
      value: "backend",
      label: "Backend Developer",
      desc: "API, Database Indexing, Redis, Microservices",
    },
    {
      value: "fullstack",
      label: "Fullstack Developer",
      desc: "End-to-end Arch, Security, DevOps, Scalability",
    },
    {
      value: "product_manager",
      label: "Product Manager",
      desc: "RICE Framework, KPIs, User Discovery",
    },
    {
      value: "data_analyst",
      label: "Data Analyst",
      desc: "SQL Window Functions, EDA, Business Insights",
    },
    {
      value: "hr_behavioral",
      label: "HR Behavioral (STAR)",
      desc: "Xử lý xung đột, Áp lực deadline, Lãnh đạo",
    },
    {
      value: "english_comm",
      label: "English Communication",
      desc: "Phỏng vấn tiếng Anh giao tiếp chuyên nghiệp",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative my-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 mb-6 flex flex-col items-start justify-between gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multimodal AI Realtime Interview Demo</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Chuẩn Bị Phỏng Vấn AI
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Nhận diện biểu cảm 60 FPS • Phân tích giọng nói • STT & TTS Thông Minh
            </p>
          </div>

          {/* Backend Status Badge */}
          <div className="flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs">
            <Server className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-medium text-slate-300">Máy Chủ:</span>
            {backendOnline === null ? (
              <span className="font-medium text-slate-400">Đang kiểm tra...</span>
            ) : backendOnline ? (
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                Đã Kết Nối
              </span>
            ) : (
              <span
                className="flex items-center gap-1 font-bold text-amber-400"
                title="Đang chạy chế độ Local Client độc lập"
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Local Mode
              </span>
            )}
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Form Settings */}
          <div className="space-y-4 lg:col-span-7">
            {/* Candidate Name */}
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-300 uppercase">
                Họ và Tên Ứng Viên
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Interview Mode Selection (Basic vs Deep-dive) */}
            <div>
              <label className="mb-2 block flex items-center justify-between text-xs font-bold tracking-wider text-slate-300 uppercase">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Chế Độ Phỏng Vấn
                </span>
                <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                  Adaptive Follow-up
                </span>
              </label>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {/* Basic Mode */}
                <button
                  type="button"
                  onClick={() => setInterviewMode("basic")}
                  className={`relative flex flex-col justify-between rounded-2xl border p-3 text-left transition ${
                    interviewMode === "basic"
                      ? "border-indigo-500 bg-gradient-to-br from-indigo-900/50 to-slate-900 text-white shadow-lg ring-1 shadow-indigo-600/15 ring-indigo-500"
                      : "border-slate-800/80 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⚡</span>
                      <span className="text-xs font-bold text-slate-100">Cơ Bản (Basic)</span>
                    </div>
                    {interviewMode === "basic" && (
                      <span className="h-2 w-2 animate-ping rounded-full bg-indigo-400" />
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Hỏi 1 lần, đánh giá ngay, chuyển câu tiếp. Phù hợp luyện tập nhanh và làm quen
                    phản xạ.
                  </p>
                </button>

                {/* Deep-Dive Mode */}
                <button
                  type="button"
                  onClick={() => setInterviewMode("deep")}
                  className={`relative flex flex-col justify-between rounded-2xl border p-3 text-left transition ${
                    interviewMode === "deep"
                      ? "border-purple-500 bg-gradient-to-br from-purple-900/50 via-indigo-900/30 to-slate-900 text-white shadow-lg ring-1 shadow-purple-600/20 ring-purple-500"
                      : "border-slate-800/80 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🧠</span>
                      <span className="text-xs font-bold text-slate-100">
                        Chuyên Sâu (Deep-dive)
                      </span>
                    </div>
                    <span className="rounded-full border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300/90">
                    AI tự động hỏi đào sâu theo câu trả lời (tối đa 2 lần) để thử thách chiều sâu
                    kiến thức thực chiến.
                  </p>
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="mb-1.5 block flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-300 uppercase">
                <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                Vị Trí Phỏng Vấn
              </label>
              <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                      role === opt.value
                        ? "border-indigo-500 bg-indigo-600/20 text-white shadow-lg shadow-indigo-600/10"
                        : "border-slate-800/80 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Level, Education Type, Language & Question Count */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div>
                <label className="mb-1.5 block flex items-center gap-1 text-xs font-bold tracking-wider text-slate-300 uppercase">
                  <Layers className="h-3 w-3 text-indigo-400" /> Cấp Độ
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="intern">Intern (Thực tập)</option>
                  <option value="fresher">Fresher (Mới tốt nghiệp)</option>
                  <option value="junior">Junior (1-2 năm)</option>
                  <option value="middle">Middle (2-4 năm)</option>
                  <option value="senior">Senior (4+ năm)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block flex items-center gap-1 text-xs font-bold tracking-wider text-slate-300 uppercase">
                  <GraduationCap className="h-3 w-3 text-indigo-400" /> Loại Trường
                </label>
                <select
                  value={educationType}
                  onChange={(e) => setEducationType(e.target.value as EducationType)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="university">Đại học</option>
                  <option value="college">Cao đẳng</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block flex items-center gap-1 text-xs font-bold tracking-wider text-slate-300 uppercase">
                  <Globe className="h-3 w-3 text-indigo-400" /> Ngôn Ngữ
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-300 uppercase">
                  Số Câu Hỏi
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value={3}>3 Câu (Khuyên dùng)</option>
                  <option value={5}>5 Câu (Chuyên sâu)</option>
                </select>
              </div>
            </div>

            {/* AI Voice Selection */}
            {availableVoices.length > 0 && (
              <div>
                <label className="mb-1.5 block flex items-center justify-between text-xs font-bold tracking-wider text-slate-300 uppercase">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-indigo-400" /> Giọng Đọc AI Phỏng Vấn
                    (Neural TTS)
                  </span>
                  <span className="text-[10px] font-medium text-indigo-400">Studio Quality</span>
                </label>
                <select
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {availableVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Advanced Gemini Key Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
              >
                <Settings className="h-3.5 w-3.5" />
                {showAdvanced ? "Ẩn cấu hình nâng cao" : "Cấu hình API Key Gemini (Tùy chọn)"}
              </button>

              {showAdvanced && (
                <div className="mt-2 space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <label className="block flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                    <Key className="h-3 w-3 text-amber-400" /> Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy... (Để trống để dùng động cơ AI tích hợp sẵn trên server)"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    * Server backend đã tích hợp sẵn AI đánh giá đa chiều thông minh, không bắt buộc
                    cần API Key.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Device Calibration & Camera Preview */}
          <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 lg:col-span-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-200 uppercase">
                  <Camera className="h-3.5 w-3.5 text-indigo-400" />
                  Kiểm Tra Thiết Bị & AI
                </span>
                <span className="text-[10px] font-bold text-slate-400">Calibration</span>
              </div>

              {/* Video Preview */}
              <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                {mediaStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full -scale-x-100 transform object-cover"
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    <Camera className="mx-auto mb-1 h-8 w-8 opacity-50" />
                    Đang kích hoạt Camera...
                  </div>
                )}

                {faceDetected && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-slate-950 shadow-lg">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã nhận diện khuôn mặt
                  </div>
                )}
              </div>

              {/* Status Checklist */}
              <div className="mt-3 space-y-2 text-xs">
                {/* Face API */}
                <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 p-2">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> AI Face & Expression
                    (Client)
                  </span>
                  <span
                    className={
                      modelsLoaded ? "font-semibold text-emerald-400" : "font-medium text-amber-400"
                    }
                  >
                    {modelsLoaded ? "Sẵn sàng" : "Đang tải model..."}
                  </span>
                </div>

                {/* Mic Volume */}
                <div className="rounded-lg border border-slate-800/80 bg-slate-900/80 p-2">
                  <div className="mb-1 flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5 text-indigo-400" /> Âm lượng Microphone
                    </span>
                    <span className="font-semibold text-slate-100">{micVolume}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-150"
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                </div>

                {/* Noise & Music Suppression Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 p-2">
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Lọc tiếng ồn & Nhạc
                      nền AI
                    </span>
                    <span className="text-[10px] text-slate-400">
                      DSP Voice Bandpass + Noise Gate
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableNoiseSuppression}
                    onChange={(e) => setEnableNoiseSuppression(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </div>

                {/* TTS Test */}
                <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 p-2">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Volume2 className="h-3.5 w-3.5 text-indigo-400" /> Giọng đọc AI (TTS)
                  </span>
                  <button
                    type="button"
                    onClick={handleTestTTS}
                    className="rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    {ttsTested ? "Đã thử nghiệm" : "Thử giọng đọc"}
                  </button>
                </div>
              </div>

              {deviceError && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] text-amber-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{deviceError}</span>
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStart}
              className="flex w-full transform items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:to-purple-500 active:translate-y-0"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Bắt Đầu Buổi Phỏng Vấn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
