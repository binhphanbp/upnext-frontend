"use client";

import { Check, Info, Plus, Sparkle, X } from "@phosphor-icons/react";
import { useState } from "react";

import type {
  CvScreeningConfig,
  ScoringWeights,
  WeightPreset,
} from "@/features/recruiter/api/cv-screening-config-api";
import { cn } from "@/shared/lib/cn";

const CUSTOM_PROMPT_MAX_LENGTH = 1000;
const CRITERION_MAX_LENGTH = 120;
const MAX_CRITERIA_ITEMS = 10;
const WEIGHT_STEP = 5;
const WEIGHT_TOTAL = 100;

export type CvScreeningConfigFormValues = Pick<
  CvScreeningConfig,
  | "weights"
  | "weightPreset"
  | "mustHaveCriteria"
  | "niceToHaveCriteria"
  | "customPrompt"
  | "passingScore"
  | "defaultTopN"
>;

/** Ready-made splits per seniority: the point of the presets is that a
 * recruiter never has to reason about percentages to get a sane ranking. */
const WEIGHT_PRESETS: Array<{
  key: Exclude<WeightPreset, "CUSTOM">;
  label: string;
  hint: string;
  weights: ScoringWeights;
}> = [
  {
    key: "FRESHER",
    label: "Thực tập / Mới tốt nghiệp",
    hint: "Chưa có kinh nghiệm nhiều — chấm theo kỹ năng, dự án và học vấn",
    weights: { skills: 40, projects: 35, education: 20, experience: 5 },
  },
  {
    key: "MID",
    label: "Nhân viên",
    hint: "Cân bằng giữa kỹ năng và kinh nghiệm thực tế",
    weights: { skills: 35, experience: 35, projects: 20, education: 10 },
  },
  {
    key: "SENIOR",
    label: "Chuyên viên cao cấp / Quản lý",
    hint: "Ưu tiên kinh nghiệm và độ sâu dự án đã làm",
    weights: { skills: 20, experience: 50, projects: 25, education: 5 },
  },
];

const WEIGHT_ROWS: Array<{ key: keyof ScoringWeights; label: string }> = [
  { key: "skills", label: "Kỹ năng" },
  { key: "experience", label: "Kinh nghiệm" },
  { key: "projects", label: "Dự án liên quan" },
  { key: "education", label: "Học vấn" },
];

const TOP_N_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: 10, label: "Top 10" },
  { value: 20, label: "Top 20" },
  { value: 50, label: "Top 50" },
  { value: null, label: "Tất cả" },
];

export function weightsTotal(weights: ScoringWeights) {
  return weights.skills + weights.experience + weights.projects + weights.education;
}

/** The Save button is blocked unless the split is a valid 100-point split. */
export function isValidWeights(weights: ScoringWeights) {
  return (
    weightsTotal(weights) === WEIGHT_TOTAL &&
    WEIGHT_ROWS.every(({ key }) => {
      const value = weights[key];
      return Number.isInteger(value) && value >= 0 && value % WEIGHT_STEP === 0;
    })
  );
}

/** The system defaults, used until the real config loads. Mirrors
 * SYSTEM_DEFAULT_SCREENING_CONFIG on the backend. */
export const DEFAULT_CONFIG_FORM_VALUES: CvScreeningConfigFormValues = {
  weights: { skills: 40, experience: 30, projects: 20, education: 10 },
  weightPreset: null,
  mustHaveCriteria: [],
  niceToHaveCriteria: [],
  customPrompt: null,
  passingScore: null,
  defaultTopN: null,
};

/** Flattens the form values into the PUT payload, so the settings tab and the
 * ranking-screen dialog can't save different shapes. */
export function toConfigPayload(values: CvScreeningConfigFormValues) {
  return {
    weightSkills: values.weights.skills,
    weightExperience: values.weights.experience,
    weightProjects: values.weights.projects,
    weightEducation: values.weights.education,
    weightPreset: values.weightPreset,
    mustHaveCriteria: values.mustHaveCriteria,
    niceToHaveCriteria: values.niceToHaveCriteria,
    customPrompt: values.customPrompt?.trim() || null,
    passingScore: values.passingScore,
    defaultTopN: values.defaultTopN,
  };
}

function matchPreset(weights: ScoringWeights): WeightPreset {
  const preset = WEIGHT_PRESETS.find(
    (candidate) =>
      candidate.weights.skills === weights.skills &&
      candidate.weights.experience === weights.experience &&
      candidate.weights.projects === weights.projects &&
      candidate.weights.education === weights.education,
  );
  return preset?.key ?? "CUSTOM";
}

/** A free-text list of criteria as removable chips. Enter (or the + button)
 * commits the draft; duplicates and blanks are dropped. */
function CriteriaListInput({
  id,
  values,
  onChange,
  placeholder,
  accent,
}: {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  accent: "rose" | "emerald";
}) {
  const [draft, setDraft] = useState("");
  const atLimit = values.length >= MAX_CRITERIA_ITEMS;

  const addDraft = () => {
    const trimmed = draft.trim().slice(0, CRITERION_MAX_LENGTH);
    if (!trimmed || atLimit) return;
    const isDuplicate = values.some((value) => value.toLowerCase() === trimmed.toLowerCase());
    if (!isDuplicate) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  };

  return (
    <div>
      {values.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li
              key={value}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                accent === "rose"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              <span className="max-w-[240px] truncate">{value}</span>
              <button
                type="button"
                aria-label={`Xoá tiêu chí ${value}`}
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="cursor-pointer opacity-60 transition-opacity hover:opacity-100"
              >
                <X size={11} weight="bold" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          value={draft}
          maxLength={CRITERION_MAX_LENGTH}
          disabled={atLimit}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder={atLimit ? `Tối đa ${MAX_CRITERIA_ITEMS} tiêu chí` : placeholder}
          className="upnext-focus border-input h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <button
          type="button"
          aria-label="Thêm tiêu chí"
          disabled={atLimit || !draft.trim()}
          onClick={addDraft}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/**
 * The AI CV-screening config form, shared by the "AI lọc CV" screen's quick
 * settings dialog and the Cài đặt tab so the two can never drift apart.
 *
 * Fully controlled: the parent owns the values, this component only reports
 * patches. `inherited` (job scope only) drives the "đang theo cấu hình công
 * ty" hints.
 */
export function CvScreeningConfigForm({
  idPrefix,
  values,
  onChange,
  inherited,
}: {
  idPrefix: string;
  values: CvScreeningConfigFormValues;
  onChange: (patch: Partial<CvScreeningConfigFormValues>) => void;
  inherited?: Record<string, boolean> | undefined;
}) {
  const total = weightsTotal(values.weights);
  const activePreset = values.weightPreset ?? matchPreset(values.weights);

  const setWeight = (key: keyof ScoringWeights, value: number) => {
    const next = { ...values.weights, [key]: value };
    onChange({ weights: next, weightPreset: matchPreset(next) });
  };

  return (
    <div className="space-y-6">
      {/* 1. Score weighting */}
      <section>
        <SectionHeading
          title="Trọng số điểm theo cấp bậc"
          description="Chọn nhanh một preset, hoặc tự kéo trọng số cho từng tiêu chí."
        >
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold",
              total === WEIGHT_TOTAL
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
          >
            Tổng: {total}%
          </span>
        </SectionHeading>

        {inherited?.weights && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
            <Info size={13} /> Đang theo trọng số mặc định của công ty.
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          {WEIGHT_PRESETS.map((preset) => {
            const selected = activePreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onChange({ weights: preset.weights, weightPreset: preset.key })}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  {selected && <Check size={12} weight="bold" className="text-emerald-600" />}
                  {preset.label}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-slate-400">
                  {preset.hint}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 space-y-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/20">
          {WEIGHT_ROWS.map((row) => (
            <div key={row.key} className="flex items-center gap-3">
              <label
                htmlFor={`${idPrefix}_weight_${row.key}`}
                className="w-28 shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {row.label}
              </label>
              <input
                id={`${idPrefix}_weight_${row.key}`}
                type="range"
                min={0}
                max={WEIGHT_TOTAL}
                step={WEIGHT_STEP}
                value={values.weights[row.key]}
                onChange={(e) => setWeight(row.key, Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600"
              />
              <span className="w-12 shrink-0 text-right text-xs font-bold text-slate-700 dark:text-slate-200">
                {values.weights[row.key]}%
              </span>
            </div>
          ))}
          {total !== WEIGHT_TOTAL && (
            <p className="text-[11px] font-semibold text-rose-600">
              Tổng 4 tiêu chí phải bằng 100% mới lưu được (đang {total}%).
            </p>
          )}
        </div>
      </section>

      {/* 2. Real hiring criteria */}
      <section>
        <SectionHeading
          title="Tiêu chí bắt buộc"
          description="Thiếu tiêu chí nào sẽ bị cảnh báo trên bảng kết quả và bị phản ánh vào điểm tiêu chí liên quan."
        />
        {inherited?.mustHaveCriteria && values.mustHaveCriteria.length > 0 && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
            <Info size={13} /> Đang theo tiêu chí mặc định của công ty.
          </p>
        )}
        <CriteriaListInput
          id={`${idPrefix}_must_have`}
          values={values.mustHaveCriteria}
          onChange={(next) => onChange({ mustHaveCriteria: next })}
          placeholder='VD: "Ít nhất 2 năm React" rồi nhấn Enter'
          accent="rose"
        />
      </section>

      <section>
        <SectionHeading
          title="Tiêu chí ưu tiên"
          description="Có thì được cộng điểm, không có thì không bị trừ thêm."
        />
        <CriteriaListInput
          id={`${idPrefix}_nice_to_have`}
          values={values.niceToHaveCriteria}
          onChange={(next) => onChange({ niceToHaveCriteria: next })}
          placeholder='VD: "Từng làm fintech" rồi nhấn Enter'
          accent="emerald"
        />
      </section>

      {/* 3. Free-text note */}
      <section>
        <SectionHeading title="Ghi chú thêm cho AI" />
        <textarea
          id={`${idPrefix}_custom_prompt`}
          rows={3}
          maxLength={CUSTOM_PROMPT_MAX_LENGTH}
          value={values.customPrompt ?? ""}
          onChange={(e) => onChange({ customPrompt: e.target.value })}
          placeholder="VD: Ưu tiên ứng viên có thể onboard trong tháng này, làm việc tại Đà Nẵng."
          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
        />
        <p className="mt-1 text-right text-[11px] text-slate-400">
          {(values.customPrompt ?? "").length}/{CUSTOM_PROMPT_MAX_LENGTH} ký tự
        </p>
      </section>

      {/* 4. Shortlist + passing score */}
      <section>
        <SectionHeading
          title="Sàng lọc & điểm đạt"
          description="Số ứng viên đưa vào chấm điểm, và mốc điểm được coi là đạt."
        />
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Số lượng chấm điểm mặc định
            </p>
            <div
              className="flex h-10 w-fit items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950/30"
              role="group"
              aria-label="Số lượng chấm điểm mặc định"
            >
              {TOP_N_OPTIONS.map((option) => (
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
              htmlFor={`${idPrefix}_passing_score`}
              className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Điểm đạt tối thiểu (trên 100)
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`${idPrefix}_passing_score`}
                type="number"
                min={0}
                max={100}
                value={values.passingScore ?? ""}
                onChange={(e) =>
                  onChange({
                    passingScore: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Không gắn nhãn"
                className="upnext-focus border-input h-10 w-32 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700"
              />
              <p className="text-xs text-slate-400">
                {values.passingScore === null
                  ? "Để trống nếu không muốn gắn nhãn Đạt tiêu chuẩn."
                  : `Ứng viên từ ${values.passingScore} điểm trở lên được gắn nhãn "Đạt tiêu chuẩn".`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <p className="flex items-start gap-1.5 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-400 dark:bg-slate-950/20">
        <Sparkle size={13} className="mt-0.5 shrink-0" />
        Đổi trọng số sẽ xếp hạng lại các CV đã chấm ngay lập tức, không chấm lại bằng AI nên không
        tốn thêm lượt. Đổi tiêu chí hoặc ghi chú thì lượt lọc sau sẽ chấm lại bằng AI.
      </p>
    </div>
  );
}
