import { Question, QuestionEvaluation, FaceMetrics, AudioMetrics, Language } from "../types";

export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  public async evaluateAnswerWithGemini(
    question: Question,
    transcript: string,
    faceAverages: { confidence: number; eyeContact: number; dominantEmotion: string },
    audioAverages: { wpm: number; fillerCount: number; speakingSeconds: number },
    language: Language,
  ): Promise<QuestionEvaluation | null> {
    if (!this.apiKey) return null;

    try {
      const prompt = `
Bạn là chuyên gia phỏng vấn tuyển dụng AI cấp cao. Hãy đánh giá câu trả lời phỏng vấn sau của ứng viên theo định dạng JSON chuẩn.

THÔNG TIN PHỎNG VẤN:
- Câu hỏi: "${question.text}"
- Vị trí: ${question.role} (${question.level})
- Các điểm chính mong đợi (Key Points): ${question.expectedKeyPoints.join(", ")}
- Lời thoại ứng viên đã trả lời (STT Transcript): "${transcript || "(Ứng viên không trả lời hoặc trả lời quá ngắn)"}"

DỮ LIỆU ĐA PHƯƠNG THỨC (MULTIMODAL REALTIME SENSORS):
- Độ tự tin khuôn mặt trung bình: ${faceAverages.confidence}%
- Biểu cảm chủ đạo: ${faceAverages.dominantEmotion}
- Tỷ lệ giao tiếp mắt (Eye contact): ${faceAverages.eyeContact}%
- Tốc độ nói: ${audioAverages.wpm} từ/phút (WPM)
- Số từ đệm (Filler words: à, ừm, like...): ${audioAverages.fillerCount} từ
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
  "feedback": "Nhận xét tổng quan súc tích, chuyên sâu bằng ${language === "vi" ? "tiếng Việt" : "tiếng Anh"}",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "suggestions": ["gợi ý cải thiện 1", "gợi ý cải thiện 2"]
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!response.ok) {
        console.warn("[Gemini] API request failed with status:", response.status);
        return null;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const parsed: QuestionEvaluation = JSON.parse(rawText);
      return parsed;
    } catch (err) {
      console.error("[Gemini] Error during Gemini evaluation:", err);
      return null;
    }
  }
}
