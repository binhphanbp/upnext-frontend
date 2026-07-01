"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, CheckCircle, Plus, Prohibit, X } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegisterReturn } from "react-hook-form";
import Swal, { type SweetAlertIcon } from "sweetalert2";
import { z } from "zod";

import {
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
} from "@/features/recruiter/job-posts/api";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RichTextEditor } from "@/shared/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

import { RecruiterTableLayout } from "../components/recruiter-table-layout";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3400,
  timerProgressBar: true,
});

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).optional(),
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
    vacanciesCount: z.coerce.number().int().min(1, "Số lượng tuyển phải từ 1."),
    jobCategoryId: z.string().optional(),
    employmentTypeId: z.string().optional(),
    experienceLevelId: z.string().optional(),
    jobLocationIds: z.array(z.string()).default([]),
    applicationEmails: optionalEmailList,
    skillIds: z.array(z.string()).default([]),
    specializationIds: z.array(z.string()).default([]),
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
  const [catalogs, setCatalogs] = useState<JobPostCatalogs>(emptyCatalogs);
  const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [actionJobId, setActionJobId] = useState<string | null>(null);

  const [submitAction, setSubmitAction] = useState<"draft" | "publish">("draft");
  const [editorResetKey, setEditorResetKey] = useState(0);

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
      jobLocationIds: [],
      applicationEmails: "",
      skillIds: [],
      specializationIds: [],
    },
  });

  const companyVerified = account?.company?.verificationStatus === "VERIFIED";

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

        const nextCompanyLocations = nextAccount.company?.id
          ? await getCompanyLocations(nextAccount.company.id, token)
          : [];

        setAccount(nextAccount);
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

      if (submitAction === "publish") {
        await publishRecruiterJobPost(createdJob.id, token);
        showToast("success", "Tin tuyển dụng đã được đăng thành công.");
      } else {
        showToast("success", "Đã lưu bản nháp tin tuyển dụng thành công.");
      }

      form.reset();
      setEditorResetKey((key) => key + 1);
      await reloadJobs();
    } catch (error) {
      showToast("error", getJobPostErrorMessage(error));
    }
  }

  async function publish(jobPostId: string) {
    try {
      setActionJobId(jobPostId);
      await publishRecruiterJobPost(jobPostId, token);
      await reloadJobs();
      showToast("success", "Tin tuyển dụng đã được xuất bản.");
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

  if (loading || redirecting) {
    return <div className="text-sm font-semibold text-slate-600">Đang tải tin tuyển dụng...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-outfit text-xl font-bold text-slate-950 sm:text-2xl">
            Tin tuyển dụng
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={companyVerified ? "success" : "warning"}>
            {companyVerified ? "Công ty đã xác thực" : "Công ty chờ xác thực"}
          </Badge>
          <Badge tone="neutral">{jobs.length} tin</Badge>
        </div>
      </header>
      <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-emerald-700" />
            <h2 className="text-base font-bold text-slate-950">Mô tả công việc</h2>
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

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <LocationRelationPicker
            locations={companyLocations}
            selectedIds={form.watch("jobLocationIds") ?? []}
            onChange={(ids) => form.setValue("jobLocationIds", ids, { shouldDirty: true })}
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
              />
              <JobInput
                id="job-salary-max"
                label="Đến"
                placeholder="40000000"
                register={form.register("salaryMax")}
                type="number"
                error={form.formState.errors.salaryMax?.message}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckboxRow
                checked={form.watch("salaryIsNegotiable")}
                id="job-salary-negotiable"
                label="Lương thỏa thuận"
                onCheckedChange={(checked) =>
                  form.setValue("salaryIsNegotiable", checked, { shouldDirty: true })
                }
              />
              <CheckboxRow
                checked={form.watch("salaryIsVisible")}
                id="job-salary-visible"
                label="Hiển thị lương"
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
              type="submit"
              variant="outline"
              disabled={form.formState.isSubmitting}
              onClick={() => setSubmitAction("draft")}
              className="h-11 border-slate-200 px-6 font-bold text-slate-700 hover:bg-slate-50"
            >
              {form.formState.isSubmitting && submitAction === "draft" ? "Đang lưu..." : "Lưu nháp"}
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              onClick={() => setSubmitAction("publish")}
              className="h-11 bg-[#11a77a] px-6 font-bold text-white shadow-none hover:bg-[#0d966d]"
            >
              {form.formState.isSubmitting && submitAction === "publish"
                ? "Đang đăng..."
                : "Đăng tin"}
            </Button>
          </div>
        </form>
      </Card>

      <RecruiterTableLayout
        loading={false}
        filterBar={
          <div className="flex items-center gap-2">
            <Briefcase size={19} className="text-emerald-700" />
            <h2 className="text-lg font-extrabold text-slate-950">Danh sách tin</h2>
          </div>
        }
      >
        <thead className="bg-slate-50 text-left text-xs font-extrabold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-5 py-3" scope="col">
              Tin tuyển dụng
            </th>
            <th className="px-5 py-3" scope="col">
              Trạng thái
            </th>
            <th className="px-5 py-3" scope="col">
              Ứng viên
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <JobRow
              actionJobId={actionJobId}
              companyVerified={companyVerified}
              job={job}
              key={job.id}
              onClose={close}
              onPublish={publish}
            />
          ))}
          {jobs.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-5 py-10 text-center text-sm font-semibold text-slate-500"
              >
                Chưa có tin tuyển dụng.
              </td>
            </tr>
          ) : null}
        </tbody>
      </RecruiterTableLayout>
    </div>
  );
}

function JobRow({
  actionJobId,
  companyVerified,
  job,
  onClose,
  onPublish,
}: {
  actionJobId: string | null;
  companyVerified: boolean;
  job: RecruiterJobPost;
  onClose: (jobPostId: string) => void;
  onPublish: (jobPostId: string) => void;
}) {
  const pending = actionJobId === job.id;
  const statusTone =
    job.status === "PUBLISHED" ? "success" : job.status === "CLOSED" ? "neutral" : "warning";
  const salary = formatSalary(job);

  return (
    <tr className="align-top" aria-label={job.title}>
      <td className="px-5 py-4" aria-label="Job post details">
        <div className="max-w-md">
          <p className="font-extrabold text-slate-950">{job.title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{job.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.jobCategory ? <Badge tone="neutral">{job.jobCategory.name}</Badge> : null}
            {job.experienceLevel ? <Badge tone="neutral">{job.experienceLevel.name}</Badge> : null}
            {job.employmentType ? <Badge tone="neutral">{job.employmentType.name}</Badge> : null}
            {job.jobPostSkills.slice(0, 3).map(({ skill }) => (
              <Badge key={skill.id} tone="info">
                {skill.name}
              </Badge>
            ))}
            {job.jobPostLocations.slice(0, 2).map(({ jobLocation }) => (
              <Badge key={jobLocation.id} tone="brand">
                {formatLocation(jobLocation)}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-xs font-bold text-emerald-700">{salary}</p>
        </div>
      </td>
      <td className="px-5 py-4" aria-label="Job post status">
        <div className="space-y-2">
          <Badge tone={statusTone}>{job.status}</Badge>
          <p className="text-xs text-slate-500">{job.moderationStatus}</p>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="text-sm font-bold text-slate-800">{job._count?.applications ?? 0}</div>
        <p className="text-xs text-slate-500">{job._count?.views ?? 0} lượt xem</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          {job.status !== "PUBLISHED" ? (
            <Button
              type="button"
              size="sm"
              disabled={pending || !companyVerified}
              className="gap-1.5 bg-[#11a77a] hover:bg-[#0d966d]"
              onClick={() => onPublish(job.id)}
            >
              <CheckCircle size={15} />
              Xuất bản
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              className="gap-1.5"
              onClick={() => onClose(job.id)}
            >
              <Prohibit size={15} />
              Đóng
            </Button>
          )}
        </div>
      </td>
    </tr>
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
}: {
  error?: string | undefined;
  helperText?: string;
  id: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  type?: "number" | "text";
}) {
  return (
    <div className="space-y-1">
      <FormInput
        id={id}
        label={label}
        className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none placeholder:text-slate-400"
        placeholder={placeholder}
        type={type}
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
}: {
  checked: boolean;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={checked}
        className="size-4 border-emerald-600 data-[state=checked]:bg-emerald-600"
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id} className="cursor-pointer text-sm font-semibold text-slate-700">
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

function RelationCheckbox({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = `relation-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

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
  return [location.workingModel, location.city, location.district, location.address]
    .filter(Boolean)
    .join(" - ");
}
