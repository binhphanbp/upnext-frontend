"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Briefcase,
  CheckCircle,
  DotsThreeVertical,
  Eye,
  FileArrowUp,
  FileXls,
  MagnifyingGlass,
  MapPin,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  Prohibit,
  Sparkle,
  Trash,
  Users,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, type FieldErrors, type UseFormRegisterReturn } from "react-hook-form";
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
  closeRecruiterJobPost,
  createRecruiterJobPost,
  createSkillOption,
  createSpecializationOption,
  deleteRecruiterJobPost,
  extractJobPostDraft,
  extractJobPostDraftFile,
  getJobPostCatalogs,
  getRecruiterJobPosts,
  type JobLocationOption,
  type JobOption,
  type JobPostAiDraftResponse,
  type JobPostCatalogs,
  publishRecruiterJobPost,
  type RecruiterJobPost,
  reopenRecruiterJobPost,
  type SalaryPeriod,
  setJobPostLocations,
  setJobPostSkills,
  setJobPostSpecializations,
  updateRecruiterJobPost,
} from "@/features/recruiter/job-posts/api";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { getPathname, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { toComparableName } from "@/shared/lib/comparable-name";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { DatePicker } from "@/shared/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
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
import { JobPostAccessDialog } from "./job-post-access-dialog";
import { consumeJobPostAiAutofillNotice, consumeJobPostAiDraft } from "./job-post-ai-draft-storage";
import { JobPostAiImport } from "./job-post-ai-import";
import { JobPostFilters } from "./job-post-filters";
import {
  clearJobPostFormDraft,
  loadJobPostFormDraft,
  saveJobPostFormDraft,
} from "./job-post-form-draft-storage";
import { saveRecruiterJobPostPreview } from "./job-post-preview-storage";
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

const EDUCATION_LEVEL_OPTIONS: JobOption[] = [
  { id: "ANY", name: "Không yêu cầu" },
  { id: "HIGH_SCHOOL", name: "Trung học phổ thông" },
  { id: "VOCATIONAL", name: "Trung cấp" },
  { id: "COLLEGE", name: "Cao đẳng" },
  { id: "BACHELOR", name: "Đại học" },
  { id: "POSTGRADUATE", name: "Sau đại học" },
];

const SALARY_PERIOD_OPTIONS: ReadonlyArray<{ id: string; name: string }> = [
  { id: "HOUR", name: "Theo giờ" },
  { id: "DAY", name: "Theo ngày" },
  { id: "MONTH", name: "Theo tháng" },
  { id: "YEAR", name: "Theo năm" },
];

const JOB_STATUS_FILTER_OPTIONS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Đang đăng", value: "ACTIVE" },
  { label: "Sắp hết hạn", value: "EXPIRING_SOON" },
  { label: "Chờ duyệt", value: "PENDING_REVIEW" },
  { label: "Bản nháp", value: "DRAFT" },
  { label: "Đã đóng", value: "CLOSED" },
];
const EXPIRING_SOON_DAYS = 7;

const jobPostSchema = z
  .object({
    title: z.string().trim().min(5, "Vui lòng nhập tiêu đề tối thiểu 5 ký tự."),
    description: z.string().trim().min(30, "Mô tả công việc cần tối thiểu 30 ký tự."),
    requirements: z.string().trim().optional(),
    benefits: z.string().trim().optional(),
    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    salaryPeriod: z.enum(["HOUR", "DAY", "MONTH", "YEAR"]).default("MONTH"),
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

/** Marks the fields the API (or the form schema) will refuse to submit without. */
function RequiredMark() {
  return (
    <span className="text-rose-600" title="Bắt buộc">
      {" *"}
    </span>
  );
}

function byName(left: JobOption, right: JobOption) {
  return left.name.localeCompare(right.name, "vi");
}

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

function getJobPostErrorMessage(error: unknown, reputationScore?: string) {
  if (!(error instanceof ApiError)) {
    // The request never reached a response: the API restarted, the network dropped, or the tab went
    // offline. Retrying is safe — a draft already created is reused rather than duplicated.
    return "Mất kết nối đến hệ thống khi đang lưu. Vui lòng bấm lại để thử tiếp.";
  }

  if (error.status === 400) {
    const reason = error.message.toLowerCase();
    // The API states exactly what is missing; repeating a vague "hồ sơ chưa hoàn tất" left the
    // recruiter with nothing to act on.
    if (reason.includes("business license")) {
      return "Công ty chưa có giấy phép kinh doanh trong hồ sơ. Vui lòng tải lên ở Hồ sơ công ty rồi thử lại.";
    }
    if (reason.includes("not been attached to a company")) {
      return "Tài khoản của bạn chưa được gắn với công ty nào. Vui lòng hoàn tất hồ sơ công ty trước.";
    }
    return "Thông tin tin tuyển dụng chưa hợp lệ hoặc công ty chưa hoàn tất hồ sơ.";
  }

  if (error.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error.status === 403) {
    if (error.message.toLowerCase().includes("reputation score")) {
      // The threshold is server-side config, so read it back out of the message rather than
      // hardcoding a second copy of it here.
      const required = error.message.match(/at least (\d+(?:\.\d+)?)/)?.[1];
      const current = reputationScore?.trim() ? `Hiện tại: ${reputationScore}. ` : "";
      return `Điểm uy tín của công ty chưa đủ để đăng tin${required ? ` (cần tối thiểu ${required})` : ""}. ${current}Bạn có thể tăng điểm bằng cách xác thực mã số thuế, hoàn thiện thông tin công ty và xử lý CV ứng viên đúng hạn.`;
    }
    return "Công ty cần được xác thực trước khi xuất bản tin tuyển dụng.";
  }

  if (error.status >= 500) {
    return "Hệ thống đang gặp sự cố khi xử lý tin tuyển dụng.";
  }

  return "Không thể xử lý tin tuyển dụng. Vui lòng thử lại.";
}

type RecruiterJobPostsPageProps = Readonly<{
  initialView?: "list" | "create";
  openCreateOptions?: boolean;
  editJobId?: string;
}>;

export function RecruiterJobPostsPage({
  initialView = "list",
  openCreateOptions = false,
  editJobId,
}: RecruiterJobPostsPageProps) {
  const router = useRouter();
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [account, setAccount] = useState<RecruiterAccountDetail | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [catalogs, setCatalogs] = useState<JobPostCatalogs>(emptyCatalogs);
  const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableRefreshing, setTableRefreshing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [actionJobId, setActionJobId] = useState<string | null>(null);

  const [editorResetKey, setEditorResetKey] = useState(0);
  const [view, setView] = useState<"list" | "create" | "import_jd" | "details" | "edit">(
    initialView,
  );
  const [editorTab, setEditorTab] = useState<"compose" | "preview">("compose");
  const [activeJob, setActiveJob] = useState<RecruiterJobPost | null>(null);
  const [accessManagementJob, setAccessManagementJob] = useState<RecruiterJobPost | null>(null);
  const [resolvingEditTarget, setResolvingEditTarget] = useState(Boolean(editJobId));
  const editTargetResolvedRef = useRef(false);

  const [showCreateOptionsModal, setShowCreateOptionsModal] = useState(openCreateOptions);
  const [isExtractingJd, setIsExtractingJd] = useState(false);
  /**
   * Names the AI proposed that the catalog is missing. They used to be counted in a toast and then
   * thrown away, which is why an autofilled JD arrived with empty Kỹ năng / Chuyên ngành.
   */
  const [aiSuggestedSkills, setAiSuggestedSkills] = useState<string[]>([]);
  const [aiSuggestedSpecializations, setAiSuggestedSpecializations] = useState<string[]>([]);
  /** Which footer button started the current submit: save a draft, or send it to moderation. */
  const submitIntentRef = useRef<"draft" | "publish">("draft");
  /** Draft created by a submit that failed part-way, so a retry updates it instead of duplicating. */
  const pendingDraftIdRef = useRef("");
  /** Restore the saved form once per mount; later renders must not overwrite live edits. */
  const formRestoredRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [posterFilter, setPosterFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const form = useForm<JobPostFormInput, unknown, JobPostFormValues>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      benefits: "",
      salaryPeriod: "MONTH",
      salaryIsNegotiable: false,
      salaryIsVisible: true,
      vacanciesCount: 1,
      jobCategoryId: "",
      employmentTypeId: "",
      experienceLevelId: "",
      educationLevel: "ANY",
      jobLocationIds: [],
      skillIds: [],
      specializationIds: [],
      workingDays: "",
      expiredAt: "",
    },
  });

  /*
  const handleExtractImportedJd = () => {
    let sourceText = "";
    if (jdImportMode === "url") {
      if (!importUrl.trim()) {
        showToast("error", "Vui lòng nhập đường dẫn URL chứa nội dung JD.");
        return;
      }
      sourceText = `Mô tả công việc từ đường dẫn: ${importUrl.trim()}\n\nVị trí: UI/UX Designer (Chuyên viên Thiết kế Giao diện)\n\nMô tả công việc:\n- Nghiên cứu người dùng, xây dựng Wireframe và Prototype cho các sản phẩm Web/Mobile App.\n- Phối hợp cùng đội ngũ Product và Engineering để tối ưu hóa trải nghiệm người dùng.\n- Xây dựng và phát triển hệ thống Design System chuẩn hóa.\n\nYêu cầu ứng viên:\n- Ít nhất 2-3 năm kinh nghiệm thiết kế UI/UX.\n- Thành thạo Figma, Adobe XD, Photoshop, Illustrator.\n- Có tư duy tốt về User Experience, Design System và Micro-interaction.`;
    } else if (jdImportMode === "paste") {
      if (!importedJdText.trim()) {
        showToast("error", "Vui lòng dán nội dung JD.");
        return;
      }
      sourceText = importedJdText.trim();
    } else {
      sourceText = `Mô tả công việc từ tệp đã tải lên.\n\nVị trí tuyển dụng: Chuyên viên Phát triển Sản phẩm\n- Lập kế hoạch và triển khai các tính năng mới.\n- Theo dõi hiệu quả và cải tiến trải nghiệm người dùng.\n- Phối hợp làm việc cùng đội ngũ kỹ thuật và Marketing.`;
    }

    setIsExtractingJd(true);
    setTimeout(() => {
      const text = sourceText.trim();
      const firstLine = (text.split("\n")[0] ?? "").replace(/^[#*-\s]+/, "").trim();
      const extractedTitle =
        firstLine.length > 5 && firstLine.length < 80
          ? firstLine.replace(/^Mô tả công việc từ đường dẫn:\s{0,}/, "")
          : "Chuyên viên Tuyển dụng / Nhân sự";

      const defaultCategory = catalogs.categories[0]?.id ?? "";
      const defaultEmpType = catalogs.employmentTypes[0]?.id ?? "";
      const defaultExpLevel = catalogs.experienceLevels[0]?.id ?? "";

      const formattedDesc = `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const expiredAtStr = futureDate.toISOString().split("T")[0] ?? "";

      form.reset({
        title: extractedTitle.includes("https://")
          ? "UI/UX Designer (Chuyên viên Thiết kế)"
          : extractedTitle,
        description: formattedDesc,
        requirements: "<p>Theo chi tiết mô tả công việc được trích xuất ở trên.</p>",
        benefits: "<p>Thỏa thuận theo năng lực và quy chế công ty.</p>",
        salaryIsNegotiable: true,
        salaryIsVisible: true,
        salaryPeriod: "MONTH",
        vacanciesCount: 1,
        jobCategoryId: defaultCategory,
        employmentTypeId: defaultEmpType,
        experienceLevelId: defaultExpLevel,
        educationLevel: "ANY",
        jobLocationIds:
          companyLocations.length > 0 && companyLocations[0] ? [companyLocations[0].id] : [],
        skillIds: catalogs.skills.slice(0, 2).map((s) => s.id),
        specializationIds: [],
        workingDays: "Thứ 2 - Thứ 6",
        expiredAt: expiredAtStr,
      });

      setIsExtractingJd(false);
      setImportedJdText("");
      setEditorTab("compose");
      setView("create");
      showToast("success", "Đã trích xuất và tự động điền thông tin JD!");
    }, 800);
  };

  const handleGenerateAutoJd = () => {
    if (!autoJdTitle.trim()) {
      showToast("error", "Vui lòng nhập vị trí tuyển dụng.");
      return;
    }

    setIsGeneratingJd(true);
    setTimeout(() => {
      const title = autoJdTitle.trim();
      const prompt = autoJdPrompt.trim();

      const defaultCategory = autoJdCategory || catalogs.categories[0]?.id || "";
      const defaultEmpType = catalogs.employmentTypes[0]?.id || "";
      const defaultExpLevel = autoJdExpLevel || catalogs.experienceLevels[0]?.id || "";

      const aiDesc = `<p>Công ty đang tìm kiếm vị trí <strong>${title}</strong> tài năng gia nhập đội ngũ phát triển.</p>
<p><strong>Mô tả công việc & Trách nhiệm chính:</strong></p>
<ul>
  <li>Chịu trách nhiệm thực hiện và quản lý công việc chuyên môn vị trí ${title}.</li>
  <li>Lập kế hoạch, triển khai và theo dõi tiến độ công việc hàng tuần/tháng.</li>
  <li>Phối hợp cùng các bộ phận liên quan để đạt mục tiêu chung của công ty.</li>
  ${prompt ? `<li>Yêu cầu bổ sung: ${prompt}</li>` : ""}
</ul>`;

      const aiReqs = `<ul>
  <li>Tốt nghiệp Cao đẳng/Đại học chuyên ngành liên quan.</li>
  <li>Có từ 1-3 năm kinh nghiệm làm việc ở vị trí tương đương.</li>
  <li>Kỹ năng giao tiếp, làm việc nhóm và xử lý tình huống tốt.</li>
  <li>Tinh thần trách nhiệm cao, chịu được áp lực công việc.</li>
</ul>`;

      const aiBenefits = `<ul>
  <li>Mức lương cạnh tranh từ 15.000.000 - 30.000.000 VNĐ theo năng lực.</li>
  <li>Đóng BHXH, BHYT đầy đủ theo quy định của Luật lao động.</li>
  <li>Thưởng lễ tết, tháng lương 13 và chế độ du lịch hàng năm.</li>
  <li>Môi trường làm việc năng động, chuyên nghiệp, cơ hội thăng tiến rõ ràng.</li>
</ul>`;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const expiredAtStr = futureDate.toISOString().split("T")[0] ?? "";

      form.reset({
        title: title,
        description: aiDesc,
        requirements: aiReqs,
        benefits: aiBenefits,
        salaryMin: 15000000,
        salaryMax: 30000000,
        salaryPeriod: "MONTH",
        salaryIsNegotiable: false,
        salaryIsVisible: true,
        vacanciesCount: 1,
        jobCategoryId: defaultCategory,
        employmentTypeId: defaultEmpType,
        experienceLevelId: defaultExpLevel,
        educationLevel: "BACHELOR",
        jobLocationIds:
          companyLocations.length > 0 && companyLocations[0] ? [companyLocations[0].id] : [],
        skillIds: catalogs.skills.slice(0, 3).map((s) => s.id),
        specializationIds: catalogs.specializations.slice(0, 2).map((s) => s.id),
        workingDays: "Thứ 2 - Thứ 6",
        expiredAt: expiredAtStr,
      });

      setIsGeneratingJd(false);
      setShowAutoJdModal(false);
      setAutoJdTitle("");
      setAutoJdPrompt("");
      setEditorTab("compose");
      setView("create");
      showToast("success", "Đã tạo JD tự động bằng AI thành công!");
    }, 800);
  };

  */

  const getAiErrorMessage = (error: unknown) => {
    if (!(error instanceof ApiError)) {
      return "Không thể kết nối đến dịch vụ AI. Vui lòng thử lại.";
    }
    if (error.status === 429)
      return "Bạn đang thao tác quá nhanh. Vui lòng chờ một phút rồi thử lại.";
    if (error.status >= 500) return "Dịch vụ AI đang bận. Vui lòng thử lại sau ít phút.";
    return error.message || "Không thể xử lý JD. Vui lòng kiểm tra lại dữ liệu.";
  };

  const confirmDraftReplacement = async () => {
    const current = form.getValues();
    const hasContent = Boolean(
      current.title?.trim() ||
      current.description?.trim() ||
      current.requirements?.trim() ||
      current.benefits?.trim(),
    );
    if (!hasContent) return true;

    const result = await Swal.fire({
      icon: "warning",
      title: "Thay thế nội dung đang soạn?",
      text: "Bản nháp AI sẽ thay thế nội dung hiện có trong form. Thao tác này chưa đăng tin.",
      showCancelButton: true,
      confirmButtonText: "Tiếp tục",
      cancelButtonText: "Giữ nội dung hiện tại",
      confirmButtonColor: "#059669",
    });
    return result.isConfirmed;
  };

  const applyAiDraft = useCallback(
    (response: JobPostAiDraftResponse) => {
      const current = form.getValues();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      form.reset({
        title: response.draft.title,
        description: response.draft.description,
        requirements: response.draft.requirements,
        benefits: response.draft.benefits,
        salaryMin: response.draft.salaryMin ?? undefined,
        salaryMax: response.draft.salaryMax ?? undefined,
        salaryPeriod: response.draft.salaryPeriod,
        salaryIsNegotiable: response.draft.salaryIsNegotiable,
        salaryIsVisible: response.draft.salaryIsVisible,
        vacanciesCount: response.draft.vacanciesCount,
        jobCategoryId: response.draft.jobCategoryId ?? "",
        employmentTypeId: response.draft.employmentTypeId ?? "",
        experienceLevelId: response.draft.experienceLevelId ?? "",
        educationLevel: response.draft.educationLevel,
        jobLocationIds:
          (current.jobLocationIds ?? []).length > 0
            ? (current.jobLocationIds ?? [])
            : companyLocations[0]
              ? [companyLocations[0].id]
              : [],
        skillIds: response.draft.skillIds,
        specializationIds: response.draft.specializationIds,
        workingDays: response.draft.workingDays ?? "",
        expiredAt: current.expiredAt || futureDate.toISOString().split("T")[0] || "",
      });
      setEditorResetKey((key) => key + 1);
      setEditorTab("compose");
      setView("create");
      pendingDraftIdRef.current = "";
      setAiSuggestedSkills(response.suggestions.unmatchedSkillNames);
      setAiSuggestedSpecializations(response.suggestions.unmatchedSpecializationNames);

      const unmatchedCount =
        response.suggestions.unmatchedSkillNames.length +
        response.suggestions.unmatchedSpecializationNames.length;
      const autofilledFields = consumeJobPostAiAutofillNotice();
      showToast(
        "success",
        unmatchedCount > 0
          ? `Đã điền bản nháp. Có ${unmatchedCount} mục AI đề xuất chưa có trong danh mục — bấm để thêm ở Kỹ năng / Chuyên ngành.`
          : autofilledFields.length > 0
            ? `Đã điền bản nháp AI. AI tự suy luận thêm từ JD: ${autofilledFields.join(", ")}.`
            : "Đã điền bản nháp AI. Vui lòng kiểm tra trước khi đăng.",
      );
    },
    [companyLocations, form],
  );

  useEffect(() => {
    if (loading) return;

    // A fresh hand-off from the AI screen wins; otherwise restore whatever the recruiter had on
    // screen, so a reload (or an accidental back-forward) does not throw the JD away.
    const savedDraft = consumeJobPostAiDraft();
    if (savedDraft) {
      clearJobPostFormDraft(accountId);
      applyAiDraft(savedDraft);
      // The AI values are now the live form state, so snapshotting may start from here.
      formRestoredRef.current = true;
      return;
    }

    if (view !== "create" || formRestoredRef.current) return;
    formRestoredRef.current = true;

    const snapshot = loadJobPostFormDraft(accountId);
    if (!snapshot) return;

    form.reset(snapshot.values as JobPostFormInput);
    setAiSuggestedSkills(snapshot.aiSuggestedSkills);
    setAiSuggestedSpecializations(snapshot.aiSuggestedSpecializations);
    pendingDraftIdRef.current = snapshot.pendingDraftId;
    setEditorResetKey((key) => key + 1);
  }, [accountId, applyAiDraft, form, loading, view]);

  const handleExtractImportedText = async (text: string) => {
    if (!token || !(await confirmDraftReplacement())) return false;
    setIsExtractingJd(true);
    try {
      const response = await extractJobPostDraft(text, token);
      applyAiDraft(response);
      return true;
    } catch (error) {
      showToast("error", getAiErrorMessage(error));
      return false;
    } finally {
      setIsExtractingJd(false);
    }
  };

  const handleExtractImportedFile = async (file: File) => {
    if (!token || !(await confirmDraftReplacement())) return false;
    setIsExtractingJd(true);
    try {
      const response = await extractJobPostDraftFile(file, token);
      applyAiDraft(response);
      return true;
    } catch (error) {
      showToast("error", getAiErrorMessage(error));
      return false;
    } finally {
      setIsExtractingJd(false);
    }
  };

  /**
   * Adds a catalog entry the seed data is missing, refusing anything already in the list. The local
   * check keeps an obvious duplicate from ever reaching the API; the 409 covers spellings this
   * screen cannot see (another recruiter adding the same name at the same time).
   */
  const createCatalogOption = async (
    kind: "skill" | "specialization",
    rawName: string,
  ): Promise<JobOption | null> => {
    const name = rawName.trim().replace(/\s+/g, " ");
    const noun = kind === "skill" ? "Kỹ năng" : "Chuyên ngành";
    const existingOptions = kind === "skill" ? catalogs.skills : catalogs.specializations;
    const comparable = toComparableName(name);
    const duplicate = existingOptions.find(
      (option) => toComparableName(option.name) === comparable,
    );
    if (duplicate) {
      showToast("warning", `${noun} "${duplicate.name}" đã có trong danh mục.`);
      return duplicate;
    }
    if (!token) return null;

    try {
      const created =
        kind === "skill"
          ? await createSkillOption(name, token)
          : await createSpecializationOption(name, token);
      setCatalogs((current) =>
        kind === "skill"
          ? { ...current, skills: [...current.skills, created].sort(byName) }
          : { ...current, specializations: [...current.specializations, created].sort(byName) },
      );
      showToast("success", `Đã thêm ${noun.toLocaleLowerCase("vi")} "${created.name}".`);
      return created;
    } catch (error) {
      showToast(
        "error",
        error instanceof ApiError && error.status === 409
          ? error.message || `${noun} này đã có trong danh mục.`
          : `Không thêm được ${noun.toLocaleLowerCase("vi")} mới. Vui lòng thử lại.`,
      );
      return null;
    }
  };

  const createSkillFromQuery = (name: string) => createCatalogOption("skill", name);
  const createSpecializationFromQuery = (name: string) =>
    createCatalogOption("specialization", name);

  const companyVerified = account?.company?.verificationStatus === "VERIFIED";
  // Publishing is gated on a reputation threshold the API owns. Knowing both numbers up front lets
  // the form say so before the recruiter fills everything in and gets refused at the last step.
  const reputationScore = Number(account?.company?.reputationScore ?? Number.NaN);
  const reputationRequired = account?.company?.minReputationScoreToPublish;
  const reputationBlocksPublish =
    Number.isFinite(reputationScore) &&
    typeof reputationRequired === "number" &&
    reputationScore < reputationRequired;
  const previewValues = form.watch();

  // Snapshot the create form as it is edited. Debounced because `previewValues` changes on every
  // keystroke, and sessionStorage writes are synchronous.
  useEffect(() => {
    if (loading || view !== "create" || !accountId || !formRestoredRef.current) return;

    const timer = setTimeout(() => {
      saveJobPostFormDraft(accountId, {
        values: previewValues as unknown as Record<string, unknown>,
        aiSuggestedSkills,
        aiSuggestedSpecializations,
        pendingDraftId: pendingDraftIdRef.current,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [accountId, aiSuggestedSkills, aiSuggestedSpecializations, loading, previewValues, view]);

  function openPublicPreview() {
    saveRecruiterJobPostPreview({
      companyName: account?.company?.name || "Doanh nghiệp của bạn",
      companyLogoUrl,
      companyVerified,
      values: previewValues,
      catalogs,
      locations: companyLocations,
    });
    // A new tab keeps the half-written post on screen: the recruiter compares the two and closes
    // the preview, instead of navigating away and having to find their way back.
    window.open(getPathname({ href: "/jobs/preview", locale }), "_blank", "noopener");
  }

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

    setTableRefreshing(true);
    try {
      setJobs(await getRecruiterJobPosts(token, accountId));
    } finally {
      setTableRefreshing(false);
    }
  }

  async function submit(values: JobPostFormValues) {
    // Saving a draft and sending it to moderation are different intents; the footer button that was
    // pressed decides which one this submit is.
    const intent = submitIntentRef.current;
    submitIntentRef.current = "draft";
    let publishTargetId = activeJob?.id ?? "";

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
            salaryPeriod: values.salaryPeriod,
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

        // Sequential on purpose: fired together, these three each open their own database
        // transaction on the same pooled client and the pg adapter warns it is being reused.
        await setJobPostLocations(activeJob.id, values.jobLocationIds, token);
        await setJobPostSkills(activeJob.id, values.skillIds, token);
        await setJobPostSpecializations(activeJob.id, values.specializationIds, token);

        if (intent === "draft") {
          showToast(
            "success",
            "Đã cập nhật tin tuyển dụng, tin sẽ được duyệt lại trước khi hiển thị công khai.",
          );
        }
      } else {
        // Create flow
        const payload = {
          benefits: values.benefits,
          description: values.description,
          employmentTypeId: values.employmentTypeId,
          experienceLevelId: values.experienceLevelId,
          jobCategoryId: values.jobCategoryId,
          requirements: values.requirements,
          salaryCurrency: "VND",
          salaryPeriod: values.salaryPeriod,
          salaryIsNegotiable: values.salaryIsNegotiable,
          salaryIsVisible: values.salaryIsVisible,
          salaryMax: values.salaryMax,
          salaryMin: values.salaryMin,
          title: values.title,
          vacanciesCount: values.vacanciesCount,
          educationLevel: values.educationLevel,
          workingDays: values.workingDays || undefined,
          expiredAt: values.expiredAt ? new Date(values.expiredAt).toISOString() : undefined,
        };

        // A retry after a mid-way failure has to land on the same draft. The first attempt may well
        // have created it before the connection dropped, and creating a second one leaves the
        // recruiter with a duplicate they never asked for.
        let jobId = pendingDraftIdRef.current;
        if (jobId) {
          await updateRecruiterJobPost(jobId, payload, token);
        } else {
          jobId = (await createRecruiterJobPost(payload, token)).id;
          pendingDraftIdRef.current = jobId;
        }

        await setJobPostLocations(jobId, values.jobLocationIds, token);
        await setJobPostSkills(jobId, values.skillIds, token);
        await setJobPostSpecializations(jobId, values.specializationIds, token);

        publishTargetId = jobId;
        if (intent === "draft") {
          showToast("success", "Đã tạo bản nháp tin tuyển dụng thành công.");
        }
      }
    } catch (error) {
      showToast("error", getJobPostErrorMessage(error));
      return;
    }

    // Everything landed, so the next submit is a fresh post again.
    pendingDraftIdRef.current = "";
    setAiSuggestedSkills([]);
    setAiSuggestedSpecializations([]);
    formRestoredRef.current = false;
    clearJobPostFormDraft(accountId);

    if (intent === "publish" && publishTargetId) {
      // The post is already saved by now. A failure here must not send the recruiter back to a
      // filled form, or they would submit again and create a duplicate.
      try {
        await publishRecruiterJobPost(publishTargetId, token);
        showToast("success", "Tin tuyển dụng đã được gửi duyệt.");
      } catch (error) {
        // A refused publish is a blocking condition with a reason worth reading, not a toast that
        // slides away after three seconds.
        const isReputation =
          error instanceof ApiError && error.message.toLowerCase().includes("reputation score");
        await Swal.fire({
          icon: "warning",
          title: isReputation ? "Chưa đủ điểm uy tín để đăng tin" : "Chưa gửi duyệt được",
          text: `${getJobPostErrorMessage(error, account?.company?.reputationScore)} Tin đã được lưu, bạn có thể gửi duyệt lại từ danh sách tin.`,
          confirmButtonText: "Đã hiểu",
          confirmButtonColor: "#059669",
        });
      }
    }

    form.reset();
    setEditorResetKey((key) => key + 1);
    setView("list");
    setActiveJob(null);
    router.replace("/recruiter/job-posts");
    try {
      await reloadJobs();
    } catch {
      showToast("warning", "Tin tuyển dụng đã lưu nhưng chưa tải lại được danh sách mới nhất.");
    }
  }

  const startEdit = useCallback(
    (job: RecruiterJobPost) => {
      pendingDraftIdRef.current = "";
      setAiSuggestedSkills([]);
      setAiSuggestedSpecializations([]);
      formRestoredRef.current = false;
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
        salaryPeriod: job.salaryPeriod ?? "MONTH",
        vacanciesCount: job.vacanciesCount,
        jobCategoryId: job.jobCategory?.id ?? "",
        employmentTypeId: job.employmentType?.id ?? "",
        experienceLevelId: job.experienceLevel?.id ?? "",
        educationLevel: job.educationLevel ?? "ANY",
        jobLocationIds: job.jobPostLocations.map((l) => l.jobLocation.id),
        skillIds: job.jobPostSkills.map((s) => s.skill.id),
        specializationIds: job.jobPostSpecializations.map((s) => s.specialization.id),
        workingDays: job.workingDays ?? "",
        expiredAt: job.expiredAt ? job.expiredAt.substring(0, 10) : "",
      });
      setEditorResetKey((key) => key + 1);
      setEditorTab("compose");
      setView("edit");
    },
    [form],
  );

  useEffect(() => {
    if (loading || !editJobId || editTargetResolvedRef.current) return;
    editTargetResolvedRef.current = true;

    const target = jobs.find((job) => job.id === editJobId);
    const canManageTarget =
      target && (!target.createdByRecruiterId || target.createdByRecruiterId === accountId);
    if (target && canManageTarget) {
      startEdit(target);
    } else {
      showToast("error", "Không tìm thấy tin tuyển dụng hoặc bạn không có quyền chỉnh sửa.");
      router.replace("/recruiter/job-posts");
    }
    setResolvingEditTarget(false);
  }, [accountId, editJobId, jobs, loading, router, startEdit]);

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

  async function reopen(jobPostId: string) {
    try {
      setActionJobId(jobPostId);
      await reopenRecruiterJobPost(jobPostId, token);
      await reloadJobs();
      showToast("success", "Tin tuyển dụng đã được mở lại, đang chờ admin duyệt.");
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

  async function deleteJobPost(job: RecruiterJobPost) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Xóa tin tuyển dụng?",
      text: `Tin "${job.title}" sẽ bị xóa và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?`,
      showCancelButton: true,
      confirmButtonText: "Xóa tin",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      setActionJobId(job.id);
      await deleteRecruiterJobPost(job.id, token);
      await reloadJobs();
      showToast("success", "Đã xóa tin tuyển dụng.");
    } catch (error) {
      showToast("error", getJobPostErrorMessage(error));
    } finally {
      setActionJobId(null);
    }
  }

  const posterOptions = useMemo(() => {
    const posters = new Map<string, string>();
    for (const job of jobs) {
      const posterId = job.createdByRecruiter?.id ?? job.createdByRecruiterId;
      if (!posterId) continue;
      posters.set(
        posterId,
        job.createdByRecruiter?.profile?.fullName || job.createdByRecruiter?.email || "Recruiter",
      );
    }
    return [
      { label: "Tất cả người đăng", value: "ALL" },
      ...Array.from(posters, ([value, label]) => ({ label, value })).sort((left, right) =>
        left.label.localeCompare(right.label, "vi"),
      ),
    ];
  }, [jobs]);

  const categoryOptions = useMemo(
    () => [
      { label: "Tất cả ngành nghề", value: "ALL" },
      ...catalogs.categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    ],
    [catalogs.categories],
  );
  const canManageJobAccessByRole =
    account?.recruiterRole?.rolePermissions?.some(
      ({ recruiterPermission }) => recruiterPermission.code === "jobs:manage",
    ) ?? false;

  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("vi");
    const now = Date.now();
    const expiringThreshold = now + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;

    return jobs.filter((job) => {
      const cleanDescription = job.description.replace(/<[^>]*>/g, " ");
      const posterName =
        job.createdByRecruiter?.profile?.fullName ?? job.createdByRecruiter?.email ?? "";
      const locationText = getJobPostLocationLabels(job).join(" ");
      const matchesSearch =
        !query ||
        `${job.title} ${cleanDescription} ${posterName} ${locationText}`
          .toLocaleLowerCase("vi")
          .includes(query);
      const expiresAt = job.expiredAt ? new Date(job.expiredAt).getTime() : null;
      const isApprovedPublished = job.status === "PUBLISHED" && job.moderationStatus === "APPROVED";
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          isApprovedPublished &&
          (expiresAt === null || expiresAt >= now)) ||
        (statusFilter === "EXPIRING_SOON" &&
          isApprovedPublished &&
          expiresAt !== null &&
          expiresAt >= now &&
          expiresAt <= expiringThreshold) ||
        (statusFilter === "PENDING_REVIEW" &&
          job.status === "PUBLISHED" &&
          job.moderationStatus === "PENDING") ||
        (statusFilter === "DRAFT" && job.status === "DRAFT") ||
        (statusFilter === "CLOSED" && job.status === "CLOSED");
      const posterId = job.createdByRecruiter?.id ?? job.createdByRecruiterId;
      const matchesPoster = posterFilter === "ALL" || posterId === posterFilter;
      const matchesCategory = categoryFilter === "ALL" || job.jobCategory?.id === categoryFilter;

      return matchesSearch && matchesStatus && matchesPoster && matchesCategory;
    });
  }, [categoryFilter, jobs, posterFilter, searchTerm, statusFilter]);

  const clearListFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPosterFilter("ALL");
    setCategoryFilter("ALL");
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    if (filteredJobs.length === 0) {
      showToast("warning", "Không có tin tuyển dụng phù hợp để xuất.");
      return;
    }

    const headers = [
      "STT",
      "Tiêu đề",
      "Trạng thái",
      "Người đăng",
      "Ngành nghề",
      "Cấp bậc",
      "Loại hình",
      "Địa điểm làm việc",
      "Số lượng tuyển",
      "Ứng viên",
      "Lượt xem",
      "Mức lương",
      "Ngày tạo",
      "Ngày đăng",
      "Hạn nộp",
    ];
    const rows = filteredJobs.map((job, index) => [
      index + 1,
      job.title,
      getJobStatusBadge(job).text,
      job.createdByRecruiter?.profile?.fullName || job.createdByRecruiter?.email || "Recruiter",
      job.jobCategory?.name || "Chưa cập nhật",
      job.experienceLevel?.name || "Chưa cập nhật",
      job.employmentType?.name || "Chưa cập nhật",
      getJobPostLocationLabels(job).join("; ") || "Chưa cập nhật",
      job.vacanciesCount,
      job._count?.applications ?? 0,
      job._count?.views ?? 0,
      formatSalary(job),
      formatAppDate(job.createdAt),
      job.publishedAt ? formatAppDate(job.publishedAt) : "",
      job.expiredAt ? formatAppDate(job.expiredAt) : "",
    ]);
    const csvContent = `\uFEFF${[headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UpNext_Job_Posts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast("success", `Đã xuất ${filteredJobs.length} tin tuyển dụng.`);
  };

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  if (loading || redirecting || resolvingEditTarget) {
    return <div className="text-sm font-semibold text-slate-600">Đang tải tin tuyển dụng...</div>;
  }

  return (
    <div className="space-y-6">
      {/* <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                router.push("/recruiter/job-posts");
              }}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Quay lại danh sách
            </Button>
          ) : null}
        </div>
      </header> */}

      {view === "import_jd" && (
        <JobPostAiImport
          isSubmitting={isExtractingJd}
          onExtractFile={handleExtractImportedFile}
          onExtractText={handleExtractImportedText}
          onStartFromScratch={() => {
            form.reset();
            setEditorTab("compose");
            setActiveJob(null);
            setView("create");
          }}
          onOpenGenerator={() => router.push("/recruiter/job-posts/create/ai")}
        />
      )}

      {/*
      {view === "import_jd" && (
        <div className="space-y-6">
          <div className="upnext-shadow w-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10">
            <div className="pb-6 text-center">
              <h1 className="font-outfit flex flex-wrap items-center justify-center gap-x-1.5 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                <span>Tạo tin tuyển dụng nhanh chóng từ JD có sẵn với</span>
                <span className="inline-flex items-center gap-1.5 text-[#11a77a]">
                  <Sparkle size={24} className="shrink-0 text-[#11a77a]" weight="fill" />
                  <span>UpNext AI</span>
                </span>
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-8 py-4 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <label className="block text-sm font-bold text-slate-800">
                  Cung cấp thông tin JD theo cách của bạn
                </label>

                <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-100/80 p-3 text-xs font-semibold text-slate-700 sm:gap-6 sm:text-sm">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="jdImportMode"
                      value="url"
                      checked={jdImportMode === "url"}
                      onChange={() => setJdImportMode("url")}
                      className="h-4 w-4 text-[#11a77a] accent-[#11a77a] focus:ring-[#11a77a]"
                    />
                    <span>Đường dẫn (URL)</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="jdImportMode"
                      value="file"
                      checked={jdImportMode === "file"}
                      onChange={() => setJdImportMode("file")}
                      className="h-4 w-4 text-[#11a77a] accent-[#11a77a] focus:ring-[#11a77a]"
                    />
                    <span>Tệp sẵn có</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="jdImportMode"
                      value="paste"
                      checked={jdImportMode === "paste"}
                      onChange={() => setJdImportMode("paste")}
                      className="h-4 w-4 text-[#11a77a] accent-[#11a77a] focus:ring-[#11a77a]"
                    />
                    <span>Sao chép và dán</span>
                  </label>
                </div>

                {jdImportMode === "url" && (
                  <div className="flex w-full flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center">
                    <div className="w-full flex-1">
                      <FormInput
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://www.companydomain.com/ux/uidesigner-jd.html"
                        className="h-12 w-full rounded-xl border-slate-200 text-sm shadow-none focus:border-[#11a77a] focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={isExtractingJd || !importUrl.trim()}
                      onClick={handleExtractImportedJd}
                      className="h-12 shrink-0 bg-[#11a77a] px-6 font-bold text-white shadow-none transition-colors hover:bg-[#0d966d] disabled:opacity-50"
                    >
                      {isExtractingJd ? "Đang trích xuất..." : "Tiếp tục"}
                    </Button>
                  </div>
                )}

                {jdImportMode === "file" && (
                  <div className="space-y-3 pt-2">
                    <div className="cursor-pointer space-y-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 text-center transition-colors hover:border-[#11a77a]">
                      <FileArrowUp size={36} className="mx-auto mb-1 text-slate-400" />
                      <p className="text-sm font-bold text-slate-700">
                        Kéo và thả tệp JD vào đây hoặc bấm để chọn tệp
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Hỗ trợ tệp{" "}
                        <strong className="text-slate-700">.pdf, .doc, .docx, .xls, .xlsx</strong>;
                        có kích thước nhỏ hơn <strong className="text-slate-700">2MB</strong>
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 p-3.5 text-xs leading-relaxed font-medium text-amber-900">
                      <span className="font-bold text-amber-950">Lưu ý:</span> Hệ thống chỉ đọc dữ
                      liệu từ trang tính đầu tiên của Excel. Vui lòng đảm bảo dữ liệu đầy đủ ở trang
                      này trước khi tải lên.
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        disabled={isExtractingJd}
                        onClick={handleExtractImportedJd}
                        className="h-12 bg-[#11a77a] px-6 font-bold text-white shadow-none hover:bg-[#0d966d]"
                      >
                        {isExtractingJd ? "Đang trích xuất..." : "Tiếp tục"}
                      </Button>
                    </div>
                  </div>
                )}

                {jdImportMode === "paste" && (
                  <div className="space-y-3 pt-2">
                    <textarea
                      rows={8}
                      value={importedJdText}
                      onChange={(e) => setImportedJdText(e.target.value)}
                      placeholder="Dán toàn bộ nội dung mô tả công việc, yêu cầu ứng viên, quyền lợi..."
                      className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:border-[#11a77a] focus:outline-hidden"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        disabled={isExtractingJd || !importedJdText.trim()}
                        onClick={handleExtractImportedJd}
                        className="h-12 bg-[#11a77a] px-6 font-bold text-white shadow-none hover:bg-[#0d966d]"
                      >
                        {isExtractingJd ? "Đang trích xuất..." : "Tiếp tục"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between space-y-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6">
                <div className="space-y-4">
                  <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#11a77a] text-white shadow-md">
                        <Sparkle size={28} weight="fill" />
                      </div>
                      <div>
                        <div className="mb-2 h-2.5 w-24 rounded-full bg-slate-200" />
                        <div className="h-2.5 w-16 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base leading-snug font-bold text-slate-900">
                    {jdImportMode === "url"
                      ? "Nhập đường dẫn liên kết chứa JD"
                      : jdImportMode === "file"
                        ? "Tải tệp mô tả công việc"
                        : "Sao chép & dán nội dung JD"}
                  </h3>

                  <ul className="space-y-2.5 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                    <li>
                      <strong>Bước 1:</strong>{" "}
                      {jdImportMode === "url"
                        ? "Nhập đường dẫn (URL) chứa nội dung JD"
                        : jdImportMode === "file"
                          ? "Tải tệp JD dạng PDF hoặc Word"
                          : "Dán trực tiếp nội dung văn bản JD"}
                    </li>
                    <li>
                      <strong>Bước 2:</strong> AI sẽ tiến hành trích xuất thông tin
                    </li>
                    <li>
                      <strong>Bước 3:</strong> Kiểm tra, điều chỉnh và đăng tin
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-start gap-2 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500 sm:text-sm">
              <span>Hoặc</span>
              <button
                type="button"
                onClick={() => {
                  form.reset();
                  setEditorTab("compose");
                  setView("create");
                }}
                className="cursor-pointer font-bold text-[#11a77a] transition-colors hover:text-[#0d966d] hover:underline"
              >
                Đăng tin tuyển dụng từ đầu
              </button>
              <span className="mx-1 text-slate-300">|</span>
              <button
                type="button"
                onClick={handleCreateMockJob}
                className="cursor-pointer font-bold text-[#11a77a] transition-colors hover:text-[#0d966d] hover:underline"
              >
                Tạo tin tuyển dụng ảo
              </button>
            </div>
          </div>
        </div>
      )}
      */}

      {(view === "create" || view === "edit") && (
        <>
          <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
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
                required
                placeholder="Senior Frontend Engineer"
                register={form.register("title")}
                error={form.formState.errors.title?.message}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <JobSelect
                  label="Ngành nghề"
                  options={catalogs.categories}
                  placeholder="Chọn ngành nghề"
                  showSearch={true}
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
                onCreate={createSkillFromQuery}
                createHint="Chỉ thêm khi chắc chắn danh mục còn thiếu; tên đã tồn tại sẽ bị từ chối."
                suggestions={aiSuggestedSkills}
                onDismissSuggestion={(name) =>
                  setAiSuggestedSkills((current) => current.filter((item) => item !== name))
                }
              />

              <SearchTagPicker
                id="job-specializations"
                label="Chuyên ngành"
                placeholder="Nhập từ khóa để tìm kiếm chuyên ngành..."
                options={catalogs.specializations}
                selectedIds={form.watch("specializationIds") ?? []}
                onChange={(ids) => form.setValue("specializationIds", ids, { shouldDirty: true })}
                onCreate={createSpecializationFromQuery}
                createHint="Chỉ thêm khi chắc chắn danh mục còn thiếu; tên đã tồn tại sẽ bị từ chối."
                suggestions={aiSuggestedSpecializations}
                onDismissSuggestion={(name) =>
                  setAiSuggestedSpecializations((current) =>
                    current.filter((item) => item !== name),
                  )
                }
              />

              <RichTextField
                key={`job-description-${editorResetKey}`}
                expandable
                label="Mô tả"
                required
                placeholder="Mô tả phạm vi công việc, sản phẩm và trách nhiệm chính..."
                value={form.watch("description") ?? ""}
                onChange={(value) =>
                  form.setValue("description", value, { shouldDirty: true, shouldValidate: true })
                }
                error={form.formState.errors.description?.message}
              />

              <RichTextField
                key={`job-requirements-${editorResetKey}`}
                expandable
                label="Yêu cầu công việc"
                placeholder="Kinh nghiệm, kỹ năng bắt buộc, năng lực ưu tiên..."
                value={form.watch("requirements") ?? ""}
                onChange={(value) => form.setValue("requirements", value, { shouldDirty: true })}
                error={form.formState.errors.requirements?.message}
              />

              <RichTextField
                key={`job-benefits-${editorResetKey}`}
                expandable
                label="Quyền lợi / Phúc lợi"
                placeholder="Lương thưởng, bảo hiểm, chế độ làm việc, lộ trình phát triển..."
                value={form.watch("benefits") ?? ""}
                onChange={(value) => form.setValue("benefits", value, { shouldDirty: true })}
                error={form.formState.errors.benefits?.message}
              />

              {/*
                Salary reference lives on the AI generator screen, where the JD is still being
                shaped. Repeating it here only re-asked for years of experience the recruiter had
                already given.
              */}
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
                <JobSelect
                  label="Chu kỳ trả lương"
                  options={SALARY_PERIOD_OPTIONS}
                  placeholder="Chọn chu kỳ trả lương"
                  value={form.watch("salaryPeriod") ?? "MONTH"}
                  onValueChange={(value) =>
                    form.setValue("salaryPeriod", value as SalaryPeriod, { shouldDirty: true })
                  }
                  error={form.formState.errors.salaryPeriod?.message}
                />
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
                required
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
                <Controller
                  name="expiredAt"
                  control={form.control}
                  render={({ field }) => (
                    <DatePicker
                      id="job-expired-at"
                      label="Hạn nộp hồ sơ"
                      required
                      placeholder="Chọn hạn nộp hồ sơ"
                      value={field.value}
                      onChange={field.onChange}
                      minDate={new Date().toLocaleDateString("sv-SE")}
                      error={form.formState.errors.expiredAt?.message}
                    />
                  )}
                />
              </div>

              {reputationBlocksPublish ? (
                <output className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <Prohibit size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Chưa đủ điểm uy tín để đăng tin ({reputationScore}/{reputationRequired})
                    </p>
                    <p className="font-normal">
                      Bạn vẫn lưu được bản nháp. Để gửi duyệt, công ty cần đạt {reputationRequired}{" "}
                      điểm — tăng điểm bằng cách xác thực mã số thuế, hoàn thiện thông tin công ty
                      và xử lý CV ứng viên đúng hạn.
                    </p>
                  </div>
                </output>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <Button
                  id="job-post-preview"
                  type="button"
                  variant="outline"
                  disabled={form.formState.isSubmitting}
                  onClick={openPublicPreview}
                  className="h-11 border-slate-300 px-6 font-bold text-slate-700 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Eye size={18} aria-hidden="true" />
                  Xem trước
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={form.formState.isSubmitting}
                  onClick={() => {
                    form.reset();
                    setEditorTab("compose");
                    setEditorResetKey((key) => key + 1);
                    setView("list");
                    setActiveJob(null);
                    pendingDraftIdRef.current = "";
                    setAiSuggestedSkills([]);
                    setAiSuggestedSpecializations([]);
                    formRestoredRef.current = false;
                    clearJobPostFormDraft(accountId);
                    router.replace("/recruiter/job-posts");
                  }}
                  className="h-11 px-6 font-bold text-slate-500 hover:bg-slate-50"
                >
                  Hủy
                </Button>
                <Button
                  id="job-post-save-draft"
                  type="submit"
                  variant="outline"
                  disabled={form.formState.isSubmitting}
                  onClick={() => {
                    submitIntentRef.current = "draft";
                  }}
                  className="h-11 border-emerald-600 px-6 font-bold text-emerald-700 hover:bg-emerald-50"
                >
                  {form.formState.isSubmitting
                    ? view === "edit"
                      ? "Đang lưu..."
                      : "Đang tạo..."
                    : view === "edit"
                      ? "Lưu thay đổi"
                      : "Lưu bản nháp"}
                </Button>
                <Button
                  id="job-post-publish"
                  type="submit"
                  disabled={form.formState.isSubmitting || reputationBlocksPublish}
                  title={
                    reputationBlocksPublish
                      ? `Cần ${reputationRequired} điểm uy tín để gửi duyệt, công ty đang có ${reputationScore}.`
                      : undefined
                  }
                  onClick={() => {
                    submitIntentRef.current = "publish";
                  }}
                  className="h-11 bg-[#11a77a] px-6 font-bold text-white shadow-none hover:bg-[#0d966d]"
                >
                  <PaperPlaneTilt size={18} aria-hidden="true" />
                  {form.formState.isSubmitting ? "Đang gửi..." : "Đăng tin (gửi duyệt)"}
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
        <>
          <JobPostFilters
            search={searchTerm}
            status={statusFilter}
            poster={posterFilter}
            category={categoryFilter}
            statusOptions={JOB_STATUS_FILTER_OPTIONS}
            posterOptions={posterOptions}
            categoryOptions={categoryOptions}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            onPosterChange={(value) => {
              setPosterFilter(value);
              setCurrentPage(1);
            }}
            onCategoryChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}
            onClear={clearListFilters}
          />
          <section aria-label="Danh sách tin tuyển dụng" className="w-full min-w-0">
            <RecruiterTableLayout
              loading={tableRefreshing}
              totalItems={filteredJobs.length}
              currentPage={activePage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              actionBar={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={filteredJobs.length === 0}
                    onClick={handleExportExcel}
                    className="border-emerald-200 font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    <FileXls size={17} className="mr-1" aria-hidden="true" />
                    Xuất Excel
                  </Button>
                  <Button
                    onClick={() => setShowCreateOptionsModal(true)}
                    className="bg-[#11a77a] font-medium text-white hover:bg-[#0d966d]"
                  >
                    <Plus size={16} className="mr-1" />
                    Tạo tin tuyển dụng
                  </Button>
                </div>
              }
            >
              <thead>
                <tr>
                  <th scope="col">Tin tuyển dụng</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Ứng viên</th>
                  <th scope="col" className="text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedJobs.map((job) => (
                  <JobRow
                    actionJobId={actionJobId}
                    canManage={!job.createdByRecruiterId || job.createdByRecruiterId === accountId}
                    canManageAccess={
                      !job.createdByRecruiterId ||
                      job.createdByRecruiterId === accountId ||
                      canManageJobAccessByRole
                    }
                    companyVerified={companyVerified}
                    job={job}
                    key={job.id}
                    onClose={close}
                    onPublish={publish}
                    onReopen={reopen}
                    onDelete={(selectedJob) => void deleteJobPost(selectedJob)}
                    onManageAccess={setAccessManagementJob}
                    onViewDetails={(selectedJob) => {
                      setActiveJob(selectedJob);
                      setView("details");
                    }}
                    onEdit={(selectedJob) =>
                      router.push(`/recruiter/job-posts/${selectedJob.id}/edit`)
                    }
                  />
                ))}
                {paginatedJobs.length === 0 ? (
                  <tr>
                    <td
                      aria-label="Danh sách tin tuyển dụng trống"
                      colSpan={4}
                      className="pt-12 pb-20 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Image
                          src="/assets/recruiter/icon/cv-find.png"
                          alt="CV Find Icon"
                          height={192}
                          width={192}
                          className="h-48 w-48 object-contain"
                        />
                        <span className="-mt-6 text-sm font-medium text-slate-700">
                          {searchTerm ||
                          statusFilter !== "ALL" ||
                          posterFilter !== "ALL" ||
                          categoryFilter !== "ALL"
                            ? "Không tìm thấy tin tuyển dụng phù hợp."
                            : "Chưa có tin tuyển dụng."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </RecruiterTableLayout>
          </section>
        </>
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

      <JobPostAccessDialog
        currentRecruiterId={accountId}
        jobPost={accessManagementJob}
        onOpenChange={(open) => {
          if (!open) setAccessManagementJob(null);
        }}
        open={Boolean(accessManagementJob)}
        token={token}
      />

      {/* Modal 0: Lựa chọn hình thức tạo tin tuyển dụng */}
      <Dialog open={showCreateOptionsModal} onOpenChange={setShowCreateOptionsModal}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 sm:p-8">
          <DialogHeader className="pb-2 text-center sm:text-center">
            <DialogTitle className="font-outfit flex flex-wrap items-center justify-center gap-x-1.5 text-xl font-bold tracking-tight text-balance text-slate-800 sm:text-2xl">
              <span>Tạo tin tuyển dụng với</span>
              <span className="inline-flex items-center gap-1.5 text-[#11a77a]">
                <Sparkle size={22} className="shrink-0 text-[#11a77a]" weight="fill" />
                <span>UpNext AI</span>
              </span>
            </DialogTitle>
            <DialogDescription className="mt-1 max-w-none text-center text-xs text-slate-500 sm:text-sm">
              Lựa chọn phương thức phù hợp nhất để khởi tạo mô tả công việc của bạn nhanh chóng.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              {/* Card 1: Sử dụng JD sẵn có */}
              <button
                type="button"
                onClick={() => {
                  setShowCreateOptionsModal(false);
                  setView("import_jd");
                }}
                className="group relative flex h-[90px] w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#ff6b4a] via-[#ff7854] to-[#ff8f6e] p-4 text-left text-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 sm:w-[260px]"
              >
                <div className="z-10 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                    <FileArrowUp size={24} weight="bold" />
                  </div>
                  <span className="text-md leading-snug font-semibold tracking-tight text-white">
                    Sử dụng JD sẵn có
                  </span>
                </div>

                <div className="absolute -right-3 -bottom-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-110">
                  <FileArrowUp size={40} className="text-white/30" weight="fill" />
                </div>
              </button>

              {/* Card 2: Tạo JD tự động */}
              <button
                type="button"
                onClick={() => {
                  setShowCreateOptionsModal(false);
                  router.push("/recruiter/job-posts/create/ai");
                }}
                className="group relative flex h-[90px] w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#11a77a] via-[#10966d] to-[#0d8560] p-4 text-left text-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 sm:w-[260px]"
              >
                <div className="z-10 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                    <Sparkle size={24} weight="fill" />
                  </div>
                  <span className="text-md leading-snug font-semibold tracking-tight text-white">
                    Tạo JD tự động
                  </span>
                </div>

                <div className="absolute -right-3 -bottom-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-110">
                  <Sparkle size={40} className="text-white/30" weight="fill" />
                </div>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
              <span>Hoặc</span>
              <button
                type="button"
                onClick={() => {
                  setShowCreateOptionsModal(false);
                  form.reset();
                  setEditorTab("compose");
                  setActiveJob(null);
                  setView("create");
                }}
                className="cursor-pointer font-bold text-[#2563eb] transition-colors hover:text-[#1d4ed8] hover:underline"
              >
                Đăng tin tuyển dụng từ đầu
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getJobExpiryWarning(expiredAt: string | null) {
  if (!expiredAt) {
    return null;
  }

  const remainingTime = new Date(expiredAt).getTime() - Date.now();
  if (!Number.isFinite(remainingTime)) {
    return null;
  }
  if (remainingTime < 0) {
    return "Đã hết hạn";
  }
  if (remainingTime <= EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000) {
    return "Sắp hết hạn";
  }
  return null;
}

function getJobStatusBadge(job: RecruiterJobPost) {
  if (job.status === "DRAFT") {
    return {
      text: "Bản nháp",
      tone: "info" as const,
      className: "bg-blue-100 text-blue-700",
    };
  }
  if (job.status === "CLOSED") {
    return {
      text: "Đã đóng",
      tone: "neutral" as const,
      className: "bg-slate-100 text-slate-700",
    };
  }
  if (job.status === "PUBLISHED") {
    if (job.moderationStatus === "APPROVED") {
      const expiryWarning = getJobExpiryWarning(job.expiredAt);
      if (expiryWarning === "Đã hết hạn") {
        return {
          text: expiryWarning,
          tone: "error" as const,
          className: "bg-red-100 text-red-700",
        };
      }
      if (expiryWarning === "Sắp hết hạn") {
        return {
          text: expiryWarning,
          tone: "warning" as const,
          className: "bg-orange-100 text-orange-700",
        };
      }
      return {
        text: "Đang đăng",
        tone: "success" as const,
        className: "bg-emerald-100 text-emerald-700",
      };
    }
    if (job.moderationStatus === "REJECTED") {
      return {
        text: "Bị từ chối",
        tone: "error" as const,
        className: "bg-rose-100 text-rose-700",
      };
    }
    return {
      text: "Chờ duyệt",
      tone: "warning" as const,
      className: "bg-amber-100 text-amber-800",
    };
  }
  return {
    text: job.status,
    tone: "neutral" as const,
    className: "bg-slate-100 text-slate-700",
  };
}

function escapeCsvCell(value: number | string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function getJobPostLocationLabels(job: RecruiterJobPost) {
  return Array.from(
    new Set(
      job.jobPostLocations
        .map(({ jobLocation }) => formatLocation(jobLocation))
        .filter((location): location is string => Boolean(location)),
    ),
  );
}

function JobRow({
  actionJobId,
  canManage,
  canManageAccess,
  companyVerified,
  job,
  onClose,
  onPublish,
  onReopen,
  onDelete,
  onManageAccess,
  onViewDetails,
  onEdit,
}: {
  actionJobId: string | null;
  canManage: boolean;
  canManageAccess: boolean;
  companyVerified: boolean;
  job: RecruiterJobPost;
  onClose: (jobPostId: string) => void;
  onPublish: (jobPostId: string) => void;
  onReopen: (jobPostId: string) => void;
  onDelete: (job: RecruiterJobPost) => void;
  onManageAccess: (job: RecruiterJobPost) => void;
  onViewDetails: (job: RecruiterJobPost) => void;
  onEdit: (job: RecruiterJobPost) => void;
}) {
  const pending = actionJobId === job.id;
  const { text: statusText, tone: statusTone, className: statusClassName } = getJobStatusBadge(job);
  const publishedDate = job.publishedAt ? formatAppDate(job.publishedAt) : "Chưa đăng";
  const expirationDate = job.expiredAt ? formatAppDate(job.expiredAt) : "Không giới hạn";
  const expiryWarning = getJobExpiryWarning(job.expiredAt);
  const applicationCount = job._count?.applications ?? 0;
  const locationLabels = getJobPostLocationLabels(job);
  const locationSummary =
    locationLabels.length > 1
      ? `${locationLabels[0]} (+${locationLabels.length - 1} địa điểm)`
      : (locationLabels[0] ?? "Chưa cập nhật");

  return (
    <tr aria-label={job.title}>
      <td aria-label="Job post details">
        <div className="max-w-md">
          <button
            type="button"
            onClick={() => onViewDetails(job)}
            className="cursor-pointer text-left text-sm font-bold text-slate-700 transition-colors hover:text-emerald-700"
          >
            {job.title}
          </button>
          <p className="mt-1 text-xs font-normal text-slate-400">
            Đăng bởi{" "}
            <span className="font-medium text-emerald-700">
              {job.createdByRecruiter?.profile?.fullName ||
                job.createdByRecruiter?.email ||
                "Recruiter"}
            </span>
          </p>
          <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <div className="flex min-w-0 basis-full items-center gap-1">
              <dt className="flex shrink-0 items-center gap-1 font-medium text-slate-400">
                <MapPin size={13} aria-hidden="true" />
                Địa điểm:
              </dt>
              <dd
                className="max-w-[340px] truncate"
                title={locationLabels.join("; ") || "Chưa cập nhật"}
              >
                {locationSummary}
              </dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="font-medium text-slate-400">Ngày đăng:</dt>
              <dd>{publishedDate}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="font-medium text-slate-400">Hết hạn:</dt>
              <dd className={expiryWarning ? "font-semibold text-rose-600" : undefined}>
                {expirationDate}
                {expiryWarning ? ` · ${expiryWarning}` : null}
              </dd>
            </div>
          </dl>
        </div>
      </td>
      <td aria-label="Job post status">
        <Badge tone={statusTone} className={statusClassName}>
          {statusText}
        </Badge>
      </td>
      <td aria-label="Hiệu quả tin tuyển dụng">
        <div
          className="text-sm font-bold text-slate-800"
          aria-label={`${applicationCount} ứng viên đã ứng tuyển trên ${job.vacanciesCount} chỉ tiêu tuyển`}
        >
          {applicationCount}
          <span className="text-primary font-medium"> / {job.vacanciesCount}</span>
        </div>
        {/* <p className="text-xs text-slate-500">đã ứng tuyển / cần tuyển</p> */}
        <p className="text-xs text-slate-600">{job._count?.views ?? 0} lượt xem</p>
      </td>
      <td aria-label="Thao tác tin tuyển dụng" className="text-center">
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 w-8 items-center justify-center rounded-lg p-0 font-normal text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:ring-0 focus:ring-offset-0"
                aria-label="Thao tác"
              >
                <DotsThreeVertical size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-50 w-64 overflow-hidden rounded-xl border border-slate-100 bg-white py-2.5 shadow-xl"
            >
              <DropdownMenuItem
                onClick={() => onViewDetails(job)}
                className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-emerald-700 focus:outline-hidden"
              >
                <Eye size={18} className="shrink-0 text-slate-400" />
                Xem chi tiết tin
              </DropdownMenuItem>

              {canManageAccess ? (
                <DropdownMenuItem
                  onClick={() => onManageAccess(job)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-emerald-700 focus:outline-hidden"
                >
                  <UsersThree size={18} className="shrink-0 text-slate-400" />
                  Quản lý quyền truy cập
                </DropdownMenuItem>
              ) : null}

              {canManage ? (
                <DropdownMenuItem
                  onClick={() => onEdit(job)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-emerald-700 focus:outline-hidden"
                >
                  <PencilSimple size={18} className="shrink-0 text-slate-400" />
                  Chỉnh sửa tin
                </DropdownMenuItem>
              ) : null}

              {canManage && job.status === "CLOSED" ? (
                <DropdownMenuItem
                  disabled={pending || !companyVerified}
                  onClick={() => onReopen(job.id)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 focus:outline-hidden disabled:opacity-50"
                >
                  <CheckCircle size={18} className="shrink-0" />
                  Mở lại tin
                </DropdownMenuItem>
              ) : canManage && job.status !== "PUBLISHED" ? (
                <DropdownMenuItem
                  disabled={pending || !companyVerified}
                  onClick={() => onPublish(job.id)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 focus:outline-hidden disabled:opacity-50"
                >
                  <CheckCircle size={18} className="shrink-0" />
                  Xuất bản
                </DropdownMenuItem>
              ) : canManage ? (
                <DropdownMenuItem
                  disabled={pending}
                  onClick={() => onClose(job.id)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-hidden disabled:opacity-50"
                >
                  <Prohibit size={18} className="shrink-0" />
                  Đóng tin tuyển dụng
                </DropdownMenuItem>
              ) : null}

              {canManage && job.status !== "PUBLISHED" ? (
                <DropdownMenuItem
                  disabled={pending}
                  onClick={() => onDelete(job)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-hidden disabled:opacity-50"
                >
                  <Trash size={18} className="shrink-0" />
                  Xóa tin tuyển dụng
                </DropdownMenuItem>
              ) : null}
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
            <h3 className="border-b border-slate-100 pb-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
              Hiệu quả tin đăng
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Lượt xem
                </span>
                <span className="text-base font-bold text-slate-800">{job._count?.views ?? 0}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Ứng tuyển
                </span>
                <span className="text-base font-bold text-slate-800">
                  {job._count?.applications ?? 0}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => router.push(`/recruiter/candidates?jobPostId=${job.id}`)}
                className="flex h-10 w-full items-center justify-center gap-2 bg-[#11a77a] text-xs font-medium text-white hover:bg-[#0d966d]"
              >
                <Users size={16} />
                Xem danh sách ứng viên ({job._count?.applications ?? 0})
              </Button>
            </div>
          </Card>

          <Card className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
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
              {job.moderationStatus === "REJECTED" && job.reason ? (
                <p className="mt-2 rounded-lg bg-rose-50 p-2.5 text-xs leading-relaxed text-rose-700">
                  <span className="font-bold">Lý do từ chối: </span>
                  {job.reason}
                </p>
              ) : null}
              {job.status === "PUBLISHED" && job.moderationStatus === "PENDING" ? (
                <p className="mt-2 text-xs text-amber-600">
                  Tin đã được gửi và đang chờ admin duyệt — chưa hiển thị công khai cho ứng viên.
                </p>
              ) : null}
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
                <span className="text-right font-bold text-emerald-700">{salary}</span>
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
                  {job.jobPostSpecializations.map(({ specialization }) => (
                    <Badge key={specialization.id} tone="brand">
                      {specialization.name}
                    </Badge>
                  ))}
                  {job.jobPostSpecializations.length === 0 && (
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
  required = false,
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
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <FormInput
        id={id}
        aria-required={required || undefined}
        label={
          <>
            {label}
            {required ? <RequiredMark /> : null}
          </>
        }
        className="h-12 rounded-xl border-slate-200 bg-white text-sm font-normal shadow-none placeholder:text-slate-400"
        labelClassName="font-semibold"
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
  expandable = false,
  error,
  label,
  onChange,
  placeholder,
  value,
  required = false,
}: {
  expandable?: boolean;
  error?: string | undefined;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <RequiredMark /> : null}
      </Label>
      <RichTextEditor
        expandable={expandable}
        error={Boolean(error)}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
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
  showSearch = false,
}: {
  error?: string | undefined;
  label: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<{ id: string; name: string; code?: string }>;
  placeholder: string;
  value: string;
  showSearch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = searchQuery
    ? options.filter((opt) => opt.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <Select
        value={value || "none"}
        onValueChange={(nextValue) => {
          // Radix reports an empty value while its item list is still catching up with the async
          // catalogs, which silently wiped values the form had just been given. A real choice is
          // always a concrete id; clearing is only ever expressed through the placeholder item.
          if (nextValue === "") return;
          onValueChange(nextValue === "none" ? "" : nextValue);
        }}
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSearchQuery("");
          }
        }}
      >
        <SelectTrigger
          aria-label={label}
          className="data-[state=open]:border-primary h-12 rounded-xl border-slate-200 bg-white font-normal shadow-none"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className="max-h-[300px]"
          header={
            showSearch ? (
              <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-3 py-2">
                <MagnifyingGlass size={16} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  aria-label={`Tìm kiếm ${label.toLocaleLowerCase("vi")}`}
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full border-none bg-transparent p-0 text-sm font-normal text-slate-700 placeholder-slate-400 outline-hidden focus:ring-0 focus:outline-hidden"
                />
              </div>
            ) : null
          }
        >
          <SelectItem className="font-normal" value="none">
            {placeholder}
          </SelectItem>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <SelectItem className="font-normal" key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-3 text-center text-xs text-slate-400">
              Không tìm thấy kết quả
            </div>
          )}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
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
          "cursor-pointer text-sm font-normal text-slate-700",
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
        <span className="text-xs font-medium text-slate-500">{selectedIds.length} đã chọn</span>
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
  onCreate,
  createHint,
  suggestions = [],
  onDismissSuggestion,
}: {
  options: JobOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  label: string;
  id: string;
  /** Adds a missing catalog entry. Resolves to the entry to select, or null when it was refused. */
  onCreate?: (name: string) => Promise<JobOption | null>;
  createHint?: string;
  /** Names the AI proposed that the catalog does not have yet. */
  suggestions?: string[];
  onDismissSuggestion?: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const trimmedQuery = query.trim();
  const filtered = options.filter(
    (option) =>
      option.name.toLowerCase().includes(query.toLowerCase()) && !selectedIds.includes(option.id),
  );
  // The catalog already holds it (selected or not) — there is nothing to add.
  const alreadyExists =
    trimmedQuery !== "" &&
    options.some((option) => toComparableName(option.name) === toComparableName(trimmedQuery));
  const canCreate = Boolean(onCreate) && trimmedQuery.length >= 2 && !alreadyExists;

  const handleSelect = (optionId: string) => {
    onChange(Array.from(new Set([...selectedIds, optionId])));
    setQuery("");
    setIsOpen(false);
  };

  const handleCreate = async (name: string) => {
    if (!onCreate || isCreating || name.trim().length < 2) return;

    setIsCreating(true);
    try {
      const created = await onCreate(name.trim());
      if (created) {
        handleSelect(created.id);
        onDismissSuggestion?.(name);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Anything already in the catalog is not a gap to fill, however the AI reported it.
  const pendingSuggestions = suggestions.filter(
    (name) =>
      name.trim() !== "" &&
      !options.some((option) => toComparableName(option.name) === toComparableName(name)),
  );

  const handleRemove = (optionId: string) => {
    onChange(selectedIds.filter((id) => id !== optionId));
  };

  const selectedOptions = selectedIds
    .map((selectedId) => options.find((opt) => opt.id === selectedId))
    .filter((opt): opt is JobOption => Boolean(opt));

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </Label>
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 shadow-none focus-within:border-emerald-500">
          <MagnifyingGlass size={16} className="text-slate-400" aria-hidden="true" />
          <input
            id={id}
            aria-label={label}
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
                      className="w-full px-3 py-2 text-left text-sm font-normal text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      {option.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : trimmedQuery !== "" && !canCreate ? (
              <p className="px-3 py-2 text-xs font-medium text-slate-500">
                {alreadyExists
                  ? "Mục này đã có trong danh mục."
                  : "Không tìm thấy kết quả phù hợp."}
              </p>
            ) : null}

            {canCreate ? (
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  disabled={isCreating}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    void handleCreate(trimmedQuery);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                >
                  <Plus size={15} aria-hidden="true" />
                  {isCreating ? `Đang thêm "${trimmedQuery}"...` : `Thêm mới "${trimmedQuery}"`}
                </button>
                {createHint ? (
                  <p className="px-3 pb-2 text-[11px] font-normal text-slate-400">{createHint}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <SelectedChips
        labels={selectedOptions.map((opt) => ({ id: opt.id, label: opt.name }))}
        onRemove={handleRemove}
      />

      {onCreate && pendingSuggestions.length > 0 ? (
        <div
          id={`${id}-ai-suggestions`}
          className="mt-1 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-2.5"
        >
          <p className="text-xs font-medium text-amber-900">
            AI đề xuất nhưng danh mục chưa có — bấm để thêm:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pendingSuggestions.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white pl-2.5 text-xs font-medium text-amber-900"
              >
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => void handleCreate(name)}
                  className="py-1 hover:text-emerald-700 disabled:opacity-60"
                >
                  <Plus size={12} className="mr-1 inline" aria-hidden="true" />
                  {name}
                </button>
                <button
                  type="button"
                  aria-label={`Bỏ qua đề xuất ${name}`}
                  onClick={() => onDismissSuggestion?.(name)}
                  className="px-1.5 py-1 text-amber-500 hover:text-amber-800"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}
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
        className="min-w-0 flex-1 cursor-pointer truncate text-sm font-normal text-slate-700"
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
