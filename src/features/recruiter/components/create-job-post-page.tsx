"use client";

import { useState, type ReactNode } from "react";

import {
  assistantSuggestions,
  assistantTips,
  basicFields,
  benefits,
  candidateCriteria,
  createJobSteps,
  createPlanUsage,
  jobDescription,
  noticeItems,
  previewBenefits,
  previewMeta,
  previewProcess,
  salaryFields,
  type WizardStep,
  Eye,
  Save,
  Sparkles,
} from "@/features/recruiter/data/create-job-data";
import {
  ArrowLeft,
  ArrowRight,
  Bold,
  CalendarDays,
  Check,
  ChevronDown,
  Italic,
  Link2,
  List,
  Minus,
  Send,
  Underline,
  X,
} from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

export function CreateJobPostPage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [toast, setToast] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isPreview = step === 5;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }

  function goNext() {
    setStep((current) => (current < 5 ? ((current + 1) as WizardStep) : current));
  }

  function goBack() {
    setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current));
  }

  return (
    <div className="w-full">
      <CreateJobHeader
        onEdit={() => setStep(1)}
        onNext={goNext}
        onPreview={() => setStep(5)}
        onSave={() => showToast("Đã lưu nháp")}
        onSubmit={() => setSubmitted(true)}
        step={step}
      />
      <JobPostStepper onSelect={setStep} step={step} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0">
          {step === 1 && <StepBasicInfo />}
          {step === 2 && <StepSalaryBenefits />}
          {step === 3 && <StepJobDescription />}
          {step === 4 && <StepCandidateCriteria />}
          {step === 5 && <StepPreviewSubmit />}
        </div>
        <CreateJobRightPanel step={step} />
      </div>

      <FormFooterActions
        isPreview={isPreview}
        onBack={goBack}
        onNext={goNext}
        onSave={() => showToast("Đã lưu nháp")}
        onSubmit={() => setSubmitted(true)}
        step={step}
      />

      {toast ? (
        <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      ) : null}

      {submitted ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check aria-hidden className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-950">
              Tin tuyển dụng đã được gửi duyệt
            </h2>
            <p className="mt-2 text-sm leading-6 font-semibold text-slate-500">
              Bạn sẽ nhận thông báo khi tin được duyệt và hiển thị trên UpNext.
            </p>
            <button
              className="mt-6 h-11 w-full rounded-lg bg-emerald-600 text-sm font-bold text-white"
              onClick={() => setSubmitted(false)}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CreateJobHeader({
  onEdit,
  onNext,
  onPreview,
  onSave,
  onSubmit,
  step,
}: {
  onEdit: () => void;
  onNext: () => void;
  onPreview: () => void;
  onSave: () => void;
  onSubmit: () => void;
  step: WizardStep;
}) {
  const preview = step === 5;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-[28px] leading-tight font-extrabold text-slate-950">
          Đăng tin tuyển dụng mới
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {preview
            ? "Kiểm tra lại nội dung trước khi gửi duyệt tin tuyển dụng."
            : "Tạo bài đăng rõ ràng, chuyên nghiệp để thu hút ứng viên phù hợp."}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <ActionButton icon={<Save className="h-4.5 w-4.5" />} onClick={onSave}>
          Lưu nháp
        </ActionButton>
        <ActionButton
          icon={preview ? <PenIcon /> : <Eye className="h-4.5 w-4.5" />}
          onClick={preview ? onEdit : onPreview}
        >
          {preview ? "Chỉnh sửa" : "Xem trước"}
        </ActionButton>
        <button
          className="inline-flex h-11 min-w-[150px] items-center justify-center gap-3 rounded-lg bg-emerald-600 px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
          onClick={preview ? onSubmit : onNext}
        >
          {preview ? "Gửi duyệt" : "Tiếp tục"}
          {preview ? (
            <Send aria-hidden className="h-4.5 w-4.5" />
          ) : (
            <ArrowRight aria-hidden className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function PenIcon() {
  return <span className="inline-block h-4.5 w-4.5 border-b-2 border-slate-600" />;
}

function ActionButton({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function JobPostStepper({
  onSelect,
  step,
}: {
  onSelect: (step: WizardStep) => void;
  step: WizardStep;
}) {
  return (
    <div className="mt-7 flex items-center gap-2 overflow-x-auto pb-2">
      {createJobSteps.map((item, index) => {
        const done = item.id < step;
        const active = item.id === step;

        return (
          <div className="flex min-w-max items-center gap-2" key={item.id}>
            <button
              className={cn(
                "flex items-center gap-2 text-[13px] font-bold",
                active || done ? "text-emerald-700" : "text-slate-600",
              )}
              onClick={() => onSelect(item.id)}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-extrabold",
                  done && "border-emerald-600 bg-emerald-600 text-white",
                  active && "border-emerald-600 bg-emerald-600 text-white",
                  !done && !active && "border-slate-200 bg-slate-100 text-slate-700",
                )}
              >
                {done ? <Check aria-hidden className="h-4.5 w-4.5" /> : item.id}
              </span>
              <span>
                {item.id}. {item.label}
              </span>
            </button>
            {index < createJobSteps.length - 1 ? (
              <span className="h-px w-[44px] bg-slate-200" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StepCard({
  autosave = "Đã lưu nháp 1 phút trước",
  children,
  title,
}: {
  autosave?: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
        <p className="text-sm font-semibold text-slate-500">{autosave}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StepBasicInfo() {
  return (
    <StepCard autosave="" title="Thông tin cơ bản">
      <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
        <Field
          label="Tên vị trí tuyển dụng *"
          value={basicFields.title}
          helper="Tiêu đề rõ công nghệ và cấp bậc sẽ giúp ứng viên hiểu nhanh hơn."
        />
        <SelectField label="Cấp bậc *" value={basicFields.level} />
        <Field label="Số lượng tuyển *" value={basicFields.headcount} />
        <SelectField label="Phòng ban / Team" value={basicFields.department} />
        <SelectField label="Ngành nghề" value={basicFields.industry} />
        <SelectField label="Loại hợp đồng" value={basicFields.contractType} />
        <div>
          <Label>Hình thức làm việc *</Label>
          <Segmented options={["Onsite", "Hybrid", "Remote"]} selected="Hybrid" />
        </div>
        <SelectField chips={basicFields.locations} label="Địa điểm làm việc *" value="" />
        <Field
          icon={<CalendarDays className="h-4.5 w-4.5" />}
          label="Hạn nhận hồ sơ *"
          value={basicFields.deadline}
        />
        <SelectField label="Người phụ trách tuyển dụng" value={basicFields.owner} />
        <Field label="Email liên hệ" value={basicFields.contactEmail} />
        <Field label="Số điện thoại liên hệ" value={basicFields.contactPhone} />
        <div className="lg:col-span-2">
          <TextareaField count="131/300" label="Mô tả ngắn vị trí" value={basicFields.summary} />
        </div>
      </div>
      <DisplaySettings
        items={[
          ["Hiển thị tên công ty", "Ứng viên sẽ thấy tên công ty trên bài đăng."],
          [
            "Hiển thị mức độ ưu tiên tuyển dụng",
            "Hiển thị mức ưu tiên (Cao/Trung bình/Thấp) cho tin tuyển dụng.",
          ],
          ["Nhận hồ sơ qua nền tảng UpNext", "Ứng viên có thể nộp hồ sơ trực tiếp qua UpNext."],
        ]}
        title="Thiết lập hiển thị"
      />
    </StepCard>
  );
}

function StepSalaryBenefits() {
  return (
    <StepCard title="Lương & phúc lợi">
      <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
        <Field label="Lương tối thiểu *" value={salaryFields.min} />
        <Field label="Lương tối đa *" value={salaryFields.max} />
        <div>
          <Label>Mức lương hiển thị</Label>
          <Segmented
            options={["Hiển thị khoảng lương", "Thỏa thuận", "Ẩn lương"]}
            selected="Hiển thị khoảng lương"
          />
        </div>
        <SelectField label="Đơn vị tiền tệ" value={salaryFields.currency} />
        <TextareaField count="55/300" label="Thưởng & phụ cấp" value={salaryFields.perks} />
        <SelectField label="Chính sách làm việc" value={salaryFields.workingPolicy} />
        <div>
          <Label>Phúc lợi nổi bật</Label>
          <div className="flex flex-wrap gap-2">
            {benefits.map((benefit) => (
              <Chip key={benefit}>{benefit}</Chip>
            ))}
            <button className="h-9 rounded-lg border border-dashed border-slate-300 px-5 text-sm font-bold text-slate-600">
              + Thêm phúc lợi
            </button>
          </div>
        </div>
        <Field label="Thời gian làm việc" value={salaryFields.schedule} />
        <TextareaField count="106/300" label="Mô tả ngắn về phúc lợi" value={salaryFields.note} />
        <Field label="Ngày nghỉ & phép" value={salaryFields.leavePolicy} />
        <div />
        <Field label="Thiết bị làm việc" value={salaryFields.equipment} />
      </div>
      <DisplaySettings
        items={[
          ["Hiển thị mức lương", "Cho phép ứng viên thấy khoảng lương trong tin đăng."],
          ["Hiển thị phúc lợi nổi bật", "Hiển thị các phúc lợi nổi bật trên bài đăng."],
          [
            "Ưu tiên tin có phúc lợi nổi bật",
            "Ưu tiên hiển thị tin có phúc lợi nổi bật trên UpNext.",
          ],
        ]}
        title="Thiết lập quyền lợi hiển thị"
      />
    </StepCard>
  );
}

function StepJobDescription() {
  return (
    <div className="space-y-4">
      <StepCard autosave="Đã lưu nháp 2 phút trước" title="Mô tả công việc">
        <div className="space-y-5">
          <RichTextField label="Mô tả vai trò *" value={jobDescription.overview} />
          <BulletEditor
            helper="Liệt kê các nhiệm vụ chính"
            label="Trách nhiệm chính *"
            items={jobDescription.responsibilities}
          />
          <BulletEditor
            helper="Những yêu cầu bắt buộc"
            label="Yêu cầu bắt buộc *"
            items={jobDescription.requirements}
          />
          <BulletEditor
            helper="Các yêu cầu là lợi thế"
            label="Yêu cầu ưu tiên"
            items={jobDescription.niceToHave}
          />
          <BulletEditor
            helper="Các quyền lợi dành cho ứng viên"
            label="Quyền lợi"
            items={jobDescription.perks}
          />
          <Field label="Quy trình phỏng vấn" value={jobDescription.interviewProcess} />
        </div>
      </StepCard>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
        <h2 className="text-xl font-extrabold text-slate-950">Tiêu chí ứng viên</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChipField label="Kỹ năng bắt buộc" chips={candidateCriteria.requiredSkills} />
          <SelectField label="Kinh nghiệm" value={candidateCriteria.experience} />
          <ChipField
            label="Kỹ năng ưu tiên"
            chips={candidateCriteria.preferredSkills.slice(0, 3)}
          />
          <SelectField label="Tiếng Anh" value={candidateCriteria.english} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["Cân bằng", "Ưu tiên kỹ năng", "Ưu tiên kinh nghiệm"].map((item, index) => (
            <button
              className={cn(
                "h-10 rounded-lg border text-sm font-bold",
                index === 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600",
              )}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StepCandidateCriteria() {
  return (
    <StepCard title="Tiêu chí ứng viên">
      <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
        <ChipField label="Kỹ năng bắt buộc *" chips={candidateCriteria.requiredSkills} withAdd />
        <ChipField label="Kỹ năng ưu tiên" chips={candidateCriteria.preferredSkills} withAdd />
        <SelectField label="Kinh nghiệm tối thiểu *" value={candidateCriteria.experience} />
        <SelectField label="Trình độ tiếng Anh" value={candidateCriteria.english} />
        <ChipField label="Khu vực ưu tiên" chips={candidateCriteria.locations} />
        <div>
          <Label>Mức lương mong muốn phù hợp</Label>
          <div className="grid grid-cols-[1fr_20px_1fr_42px] items-center gap-3">
            <InputBox>{candidateCriteria.salaryMin}</InputBox>
            <Minus aria-hidden className="h-4 w-4 text-slate-400" />
            <InputBox>{candidateCriteria.salaryMax}</InputBox>
            <span className="text-sm font-bold text-slate-600">VND</span>
          </div>
        </div>
        <div>
          <Label>Hình thức làm việc phù hợp</Label>
          <Segmented options={candidateCriteria.workModels} selected="Hybrid" />
        </div>
        <ChipField label="Từ khóa loại trừ" chips={candidateCriteria.excluded} />
        <div className="lg:col-span-2">
          <TextareaField count="101/300" label="Ghi chú sàng lọc" value={candidateCriteria.note} />
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-base font-extrabold text-slate-950">Thiết lập ưu tiên</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {["Cân bằng", "Ưu tiên kỹ năng", "Ưu tiên kinh nghiệm", "Ưu tiên lương phù hợp"].map(
            (item, index) => (
              <button
                className={cn(
                  "h-10 rounded-lg border text-sm font-bold",
                  index === 0
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600",
                )}
                key={item}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <p className="mt-4 text-sm font-bold text-slate-600">Trọng số gợi ý (tổng 100%)</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {[
            ["Kỹ năng", "50%"],
            ["Kinh nghiệm", "30%"],
            ["Yếu tố khác", "20%"],
          ].map(([label, value]) => (
            <div className="rounded-lg border border-slate-200 p-4" key={label}>
              <div className="flex items-center justify-between text-sm font-extrabold">
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: value }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <DisplaySettings
        items={[
          [
            "Tự động gợi ý ứng viên phù hợp",
            "UpNext sẽ đề xuất các hồ sơ phù hợp dựa trên tiêu chí đã thiết lập.",
          ],
          [
            "Ưu tiên hồ sơ đang tìm việc",
            "Tăng khả năng hiển thị và gợi ý ứng viên đang tìm việc tích cực.",
          ],
          [
            "Cho phép lọc theo mức lương mong muốn",
            "Lọc ứng viên dựa trên mức lương mong muốn phù hợp với ngân sách.",
          ],
        ]}
        title="Thiết lập lọc hồ sơ"
      />
    </StepCard>
  );
}

function StepPreviewSubmit() {
  return (
    <StepCard title="Xem trước tin tuyển dụng">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-indigo-800 text-2xl font-black text-white">
            U
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">{basicFields.title}</h2>
            <p className="mt-1 text-sm font-extrabold text-emerald-600">UpNext Studio</p>
          </div>
        </div>
        <button className="h-10 rounded-lg bg-emerald-600 px-6 text-sm font-bold text-white">
          Ứng tuyển ngay
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {previewMeta.map((item) => {
          const Icon = item.icon;
          return (
            <span
              className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600"
              key={item.text}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {item.text}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-6 border-b border-slate-100 pb-4 text-sm font-bold text-slate-700">
        <span>15,000,000 - 30,000,000 VND / tháng</span>
        <span>Hạn nộp hồ sơ: 30/06/2025</span>
      </div>

      <PreviewSection title="Mô tả vai trò">
        <p>{jobDescription.overview}</p>
      </PreviewSection>
      <PreviewList title="Trách nhiệm chính" items={jobDescription.responsibilities} />
      <PreviewList title="Yêu cầu bắt buộc" items={jobDescription.requirements} />
      <PreviewList title="Yêu cầu ưu tiên" items={jobDescription.niceToHave} />

      <PreviewSection title="Quyền lợi">
        <div className="flex flex-wrap gap-2">
          {previewBenefits.map((item) => {
            const Icon = item.icon;
            return (
              <Chip key={item.text}>
                <Icon aria-hidden className="h-3.5 w-3.5" />
                {item.text}
              </Chip>
            );
          })}
        </div>
      </PreviewSection>

      <PreviewSection title="Quy trình phỏng vấn">
        <div className="grid gap-3 md:grid-cols-[1fr_24px_1fr_24px_1fr]">
          {previewProcess.map((item, index) => {
            const Icon = item.icon;
            return (
              <div className="contents" key={item.title}>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <Icon aria-hidden className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{item.title}</p>
                    <p className="text-sm font-semibold text-slate-600">{item.text}</p>
                  </div>
                </div>
                {index < previewProcess.length - 1 ? (
                  <ArrowRight
                    aria-hidden
                    className="mx-auto hidden h-5 w-5 self-center text-slate-400 md:block"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </PreviewSection>

      <PreviewSection title="Tiêu chí ứng viên">
        <div className="grid gap-3 md:grid-cols-4">
          <CriteriaBox title="Kỹ năng bắt buộc" values={candidateCriteria.requiredSkills} />
          <CriteriaBox
            title="Kỹ năng ưu tiên"
            values={candidateCriteria.preferredSkills.slice(0, 3)}
          />
          <CriteriaBox title="Kinh nghiệm" values={[candidateCriteria.experience]} />
          <CriteriaBox title="Tiếng Anh" values={[candidateCriteria.english]} />
        </div>
      </PreviewSection>
    </StepCard>
  );
}

function CreateJobRightPanel({ step }: { step: WizardStep }) {
  return (
    <aside className="space-y-4">
      <CompletionCard step={step} />
      {step === 5 ? <ValidationCard step={step} /> : <AiAssistantCard step={step} />}
      <CurrentCreatePlanCard />
      <NoticeCard step={step} />
    </aside>
  );
}

function CompletionCard({ step }: { step: WizardStep }) {
  const percent: Record<WizardStep, number> = { 1: 22, 2: 42, 3: 72, 4: 62, 5: 92 };
  const note: Record<WizardStep, string> = {
    1: "Bạn mới hoàn thành 1/5 bước.",
    2: "Bạn mới hoàn thành 2/5 bước.",
    3: "Bạn đã hoàn thành 4/5 bước.",
    4: "Bạn mới hoàn thành 4/5 bước.",
    5: "Tin đã sẵn sàng để gửi duyệt.",
  };

  return (
    <SideCard>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-950">Mức độ hoàn thiện</h2>
        <span className="text-base font-extrabold text-slate-950">{percent[step]}%</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${percent[step]}%` }}
        />
      </div>
      <div className="mt-4 space-y-3">
        {createJobSteps.map((item) => {
          const done = item.id < step || step === 5;
          const active = item.id === step && step !== 5;
          return (
            <div className="flex items-center gap-3 text-sm font-bold" key={item.id}>
              <span
                className={cn(
                  "inline-flex h-4 w-4 items-center justify-center rounded-full",
                  done || active ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400",
                )}
              >
                {done ? <Check aria-hidden className="h-3 w-3" /> : null}
              </span>
              <span className={done || active ? "text-slate-700" : "text-slate-500"}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{note[step]}</p>
    </SideCard>
  );
}

function AiAssistantCard({ step }: { step: WizardStep }) {
  return (
    <SideCard>
      <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-950">
        <Sparkles aria-hidden className="h-5 w-5 text-violet-500" />
        Trợ lý AI viết tin
      </h2>
      <div className="mt-4 space-y-1.5">
        {assistantSuggestions[step].map((item) => {
          const Icon = item.icon;
          return (
            <div
              className="flex h-8 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600"
              key={item.text}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {item.text}
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
        <p className="text-sm leading-6 font-semibold text-emerald-700">{assistantTips[step]}</p>
        <button className="mt-3 h-8 rounded-md border border-emerald-300 bg-white px-3 text-sm font-bold text-emerald-700">
          Áp dụng gợi ý
        </button>
      </div>
    </SideCard>
  );
}

function ValidationCard({ step }: { step: WizardStep }) {
  return (
    <SideCard>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-950">Kiểm tra nội dung</h2>
        <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
          Hợp lệ
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {assistantSuggestions[step].map((item) => (
          <div className="flex items-center gap-3 text-sm font-bold text-slate-600" key={item.text}>
            <Check className="h-4 w-4 rounded-full bg-emerald-500 p-0.5 text-white" />
            {item.text}
          </div>
        ))}
      </div>
      <a
        className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Xem chính sách nội dung
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </SideCard>
  );
}

function CurrentCreatePlanCard() {
  return (
    <SideCard>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-950">Gói hiện tại</h2>
        <span className="rounded-md bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700">
          Pro
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {createPlanUsage.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex justify-between text-xs font-bold">
              <span className="text-slate-500">{item.label}</span>
              <span className="text-slate-950">{item.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <a
        className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Nâng cấp gói
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </SideCard>
  );
}

function NoticeCard({ step }: { step: WizardStep }) {
  const ready = step === 5;
  const valid = step === 3;
  const title =
    step === 5
      ? "Lưu ý trước khi gửi"
      : step === 3
        ? "Kiểm tra nội dung"
        : step === 4
          ? "Kiểm tra thiết lập"
          : "Lưu ý trước khi đăng";

  return (
    <SideCard>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-950">{title}</h2>
        <span
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-extrabold",
            ready || valid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600",
          )}
        >
          {ready ? "Sẵn sàng" : valid ? "Hợp lệ" : step === 4 ? "Cần kiểm tra" : "Còn thiếu"}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {noticeItems[step].map((item) => (
          <div className="flex items-center gap-3 text-sm font-bold text-slate-600" key={item.text}>
            {ready || valid ? (
              <Check className="h-4 w-4 rounded-full bg-emerald-500 p-0.5 text-white" />
            ) : (
              <X className="h-4 w-4 rounded-full border border-slate-300 p-0.5 text-slate-500" />
            )}
            {item.text}
          </div>
        ))}
      </div>
      <a
        className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        {step === 4 ? "Xem hướng dẫn cấu hình" : "Xem hướng dẫn đăng tin"}
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </SideCard>
  );
}

function FormFooterActions({
  isPreview,
  onBack,
  onNext,
  onSave,
  onSubmit,
  step,
}: {
  isPreview: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
  onSubmit: () => void;
  step: WizardStep;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <button
        className="inline-flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"
        onClick={onBack}
      >
        <ArrowLeft aria-hidden className="h-4.5 w-4.5" />
        Quay lại
      </button>
      <div className="flex gap-3">
        <button
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700"
          onClick={onSave}
        >
          <Save aria-hidden className="h-4.5 w-4.5" />
          Lưu nháp
        </button>
        <button
          className="inline-flex h-11 min-w-[150px] items-center justify-center gap-3 rounded-lg bg-emerald-600 px-6 text-sm font-bold text-white"
          onClick={isPreview ? onSubmit : onNext}
        >
          {step === 5 ? "Gửi duyệt" : "Tiếp tục"}
          <ArrowRight aria-hidden className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-extrabold text-slate-700">{children}</label>;
}

function Field({
  helper,
  icon,
  label,
  value,
}: {
  helper?: string;
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex h-10 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">
        {icon}
        <span>{value}</span>
      </div>
      {helper ? <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p> : null}
    </div>
  );
}

function SelectField({
  chips,
  label,
  value,
}: {
  chips?: readonly string[];
  label: string;
  value: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">
        <div className="flex gap-2">
          {chips?.map((chip) => <Chip key={chip}>{chip}</Chip>) ?? <span>{value}</span>}
        </div>
        <ChevronDown aria-hidden className="h-4 w-4 text-slate-500" />
      </div>
    </div>
  );
}

function TextareaField({ count, label, value }: { count: string; label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="min-h-[72px] rounded-lg border border-slate-200 p-3 text-sm leading-6 font-semibold text-slate-700">
        {value}
        <p className="mt-2 text-right text-xs font-semibold text-slate-500">{count}</p>
      </div>
    </div>
  );
}

function RichTextField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-[190px_minmax(0,1fr)]">
      <div>
        <Label>{label}</Label>
        <p className="text-xs font-semibold text-slate-500">Tóm tắt ngắn gọn về vai trò</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="flex h-9 items-center gap-5 border-b border-slate-100 px-4 text-slate-600">
          {[Bold, Italic, Underline, List, List, Link2].map((Icon, index) => (
            <Icon aria-hidden className="h-4 w-4" key={index} />
          ))}
        </div>
        <p className="p-4 text-sm leading-6 font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function BulletEditor({
  helper,
  items,
  label,
}: {
  helper: string;
  items: readonly string[];
  label: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[190px_minmax(0,1fr)]">
      <div>
        <Label>{label}</Label>
        <p className="text-xs font-semibold text-slate-500">{helper}</p>
      </div>
      <div>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {items.map((item) => (
            <div
              className="flex h-9 items-center gap-3 px-4 text-sm font-semibold text-slate-700"
              key={item}
            >
              <span>•</span>
              <span className="flex-1">{item}</span>
              <X aria-hidden className="h-4 w-4 text-slate-500" />
            </div>
          ))}
        </div>
        <button className="mt-2 text-sm font-extrabold text-emerald-600">+ Thêm mục</button>
      </div>
    </div>
  );
}

function ChipField({
  chips,
  label,
  withAdd,
}: {
  chips: readonly string[];
  label: string;
  withAdd?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2">
        {chips.map((chip) => (
          <Chip key={chip}>
            {chip}
            <X aria-hidden className="h-3.5 w-3.5" />
          </Chip>
        ))}
      </div>
      {withAdd ? (
        <button className="mt-2 h-9 w-full rounded-lg border border-dashed border-slate-300 text-sm font-bold text-slate-600">
          + Thêm kỹ năng
        </button>
      ) : null}
    </div>
  );
}

function Segmented({ options, selected }: { options: readonly string[]; selected: string }) {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200">
      {options.map((option) => (
        <button
          className={cn(
            "h-10 border-r border-slate-200 text-sm font-bold last:border-r-0",
            option === selected ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-600",
          )}
          key={option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function DisplaySettings({
  items,
  title,
}: {
  items: readonly (readonly [string, string])[];
  title: string;
}) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <h3 className="text-base font-extrabold text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map(([itemTitle, caption]) => (
          <div className="flex gap-4 rounded-lg border border-slate-200 p-4" key={itemTitle}>
            <Toggle />
            <div>
              <p className="text-sm font-extrabold text-slate-800">{itemTitle}</p>
              <p className="mt-1 text-xs leading-5 font-semibold text-slate-500">{caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle() {
  return (
    <span className="flex h-6 w-11 shrink-0 items-center rounded-full bg-emerald-500 p-0.5">
      <span className="ml-auto h-5 w-5 rounded-full bg-white" />
    </span>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700">
      {children}
    </span>
  );
}

function InputBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">
      {children}
    </div>
  );
}

function SideCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      {children}
    </section>
  );
}

function PreviewSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="border-b border-slate-100 py-4 text-sm leading-6 font-semibold text-slate-700">
      <h3 className="mb-2 text-base font-extrabold text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

function PreviewList({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <PreviewSection title={title}>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </PreviewSection>
  );
}

function CriteriaBox({ title, values }: { title: string; values: readonly string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-extrabold text-slate-600">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <Chip key={value}>{value}</Chip>
        ))}
      </div>
    </div>
  );
}
