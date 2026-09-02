import { Question, QuestionEvaluation, Language, ExperienceLevel } from "../types";
import { correctSpeechTranscript } from "./textCorrection";

// Google Gemini 2.5 / 2.0 / 1.5 Model Cascade
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  /**
   * Helper to execute Gemini generation with multi-model fallback cascade
   */
  private async executeGeminiCall(
    prompt: string,
    systemInstructionText?: string,
  ): Promise<string | null> {
    if (!this.apiKey) return null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const bodyPayload: any = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Low temperature for high precision & zero Vietnamese accent loss
            responseMimeType: "application/json",
          },
        };

        if (systemInstructionText) {
          bodyPayload.systemInstruction = {
            parts: [{ text: systemInstructionText }],
          };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            return rawText;
          }
        } else {
          console.warn(
            `[Gemini 2.5] Model ${modelName} returned status ${res.status}, trying next fallback...`,
          );
        }
      } catch (e) {
        console.warn(`[Gemini 2.5] Error calling ${modelName}:`, e);
      }
    }

    return null;
  }

  /**
   * Evaluate a Candidate Answer using Gemini 2.5
   */
  public async evaluateAnswerWithGemini(
    question: Question,
    transcript: string,
    faceAverages: { confidence: number; eyeContact: number; dominantEmotion: string },
    audioAverages: { wpm: number; fillerCount: number; speakingSeconds: number },
    language: Language,
  ): Promise<QuestionEvaluation | null> {
    if (!this.apiKey) return null;

    // Clean transcript with phonetic IT term transliterator first
    const cleanedTranscript = correctSpeechTranscript(transcript).correctedText || transcript;

    const systemInstruction = `
Bạn là Trưởng ban Tuyển dụng Kỹ thuật (Lead Technical Recruiter) AI cấp cao chạy trên nền tảng Gemini 2.5.
QUY TẮC BẮT BUỘC:
1. CHÍNH TẢ & DẤU TIẾNG VIỆT: Luôn viết đúng 100% ngữ pháp và chính tả Tiếng Việt có đầy đủ dấu thanh (sắc, huyền, hỏi, ngã, nặng) và dấu mũ (â, ê, ô, ơ, ư, đ). Tuyệt đối không bao giờ nuốt dấu hoặc viết tắt (ví dụ không bao giờ viết 'va', 'vo', 'tiu chí no', 'ưu tin').
2. CHUẨN HÓA THUẬT NGỮ IT: Tự động nhận diện và nắn chỉnh mọi từ ngữ nghe nhầm / sai chính tả từ giọng nói (STT) thành thuật ngữ phần mềm chính thống (như Next.js, NestJS, React, TypeScript, useState, useEffect, RESTful API, PostgreSQL).
3. ĐÁNH GIÁ ĐÚNG CẤP BẬC: Đánh giá câu trả lời công bằng và phù hợp tuyệt đối với cấp bậc ứng viên (${question.level === "intern" ? "Thực tập sinh (Intern) - chú trọng tư duy nền tảng, sự ham học hỏi và trung thực" : question.level}).
`;

    const prompt = `
Hãy đánh giá câu trả lời phỏng vấn sau của ứng viên theo định dạng JSON chuẩn.

THÔNG TIN PHỎNG VẤN:
- Câu hỏi: "${question.text}"
- Vị trí: ${question.role} (Cấp bậc: ${question.level})
- Các điểm chính mong đợi (Key Points): ${question.expectedKeyPoints.join(", ")}
- Lời thoại ứng viên đã trả lời: "${cleanedTranscript || "(Ứng viên không trả lời hoặc trả lời quá ngắn)"}"

DỮ LIỆU ĐA PHƯƠNG THỨC (MULTIMODAL SENSORS):
- Độ tự tin khuôn mặt: ${faceAverages.confidence}% (Biểu cảm: ${faceAverages.dominantEmotion})
- Tỷ lệ giao tiếp mắt: ${faceAverages.eyeContact}%
- Tốc độ nói: ${audioAverages.wpm} WPM (Từ đệm: ${audioAverages.fillerCount} từ)
- Thời lượng nói: ${audioAverages.speakingSeconds} giây

YÊU CẦU:
Trả về DUY NHẤT một chuỗi JSON hợp lệ không chứa markdown code block với cấu trúc sau:
{
  "score": (Tổng điểm câu trả lời từ 0 đến 100),
  "contentScore": (Điểm độ chính xác & đầy đủ nội dung kỹ thuật từ 0 đến 100),
  "confidenceScore": (Điểm thần thái, tự tin và kiểm soát cảm xúc từ 0 đến 100),
  "communicationScore": (Điểm lưu loát, tốc độ nói và diễn đạt từ 0 đến 100),
  "bodyLanguageScore": (Điểm giao tiếp mắt và biểu cảm khuôn mặt từ 0 đến 100),
  "keyPointsCovered": [danh sách các ý chính ứng viên đã nêu được],
  "keyPointsMissed": [danh sách các ý chính còn thiếu],
  "feedback": "Nhận xét tổng quan súc tích, chuyên sâu bằng ${language === "vi" ? "tiếng Việt chuẩn dấu" : "tiếng Anh"}",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "suggestions": ["gợi ý cải thiện 1", "gợi ý cải thiện 2"]
}
`;

    try {
      const rawJson = await this.executeGeminiCall(prompt, systemInstruction);
      if (!rawJson) return null;

      const parsed: QuestionEvaluation = JSON.parse(rawJson);
      // Ensure feedback is orthographically clean
      if (parsed.feedback) {
        parsed.feedback = correctSpeechTranscript(parsed.feedback).correctedText;
      }
      return parsed;
    } catch (err) {
      console.error("[Gemini 2.5] Evaluation error:", err);
      return null;
    }
  }

  /**
   * Generate an Insightful, Level-Appropriate Follow-up Question using Gemini 2.5
   */
  public async generateFollowUpQuestionWithGemini(
    parentQuestion: Question,
    transcript: string,
    followUpIndex: number,
    maxFollowUps: number,
    language: Language,
  ): Promise<Question | null> {
    if (!this.apiKey) return null;

    const cleanedTranscript = correctSpeechTranscript(transcript).correctedText || transcript;

    const systemInstruction = `
Bạn là Người Phỏng vấn Tuyển dụng AI (Gemini 2.5 AI Recruiter).
QUY TẮC BẮT BUỘC:
1. CHÍNH TẢ & DẤU TIẾNG VIỆT: Câu hỏi đào sâu tạo ra PHẢI chuẩn 100% tiếng Việt có đầy đủ dấu thanh, dấu mũ, rõ ràng, gãy gọn. Tuyệt đối không nuốt dấu, không viết tắt.
2. CHUẨN HÓA THUẬT NGỮ IT: Tự động hiểu và sửa các từ ngữ nghe nhầm từ giọng nói của ứng viên (như 'NetJson' -> 'Next.js', 'React. Data Script' -> 'TypeScript'). Tuyệt đối KHÔNG trích dẫn từ sai chính tả vào câu hỏi.
3. PHÙ HỢP CẤP ĐỘ: Cấp độ ứng viên là ${parentQuestion.level}. Đối với Intern/Fresher, chỉ hỏi đào sâu vào trải nghiệm thực tế, cách giải quyết bug hoặc hiểu biết cơ bản, không hỏi kiến trúc vĩ mô.
`;

    const prompt = `
Dựa vào câu hỏi chính và câu trả lời của ứng viên, hãy tạo ra 1 câu hỏi đào sâu (Follow-up Deep Dive #${followUpIndex}/${maxFollowUps}) để kiểm tra sâu hơn hoặc giúp ứng viên làm rõ ý.

- Vị trí: ${parentQuestion.role} (Cấp bậc: ${parentQuestion.level})
- Câu hỏi chính đã hỏi: "${parentQuestion.text}"
- Câu trả lời của ứng viên: "${cleanedTranscript}"

YÊU CẦU:
Trả về DUY NHẤT một chuỗi JSON hợp lệ không chứa markdown code block:
{
  "text": "Nội dung câu hỏi đào sâu bằng ${language === "vi" ? "tiếng Việt chuẩn dấu" : "tiếng Anh"}",
  "expectedKeyPoints": ["ý mong đợi 1", "ý mong đợi 2", "ý mong đợi 3"],
  "timeLimitSeconds": 90
}
`;

    try {
      const rawJson = await this.executeGeminiCall(prompt, systemInstruction);
      if (!rawJson) return null;

      const data = JSON.parse(rawJson);
      if (!data.text) return null;

      const cleanText = correctSpeechTranscript(data.text).correctedText;

      const followUpQuestion: Question = {
        id: `followup_${parentQuestion.id}_${followUpIndex}`,
        parentQuestionId: parentQuestion.id,
        isFollowUp: true,
        followUpIndex,
        role: parentQuestion.role,
        level: parentQuestion.level,
        category: "technical",
        text: cleanText,
        expectedKeyPoints: data.expectedKeyPoints || parentQuestion.expectedKeyPoints,
        sampleGoodAnswer: "",
        timeLimitSeconds: data.timeLimitSeconds || 90,
      };

      return followUpQuestion;
    } catch (err) {
      console.error("[Gemini 2.5] Follow-up generation error:", err);
      return null;
    }
  }
}
