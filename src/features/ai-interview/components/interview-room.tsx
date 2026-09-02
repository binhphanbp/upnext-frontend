"use client";

import {
  Camera,
  CameraSlash,
  Microphone,
  MicrophoneSlash,
  PhoneDisconnect,
  CheckCircle,
  Calendar,
  Sparkle,
  PaperPlaneRight,
  SpeakerHigh,
  SpeakerSimpleSlash,
  ListChecks,
  ChartBar,
  ArrowLeft,
  Tag,
  Users,
  Lightbulb,
  ArrowsClockwise,
  ArrowRight,
  StopCircle,
  VideoCamera,
  Smiley,
  Eye,
  Info,
  Waveform,
  ShieldCheck,
  TrendUp,
} from "@phosphor-icons/react";
import React, { useState, useEffect, useRef } from "react";

import { MOCK_QUESTIONS_BY_ROLE, DEFAULT_MOCK_REPORT } from "../mock-data";
import { RolePreset, SeniorityLevel, InterviewType, InterviewQuestion } from "../types";
import { AiScoreRadar } from "./ai-score-radar";
import { AudioWave } from "./audio-wave";

interface InterviewRoomProps {
  role: RolePreset;
  level: SeniorityLevel;
  interviewType: InterviewType;
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  candidateName: string;
  onFinishInterview: () => void;
  onExit: () => void;
}

const defaultFrontendQuestions: InterviewQuestion[] =
  MOCK_QUESTIONS_BY_ROLE["frontend-developer"] || [];

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  role,
  level,
  interviewType: _interviewType,
  isCameraEnabled: initialCamera,
  isMicEnabled: initialMic,
  candidateName,
  onFinishInterview,
  onExit,
}) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>(() => {
    return MOCK_QUESTIONS_BY_ROLE[role.id] ?? defaultFrontendQuestions;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const currentQuestion: InterviewQuestion =
    questions[currentQuestionIndex] ?? defaultFrontendQuestions[0]!;

  const [isCameraOn, setIsCameraOn] = useState<boolean>(initialCamera);
  const [isMicOn, setIsMicOn] = useState<boolean>(initialMic);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(true);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [isMutedSound, setIsMutedSound] = useState<boolean>(false);

  // Tabs: 'questions' | 'telemetry' | 'radar'
  const [activeTab, setActiveTab] = useState<"questions" | "telemetry" | "radar">("questions");

  // Timers
  const [questionSeconds, setQuestionSeconds] = useState<number>(0);
  const [speakingDuration, setSpeakingDuration] = useState<number>(0);
  const questionTimeLimit = 90; // 90 seconds per question

  // Real-time Speech & Audio Telemetry
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [answerDraft, setAnswerDraft] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [rmsIntensity, setRmsIntensity] = useState<number>(18);
  const [voiceStability, setVoiceStability] = useState<number>(88);

  // Multimodal Vision Metrics
  const [confidenceScore, setConfidenceScore] = useState<number>(82);
  const [eyeContactScore, setEyeContactScore] = useState<number>(96);
  const [smileScore, setSmileScore] = useState<number>(15);

  // Hints Modal Toggle
  const [showHintModal, setShowHintModal] = useState<boolean>(false);

  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Per-question timer
  useEffect(() => {
    const timer = setInterval(() => {
      setQuestionSeconds((prev) => prev + 1);
      if (isCandidateSpeaking && isMicOn) {
        setSpeakingDuration((prev) => +(prev + 1).toFixed(1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCandidateSpeaking, isMicOn]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Text-To-Speech: AI Reads question out loud
  const speakAiQuestion = () => {
    if (typeof window === "undefined" || isMutedSound) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestion.questionVi);
      utterance.lang = "vi-VN";
      utterance.rate = 1.0;
      utterance.pitch = 1.02;

      utterance.onstart = () => {
        setIsAiSpeaking(true);
        setIsCandidateSpeaking(false);
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
        setIsCandidateSpeaking(true);
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      // TTS fallback
    }
  };

  // Switch question reset & announce
  useEffect(() => {
    setQuestionSeconds(0);
    setSpeakingDuration(0);
    setTranscriptText("");
    setAnswerDraft("");
    setWordCount(0);
    setWpm(0);

    speakAiQuestion();

    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentQuestionIndex]);

  // Webcam stream
  useEffect(() => {
    const initCamera = async () => {
      if (!isCameraOn) return;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          mediaStreamRef.current = stream;
          if (candidateVideoRef.current) {
            candidateVideoRef.current.srcObject = stream;
          }

          // Audio meter
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new (
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                  .webkitAudioContext
              )();
            }
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVolume = () => {
              analyser.getByteFrequencyData(dataArray);
              const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
              const rms = Math.min(100, Math.round((avg / 128) * 100));
              setRmsIntensity(rms);
              setIsCandidateSpeaking(rms > 6);
              requestAnimationFrame(updateVolume);
            };
            updateVolume();
          } catch {
            // Audio context fallback
          }
        }
      } catch {
        // Fallback
      }
    };

    initCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOn]);

  // Speech Recognition (Web Speech API)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !isMicOn) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "vi-VN";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
        const cleaned = fullTranscript.trim();
        if (cleaned) {
          setTranscriptText(cleaned);
          setAnswerDraft(cleaned);
          const words = cleaned.split(/\s+/).filter(Boolean);
          const count = words.length;
          setWordCount(count);

          if (speakingDuration > 2) {
            const calculatedWpm = Math.round(count / (speakingDuration / 60));
            setWpm(Math.min(170, Math.max(40, calculatedWpm)));
          }

          setConfidenceScore((prev) =>
            Math.min(96, Math.max(72, prev + (Math.random() > 0.5 ? 1 : -1))),
          );
          setEyeContactScore((prev) =>
            Math.min(100, Math.max(90, prev + (Math.random() > 0.6 ? 1 : -1))),
          );
          setSmileScore(Math.floor(Math.random() * 20));
        }
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      };
    } catch {
      // Speech recognition fallback
    }
  }, [isMicOn, speakingDuration]);

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !isCameraOn));
    }
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    setIsCandidateSpeaking(!isMicOn);
  };

  const handleCompleteCurrentQuestion = () => {
    const updated = [...questions];
    const targetQ = updated[currentQuestionIndex];
    if (targetQ) {
      updated[currentQuestionIndex] = {
        ...targetQ,
        status: "answered",
        score: Math.min(96, Math.max(80, confidenceScore + Math.floor(Math.random() * 6))),
        answeredText:
          answerDraft ||
          transcriptText ||
          targetQ.sampleAnswerVi ||
          "Ứng viên đã trình bày đầy đủ các luận điểm trọng tâm.",
      };
    }
    setQuestions(updated);
    setAnswerDraft("");
    setTranscriptText("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onFinishInterview();
    }
  };

  const candidateInitials =
    candidateName
      .split(" ")
      .map((n) => n[0])
      .slice(-2)
      .join("")
      .toUpperCase() || "UN";

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-4 px-3 py-4 font-sans text-slate-800 sm:px-6 md:py-6 dark:text-slate-200">
      {/* 1. TOP HEADER (Refined UpNext Style, Matching HireByte Reference 1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        {/* Left: Back Button & Room Info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 shadow-xs transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Quay lại"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base dark:text-white">
                Hiring: {role.title}
              </h1>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                {level.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              Ứng viên:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {candidateName}
              </span>
            </p>
          </div>
        </div>

        {/* Right Header Status & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Question Counter Pill */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            Câu hỏi:{" "}
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {currentQuestionIndex + 1}
            </span>{" "}
            / {questions.length}
          </div>

          {/* Question Timer Countdown Pill */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 font-mono text-xs font-medium text-emerald-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>{formatTimer(questionSeconds)}</span>
            <span className="text-[11px] text-slate-400">/ {questionTimeLimit}s</span>
          </div>

          {/* Recording Status (Reference 1: Stop / Live Recording) */}
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-xs transition-colors hover:bg-slate-50 sm:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <StopCircle size={14} />
            <span>Stop Recording</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow-xs">
            <VideoCamera size={14} weight="fill" />
            <span>Live Recording</span>
          </div>

          {/* Finish Button */}
          <button
            type="button"
            onClick={onFinishInterview}
            className="cursor-pointer rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-emerald-700"
          >
            Báo Cáo
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN STUDIO (Left 8 cols Video & Notes | Right 4 cols Checklist & Telemetry) */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* LEFT COLUMN (8 cols) */}
        <div className="space-y-3.5 lg:col-span-8">
          {/* Main Video Call Stage (Clean, Cinematic, Modern SaaS quality) */}
          <div className="relative flex aspect-[16/9.3] items-center justify-center overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
            {/* AI Lead Video Stream Background */}
            <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="relative flex flex-col items-center justify-center space-y-2.5">
                {/* Professional AI Avatar with Pulsing Audio Ring */}
                <div className="relative">
                  <div
                    className={`h-28 w-28 overflow-hidden rounded-full border-2 shadow-xl transition-all duration-300 sm:h-32 sm:w-32 ${
                      isAiSpeaking
                        ? "border-emerald-500 ring-4 shadow-emerald-500/20 ring-emerald-500/20"
                        : "border-slate-700"
                    }`}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                      alt="Mrs. Tania Shahira - AI Lead"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* AI Status Badge */}
                  <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide shadow-xs ${
                        isAiSpeaking
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-700 bg-slate-800 text-slate-300"
                      }`}
                    >
                      {isAiSpeaking ? "Đang đặt câu hỏi" : "Đang lắng nghe"}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 text-center">
                  <h2 className="flex items-center justify-center gap-1.5 text-sm font-medium text-white sm:text-base">
                    Mrs. Tania Shahira
                    <span className="py-0.2 rounded border border-emerald-800/60 bg-emerald-950/80 px-1.5 text-[10px] font-medium text-emerald-400">
                      AI Lead
                    </span>
                  </h2>
                  <p className="text-[11px] font-normal text-slate-400">UpNext Technical Panel</p>
                </div>

                <div className="pt-0.5">
                  <AudioWave isActive={isAiSpeaking} color="#10b981" barCount={20} height={22} />
                </div>
              </div>

              {/* Top Left Speaker Badge (Reference 1: TS Mrs. Tania Shahira) */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/75 px-2.5 py-1 text-xs text-slate-200 shadow-sm backdrop-blur-md">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-200">
                  TS
                </span>
                <span className="text-[11px] font-medium">Mrs. Tania Shahira</span>
              </div>

              {/* Candidate PIP Video Card (Reference 1: Top Right RT Candidate) */}
              <div className="absolute top-3.5 right-3.5 aspect-video w-36 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-lg sm:w-44">
                {isCameraOn ? (
                  <video
                    ref={candidateVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full -scale-x-100 transform object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-slate-300">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-semibold text-emerald-400">
                      {candidateInitials}
                    </div>
                  </div>
                )}

                {/* Candidate Name Tag & Live Indicator inside PIP */}
                <div className="absolute right-1.5 bottom-1.5 left-1.5 flex items-center justify-between rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] text-slate-200 backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-purple-600/80 text-[8px] font-bold text-white">
                      {candidateInitials}
                    </span>
                    <span className="truncate font-normal">{candidateName}</span>
                  </div>
                  {isCandidateSpeaking && (
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                  )}
                </div>
              </div>

              {/* Floating Center Control Bar (Reference 1: HireByte) */}
              <div className="absolute inset-x-0 bottom-3.5 flex items-center justify-center">
                <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/80 p-1 shadow-xl backdrop-blur-md">
                  {/* Microphone toggle */}
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`rounded-xl p-2.5 transition-colors ${
                      isMicOn
                        ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
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

                  {/* Camera toggle */}
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`rounded-xl p-2.5 transition-colors ${
                      isCameraOn
                        ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
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

                  {/* Speaker sound toggle */}
                  <button
                    type="button"
                    onClick={() => setIsMutedSound(!isMutedSound)}
                    className="rounded-xl bg-slate-800 p-2.5 text-slate-200 transition-colors hover:bg-slate-700"
                    title={isMutedSound ? "Bật âm thanh" : "Tắt âm thanh"}
                  >
                    {isMutedSound ? (
                      <SpeakerSimpleSlash size={16} weight="bold" />
                    ) : (
                      <SpeakerHigh size={16} weight="bold" />
                    )}
                  </button>

                  {/* End Call button */}
                  <button
                    type="button"
                    onClick={onFinishInterview}
                    className="ml-1 rounded-xl bg-red-600 p-2.5 text-white transition-colors hover:bg-red-700"
                    title="Kết thúc phỏng vấn"
                  >
                    <PhoneDisconnect size={16} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Conversation Subtitles Bar (Reference 2: Conversation now) */}
          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <AudioWave
                  isActive={isAiSpeaking || isCandidateSpeaking}
                  color="#0aa56f"
                  barCount={10}
                  height={16}
                />
                Conversation now
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span>
                  Tốc độ: <strong className="text-slate-800 dark:text-slate-200">{wpm} WPM</strong>
                </span>
                <span>•</span>
                <span>
                  Số từ: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong>
                </span>
              </div>
            </div>

            <div className="flex min-h-[48px] items-center rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-xs leading-relaxed font-normal text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
              {transcriptText ? (
                <p>&quot;{transcriptText}&quot;</p>
              ) : (
                <p className="flex items-center gap-1.5 text-slate-400 italic dark:text-slate-500">
                  <Microphone size={14} />
                  Hãy bắt đầu nói câu trả lời của bạn qua Micro hoặc gõ vào ô bên dưới...
                </p>
              )}
            </div>

            {/* Quick Answer Input Box */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && answerDraft.trim()) {
                    handleCompleteCurrentQuestion();
                  }
                }}
                placeholder="Gõ nhanh bổ sung câu trả lời của bạn..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-normal text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleCompleteCurrentQuestion}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <span>Xác nhận</span>
                <PaperPlaneRight size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* Key Meeting Notes & AI Summary Card (Reference 1: HireByte) */}
          <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-900 sm:text-sm dark:text-white">
                Key Meeting Notes — Hiring: {role.title}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <Calendar size={13} className="text-slate-500" />
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <Tag size={13} className="text-slate-500" />
                  Technical
                </span>
                <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <Users size={13} className="text-slate-500" />
                  Mrs. Tania Shahira, {candidateName}
                </span>
              </div>
            </div>

            {/* AI Summary of Meeting Box */}
            <div className="space-y-1.5 rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 dark:text-purple-300">
                <Sparkle size={14} weight="fill" className="text-purple-600 dark:text-purple-400" />
                AI Summary of Response
              </div>
              <p className="text-[11px] leading-relaxed font-normal text-slate-600 dark:text-slate-300">
                {currentQuestion.feedbackVi ||
                  "Mrs. Tania Shahira led the technical screening for the position. Candidate responses are evaluated on architectural depth, code quality, and system scalability."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="space-y-3.5 lg:col-span-4">
          <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveTab("questions")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTab === "questions"
                      ? "bg-white font-semibold text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <ListChecks size={15} />
                  Question List
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("telemetry")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTab === "telemetry"
                      ? "bg-white font-semibold text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <Waveform size={15} />
                  AI Telemetry
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("radar")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTab === "radar"
                      ? "bg-white font-semibold text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <ChartBar size={15} />
                  AI Radar
                </button>
              </div>

              <span className="font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {questions.filter((q) => q.status === "answered").length}/{questions.length}
              </span>
            </div>

            {/* TAB 1: Question List (Reference 1: HireByte) */}
            {activeTab === "questions" && (
              <div className="space-y-2.5">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = q.status === "answered";

                  return (
                    <div
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                        isCurrent
                          ? "border-emerald-500 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-500/20 dark:bg-emerald-950/20"
                          : isAnswered
                            ? "border-slate-200/70 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/30"
                            : "border-slate-200/70 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md font-mono text-[11px] font-medium ${
                              isCurrent
                                ? "bg-emerald-600 text-white"
                                : isAnswered
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {q.categoryVi}
                          </span>
                        </div>

                        {isAnswered && (
                          <CheckCircle
                            size={16}
                            weight="fill"
                            className="shrink-0 text-emerald-500"
                          />
                        )}
                      </div>

                      <h4 className="text-xs leading-relaxed font-medium text-slate-900 dark:text-white">
                        {q.question}
                      </h4>

                      {isAnswered && q.sampleAnswer && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                          {q.sampleAnswer}
                        </p>
                      )}

                      {isCurrent && (
                        <div className="mt-2 flex flex-wrap gap-1 border-t border-emerald-200/50 pt-2 dark:border-emerald-900/50">
                          {q.keyTopics.map((t, i) => (
                            <span
                              key={i}
                              className="rounded border border-emerald-200/80 bg-white px-1.5 py-0.5 text-[10px] font-normal text-slate-600 dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: AI Live Telemetry (Web Audio & Computer Vision Metrics) */}
            {activeTab === "telemetry" && (
              <div className="space-y-3.5 text-xs">
                {/* 2 Circle Gauges (Reference 2: InterviewAI) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1 rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-500 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {confidenceScore}%
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                      Tự Tin & Thần Thái
                    </p>
                  </div>

                  <div className="space-y-1 rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-blue-500 font-mono text-xs font-semibold text-blue-500">
                      {eyeContactScore}%
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                      Giao Tiếp Mắt
                    </p>
                  </div>
                </div>

                {/* Audio Telemetry Indicators */}
                <div className="space-y-2 rounded-xl border border-slate-200/60 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <Microphone size={14} className="text-emerald-500" />
                    Chỉ số Giọng nói (Web Audio)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between rounded-lg border border-slate-200/60 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
                      <span className="text-slate-400">Cường độ (RMS):</span>
                      <span className="font-mono font-bold text-emerald-600">{rmsIntensity}%</span>
                    </div>
                    <div className="flex justify-between rounded-lg border border-slate-200/60 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
                      <span className="text-slate-400">Độ ổn định:</span>
                      <span className="font-mono font-bold text-blue-500">{voiceStability}%</span>
                    </div>
                  </div>
                </div>

                {/* AI Multimodal Live Coaching Advice */}
                <div className="space-y-1 rounded-xl border border-emerald-200/70 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Đánh giá Thời Gian Thực
                  </div>
                  <p className="text-[11px] leading-relaxed font-normal">
                    Thần thái và âm điệu đang rất ổn định! Hãy tiếp tục duy trì tốc độ nói tự nhiên
                    ({wpm} WPM).
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: AI Radar & Workmap Score (Reference 2) */}
            {activeTab === "radar" && (
              <div className="space-y-3.5">
                <div className="flex flex-col items-center rounded-xl border border-slate-200/60 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="flex w-full items-center justify-between px-2 pb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Biểu đồ Năng lực AI</span>
                    <Info size={13} className="text-slate-400" />
                  </div>
                  <AiScoreRadar competencies={DEFAULT_MOCK_REPORT.competencies} size={230} />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Workmap Breakdown</span>
                    <TrendUp size={13} className="text-purple-500" />
                  </div>
                  {DEFAULT_MOCK_REPORT.workmapMetrics.map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-normal text-slate-600 dark:text-slate-400">
                          {metric.label}
                        </span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {metric.percentage}%
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${metric.percentage}%`,
                            backgroundColor: metric.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ACTION FOOTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        {/* Left Side: Hints & Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHintModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Lightbulb size={15} weight="duotone" className="text-amber-500" />
            <span>Gợi ý ý chính</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTranscriptText("");
              setAnswerDraft("");
              setWordCount(0);
              setWpm(0);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowsClockwise size={15} />
            <span>Làm lại câu này</span>
          </button>
        </div>

        {/* Right Side: Primary Next/Finish CTA */}
        <button
          type="button"
          onClick={handleCompleteCurrentQuestion}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 sm:text-sm"
        >
          <span>
            {currentQuestionIndex < questions.length - 1
              ? "Hoàn Thành & Chuyển Câu Tiếp"
              : "Hoàn Tất & Xem Báo Cáo"}
          </span>
          <ArrowRight size={15} weight="bold" />
        </button>
      </div>

      {/* Floating Modal for Hints */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Lightbulb size={18} className="text-amber-500" />
                Gợi Ý Ý Chính Cho Câu Hỏi Này
              </h4>
              <button
                type="button"
                onClick={() => setShowHintModal(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900 dark:bg-slate-800"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="mb-1 block text-[11px] font-semibold tracking-wider text-purple-600 uppercase dark:text-purple-400">
                  Từ khóa trọng tâm:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentQuestion.keyTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                  Cấu trúc trả lời khuyên dùng (STAR Method):
                </span>
                <ul className="list-disc space-y-1.5 pl-4 font-normal text-slate-600 dark:text-slate-300">
                  {currentQuestion.idealPointsVi.map((pt, i) => (
                    <li key={i} className="leading-relaxed">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
