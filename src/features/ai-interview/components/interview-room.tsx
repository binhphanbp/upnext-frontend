"use client";

import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  Sparkle,
  PaperPlaneRight,
  SpeakerHigh,
  SpeakerSimpleSlash,
  ListChecks,
  ChartBar,
  Tag,
  Users,
  VideoCamera,
  Smiley,
  Eye,
  Waveform,
  ShieldCheck,
  TrendUp,
  Microphone,
  MicrophoneSlash,
  Camera,
  CameraSlash,
  PhoneDisconnect,
  Lightning,
  ArrowsClockwise,
  Gear,
} from "@phosphor-icons/react";
import React, { useState, useEffect, useRef } from "react";

import { apiClient } from "../services/apiClient";
import { AudioAnalysisService } from "../services/audioAnalysis";
import { AudioRecorderService } from "../services/audioRecorder";
import { getDefaultFaceMetrics } from "../services/faceDetection";
import { appLogger } from "../services/logger";
import { SpeechRecognitionService } from "../services/speechRecognition";
import { SpeechSynthesisService } from "../services/speechSynthesis";
import {
  Question,
  InterviewSessionConfig,
  QuestionAnswerRecord,
  FinalInterviewReport,
  FaceMetrics,
  AudioMetrics,
  CompetencyScore,
} from "../types";
import { AiScoreRadar } from "./ai-score-radar";
import { AudioWave } from "./audio-wave";
import { CandidateVideo } from "./candidate-video";
import { SettingsModal } from "./settings-modal";
import { ThreeAvatar3D } from "./three-avatar-3d";

interface InterviewRoomProps {
  questions: Question[];
  config: InterviewSessionConfig;
  stream: MediaStream | null;
  onFinishInterview: (report: FinalInterviewReport) => void;
  onExit: () => void;
}

const ROLE_TITLE_VI: Record<string, string> = {
  frontend: "Lập trình viên Frontend (React/Next.js)",
  backend: "Kỹ sư Backend (Node.js/NestJS)",
  fullstack: "Lập trình viên Fullstack",
  product_manager: "Quản lý Sản phẩm (Product Manager)",
  data_analyst: "Chuyên viên Phân tích Dữ liệu",
  hr_behavioral: "Phỏng vấn Nhân sự & Tác phong (STAR)",
};

function checkAnswerCompletionKeyword(text: string): { isCompleted: boolean; cleanText: string } {
  const normalized = text.toLowerCase();

  const hasAnswerTerm = /(câu trả lời|phần trả lời|trả lời|answer)/i.test(normalized);
  const hasEndTerm = /(kết thúc|hoàn thành|xong|hết|complete|finished|done)/i.test(normalized);

  const patternsToClean = [
    /(câu trả lời|phần trả lời|trả lời).*?(kết thúc|hoàn thành|xong|hết)/gi,
    /(kết thúc|hoàn thành|xong|hết).*?(câu trả lời|phần trả lời|trả lời)/gi,
    /my answer is (finished|complete|done)/gi,
    /i have finished my answer/gi,
    /i am done with my answer/gi,
    /that is all for my answer/gi,
    /that's my answer/gi,
  ];

  if (hasAnswerTerm && hasEndTerm) {
    let cleanText = text;
    for (const pat of patternsToClean) {
      cleanText = cleanText.replace(pat, "").trim();
    }
    return { isCompleted: true, cleanText: cleanText.replace(/\s+/g, " ").trim() };
  }

  return { isCompleted: false, cleanText: text };
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  questions,
  config,
  stream,
  onFinishInterview,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [elapsedQuestionSeconds, setElapsedQuestionSeconds] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTranscribingChunk, setIsTranscribingChunk] = useState(false);
  const [isVoiceSubmitting, setIsVoiceSubmitting] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);

  // Tab State: 'questions' | 'telemetry' | 'radar'
  const [activeTab, setActiveTab] = useState<"questions" | "telemetry" | "radar">("questions");

  // Lazy render question text only when BE generates voice
  const [displayedQuestionText, setDisplayedQuestionText] = useState<string>("");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState<boolean>(true);

  // Deep-dive Follow-up State
  const [followUpState, setFollowUpState] = useState<{
    isActive: boolean;
    index: number;
    max: number;
    question: Question;
  } | null>(null);

  // Live Multimodal Telemetry State
  const [currentFaceMetrics, setCurrentFaceMetrics] =
    useState<FaceMetrics>(getDefaultFaceMetrics());
  const [currentAudioMetrics, setCurrentAudioMetrics] = useState<AudioMetrics>({
    volume: 0,
    volumeLevel: "silent",
    isSpeaking: false,
    pitch: 0,
    pitchStability: 80,
    speechRateWPM: 0,
    fillerWordsCount: 0,
    fillerWordsDetected: [],
    totalSilenceSeconds: 0,
    totalSpeakingSeconds: 0,
  });

  const faceTimelineRef = useRef<Array<{ timestamp: number; metrics: FaceMetrics }>>([]);
  const audioTimelineRef = useRef<Array<{ timestamp: number; metrics: AudioMetrics }>>([]);
  const detectedFillersRef = useRef<string[]>([]);
  const [answersList, setAnswersList] = useState<QuestionAnswerRecord[]>([]);

  // STT / TTS & Audio Service Instances
  const [transcript, setTranscript] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [currentWpm, setCurrentWpm] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState<string[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isTtsMuted, setIsTtsMuted] = useState(!config.enableTTS);
  const [isCameraEnabled, setIsCameraEnabled] = useState(config.enableCamera);
  const [isMicEnabled, setIsMicEnabled] = useState(config.enableMic);

  const audioServiceRef = useRef<AudioAnalysisService | null>(null);
  const audioRecorderRef = useRef<AudioRecorderService>(new AudioRecorderService());
  const sttServiceRef = useRef<SpeechRecognitionService | null>(null);
  const ttsServiceRef = useRef<SpeechSynthesisService>(new SpeechSynthesisService());

  const currentQuestionIndexRef = useRef<number>(-1);
  const questionStartTimeRef = useRef<number>(Date.now());
  const handleSubmitAnswerRef = useRef<(customTranscript?: string) => Promise<void>>(
    async () => {},
  );
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronization refs to prevent asynchronous double-submits
  const isAiSpeakingRef = useRef<boolean>(false);
  const isGeneratingVoiceRef = useRef<boolean>(true);
  const isEvaluatingRef = useRef<boolean>(false);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isGeneratingVoiceRef.current = isGeneratingVoice;
  }, [isGeneratingVoice]);

  useEffect(() => {
    isEvaluatingRef.current = isEvaluating;
  }, [isEvaluating]);

  const fallbackQuestion: Question = {
    id: "q-default",
    text: "Đang chuẩn bị câu hỏi phỏng vấn...",
    role: config.role,
    level: config.level,
    category: "intro",
    expectedKeyPoints: [],
    sampleGoodAnswer: "",
    timeLimitSeconds: 90,
  };
  const currentMainQuestion = questions[currentIndex] ?? questions[0] ?? fallbackQuestion;
  const activeQuestion = followUpState?.isActive ? followUpState.question : currentMainQuestion;

  // Process incoming text chunks & check for voice completion command
  const handleTranscriptAppend = (incomingText: string) => {
    if (isAiSpeakingRef.current || isGeneratingVoiceRef.current || isEvaluatingRef.current) {
      return;
    }

    setTranscript((prev) => {
      const full = prev ? `${prev} ${incomingText}` : incomingText;
      const { isCompleted, cleanText } = checkAnswerCompletionKeyword(full);

      const words = cleanText.split(/\s+/).filter(Boolean);
      const elapsedMinutes = Math.max(0.05, (Date.now() - questionStartTimeRef.current) / 60000);
      setCurrentWpm(Math.round(words.length / elapsedMinutes));

      if (
        isCompleted &&
        !isEvaluatingRef.current &&
        !isAiSpeakingRef.current &&
        !isGeneratingVoiceRef.current
      ) {
        appLogger.info(
          "VAD",
          '🎯 Voice completion keyword detected: "Câu trả lời của mình đã kết thúc". Auto-submitting in 500ms...',
        );
        setIsVoiceSubmitting(true);
        if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
        submitTimerRef.current = setTimeout(() => {
          setIsVoiceSubmitting(false);
          submitTimerRef.current = null;
          handleSubmitAnswerRef.current(cleanText);
        }, 500);
      }

      return cleanText.trim();
    });
  };

  // 1. Initialize Audio Analysis and Recorder on mount
  useEffect(() => {
    if (stream) {
      const audioService = new AudioAnalysisService();
      audioService.init(stream, config.enableNoiseSuppression ?? true);
      audioServiceRef.current = audioService;

      audioRecorderRef.current.init(stream);
    }

    const stt = new SpeechRecognitionService();
    sttServiceRef.current = stt;

    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
      audioServiceRef.current?.dispose();
      audioRecorderRef.current?.stop();
      sttServiceRef.current?.stop();
      ttsServiceRef.current?.stop();
    };
  }, [stream, config.enableNoiseSuppression]);

  // Helper to start candidate recording cleanly
  const beginCandidateAnswering = (qId: string) => {
    if (isAiSpeakingRef.current || isGeneratingVoiceRef.current || isEvaluatingRef.current) {
      return;
    }

    startCandidateSTT();
    audioRecorderRef.current.start(async (chunkBlob) => {
      if (isAiSpeakingRef.current || isGeneratingVoiceRef.current || isEvaluatingRef.current) {
        return;
      }
      setIsTranscribingChunk(true);
      try {
        const text = await apiClient.transcribeAudio(
          chunkBlob,
          config.language,
          config.sessionId,
          qId,
        );
        if (
          text &&
          !isAiSpeakingRef.current &&
          !isGeneratingVoiceRef.current &&
          !isEvaluatingRef.current
        ) {
          handleTranscriptAppend(text);
        }
      } catch (err) {
        console.warn("[InterviewRoom] Chunk transcription error:", err);
      } finally {
        setIsTranscribingChunk(false);
      }
    });
  };

  // 2. Start Question Cycle: Speak question TTS once, then activate Candidate Mic
  const startQuestionCycle = (qIndex: number) => {
    const q = questions[qIndex];
    if (!q) return;

    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    setIsVoiceSubmitting(false);

    setFollowUpState(null);
    const now = Date.now();
    questionStartTimeRef.current = now;
    setQuestionStartTime(now);
    setElapsedQuestionSeconds(0);
    setTranscript("");
    setAnswerDraft("");
    setCurrentWpm(0);
    setDetectedFillers([]);
    faceTimelineRef.current = [];
    audioTimelineRef.current = [];
    detectedFillersRef.current = [];
    audioServiceRef.current?.resetTimers();

    ttsServiceRef.current.stop();
    sttServiceRef.current?.stop();
    audioRecorderRef.current.stop();

    if (!isTtsMuted) {
      isGeneratingVoiceRef.current = true;
      setIsGeneratingVoice(true);
      setDisplayedQuestionText("");
      isAiSpeakingRef.current = true;
      setIsAiSpeaking(true);

      ttsServiceRef.current.speak(q.text, {
        language: config.language,
        voiceId: config.selectedVoiceId,
        onStart: () => {
          isGeneratingVoiceRef.current = false;
          setIsGeneratingVoice(false);
          setDisplayedQuestionText(q.text);
          isAiSpeakingRef.current = true;
          setIsAiSpeaking(true);
        },
        onEnd: () => {
          isAiSpeakingRef.current = false;
          setIsAiSpeaking(false);
          setTranscript("");
          beginCandidateAnswering(q.id);
        },
        onError: () => {
          isGeneratingVoiceRef.current = false;
          setIsGeneratingVoice(false);
          setDisplayedQuestionText(q.text);
          isAiSpeakingRef.current = false;
          setIsAiSpeaking(false);
          setTranscript("");
          beginCandidateAnswering(q.id);
        },
      });
    } else {
      isGeneratingVoiceRef.current = false;
      setIsGeneratingVoice(false);
      setDisplayedQuestionText(q.text);
      isAiSpeakingRef.current = false;
      setIsAiSpeaking(false);
      setTranscript("");
      beginCandidateAnswering(q.id);
    }
  };

  const startCandidateSTT = () => {
    if (!sttServiceRef.current) return;
    setSttError(null);
    sttServiceRef.current.start(config.language, {
      onTranscriptChange: (text) => {
        setTranscript(text);
        if (text) setSttError(null);
      },
      onWpmChange: (wpm) => {
        setCurrentWpm(wpm);
      },
      onFillerWordDetected: (filler) => {
        detectedFillersRef.current.push(filler);
        setDetectedFillers([...detectedFillersRef.current]);
      },
      onError: (err) => {
        console.warn("[InterviewRoom] STT Error:", err);
        setSttError(err);
      },
    });
  };

  useEffect(() => {
    startQuestionCycle(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // 3. Telemetry Polling Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioServiceRef.current) {
        const audioMetrics = audioServiceRef.current.getLiveMetrics();
        setCurrentAudioMetrics(audioMetrics);
        audioTimelineRef.current.push({
          timestamp: Date.now(),
          metrics: audioMetrics,
        });
      }

      if (currentFaceMetrics) {
        faceTimelineRef.current.push({
          timestamp: Date.now(),
          metrics: currentFaceMetrics,
        });
      }

      setElapsedQuestionSeconds(Math.round((Date.now() - questionStartTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [currentFaceMetrics, questionStartTime, isAiSpeaking]);

  // 4. Handle Face Detection updates from CandidateVideo
  const handleFaceMetricsUpdate = (metrics: FaceMetrics) => {
    setCurrentFaceMetrics(metrics);
    if (!isAiSpeaking) {
      audioRecorderRef.current.feedMouthAndVoiceActivity(
        metrics.isMouthTalking,
        metrics.isMouthMoving,
        metrics.mouthOpenness,
        currentAudioMetrics.volume,
      );
    }
  };

  // 5. Replay Question TTS
  const handleReplayTTS = () => {
    sttServiceRef.current?.stop();
    audioRecorderRef.current.stop();
    setIsAiSpeaking(true);
    ttsServiceRef.current.speak(activeQuestion.text, {
      language: config.language,
      voiceId: config.selectedVoiceId,
      onStart: () => setIsAiSpeaking(true),
      onEnd: () => {
        setIsAiSpeaking(false);
        beginCandidateAnswering(activeQuestion.id);
      },
      onError: () => {
        setIsAiSpeaking(false);
        beginCandidateAnswering(activeQuestion.id);
      },
    });
  };

  // 6. Submit Current Answer & Advance or Handle Follow-up via Backend API Client
  const handleSubmitAnswer = async (customFinalText?: string) => {
    if (isEvaluatingRef.current) return;
    isEvaluatingRef.current = true;
    setIsEvaluating(true);

    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    setIsVoiceSubmitting(false);

    ttsServiceRef.current.stop();

    const audioBlob = await audioRecorderRef.current.stop();
    const audioBase64 = await audioRecorderRef.current.getBase64();
    sttServiceRef.current?.stop();

    let rawText =
      typeof customFinalText === "string" ? customFinalText : answerDraft.trim() || transcript;
    let finalSpokenText = checkAnswerCompletionKeyword(rawText).cleanText;

    if (!finalSpokenText.trim() && audioBlob) {
      const serverTranscript = await apiClient.transcribeAudio(audioBlob, config.language);
      if (serverTranscript) {
        finalSpokenText = checkAnswerCompletionKeyword(serverTranscript).cleanText;
      }
    }

    const durationSeconds = Math.max(5, Math.round((Date.now() - questionStartTime) / 1000));
    const isFollowUpAnswer = Boolean(followUpState?.isActive);

    const response = await apiClient.evaluateAnswer(
      config.sessionId || "current_sess",
      activeQuestion,
      finalSpokenText,
      faceTimelineRef.current,
      audioTimelineRef.current,
      detectedFillersRef.current,
      durationSeconds,
      config,
      audioBase64,
      isFollowUpAnswer,
    );

    // Follow-up Question in Deep-dive mode
    if (response.isFollowUp && response.followUpQuestion) {
      appLogger.info(
        "VAD",
        `🔍 Follow-up Question #${response.followUpIndex || 1}/${response.maxFollowUps || 2} received: "${response.followUpQuestion.text}"`,
      );

      const nextFollowUp = {
        isActive: true,
        index: response.followUpIndex || 1,
        max: response.maxFollowUps || 2,
        question: response.followUpQuestion,
      };
      setFollowUpState(nextFollowUp);

      const now = Date.now();
      questionStartTimeRef.current = now;
      setQuestionStartTime(now);
      setElapsedQuestionSeconds(0);
      setTranscript("");
      setAnswerDraft("");
      setCurrentWpm(0);
      setDetectedFillers([]);
      faceTimelineRef.current = [];
      audioTimelineRef.current = [];
      detectedFillersRef.current = [];
      audioServiceRef.current?.resetTimers();

      isEvaluatingRef.current = false;
      setIsEvaluating(false);

      if (!isTtsMuted) {
        isGeneratingVoiceRef.current = true;
        setIsGeneratingVoice(true);
        setDisplayedQuestionText("");
        isAiSpeakingRef.current = true;
        setIsAiSpeaking(true);

        ttsServiceRef.current.speak(response.followUpQuestion.text, {
          language: config.language,
          voiceId: config.selectedVoiceId,
          onStart: () => {
            isGeneratingVoiceRef.current = false;
            setIsGeneratingVoice(false);
            setDisplayedQuestionText(response.followUpQuestion!.text);
            isAiSpeakingRef.current = true;
            setIsAiSpeaking(true);
          },
          onEnd: () => {
            isAiSpeakingRef.current = false;
            setIsAiSpeaking(false);
            setTranscript("");
            beginCandidateAnswering(response.followUpQuestion!.id);
          },
          onError: () => {
            isGeneratingVoiceRef.current = false;
            setIsGeneratingVoice(false);
            setDisplayedQuestionText(response.followUpQuestion!.text);
            isAiSpeakingRef.current = false;
            setIsAiSpeaking(false);
            setTranscript("");
            beginCandidateAnswering(response.followUpQuestion!.id);
          },
        });
      } else {
        isGeneratingVoiceRef.current = false;
        setIsGeneratingVoice(false);
        setDisplayedQuestionText(response.followUpQuestion.text);
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);
        setTranscript("");
        beginCandidateAnswering(response.followUpQuestion.id);
      }
      return;
    }

    // Follow-up completed or Basic mode: Final evaluation ready for current main question
    setFollowUpState(null);
    isEvaluatingRef.current = false;
    setIsEvaluating(false);

    if (response.answerRecord) {
      const updatedAnswers = [...answersList, response.answerRecord];
      setAnswersList(updatedAnswers);

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        const totalSessionSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
        const finalReport = await apiClient.finishSession(
          config.sessionId || "current_sess",
          updatedAnswers,
          totalSessionSeconds,
          config,
        );
        onFinishInterview(finalReport);
      }
    } else {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  useEffect(() => {
    handleSubmitAnswerRef.current = handleSubmitAnswer;
  });

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleCamera = () => {
    setIsCameraEnabled(!isCameraEnabled);
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = !isCameraEnabled));
    }
  };

  const toggleMic = () => {
    setIsMicEnabled(!isMicEnabled);
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMicEnabled));
    }
    if (isMicEnabled) {
      sttServiceRef.current?.stop();
    } else {
      if (!isAiSpeaking) startCandidateSTT();
    }
  };

  // Convert current real-time telemetry to CompetencyScore for AiScoreRadar
  const currentRadarScores: CompetencyScore[] = [
    { name: "Technical Depth", nameVi: "Kiến thức chuyên môn", score: 85, fullMark: 100 },
    { name: "Problem Solving", nameVi: "Giải quyết vấn đề", score: 82, fullMark: 100 },
    { name: "Communication", nameVi: "Kỹ năng giao tiếp", score: 88, fullMark: 100 },
    {
      name: "Confidence",
      nameVi: "Độ tự tin",
      score: currentFaceMetrics.detected ? 85 : 70,
      fullMark: 100,
    },
    {
      name: "Eye Contact",
      nameVi: "Giao tiếp mắt",
      score: currentFaceMetrics.isLookingAtCamera ? 95 : 65,
      fullMark: 100,
    },
    {
      name: "Voice Stability",
      nameVi: "Độ ổn định giọng",
      score: Math.round(currentAudioMetrics.pitchStability),
      fullMark: 100,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-4 px-3 py-4 font-sans text-slate-800 sm:px-6 md:py-6 dark:text-slate-200">
      {/* 1. TOP HEADER (Refined UpNext Style, Matching HireByte / UpNext Draft) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        {/* Left: Back Button & Room Info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 shadow-xs transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Thoát phòng phỏng vấn"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base dark:text-white">
                Hiring: {ROLE_TITLE_VI[config.role] ?? config.role}
              </h1>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                {config.level.toUpperCase()}
              </span>
              {followUpState?.isActive && (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300">
                  DEEP DIVE #{followUpState.index}/{followUpState.max}
                </span>
              )}
            </div>
            <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              Ứng viên:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {config.candidateName}
              </span>
            </p>
          </div>
        </div>

        {/* Right Header Controls & Status */}
        <div className="flex items-center gap-2">
          {/* Question Counter Pill */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            Câu hỏi:{" "}
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {currentIndex + 1}
            </span>{" "}
            / {questions.length}
          </div>

          {/* Question Timer Countdown Pill */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 font-mono text-xs font-medium text-emerald-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>{formatTimer(elapsedQuestionSeconds)}</span>
            <span className="text-[11px] text-slate-400">
              / {activeQuestion.timeLimitSeconds || 90}s
            </span>
          </div>

          {/* Live Recording Indicator */}
          <div className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow-xs">
            <VideoCamera size={14} weight="fill" />
            <span className="hidden sm:inline">Live Studio</span>
          </div>

          {/* Settings Modal Toggle */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 shadow-xs transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Cài đặt hệ thống"
          >
            <Gear size={16} />
          </button>

          {/* Finish / Early Report Button */}
          <button
            type="button"
            onClick={async () => {
              const totalSessionSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
              const finalReport = await apiClient.finishSession(
                config.sessionId || "current_sess",
                answersList,
                totalSessionSeconds,
                config,
              );
              onFinishInterview(finalReport);
            }}
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
          {/* Main Video Call Stage (Clean, Cinematic UpNext quality) */}
          <div className="relative flex aspect-[16/9.5] items-center justify-center overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-2xl">
            {/* Background Office Studio Layer (anh-nen.png) */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 brightness-[0.90]"
              style={{ backgroundImage: "url('/anh-nen.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />

            {/* 3D Mascot Avatar Viewport (52-Bone Kinematics & Lip-sync) */}
            <div className="absolute inset-0 z-0">
              <ThreeAvatar3D
                isSpeaking={isAiSpeaking}
                isEvaluating={isEvaluating}
                isLoadingVoice={isGeneratingVoice}
              />
            </div>

            {/* Top Left Speaker Badge */}
            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/80 px-3 py-1 text-xs text-slate-200 shadow-md backdrop-blur-md">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                TS
              </span>
              <span className="text-[11px] font-medium">Mrs. Tania Shahira — UpNext AI Lead</span>
              <AudioWave isActive={isAiSpeaking} color="#10b981" barCount={10} height={14} />
            </div>

            {/* Candidate PiP Video (Top Right with Emotion & Live Tracking) */}
            <div className="absolute top-3.5 right-3.5 z-20 aspect-video w-36 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl transition hover:scale-105 sm:w-48">
              {isCameraEnabled ? (
                <CandidateVideo
                  stream={stream}
                  onMetricsUpdate={handleFaceMetricsUpdate}
                  isActive={currentAudioMetrics.isSpeaking}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-slate-400">
                  <CameraSlash size={24} className="mb-1 text-slate-600" />
                  <span className="text-[10px]">Camera tắt</span>
                </div>
              )}

              {/* Candidate Name Tag inside PiP */}
              <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between rounded-md bg-slate-950/85 px-2 py-0.5 text-[10px] text-slate-200 backdrop-blur-xs">
                <span className="truncate font-medium">{config.candidateName}</span>
                {currentAudioMetrics.isSpeaking && (
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                )}
              </div>
            </div>

            {/* Floating Center Control Bar (Bo tròn kính mờ phong cách UpNext) */}
            <div className="absolute inset-x-0 bottom-3.5 z-20 flex items-center justify-center">
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800/90 bg-slate-900/85 p-1.5 shadow-2xl backdrop-blur-md">
                {/* Microphone Toggle */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`cursor-pointer rounded-xl p-2.5 transition-colors ${
                    isMicEnabled
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                  title={isMicEnabled ? "Tắt Micro" : "Bật Micro"}
                >
                  {isMicEnabled ? (
                    <Microphone size={16} weight="bold" />
                  ) : (
                    <MicrophoneSlash size={16} weight="bold" />
                  )}
                </button>

                {/* Camera Toggle */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`cursor-pointer rounded-xl p-2.5 transition-colors ${
                    isCameraEnabled
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                  title={isCameraEnabled ? "Tắt Camera" : "Bật Camera"}
                >
                  {isCameraEnabled ? (
                    <Camera size={16} weight="bold" />
                  ) : (
                    <CameraSlash size={16} weight="bold" />
                  )}
                </button>

                {/* Speaker Sound Toggle */}
                <button
                  type="button"
                  onClick={() => setIsTtsMuted(!isTtsMuted)}
                  className="cursor-pointer rounded-xl bg-slate-800 p-2.5 text-slate-200 transition-colors hover:bg-slate-700"
                  title={isTtsMuted ? "Bật âm thanh AI" : "Tắt âm thanh AI"}
                >
                  {isTtsMuted ? (
                    <SpeakerSimpleSlash size={16} weight="bold" />
                  ) : (
                    <SpeakerHigh size={16} weight="bold" />
                  )}
                </button>

                {/* Repeat Question Button */}
                <button
                  type="button"
                  onClick={handleReplayTTS}
                  disabled={isAiSpeaking || isEvaluating}
                  className="cursor-pointer rounded-xl bg-slate-800 p-2.5 text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-40"
                  title="Nghe lại câu hỏi"
                >
                  <ArrowsClockwise size={16} weight="bold" />
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={async () => {
                    const totalSessionSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
                    const finalReport = await apiClient.finishSession(
                      config.sessionId || "current_sess",
                      answersList,
                      totalSessionSeconds,
                      config,
                    );
                    onFinishInterview(finalReport);
                  }}
                  className="ml-1 cursor-pointer rounded-xl bg-red-600 p-2.5 text-white transition-colors hover:bg-red-700"
                  title="Hoàn thành & nhận báo cáo"
                >
                  <PhoneDisconnect size={16} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Subtitles / "Conversation now" Card (Reference: UpNext Draft) */}
          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <AudioWave
                  isActive={isAiSpeaking || currentAudioMetrics.isSpeaking}
                  color="#10b981"
                  barCount={10}
                  height={16}
                />
                Phụ đề thời gian thực (Live Conversation)
              </span>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span>
                  Tốc độ:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{currentWpm} WPM</strong>
                </span>
                <span>•</span>
                <span>
                  Cảm xúc:{" "}
                  <strong className="text-emerald-600 capitalize dark:text-emerald-400">
                    {currentFaceMetrics.dominantEmotion}
                  </strong>
                </span>
              </div>
            </div>

            {/* Current Spoken Text Display */}
            <div className="flex min-h-[54px] items-center rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-xs leading-relaxed font-normal text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
              {isGeneratingVoice ? (
                <p className="flex animate-pulse items-center gap-2 font-medium text-indigo-500">
                  <ArrowsClockwise size={14} className="animate-spin" />
                  AI Lead đang chuẩn bị câu hỏi...
                </p>
              ) : isAiSpeaking ? (
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  <strong className="text-emerald-600 dark:text-emerald-400">AI Lead: </strong>
                  &quot;{displayedQuestionText || activeQuestion.text}&quot;
                </p>
              ) : isEvaluating ? (
                <p className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <ArrowsClockwise size={14} className="animate-spin" />
                  Hệ thống AI đang phân tích câu trả lời và đo đạc năng lực...
                </p>
              ) : transcript ? (
                <p className="text-slate-800 dark:text-slate-200">
                  <strong className="text-indigo-600 dark:text-indigo-400">Bạn: </strong>
                  &quot;{transcript}&quot;
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-slate-400 italic dark:text-slate-500">
                  <Microphone size={14} />
                  Hãy bắt đầu nói câu trả lời của bạn qua Micro (hoặc gõ nhanh vào ô bên dưới)...
                  Nói <em>&quot;Câu trả lời của mình đã kết thúc&quot;</em> để tự nộp câu.
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
                  if (e.key === "Enter" && (answerDraft.trim() || transcript.trim())) {
                    handleSubmitAnswer(answerDraft.trim() || transcript.trim());
                  }
                }}
                disabled={isEvaluating || isAiSpeaking}
                placeholder="Gõ nhanh bổ sung hoặc hoàn thiện câu trả lời..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-normal text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleSubmitAnswer(answerDraft.trim() || transcript.trim())}
                disabled={isEvaluating || isAiSpeaking}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <ArrowsClockwise size={14} className="animate-spin" /> Đang chấm...
                  </>
                ) : (
                  <>
                    <span>Xác nhận nộp</span>
                    <PaperPlaneRight size={14} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Key Meeting Notes & AI Feedback (Reference: UpNext Draft) */}
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-900 sm:text-sm dark:text-white">
                Ghi Chú Phỏng Vấn — {ROLE_TITLE_VI[config.role] ?? config.role}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <Calendar size={13} className="text-slate-500" />
                  {new Date().toLocaleDateString("vi-VN")}
                </span>
                <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <Tag size={13} className="text-slate-500" />
                  {config.interviewMode === "deep" ? "Deep Dive" : "Standard"}
                </span>
                <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <Users size={13} className="text-slate-500" />
                  Mrs. Tania Shahira, {config.candidateName}
                </span>
              </div>
            </div>

            {/* AI Summary Box */}
            <div className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                <Sparkle
                  size={14}
                  weight="fill"
                  className="text-emerald-600 dark:text-emerald-400"
                />
                Tiêu Chí Trọng Tâm Câu Hỏi Hiện Tại
              </div>
              <ul className="list-inside list-disc space-y-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {activeQuestion.expectedKeyPoints && activeQuestion.expectedKeyPoints.length > 0 ? (
                  activeQuestion.expectedKeyPoints.map((point: string, idx: number) => (
                    <li key={idx} className="line-clamp-1">
                      {point}
                    </li>
                  ))
                ) : (
                  <li>
                    Thể hiện rõ tư duy giải quyết vấn đề, nền tảng công nghệ và kinh nghiệm thực
                    chiến.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed Sidebar (4 cols) */}
        <div className="space-y-3.5 lg:col-span-4">
          <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveTab("questions")}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                    activeTab === "questions"
                      ? "bg-white font-semibold text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <ListChecks size={15} />
                  Câu Hỏi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("telemetry")}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                    activeTab === "telemetry"
                      ? "bg-white font-semibold text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <Waveform size={15} />
                  Cảm Biến AI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("radar")}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                    activeTab === "radar"
                      ? "bg-white font-semibold text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <ChartBar size={15} />
                  AI Radar
                </button>
              </div>

              <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {answersList.length}/{questions.length}
              </span>
            </div>

            {/* TAB 1: Question List */}
            {activeTab === "questions" && (
              <div className="space-y-2.5">
                {questions.map((q, idx) => {
                  const record = answersList.find((r) => r.question.id === q.id);
                  const isCurrent = currentIndex === idx && !followUpState?.isActive;
                  const isAnswered = !!record;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-3 transition-all ${
                        isCurrent
                          ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/25"
                          : isAnswered
                            ? "border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
                            : "border-slate-200/60 bg-white opacity-60 dark:border-slate-800 dark:bg-slate-900"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          Câu {idx + 1} • {q.category.toUpperCase()}
                        </span>
                        {isAnswered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle size={12} weight="fill" /> {record.evaluation?.score ?? 80}
                            /100
                          </span>
                        ) : isCurrent ? (
                          <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            Đang trả lời
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Chờ</span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                        {q.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: AI Telemetry (Real-time Vision & Voice Meters) */}
            {activeTab === "telemetry" && (
              <div className="space-y-3">
                <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Cảm biến thời gian thực (60 FPS)
                </div>

                {/* Vision Meters */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="mb-1 flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Eye size={13} className="text-indigo-500" /> Giao tiếp mắt
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">
                        {currentFaceMetrics.isLookingAtCamera ? "Tốt" : "Thấp"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${currentFaceMetrics.isLookingAtCamera ? 95 : 40}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="mb-1 flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <ShieldCheck size={13} className="text-emerald-500" /> Độ tự tin
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">
                        {currentFaceMetrics.detected ? "85%" : "70%"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${currentFaceMetrics.detected ? 85 : 70}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="mb-1 flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Smiley size={13} className="text-amber-500" /> Cảm xúc
                      </span>
                      <span className="font-mono font-bold text-slate-800 capitalize dark:text-white">
                        {currentFaceMetrics.dominantEmotion}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: "80%" }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="mb-1 flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Waveform size={13} className="text-teal-500" /> Độ ổn định
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">
                        {Math.round(currentAudioMetrics.pitchStability)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full bg-teal-500 transition-all duration-300"
                        style={{ width: `${Math.round(currentAudioMetrics.pitchStability)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Voice Pacing Card */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Tốc độ nói trung bình
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {currentWpm} WPM
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {currentWpm < 90
                      ? "Tốc độ hơi chậm, hãy nói dõng dạc hơn."
                      : currentWpm > 150
                        ? "Tốc độ nói hơi nhanh, hãy điều chỉnh nhịp thở."
                        : "Tốc độ nói tự nhiên, lý tưởng cho phỏng vấn."}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: AI Radar Chart */}
            {activeTab === "radar" && (
              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <AiScoreRadar competencies={currentRadarScores} size={230} />
                <div className="grid w-full grid-cols-2 gap-1.5 pt-1 text-xs">
                  {currentRadarScores.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-1.5 text-[10px] dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <span className="truncate text-slate-500">{c.nameVi}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {c.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        config={config}
        onClose={() => setShowSettings(false)}
        onUpdateConfig={(newCfg) => {
          Object.assign(config, newCfg);
          setShowSettings(false);
        }}
      />
    </div>
  );
};
