import { recruiterApiRequest } from "@/features/recruiter/api/client";

/**
 * Kho CV v2 -- duyệt miễn phí, xem chi tiết theo quota tháng.
 *
 * ## Phạm vi che hẹp: CHỈ số điện thoại + email
 *
 * Tên, địa chỉ, ngày sinh, link cá nhân đều hiện ngay cả khi công ty chưa mua
 * gói -- thứ đổi tiền là HAI KÊNH LIÊN HỆ TRỰC TIẾP, không phải toàn bộ danh
 * tính. `email`/`phoneNumber` trong `TalentPoolDetail` là `null` khi
 * `unlocked: false`; mọi field khác luôn có giá trị thật nếu ứng viên đã điền.
 */

export type TalentPoolSkill = Readonly<{ id: string; name: string }>;

export type TalentPoolCard = Readonly<{
  candidateProfileId: string;
  fullName: string;
  headline: string | null;
  currentCompany: string | null;
  description: string | null;
  city: string | null;
  skills: readonly TalentPoolSkill[];
  /** Đã xem chi tiết hồ sơ này TRONG KỲ HIỆN TẠI hay chưa -- không phải "đã từng xem". */
  viewedThisPeriod: boolean;
  updatedAt?: string | null;
  experienceYears?: number | null;
  expectedSalary?: string | null;
  hasCv?: boolean;
  unlocked?: boolean;
  avatarUrl?: string | null;
  isOpenToWork?: boolean;
  hasInvited?: boolean;
}>;

/** Cùng hình dạng với `TalentPoolCard`, cộng điểm khớp từ AI lọc theo JD. */
export type AiSearchResultCard = TalentPoolCard & Readonly<{ matchScore: number }>;

export type TalentPoolSearchResponse = Readonly<{
  data: readonly TalentPoolCard[];
  page: number;
  pageSize: number;
  total: number;
}>;

export type TalentPoolSearchParams = Readonly<{
  city?: string;
  skillIds?: readonly string[];
  page?: number;
  pageSize?: number;
}>;

export type TalentPoolCapabilities = Readonly<{
  view: Readonly<{
    limit: number | null;
    used: number;
    remaining: number | null;
    /** ISO hoặc null. Hiện NGÀY này, không viết "mỗi tháng". */
    periodEnd: string | null;
  }>;
  /** Gói đã mua: không che PII + cho tải CV gốc. */
  unlocked: boolean;
  aiSearch: Readonly<{
    enabled: boolean;
    limit: number | null;
    used: number;
    remaining: number | null;
    periodEnd: string | null;
  }>;
}>;

export type TalentPoolExperience = Readonly<{
  companyName: string;
  positionTitle: string;
  employmentType: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  technologies: string | null;
}>;

export type TalentPoolEducation = Readonly<{
  schoolName: string;
  degree: string | null;
  major: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}>;

export type TalentPoolProject = Readonly<{
  name: string;
  role: string | null;
  description: string | null;
  technologies: string | null;
}>;

export type TalentPoolCertification = Readonly<{
  name: string;
  organization: string | null;
  issuedDate: string | null;
}>;

export type TalentPoolLanguage = Readonly<{ language: string; proficiency: string }>;

export type TalentPoolLink = Readonly<{ type: string; url: string }>;

export type TalentPoolDetail = Readonly<{
  candidateProfileId: string;
  fullName: string;
  avatarUrl?: string | null;
  /** `null` khi chưa mua gói -- HAI trường duy nhất thực sự bị che. */
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  birthdate: string | null;
  links: readonly TalentPoolLink[];
  description: string | null;
  skills: ReadonlyArray<
    Readonly<{
      id: string;
      name: string;
      proficiencyLevel: string;
      yearsOfExperience: string | number | null;
    }>
  >;
  experiences: readonly TalentPoolExperience[];
  educations: readonly TalentPoolEducation[];
  projects: readonly TalentPoolProject[];
  certifications: readonly TalentPoolCertification[];
  languages: readonly TalentPoolLanguage[];
  jobPreference: Readonly<{
    desiredPosition: string | null;
    workingModel: string | null;
    desiredSalaryMin?: number | string | null;
    desiredSalaryMax?: number | string | null;
    salaryCurrency?: string | null;
    desiredLevel: Readonly<{ name: string }> | null;
  }> | null;
  /** Gói công ty có unlock hồ sơ này hay không -- quyết định FE có hiện nút tải CV. */
  unlocked: boolean;
  isOpenToWork?: boolean;
  gender?: string | null;
  cvFile?: Readonly<{ publicUrl: string; originalName: string }> | null;
  hasInvited?: boolean;
  invitedAt?: string | null;
}>;

export function getTalentPoolCapabilities(token: string) {
  return recruiterApiRequest<TalentPoolCapabilities>("/recruiter/talent-pool/capabilities", token);
}

export function searchTalentPool(params: TalentPoolSearchParams, token: string) {
  const query = new URLSearchParams();
  if (params.city) query.set("city", params.city);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  for (const skillId of params.skillIds ?? []) query.append("skillIds", skillId);

  const qs = query.toString();
  return recruiterApiRequest<TalentPoolSearchResponse>(
    `/recruiter/talent-pool${qs ? `?${qs}` : ""}`,
    token,
  );
}

/**
 * Xem chi tiết một hồ sơ. Trừ 1 lượt NẾU đây là lần đầu xem hồ sơ này trong kỳ
 * hiện tại -- backend tự quyết định, FE không cần biết trước để gọi đúng cách.
 */
export function viewTalentPoolDetail(candidateProfileId: string, token: string) {
  return recruiterApiRequest<{ data: TalentPoolDetail }>(
    `/recruiter/talent-pool/${candidateProfileId}/view`,
    token,
    { method: "POST" },
  );
}

export function getCvDownloadUrl(candidateProfileId: string, token: string) {
  return recruiterApiRequest<{ downloadUrl: string; originalName: string }>(
    `/recruiter/talent-pool/${candidateProfileId}/cv-download`,
    token,
  );
}

export function sendApplicationInvitation(
  candidateProfileId: string,
  message: string | undefined,
  token: string,
) {
  return recruiterApiRequest<{ sent: boolean }>(
    `/recruiter/talent-pool/${candidateProfileId}/application-invitations`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message ? { message } : {}),
    },
  );
}

export type AiSearchResponse = Readonly<{ data: readonly AiSearchResultCard[] }>;

/**
 * AI lọc Kho CV theo một Job Post -- paid-only. `idempotencyKey` bắt buộc:
 * backend trừ quota theo key này, và cùng key gửi lại không trừ hai lần.
 */
export function aiSearchTalentPool(jobPostId: string, idempotencyKey: string, token: string) {
  return recruiterApiRequest<AiSearchResponse>("/recruiter/talent-pool/ai-search", token, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey, "Content-Type": "application/json" },
    body: JSON.stringify({ jobPostId }),
  });
}
