"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Briefcase,
  CheckCircle,
  DotsThreeVertical,
  Eye,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Prohibit,
  Users,
  X,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegisterReturn } from "react-hook-form";
import Swal, { type SweetAlertIcon } from "sweetalert2";
import { z } from "zod";

import {
  getCompany,
  getCompanyLocations,
  getRecruiterAccount,
  type CompanyLocation,
  type RecruiterAccountDetail,
} from "@/features/recruiter/api/onboarding";
import {
  addLocationToRecruiterJobPost,
  addSkillToRecruiterJobPost,
  addSpecializationToRecruiterJobPost,
  closeRecruiterJobPost,
  createRecruiterJobPost,
  getJobPostCatalogs,
  getRecruiterJobPosts,
  type JobLocationOption,
  type JobOption,
  type JobPostCatalogs,
  publishRecruiterJobPost,
  type RecruiterJobPost,
  updateRecruiterJobPost,
  deleteSkillFromRecruiterJobPost,
  deleteLocationFromRecruiterJobPost,
  deleteSpecializationFromRecruiterJobPost,
} from "@/features/recruiter/job-posts/api";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RichTextEditor } from "@/shared/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

import { RecruiterTableLayout } from "../components/recruiter-table-layout";
import { RecruiterJobPostPreview } from "./recruiter-job-post-preview";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3400,
  timerProgressBar: true,
});

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).max(99999999999, "Mức lương tối đa là 99.999.999.999 VND.").optional(),
);

const EMAIL_LIST_SEPARATOR = /[,;]+/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optionalEmailList = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => {
      if (!value) return true;
      return value
        .split(EMAIL_LIST_SEPARATOR)
        .map((email) => email.trim())
        .filter(Boolean)
        .every((email) => EMAIL_PATTERN.test(email));
    },
    {
      message: "Vui lòng nhập đúng định dạng email, cách nhau bằng dấu phẩy hoặc chấm phẩy.",
    },
  );

const EDUCATION_LEVEL_OPTIONS: JobOption[] = [
  { id: "ANY", name: "Không yêu cầu" },
  { id: "HIGH_SCHOOL", name: "Trung học phổ thông" },
  { id: "VOCATIONAL", name: "Trung cấp" },
  { id: "COLLEGE", name: "Cao đẳng" },
  { id: "BACHELOR", name: "Đại học" },
  { id: "POSTGRADUATE", name: "Sau đại học" },
];

const jobPostSchema = z
  .object({
    title: z.string().trim().min(5, "Vui lòng nhập tiêu đề tối thiểu 5 ký tự."),
    description: z.string().trim().min(30, "Mô tả công việc cần tối thiểu 30 ký tự."),
    requirements: z.string().trim().optional(),
    benefits: z.string().trim().optional(),
    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    salaryIsNegotiable: z.boolean(),
    salaryIsVisible: z.boolean(),
    vacanciesCount: z.coerce
      .number()
      .int()
      .min(1, "Số lượng tuyển phải từ 1.")
      .max(99999, "Số lượng tuyển tối đa là 99.999."),
    jobCategoryId: z.string().optional(),
    employmentTypeId: z.string().optional(),
    experienceLevelId: z.string().optional(),
    educationLevel: z.string().default("ANY"),
    jobLocationIds: z.array(z.string()).default([]),
    applicationEmails: optionalEmailList,
    skillIds: z.array(z.string()).default([]),
    specializationIds: z.array(z.string()).default([]),
    workingDays: z.string().trim().optional(),
    expiredAt: z.string().trim().min(1, "Vui lòng chọn hạn nộp hồ sơ."),
  })
  .refine(
    (values) =>
      values.salaryMin === undefined ||
      values.salaryMax === undefined ||
      values.salaryMax >= values.salaryMin,
    {
      message: "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.",
      path: ["salaryMax"],
    },
  );

type JobPostFormInput = z.input<typeof jobPostSchema>;
type JobPostFormValues = z.output<typeof jobPostSchema>;

const emptyCatalogs: JobPostCatalogs = {
  categories: [],
  employmentTypes: [],
  experienceLevels: [],
  skills: [],
  specializations: [],
};

function showToast(icon: SweetAlertIcon, title: string) {
  void Toast.fire({ icon, title });
}

function getFirstErrorMessage(errors: FieldErrors): string {
  for (const error of Object.values(errors)) {
    if (!error) continue;

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if (typeof error === "object") {
      const nested = getFirstErrorMessage(error as FieldErrors);

      if (nested) return nested;
    }
  }

  return "Vui lòng kiểm tra lại thông tin.";
}

function getJobPostErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.";
  }

  if (error.status === 400) {
    return "Thông tin tin tuyển dụng chưa hợp lệ hoặc công ty chưa hoàn tất hồ sơ.";
  }

  if (error.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error.status === 403) {
    return "Công ty cần được xác thực trước khi xuất bản tin tuyển dụng.";
  }

  if (error.status >= 500) {
    return "Hệ thống đang gặp sự cố khi xử lý tin tuyển dụng.";
  }

  return "Không thể xử lý tin tuyển dụng. Vui lòng thử lại.";
}

export function RecruiterJobPostsPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [account, setAccount] = useState<RecruiterAccountDetail | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [catalogs, setCatalogs] = useState<JobPostCatalogs>(emptyCatalogs);
  const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [actionJobId, setActionJobId] = useState<string | null>(null);

  const [editorResetKey, setEditorResetKey] = useState(0);
  const [view, setView] = useState<"list" | "create" | "details" | "edit">("list");
  const [editorTab, setEditorTab] = useState<"compose" | "preview">("compose");
  const [activeJob, setActiveJob] = useState<RecruiterJobPost | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const form = useForm<JobPostFormInput, unknown, JobPostFormValues>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      benefits: "",
      salaryIsNegotiable: false,
      salaryIsVisible: true,
      vacanciesCount: 1,
      jobCategoryId: "",
      employmentTypeId: "",
      experienceLevelId: "",
      educationLevel: "ANY",
      jobLocationIds: [],
      applicationEmails: "",
      skillIds: [],
      specializationIds: [],
      workingDays: "",
      expiredAt: "",
    },
  });

  const companyVerified = account?.company?.verificationStatus === "VERIFIED";
  const previewValues = form.watch();

  const loadPageData = useCallback(
    async (id: string, token: string) => {
      setLoading(true);
      setAccountId(id);

      try {
        const [nextAccount, nextCatalogs, nextJobs] = await Promise.all([
          getRecruiterAccount(id, token),
          getJobPostCatalogs(),
          getRecruiterJobPosts(token, id),
        ]);

        const isCompanyOnboarded =
          nextAccount.company &&
          (nextAccount.company.verificationStatus === "VERIFIED" ||
            nextAccount.company.businessLicenseFileId);

        const blocked = !nextAccount.profile || !isCompanyOnboarded;

        if (blocked) {
          setRedirecting(true);
          setLoading(false);
          const result = await Swal.fire({
            icon: "warning",
            title: t("jobPostsPage.onboardingBlockedTitle"),
            text: t("jobPostsPage.onboardingBlockedText"),
            confirmButtonColor: "#10a778",
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
          if (result.isConfirmed) {
            router.replace("/recruiter/company-profile");
          }
          return;
        }

        const [nextCompanyLocations, nextCompany] = nextAccount.company?.id
          ? await Promise.all([
              getCompanyLocations(nextAccount.company.id, token),
              getCompany(nextAccount.company.id, token),
            ])
          : [[], null];

        setAccount(nextAccount);
        setCompanyLogoUrl(nextCompany?.logoFile?.publicUrl ?? "");
        setCompanyLocations(nextCompanyLocations);
        setCatalogs(nextCatalogs);
        setJobs(nextJobs);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearRecruiterSession();
          router.replace("/recruiter/login");
          return;
        }

        showToast("error", getJobPostErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [router, t],
  );

  useEffect(() => {
    const session = getRecruiterSession();

    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setToken(session.accessToken);
    void loadPageData(session.user.id, session.accessToken);
  }, [loadPageData, router]);

  async function reloadJobs() {
    if (!token || !accountId) return;

    setJobs(await getRecruiterJobPosts(token, accountId));
  }

  async function submit(values: JobPostFormValues) {
    try {
      if (view === "edit" && activeJob) {
        // Edit flow
        await updateRecruiterJobPost(
          activeJob.id,
          {
            benefits: values.benefits,
            description: values.description,
            employmentTypeId: values.employmentTypeId,
            experienceLevelId: values.experienceLevelId,
            jobCategoryId: values.jobCategoryId,
            requirements: values.requirements,
            salaryCurrency: "VND",
            salaryIsNegotiable: values.salaryIsNegotiable,
            salaryIsVisible: values.salaryIsVisible,
            salaryMax: values.salaryMax,
            salaryMin: values.salaryMin,
            title: values.title,
            vacanciesCount: values.vacanciesCount,
            educationLevel: values.educationLevel,
            workingDays: values.workingDays || undefined,
            expiredAt: values.expiredAt ? new Date(values.expiredAt).toISOString() : undefined,
          },
          token,
        );

        // Update locations relations
        const oldLocationIds = activeJob.jobPostLocations.map((l) => l.jobLocation.id);
        const locationsToAdd = values.jobLocationIds.filter((id) => !oldLocationIds.includes(id));
        const locationsToRemove = oldLocationIds.filter(
          (id) => !values.jobLocationIds.includes(id),
        );

        // Update skills relations
        const oldSkillIds = activeJob.jobPostSkills.map((s) => s.skill.id);
        const skillsToAdd = values.skillIds.filter((id) => !oldSkillIds.includes(id));
        const skillsToRemove = oldSkillIds.filter((id) => !values.skillIds.includes(id));

        // Update specializations relations
        const oldSpecializationIds =
          ((activeJob as any).jobPostSpecializations as any[] | undefined)?.map(
            (s) => s.specialization.id,
          ) ?? [];
        const specializationsToAdd = values.specializationIds.filter(
          (id) => !oldSpecializationIds.includes(id),
        );
        const specializationsToRemove = oldSpecializationIds.filter(
          (id) => !values.specializationIds.includes(id),
        );

        await Promise.all([
          ...locationsToAdd.map((id) => addLocationToRecruiterJobPost(activeJob.id, id, token)),
          ...locationsToRemove.map((id) =>
            deleteLocationFromRecruiterJobPost(activeJob.id, id, token),
          ),
          ...skillsToAdd.map((id) => addSkillToRecruiterJobPost(activeJob.id, id, token)),
          ...skillsToRemove.map((id) => deleteSkillFromRecruiterJobPost(activeJob.id, id, token)),
          ...specializationsToAdd.map((id) =>
            addSpecializationToRecruiterJobPost(activeJob.id, id, token),
          ),
          ...specializationsToRemove.map((id) =>
            deleteSpecializationFromRecruiterJobPost(activeJob.id, id, token),
          ),
        ]);

        showToast("success", "Cập nhật tin tuyển dụng thành công.");
      } else {
        // Create flow
        const createdJob = await createRecruiterJobPost(
          {
            benefits: values.benefits,
            description: values.description,
            employmentTypeId: values.employmentTypeId,
            experienceLevelId: values.experienceLevelId,
            jobCategoryId: values.jobCategoryId,
            requirements: values.requirements,
            salaryCurrency: "VND",
            salaryIsNegotiable: values.salaryIsNegotiable,
            salaryIsVisible: values.salaryIsVisible,
            salaryMax: values.salaryMax,
            salaryMin: values.salaryMin,
            title: values.title,
            vacanciesCount: values.vacanciesCount,
            educationLevel: values.educationLevel,
            workingDays: values.workingDays || undefined,
            expiredAt: values.expiredAt ? new Date(values.expiredAt).toISOString() : undefined,
          },
          token,
        );

        await Promise.all([
          ...values.jobLocationIds.map((locationId) =>
            addLocationToRecruiterJobPost(createdJob.id, locationId, token),
          ),
          ...values.skillIds.map((skillId) =>
            addSkillToRecruiterJobPost(createdJob.id, skillId, token),
          ),
          ...values.specializationIds.map((specializationId) =>
            addSpecializationToRecruiterJobPost(createdJob.id, specializationId, token),
          ),
        ]);

        showToast("success", "Đã tạo bản nháp tin tuyển dụng thành công.");
      }

      form.reset();
      setEditorResetKey((key) => key + 1);
      await reloadJobs();
      setView("list");
      setActiveJob(null);
    } catch (error) {
      showToast("error", getJobPostErrorMessage(error));
    }
  }

  function startEdit(job: RecruiterJobPost) {
    setActiveJob(job);
    form.reset({
      title: job.title,
      description: job.description,
      requirements: job.requirements ?? "",
      benefits: job.benefits ?? "",
      salaryIsNegotiable: job.salaryIsNegotiable,
      salaryIsVisible: job.salaryIsVisible,
      salaryMin: job.salaryMin !== null ? Number(job.salaryMin) : undefined,
      salaryMax: job.salaryMax !== null ? Number(job.salaryMax) : undefined,
      vacanciesCount: job.vacanciesCount,
      jobCategoryId: job.jobCategory?.id ?? "",
      employmentTypeId: job.employmentType?.id ?? "",
      experienceLevelId: job.experienceLevel?.id ?? "",
      educationLevel: job.educationLevel ?? "ANY",
      jobLocationIds: job.jobPostLocations.map((l) => l.jobLocation.id),
      applicationEmails: "",
      skillIds: job.jobPostSkills.map((s) => s.skill.id),
      specializationIds:
        ((job as any).jobPostSpecializations as any[] | undefined)?.map(
          (s) => s.specialization.id,
        ) ?? [],
      workingDays: job.workingDays ?? "",
      expiredAt: job.expiredAt ? job.expiredAt.substring(0, 10) : "",
    });
    setEditorTab("compose");
    setView("edit");
  }

  async function publish(jobPostId: string) {
    try {
      setActionJobId(jobPostId);
      await publishRecruiterJobPost(jobPostId, token);
      await reloadJobs();
      showToast("success", "Tin tuyển dụng đã được gửi duyệt.");
    } catch (error) {
      showToast("error", getJobPostErrorMessage(error));
    } finally {
      setActionJobId(null);
    }
  }

  async function close(jobPostId: string) {
    try {
      setActionJobId(jobPostId);
      await closeRecruiterJobPost(jobPostId, token);
      await reloadJobs();
      showToast("success", "Tin tuyển dụng đã được đóng.");
    } catch (error) {
      showToast("error", getJobPostErrorMessage(error));
    } finally {
      setActionJobId(null);
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" &&
        job.status === "PUBLISHED" &&
        job.moderationStatus === "APPROVED") ||
      (statusFilter === "PENDING_REVIEW" &&
        job.status === "PUBLISHED" &&
        job.moderationStatus === "PENDING") ||
      (statusFilter !== "ACTIVE" &&
        statusFilter !== "PENDING_REVIEW" &&
        job.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  if (loading || redirecting) {
    return <div className="text-sm font-semibold text-slate-600">Đang tải tin tuyển dụng...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-outfit text-xl font-bold text-slate-950 sm:text-2xl">
            {view === "create"
              ? "Tạo tin tuyển dụng"
              : view === "edit"
                ? "Chỉnh sửa tin tuyển dụng"
                : view === "details"
                  ? "Chi tiết tin tuyển dụng"
                  : "Tin tuyển dụng"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={companyVerified ? "success" : "warning"}>
            {companyVerified ? "Công ty đã xác thực" : "Công ty chờ xác thực"}
          </Badge>
          <Badge tone="neutral">{jobs.length} tin</Badge>
          {view !== "list" ? (
            <Button
              variant="outline"
              onClick={() => {
                form.reset();
                setEditorTab("compose");
                setView("list");
                setActiveJob(null);
              }}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Quay lại danh sách
            </Button>
          ) : null}
        </div>
      </header>

      {(view === "create" || view === "edit") && (
        <>
          <div
            className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
            role="tablist"
            aria-label="Chế độ tạo tin tuyển dụng"
          >
            <button
              type="button"
              role="tab"
              aria-selected={editorTab === "compose"}
              aria-controls="job-post-compose-panel"
              id="job-post-compose-tab"
              onClick={() => setEditorTab("compose")}
              className={cn(
                "upnext-focus rounded-lg px-5 py-2.5 text-sm font-bold transition-colors",
                editorTab === "compose"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              Soạn tin
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editorTab === "preview"}
              aria-controls="job-post-preview-panel"
              id="job-post-preview-tab"
              onClick={() => setEditorTab("preview")}
              className={cn(
                "upnext-focus inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors",
                editorTab === "preview"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Eye size={17} aria-hidden="true" />
              Xem trước
            </button>
          </div>

          <Card
            id="job-post-compose-panel"
            role="tabpanel"
            aria-labelledby="job-post-compose-tab"
            className={cn(
              "overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow-sm",
              editorTab === "preview" && "hidden",
            )}
          >
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
              <div className="flex items-center gap-2">
                {view === "create" ? (
                  <Plus size={18} className="text-emerald-700" />
                ) : (
                  <PencilSimple size={18} className="text-emerald-700" />
                )}
                <h2 className="text-base font-bold text-slate-950">
                  {view === "create" ? "Mô tả công việc" : "Chỉnh sửa mô tả công việc"}
                </h2>
              </div>
            </div>

            <form
              onSubmit={form.handleSubmit(submit, (errors) =>
                showToast("error", getFirstErrorMessage(errors)),
              )}
              noValidate
              className="space-y-5 p-5"
            >
              <JobInput
                id="job-title"
                label="Chức danh"
                placeholder="Senior Frontend Engineer"
                register={form.register("title")}
                error={form.formState.errors.title?.message}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <JobSelect
                  label="Ngành nghề"
                  options={catalogs.categories}
                  placeholder="Chọn ngành nghề"
                  value={form.watch("jobCategoryId") ?? ""}
                  onValueChange={(value) =>
                    form.setValue("jobCategoryId", value, { shouldDirty: true })
                  }
                  error={form.formState.errors.jobCategoryId?.message}
                />
                <JobSelect
                  label="Cấp bậc"
                  options={catalogs.experienceLevels}
                  placeholder="Chọn cấp bậc"
                  value={form.watch("experienceLevelId") ?? ""}
                  onValueChange={(value) =>
                    form.setValue("experienceLevelId", value, { shouldDirty: true })
                  }
                  error={form.formState.errors.experienceLevelId?.message}
                />
                <JobSelect
                  label="Loại việc làm"
                  options={catalogs.employmentTypes}
                  placeholder="Chọn loại việc làm"
                  value={form.watch("employmentTypeId") ?? ""}
                  onValueChange={(value) =>
                    form.setValue("employmentTypeId", value, { shouldDirty: true })
                  }
                  error={form.formState.errors.employmentTypeId?.message}
                />
                <JobSelect
                  label="Trình độ học vấn"
                  options={EDUCATION_LEVEL_OPTIONS}
                  placeholder="Chọn trình độ học vấn"
                  value={form.watch("educationLevel") ?? "ANY"}
                  onValueChange={(value) =>
                    form.setValue("educationLevel", value, { shouldDirty: true })
                  }
                  error={form.formState.errors.educationLevel?.message}
                />
              </div>

              <LocationRelationPicker
                locations={companyLocations}
                selectedIds={form.watch("jobLocationIds") ?? []}
                onChange={(ids) => form.setValue("jobLocationIds", ids, { shouldDirty: true })}
              />

              <SearchTagPicker
                id="job-skills"
                label="Kỹ năng"
                placeholder="Nhập từ khóa để tìm kiếm kỹ năng..."
                options={catalogs.skills}
                selectedIds={form.watch("skillIds") ?? []}
                onChange={(ids) => form.setValue("skillIds", ids, { shouldDirty: true })}
              />

              <SearchTagPicker
                id="job-specializations"
                label="Chuyên ngành"
                placeholder="Nhập từ khóa để tìm kiếm chuyên ngành..."
                options={catalogs.specializations}
                selectedIds={form.watch("specializationIds") ?? []}
                onChange={(ids) => form.setValue("specializationIds", ids, { shouldDirty: true })}
              />

              <RichTextField
                key={`job-description-${editorResetKey}`}
                label="Mô tả"
                placeholder="Mô tả phạm vi công việc, sản phẩm và trách nhiệm chính..."
                value={form.watch("description") ?? ""}
                onChange={(value) =>
                  form.setValue("description", value, { shouldDirty: true, shouldValidate: true })
                }
                error={form.formState.errors.description?.message}
              />

              <RichTextField
                key={`job-requirements-${editorResetKey}`}
                label="Yêu cầu công việc"
                placeholder="Kinh nghiệm, kỹ năng bắt buộc, năng lực ưu tiên..."
                value={form.watch("requirements") ?? ""}
                onChange={(value) => form.setValue("requirements", value, { shouldDirty: true })}
                error={form.formState.errors.requirements?.message}
              />

              <RichTextField
                key={`job-benefits-${editorResetKey}`}
                label="Quyền lợi / Phúc lợi"
                placeholder="Lương thưởng, bảo hiểm, chế độ làm việc, lộ trình phát triển..."
                value={form.watch("benefits") ?? ""}
                onChange={(value) => form.setValue("benefits", value, { shouldDirty: true })}
                error={form.formState.errors.benefits?.message}
              />

              <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <Label className="text-sm font-bold text-slate-700">Mức lương</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <JobInput
                    id="job-salary-min"
                    label="Từ"
                    placeholder="20000000"
                    register={form.register("salaryMin")}
                    type="number"
                    error={form.formState.errors.salaryMin?.message}
                    disabled={form.watch("salaryIsNegotiable")}
                  />
                  <JobInput
                    id="job-salary-max"
                    label="Đến"
                    placeholder="40000000"
                    register={form.register("salaryMax")}
                    type="number"
                    error={form.formState.errors.salaryMax?.message}
                    disabled={form.watch("salaryIsNegotiable")}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <CheckboxRow
                    checked={form.watch("salaryIsNegotiable")}
                    id="job-salary-negotiable"
                    label="Lương thỏa thuận"
                    onCheckedChange={(checked) => {
                      form.setValue("salaryIsNegotiable", checked, { shouldDirty: true });
                      if (checked) {
                        form.setValue("salaryMin", undefined, { shouldDirty: true });
                        form.setValue("salaryMax", undefined, { shouldDirty: true });
                        form.setValue("salaryIsVisible", true, { shouldDirty: true });
                      }
                    }}
                  />
                  <CheckboxRow
                    checked={form.watch("salaryIsVisible")}
                    id="job-salary-visible"
                    label="Hiển thị lương"
                    disabled={form.watch("salaryIsNegotiable")}
                    onCheckedChange={(checked) =>
                      form.setValue("salaryIsVisible", checked, { shouldDirty: true })
                    }
                  />
                </div>
              </section>

              <JobInput
                id="job-vacancies"
                label="Số lượng tuyển dụng"
                placeholder="1"
                register={form.register("vacanciesCount")}
                type="number"
                error={form.formState.errors.vacanciesCount?.message}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <JobInput
                  id="job-working-days"
                  label="Thời gian làm việc"
                  placeholder="Thứ 2 - Thứ 6"
                  register={form.register("workingDays")}
                  error={form.formState.errors.workingDays?.message}
                />
                <JobInput
                  id="job-expired-at"
                  label="Hạn nộp hồ sơ"
                  placeholder=""
                  register={form.register("expiredAt")}
                  type="date"
                  min={new Date().toLocaleDateString("sv-SE")}
                  error={form.formState.errors.expiredAt?.message}
                />
              </div>

              <JobInput
                id="job-application-emails"
                label="Địa chỉ email nhận hồ sơ"
                placeholder="hr@company.com, recruitment@company.com"
                register={form.register("applicationEmails")}
                helperText="Địa chỉ email sẽ được ẩn với người tìm việc. Bạn có thể nhập nhiều địa chỉ cách nhau bằng dấu phẩy hoặc chấm phẩy."
                error={form.formState.errors.applicationEmails?.message}
              />

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={form.formState.isSubmitting}
                  onClick={() => {
                    form.reset();
                    setEditorTab("compose");
                    setView("list");
                    setActiveJob(null);
                  }}
                  className="h-11 px-6 font-bold text-slate-500 hover:bg-slate-50"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="h-11 bg-[#11a77a] px-6 font-bold text-white shadow-none hover:bg-[#0d966d]"
                >
                  {form.formState.isSubmitting
                    ? view === "edit"
                      ? "Đang lưu..."
                      : "Đang tạo..."
                    : view === "edit"
                      ? "Lưu thay đổi"
                      : "Tạo bản nháp"}
                </Button>
              </div>
            </form>
          </Card>

          {editorTab === "preview" ? (
            <div id="job-post-preview-panel" role="tabpanel" aria-labelledby="job-post-preview-tab">
              <RecruiterJobPostPreview
                companyName={account?.company?.name || "Doanh nghiệp của bạn"}
                companyLogoUrl={companyLogoUrl}
                companyVerified={companyVerified}
                values={previewValues}
                catalogs={catalogs}
                locations={companyLocations}
              />
            </div>
          ) : null}
        </>
      )}

      {view === "list" && (
        <RecruiterTableLayout
          loading={false}
          totalItems={filteredJobs.length}
          currentPage={activePage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          filterBar={
            <>
              <div className="relative w-full sm:w-[320px]">
                <MagnifyingGlass
                  size={18}
                  className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  aria-label="Tìm kiếm tin tuyển dụng"
                  placeholder="Tìm kiếm tin tuyển dụng..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border-input focus:border-primary h-10 w-full rounded-xl border bg-white pl-10 text-sm shadow-none focus:outline-none"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  aria-label="Lọc theo trạng thái tin tuyển dụng"
                  className="bg-card h-10 w-full rounded-xl sm:w-[190px]"
                >
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Đang đăng</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Chờ duyệt</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  <SelectItem value="CLOSED">Đã đóng</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          actionBar={
            <Button
              onClick={() => {
                setEditorTab("compose");
                setView("create");
              }}
              className="bg-[#11a77a] font-bold text-white hover:bg-[#0d966d]"
            >
              <Plus size={16} className="mr-1" />
              Tạo tin tuyển dụng
            </Button>
          }
        >
          <thead>
            <tr>
              <th scope="col">Tin tuyển dụng</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Ứng viên</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedJobs.map((job) => (
              <JobRow
                actionJobId={actionJobId}
                companyVerified={companyVerified}
                job={job}
                key={job.id}
                onClose={close}
                onPublish={publish}
                onViewDetails={(selectedJob) => {
                  setActiveJob(selectedJob);
                  setView("details");
                }}
                onEdit={startEdit}
              />
            ))}
            {paginatedJobs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-sm font-semibold text-slate-500">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Không tìm thấy tin tuyển dụng phù hợp."
                    : "Chưa có tin tuyển dụng."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </RecruiterTableLayout>
      )}
      {view === "details" && activeJob && (
        <RecruiterJobDetailView
          job={activeJob}
          onBack={() => {
            setView("list");
            setActiveJob(null);
          }}
        />
      )}
    </div>
  );
}

function getJobStatusBadge(job: RecruiterJobPost) {
  if (job.status === "DRAFT") {
    return { text: "Bản nháp", tone: "neutral" as const };
  }
  if (job.status === "CLOSED") {
    return { text: "Đã đóng", tone: "neutral" as const };
  }
  if (job.status === "PUBLISHED") {
    if (job.moderationStatus === "APPROVED") {
      return { text: "Đang đăng", tone: "success" as const };
    }
    if (job.moderationStatus === "REJECTED") {
      return { text: "Bị từ chối", tone: "error" as const };
    }
    return { text: "Chờ duyệt", tone: "warning" as const };
  }
  return { text: job.status, tone: "neutral" as const };
}

function JobRow({
  actionJobId,
  companyVerified,
  job,
  onClose,
  onPublish,
  onViewDetails,
  onEdit,
}: {
  actionJobId: string | null;
  companyVerified: boolean;
  job: RecruiterJobPost;
  onClose: (jobPostId: string) => void;
  onPublish: (jobPostId: string) => void;
  onViewDetails: (job: RecruiterJobPost) => void;
  onEdit: (job: RecruiterJobPost) => void;
}) {
  const pending = actionJobId === job.id;
  const { text: statusText, tone: statusTone } = getJobStatusBadge(job);

  const cleanDescription = job.description ? job.description.replace(/<[^>]*>/g, "") : "";

  return (
    <tr aria-label={job.title}>
      <td aria-label="Job post details">
        <div className="max-w-md">
          <p className="cursor-pointer text-sm font-extrabold text-slate-900 transition-colors hover:text-emerald-700">
            {job.title}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 font-medium text-slate-500">
            {cleanDescription}
          </p>
        </div>
      </td>
      <td aria-label="Job post status">
        <Badge tone={statusTone}>{statusText}</Badge>
      </td>
      <td>
        <div className="text-sm font-bold text-slate-800">{job._count?.applications ?? 0}</div>
        <p className="text-xs text-slate-500">{job._count?.views ?? 0} lượt xem</p>
      </td>
      <td>
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 w-8 items-center justify-center rounded-lg p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:ring-0 focus:ring-offset-0"
                aria-label="Thao tác"
              >
                <DotsThreeVertical size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-50 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => onViewDetails(job)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-hidden"
              >
                <Eye size={16} className="text-slate-500" />
                Xem chi tiết tin
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onEdit(job)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-hidden"
              >
                <PencilSimple size={16} className="text-slate-500" />
                Chỉnh sửa tin
              </DropdownMenuItem>

              {job.status !== "PUBLISHED" ? (
                <DropdownMenuItem
                  disabled={pending || !companyVerified}
                  onClick={() => onPublish(job.id)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 focus:outline-hidden disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Xuất bản
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={pending}
                  onClick={() => onClose(job.id)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 focus:outline-hidden disabled:opacity-50"
                >
                  <Prohibit size={16} />
                  Đóng tin tuyển dụng
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

function getEducationLevelLabel(level?: string) {
  switch (level) {
    case "ANY":
      return "Không yêu cầu";
    case "HIGH_SCHOOL":
      return "Trung học phổ thông";
    case "VOCATIONAL":
      return "Trung cấp";
    case "COLLEGE":
      return "Cao đẳng";
    case "BACHELOR":
      return "Đại học";
    case "POSTGRADUATE":
      return "Sau đại học";
    default:
      return "Không yêu cầu";
  }
}

function getCleanHtml(html: string | null | undefined) {
  if (!html) return "";
  let cleaned = html.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, "");
  cleaned = cleaned.replace(/<details[^>]*>/gi, "").replace(/<\/details>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Mô tả công việc\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Yêu cầu ứng viên\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Quyền lợi\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Mô tả công việc\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Yêu cầu ứng viên\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Quyền lợi\s*<\/p>/gi, "");
  return cleaned.trim();
}

function RecruiterJobDetailView({ job, onBack }: { job: RecruiterJobPost; onBack: () => void }) {
  const router = useRouter();
  const salary = formatSalary(job);

  const cleanDescription = getCleanHtml(job.description) || "Chưa có mô tả";
  const cleanRequirements = getCleanHtml(job.requirements) || "Chưa có yêu cầu";
  const cleanBenefits = getCleanHtml(job.benefits) || "Chưa có quyền lợi";

  // Calculate moderation status badge tone & text
  const modTone =
    job.moderationStatus === "APPROVED"
      ? "success"
      : job.moderationStatus === "REJECTED"
        ? "error"
        : "warning";
  const modText =
    job.moderationStatus === "APPROVED"
      ? "Đã duyệt"
      : job.moderationStatus === "REJECTED"
        ? "Từ chối"
        : "Chờ duyệt";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-base font-bold text-slate-900">
              <Briefcase size={18} className="text-emerald-600" />
              Mô tả công việc
            </h3>
            <div
              className="prose prose-sm max-w-none text-sm leading-relaxed break-words text-slate-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: cleanDescription }}
            />
          </Card>

          {job.requirements && (
            <Card className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="border-b border-slate-100 pb-2 text-base font-bold text-slate-900">
                Yêu cầu công việc
              </h3>
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed break-words text-slate-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: cleanRequirements }}
              />
            </Card>
          )}

          {job.benefits && (
            <Card className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="border-b border-slate-100 pb-2 text-base font-bold text-slate-900">
                Quyền lợi & Phúc lợi
              </h3>
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed break-words text-slate-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: cleanBenefits }}
              />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              Hiệu quả tin đăng
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Lượt xem
                </span>
                <span className="text-base font-extrabold text-slate-800">
                  {job._count?.views ?? 0}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Ứng tuyển
                </span>
                <span className="text-base font-extrabold text-slate-800">
                  {job._count?.applications ?? 0}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => router.push(`/recruiter/candidates?jobPostId=${job.id}`)}
                className="flex h-10 w-full items-center justify-center gap-2 bg-[#11a77a] text-xs font-bold text-white hover:bg-[#0d966d]"
              >
                <Users size={16} />
                Xem danh sách ứng viên ({job._count?.applications ?? 0})
              </Button>
            </div>
          </Card>

          <Card className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              Thông tin công việc
            </h3>

            {/* Section: Trạng thái duyệt */}
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Trạng thái duyệt
              </span>
              <div className="mt-1">
                <Badge tone={modTone}>{modText}</Badge>
              </div>
            </div>

            {/* Section: Thông tin chung */}
            <div className="space-y-3.5 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Ngành nghề
                </span>
                <span
                  className="max-w-[160px] truncate text-right font-semibold text-slate-700"
                  title={job.jobCategory?.name || ""}
                >
                  {job.jobCategory?.name || "Chưa cập nhật"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Cấp bậc
                </span>
                <span className="text-right font-semibold text-slate-700">
                  {job.experienceLevel?.name || "Chưa cập nhật"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Hình thức
                </span>
                <span className="text-right font-semibold text-slate-700">
                  {job.employmentType?.name || "Chưa cập nhật"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Mức lương
                </span>
                <span className="text-right font-extrabold text-emerald-700">{salary}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Số lượng tuyển
                </span>
                <span className="text-right font-semibold text-slate-700">
                  {job.vacanciesCount} người
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Học vấn tối thiểu
                </span>
                <span className="text-right font-semibold text-slate-700">
                  {getEducationLevelLabel(job.educationLevel)}
                </span>
              </div>

              {job.publishedAt && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Ngày xuất bản
                  </span>
                  <span className="text-right font-semibold text-slate-700">
                    {new Date(job.publishedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}

              {job.workingDays && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Thời gian làm việc
                  </span>
                  <span className="text-right font-semibold text-slate-700">{job.workingDays}</span>
                </div>
              )}

              {job.expiredAt && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Hạn nộp hồ sơ
                  </span>
                  <span className="text-right font-semibold text-rose-600">
                    {new Date(job.expiredAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
            </div>

            {/* Section: Địa điểm làm việc */}
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                Địa điểm làm việc
              </span>
              <div className="space-y-1.5">
                {job.jobPostLocations.map(({ jobLocation }) => (
                  <div
                    key={jobLocation.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs leading-relaxed font-semibold text-slate-700"
                  >
                    {formatLocation(jobLocation)}
                  </div>
                ))}
                {job.jobPostLocations.length === 0 && (
                  <span className="text-xs font-medium text-slate-500">Chưa có địa điểm</span>
                )}
              </div>
            </div>

            {/* Section: Kỹ năng & Chuyên ngành */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Kỹ năng yêu cầu
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {job.jobPostSkills.map(({ skill }) => (
                    <Badge key={skill.id} tone="info">
                      {skill.name}
                    </Badge>
                  ))}
                  {job.jobPostSkills.length === 0 && (
                    <span className="text-xs font-medium text-slate-500">Chưa có kỹ năng</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Chuyên ngành liên quan
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {((job as any).jobPostSpecializations as any[] | undefined)?.map(
                    ({ specialization }) => (
                      <Badge key={specialization.id} tone="brand">
                        {specialization.name}
                      </Badge>
                    ),
                  )}
                  {(!(job as any).jobPostSpecializations ||
                    ((job as any).jobPostSpecializations as any[]).length === 0) && (
                    <span className="text-xs font-medium text-slate-500">Chưa có chuyên ngành</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-10 border-slate-200 px-6 font-bold text-slate-700 hover:bg-slate-50"
        >
          Quay lại danh sách
        </Button>
      </div>
    </div>
  );
}

function JobInput({
  error,
  helperText,
  id,
  label,
  placeholder,
  register,
  type = "text",
  min,
  disabled,
}: {
  error?: string | undefined;
  helperText?: string;
  id: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  type?: "number" | "text" | "date";
  min?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <FormInput
        id={id}
        label={label}
        className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none placeholder:text-slate-400"
        placeholder={placeholder}
        type={type}
        min={min}
        disabled={disabled}
        {...register}
        {...(error ? { error } : {})}
      />
      {helperText && !error ? (
        <p className="text-xs leading-5 text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

function RichTextField({
  error,
  label,
  onChange,
  placeholder,
  value,
}: {
  error?: string | undefined;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-bold text-slate-700">{label}</Label>
      <RichTextEditor
        error={Boolean(error)}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
      {error ? <p className="text-xs font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}

function JobSelect({
  error,
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  error?: string | undefined;
  label: string;
  onValueChange: (value: string) => void;
  options: JobOption[];
  placeholder: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-bold text-slate-700">{label}</Label>
      <Select
        value={value || "none"}
        onValueChange={(nextValue) => onValueChange(nextValue === "none" ? "" : nextValue)}
      >
        <SelectTrigger
          aria-label={label}
          className="data-[state=open]:border-primary h-11 rounded-lg border-slate-200 bg-white shadow-none"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}

function CheckboxRow({
  checked,
  id,
  label,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={checked}
        className="size-4 border-emerald-600 data-[state=checked]:bg-emerald-600"
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <Label
        htmlFor={id}
        className={cn(
          "cursor-pointer text-sm font-semibold text-slate-700",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {label}
      </Label>
    </div>
  );
}

function LocationRelationPicker({
  locations,
  onChange,
  selectedIds,
}: {
  locations: CompanyLocation[];
  onChange: (ids: string[]) => void;
  selectedIds: string[];
}) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-700">Địa điểm làm việc</h3>
        <span className="text-xs font-semibold text-slate-500">{selectedIds.length} đã chọn</span>
      </div>
      {locations.length > 0 ? (
        <div className="grid max-h-40 gap-2 overflow-y-auto pr-1">
          {locations.map((location) => (
            <RelationCheckbox
              checked={selectedIds.includes(location.id)}
              id={`location-${location.id}`}
              key={location.id}
              label={formatLocation(location)}
              onCheckedChange={(checked) =>
                onChange(
                  checked
                    ? Array.from(new Set([...selectedIds, location.id]))
                    : selectedIds.filter((id) => id !== location.id),
                )
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-500">Chưa có địa điểm trong danh mục</p>
      )}
      <SelectedChips
        labels={selectedIds
          .map((id) => locations.find((location) => location.id === id))
          .filter((location): location is CompanyLocation => Boolean(location))
          .map((location) => ({ id: location.id, label: formatLocation(location) }))}
        onRemove={(id) => onChange(selectedIds.filter((selectedId) => selectedId !== id))}
      />
    </section>
  );
}

function SearchTagPicker({
  options,
  selectedIds,
  onChange,
  placeholder,
  label,
  id,
}: {
  options: JobOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  label: string;
  id: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = options.filter(
    (option) =>
      option.name.toLowerCase().includes(query.toLowerCase()) && !selectedIds.includes(option.id),
  );

  const handleSelect = (optionId: string) => {
    onChange(Array.from(new Set([...selectedIds, optionId])));
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (optionId: string) => {
    onChange(selectedIds.filter((id) => id !== optionId));
  };

  const selectedOptions = selectedIds
    .map((selectedId) => options.find((opt) => opt.id === selectedId))
    .filter((opt): opt is JobOption => Boolean(opt));

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <Label htmlFor={id} className="text-sm font-bold text-slate-700">
        {label}
      </Label>
      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-none focus-within:border-emerald-500">
          <MagnifyingGlass size={16} className="text-slate-400" />
          <input
            id={id}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const firstOption = filtered[0];
                if (firstOption) {
                  handleSelect(firstOption.id);
                }
              }
            }}
            placeholder={placeholder}
            className="h-9 w-full bg-transparent text-sm placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        {isOpen && (
          <div className="absolute z-55 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {filtered.length > 0 ? (
              <ul>
                {filtered.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(option.id);
                      }}
                      className="w-full px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      {option.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() !== "" ? (
              <p className="px-3 py-2 text-xs font-semibold text-slate-500">
                Không tìm thấy kết quả phù hợp.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <SelectedChips
        labels={selectedOptions.map((opt) => ({ id: opt.id, label: opt.name }))}
        onRemove={handleRemove}
      />
    </div>
  );
}

function RelationCheckbox({
  checked,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 hover:border-emerald-300">
      <Checkbox
        checked={checked}
        className="size-4 border-emerald-600 data-[state=checked]:bg-emerald-600"
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label
        htmlFor={id}
        className="min-w-0 flex-1 cursor-pointer truncate text-sm font-semibold text-slate-700"
      >
        {label}
      </Label>
    </div>
  );
}

function SelectedChips({
  labels,
  onRemove,
}: {
  labels: { id: string; label: string }[];
  onRemove: (id: string) => void;
}) {
  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((item) => (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"
          key={item.id}
        >
          {item.label}
          <button
            aria-label={`Bỏ chọn ${item.label}`}
            className="rounded-full text-emerald-700 hover:text-emerald-950"
            onClick={() => onRemove(item.id)}
            type="button"
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

function formatSalary(job: RecruiterJobPost) {
  if (job.salaryIsNegotiable) return "Lương thỏa thuận";
  if (!job.salaryIsVisible) return "Không hiển thị lương";

  const min = job.salaryMin ? Number(job.salaryMin).toLocaleString("vi-VN") : null;
  const max = job.salaryMax ? Number(job.salaryMax).toLocaleString("vi-VN") : null;

  if (min && max) return `${min} - ${max} ${job.salaryCurrency}`;
  if (min) return `Từ ${min} ${job.salaryCurrency}`;
  if (max) return `Đến ${max} ${job.salaryCurrency}`;

  return "Chưa nhập lương";
}

function formatLocation(location: CompanyLocation | JobLocationOption) {
  return [location.city, location.district, location.address].filter(Boolean).join(" - ");
}
