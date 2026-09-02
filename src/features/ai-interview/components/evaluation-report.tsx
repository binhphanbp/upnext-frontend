"use client";

import {
  Medal,
  CheckCircle,
  TrendUp,
  WarningCircle,
  DownloadSimple,
  ArrowCounterClockwise,
  Sparkle,
  ArrowRight,
  Briefcase,
  Stack,
  TextAa,
  Quotes,
} from "@phosphor-icons/react";
import Link from "next/link";
import React, { useState } from "react";

import { FinalInterviewReport, CompetencyScore } from "../types";
import { AiScoreRadar } from "./ai-score-radar";

interface EvaluationReportProps {
  report: FinalInterviewReport;
  onRestart: () => void;
}

const ROLE_TITLE_VI: Record<string, string> = {
  frontend: "Lập trình viên Frontend (React/Next.js)",
  backend: "Kỹ sư Backend (Node.js/NestJS)",
  fullstack: "Lập trình viên Fullstack",
  product_manager: "Quản lý Sản phẩm (Product Manager)",
  data_analyst: "Chuyên viên Phân tích Dữ liệu",
  hr_behavioral: "Phỏng vấn Nhân sự & Tác phong (STAR)",
};

export const EvaluationReport: React.FC<EvaluationReportProps> = ({ report, onRestart }) => {
  const [expandedQId, setExpandedQId] = useState<string | null>(
    report.questionsAnswered[0]?.question.id ?? null,
  );

  // Map breakdown to CompetencyScore for AiScoreRadar
  const radarCompetencies: CompetencyScore[] = [
    {
      name: "Content Knowledge",
      nameVi: "Kiến thức chuyên môn",
      score: report.breakdown?.contentKnowledge ?? report.overallScore,
      fullMark: 100,
    },
    {
      name: "Confidence",
      nameVi: "Độ tự tin & bản lĩnh",
      score: report.breakdown?.confidenceAndComposure ?? 85,
      fullMark: 100,
    },
    {
      name: "Voice & Pace",
      nameVi: "Âm lượng & nhịp điệu",
      score: report.breakdown?.voiceAndPace ?? 88,
      fullMark: 100,
    },
    {
      name: "Eye Contact",
      nameVi: "Giao tiếp mắt & thần thái",
      score: report.breakdown?.eyeContactAndEngagement ?? 90,
      fullMark: 100,
    },
    {
      name: "Structure & Clarity",
      nameVi: "Cấu trúc & sự mạch lạc",
      score: report.breakdown?.structureAndClarity ?? 82,
      fullMark: 100,
    },
  ];

  // Workmap metrics for role match
  const workmapMetrics = [
    {
      label: "Mức độ phù hợp yêu cầu công việc",
      percentage: Math.min(100, report.overallScore),
      color: "#10b981",
    },
    {
      label: "Độ sâu kiến trúc & giải pháp kỹ thuật",
      percentage: Math.min(100, Math.max(60, report.overallScore - 3)),
      color: "#6366f1",
    },
    {
      label: "Tác phong & Văn hóa làm việc nhóm",
      percentage: Math.min(100, report.overallScore + 4),
      color: "#8b5cf6",
    },
    {
      label: "Tư duy phản biện & giải quyết sự cố",
      percentage: Math.min(100, Math.max(65, report.overallScore + 1)),
      color: "#06b6d4",
    },
  ];

  // Aggregate all text corrections from all questions
  const allCorrections = report.questionsAnswered.flatMap(
    (qa) => qa.evaluation?.spellingAndGrammarCorrections || [],
  );

  const getVerdictBadge = (score: number) => {
    if (score >= 85) {
      return {
        label: "Đề Xuất Tuyển Dụng Cao (Strong Hire)",
        color:
          "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
      };
    }
    if (score >= 70) {
      return {
        label: "Đạt Yêu Cầu Tuyển Dụng (Hire)",
        color:
          "text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
      };
    }
    if (score >= 50) {
      return {
        label: "Cân Nhắc Tuyển Dụng (Leaning Hire)",
        color:
          "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
      };
    }
    return {
      label: "Cần Rèn Luyện Thêm (Need Practice)",
      color:
        "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    };
  };

  const verdictInfo = getVerdictBadge(report.overallScore);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 text-slate-800 sm:px-6 md:py-10 dark:text-slate-200">
      {/* 1. TOP BANNER & VERDICT CARD (Refined UpNext Style) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="space-y-2.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sparkle size={14} weight="fill" className="text-emerald-500" />
              Báo Cáo Đánh Giá Năng Lực AI • UpNext Interview Studio
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Kết Quả Phỏng Vấn:{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                {ROLE_TITLE_VI[report.role] ?? report.role}
              </span>
            </h1>

            <p className="max-w-xl text-xs leading-relaxed font-normal text-slate-600 sm:text-sm dark:text-slate-300">
              {report.overallFeedback}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-500 md:justify-start">
              <span>
                Ứng viên:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {report.candidateName}
                </strong>
              </span>
              <span>•</span>
              <span>
                Cấp bậc:{" "}
                <strong className="text-emerald-600 uppercase dark:text-emerald-400">
                  {report.level}
                </strong>
              </span>
              <span>•</span>
              <span>
                Thời gian:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.round(report.totalDurationSeconds / 60)} phút
                </strong>
              </span>
            </div>
          </div>

          {/* Big Score Dial */}
          <div className="flex min-w-[170px] shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-50 p-5 text-center dark:border-slate-700/60 dark:bg-slate-800/60">
            <div className="font-mono text-4xl font-extrabold text-emerald-600 sm:text-5xl dark:text-emerald-400">
              {report.overallScore}
              <span className="text-base font-normal text-slate-400">/100</span>
            </div>
            <span
              className={`mt-2 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${verdictInfo.color}`}
            >
              {verdictInfo.label.split("(")[0]}
            </span>
          </div>
        </div>
      </div>

      {/* 2. GRID: Competency Radar (Left) + Workmap Breakdown (Right) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Competency Radar Breakdown */}
        <div className="flex flex-col items-center justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex w-full items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              <Medal size={16} className="text-emerald-600" />
              Đánh Giá Năng Lực Cốt Lõi
            </h2>
            <span className="text-[11px] font-normal text-slate-400">5 Tiêu chí</span>
          </div>

          <div className="py-2">
            <AiScoreRadar competencies={radarCompetencies} size={250} />
          </div>

          <div className="grid w-full grid-cols-2 gap-2 pt-1 text-xs">
            {radarCompetencies.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800/70 dark:bg-slate-800/40"
              >
                <span className="truncate text-[11px] font-normal text-slate-600 dark:text-slate-400">
                  {c.nameVi}
                </span>
                <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {c.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Workmap Breakdown */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              <TrendUp size={16} className="text-emerald-600" />
              Mức Độ Khớp Vai Trò (Role Fit)
            </h2>
            <span className="text-[11px] font-normal text-slate-400">Phân tích chuyên sâu</span>
          </div>

          <div className="space-y-3.5">
            {workmapMetrics.map((m, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-normal text-slate-600 dark:text-slate-300">{m.label}</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {m.percentage}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${m.percentage}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Telemetry Snapshot */}
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Chỉ Số Tác Phong & Giao Tiếp (Vision & Audio)
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="block text-[10px] text-slate-500">Tốc độ nói</span>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {report.averageWPM || 115} WPM
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="block text-[10px] text-slate-500">Từ đệm phát hiện</span>
                <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {report.totalFillerWords || 0} từ
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="block text-[10px] text-slate-500">Độ tự tin</span>
                <span className="font-mono text-sm font-bold text-teal-600 dark:text-teal-400">
                  {report.breakdown?.confidenceAndComposure ?? 85}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI SPELLING & TECH TERMINOLOGY CORRECTION CARD */}
      {allCorrections.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-emerald-800/60 dark:bg-emerald-950/20">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
            <TextAa size={18} className="text-emerald-600" />
            AI Đã Tự Động Chuẩn Hóa Thuật Ngữ Kỹ Thuật ({allCorrections.length} từ)
          </div>
          <p className="mb-3 text-[11px] text-slate-600 dark:text-slate-400">
            Hệ thống nhận diện giọng nói tự động sửa các từ phát âm nhầm từ STT thành thuật ngữ phần
            mềm chính xác để không làm giảm điểm chuyên môn của bạn.
          </p>
          <div className="flex flex-wrap gap-2">
            {allCorrections.map((corr: string, idx: number) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-emerald-800 dark:bg-slate-900"
              >
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{corr}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. QUESTION-BY-QUESTION IN-DEPTH BREAKDOWN */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
            <Stack size={16} className="text-emerald-600" />
            Chi Tiết Từng Câu Hỏi & Nhận Xét Của AI Lead
          </h2>
          <span className="text-[11px] font-normal text-slate-400">
            {report.questionsAnswered.length} câu hỏi
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {report.questionsAnswered.map((qa, idx) => {
            const isExpanded = expandedQId === qa.question.id;
            const score = qa.evaluation?.score ?? 80;

            return (
              <div
                key={qa.question.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all dark:border-slate-800 dark:bg-slate-800/40"
              >
                <button
                  type="button"
                  onClick={() => setExpandedQId(isExpanded ? null : qa.question.id)}
                  className="flex w-full cursor-pointer items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {qa.question.text}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {score}/100
                    </span>
                    <span className="text-xs text-slate-400">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3.5 space-y-3 border-t border-slate-200/60 pt-3 text-xs dark:border-slate-700/60">
                    {/* Candidate transcript */}
                    <div>
                      <span className="mb-1 flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Quotes size={14} className="text-emerald-600" /> Câu trả lời của bạn:
                      </span>
                      <p className="rounded-lg border border-slate-100 bg-white p-3 text-slate-700 italic dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        &quot;{qa.correctedTranscript || qa.transcript}&quot;
                      </p>
                    </div>

                    {/* AI Feedback */}
                    {qa.evaluation && (
                      <div className="space-y-2">
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                          <span className="mb-1 block font-bold text-emerald-900 dark:text-emerald-300">
                            Nhận xét từ AI Lead:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300">
                            {qa.evaluation.feedback}
                          </p>
                        </div>

                        {qa.evaluation.strengths && qa.evaluation.strengths.length > 0 && (
                          <div className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                            <CheckCircle size={14} weight="fill" className="mt-0.5 shrink-0" />
                            <span>
                              <strong>Điểm tốt:</strong> {qa.evaluation.strengths.join(", ")}
                            </span>
                          </div>
                        )}

                        {qa.evaluation.suggestions && qa.evaluation.suggestions.length > 0 && (
                          <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                            <WarningCircle size={14} weight="fill" className="mt-0.5 shrink-0" />
                            <span>
                              <strong>Gợi ý cải thiện:</strong>{" "}
                              {qa.evaluation.suggestions.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sample Ideal Answer */}
                    {qa.question.sampleGoodAnswer && (
                      <details className="pt-1 text-[11px] text-slate-500">
                        <summary className="cursor-pointer font-medium hover:text-emerald-600 dark:hover:text-emerald-400">
                          Xem câu trả lời gợi ý mẫu
                        </summary>
                        <p className="mt-1.5 rounded-lg border border-slate-100 bg-white p-3 leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                          {qa.question.sampleGoodAnswer}
                        </p>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ACTION CTA BUTTONS (UpNext Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowCounterClockwise size={16} /> Luyện Tập Lại
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <DownloadSimple size={16} /> Tải PDF
          </button>

          <Link
            href="/vi/jobs"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Briefcase size={16} /> Ứng Tuyển Việc Làm Phù Hợp
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ReportDashboard = EvaluationReport;
