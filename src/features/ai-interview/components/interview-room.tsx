"use client";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Clock,
  Send,
  StopCircle,
  HelpCircle,
  Settings as SettingsIcon,
  Shield,
  Volume2,
  AlertCircle,
  Server,
  FastForward,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";

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
} from "../types";
import { AIAvatar } from "./ai-avatar";
import { AudioVisualizer } from "./audio-visualizer";
import { CandidateVideo } from "./candidate-video";
import { LiveMetricsPanel } from "./live-metrics-panel";
import { LiveTranscript } from "./live-transcript";
import { SettingsModal } from "./settings-modal";

interface InterviewRoomProps {
  questions: Question[];
  config: InterviewSessionConfig;
  stream: MediaStream | null;
  onFinishInterview: (report: FinalInterviewReport) => void;
  onExit: () => void;
}

function checkAnswerCompletionKeyword(text: string): { isCompleted: boolean; cleanText: string } {
  const normalized = text.toLowerCase();

  // Check if both "câu trả lời / trả lời" AND "kết thúc / xong / hoàn thành / hết" are present
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
  const [showHint, setShowHint] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [isTranscribingChunk, setIsTranscribingChunk] = useState(false);
  const [isVoiceSubmitting, setIsVoiceSubmitting] = useState(false);

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
  const [currentWpm, setCurrentWpm] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState<string[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isTtsMuted, setIsTtsMuted] = useState(!config.enableTTS);

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

  const defaultQuestion: Question = {
    id: "q-default",
    text: "Đang tải nội dung câu hỏi phỏng vấn...",
    role: config.role,
    level: config.level,
    category: "intro",
    expectedKeyPoints: [],
    sampleGoodAnswer: "",
    timeLimitSeconds: 90,
  };
  const currentMainQuestion = questions[currentIndex] || questions[0] || defaultQuestion;
  const activeQuestion: Question = followUpState?.isActive
    ? followUpState.question
    : currentMainQuestion;

  // Process incoming text chunks & check for voice completion command
  const handleTranscriptAppend = (incomingText: string) => {
    // Completely ignore any speech / STT while AI is speaking, evaluating or generating voice
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
    // Safety guard: do not start candidate mic if AI is speaking or voice is loading
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
    setCurrentWpm(0);
    setDetectedFillers([]);
    setShowHint(false);
    faceTimelineRef.current = [];
    audioTimelineRef.current = [];
    detectedFillersRef.current = [];
    audioServiceRef.current?.resetTimers();

    // Stop any existing audio or speech
    ttsServiceRef.current.stop();
    sttServiceRef.current?.stop();
    audioRecorderRef.current.stop();

    // Start AI TTS
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

  // 3. Telemetry Polling Loop (Audio + Face sampling at 10Hz)
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

  // 4. Handle Face Detection updates from CandidateVideo (30-60 FPS real-time trigger)
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

  // 5. Replay Question TTS (pauses recording during playback to eliminate echo)
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

    // 1. Stop audio recording and extract audio Blob & Base64
    const audioBlob = await audioRecorderRef.current.stop();
    const audioBase64 = await audioRecorderRef.current.getBase64();
    sttServiceRef.current?.stop();

    // 2. Get transcript from STT or send audioBlob to Backend STT
    let rawText = typeof customFinalText === "string" ? customFinalText : transcript;
    let finalSpokenText = checkAnswerCompletionKeyword(rawText).cleanText;

    if (!finalSpokenText.trim() && audioBlob) {
      const serverTranscript = await apiClient.transcribeAudio(audioBlob, config.language);
      if (serverTranscript) {
        finalSpokenText = checkAnswerCompletionKeyword(serverTranscript).cleanText;
      }
    }

    const durationSeconds = Math.max(5, Math.round((Date.now() - questionStartTime) / 1000));
    const isFollowUpAnswer = Boolean(followUpState?.isActive);

    // Send answer telemetry + raw audio to Backend Server
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

    // Check if Backend generated a Follow-up Question (Deep-dive mode)
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

      // Reset candidate recording & timers for the follow-up question
      const now = Date.now();
      questionStartTimeRef.current = now;
      setQuestionStartTime(now);
      setElapsedQuestionSeconds(0);
      setTranscript("");
      setCurrentWpm(0);
      setDetectedFillers([]);
      faceTimelineRef.current = [];
      audioTimelineRef.current = [];
      detectedFillersRef.current = [];
      audioServiceRef.current?.resetTimers();

      isEvaluatingRef.current = false;
      setIsEvaluating(false);

      // Speak the Follow-up Question via TTS
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
        // Completed all questions -> Finalize on Backend
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

  // 7. Skip Follow-up and advance to next main question
  const handleSkipFollowUp = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    ttsServiceRef.current.stop();
    audioRecorderRef.current.stop();

    appLogger.info("VAD", "⏩ Candidate skipped follow-up question. Finalizing question answer...");
    const response = await apiClient.skipFollowUp(config.sessionId || "current_sess");
    setFollowUpState(null);
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

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col space-y-4 p-3 sm:p-6">
      {/* Top Session Status Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 shadow-lg backdrop-blur-xl">
        {/* Role & Level Info */}
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-600/20 text-indigo-400">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h2 className="flex flex-wrap items-center gap-1.5 text-xs font-black tracking-wider text-white uppercase sm:text-sm">
              Phỏng Vấn: {config.role}
              <span className="rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 uppercase">
                {config.level}
              </span>
              {config.educationType && (
                <span className="rounded border border-cyan-500/25 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  🎓 {config.educationType === "university" ? "Đại học" : "Cao đẳng"}
                </span>
              )}
              <span className="rounded border border-purple-500/25 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                {config.interviewMode === "deep" ? "🧠 Chuyên Sâu" : "⚡ Cơ Bản"}
              </span>
              {followUpState?.isActive && (
                <span className="flex animate-pulse items-center gap-1 rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  Đào Sâu #{followUpState.index}/{followUpState.max}
                </span>
              )}
            </h2>
            <div className="text-[11px] text-slate-400">
              Ứng viên: <strong className="text-slate-200">{config.candidateName}</strong>
            </div>
          </div>
        </div>

        {/* Progress & Timers */}
        <div className="flex items-center space-x-3">
          <div className="hidden items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold sm:flex">
            <span className="text-slate-400">Câu hỏi:</span>
            <span className="text-indigo-400">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-200">{formatTimer(elapsedQuestionSeconds)}</span>
            <span className="text-[10px] font-normal text-slate-500">
              / {activeQuestion.timeLimitSeconds || 90}s
            </span>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            title="Cài đặt & Máy chủ"
            className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 transition hover:bg-slate-700"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          <button
            onClick={onExit}
            title="Dừng phỏng vấn"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 transition hover:bg-rose-500/20"
          >
            <StopCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column (5 cols): AI Avatar & Question Presentation */}
        <div className="flex flex-col space-y-4 lg:col-span-5">
          <AIAvatar
            isSpeaking={isAiSpeaking}
            isEvaluating={isEvaluating}
            isLoadingVoice={isGeneratingVoice}
            questionText={displayedQuestionText}
            badge={
              followUpState?.isActive ? (
                <span className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
                  <Sparkles className="h-3 w-3 animate-spin text-amber-400" />
                  Câu hỏi đào sâu #{followUpState.index}/{followUpState.max}
                </span>
              ) : undefined
            }
            onReplayTTS={handleReplayTTS}
            isMuted={isTtsMuted}
            onToggleMute={() => setIsTtsMuted(!isTtsMuted)}
            currentEmotion={currentFaceMetrics.dominantEmotion}
          />

          <AudioVisualizer
            audioService={audioServiceRef.current}
            metrics={currentAudioMetrics}
            isRecording={!isAiSpeaking}
          />

          {showHint &&
            !isGeneratingVoice &&
            displayedQuestionText &&
            activeQuestion.expectedKeyPoints && (
              <div className="animate-fadeIn space-y-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Gợi ý các khía cạnh nên đề
                  cập:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeQuestion.expectedKeyPoints.map((kp, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[11px] text-indigo-200"
                    >
                      {kp}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Right Column (7 cols): Candidate Live Feed, STT Subtitles & Multimodal Telemetry */}
        <div className="flex flex-col space-y-4 lg:col-span-7">
          <CandidateVideo
            stream={stream}
            onMetricsUpdate={handleFaceMetricsUpdate}
            isActive={true}
          />

          <LiveTranscript
            transcript={transcript}
            onTranscriptChange={(newT) => setTranscript(newT)}
            wpm={currentWpm}
            detectedFillers={detectedFillers}
            isListening={!isAiSpeaking}
            isAiSpeaking={isAiSpeaking}
            language={config.language}
            error={sttError}
            isTranscribing={isTranscribingChunk}
            onRestart={startCandidateSTT}
          />

          <LiveMetricsPanel faceMetrics={currentFaceMetrics} audioMetrics={currentAudioMetrics} />
        </div>
      </div>

      {/* Bottom Action / Navigation Toolbar */}
      <div className="sticky bottom-2 z-30 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            <HelpCircle className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Gợi ý ý chính</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTranscript("");
              detectedFillersRef.current = [];
              setDetectedFillers([]);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xóa trả lời</span>
          </button>

          {/* Skip Follow-up Button (Only appears during follow-up questions) */}
          {followUpState?.isActive && (
            <button
              type="button"
              onClick={handleSkipFollowUp}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/80 px-3 py-2 text-xs font-bold text-purple-300 shadow-lg shadow-purple-950/50 transition hover:bg-purple-900/80 hover:text-purple-100"
              title="Bỏ qua câu hỏi đào sâu này và chuyển sang câu hỏi chính tiếp theo"
            >
              <FastForward className="h-3.5 w-3.5 text-purple-400" />
              <span>Bỏ qua hỏi sâu</span>
            </button>
          )}
        </div>

        <div className="hidden items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/60 px-3 py-1.5 text-xs text-indigo-300 lg:flex">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>
            Khẩu lệnh: Đọc{" "}
            <strong className="text-white">&quot;Câu trả lời của mình đã kết thúc&quot;</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSubmitAnswer()}
          disabled={isEvaluating}
          className={`flex items-center space-x-2 rounded-xl px-6 py-2.5 text-xs font-bold shadow-xl transition disabled:opacity-50 sm:text-sm ${
            followUpState?.isActive
              ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-purple-600/25 hover:from-purple-500 hover:to-pink-500"
              : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500"
          }`}
        >
          {isEvaluating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>AI Server Đang Đánh Giá...</span>
            </>
          ) : followUpState?.isActive ? (
            <>
              <span>Gửi Trả Lời Đào Sâu</span>
              <ArrowRight className="h-4 w-4" />
            </>
          ) : currentIndex + 1 < questions.length ? (
            <>
              <span>Hoàn Thành & Chuyển Câu Tiếp</span>
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Nộp Bài & Xem Báo Cáo Tổng Kết</span>
            </>
          )}
        </button>
      </div>

      {/* Voice Auto-Submit Toast Overlay */}
      {isVoiceSubmitting && (
        <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="flex max-w-sm flex-col items-center space-y-3 rounded-2xl border-2 border-emerald-500/80 bg-slate-900 p-6 text-center shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-6 w-6 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-slate-100">🎯 Đã Nhận Khẩu Lệnh Kết Thúc!</h3>
            <p className="text-xs font-medium text-emerald-300">
              &quot;Câu trả lời của mình đã kết thúc&quot; ➔ Đang tự động nộp câu trả lời...
            </p>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onUpdateConfig={(updates) => {
          Object.assign(config, updates);
        }}
      />
    </div>
  );
};
