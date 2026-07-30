"use client";

import { CaretDown, MagnifyingGlass, Sparkle, X } from "@phosphor-icons/react";
import { useEffect, useId, useState } from "react";

import type {
  GenerateJobPostDraftPayload,
  JobOption,
  JobPostCatalogs,
  JobPostOutputLanguage,
  JobPostPresentationStyle,
  JobPostWorkMode,
} from "@/features/recruiter/job-posts/api";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { FullScreenOverlay } from "@/shared/ui/full-screen-overlay";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

type GeneratorFormProps = Readonly<{
  catalogs: JobPostCatalogs;
  companyDescription: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: GenerateJobPostDraftPayload) => Promise<boolean>;
}>;

const ESTIMATED_GENERATE_SECONDS = 15;

function GeneratingOverlay() {
  const [remainingSeconds, setRemainingSeconds] = useState(ESTIMATED_GENERATE_SECONDS);

  useEffect(() => {
    setRemainingSeconds(ESTIMATED_GENERATE_SECONDS);
    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <FullScreenOverlay>
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white px-6 py-8 shadow-xl">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
          <Sparkle size={30} weight="fill" className="relative animate-pulse text-emerald-600" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-800">AI đang soạn JD cho bạn...</p>
          <p className="text-sm font-normal text-slate-500">
            {remainingSeconds > 0
              ? `Dự kiến còn khoảng ${remainingSeconds} giây`
              : "Sắp xong, AI đang hoàn thiện nội dung..."}
          </p>
        </div>
      </div>
    </FullScreenOverlay>
  );
}

/**
 * Recruiters edit the JD block by block after it is generated, so picking a layout up front
 * added a choice without value. Every draft now uses the skill-first layout.
 */
const PRESENTATION_STYLE: JobPostPresentationStyle = "skill_focused";

export function JobPostAiGeneratorForm({
  catalogs,
  companyDescription,
  isSubmitting,
  onCancel,
  onSubmit,
}: GeneratorFormProps) {
  const [title, setTitle] = useState("");
  const [jobCategoryId, setJobCategoryId] = useState("");
  const [experienceLevelId, setExperienceLevelId] = useState("");
  const [employmentTypeId, setEmploymentTypeId] = useState("");
  const [requiredSkillIds, setRequiredSkillIds] = useState<string[]>([]);
  const [preferredSkillIds, setPreferredSkillIds] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [description, setDescription] = useState(companyDescription);
  const [productOrDomain, setProductOrDomain] = useState("");
  const [roleObjective, setRoleObjective] = useState("");
  const [teamContext, setTeamContext] = useState("");
  const [languageRequirement, setLanguageRequirement] = useState("");
  const [workMode, setWorkMode] = useState<JobPostWorkMode | "">("");
  const [outputLanguage, setOutputLanguage] = useState<JobPostOutputLanguage>("vi");
  const [hints, setHints] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  const submit = async () => {
    const normalizedKeywords = keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    if (title.trim().length < 3) {
      setValidationMessage("Vui lòng nhập chức danh công việc.");
      return;
    }
    if (requiredSkillIds.length === 0 && normalizedKeywords.length === 0) {
      setValidationMessage("Hãy thêm ít nhất một kỹ năng hoặc từ khóa liên quan.");
      return;
    }
    const normalizedYearsOfExperience = Number(yearsOfExperience);
    if (
      yearsOfExperience.trim() === "" ||
      !Number.isFinite(normalizedYearsOfExperience) ||
      normalizedYearsOfExperience < 0 ||
      normalizedYearsOfExperience > 50
    ) {
      setValidationMessage("Vui lòng nhập số năm kinh nghiệm từ 0 đến 50.");
      return;
    }

    setValidationMessage("");
    const succeeded = await onSubmit({
      title: title.trim(),
      requiredSkillIds,
      preferredSkillIds,
      keywords: normalizedKeywords,
      outputLanguage,
      presentationStyle: PRESENTATION_STYLE,
      ...(jobCategoryId ? { jobCategoryId } : {}),
      ...(experienceLevelId ? { experienceLevelId } : {}),
      ...(employmentTypeId ? { employmentTypeId } : {}),
      yearsOfExperience: String(normalizedYearsOfExperience),
      ...(description.trim() ? { companyDescription: description.trim() } : {}),
      ...(productOrDomain.trim() ? { productOrDomain: productOrDomain.trim() } : {}),
      ...(roleObjective.trim() ? { roleObjective: roleObjective.trim() } : {}),
      ...(teamContext.trim() ? { teamContext: teamContext.trim() } : {}),
      ...(languageRequirement.trim() ? { languageRequirement: languageRequirement.trim() } : {}),
      ...(workMode ? { workMode } : {}),
      ...(hints.trim() ? { hints: hints.trim() } : {}),
    });

    if (succeeded) {
      setTitle("");
      setJobCategoryId("");
      setExperienceLevelId("");
      setEmploymentTypeId("");
      setRequiredSkillIds([]);
      setPreferredSkillIds([]);
      setKeywords("");
      setYearsOfExperience("");
      setDescription(companyDescription);
      setProductOrDomain("");
      setRoleObjective("");
      setTeamContext("");
      setLanguageRequirement("");
      setWorkMode("");
      setOutputLanguage("vi");
      setHints("");
    }
  };

  return (
    <form
      aria-busy={isSubmitting}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="upnext-shadow overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
    >
      <header className="border-b border-slate-100 px-5 py-4 sm:px-8">
        <h1 className="text-md sm:text-md flex items-start gap-2 font-bold text-slate-800">
          <Sparkle size={22} className="text-emerald-600" weight="fill" />
          <span>
            Tạo JD tự động với <span className="whitespace-nowrap text-emerald-700">UpNext AI</span>
          </span>
        </h1>
      </header>

      <div className="relative px-5 py-6 sm:px-8">
        {isSubmitting ? <GeneratingOverlay /> : null}
        <div
          className={cn(
            "space-y-6",
            isSubmitting && "pointer-events-none opacity-40 blur-[1px] select-none",
          )}
        >
          <section className="space-y-4" aria-labelledby="ai-job-basics-heading">
            <div>
              <Label htmlFor="ai-job-title" className="text-sm font-medium text-slate-800">
                Chức danh công việc <span className="text-rose-600">*</span>
              </Label>
              <FormInput
                id="ai-job-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Senior React Developer"
                className="mt-1.5 font-normal"
              />
            </div>

            <AiSkillPicker
              id="ai-required-skills"
              label="Kỹ năng bắt buộc"
              options={catalogs.skills}
              selectedIds={requiredSkillIds}
              onChange={setRequiredSkillIds}
              placeholder="Tìm React, TypeScript, Node.js..."
            />

            <div>
              <Label htmlFor="ai-job-keywords" className="text-sm font-medium text-slate-700">
                Thêm kỹ năng hoặc từ khóa liên quan
              </Label>
              <FormInput
                id="ai-job-keywords"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="Fintech, Microservices, Agile — phân cách bằng dấu phẩy"
                className="mt-1.5 font-normal"
              />
              <p className="mt-1.5 text-xs font-normal text-slate-500">
                Dùng cho công nghệ chưa có trong danh mục hoặc bối cảnh đặc thù của dự án.
              </p>
            </div>

            <div>
              <Label
                htmlFor="ai-company-description"
                className="text-sm font-medium text-slate-700"
              >
                Mô tả về công ty
              </Label>
              <Textarea
                id="ai-company-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Sản phẩm, lĩnh vực, quy mô và môi trường làm việc..."
                className="mt-1.5 font-normal"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField
                id="ai-output-language"
                label="Ngôn ngữ JD"
                value={outputLanguage}
                onChange={(value) => setOutputLanguage(value as JobPostOutputLanguage)}
                options={[
                  { id: "vi", name: "Tiếng Việt" },
                  { id: "en", name: "English" },
                ]}
              />
              <SelectField
                id="ai-experience-level"
                label="Cấp bậc"
                value={experienceLevelId}
                onChange={setExperienceLevelId}
                options={catalogs.experienceLevels}
                placeholder="Chọn cấp bậc"
              />
              <div>
                <Label htmlFor="ai-years-experience" className="text-sm font-medium text-slate-700">
                  Số năm kinh nghiệm <span className="text-rose-600">*</span>
                </Label>
                <FormInput
                  id="ai-years-experience"
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  inputMode="decimal"
                  aria-required="true"
                  value={yearsOfExperience}
                  onChange={(event) => setYearsOfExperience(event.target.value)}
                  placeholder="Ví dụ: 1"
                  className="mt-1.5 font-normal"
                />
              </div>
            </div>
          </section>

          <details className="group rounded-xl border border-slate-200 bg-slate-50/60">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800 marker:hidden">
              Tùy chỉnh nâng cao
              <CaretDown
                size={15}
                className="float-right mt-1 text-slate-400 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="space-y-4 border-t border-slate-200 px-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id="ai-job-category"
                  label="Ngành nghề"
                  value={jobCategoryId}
                  onChange={setJobCategoryId}
                  options={catalogs.categories}
                  placeholder="Để AI đề xuất"
                />
                <SelectField
                  id="ai-employment-type"
                  label="Loại hình việc làm"
                  value={employmentTypeId}
                  onChange={setEmploymentTypeId}
                  options={catalogs.employmentTypes}
                  placeholder="Để AI đề xuất"
                />
                <SelectField
                  id="ai-work-mode"
                  label="Hình thức làm việc"
                  value={workMode}
                  onChange={(value) => setWorkMode(value as JobPostWorkMode)}
                  options={[
                    { id: "onsite", name: "Tại văn phòng" },
                    { id: "hybrid", name: "Hybrid" },
                    { id: "remote", name: "Remote" },
                  ]}
                  placeholder="Chưa xác định"
                />
              </div>

              <AiSkillPicker
                id="ai-preferred-skills"
                label="Kỹ năng ưu tiên"
                options={catalogs.skills}
                selectedIds={preferredSkillIds}
                onChange={setPreferredSkillIds}
                placeholder="Tìm kỹ năng cộng điểm..."
              />

              <TextField
                id="ai-product-domain"
                label="Lĩnh vực sản phẩm hoặc dự án"
                value={productOrDomain}
                onChange={setProductOrDomain}
                placeholder="Ví dụ: Nền tảng thanh toán B2B, SaaS, E-commerce..."
              />
              <TextAreaField
                id="ai-role-objective"
                label="Mục tiêu chính của vị trí"
                value={roleObjective}
                onChange={setRoleObjective}
                placeholder="Ứng viên sẽ tạo ra kết quả hoặc tác động gì?"
              />
              <TextAreaField
                id="ai-team-context"
                label="Đội nhóm và quy trình làm việc"
                value={teamContext}
                onChange={setTeamContext}
                placeholder="Quy mô team, Agile/Scrum, phối hợp với Product, QA..."
              />
              <TextField
                id="ai-language-requirement"
                label="Yêu cầu ngoại ngữ"
                value={languageRequirement}
                onChange={setLanguageRequirement}
                placeholder="Ví dụ: Đọc tài liệu và giao tiếp tiếng Anh"
              />
              <TextAreaField
                id="ai-recruiter-notes"
                label="Ghi chú bổ sung cho AI"
                value={hints}
                onChange={setHints}
                placeholder="Chỉ nhập dữ kiện có thật về trách nhiệm, yêu cầu hoặc quyền lợi..."
              />
            </div>
          </details>

          {validationMessage ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {validationMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Quay lại
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Sparkle size={17} weight="fill" />
          {isSubmitting ? "AI đang tạo JD..." : "Tạo JD với AI"}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Chọn một giá trị",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<JobOption>;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="text-foreground placeholder:text-muted-foreground upnext-focus mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal shadow-none transition-colors focus:border-emerald-600 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} className="font-normal">
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AiSkillPicker({
  id,
  label,
  options,
  selectedIds,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  options: JobOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = selectedIds
    .map((selectedId) => options.find((option) => option.id === selectedId))
    .filter((option): option is JobOption => Boolean(option));
  const filtered = options
    .filter(
      (option) =>
        !selectedIds.includes(option.id) &&
        option.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
    .slice(0, 10);

  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label} {id === "ai-required-skills" && <span className="text-rose-600">*</span>}
      </Label>
      <div className="relative mt-1.5">
        <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
          <MagnifyingGlass size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            id={id}
            aria-label={label}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 100)}
            aria-autocomplete="list"
            aria-controls={open && query.trim() ? listboxId : undefined}
            aria-haspopup="listbox"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
              if (event.key === "Enter" && filtered[0]) {
                event.preventDefault();
                onChange([...selectedIds, filtered[0].id]);
                setQuery("");
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            className="h-full w-full bg-transparent text-sm font-normal outline-none placeholder:text-slate-400"
          />
        </div>

        {open && query.trim() ? (
          <ul
            id={listboxId}
            aria-label={`Gợi ý ${label.toLocaleLowerCase()}`}
            aria-live="polite"
            className="absolute z-60 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          >
            {filtered.length ? (
              filtered.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange([...selectedIds, option.id]);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-sm font-normal text-slate-700 hover:bg-emerald-50"
                  >
                    {option.name}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm font-normal text-slate-500">
                Không tìm thấy kỹ năng phù hợp.
              </li>
            )}
          </ul>
        ) : null}
      </div>

      {selected.length ? (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={`${label} đã chọn`}>
          {selected.map((option) => (
            <li
              key={option.id}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
            >
              {option.name}
              <button
                type="button"
                aria-label={`Bỏ kỹ năng ${option.name}`}
                onClick={() => onChange(selectedIds.filter((item) => item !== option.id))}
                className="rounded-full p-0.5 hover:bg-emerald-100"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </Label>
      <FormInput
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 font-normal"
      />
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </Label>
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 font-normal"
      />
    </div>
  );
}
