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
  ShieldCheck,
  Briefcase,
  Stack,
} from "@phosphor-icons/react";
import Link from "next/link";
import React from "react";

import { InterviewEvaluationReport } from "../types";
import { AiScoreRadar } from "./ai-score-radar";

interface EvaluationReportProps {
  report: InterviewEvaluationReport;
  onRestart: () => void;
}

export const EvaluationReport: React.FC<EvaluationReportProps> = ({ report, onRestart }) => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 text-slate-800 sm:px-6 md:py-12 dark:text-slate-200">
      {/* Top Banner & Verdict Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="space-y-2.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sparkle size={14} weight="fill" className="text-emerald-500" />
              Báo Cáo Đánh Giá Năng Lực AI
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Kết Quả Phỏng Vấn:{" "}
              <span className="text-emerald-600 dark:text-emerald-400">{report.roleTitleVi}</span>
            </h1>

            <p className="max-w-xl text-xs leading-relaxed font-normal text-slate-600 sm:text-sm dark:text-slate-300">
              {report.verdictSummaryVi}
            </p>
          </div>

          {/* Big Score Dial */}
          <div className="flex min-w-[150px] shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-50 p-5 text-center dark:border-slate-700/60 dark:bg-slate-800/60">
            <div className="font-mono text-3xl font-bold text-emerald-600 sm:text-4xl dark:text-emerald-400">
              {report.overallScore}
              <span className="text-base font-normal text-slate-400">/100</span>
            </div>
            <span className="mt-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-300">
              {report.verdictTitleVi}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Competency Radar (Left 6 cols) + Workmap & Key Insights (Right 6 cols) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Competency Radar Breakdown */}
        <div className="flex flex-col items-center justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex w-full items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              <Medal size={16} className="text-emerald-600" />
              Đánh Giá Năng Lực Cốt Lõi
            </h2>
            <span className="text-[11px] font-normal text-slate-400">6 Tiêu chí</span>
          </div>

          <div className="py-2">
            <AiScoreRadar competencies={report.competencies} size={260} />
          </div>

          <div className="grid w-full grid-cols-2 gap-2 pt-1 text-xs">
            {report.competencies.map((c, idx) => (
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

        {/* Workmap Metrics & Summary */}
        <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              <TrendUp size={16} className="text-purple-600" />
              Workmap Breakdown
            </h2>
            <span className="text-[11px] font-normal text-slate-400">Độ khớp vai trò</span>
          </div>

          <div className="space-y-3.5">
            {report.workmapMetrics.map((m, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-normal text-slate-600 dark:text-slate-300">
                    {m.labelVi}
                  </span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {m.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${m.percentage}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Feedback notes */}
          <div className="space-y-1.5 rounded-xl border border-slate-200/60 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-900 dark:text-white">
              <ShieldCheck size={14} className="text-emerald-500" />
              Nhận xét tổng quan từ AI Interviewer
            </span>
            <p className="text-[11px] leading-relaxed font-normal text-slate-600 dark:text-slate-300">
              {report.aiSummaryNotesVi}
            </p>
          </div>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Strengths */}
        <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
            <CheckCircle size={16} weight="fill" className="text-emerald-600" />
            Điểm Mạnh Nổi Bật
          </h2>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            {report.strengthsVi.map((s, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-[11px] leading-relaxed font-normal"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <WarningCircle size={16} weight="bold" className="text-amber-500" />
            Điểm Cần Trau Dồi Thêm
          </h2>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            {report.improvementsVi.map((imp, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-[11px] leading-relaxed font-normal"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Question-by-Question Review */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
          <Stack size={16} className="text-emerald-600" />
          Chi Tiết Đánh Giá Từng Câu Hỏi
        </h2>

        <div className="space-y-3">
          {report.questions.map((q, idx) => (
            <div
              key={q.id}
              className="space-y-2 rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 font-mono text-[10px] font-medium text-white">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {q.questionVi}
                  </span>
                </div>
                <span className="shrink-0 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-300">
                  {q.score ?? 88}/100
                </span>
              </div>

              {/* Candidate answer text */}
              <div className="space-y-1">
                <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                  Câu trả lời của bạn:
                </span>
                <p className="rounded-lg border border-slate-200/60 bg-white p-2.5 text-[11px] leading-relaxed font-normal text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  &quot;{q.answeredText || q.sampleAnswerVi}&quot;
                </p>
              </div>

              {/* AI Feedback */}
              {q.feedbackVi && (
                <div className="flex items-start gap-1.5 rounded-lg border border-emerald-200/60 bg-emerald-50/70 p-2.5 text-[11px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <Sparkle size={14} weight="fill" className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="leading-relaxed font-normal">{q.feedbackVi}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowCounterClockwise size={15} />
          Luyện Tập Lại
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <DownloadSimple size={15} />
            Lưu Báo Cáo
          </button>

          <Link
            href="/jobs"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-emerald-700"
          >
            <Briefcase size={15} />
            Khám Phá Việc Làm Phù Hợp
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
