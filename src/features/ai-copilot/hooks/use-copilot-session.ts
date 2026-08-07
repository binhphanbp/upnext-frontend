"use client";

import { useEffect, useState } from "react";

import { getCandidateSession, type CandidateSession } from "@/features/candidate/session";

/**
 * Phiên đăng nhập của ứng viên, đọc sau khi component đã mount.
 *
 * `getCandidateSession()` đọc `localStorage` nên không gọi được lúc render trên
 * server. Trạng thái vì vậy có ba giá trị chứ không phải hai: `undefined` là
 * *chưa biết*, `null` là *chắc chắn chưa đăng nhập*. Gộp hai giá trị này làm một
 * sẽ khiến khung chat nháy qua trạng thái "cần đăng nhập" ở lần render đầu của
 * người đã đăng nhập.
 *
 * Đây là hook riêng vì cả trang đầy đủ lẫn drawer đều cần cùng một câu trả lời,
 * và cả hai đều phải trả lời *trước khi* dựng ô nhập câu hỏi.
 */
export function useCopilotSession() {
  const [session, setSession] = useState<CandidateSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(getCandidateSession());
  }, []);

  return {
    session: session ?? null,
    isSessionResolved: session !== undefined,
    isSignedIn: Boolean(session),
  };
}
