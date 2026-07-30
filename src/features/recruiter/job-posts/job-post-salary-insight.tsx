"use client";

import { ArrowSquareOut, Coins, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useEffect, useId, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import type { JobPostSalaryInsightResponse } from "./api";

type JobPostSalaryInsightProps = Readonly<{
  insight: JobPostSalaryInsightResponse | null;
  isLoading: boolean;
  errorMessage: string;
  experienceYears: string;
  canAnalyze: boolean;
  onExperienceYearsChange: (value: string) => void;
  onAnalyze: () => void;
  onApply?: (() => void) | undefined;
}>;

const CONFIDENCE_LABELS = {
  LOW: "Tham khảo",
  MEDIUM: "Khá tin cậy",
  HIGH: "Tin cậy cao",
} as const;

/**
 * The grounded search fires ~5 Google queries before Gemini answers; measured round trips sit at
 * 18–35s. Without a visible clock the panel looks frozen and recruiters hit "Phân tích" again.
 */
const ESTIMATED_RESEARCH_SECONDS = 35;

function ResearchingIndicator() {
  const [remainingSeconds, setRemainingSeconds] = useState(ESTIMATED_RESEARCH_SECONDS);

  useEffect(() => {
    setRemainingSeconds(ESTIMATED_RESEARCH_SECONDS);
    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedRatio = (ESTIMATED_RESEARCH_SECONDS - remainingSeconds) / ESTIMATED_RESEARCH_SECONDS;

  return (
    <output className="mt-4 block rounded-lg border border-emerald-200 bg-white/90 px-3 py-3">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="relative animate-pulse text-emerald-600"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">AI đang tra cứu nguồn web...</p>
          <p className="text-xs font-normal text-slate-500">
            {remainingSeconds > 0
              ? `Dự kiến còn khoảng ${remainingSeconds} giây`
              : "Sắp xong, AI đang đối chiếu các nguồn..."}
          </p>
        </div>
      </div>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.min(elapsedRatio, 0.97) * 100}%` }}
        />
      </div>
    </output>
  );
}

const COMPARISON_LABELS = {
  NOT_PROVIDED: "Chưa có mức lương để so sánh",
  BELOW: "Mức đang nhập thấp hơn nhóm thị trường",
  ALIGNED: "Mức đang nhập nằm trong khoảng thị trường",
  ABOVE: "Mức đang nhập cao hơn nhóm thị trường",
} as const;

export function JobPostSalaryInsight({
  insight,
  isLoading,
  errorMessage,
  experienceYears,
  canAnalyze,
  onExperienceYearsChange,
  onAnalyze,
  onApply,
}: JobPostSalaryInsightProps) {
  const experienceInputId = useId();
  const isWebGrounded = insight?.available && insight.basis === "WEB_GROUNDED_AI";

  return (
    <section
      aria-labelledby="salary-insight-heading"
      className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Sparkle size={18} weight="fill" aria-hidden="true" />
          </span>
          <div>
            <h3 id="salary-insight-heading" className="text-sm font-semibold text-slate-900">
              AI tham chiếu lương thị trường
            </h3>
            <p className="mt-1 text-xs leading-5 font-normal text-slate-600">
              Kỹ năng bắt buộc xác định stack chính; kỹ năng và từ khóa liên quan giúp mở rộng nhóm
              tin cùng vai trò, cấp bậc và kinh nghiệm trên UpNext.
            </p>
          </div>
        </div>
        <div className="grid w-full gap-2">
          <div>
            <Label htmlFor={experienceInputId} className="text-xs font-medium text-slate-700">
              Số năm kinh nghiệm <span className="text-rose-600">*</span>
            </Label>
            <FormInput
              id={experienceInputId}
              type="number"
              min={0}
              max={50}
              step={0.5}
              inputMode="decimal"
              aria-required="true"
              value={experienceYears}
              onChange={(event) => onExperienceYearsChange(event.target.value)}
              placeholder="Ví dụ: 1"
              className="mt-1 h-10 bg-white font-normal"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!canAnalyze || isLoading}
            onClick={onAnalyze}
            className="w-full bg-white font-medium"
          >
            <Coins size={17} aria-hidden="true" />
            {isLoading ? "Đang phân tích..." : insight ? "Phân tích lại" : "Phân tích mức lương"}
          </Button>
        </div>
      </div>

      {!canAnalyze && !insight ? (
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs font-normal text-slate-600">
          Nhập chức danh, mô tả công việc và số năm kinh nghiệm hợp lệ để bắt đầu phân tích.
        </p>
      ) : null}

      <div aria-live="polite">
        {isLoading ? <ResearchingIndicator /> : null}

        {errorMessage ? (
          <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && insight && !insight.available ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-sm font-medium text-amber-900">Chưa đủ dữ liệu tham chiếu</p>
            <p className="mt-1 text-xs leading-5 font-normal text-amber-800">
              {insight.message} Hiện tìm thấy {insight.sampleSize} mẫu phù hợp.
            </p>
          </div>
        ) : null}

        {!isLoading && insight?.available ? (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2" aria-label="Khoảng lương thị trường theo tháng">
              <SalaryMetric label="P25" value={insight.market.p25} />
              <SalaryMetric label="Trung vị" value={insight.market.median} featured />
              <SalaryMetric label="P75" value={insight.market.p75} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium",
                  insight.confidence === "HIGH" && "bg-emerald-100 text-emerald-800",
                  insight.confidence === "MEDIUM" && "bg-sky-100 text-sky-800",
                  insight.confidence === "LOW" && "bg-amber-100 text-amber-800",
                )}
              >
                {CONFIDENCE_LABELS[insight.confidence]}
              </span>
              <span className="font-normal text-slate-600">
                {isWebGrounded
                  ? `${insight.sampleSize} nguồn web được trích dẫn`
                  : `${insight.sampleSize} tin tương đồng · ${insight.lookbackMonths} tháng gần nhất`}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">
                {isWebGrounded ? "Google Search + Gemini AI" : "Dữ liệu UpNext"}
              </span>
            </div>

            {insight.marketSummary ? (
              <p className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-xs leading-5 font-normal text-slate-700">
                {insight.marketSummary}
              </p>
            ) : null}

            <p className="text-sm font-medium text-slate-800">
              {COMPARISON_LABELS[insight.comparison.position]}
              {insight.comparison.differencePercent !== null
                ? ` (${insight.comparison.differencePercent > 0 ? "+" : ""}${insight.comparison.differencePercent}% so với trung vị)`
                : ""}
            </p>

            {insight.matchedFactors.length ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Yếu tố so khớp">
                {insight.matchedFactors.map((factor) => (
                  <li
                    key={factor}
                    className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-normal text-emerald-800"
                  >
                    {factor}
                  </li>
                ))}
              </ul>
            ) : null}

            {insight.sources?.length ? (
              <details className="group rounded-lg border border-emerald-200 bg-white/80">
                <summary className="upnext-focus cursor-pointer list-none rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 marker:hidden">
                  Nguồn web tham khảo ({insight.sources.length})
                  <span className="float-right text-xs font-normal text-emerald-700 group-open:hidden">
                    Xem nguồn
                  </span>
                  <span className="float-right hidden text-xs font-normal text-emerald-700 group-open:inline">
                    Thu gọn
                  </span>
                </summary>
                <div className="border-t border-emerald-100 px-3 py-3">
                  <ul className="space-y-2">
                    {insight.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="upnext-focus inline-flex max-w-full items-center gap-1.5 rounded text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          <span className="truncate">{source.title}</span>
                          <ArrowSquareOut size={14} className="shrink-0" aria-hidden="true" />
                          <span className="sr-only">(mở trong tab mới)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  {insight.searchedAt ? (
                    <p className="mt-3 text-[11px] font-normal text-slate-500">
                      Nghiên cứu lúc{" "}
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(insight.searchedAt))}
                    </p>
                  ) : null}
                </div>
              </details>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-emerald-200 pt-3">
              <p className="text-xs leading-5 font-normal text-slate-500">
                {isWebGrounded
                  ? "AI tổng hợp từ nguồn web công khai; hãy mở citation và kiểm tra trước khi áp dụng."
                  : "Dữ liệu tổng hợp, không phải cam kết mức lương cho ứng viên."}
              </p>
              {onApply ? (
                <Button
                  type="button"
                  onClick={onApply}
                  className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                >
                  Áp dụng khoảng {formatSalary(insight.recommended.salaryMin)} –{" "}
                  {formatSalary(insight.recommended.salaryMax)}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SalaryMetric({
  label,
  value,
  featured = false,
}: Readonly<{ label: string; value: number; featured?: boolean }>) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white px-2 py-3 text-center",
        featured ? "border-emerald-400 shadow-sm" : "border-emerald-100",
      )}
    >
      <span className="block text-[10px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <strong className="mt-1 block text-xs font-semibold text-slate-900 sm:text-sm">
        {formatSalary(value)}
      </strong>
      <span className="mt-0.5 block text-[10px] font-normal text-slate-500">/ tháng</span>
    </div>
  );
}

function formatSalary(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
