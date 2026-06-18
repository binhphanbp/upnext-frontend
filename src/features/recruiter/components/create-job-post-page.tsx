"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Control, UseFormRegisterReturn } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";

import type {
  EmploymentTypeApiItem,
  ExperienceLevelApiItem,
  JobCategoryApiItem,
} from "@/features/recruiter/api/job-posts";
import { getJobPostDetail } from "@/features/recruiter/api/job-posts";
import { useCreateJobPostData } from "@/features/recruiter/hooks/use-create-job-post-data";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Eye,
  FileText,
  Gift,
  Globe2,
  MapPin,
  NotePencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Target,
  UsersRound,
} from "@/features/recruiter/icons";
import {
  createJobPostDefaultValues,
  createJobPostSchema,
  type CreateJobPostFormValues,
} from "@/features/recruiter/schemas/create-job-post";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";

const RichTextEditor = dynamic(
  () => import("@/shared/ui/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[180px] w-full animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
    ),
  },
);

export function CreateJobPostPage({
  mode = "create",
  jobId,
}: Readonly<{
  mode?: "create" | "edit";
  jobId?: string;
}>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [draftSaved, setDraftSaved] = useState(false);
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  const {
    createJobPostMutation,
    employmentTypes,
    error,
    experienceLevels,
    isLoading: isMetaDataLoading,
    jobCategories,
    recruiterAccount,
  } = useCreateJobPostData();

  const jobDetailQuery = useQuery({
    enabled: mode === "edit" && Boolean(jobId),
    queryKey: ["recruiter-job-post-detail", jobId],
    queryFn: () => getJobPostDetail(jobId as string),
  });

  const { data: jobDetail, isLoading: isJobDetailLoading } = jobDetailQuery;
  const isLoading = isMetaDataLoading || (mode === "edit" && isJobDetailLoading);

  const {
    control,
    formState: { errors, isSubmitted, isSubmitting: isFormSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<CreateJobPostFormValues>({
    defaultValues: createJobPostDefaultValues,
    resolver: zodResolver(createJobPostSchema),
  });

  const isSubmitting = isFormSubmitting || isEditingSaving;

  useEffect(() => {
    if (mode === "edit" && jobDetail) {
      reset({
        benefits: jobDetail.benefits ?? "",
        description: jobDetail.description ?? "",
        employmentTypeId: jobDetail.employmentTypeId ?? "",
        experienceLevelId: jobDetail.experienceLevelId ?? "",
        jobCategoryId: jobDetail.jobCategoryId ?? "",
        requirements: jobDetail.requirements ?? "",
        salaryCurrency: "VND",
        salaryIsNegotiable: jobDetail.salaryIsNegotiable ?? false,
        salaryIsVisible: jobDetail.salaryIsVisible ?? true,
        salaryMax:
          typeof jobDetail.salaryMax === "number"
            ? jobDetail.salaryMax
            : Number(jobDetail.salaryMax) || 20000000,
        salaryMin:
          typeof jobDetail.salaryMin === "number"
            ? jobDetail.salaryMin
            : Number(jobDetail.salaryMin) || 12000000,
        salaryPeriod: "MONTH",
        title: jobDetail.title ?? "",
        vacanciesCount: jobDetail.vacanciesCount ?? 1,
      });
    }
  }, [mode, jobDetail, reset]);

  useEffect(() => {
    if (mode === "edit") return;

    if (!getValues("jobCategoryId") && jobCategories[0]) {
      setValue("jobCategoryId", jobCategories[0].id);
    }

    if (!getValues("experienceLevelId") && experienceLevels[0]) {
      setValue("experienceLevelId", experienceLevels[0].id);
    }

    if (!getValues("employmentTypeId") && employmentTypes[0]) {
      setValue("employmentTypeId", employmentTypes[0].id);
    }
  }, [mode, employmentTypes, experienceLevels, getValues, jobCategories, setValue]);

  const previewValues = watch();

  const previewMeta = useMemo(
    () => ({
      companyName: recruiterAccount?.company?.name ?? "UpNext Studio",
      employmentTypeLabel: getOptionLabel(
        employmentTypes,
        previewValues.employmentTypeId,
        "Loại hình",
      ),
      experienceLevelLabel: getOptionLabel(
        experienceLevels,
        previewValues.experienceLevelId,
        "Cấp độ",
      ),
      jobCategoryLabel: getOptionLabel(jobCategories, previewValues.jobCategoryId, "Danh mục"),
      recruiterName:
        recruiterAccount?.profile?.fullName ?? recruiterAccount?.email ?? "Nhà tuyển dụng",
    }),
    [employmentTypes, experienceLevels, jobCategories, previewValues, recruiterAccount],
  );

  const loadErrorMessage =
    error instanceof Error
      ? getQueryErrorMessage(error)
      : !recruiterAccount && !isLoading
        ? "Chúng tôi chưa tìm thấy tài khoản tuyển dụng đang hoạt động. Vui lòng kiểm tra lại dữ liệu công ty trước khi đăng tin."
        : null;

  const submitErrorMessage = createJobPostMutation.error
    ? getSubmitErrorMessage(createJobPostMutation.error)
    : null;

  async function onSubmit(values: CreateJobPostFormValues) {
    if (mode === "edit") {
      setIsEditingSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsEditingSaving(false);
      router.push(`/recruiter/job-posts/${jobId}?updated=true`);
      return;
    }

    await createJobPostMutation.mutateAsync(values);

    reset({
      ...createJobPostDefaultValues,
      employmentTypeId: values.employmentTypeId,
      experienceLevelId: values.experienceLevelId,
      jobCategoryId: values.jobCategoryId,
    });

    router.push("/recruiter/job-posts");
  }

  function handleSaveDraft() {
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 2400);
  }

  return (
    <div className="w-full pb-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-[28px] leading-tight font-extrabold text-slate-950">
          {mode === "edit" ? "Chỉnh sửa tin tuyển dụng" : "Đăng tin tuyển dụng mới"}
        </h1>
        <p className="mt-2 text-sm leading-6 font-semibold text-slate-500 sm:text-[15px]">
          {mode === "edit"
            ? "Cập nhật thông tin tin tuyển dụng trước khi gửi duyệt hoặc tiếp tục tuyển."
            : "Tạo tin tuyển dụng rõ ràng, thu hút ứng viên và sẵn sàng gửi duyệt trên UpNext."}
        </p>
      </div>

      {loadErrorMessage ? <StatusBanner tone="warning">{loadErrorMessage}</StatusBanner> : null}
      {submitErrorMessage ? <StatusBanner tone="danger">{submitErrorMessage}</StatusBanner> : null}

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <CreateJobPostTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "editor" ? (
          <section
            aria-labelledby="create-job-editor-tab"
            className="min-w-0 space-y-6"
            id="create-job-editor-panel"
            role="tabpanel"
          >
            <JobPostFormSection
              isLoading={isLoading}
              subtitle="Điền các thông tin quan trọng để ứng viên hiểu rõ vị trí và yêu cầu công việc."
              title="Thông tin tuyển dụng"
            >
              <TextField
                error={errors.title?.message}
                label="Tiêu đề tuyển dụng *"
                placeholder="Ví dụ: Frontend Developer"
                registration={register("title")}
              />
              <NumberField
                error={errors.vacanciesCount?.message}
                label="Số lượng tuyển *"
                min={1}
                registration={register("vacanciesCount", { valueAsNumber: true })}
              />
              <SelectField
                error={errors.jobCategoryId?.message}
                label="Danh mục công việc *"
                options={jobCategories.map((item) => ({ label: item.name, value: item.id }))}
                registration={register("jobCategoryId")}
              />
              <SelectField
                error={errors.experienceLevelId?.message}
                label="Cấp độ kinh nghiệm *"
                options={experienceLevels.map((item) => ({ label: item.name, value: item.id }))}
                registration={register("experienceLevelId")}
              />
              <SelectField
                error={errors.employmentTypeId?.message}
                label="Loại hình làm việc *"
                options={employmentTypes.map((item) => ({ label: item.name, value: item.id }))}
                registration={register("employmentTypeId")}
              />
              <StaticField label="Chu kỳ lương" value="VND / tháng" />
              <RichTextField
                control={control}
                error={errors.description?.message}
                label="Mô tả công việc *"
                name="description"
                placeholder="Mô tả tổng quan vai trò, phạm vi công việc, mục tiêu..."
              />
              <RichTextField
                control={control}
                error={errors.requirements?.message}
                label="Yêu cầu công việc *"
                name="requirements"
                placeholder="Liệt kê kỹ năng, kinh nghiệm, bằng cấp hoặc điều kiện bắt buộc..."
              />
              <RichTextField
                control={control}
                error={errors.benefits?.message}
                label="Quyền lợi *"
                name="benefits"
                placeholder="Mô tả lương thưởng, chế độ, môi trường làm việc..."
              />
            </JobPostFormSection>

            <SalaryVisibilitySection subtitle="Thiết lập khoảng lương và cách hiển thị thông tin lương với ứng viên.">
              <NumberField
                error={errors.salaryMin?.message}
                label="Lương tối thiểu *"
                min={0}
                registration={register("salaryMin", { valueAsNumber: true })}
              />
              <NumberField
                error={errors.salaryMax?.message}
                label="Lương tối đa *"
                min={0}
                registration={register("salaryMax", { valueAsNumber: true })}
              />
              <ToggleField
                description="Bật nếu vị trí có thể thương lượng lương."
                label="Lương thỏa thuận"
                registration={register("salaryIsNegotiable")}
              />
              <ToggleField
                description="Tắt nếu bạn muốn lưu lương nội bộ, không hiển thị cho ứng viên."
                label="Hiển thị lương"
                registration={register("salaryIsVisible")}
              />
            </SalaryVisibilitySection>
          </section>
        ) : (
          <section className="min-w-0">
            <JobPostFullPreview
              companyName={previewMeta.companyName}
              benefits={previewValues.benefits}
              description={previewValues.description}
              employmentType={previewMeta.employmentTypeLabel}
              experienceLevel={previewMeta.experienceLevelLabel}
              isSalaryNegotiable={previewValues.salaryIsNegotiable}
              isSalaryVisible={previewValues.salaryIsVisible}
              jobCategory={previewMeta.jobCategoryLabel}
              recruiterName={previewMeta.recruiterName}
              requirements={previewValues.requirements}
              salaryMax={previewValues.salaryMax}
              salaryMin={previewValues.salaryMin}
              title={previewValues.title}
              vacanciesCount={previewValues.vacanciesCount}
            />
          </section>
        )}

        <CreateJobPostActions
          activeTab={activeTab}
          disabled={Boolean(loadErrorMessage) || isLoading || !recruiterAccount}
          isSubmitting={isSubmitting || createJobPostMutation.isPending}
          onBack={() => {
            if (mode === "edit") {
              router.push(`/recruiter/job-posts/${jobId}`);
            } else {
              router.push("/recruiter/job-posts");
            }
          }}
          onPreview={() => setActiveTab("preview")}
          onEdit={() => setActiveTab("editor")}
          onSaveDraft={handleSaveDraft}
          mode={mode}
        />

        {draftSaved ? (
          <p className="text-sm font-semibold text-emerald-700">
            Đã lưu bản nháp trên trình duyệt.
          </p>
        ) : null}

        {isSubmitted && Object.keys(errors).length > 0 ? (
          <p className="text-sm font-semibold text-rose-600">
            Vui lòng kiểm tra lại các thông tin bắt buộc trước khi tạo tin tuyển dụng.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function CreateJobPostTabs({
  activeTab,
  onChange,
}: Readonly<{
  activeTab: "editor" | "preview";
  onChange: (tab: "editor" | "preview") => void;
}>) {
  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max gap-2" role="tablist" aria-label="Chế độ tạo tin tuyển dụng">
        <TabButton
          active={activeTab === "editor"}
          id="create-job-editor-tab"
          onClick={() => onChange("editor")}
          panelId="create-job-editor-panel"
        >
          Soạn tin tuyển dụng
        </TabButton>
        <TabButton
          active={activeTab === "preview"}
          id="create-job-preview-tab"
          onClick={() => onChange("preview")}
          panelId="create-job-preview-panel"
        >
          Xem trước
        </TabButton>
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  id,
  onClick,
  panelId,
}: Readonly<{
  active: boolean;
  children: ReactNode;
  id: string;
  onClick: () => void;
  panelId: string;
}>) {
  return (
    <button
      aria-controls={panelId}
      aria-selected={active}
      className={cn(
        "relative h-12 px-4 text-sm font-extrabold text-slate-500 outline-none transition",
        "focus-visible:ring-4 focus-visible:ring-emerald-100",
        active && "text-emerald-700",
      )}
      id={id}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {children}
      {active ? (
        <span className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-emerald-600" />
      ) : null}
    </button>
  );
}

function JobPostFormSection({
  children,
  isLoading,
  subtitle,
  title,
}: Readonly<{
  children: ReactNode;
  isLoading?: boolean;
  subtitle: string;
  title: string;
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 font-semibold text-slate-500">{subtitle}</p>
        </div>
        {isLoading ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
            <RefreshCw aria-hidden className="h-3.5 w-3.5 animate-spin" />
            Đang tải
          </span>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function SalaryVisibilitySection({
  children,
  subtitle,
}: Readonly<{
  children: ReactNode;
  subtitle: string;
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
      <h2 className="text-xl font-extrabold text-slate-950">Lương và hiển thị</h2>
      <p className="mt-1 text-sm leading-6 font-semibold text-slate-500">{subtitle}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function CreateJobPostActions({
  activeTab,
  disabled,
  isSubmitting,
  onBack,
  onEdit,
  onPreview,
  onSaveDraft,
  mode = "create",
}: Readonly<{
  activeTab: "editor" | "preview";
  disabled: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  mode?: "create" | "edit";
}>) {
  return (
    <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {activeTab === "editor" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex h-11 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              onClick={onBack}
              type="button"
            >
              <ArrowLeft aria-hidden className="h-4.5 w-4.5" />
              {mode === "edit" ? "Quay lại chi tiết" : "Quay lại danh sách"}
            </button>
            {mode !== "edit" && (
              <button
                className="inline-flex h-11 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                onClick={onSaveDraft}
                type="button"
              >
                <Save aria-hidden className="h-4.5 w-4.5" />
                Lưu nháp
              </button>
            )}
            <button
              className="inline-flex h-11 items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
              onClick={onPreview}
              type="button"
            >
              <Eye aria-hidden className="h-4.5 w-4.5" />
              Xem trước
            </button>
          </div>
        ) : (
          <button
            className="inline-flex h-11 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={onEdit}
            type="button"
          >
            <ArrowLeft aria-hidden className="h-4.5 w-4.5" />
            Quay lại chỉnh sửa
          </button>
        )}

        <button
          className={cn(
            "inline-flex h-11 min-w-[220px] items-center justify-center gap-3 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition",
            "hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none",
          )}
          disabled={disabled || isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <RefreshCw aria-hidden className="h-4.5 w-4.5 animate-spin" />
              {mode === "edit" ? "Đang lưu thay đổi..." : "Đang tạo tin..."}
            </>
          ) : (
            <>
              <Save aria-hidden className="h-4.5 w-4.5" />
              {mode === "edit" ? "Lưu thay đổi" : "Tạo tin tuyển dụng"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function JobPostFullPreview({
  benefits,
  companyName,
  description,
  employmentType,
  experienceLevel,
  isSalaryNegotiable,
  isSalaryVisible,
  jobCategory,
  recruiterName,
  requirements,
  salaryMax,
  salaryMin,
  title,
  vacanciesCount,
}: Readonly<{
  benefits: string;
  companyName: string;
  description: string;
  employmentType: string;
  experienceLevel: string;
  isSalaryNegotiable: boolean;
  isSalaryVisible: boolean;
  jobCategory: string;
  recruiterName: string;
  requirements: string;
  salaryMax: number;
  salaryMin: number;
  title: string;
  vacanciesCount: number;
}>) {
  const previewTitle = title.trim() || "Tiêu đề vị trí tuyển dụng";
  const previewDescription =
    description.trim() || "Nội dung mô tả chi tiết công việc đang được cập nhật...";
  const previewRequirements =
    requirements.trim() || "Thông tin yêu cầu chuyên môn đang được cập nhật...";
  const previewBenefits =
    benefits.trim() || "Chế độ đãi ngộ và quyền lợi ứng viên đang được cập nhật...";

  return (
    <div
      className="mx-auto max-w-[960px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
      id="create-job-preview-panel"
      role="tabpanel"
    >
      {/* Decorative cover header */}
      <div className="relative h-36 w-full bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 sm:h-44">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-30" />

        {/* Verification badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-3.5 py-1 text-[11px] font-extrabold text-emerald-400 shadow-sm backdrop-blur-md">
          <ShieldCheck className="h-4 w-4" />
          Tuyển dụng xác thực
        </div>
      </div>

      {/* Main header information */}
      <div className="relative border-b border-slate-100 px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* Logo overlapping the cover */}
          <div className="relative -mt-16 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:-mt-20 sm:h-28 sm:w-28">
            <img
              src="/assets/company-profile/logo.png"
              alt="Logo"
              className="h-full w-full rounded-xl object-contain p-1.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-600 text-3xl font-black text-white">
              {getCompanyInitial(companyName)}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h2
            className={cn(
              "text-2xl leading-tight font-black text-slate-950 sm:text-3xl tracking-tight",
              !title.trim() && "text-slate-400",
            )}
            id="job-post-preview-title"
          >
            {previewTitle}
          </h2>

          <div className="mt-3.5 flex flex-wrap items-center gap-y-2 text-sm font-bold text-slate-500">
            <span className="cursor-pointer text-slate-800 transition hover:text-emerald-700">
              {companyName}
            </span>
            <span className="mx-3 text-slate-300">•</span>
            <span className="font-semibold text-slate-600">Người đăng: {recruiterName}</span>
          </div>
        </div>
      </div>

      {/* Body content with 2 columns layout */}
      <div className="grid grid-cols-1 gap-8 bg-slate-50/50 p-6 sm:p-8 lg:grid-cols-3">
        {/* Left Column: Job detail sections */}
        <div className="space-y-6 lg:col-span-2">
          <PreviewSection
            title="Mô tả công việc"
            icon={<FileText className="h-4.5 w-4.5 text-emerald-600" />}
          >
            {previewDescription}
          </PreviewSection>

          <PreviewSection
            title="Yêu cầu công việc"
            icon={<Target className="h-4.5 w-4.5 text-emerald-600" />}
          >
            {previewRequirements}
          </PreviewSection>

          <PreviewSection
            title="Quyền lợi được hưởng"
            icon={<Gift className="h-4.5 w-4.5 text-emerald-600" />}
          >
            {previewBenefits}
          </PreviewSection>
        </div>

        {/* Right Column: Sidebar information */}
        <div className="space-y-6">
          {/* Job overview summary card */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.02)]">
            <h3 className="text-xs font-black tracking-wider text-slate-950 uppercase">
              Thông tin chung
            </h3>

            <div className="mt-5 space-y-4">
              <SidebarItem
                icon={<BriefcaseBusiness className="h-4.5 w-4.5 text-emerald-600" />}
                label="Mức lương"
              >
                {formatSalaryPreview({
                  isSalaryNegotiable,
                  isSalaryVisible,
                  salaryMax,
                  salaryMin,
                })}
              </SidebarItem>

              <SidebarItem
                icon={<Clock3 className="h-4.5 w-4.5 text-emerald-600" />}
                label="Cấp bậc / Kinh nghiệm"
              >
                {experienceLevel}
              </SidebarItem>

              <SidebarItem
                icon={<CalendarDays className="h-4.5 w-4.5 text-emerald-600" />}
                label="Hình thức làm việc"
              >
                {employmentType}
              </SidebarItem>

              <SidebarItem
                icon={<UsersRound className="h-4.5 w-4.5 text-emerald-600" />}
                label="Số lượng cần tuyển"
              >
                Tuyển {Math.max(vacanciesCount || 0, 1)} người
              </SidebarItem>

              <SidebarItem
                icon={<NotePencil className="h-4.5 w-4.5 text-emerald-600" />}
                label="Lĩnh vực chuyên môn"
              >
                {jobCategory}
              </SidebarItem>
            </div>
          </div>

          {/* Company Summary Card */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.02)]">
            <h3 className="text-xs font-black tracking-wider text-slate-950 uppercase">
              Về công ty
            </h3>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <img
                  src="/assets/company-profile/logo.png"
                  alt="Logo"
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-base font-black text-white">
                  {getCompanyInitial(companyName)}
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900">{companyName}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Nhà tuyển dụng chuyên nghiệp
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer sticky action banner */}
      <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-5 sm:px-8">
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-slate-400">Xem trước hiển thị</p>
          <p className="mt-0.5 text-sm font-extrabold text-slate-800">
            Ứng viên sẽ nhìn thấy giao diện này
          </p>
        </div>
        <button
          aria-disabled="true"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white opacity-60 sm:w-auto sm:min-w-[200px]"
          type="button"
        >
          Ứng tuyển ngay
        </button>
      </footer>
    </div>
  );
}

function SidebarItem({
  children,
  icon,
  label,
}: Readonly<{ children: ReactNode; icon: ReactNode; label: string }>) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-extrabold text-slate-900">{children}</p>
      </div>
    </div>
  );
}

function PreviewSection({
  children,
  title,
  icon,
}: Readonly<{ children: string; title: string; icon: ReactNode }>) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.01)]">
      <h3 className="flex items-center gap-2.5 text-sm font-black tracking-wider text-slate-950 uppercase">
        {icon}
        {title}
      </h3>
      <div
        className={cn(
          "mt-3.5 text-[14px] leading-7 font-semibold text-slate-600",
          "[&_p]:mb-3 last:[&_p]:mb-0",
          "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 first:[&_h2]:mt-0",
          "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 first:[&_h3]:mt-0",
          "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul_li]:mb-1",
          "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol_li]:mb-1",
          "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500",
          "[&_a]:text-emerald-600 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-emerald-700",
        )}
        dangerouslySetInnerHTML={{ __html: children }}
      />
    </section>
  );
}

function formatSalaryPreview({
  isSalaryNegotiable,
  isSalaryVisible,
  salaryMax,
  salaryMin,
}: Readonly<{
  isSalaryNegotiable: boolean;
  isSalaryVisible: boolean;
  salaryMax: number;
  salaryMin: number;
}>) {
  if (!isSalaryVisible) {
    return "Không hiển thị lương";
  }

  if (isSalaryNegotiable) {
    return "Lương thỏa thuận";
  }

  return `${formatMillion(salaryMin)} - ${formatMillion(salaryMax)} triệu VND/tháng`;
}

function formatMillion(value: number) {
  const amount = (value || 0) / 1000000;

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 1,
  }).format(amount);
}

function getCompanyInitial(companyName: string) {
  return companyName.trim().charAt(0).toUpperCase() || "U";
}

function StatusBanner({
  children,
  tone,
}: Readonly<{
  children: ReactNode;
  tone: "danger" | "warning";
}>) {
  return (
    <div
      className={cn(
        "mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold",
        tone === "danger" && "border-rose-100 bg-rose-50 text-rose-700",
        tone === "warning" && "border-amber-100 bg-amber-50 text-amber-900",
      )}
    >
      {children}
    </div>
  );
}

function TextField({
  error,
  label,
  placeholder,
  registration,
}: Readonly<{
  error: string | undefined;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
}>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400",
          "focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100",
          error ? "border-rose-300" : "border-slate-200",
        )}
        placeholder={placeholder}
        type="text"
        {...registration}
      />
      {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
    </label>
  );
}

function NumberField({
  error,
  label,
  min,
  registration,
}: Readonly<{
  error: string | undefined;
  label: string;
  min: number;
  registration: UseFormRegisterReturn;
}>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 outline-none",
          "focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100",
          error ? "border-rose-300" : "border-slate-200",
        )}
        min={min}
        type="number"
        {...registration}
      />
      {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
    </label>
  );
}

function SelectField({
  error,
  label,
  options,
  registration,
}: Readonly<{
  error: string | undefined;
  label: string;
  options: Array<{ label: string; value: string }>;
  registration: UseFormRegisterReturn;
}>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">{label}</span>
      <select
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 outline-none",
          "focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100",
          error ? "border-rose-300" : "border-slate-200",
        )}
        {...registration}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
    </label>
  );
}

function RichTextField({
  control,
  error,
  label,
  name,
  placeholder,
}: Readonly<{
  control: Control<CreateJobPostFormValues>;
  error: string | undefined;
  label: string;
  name: "description" | "requirements" | "benefits";
  placeholder?: string;
}>) {
  return (
    <div className="block lg:col-span-2">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">{label}</span>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RichTextEditor
            error={Boolean(error)}
            onChange={field.onChange}
            placeholder={placeholder}
            value={field.value ?? ""}
          />
        )}
      />
      {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

function ToggleField({
  description,
  label,
  registration,
}: Readonly<{
  description: string;
  label: string;
  registration: UseFormRegisterReturn;
}>) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
      <input
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        type="checkbox"
        {...registration}
      />
      <span>
        <span className="block text-sm font-extrabold text-slate-800">{label}</span>
        <span className="mt-1 block text-sm leading-6 font-semibold text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function StaticField({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <span className="mb-2 block text-sm font-extrabold text-slate-700">{label}</span>
      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
        {value}
      </div>
    </div>
  );
}

function getOptionLabel(
  options: JobCategoryApiItem[] | ExperienceLevelApiItem[] | EmploymentTypeApiItem[],
  id: string,
  fallback: string,
) {
  return options.find((item) => item.id === id)?.name ?? fallback;
}

function getQueryErrorMessage(error: Error) {
  if (error instanceof ApiError && error.status >= 500) {
    return "Không thể tải dữ liệu cần thiết lúc này. Vui lòng thử lại sau ít phút.";
  }

  return "Có lỗi xảy ra khi chuẩn bị dữ liệu cho trang đăng tin. Vui lòng tải lại trang và thử lại.";
}

function getSubmitErrorMessage(error: Error) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "Thông tin tin tuyển dụng chưa hợp lệ. Vui lòng kiểm tra lại nội dung và thử lại.";
    }

    if (error.status === 401 || error.status === 403) {
      return "Tài khoản hiện tại chưa có quyền thực hiện thao tác này.";
    }

    if (error.status >= 500) {
      return "Hệ thống đang bận xử lý. Vui lòng thử đăng tin lại sau ít phút.";
    }
  }

  return "Chưa thể tạo tin tuyển dụng lúc này. Vui lòng thử lại.";
}
