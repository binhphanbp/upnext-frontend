"use client";
import confetti from "canvas-confetti";
import {
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  RotateCcw,
  CheckCircle,
  XCircle,
  Award,
  Activity,
  Mic,
  Eye,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { FinalInterviewReport, EmotionType } from "../types";

interface EvaluationReportProps {
  report: FinalInterviewReport;
  onRestart: () => void;
}

export const EvaluationReport: React.FC<EvaluationReportProps> = ({ report, onRestart }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  // Trigger celebration confetti when report opens
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        label: "XUẤT SẮC",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        textColor: "text-emerald-400",
      };
    }
    if (score >= 70) {
      return {
        label: "GIỎI",
        color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
        textColor: "text-indigo-400",
      };
    }
    if (score >= 50) {
      return {
        label: "ĐẠT YÊU CẦU",
        color: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        textColor: "text-amber-400",
      };
    }
    return {
      label: "CẦN LUYỆN TẬP THÊM",
      color: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      textColor: "text-rose-400",
    };
  };

  const badge = getScoreBadge(report.overallScore);

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `interview_report_${report.sessionId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.round(secs % 60);
    return `${mins} phút ${remainingSecs} giây`;
  };

  const emotionEmojiMap: Record<EmotionType, string> = {
    happy: "😊 Vui vẻ",
    neutral: "😐 Điềm tĩnh",
    sad: "😔 Buồn bã",
    angry: "😠 Căng thẳng",
    fearful: "😨 Hồi hộp",
    disgusted: "😒 Bối rối",
    surprised: "😲 Bất ngờ",
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-3 pt-4 pb-12 sm:px-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="flex items-center space-x-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-white">Báo Cáo Đánh Giá Phỏng Vấn AI</h1>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${badge.color}`}
              >
                {badge.label}
              </span>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                {report.interviewMode === "deep" ? "🧠 Chuyên Sâu" : "⚡ Cơ Bản"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Ứng viên: <strong className="text-slate-200">{report.candidateName}</strong> • Vị trí:{" "}
              <strong className="text-indigo-400 uppercase">{report.role}</strong> ({report.level}
              {report.educationType &&
                ` - ${report.educationType === "university" ? "Đại học" : "Cao đẳng"}`}
              ) • Thời lượng: {formatDuration(report.totalDurationSeconds)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <button
            onClick={handleExportJSON}
            title="Tải tệp JSON"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">JSON</span>
          </button>
          <button
            onClick={handlePrint}
            title="In / Lưu PDF"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden md:inline">In PDF</span>
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-purple-500"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Phỏng Vấn Mới</span>
          </button>
        </div>
      </div>

      {/* Main Scorecards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Overall Score Dial */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-center shadow-xl backdrop-blur-xl md:col-span-4">
          <span className="mb-2 flex items-center gap-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
            <Award className="h-4 w-4 text-indigo-400" /> Tổng Điểm Đánh Giá
          </span>

          <div className="relative my-3 flex items-center justify-center">
            {/* Circular score ring */}
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-slate-800">
              <div
                className="absolute inset-0 -rotate-45 transform rounded-full border-8 border-indigo-500 border-t-transparent border-r-transparent"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                }}
              />
              <div className="flex flex-col items-center">
                <span className={`text-4xl font-black ${badge.textColor}`}>
                  {report.overallScore}
                </span>
                <span className="text-[11px] font-bold text-slate-500">TRÊN 100</span>
              </div>
            </div>
          </div>

          <p className="mt-2 px-2 text-xs leading-relaxed font-medium text-slate-300">
            "{report.overallFeedback}"
          </p>
        </div>

        {/* 5 Multimodal Pillars */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl md:col-span-8">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-100 uppercase">
              <Activity className="h-4 w-4 text-indigo-400" />
              Chi Tiết 5 Trụ Cột Đánh Giá Đa Phương Thức
            </h3>
            <span className="text-xs font-semibold text-slate-400">Thang điểm 100</span>
          </div>

          <div className="space-y-3.5">
            {/* 1. Content Knowledge */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-400" /> Kiến thức & Độ chuẩn xác
                  nội dung
                </span>
                <span className="font-bold text-indigo-400">
                  {report.breakdown.contentKnowledge}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                  style={{ width: `${report.breakdown.contentKnowledge}%` }}
                />
              </div>
            </div>

            {/* 2. Confidence & Composure */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Thần thái & Tự tin (Khuôn
                  mặt)
                </span>
                <span className="font-bold text-emerald-400">
                  {report.breakdown.confidenceAndComposure}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                  style={{ width: `${report.breakdown.confidenceAndComposure}%` }}
                />
              </div>
            </div>

            {/* 3. Voice & Pace */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mic className="h-3.5 w-3.5 text-sky-400" /> Âm lượng & Tốc độ nói (
                  {report.averageWPM} WPM)
                </span>
                <span className="font-bold text-sky-400">{report.breakdown.voiceAndPace}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-700"
                  style={{ width: `${report.breakdown.voiceAndPace}%` }}
                />
              </div>
            </div>

            {/* 4. Eye Contact & Engagement */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Eye className="h-3.5 w-3.5 text-amber-400" /> Giao tiếp mắt & Góc nhìn Camera
                </span>
                <span className="font-bold text-amber-400">
                  {report.breakdown.eyeContactAndEngagement}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${report.breakdown.eyeContactAndEngagement}%` }}
                />
              </div>
            </div>

            {/* 5. Structure & Clarity */}
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Cấu trúc & Độ lưu loát (Ít từ
                  đệm)
                </span>
                <span className="font-bold text-purple-400">
                  {report.breakdown.structureAndClarity}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-purple-400 transition-all duration-700"
                  style={{ width: `${report.breakdown.structureAndClarity}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths, Improvements & Multimodal Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Key Strengths */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-400 uppercase">
            <CheckCircle className="h-4 w-4" /> Điểm Mạnh Nổi Bật
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.keyStrengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Critical Improvements */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-400 uppercase">
            <Zap className="h-4 w-4" /> Cần Cải Thiện
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.criticalImprovements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-400">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Multimodal Emotion Distribution */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl">
          <h4 className="mb-3 flex items-center justify-between text-xs font-bold tracking-wider text-indigo-400 uppercase">
            <span>Phổ Cảm Xúc Toàn Buổi</span>
            <span className="text-[10px] text-slate-400">{report.totalFillerWords} từ đệm</span>
          </h4>
          <div className="space-y-1.5 text-xs">
            {(Object.keys(report.emotionDistribution) as EmotionType[]).slice(0, 5).map((emo) => {
              const val = report.emotionDistribution[emo];
              if (val === 0) return null;
              return (
                <div key={emo} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{emotionEmojiMap[emo]}</span>
                  <span className="font-bold text-slate-200">{val}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question by Question Detailed Breakdown */}
      <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl">
        <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
          Phân Tích Chi Tiết Từng Câu Trả Lời
        </h3>

        <div className="space-y-3">
          {report.questionsAnswered.map((record, idx) => {
            const isExpanded = expandedQuestion === idx;
            const evalData = record.evaluation;

            return (
              <div
                key={record.question.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 transition"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-800/40"
                >
                  <div className="flex items-center space-x-3 pr-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-600/20 text-xs font-bold text-indigo-400">
                      #{idx + 1}
                    </span>
                    <span className="line-clamp-1 text-xs font-semibold text-slate-100 sm:text-sm">
                      {record.question.text}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center space-x-3">
                    <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-400">
                      {evalData?.score || 70}/100
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-4 border-t border-slate-800/80 p-4 pt-2 text-xs">
                    {/* Spoken Transcript */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3">
                      <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Lời thoại bạn đã trả lời (STT):
                      </div>
                      <p className="leading-relaxed text-slate-200 italic">
                        &quot;{record.transcript || "(Không ghi nhận câu trả lời rõ ràng)"}&quot;
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>
                          Độ tự tin:{" "}
                          <strong className="text-slate-200">{record.averageConfidence}%</strong>
                        </span>
                        <span>
                          Giao tiếp mắt:{" "}
                          <strong className="text-slate-200">{record.averageEyeContact}%</strong>
                        </span>
                        <span>
                          Từ đệm:{" "}
                          <strong className="text-amber-400">{record.fillerWordsCount}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Follow-up Deep-dive Thread */}
                    {record.followUpExchanges && record.followUpExchanges.length > 0 && (
                      <div className="space-y-2.5 rounded-xl border border-purple-500/30 bg-purple-950/30 p-3.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-purple-300 uppercase">
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                          Chuỗi Câu Hỏi Đào Sâu & Trả Lời ({record.followUpExchanges.length} lượt):
                        </div>
                        <div className="space-y-2.5 border-l-2 border-purple-500/40 pl-2">
                          {record.followUpExchanges.map((ex, exIdx) => (
                            <div key={exIdx} className="space-y-1 text-xs">
                              <div className="flex flex-wrap items-center gap-1 font-semibold text-purple-200">
                                <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold text-purple-200">
                                  Đào sâu #{exIdx + 1}
                                </span>
                                <span>{ex.questionText}</span>
                              </div>
                              <p className="pl-3 text-[11px] leading-relaxed text-slate-300 italic">
                                ↳ &quot;{ex.answerText || "(Ứng viên đã bấm bỏ qua)"}&quot;
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Points Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Covered */}
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                          <CheckCircle className="h-3.5 w-3.5" /> Các ý chính đã nêu
                        </div>
                        <ul className="space-y-1">
                          {evalData?.keyPointsCovered.length ? (
                            evalData.keyPointsCovered.map((kp, kIdx) => (
                              <li key={kIdx} className="flex items-start gap-1.5 text-slate-300">
                                <span className="text-emerald-400">✓</span> {kp}
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400 italic">
                              Chưa phát hiện rõ các ý trọng tâm
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Missed */}
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                        <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                          <XCircle className="h-3.5 w-3.5" /> Ý nên bổ sung thêm
                        </div>
                        <ul className="space-y-1">
                          {evalData?.keyPointsMissed.length ? (
                            evalData.keyPointsMissed.map((kp, kIdx) => (
                              <li key={kIdx} className="flex items-start gap-1.5 text-slate-300">
                                <span className="text-amber-400">•</span> {kp}
                              </li>
                            ))
                          ) : (
                            <li className="text-emerald-400 italic">
                              Đã nêu đầy đủ các ý trọng tâm
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Sample Good Answer */}
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/40 p-3">
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
                        <Sparkles className="h-3 w-3" /> Gợi ý câu trả lời mẫu chuẩn (Model Answer):
                      </div>
                      <p className="leading-relaxed text-slate-300">
                        {record.question.sampleGoodAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
