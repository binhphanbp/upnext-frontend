import { Metadata } from "next";

import { AiInterviewPage } from "@/features/ai-interview";

export const metadata: Metadata = {
  title: "AI Interview Studio — Luyện Phỏng Vấn AI Trực Tiếp | UpNext",
  description:
    "Phòng luyện phỏng vấn kỹ thuật trực tiếp 1-on-1 cùng AI Technical Lead. Nhận câu hỏi chuẩn chỉ theo vị trí và phản hồi chấm điểm chuyên sâu tức thì.",
};

export default function Page() {
  return <AiInterviewPage />;
}
