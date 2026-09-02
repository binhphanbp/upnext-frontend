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
   * Evaluate a single question answer using Multimodal telemetry data + optional Gemini API
   */
  public async evaluateQuestionAnswer(
    question: Question,
    transcript: string,
    faceTimeline: Array<{ timestamp: number; metrics: FaceMetrics }>,
    audioTimeline: Array<{ timestamp: number; metrics: AudioMetrics }>,
    fillerWords: string[],
    durationSeconds: number,
  ): Promise<QuestionAnswerRecord> {
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
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const durationMinutes = Math.max(0.1, durationSeconds / 60);
    const averageWPM = Math.round(wordCount / durationMinutes);

    // 3. Try Gemini Evaluation first if available
    let evaluation: QuestionEvaluation | null = null;
    if (this.geminiService) {
      evaluation = await this.geminiService.evaluateAnswerWithGemini(
        question,
        transcript,
        { confidence: averageConfidence, eyeContact: averageEyeContact, dominantEmotion },
        { wpm: averageWPM, fillerCount: fillerWords.length, speakingSeconds: durationSeconds },
        this.config.language,
      );
    }

    // 4. Fallback to Built-in Intelligent Heuristic Engine
    if (!evaluation) {
      evaluation = this.evaluateBuiltInHeuristics(
        question,
        transcript,
        averageConfidence,
        averageEyeContact,
        averageWPM,
        fillerWords.length,
        durationSeconds,
      );
    }

    return {
      question,
      transcript,
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
   * Built-in intelligent multimodal heuristic evaluation engine
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
      // Split key point into significant words
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

    // Content Score (0-100): based on key points covered + substantive length
    let contentScore = Math.round(keyPointRatio * 70);
    if (wordCount >= 30) contentScore += 15;
    if (wordCount >= 60) contentScore += 15;
    contentScore = Math.min(100, Math.max(25, contentScore));

    // Communication Score (0-100): based on WPM pace (ideal 110-160) and filler word frequency
    let commScore = 85;
    if (wpm < 80)
      commScore -= 15; // too slow / hesitant
    else if (wpm > 185) commScore -= 10; // speaking too fast

    // Penalize filler words
    const fillerPenalty = Math.min(25, fillerCount * 4);
    commScore = Math.max(30, Math.min(100, commScore - fillerPenalty));

    // Body Language Score (0-100): eye contact + face presence
    const bodyLanguageScore = Math.max(
      30,
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

    if (confidence >= 75) {
      strengths.push(
        isVi ? "Thần thái tự tin, điềm tĩnh khi trả lời" : "Confident and composed demeanor",
      );
    }
    if (eyeContact >= 75) {
      strengths.push(
        isVi ? "Duy trì giao tiếp mắt với camera rất tốt" : "Excellent camera eye contact",
      );
    }
    if (covered.length >= question.expectedKeyPoints.length * 0.6) {
      strengths.push(
        isVi
          ? "Nắm vững các khái niệm trọng tâm của câu hỏi"
          : "Good coverage of core technical key points",
      );
    }
    if (wpm >= 110 && wpm <= 160) {
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
    if (eyeContact < 65) {
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
    if (wpm < 85 && durationSeconds > 15) {
      suggestions.push(
        isVi
          ? "Tốc độ trả lời hơi chậm, hãy rèn luyện phản xạ trình bày mạch lạc hơn"
          : "Pace was a bit slow; aim for smoother transitions between thoughts",
      );
    }

    if (strengths.length === 0) {
      strengths.push(
        isVi
          ? "Đã hoàn thành câu trả lời trong khung thời gian quy định"
          : "Completed answer within time limit",
      );
    }
    if (suggestions.length === 0) {
      suggestions.push(
        isVi
          ? "Tiếp tục duy trì phong độ và độ tự tin hiện tại"
          : "Keep up the strong performance and composure",
      );
    }

    const feedback = isVi
      ? `Câu trả lời đạt ${score}/100 điểm. Bạn đã nêu được ${covered.length}/${question.expectedKeyPoints.length} ý trọng tâm với độ tự tin ${confidence}%. ${suggestions[0] || ""}`
      : `Answer scored ${score}/100. You addressed ${covered.length}/${question.expectedKeyPoints.length} core concepts with ${confidence}% composure. ${suggestions[0] || ""}`;

    return {
      score,
      contentScore,
      confidenceScore: confidence,
      communicationScore: commScore,
      bodyLanguageScore,
      keyPointsCovered: covered,
      keyPointsMissed: missed,
      feedback,
      strengths,
      suggestions,
    };
  }

  /**
   * Generate final comprehensive report after completing all questions
   */
  public generateFinalReport(
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

    let overallFeedback = "";
    if (overallScore >= 85) {
      overallFeedback = isVi
        ? "Xuất sắc! Bạn thể hiện sự am hiểu kiến trúc chuyên môn vững vàng, phong thái đĩnh đạc tự tin và khả năng truyền đạt rất cuốn hút."
        : "Outstanding performance! You demonstrated solid technical depth, composed body language, and articulate communication.";
    } else if (overallScore >= 70) {
      overallFeedback = isVi
        ? "Tốt! Bạn có nền tảng kiến thức chắc chắn và tác phong phỏng vấn chuyên nghiệp. Cần chú ý tinh chỉnh thêm tốc độ nói và giảm từ đệm để bài phỏng vấn sắc bén hơn."
        : "Good performance! Strong core competence and professional presence. Fine-tuning your speaking pace and eliminating fillers will elevate your delivery.";
    } else {
      overallFeedback = isVi
        ? "Tiềm năng! Bạn đã hoàn thành các câu hỏi phỏng vấn. Hãy luyện tập thêm để làm sâu sắc hơn các câu trả lời kỹ thuật và tăng cường sự tự tin khi đối diện ống kính."
        : "Solid effort! Practice refining technical answer structures and maintaining steady camera eye contact to boost overall confidence.";
    }

    return {
      sessionId: "session_" + Date.now().toString(36),
      candidateName: this.config.candidateName || (isVi ? "Ứng viên" : "Candidate"),
      role: this.config.role,
      level: this.config.level,
      language: this.config.language,
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
