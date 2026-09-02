import { getApiBaseUrl } from "../config/api";
import { getQuestionsForSession } from "../data/questionBank";
import {
  InterviewRole,
  ExperienceLevel,
  Language,
  InterviewMode,
  Question,
  InterviewSessionConfig,
  QuestionAnswerRecord,
  EvaluateAnswerResponse,
  FinalInterviewReport,
  FaceMetrics,
  AudioMetrics,
  TTSVoiceInfo,
} from "../types";
import { InterviewEngine } from "./interviewEngine";
import { appLogger } from "./logger";

export class ApiClient {
  private get baseUrl(): string {
    return getApiBaseUrl();
  }

  public async getTTSVoices(lang?: Language): Promise<TTSVoiceInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tts/voices`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.voices)) {
          if (!lang) return data.voices;
          return data.voices.filter((v: TTSVoiceInfo) => v.language === lang);
        }
      }
    } catch (e) {
      console.warn("[ApiClient] Failed to fetch TTS voices from Backend, using defaults:", e);
    }
    // Default fallback voices
    const defaultVoices: TTSVoiceInfo[] = [
      {
        id: "vi-VN-HoaiMyNeural",
        name: "Hoài My (Nữ)",
        gender: "Female",
        language: "vi",
        description: "Giọng đọc truyền cảm, chuẩn phát thanh viên / MC VTV",
        isDefault: true,
      },
      {
        id: "vi-VN-NamMinhNeural",
        name: "Nam Minh (Nam)",
        gender: "Male",
        language: "vi",
        description: "Giọng nam trầm ấm, chuyên nghiệp, tự nhiên",
      },
      {
        id: "en-US-JennyNeural",
        name: "Jenny (US Female)",
        gender: "Female",
        language: "en",
        description: "Giọng nữ Mỹ chuẩn mực, phong thái phỏng vấn quốc tế",
        isDefault: true,
      },
      {
        id: "en-US-GuyNeural",
        name: "Guy (US Male)",
        gender: "Male",
        language: "en",
        description: "Giọng nam Mỹ tự nhiên, rõ ràng, dứt khoát",
      },
    ];
    if (!lang) return defaultVoices;
    return defaultVoices.filter((v) => v.language === lang);
  }

  public getTTSStreamUrl(text: string, voice?: string, rate?: number): string {
    const params = new URLSearchParams();
    params.set("text", text);
    if (voice) params.set("voice", voice);
    if (rate !== undefined) params.set("rate", rate.toString());
    return `${this.baseUrl}/api/tts/stream?${params.toString()}`;
  }

  public async getReport(sessionId: string): Promise<FinalInterviewReport | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/report`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          return data.report;
        }
      }
    } catch (e) {
      console.warn("[ApiClient] Failed to fetch session report from Backend:", e);
    }
    return null;
  }

  public async getQuestions(
    role: InterviewRole,
    level: ExperienceLevel,
    language: Language,
    count: number,
  ): Promise<Question[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/questions?role=${role}&level=${level}&language=${language}&count=${count}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.questions?.length > 0) {
          return data.questions;
        }
      }
    } catch (e) {
      console.warn("[ApiClient] Failed to fetch questions from Backend, using local fallback:", e);
    }
    // Fallback to local question bank
    return getQuestionsForSession(role, level, language, count);
  }

  public async startSession(config: InterviewSessionConfig): Promise<{
    success?: boolean;
    sessionId: string;
    questions: Question[];
  }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          interviewMode: config.interviewMode || "basic",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            success: true,
            sessionId: data.sessionId,
            questions: data.questions,
          };
        }
      }
    } catch (e) {
      console.warn("[ApiClient] Failed to start session on Backend, creating local session:", e);
    }

    // Local fallback
    const localQuestions = getQuestionsForSession(
      config.role,
      config.level,
      config.language,
      config.questionCount,
    );
    return {
      success: true,
      sessionId: "local_sess_" + Date.now().toString(36),
      questions: localQuestions,
    };
  }

  public async evaluateAnswer(
    sessionId: string,
    question: Question,
    transcript: string,
    faceTimeline: Array<{ timestamp: number; metrics: FaceMetrics }>,
    audioTimeline: Array<{ timestamp: number; metrics: AudioMetrics }>,
    fillerWords: string[],
    durationSeconds: number,
    config: InterviewSessionConfig,
    audioBase64?: string | null,
    isFollowUpAnswer?: boolean,
  ): Promise<EvaluateAnswerResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          transcript,
          faceTimeline,
          audioTimeline,
          fillerWords,
          durationSeconds,
          audioBase64: audioBase64 || undefined,
          isFollowUpAnswer: isFollowUpAnswer || false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data;
        }
      }
    } catch (e) {
      console.warn("[ApiClient] Failed to evaluate on Backend, evaluating locally:", e);
    }

    // Local fallback evaluation
    const localEngine = new InterviewEngine(config);
    const localRecord = await localEngine.evaluateQuestionAnswer(
      question,
      transcript,
      faceTimeline,
      audioTimeline,
      fillerWords,
      durationSeconds,
    );
    return {
      success: true,
      isFollowUp: false,
      answerRecord: localRecord,
    };
  }

  public async skipFollowUp(sessionId: string): Promise<EvaluateAnswerResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/skip-followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ApiClient] Failed to skip follow-up on Backend:", e);
    }
    return {
      success: false,
      isFollowUp: false,
    };
  }

  public async transcribeAudio(
    audioBlob: Blob,
    language: Language = "vi",
    sessionId?: string,
    questionId?: string,
  ): Promise<string | null> {
    const url = `${this.baseUrl}/api/stt`;
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "speech_chunk.webm");
      formData.append("language", language);
      if (sessionId) formData.append("sessionId", sessionId);
      if (questionId) formData.append("questionId", questionId);

      appLogger.api(
        `POST ${url} - Uploading audio chunk (${audioBlob.size} bytes, type: ${audioBlob.type || "audio/webm"})`,
        {
          language,
          sessionId,
          questionId,
          sizeBytes: audioBlob.size,
        },
      );

      const startTime = performance.now();
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      const durationMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        const text =
          data.text ||
          data.transcript ||
          (data.data && (data.data.text || data.data.transcript)) ||
          "";
        appLogger.api(`POST ${url} SUCCESS (${durationMs}ms) HTTP ${res.status}`, {
          text,
          response: data,
        });
        if (text && typeof text === "string") {
          return text.trim();
        }
      } else {
        const errorText = await res.text().catch(() => "");
        appLogger.error(
          "API",
          `POST ${url} FAILED (${durationMs}ms) HTTP ${res.status}: ${errorText}`,
        );
      }
    } catch (e: any) {
      appLogger.error("API", `POST ${url} NETWORK ERROR: ${e?.message || e}`, e);
    }
    return null;
  }

  public async finishSession(
    sessionId: string,
    answers: QuestionAnswerRecord[],
    totalDurationSeconds: number,
    config: InterviewSessionConfig,
  ): Promise<FinalInterviewReport> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalDurationSeconds }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          return data.report;
        }
      }
    } catch (e) {
      console.warn(
        "[ApiClient] Failed to finalize session on Backend, generating report locally:",
        e,
      );
    }

    // Local fallback report generation
    const localEngine = new InterviewEngine(config);
    return localEngine.generateFinalReport(answers, totalDurationSeconds);
  }
}

export const apiClient = new ApiClient();
