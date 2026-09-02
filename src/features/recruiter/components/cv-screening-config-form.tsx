"use client";

import { useState } from "react";

import type { ScoreCriterionKey } from "@/features/recruiter/api/cv-screening-api";
import type { CvScreeningConfig } from "@/features/recruiter/api/cv-screening-config-api";
import { cn } from "@/shared/lib/cn";

const RUBRIC_INSTRUCTION_MAX_LENGTH = 500;

const RUBRIC_TABS: Array<{ key: ScoreCriterionKey; label: string; maxScore: number }> = [
  { key: "skills", label: "Kỹ năng", maxScore: 40 },
  { key: "experience", label: "Kinh nghiệm", maxScore: 30 },
  { key: "projects", label: "Dự án liên quan", maxScore: 20 },
  { key: "education", label: "Học vấn", maxScore: 10 },
];

export type CvScreeningConfigFormValues = Pick<
  CvScreeningConfig,
  | "skillsInstructions"
  | "experienceInstructions"
  | "projectsInstructions"
  | "ignoreEducationRequirement"
  | "defaultTopN"
  | "minSimilarityScore"
>;

/** One textarea + char counter, shared by the 3 AI-scored rubric tabs
 * (skills/experience/projects). */
function RubricInstructionField({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <textarea
        id={id}
        rows={3}
        maxLength={RUBRIC_INSTRUCTION_MAX_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
      />
      <p className="mt-1 text-right text-[11px] text-slate-400">
        {value.length}/{RUBRIC_INSTRUCTION_MAX_LENGTH} ký tự
      </p>
    </div>
  );
}

/**
 * The AI CV-screening config form: guidance organized by the same 4 rubric
 * groups shown in an AI score breakdown (skills/experience/projects/
 * education), plus the default shortlist size and similarity threshold.
 * Shared between the "AI lọc CV" screen's quick-access dialog and the
 * Cài đặt > Cấu hình AI lọc CV tab so both stay in sync with the backend
 * shape and don't drift from each other.
 */
export function CvScreeningConfigForm({
  idPrefix,
  values,
  onChange,
}: {
  idPrefix: string;
  values: CvScreeningConfigFormValues;
  onChange: (patch: Partial<CvScreeningConfigFormValues>) => void;
}) {
  const [activeTab, setActiveTab] = useState<ScoreCriterionKey>("skills");

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          Hướng dẫn tùy chỉnh theo tiêu chí chấm điểm
        </p>
        <div
          className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950/30"
          role="tablist"
          aria-label="Chọn tiêu chí để tùy chỉnh"
        >
          {RUBRIC_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-xs font-bold transition-colors",
                activeTab === tab.key
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
              )}
            >
              {tab.label} <span className="text-slate-400">({tab.maxScore}đ)</span>
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/20">
          {activeTab === "skills" && (
            <RubricInstructionField
              id={`${idPrefix}_skills`}
              value={values.skillsInstructions ?? ""}
              onChange={(value) => onChange({ skillsInstructions: value })}
              placeholder='VD: "Ưu tiên ứng viên biết Docker, Kubernetes", "Bắt buộc thành thạo TypeScript"...'
            />
          )}
          {activeTab === "experience" && (
            <RubricInstructionField
              id={`${idPrefix}_experience`}
              value={values.experienceInstructions ?? ""}
              onChange={(value) => onChange({ experienceInstructions: value })}
              placeholder='VD: "Ít nhất 3 năm kinh nghiệm ngành fintech", "Ưu tiên từng làm ở công ty product"...'
            />
          )}
          {activeTab === "projects" && (
            <RubricInstructionField
              id={`${idPrefix}_projects`}
              value={values.projectsInstructions ?? ""}
              onChange={(value) => onChange({ projectsInstructions: value })}
              placeholder='VD: "Ưu tiên có dự án open-source", "Chú trọng dự án có lượng người dùng lớn"...'
            />
          )}
          {activeTab === "education" && (
            <div className="flex items-start gap-3 p-1">
              <input
                type="checkbox"
                id={`${idPrefix}_ignore_education`}
                className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                checked={values.ignoreEducationRequirement}
                onChange={(e) => onChange({ ignoreEducationRequirement: e.target.checked })}
              />
              <div>
                <label
                  htmlFor={`${idPrefix}_ignore_education`}
                  className="text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  Bỏ qua yêu cầu học vấn khi chấm điểm
                </label>
                <p className="mt-0.5 text-xs text-slate-400">
                  Học vấn được AI chấm dựa trên đối chiếu trình độ, không phải mô tả tự do -- bật
                  tùy chọn này để mọi ứng viên luôn nhận điểm học vấn tối đa (10đ), bất kể yêu cầu
                  bằng cấp của tin tuyển dụng.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          Số lượng chấm điểm mặc định
        </p>
        <div
          className="flex h-11 w-fit items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950/30"
          role="group"
          aria-label="Số lượng chấm điểm mặc định"
        >
          {(
            [
              { value: 10 as const, label: "Top 10" },
              { value: 20 as const, label: "Top 20" },
              { value: 50 as const, label: "Top 50" },
              { value: null, label: "Tất cả" },
            ] satisfies Array<{ value: CvScreeningConfig["defaultTopN"]; label: string }>
          ).map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange({ defaultTopN: option.value })}
              className={cn(
                "h-full cursor-pointer rounded-md px-3 text-xs font-bold transition-colors",
                values.defaultTopN === option.value
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}_min_similarity`}
          className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
        >
          Ngưỡng độ tương đồng tối thiểu (%)
        </label>
        <p className="mb-2 text-xs text-slate-400">
          CV có độ tương đồng với tin tuyển dụng thấp hơn ngưỡng này sẽ không lọt vào danh sách chấm
          điểm. Để trống nếu không muốn giới hạn.
        </p>
        <input
          id={`${idPrefix}_min_similarity`}
          type="number"
          min={0}
          max={100}
          value={values.minSimilarityScore ?? ""}
          onChange={(e) =>
            onChange({
              minSimilarityScore: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          placeholder="Không giới hạn"
          className="upnext-focus border-input h-11 w-40 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700"
        />
      </div>
    </div>
  );
}
