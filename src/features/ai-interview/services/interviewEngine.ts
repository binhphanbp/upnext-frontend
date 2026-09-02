import {
  Question,
  QuestionAnswerRecord,
  QuestionEvaluation,
  FinalInterviewReport,
  InterviewSessionConfig,
  EmotionType,
  FaceMetrics,
  AudioMetrics,
} from "../types";
import { GeminiService } from "./geminiService";
import { correctSpeechTranscript } from "./textCorrection";

export class InterviewEngine {
  private config: InterviewSessionConfig;
  private geminiService: GeminiService | null = null;

  constructor(config: InterviewSessionConfig) {
    this.config = config;
    if (config.geminiApiKey) {
      this.geminiService = new GeminiService(config.geminiApiKey);
    }
  }

  /**
   * Evaluate a single question answer using Multimodal telemetry data + AI Spell/Grammar correction
   */
  public async evaluateQuestionAnswer(
    question: Question,
    transcript: string,
    faceTimeline: Array<{ timestamp: number; metrics: FaceMetrics }>,
    audioTimeline: Array<{ timestamp: number; metrics: AudioMetrics }>,
    fillerWords: string[],
    durationSeconds: number,
  ): Promise<QuestionAnswerRecord> {
    // 0. Auto-correct Speech-to-Text typos, slangs, phonetic errors and tech terminology
    const correctionResult = correctSpeechTranscript(transcript);
    const cleanTranscript = correctionResult.correctedText || transcript;

    // 1. Compute aggregate Face metrics
    let totalConfidence = 0;
    let totalEyeContact = 0;
    const emotionCounts: Record<EmotionType, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
    };

    const validFaceSamples = faceTimeline.filter((f) => f.metrics.detected);
    const sampleCount = validFaceSamples.length || 1;

    validFaceSamples.forEach((sample) => {
      totalConfidence += sample.metrics.confidenceScore;
      totalEyeContact += sample.metrics.eyeContactScore;
      emotionCounts[sample.metrics.dominantEmotion]++;
    });

    const averageConfidence =
      validFaceSamples.length > 0 ? Math.round(totalConfidence / sampleCount) : 75;
    const averageEyeContact =
      validFaceSamples.length > 0 ? Math.round(totalEyeContact / sampleCount) : 80;

    let dominantEmotion: EmotionType = "neutral";
    let maxCount = -1;
    (Object.keys(emotionCounts) as EmotionType[]).forEach((emo) => {
      if (emotionCounts[emo] > maxCount) {
        maxCount = emotionCounts[emo];
        dominantEmotion = emo;
      }
    });

    // 2. Compute aggregate Audio metrics
    const words = cleanTranscript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const durationMinutes = Math.max(0.1, durationSeconds / 60);
    const averageWPM = Math.round(wordCount / durationMinutes);

    // 3. Try Gemini Evaluation first if available
    let evaluation: QuestionEvaluation | null = null;
    if (this.geminiService) {
      evaluation = await this.geminiService.evaluateAnswerWithGemini(
        question,
        cleanTranscript,
        { confidence: averageConfidence, eyeContact: averageEyeContact, dominantEmotion },
        { wpm: averageWPM, fillerCount: fillerWords.length, speakingSeconds: durationSeconds },
        this.config.language,
      );
    }

    // 4. Fallback to Built-in Intelligent Level-Aware Heuristic Engine
    if (!evaluation) {
      evaluation = this.evaluateBuiltInHeuristics(
        question,
        cleanTranscript,
        averageConfidence,
        averageEyeContact,
        averageWPM,
        fillerWords.length,
        durationSeconds,
      );
    }

    if (evaluation) {
      evaluation.correctedTranscript = cleanTranscript;
      evaluation.spellingAndGrammarCorrections = correctionResult.corrections;
    }

    return {
      question,
      transcript,
      correctedTranscript: cleanTranscript,
      audioDurationSeconds: durationSeconds,
      faceMetricsTimeline: faceTimeline,
      audioMetricsTimeline: audioTimeline,
      averageConfidence,
      averageEyeContact,
      dominantEmotion,
      fillerWordsCount: fillerWords.length,
      averageWPM,
      evaluation,
    };
  }

  /**
   * Generate Follow-up Question using Gemini 2.5
   */
  public async generateFollowUpQuestion(
    parentQuestion: Question,
    transcript: string,
    followUpIndex: number,
    maxFollowUps: number,
  ): Promise<Question | null> {
    if (this.geminiService) {
      return this.geminiService.generateFollowUpQuestionWithGemini(
        parentQuestion,
        transcript,
        followUpIndex,
        maxFollowUps,
        this.config.language,
      );
    }
    return null;
  }

  /**
   * Built-in intelligent multimodal level-aware evaluation engine
   */
  private evaluateBuiltInHeuristics(
    question: Question,
    transcript: string,
    confidence: number,
    eyeContact: number,
    wpm: number,
    fillerCount: number,
    durationSeconds: number,
  ): QuestionEvaluation {
    const textLower = transcript.toLowerCase();
    const covered: string[] = [];
    const missed: string[] = [];

    // Analyze expected key points
    question.expectedKeyPoints.forEach((point) => {
      const keywords = point
        .toLowerCase()
        .replace(/[(),/]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2);

      const hasMatch = keywords.some((kw) => textLower.includes(kw));
      if (hasMatch) {
        covered.push(point);
      } else {
        missed.push(point);
      }
    });

    const keyPointRatio =
      question.expectedKeyPoints.length > 0
        ? covered.length / question.expectedKeyPoints.length
        : 0.8;
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const isInternOrFresher = this.config.level === "intern" || this.config.level === "fresher";

    // Content Score (0-100) tailored by Level
    let contentScore = Math.round(keyPointRatio * (isInternOrFresher ? 60 : 70));
    if (wordCount >= 20) contentScore += isInternOrFresher ? 25 : 15;
    if (wordCount >= 50) contentScore += isInternOrFresher ? 20 : 15;
    contentScore = Math.min(100, Math.max(isInternOrFresher ? 40 : 25, contentScore));

    // Communication Score (0-100)
    let commScore = 85;
    if (wpm < 70) commScore -= 15;
    else if (wpm > 195) commScore -= 10;

    // Penalize filler words
    const fillerPenalty = Math.min(20, fillerCount * 3);
    commScore = Math.max(35, Math.min(100, commScore - fillerPenalty));

    // Body Language Score (0-100)
    const bodyLanguageScore = Math.max(
      35,
      Math.min(100, Math.round(eyeContact * 0.7 + confidence * 0.3)),
    );

    // Overall Score
    const score = Math.round(
      contentScore * 0.45 + confidence * 0.2 + commScore * 0.2 + bodyLanguageScore * 0.15,
    );

    // Strengths & Suggestions
    const strengths: string[] = [];
    const suggestions: string[] = [];
    const isVi = this.config.language === "vi";

    if (confidence >= 70) {
      strengths.push(
        isVi ? "Thần thái tự tin, điềm tĩnh khi trả lời" : "Confident and composed demeanor",
      );
    }
    if (eyeContact >= 70) {
      strengths.push(
        isVi ? "Duy trì giao tiếp mắt với camera rất tốt" : "Excellent camera eye contact",
      );
    }
    if (covered.length >= question.expectedKeyPoints.length * 0.5) {
      strengths.push(
        isVi
          ? isInternOrFresher
            ? "Nắm chắc kiến thức nền tảng cơ bản"
            : "Nắm vững các khái niệm trọng tâm của câu hỏi"
          : "Good coverage of core technical key points",
      );
    }
    if (wpm >= 90 && wpm <= 165) {
      strengths.push(
        isVi
          ? "Tốc độ nói vừa phải, lưu loát và dễ nghe"
          : "Optimal speaking pace and clear articulation",
      );
    }

    if (fillerCount > 3) {
      suggestions.push(
        isVi
          ? `Hạn chế sử dụng từ đệm ("à", "ừm", "kiểu như" - ghi nhận ${fillerCount} lần) bằng cách dừng 1 giây để suy nghĩ`
          : `Reduce filler words (recorded ${fillerCount} fillers) by pausing before speaking`,
      );
    }
    if (eyeContact < 60) {
      suggestions.push(
        isVi
          ? "Nên nhìn thẳng vào ống kính camera nhiều hơn thay vì nhìn sang các hướng khác"
          : "Maintain direct eye contact with the camera lens more consistently",
      );
    }
    if (missed.length > 0) {
      suggestions.push(
        isVi
          ? `Nên bổ sung thêm các khía cạnh: ${missed.slice(0, 2).join(", ")}`
          : `Consider addressing: ${missed.slice(0, 2).join(", ")}`,
      );
    }

    if (strengths.length === 0) {
      strengths.push(
        isVi
          ? "Đã hoàn thành câu trả lời trong khung thời gian quy định"
          : "Completed answer within time limit",
      );
    }

    let feedback = "";
    if (score >= 80) {
      feedback = isVi
        ? isInternOrFresher
          ? "Rất tốt! Bạn nắm vững kiến thức nền tảng và diễn đạt rành mạch, rất phù hợp với tiêu chuẩn thực tập sinh."
          : "Xuất sắc! Bạn trình bày rất đầy đủ, sâu sắc và chuyên nghiệp."
        : "Outstanding answer with solid technical depth.";
    } else if (score >= 60) {
      feedback = isVi
        ? isInternOrFresher
          ? "Khá tốt! Bạn đã nêu được ý chính. Hãy mở rộng thêm ví dụ thực tế trong đồ án để câu trả lời thuyết phục hơn."
          : "Tốt! Câu trả lời đạt yêu cầu cơ bản, cần bổ sung thêm dẫn chứng thực tế."
        : "Good answer, covering core fundamentals.";
    } else {
      feedback = isVi
        ? isInternOrFresher
          ? "Tiềm năng! Bạn có cố gắng trả lời. Hãy ôn tập thêm các khái niệm cơ bản để tự tin hơn."
          : "Cần trau dồi thêm các từ khóa chuyên môn để hoàn thiện câu trả lời."
        : "Needs more technical depth on the core topics.";
    }

    return {
      score,
      contentScore,
      confidenceScore: confidence,
      communicationScore: commScore,
      bodyLanguageScore,
      keyPointsCovered: covered,
      keyPointsMissed: missed,
      feedback,
      suggestions,
      strengths,
    };
  }

  /**
   * Aggregate complete session into Final Interview Report
   */
  public generateFinalReport(
    sessionId: string,
    answers: QuestionAnswerRecord[],
    totalDurationSeconds: number,
  ): FinalInterviewReport {
    const isVi = this.config.language === "vi";
    let totalContent = 0;
    let totalConfidence = 0;
    let totalComm = 0;
    let totalEyeContact = 0;
    let totalScore = 0;
    let totalFillers = 0;
    let totalWpm = 0;

    const emotionDist: Record<EmotionType, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
    };

    const count = answers.length || 1;

    answers.forEach((ans) => {
      const evalData = ans.evaluation;
      totalContent += evalData?.contentScore || 70;
      totalConfidence += evalData?.confidenceScore || ans.averageConfidence;
      totalComm += evalData?.communicationScore || 75;
      totalEyeContact += evalData?.bodyLanguageScore || ans.averageEyeContact;
      totalScore += evalData?.score || 70;
      totalFillers += ans.fillerWordsCount;
      totalWpm += ans.averageWPM;

      // Accumulate emotions
      ans.faceMetricsTimeline.forEach((f) => {
        if (f.metrics.detected) {
          emotionDist[f.metrics.dominantEmotion]++;
        }
      });
    });

    // Normalize emotion distribution to percentages
    const totalEmotionSamples = Object.values(emotionDist).reduce((a, b) => a + b, 0) || 1;
    (Object.keys(emotionDist) as EmotionType[]).forEach((emo) => {
      emotionDist[emo] = Math.round((emotionDist[emo] / totalEmotionSamples) * 100);
    });

    const contentKnowledge = Math.round(totalContent / count);
    const confidenceAndComposure = Math.round(totalConfidence / count);
    const voiceAndPace = Math.round(totalComm / count);
    const eyeContactAndEngagement = Math.round(totalEyeContact / count);
    const structureAndClarity = Math.round(contentKnowledge * 0.6 + voiceAndPace * 0.4);
    const overallScore = Math.round(totalScore / count);

    // Aggregate key strengths & improvements
    const allStrengths = new Set<string>();
    const allImprovements = new Set<string>();

    answers.forEach((ans) => {
      ans.evaluation?.strengths.forEach((s) => allStrengths.add(s));
      ans.evaluation?.suggestions.forEach((s) => allImprovements.add(s));
    });

    const keyStrengths = Array.from(allStrengths).slice(0, 4);
    const criticalImprovements = Array.from(allImprovements).slice(0, 4);

    const isIntern = this.config.level === "intern";

    let overallFeedback = "";
    if (overallScore >= 80) {
      overallFeedback = isVi
        ? isIntern
          ? "Xuất sắc! Bạn thể hiện nền tảng học thuật rất tốt, tư duy sáng sủa và thái độ ham học hỏi, hoàn toàn sẵn sàng cho kỳ thực tập thực tế."
          : "Xuất sắc! Bạn thể hiện sự am hiểu kiến trúc chuyên môn vững vàng, phong thái đĩnh đạc tự tin và khả năng truyền đạt rất cuốn hút."
        : "Outstanding performance! You demonstrated solid competence and composed communication.";
    } else if (overallScore >= 65) {
      overallFeedback = isVi
        ? isIntern
          ? "Rất tiềm năng! Bạn nắm được các khái niệm cơ bản. Hãy tự tin hơn khi trình bày các dự án đã làm ở trường."
          : "Tốt! Bạn có nền tảng kiến thức chắc chắn và tác phong phỏng vấn chuyên nghiệp."
        : "Good performance! Strong core competence and professional presence.";
    } else {
      overallFeedback = isVi
        ? "Tiềm năng! Bạn đã hoàn thành buổi phỏng vấn. Hãy tiếp tục thực hành làm các dự án nhỏ và luyện tập nói trước gương/camera để nâng cao phản xạ."
        : "Solid effort! Practice refining technical answer structures and maintaining steady camera eye contact.";
    }

    return {
      sessionId,
      candidateName: this.config.candidateName || (isVi ? "Ứng viên" : "Candidate"),
      role: this.config.role,
      level: this.config.level,
      educationType: this.config.educationType,
      language: this.config.language,
      interviewMode: this.config.interviewMode,
      startTime: new Date().toISOString(),
      totalDurationSeconds,
      overallScore,
      breakdown: {
        contentKnowledge,
        confidenceAndComposure,
        voiceAndPace,
        eyeContactAndEngagement,
        structureAndClarity,
      },
      emotionDistribution: emotionDist,
      totalFillerWords: totalFillers,
      averageWPM: Math.round(totalWpm / count),
      overallFeedback,
      keyStrengths,
      criticalImprovements,
      questionsAnswered: answers,
    };
  }
}
