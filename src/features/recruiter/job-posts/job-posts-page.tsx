"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, CheckCircle, LockKey, Plus, Prohibit, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegisterReturn } from "react-hook-form";
import Swal, { type SweetAlertIcon } from "sweetalert2";
import { z } from "zod";

import {
  getRecruiterAccount,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

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
  locations: [],
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
  const [token, setToken] = useState("");
  const [account, setAccount] = useState<RecruiterAccountDetail | null>(null);
  const [catalogs, setCatalogs] = useState<JobPostCatalogs>(emptyCatalogs);
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
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
      skillIds: [],
      specializationIds: [],
    },
  });

  const onboardingBlocked = useMemo(() => {
    if (!account) return true;

    return !account.profile || !account.company || !account.company.businessLicenseFileId;
  }, [account]);

  const companyVerified = account?.company?.verificationStatus === "VERIFIED";

  const loadPageData = useCallback(
    async (accountId: string, accessToken: string) => {
      try {
        setLoading(true);
        const [nextAccount, nextCatalogs, nextJobs] = await Promise.all([
          getRecruiterAccount(accountId, accessToken),
          getJobPostCatalogs(),
          getRecruiterJobPosts(accessToken),
        ]);

        setAccount(nextAccount);
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
    [router],
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
    if (!token) return;

    setJobs(await getRecruiterJobPosts(token));
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

      form.reset();
      await reloadJobs();
      showToast("success", "Đã tạo bản nháp tin tuyển dụng.");
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

  if (loading) {
    return <div className="text-sm font-semibold text-slate-600">Đang tải tin tuyển dụng...</div>;
  }

  if (onboardingBlocked) {
    return (
      <Card className="rounded-lg border-amber-200 bg-amber-50 p-6 shadow-none">
        <div className="flex items-start gap-3">
          <LockKey size={24} className="mt-0.5 text-amber-700" />
          <div>
            <h1 className="text-xl font-extrabold text-slate-950">Hoàn tất hồ sơ công ty</h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Tài khoản cần có hồ sơ recruiter, công ty và minh chứng doanh nghiệp trước khi tạo tin
              tuyển dụng.
            </p>
            <Button
              className="mt-4 bg-[#11a77a] hover:bg-[#0d966d]"
              onClick={() => router.push("/recruiter")}
            >
              Về dashboard
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-emerald-700 uppercase">
            Recruiter Workspace
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Tin tuyển dụng</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={companyVerified ? "success" : "warning"}>
            {companyVerified ? "Công ty đã xác thực" : "Công ty chờ xác thực"}
          </Badge>
          <Badge tone="neutral">{jobs.length} tin</Badge>
        </div>
      </header>

      <section className="space-y-6">
        <Card className="rounded-lg border-slate-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={form.handleSubmit(submit, (errors) =>
              showToast("error", getFirstErrorMessage(errors)),
            )}
            noValidate
          >
            <div className="flex items-center gap-2">
              <Plus size={19} className="text-emerald-700" />
              <h2 className="text-lg font-extrabold text-slate-950">Tạo bản nháp</h2>
            </div>

            <div className="mt-5 space-y-4">
              <JobInput
                id="job-title"
                label="Tiêu đề"
                placeholder="Senior Frontend Engineer"
                register={form.register("title")}
              />

              <JobTextarea
                id="job-description"
                label="Mô tả công việc"
                placeholder="Mô tả phạm vi công việc, sản phẩm và trách nhiệm chính..."
                register={form.register("description")}
              />

              <JobTextarea
                id="job-requirements"
                label="Yêu cầu"
                placeholder="Kinh nghiệm, kỹ năng bắt buộc, năng lực ưu tiên..."
                register={form.register("requirements")}
              />

              <JobTextarea
                id="job-benefits"
                label="Phúc lợi"
                placeholder="Lương thưởng, bảo hiểm, remote, đào tạo..."
                register={form.register("benefits")}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <JobSelect
                  label="Danh mục"
                  options={catalogs.categories}
                  placeholder="Chọn danh mục"
                  value={form.watch("jobCategoryId") ?? ""}
                  onValueChange={(value) =>
                    form.setValue("jobCategoryId", value, { shouldDirty: true })
                  }
                />
                <JobSelect
                  label="Cấp bậc"
                  options={catalogs.experienceLevels}
                  placeholder="Chọn cấp bậc"
                  value={form.watch("experienceLevelId") ?? ""}
                  onValueChange={(value) =>
                    form.setValue("experienceLevelId", value, { shouldDirty: true })
                  }
                />
                <JobSelect
                  label="Hình thức"
                  options={catalogs.employmentTypes}
                  placeholder="Chọn hình thức"
                  value={form.watch("employmentTypeId") ?? ""}
                  onValueChange={(value) =>
                    form.setValue("employmentTypeId", value, { shouldDirty: true })
                  }
                />
              </div>

              <RelationPicker
                emptyLabel="Chưa có kỹ năng trong danh mục"
                label="Kỹ năng"
                options={catalogs.skills}
                selectedIds={form.watch("skillIds") ?? []}
                onChange={(ids) => form.setValue("skillIds", ids, { shouldDirty: true })}
              />

              <RelationPicker
                emptyLabel="Chưa có chuyên ngành trong danh mục"
                label="Chuyên ngành"
                options={catalogs.specializations}
                selectedIds={form.watch("specializationIds") ?? []}
                onChange={(ids) => form.setValue("specializationIds", ids, { shouldDirty: true })}
              />

              <LocationRelationPicker
                locations={catalogs.locations}
                selectedIds={form.watch("jobLocationIds") ?? []}
                onChange={(ids) => form.setValue("jobLocationIds", ids, { shouldDirty: true })}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <JobInput
                  id="job-salary-min"
                  label="Lương từ"
                  placeholder="20000000"
                  register={form.register("salaryMin")}
                  type="number"
                />
                <JobInput
                  id="job-salary-max"
                  label="Lương đến"
                  placeholder="40000000"
                  register={form.register("salaryMax")}
                  type="number"
                />
                <JobInput
                  id="job-vacancies"
                  label="Số lượng"
                  placeholder="1"
                  register={form.register("vacanciesCount")}
                  type="number"
                />
              </div>

              <div className="grid gap-2">
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

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 w-full rounded-lg bg-[#11a77a] font-extrabold hover:bg-[#0d966d]"
              >
                {form.formState.isSubmitting ? "Đang tạo..." : "Tạo bản nháp"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div className="flex items-center gap-2">
              <Briefcase size={19} className="text-emerald-700" />
              <h2 className="text-lg font-extrabold text-slate-950">Danh sách tin</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
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
              </tbody>
            </table>
          </div>

          {jobs.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Chưa có tin tuyển dụng.
            </div>
          ) : null}
        </Card>
      </section>
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
  id,
  label,
  placeholder,
  register,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  type?: "number" | "text";
}) {
  return (
    <FormInput
      id={id}
      label={label}
      className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none placeholder:text-slate-400"
      placeholder={placeholder}
      type={type}
      {...register}
    />
  );
}

function JobTextarea({
  id,
  label,
  placeholder,
  register,
}: {
  id: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-bold text-slate-700">
        {label}
      </Label>
      <textarea
        id={id}
        className="upnext-focus min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-none placeholder:text-slate-400"
        placeholder={placeholder}
        {...register}
      />
    </div>
  );
}

function JobSelect({
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: {
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
          className="h-11 rounded-lg border-slate-200 bg-white shadow-none"
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

function RelationPicker({
  emptyLabel,
  label,
  onChange,
  options,
  selectedIds,
}: {
  emptyLabel: string;
  label: string;
  onChange: (ids: string[]) => void;
  options: JobOption[];
  selectedIds: string[];
}) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-700">{label}</h3>
        <span className="text-xs font-semibold text-slate-500">{selectedIds.length} đã chọn</span>
      </div>
      {options.length > 0 ? (
        <div className="grid max-h-40 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {options.map((option) => (
            <RelationCheckbox
              checked={selectedIds.includes(option.id)}
              key={option.id}
              label={option.name}
              onCheckedChange={(checked) =>
                onChange(
                  checked
                    ? Array.from(new Set([...selectedIds, option.id]))
                    : selectedIds.filter((id) => id !== option.id),
                )
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-500">{emptyLabel}</p>
      )}
      <SelectedChips
        labels={selectedIds
          .map((id) => options.find((option) => option.id === id))
          .filter((option): option is JobOption => Boolean(option))
          .map((option) => ({ id: option.id, label: option.name }))}
        onRemove={(id) => onChange(selectedIds.filter((selectedId) => selectedId !== id))}
      />
    </section>
  );
}

function LocationRelationPicker({
  locations,
  onChange,
  selectedIds,
}: {
  locations: JobLocationOption[];
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
          .filter((location): location is JobLocationOption => Boolean(location))
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

function formatLocation(location: JobLocationOption) {
  return [location.workingModel, location.city, location.district].filter(Boolean).join(" - ");
}
