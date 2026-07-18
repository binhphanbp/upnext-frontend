"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  UploadSimple,
  Sparkle,
  Lightning,
  CircleNotch,
  ArrowRight,
  CheckCircle,
  Circle,
  CaretLeft,
  CaretRight,
  Briefcase,
  Users,
  Eye,
  ChartBar,
  WarningCircle,
  TrendUp,
  FileDashed,
  Crown,
  Info,
  X,
  LockSimple,
  Archive,
  Clock,
} from "@phosphor-icons/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm, type FieldErrors, type UseFormRegisterReturn } from "react-hook-form";
import Swal, { type SweetAlertIcon } from "sweetalert2";
import { z } from "zod";

import {
  attachRecruiterCompany,
  createCompany,
  createRecruiterProfile,
  getCompany,
  getRecruiterAccount,
  getRecruiterStats,
  type CompanyDetail,
  type RecruiterAccountDetail,
  updateRecruiterProfile,
  uploadCompanyBusinessLicense,
  uploadFile,
  scanCompanyBusinessLicense,
  updateCompany,
  createCompanyLocation,
  getCompanyLocations,
  updateCompanyLocation,
} from "@/features/recruiter/api/onboarding";
import { getRecruiterPipeline, type PipelineCandidate } from "@/features/recruiter/api/pipeline";
import {
  extractProvinceFromAddress,
  normalizeProvinceName,
  normalizeWebsite,
  stripProvinceFromAddress,
} from "@/features/recruiter/constants/company-autofill";
import {
  DRAFT_COMPANY_NAME,
  PRIMARY_COMPANY_LOCATION_NAME,
  VIETNAM_PROVINCES,
} from "@/features/recruiter/constants/vietnam-provinces";
import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import {
  clearRecruiterSession,
  getRecruiterSession,
  type RecruiterSessionUser,
} from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { formatAppDate, toDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { FormInput, Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { RecruiterTableLayout } from "./recruiter-table-layout";

function isValidPhoneNumber(phone: string): boolean {
  const cleanPhone = phone.trim().replace(/[\s.-]/g, "");
  // Matches:
  // - 0 followed by 9 or 10 digits (e.g. 0912345678, 02812345678)
  // - +84 or 84 followed by 9 or 10 digits
  const phoneRegex = /^(?:\+?84|0)[235789]\d{8,9}$/;
  return phoneRegex.test(cleanPhone);
}

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3400,
  timerProgressBar: true,
});

const createOnboardingSchema = (
  t: (key: string) => string,
  hasProfileAvatar: boolean,
  hasCompanyLicense: boolean,
) =>
  z.object({
    fullName: z.string().trim().min(2, t("onboarding.validation.fullNameMin")),
    phoneNumber: z
      .string()
      .trim()
      .refine((val) => isValidPhoneNumber(val), {
        message: t("onboarding.validation.phoneNumberMin") || "Số điện thoại chưa hợp lệ.",
      }),
    gender: z.enum(["MALE", "FEMALE"], {
      message: t("onboarding.validation.genderRequired"),
    }),
    avatar: z.custom<FileList>().refine(
      (files) => {
        if (hasProfileAvatar) return true;

        return Boolean(files && typeof files === "object" && "length" in files && files.length > 0);
      },
      {
        message: t("onboarding.validation.avatarRequired"),
      },
    ),
    companyName: z.string().trim().min(2, t("onboarding.validation.companyNameMin")),
    taxCode: z.string().trim().min(8, t("onboarding.validation.taxCodeMin")),
    address: z.string().trim().min(6, t("onboarding.validation.addressMin")),
    city: z
      .string()
      .trim()
      .min(
        1,
        t("onboarding.companyProfile.errors.cityRequired") || "Vui lòng chọn tỉnh/thành phố.",
      ),
    companyEmail: z.email(t("onboarding.validation.companyEmailInvalid")),
    companyPhone: z
      .string()
      .trim()
      .refine((val) => isValidPhoneNumber(val), {
        message: t("onboarding.validation.companyPhoneMin") || "Số điện thoại công ty chưa hợp lệ.",
      }),
    website: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || /^https?:\/\/.+/u.test(value), {
        message: t("onboarding.validation.websiteInvalid"),
      }),
    companySize: z.string().trim().min(1, t("onboarding.validation.companySizeMin")),
    description: z.string().trim().min(20, t("onboarding.validation.descriptionMin")),
    benefits: z.string().trim().optional(),
    businessLicense: z.custom<FileList>().refine(
      (files) => {
        if (hasCompanyLicense) return true;

        return Boolean(files && typeof files === "object" && "length" in files && files.length > 0);
      },
      {
        message: t("onboarding.validation.businessLicenseRequired"),
      },
    ),
  });

type OnboardingValues = z.infer<ReturnType<typeof createOnboardingSchema>>;

type OnboardingStep = 0 | 1 | 2;

const stepFields: Record<OnboardingStep, Array<keyof OnboardingValues>> = {
  0: ["fullName", "phoneNumber", "gender", "avatar"],
  1: [
    "companyName",
    "taxCode",
    "address",
    "city",
    "companyEmail",
    "companyPhone",
    "website",
    "companySize",
    "description",
    "benefits",
  ],
  2: ["businessLicense"],
};

function showToast(icon: SweetAlertIcon, title: string) {
  void Toast.fire({ icon, title });
}

function getFirstErrorMessage(errors: FieldErrors, t: (key: string) => string): string {
  for (const error of Object.values(errors)) {
    if (!error) continue;

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if (typeof error === "object") {
      const nested = getFirstErrorMessage(error as FieldErrors, t);

      if (nested) return nested;
    }
  }

  return t("onboarding.messages.error");
}

function getOnboardingErrorMessage(error: unknown, t: (key: string) => string) {
  if (!(error instanceof ApiError)) {
    return t("onboarding.apiErrors.network");
  }

  if (error.status === 400) {
    return t("onboarding.apiErrors.invalidInfo");
  }

  if (error.status === 401) {
    return t("onboarding.apiErrors.sessionExpired");
  }

  if (error.status === 403) {
    return t("onboarding.apiErrors.forbidden");
  }

  if (error.status === 409) {
    return t("onboarding.apiErrors.conflict");
  }

  if (error.status >= 500) {
    return t("onboarding.apiErrors.serverError");
  }

  return t("onboarding.apiErrors.unknown");
}

function RequiredLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-bold text-slate-700">
      {children}
      <span className="ml-1 text-red-500">*</span>
    </Label>
  );
}

const JOB_STATUS_ORDER = ["PUBLISHED", "DRAFT", "CLOSED", "ARCHIVED"] as const;

const JOB_STATUS_CARD_CONFIG: Record<
  (typeof JOB_STATUS_ORDER)[number],
  {
    icon: typeof CheckCircle;
    cardBg: string;
    badgeBg: string;
    barColor: string;
    dotColor: string;
    image: string;
  }
> = {
  PUBLISHED: {
    icon: CheckCircle,
    cardBg: "bg-[#eafcf3]",
    badgeBg: "bg-emerald-500",
    barColor: "bg-emerald-500",
    dotColor: "rgba(16,185,129,0.3)",
    image: "/assets/recruiter/icon/3.png",
  },
  DRAFT: {
    icon: FileDashed,
    cardBg: "bg-[#eef1f7]",
    badgeBg: "bg-slate-400",
    barColor: "bg-slate-400",
    dotColor: "rgba(100,116,139,0.3)",
    image: "/assets/recruiter/icon/2.png",
  },
  CLOSED: {
    icon: LockSimple,
    cardBg: "bg-[#fdeeee]",
    badgeBg: "bg-red-500",
    barColor: "bg-red-500",
    dotColor: "rgba(239,68,68,0.3)",
    image: "/assets/recruiter/icon/4.png",
  },
  ARCHIVED: {
    icon: Archive,
    cardBg: "bg-[#fef6e6]",
    badgeBg: "bg-amber-500",
    barColor: "bg-amber-500",
    dotColor: "rgba(245,158,11,0.3)",
    image: "/assets/recruiter/icon/1.png",
  },
};

type ReputationTier = "elite" | "trusted" | "standard" | "warning" | "locked";

const REPUTATION_TIERS: ReadonlyArray<{
  id: ReputationTier;
  min: number;
  barColor: string;
  badgeClass: string;
}> = [
  { id: "locked", min: 0, barColor: "bg-red-500", badgeClass: "bg-red-50 text-red-600" },
  { id: "warning", min: 30, barColor: "bg-amber-500", badgeClass: "bg-amber-50 text-amber-600" },
  { id: "standard", min: 50, barColor: "bg-blue-500", badgeClass: "bg-blue-50 text-blue-600" },
  {
    id: "trusted",
    min: 70,
    barColor: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-600",
  },
  { id: "elite", min: 90, barColor: "bg-amber-400", badgeClass: "bg-amber-50 text-amber-700" },
];

const REPUTATION_SCALE_MAX = 100;

function getReputationTier(score: number) {
  return [...REPUTATION_TIERS].reverse().find((tier) => score >= tier.min) ?? REPUTATION_TIERS[0]!;
}

export function RecruiterDashboardPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const [token, setToken] = useState("");
  const [user, setUser] = useState<RecruiterSessionUser | null>(null);
  const [account, setAccount] = useState<RecruiterAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalJobPosts: number; totalCandidates: number } | null>(
    null,
  );
  const [jobPosts, setJobPosts] = useState<RecruiterJobPost[]>([]);
  const [pipelineCandidates, setPipelineCandidates] = useState<PipelineCandidate[]>([]);
  const [companyDetail, setCompanyDetail] = useState<CompanyDetail | null>(null);
  const [reputationDialogOpen, setReputationDialogOpen] = useState(false);

  const [skippedOnboarding, setSkippedOnboarding] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const isSkipped = localStorage.getItem(`skippedOnboarding_${user.id}`) === "true";
      setSkippedOnboarding(isSkipped);
    } else {
      setSkippedOnboarding(false);
    }
  }, [user?.id]);

  const onboardingRequired = useMemo(() => {
    if (!account) return false;
    if (skippedOnboarding) return false;

    // Only OWNER accounts need to perform company onboarding
    const isOwner = account.recruiterRole?.code === "OWNER";
    if (!isOwner) return false;

    const isCompanyOnboarded =
      account.company &&
      (account.company.verificationStatus === "VERIFIED" ||
        account.company.verificationStatus === "PENDING" ||
        account.company.businessLicenseFileId);

    return !isCompanyOnboarded;
  }, [account, skippedOnboarding]);

  const loadAccount = useCallback(
    async (accountId: string, accessToken: string) => {
      try {
        setLoading(true);
        const [accountData, statsData, jobPostsData, pipelineData] = await Promise.all([
          getRecruiterAccount(accountId, accessToken),
          getRecruiterStats(accountId, accessToken),
          getRecruiterJobPosts(accessToken, accountId).catch(() => [] as RecruiterJobPost[]),
          getRecruiterPipeline(accessToken).catch(() => null),
        ]);
        setAccount(accountData);
        setStats(statsData);
        setJobPosts(jobPostsData);
        setPipelineCandidates(pipelineData?.candidates ?? []);

        const companyId = accountData.company?.id;
        setCompanyDetail(
          companyId ? await getCompany(companyId, accessToken).catch(() => null) : null,
        );
      } catch (error) {
        showToast("error", getOnboardingErrorMessage(error, t));

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearRecruiterSession();
          router.replace("/recruiter/login");
        }
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
    setUser(session.user);
    void loadAccount(session.user.id, session.accessToken);
  }, [loadAccount, router]);

  // Onboarding Checklist States & Logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeCardId, setActiveCardId] = useState("phone");

  const hasPhone = Boolean(account?.profile?.phoneNumber);
  const hasCompanyInfo = Boolean(
    account?.company?.name && account?.company?.name !== DRAFT_COMPANY_NAME,
  );
  const hasPostedJob = Boolean(stats && stats.totalJobPosts > 0);

  const publishedCount = useMemo(
    () => jobPosts.filter((jp) => jp.status === "PUBLISHED").length,
    [jobPosts],
  );
  const draftCount = useMemo(
    () => jobPosts.filter((jp) => jp.status === "DRAFT").length,
    [jobPosts],
  );
  const totalViews = useMemo(
    () => jobPosts.reduce((sum, jp) => sum + (jp._count?.views ?? 0), 0),
    [jobPosts],
  );
  const pendingModerationCount = useMemo(
    () => jobPosts.filter((jp) => jp.moderationStatus === "PENDING").length,
    [jobPosts],
  );
  const statusCounts = useMemo(() => {
    const map: Record<(typeof JOB_STATUS_ORDER)[number], number> = {
      PUBLISHED: 0,
      DRAFT: 0,
      CLOSED: 0,
      ARCHIVED: 0,
    };
    for (const jp of jobPosts) {
      if (jp.status in map) map[jp.status as (typeof JOB_STATUS_ORDER)[number]] += 1;
    }
    return map;
  }, [jobPosts]);
  const topJobs = useMemo(
    () =>
      [...jobPosts]
        .sort((a, b) => (b._count?.applications ?? 0) - (a._count?.applications ?? 0))
        .slice(0, 5),
    [jobPosts],
  );
  const upcomingInterviews = useMemo(() => {
    const now = Date.now();
    return pipelineCandidates
      .filter((c) => c.interview?.scheduledAt && new Date(c.interview.scheduledAt).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.interview!.scheduledAt).getTime() -
          new Date(b.interview!.scheduledAt).getTime(),
      )
      .slice(0, 5);
  }, [pipelineCandidates]);

  const reputationScore = useMemo(() => {
    const raw = Number(companyDetail?.reputationScore ?? 0);
    return Number.isFinite(raw) ? Math.max(0, Math.min(REPUTATION_SCALE_MAX, raw)) : 0;
  }, [companyDetail?.reputationScore]);
  const reputationTier = useMemo(() => getReputationTier(reputationScore), [reputationScore]);
  const reputationPercent = Math.round((reputationScore / REPUTATION_SCALE_MAX) * 100);

  const tasks = useMemo(() => {
    return [
      {
        id: "phone",
        label: t("dashboard.onboardingWidget.phone"),
        completed: hasPhone,
        path: "/recruiter/settings",
      },
      {
        id: "companyInfo",
        label: t("dashboard.onboardingWidget.companyInfo"),
        completed: hasCompanyInfo,
        path: "/recruiter/company-profile",
      },
      {
        id: "firstJob",
        label: t("dashboard.onboardingWidget.firstJob"),
        completed: hasPostedJob,
        path: "/recruiter/job-posts",
      },
    ];
  }, [t, hasPhone, hasCompanyInfo, hasPostedJob]);

  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const progressPercent = useMemo(
    () => Math.round((completedCount / tasks.length) * 100),
    [completedCount, tasks.length],
  );

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 250;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-bold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          <span>{t("onboarding.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 [font-family:var(--font-sans)] [--ring:#10a778]">
      <div className="recruiter-onboarding-card upnext-shadow relative overflow-hidden rounded-2xl border border-slate-100/90 p-6 shadow-sm">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .recruiter-onboarding-card {
            background: radial-gradient(circle at 12% 50%, rgba(16, 185, 129, 0.1), transparent 35%),
                        radial-gradient(circle at 88% 45%, rgba(178, 242, 232, 0.35), transparent 30%),
                        radial-gradient(circle at 96% 70%, rgba(194, 231, 255, 0.4), transparent 32%),
                        linear-gradient(135deg, #eefcf2 0%, #F7F9FD 65%, #EEF8FB 100%);
          }
          .onboarding-scrollbar::-webkit-scrollbar {
            height: 4px;
          }
          .onboarding-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 99px;
          }
          .onboarding-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 99px;
          }
        `,
          }}
        />
        <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Circular progress */}
          <div className="flex flex-col items-center justify-center gap-2 text-center lg:col-span-2">
            <div className="relative flex size-[96px] shrink-0 items-center justify-center rounded-full bg-slate-50/50">
              <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="#f1f5f9" strokeWidth="5.5" />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 - (progressPercent / 100) * 238.76}
                  className="transition-all duration-500 ease-in-out"
                />
              </svg>
              <span className="absolute text-xl font-bold text-slate-800">{progressPercent}%</span>
            </div>
            <span className="text-[14px] font-semibold text-slate-700">Hoàn tất hồ sơ</span>
          </div>

          {/* Middle welcome text + step tasks */}
          <div className="z-10 flex flex-col gap-4 lg:col-span-10">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">
                  Xin chào,{" "}
                  <span className="text-emerald-600">
                    {account?.profile?.fullName || t("dashboard.defaultName")}
                  </span>{" "}
                </h3>
                <p className="max-w-xl text-[12px] leading-relaxed font-semibold text-slate-500">
                  {t("dashboard.onboardingWidget.subtitle")}
                </p>
              </div>

              {/* Navigation Arrows on Mobile */}
              <div className="flex shrink-0 items-center gap-1.5 md:hidden">
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  className="flex size-7 items-center justify-center rounded-full border border-emerald-600/30 bg-white/70 text-emerald-600 shadow-xs transition hover:bg-emerald-50 active:scale-95"
                  aria-label="Scroll left"
                >
                  <CaretLeft size={15} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  className="flex size-7 items-center justify-center rounded-full border border-emerald-600/30 bg-white/70 text-emerald-600 shadow-xs transition hover:bg-emerald-50 active:scale-95"
                  aria-label="Scroll right"
                >
                  <CaretRight size={15} weight="bold" />
                </button>
              </div>
            </div>

            <div
              ref={scrollContainerRef}
              className="onboarding-scrollbar flex w-full gap-3 overflow-x-auto scroll-smooth pb-3 md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0"
              style={{
                scrollSnapType: "x mandatory",
              }}
            >
              {tasks.map((task, index) => {
                const num = index + 1;
                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setActiveCardId(task.id);
                      router.push(task.path);
                    }}
                    className={cn(
                      "group flex h-14 w-[280px] min-w-[280px] shrink-0 items-center justify-between rounded-xl border px-4 py-2 cursor-pointer transition-all duration-300 select-none md:w-full md:min-w-0 md:shrink",
                      task.completed
                        ? "border-emerald-500 bg-[#f4fcf8] hover:bg-[#ebfaf2]"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                          task.completed
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                        )}
                      >
                        {num}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold leading-tight transition-colors",
                          task.completed
                            ? "text-emerald-700"
                            : "text-slate-600 group-hover:text-slate-800",
                        )}
                      >
                        {task.label}
                      </span>
                    </div>

                    {task.completed ? (
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : (
                      <ArrowRight
                        size={14}
                        className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: Illustration badge (Absolute positioned to cover full height) */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-0 flex h-full w-[50%] items-center justify-end overflow-hidden lg:w-[45%]">
          {/* Sparkles */}
          <div className="absolute top-6 right-56 hidden animate-pulse text-cyan-300/60 lg:block">
            <Sparkle size={18} weight="fill" />
          </div>
          <div className="absolute right-8 bottom-6 hidden animate-pulse text-teal-400/40 delay-500 lg:block">
            <Sparkle size={24} weight="fill" />
          </div>
          <div className="absolute top-1/2 right-72 hidden -translate-y-1/2 animate-pulse text-cyan-400/30 delay-1000 lg:block">
            <Sparkle size={14} weight="fill" />
          </div>

          <Image
            src="/assets/recruiter/icon-verify.png?v=2"
            alt="Verification Badge"
            width={420}
            height={420}
            priority
            unoptimized
            className="animate-fade-in h-full w-auto object-contain object-right opacity-20 duration-500 lg:opacity-100"
          />
        </div>
      </div>

      {/* ROW: Welcome + verification + job status distribution */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left: Mini Cards (Chiếm 5 cột) */}
        <div className="flex flex-col gap-6 xl:col-span-5">
          {/* Mini Cards: Job posts & Candidates (real data) */}
          <div className="grid grid-cols-2 gap-6">
            {/* Total Job Posts */}
            <div className="upnext-shadow flex h-40 flex-col justify-between rounded-2xl bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm text-slate-400">{t("dashboard.totalJobPosts")}</p>
                  <h3 className="text-[22px] font-bold text-slate-800">
                    {stats ? stats.totalJobPosts.toLocaleString() : "0"}
                  </h3>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Briefcase size={20} weight="bold" />
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-emerald-600">
                  {t("dashboard.miniCard.publishedCount", { count: publishedCount })}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">
                  {t("dashboard.miniCard.draftCount", { count: draftCount })}
                </span>
              </div>
            </div>
            {/* Total Candidates */}
            <div className="upnext-shadow flex h-40 flex-col justify-between rounded-2xl bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm text-slate-400">{t("dashboard.totalCandidates")}</p>
                  <h3 className="text-[22px] font-bold text-slate-800">
                    {stats ? stats.totalCandidates.toLocaleString() : "0"}
                  </h3>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#5d87ff]">
                  <Users size={20} weight="bold" />
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Eye size={15} weight="bold" className="text-slate-400" />
                <span>{t("dashboard.miniCard.totalViews", { count: totalViews })}</span>
              </div>
            </div>
          </div>

          {/* Reputation score (real data) */}
          <div className="upnext-shadow flex flex-1 flex-col rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown size={18} weight="fill" className="text-amber-500" />
                <h3 className="text-base font-bold text-slate-800">
                  {t("dashboard.reputation.title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReputationDialogOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-[#5d87ff] hover:underline"
              >
                <Info size={14} weight="bold" />
                {t("dashboard.reputation.learnMore")}
              </button>
            </div>

            <div className="mb-4 flex items-end justify-between">
              <div>
                <span className="text-3xl font-extrabold text-slate-800">
                  {Math.round(reputationScore)}
                </span>
                <span className="ml-1 text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  reputationTier.badgeClass,
                )}
              >
                {t(`dashboard.reputation.tier.${reputationTier.id}.label`)}
              </span>
            </div>

            <div className="relative mb-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  reputationTier.barColor,
                )}
                style={{ width: `${reputationPercent}%` }}
              />
              {REPUTATION_TIERS.filter((tier) => tier.min > 0).map((tier) => (
                <span
                  key={tier.id}
                  className="absolute top-0 h-full w-px bg-white/70"
                  style={{ left: `${tier.min}%` }}
                />
              ))}
            </div>
            <div className="mb-4 flex justify-between text-[10px] font-semibold text-slate-400">
              <span>0</span>
              <span>30</span>
              <span>50</span>
              <span>70</span>
              <span>90</span>
              <span>100</span>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">
              {t(`dashboard.reputation.tier.${reputationTier.id}.description`)}
            </p>
          </div>
        </div>

        {/* Right: Job status distribution (real data) */}
        <div className="upnext-shadow flex flex-col rounded-2xl bg-white p-7 xl:col-span-7">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-primary flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <ChartBar size={24} weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {t("dashboard.statusDistribution.title")}
                </h3>
                <p className="text-[13px] text-slate-400">
                  {t("dashboard.statusDistribution.subtitle", { count: jobPosts.length })}
                </p>
              </div>
            </div>
            {pendingModerationCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">
                <WarningCircle size={15} weight="bold" />
                {t("dashboard.statusDistribution.pending", { count: pendingModerationCount })}
              </span>
            ) : null}
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            {jobPosts.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm font-medium text-slate-400">
                {t("dashboard.statusDistribution.empty")}
              </p>
            ) : (
              JOB_STATUS_ORDER.map((status) => {
                const count = statusCounts[status];
                const pct = jobPosts.length ? Math.round((count / jobPosts.length) * 100) : 0;
                const config = JOB_STATUS_CARD_CONFIG[status];
                const Icon = config.icon;
                return (
                  <div
                    key={status}
                    className={cn(
                      "relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl p-5",
                      config.cardBg,
                    )}
                  >
                    <div
                      className="pointer-events-none absolute top-0 right-0 size-24"
                      style={{
                        backgroundImage: `radial-gradient(${config.dotColor} 1.5px, transparent 1.5px)`,
                        backgroundSize: "10px 10px",
                        maskImage: "radial-gradient(circle at top right, black, transparent 70%)",
                        WebkitMaskImage:
                          "radial-gradient(circle at top right, black, transparent 70%)",
                      }}
                    />

                    <div className="relative z-10">
                      <span
                        className={cn(
                          "flex size-11 items-center justify-center rounded-full text-white",
                          config.badgeBg,
                        )}
                      >
                        <Icon size={20} weight="bold" />
                      </span>
                      <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-2xl font-extrabold text-slate-800">{count}</p>
                        <p className="truncate text-sm font-semibold text-slate-600">
                          {t(`dashboard.statusDistribution.status.${status}`)}
                        </p>
                      </div>
                    </div>

                    <Image
                      src={config.image}
                      alt=""
                      width={112}
                      height={112}
                      unoptimized
                      className="pointer-events-none absolute right-1 bottom-7 size-20 object-contain"
                    />

                    <div className="relative z-10 mt-auto h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          config.barColor,
                        )}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ROW: Top jobs by applications (real data, full width) */}
      <div className="upnext-shadow flex flex-col rounded-2xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#5d87ff]">
              <TrendUp size={22} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{t("dashboard.topJobs.title")}</h3>
              <p className="text-xs text-slate-400">{t("dashboard.topJobs.subtitle")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/recruiter/analytics")}
            className="text-primary text-xs font-bold hover:underline"
          >
            {t("dashboard.viewAll")}
          </button>
        </div>

        {topJobs.length === 0 ? (
          <p className="py-6 text-center text-xs font-medium text-slate-400">
            {t("dashboard.topJobs.empty")}
          </p>
        ) : (
          <RecruiterTableLayout loading={false}>
            <thead className="bg-slate-50/75 text-left text-xs font-bold tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5" scope="col">
                  {t("dashboard.topJobs.table.job")}
                </th>
                <th className="px-4 py-2.5" scope="col">
                  {t("dashboard.topJobs.table.status")}
                </th>
                <th className="px-4 py-2.5 text-center" scope="col">
                  {t("dashboard.topJobs.table.applicants")}
                </th>
                <th className="px-4 py-2.5 text-center" scope="col">
                  {t("dashboard.topJobs.table.views")}
                </th>
                <th className="px-4 py-2.5 text-center" scope="col">
                  {t("dashboard.topJobs.table.published")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topJobs.map((jp) => {
                const config = JOB_STATUS_CARD_CONFIG[jp.status];
                const publishedDate = jp.publishedAt ?? jp.createdAt;
                return (
                  <tr key={jp.id} className="hover:bg-slate-50/50">
                    <td className="max-w-[220px] px-4 py-3 font-semibold text-slate-600">
                      <button
                        type="button"
                        onClick={() => router.push("/recruiter/job-posts")}
                        className="hover:text-primary max-w-full truncate text-left text-slate-600 hover:underline"
                      >
                        {jp.title}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-[11px] font-semibold text-white",
                          config.badgeBg,
                        )}
                      >
                        {t(`dashboard.statusDistribution.status.${jp.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {jp._count?.applications ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {jp._count?.views ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {formatAppDate(publishedDate, locale === "en" ? "en" : "vi")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </RecruiterTableLayout>
        )}
      </div>

      {/* ROW: Upcoming interviews (real data, full width) */}
      <div className="upnext-shadow flex flex-col rounded-2xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#eef6ff] text-[#0284c7]">
              <Clock size={22} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {t("dashboard.upcomingInterviews.title")}
              </h3>
              <p className="text-xs text-slate-400">{t("dashboard.upcomingInterviews.subtitle")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/recruiter/interviews")}
            className="text-primary text-xs font-bold hover:underline"
          >
            {t("dashboard.viewAll")}
          </button>
        </div>

        {upcomingInterviews.length === 0 ? (
          <p className="py-6 text-center text-xs font-medium text-slate-400">
            {t("dashboard.upcomingInterviews.empty")}
          </p>
        ) : (
          <RecruiterTableLayout loading={false}>
            <thead className="bg-slate-50/75 text-left text-xs font-bold tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5" scope="col">
                  {t("dashboard.upcomingInterviews.table.candidate")}
                </th>
                <th className="px-4 py-2.5" scope="col">
                  {t("dashboard.upcomingInterviews.table.role")}
                </th>
                <th className="px-4 py-2.5" scope="col">
                  {t("dashboard.upcomingInterviews.table.schedule")}
                </th>
                <th className="px-4 py-2.5" scope="col">
                  {t("dashboard.upcomingInterviews.table.interviewer")}
                </th>
                <th className="px-4 py-2.5" scope="col">
                  {t("dashboard.upcomingInterviews.table.mode")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcomingInterviews.map((candidate) => {
                const scheduledAt = toDate(candidate.interview!.scheduledAt);
                return (
                  <tr key={candidate.id} className="hover:bg-slate-50/50">
                    <td className="max-w-[200px] truncate px-4 py-3 font-bold text-slate-800">
                      {candidate.name}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">
                      {candidate.role}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatAppDate(scheduledAt, locale === "en" ? "en" : "vi")} ·{" "}
                      {scheduledAt.toLocaleTimeString(locale === "en" ? "en-US" : "vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {candidate.interview!.interviewerName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600">
                        {candidate.interview!.mode || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </RecruiterTableLayout>
        )}
      </div>

      <DialogPrimitive.Root open={reputationDialogOpen} onOpenChange={setReputationDialogOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" />
          <DialogPrimitive.Content
            aria-describedby="reputation-info-description"
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-4rem)] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white p-6 shadow-2xl focus:outline-none"
          >
            <div className="mb-4 flex items-center justify-between">
              <DialogPrimitive.Title className="text-lg font-bold text-slate-900">
                {t("dashboard.reputation.dialog.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label={t("dashboard.reputation.dialog.close")}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} weight="bold" />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description id="reputation-info-description" className="sr-only">
              {t("dashboard.reputation.dialog.title")}
            </DialogPrimitive.Description>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-600">
              <p>{t("dashboard.reputation.dialog.intro")}</p>

              <div>
                <h4 className="mb-1 font-bold text-slate-800">
                  {t("dashboard.reputation.dialog.gainTitle")}
                </h4>
                <p>{t("dashboard.reputation.dialog.gainText")}</p>
              </div>

              <div>
                <h4 className="mb-1 font-bold text-slate-800">
                  {t("dashboard.reputation.dialog.lossTitle")}
                </h4>
                <p>{t("dashboard.reputation.dialog.lossText")}</p>
              </div>

              <div>
                <h4 className="mb-2 font-bold text-slate-800">
                  {t("dashboard.reputation.dialog.tiersTitle")}
                </h4>
                <ul className="space-y-2">
                  {[...REPUTATION_TIERS].reverse().map((tier) => (
                    <li key={tier.id} className="flex gap-2 rounded-lg bg-slate-50 p-3">
                      <span
                        className={cn(
                          "h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                          tier.badgeClass,
                        )}
                      >
                        {t(`dashboard.reputation.tier.${tier.id}.range`)}
                      </span>
                      <span className="text-xs text-slate-600">
                        <strong className="text-slate-800">
                          {t(`dashboard.reputation.tier.${tier.id}.label`)}:
                        </strong>{" "}
                        {t(`dashboard.reputation.tier.${tier.id}.description`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {account ? (
        <RecruiterOnboardingDialog
          account={account}
          onCompleted={(nextAccount) => setAccount(nextAccount)}
          open={onboardingRequired}
          token={token}
          onSkip={() => {
            if (user?.id) {
              localStorage.setItem(`skippedOnboarding_${user.id}`, "true");
            }
            setSkippedOnboarding(true);
          }}
        />
      ) : null}
    </div>
  );
}

function RecruiterOnboardingDialog({
  account,
  onCompleted,
  open,
  token,
  onSkip,
}: {
  account: RecruiterAccountDetail;
  onCompleted: (account: RecruiterAccountDetail) => void;
  open: boolean;
  token: string;
  onSkip: () => void;
}) {
  const t = useTranslations("Recruiter");
  const [step, setStep] = useState<OnboardingStep>(0);

  const companySizeOptions = [
    { value: "", label: t("onboarding.companyProfile.companySizes.placeholder") },
    { value: "1", label: t("onboarding.companyProfile.companySizes.lessThan10") },
    { value: "2", label: t("onboarding.companyProfile.companySizes.10to24") },
    { value: "3", label: t("onboarding.companyProfile.companySizes.25to99") },
    { value: "4", label: t("onboarding.companyProfile.companySizes.100to499") },
    { value: "5", label: t("onboarding.companyProfile.companySizes.500to999") },
    { value: "6", label: t("onboarding.companyProfile.companySizes.1000to4999") },
    { value: "7", label: t("onboarding.companyProfile.companySizes.5000to9999") },
    { value: "8", label: t("onboarding.companyProfile.companySizes.10000to19999") },
    { value: "9", label: t("onboarding.companyProfile.companySizes.20000to49999") },
    { value: "10", label: t("onboarding.companyProfile.companySizes.moreThan50000") },
  ];

  const profile = account.profile as {
    id: string;
    fullName: string;
    phoneNumber: string | null;
    gender: "MALE" | "FEMALE" | null;
    avatarUrl: string | null;
  } | null;

  const onboardingSteps = useMemo(
    () => [t("onboarding.step0"), t("onboarding.step1"), t("onboarding.step2")],
    [t],
  );

  const onboardingSchema = useMemo(() => {
    return createOnboardingSchema(
      t,
      Boolean(profile?.avatarUrl),
      Boolean(account.company?.businessLicenseFileId),
    );
  }, [t, account.company?.businessLicenseFileId, profile?.avatarUrl]);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: profile?.fullName ?? "",
      phoneNumber: profile?.phoneNumber ?? "",
      gender: (profile?.gender as "MALE" | "FEMALE") ?? undefined,
      companyName:
        account.company?.name === DRAFT_COMPANY_NAME ? "" : (account.company?.name ?? ""),
      taxCode: "",
      address: "",
      city: "",
      companyEmail: account.email,
      companyPhone: "",
      website: "",
      companySize: "",
      description: "",
      benefits: "",
    },
  });

  const watchedAvatar = form.watch("avatar");
  const selectedGender = form.watch("gender");
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatarUrl ?? "");

  const [onboardingCompanyId, setOnboardingCompanyId] = useState(account.company?.id || "");
  const [scanning, setScanning] = useState(false);
  const [aiLicenseFile, setAiLicenseFile] = useState<File | null>(null);
  const aiLicenseInputRef = useRef<HTMLInputElement>(null);

  const handleScanLicense = async () => {
    if (!aiLicenseFile) {
      void Swal.fire({
        icon: "warning",
        title: t("onboarding.companyProfile.errors.noFileSelected") || "Chưa chọn file",
        text:
          t("onboarding.companyProfile.errors.noFileSelectedText") ||
          "Vui lòng chọn Giấy phép đăng ký kinh doanh.",
      });
      return;
    }

    let currentCompanyId = onboardingCompanyId;
    try {
      setScanning(true);
      if (!currentCompanyId) {
        // Create draft company first
        const draftCompany = await createCompany({ name: DRAFT_COMPANY_NAME }, token);
        currentCompanyId = draftCompany.id;
        setOnboardingCompanyId(currentCompanyId);
        await attachRecruiterCompany(account.id, currentCompanyId, token);
      }

      const data = await scanCompanyBusinessLicense(currentCompanyId, aiLicenseFile, token);
      const normalizedCity =
        normalizeProvinceName(data.city) || extractProvinceFromAddress(data.address);
      const normalizedAddress = stripProvinceFromAddress(data.address, normalizedCity);
      const normalizedWebsite = normalizeWebsite(data.website);

      const result = await Swal.fire({
        title:
          t("onboarding.companyProfile.messages.scanSuccessTitle") || "Quét thông tin thành công!",
        html: `
          <div class="text-left space-y-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
            <p class="break-words"><strong>${t("onboarding.companyProfile.messages.scanFields.name") || "Tên công ty"}:</strong> ${data.name || "Không tìm thấy"}</p>
            <p class="break-words"><strong>${t("onboarding.companyProfile.messages.scanFields.taxCode") || "Mã số thuế"}:</strong> ${data.taxCode || "Không tìm thấy"}</p>
            <p class="break-words"><strong>${t("onboarding.companyProfile.fields.city") || "Tỉnh/Thành phố"}:</strong> ${normalizedCity || "Không tìm thấy"}</p>
            <p class="break-words"><strong>${t("onboarding.companyProfile.messages.scanFields.address") || "Địa chỉ"}:</strong> ${normalizedAddress || "Không tìm thấy"}</p>
            ${data.email ? `<p class="break-words"><strong>Email:</strong> ${data.email}</p>` : ""}
            ${data.phone ? `<p class="break-words"><strong>SĐT:</strong> ${data.phone}</p>` : ""}
            ${normalizedWebsite ? `<p class="break-words"><strong>Website:</strong> ${normalizedWebsite}</p>` : ""}
          </div>
          <p class="mt-4 text-center font-bold text-slate-700 font-sans">${t("onboarding.companyProfile.messages.scanSuccessConfirmText") || "Bạn có muốn tự động điền các thông tin này?"}</p>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: t("onboarding.companyProfile.messages.agree") || "Đồng ý",
        cancelButtonText: t("onboarding.companyProfile.messages.ignore") || "Bỏ qua",
        confirmButtonColor: "#10a778",
      });

      if (result.isConfirmed) {
        if (data.name)
          form.setValue("companyName", data.name, { shouldValidate: true, shouldDirty: true });
        if (data.taxCode)
          form.setValue("taxCode", data.taxCode, { shouldValidate: true, shouldDirty: true });
        if (normalizedCity)
          form.setValue("city", normalizedCity, { shouldValidate: true, shouldDirty: true });
        if (normalizedAddress)
          form.setValue("address", normalizedAddress, { shouldValidate: true, shouldDirty: true });
        if (data.email)
          form.setValue("companyEmail", data.email, { shouldValidate: true, shouldDirty: true });
        if (data.phone)
          form.setValue("companyPhone", data.phone, { shouldValidate: true, shouldDirty: true });
        if (normalizedWebsite)
          form.setValue("website", normalizedWebsite, { shouldValidate: true, shouldDirty: true });

        // Programmatically populate the businessLicense field in step 3 using DataTransfer
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(aiLicenseFile);
        form.setValue("businessLicense", dataTransfer.files, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });

        setAiLicenseFile(null);

        void Swal.fire({
          icon: "success",
          title: t("onboarding.companyProfile.messages.autofillSuccess") || "Đã điền tự động!",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: t("onboarding.companyProfile.errors.scanError") || "Lỗi quét AI",
        text: getOnboardingErrorMessage(error, t),
      });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    const avatarFile = watchedAvatar?.item(0);

    if (!avatarFile) {
      setAvatarPreview(profile?.avatarUrl ?? "");
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [watchedAvatar, profile?.avatarUrl]);

  const isFirstStep = step === 0;
  const isLastStep = step === onboardingSteps.length - 1;

  async function goNext() {
    const valid = await form.trigger(stepFields[step], {
      shouldFocus: true,
    });

    if (!valid) {
      showToast("error", getFirstErrorMessage(form.formState.errors, t));
      return;
    }

    setStep((current) => Math.min(current + 1, onboardingSteps.length - 1) as OnboardingStep);
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0) as OnboardingStep);
  }

  const [skipping, setSkipping] = useState(false);

  async function handleSkipAndSaveProfile() {
    const valid = await form.trigger(stepFields[0], {
      shouldFocus: true,
    });

    if (!valid) {
      showToast("error", getFirstErrorMessage(form.formState.errors, t));
      setStep(0);
      return;
    }

    setSkipping(true);
    try {
      const values = form.getValues();
      let avatarUrl = profile?.avatarUrl ?? null;
      const avatarFile = values.avatar?.item(0);

      if (avatarFile) {
        const uploadResult = await uploadFile(avatarFile, "AVATAR", "PUBLIC", token);
        avatarUrl = uploadResult.file.publicUrl;
      }

      const genderValue =
        values.gender === "MALE" || values.gender === "FEMALE"
          ? (values.gender as "MALE" | "FEMALE")
          : undefined;

      if (!profile) {
        await createRecruiterProfile(
          {
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            recruiterAccountId: account.id,
            gender: genderValue,
            avatarUrl: avatarUrl || undefined,
          },
          token,
        );
      } else {
        await updateRecruiterProfile(
          profile.id,
          {
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            gender: genderValue,
            avatarUrl: avatarUrl || undefined,
          },
          token,
        );
      }

      const nextAccount = await getRecruiterAccount(account.id, token);
      onCompleted(nextAccount);
      showToast("success", t("onboarding.messages.success"));
      onSkip();
    } catch (error) {
      showToast("error", getOnboardingErrorMessage(error, t));
    } finally {
      setSkipping(false);
    }
  }

  async function submit(values: OnboardingValues) {
    const file = values.businessLicense?.item(0);

    if (!account.company?.businessLicenseFileId && !file) {
      showToast("error", t("onboarding.validation.businessLicenseRequired"));
      return;
    }

    try {
      let avatarUrl = profile?.avatarUrl ?? null;
      const avatarFile = values.avatar?.item(0);

      if (avatarFile) {
        const uploadResult = await uploadFile(avatarFile, "AVATAR", "PUBLIC", token);
        avatarUrl = uploadResult.file.publicUrl;
      }

      const currentCompanyId = onboardingCompanyId || account.company?.id;

      let companyId: string;
      if (currentCompanyId) {
        await updateCompany(
          currentCompanyId,
          {
            address: values.address,
            companySize: values.companySize,
            description: values.description,
            benefits: values.benefits ?? "",
            email: values.companyEmail,
            name: values.companyName,
            phone: values.companyPhone,
            taxCode: values.taxCode,
            website: values.website ?? "",
          },
          token,
        );
        await syncPrimaryCompanyLocation(
          currentCompanyId,
          token,
          values.city.trim(),
          values.address.trim(),
        );
        companyId = currentCompanyId;
      } else {
        const newCompany = await createCompany(
          {
            address: values.address,
            companySize: values.companySize,
            description: values.description,
            benefits: values.benefits ?? "",
            email: values.companyEmail,
            name: values.companyName,
            phone: values.companyPhone,
            taxCode: values.taxCode,
            website: values.website ?? "",
          },
          token,
        );
        companyId = newCompany.id;
        await syncPrimaryCompanyLocation(
          companyId,
          token,
          values.city.trim(),
          values.address.trim(),
        );
      }

      if (!account.company) {
        await attachRecruiterCompany(account.id, companyId, token);
      }

      const genderValue =
        values.gender === "MALE" || values.gender === "FEMALE"
          ? (values.gender as "MALE" | "FEMALE")
          : undefined;

      if (!profile) {
        await createRecruiterProfile(
          {
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            recruiterAccountId: account.id,
            gender: genderValue,
            avatarUrl: avatarUrl || undefined,
          },
          token,
        );
      } else {
        await updateRecruiterProfile(
          profile.id,
          {
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            gender: genderValue,
            avatarUrl: avatarUrl || undefined,
          },
          token,
        );
      }

      if (!account.company?.businessLicenseFileId && file) {
        await uploadCompanyBusinessLicense(companyId, file, token);
      }

      const nextAccount = await getRecruiterAccount(account.id, token);

      onCompleted(nextAccount);
      showToast("success", t("onboarding.messages.submittingSuccess"));
    } catch (error) {
      showToast("error", getOnboardingErrorMessage(error, t));
    }
  }

  return (
    <DialogPrimitive.Root open={open} modal={false}>
      <DialogPrimitive.Portal>
        <div className="animate-dialog-overlay fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" />

        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Content
            aria-describedby="recruiter-onboarding-dialog-description"
            className="animate-dialog-unfold pointer-events-auto relative flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white p-0 shadow-2xl [--ring:#10a778] focus:outline-none"
          >
            <div className="bg-header relative shrink-0 overflow-hidden border-b border-slate-200 px-4 py-6 sm:px-6 sm:py-8">
              {/* Grid pattern overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)
                `,
                  backgroundSize: "20px 20px",
                }}
              />
              {/* Glow blobs */}
              <div className="pointer-events-none absolute -top-10 -left-10 size-40 rounded-full bg-emerald-400/20 blur-2xl" />
              <div className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full bg-teal-300/15 blur-2xl" />

              <div className="relative z-10">
                <DialogPrimitive.Title className="text-center text-lg font-bold text-white sm:text-xl">
                  {t("onboarding.updateProfile")}
                </DialogPrimitive.Title>

                <DialogPrimitive.Description
                  id="recruiter-onboarding-dialog-description"
                  className="sr-only"
                >
                  {t("onboarding.dialogDescription")}
                </DialogPrimitive.Description>

                <div className="mt-6 w-full">
                  <div className="relative mx-auto grid w-full grid-cols-3 items-start px-2 sm:px-8">
                    {/* Background track line */}
                    <div className="absolute top-4 right-[16.666%] left-[16.666%] h-0.5 bg-white/20" />

                    {/* Active progress line */}
                    <div
                      className={[
                        "absolute left-[16.666%] top-4 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500",
                        step === 0 ? "w-0" : "",
                        step === 1 ? "w-[33.333%]" : "",
                        step === 2 ? "w-[66.666%]" : "",
                      ].join(" ")}
                    />

                    {onboardingSteps.map((item, index) => {
                      const active = index === step;
                      const completed = index < step;
                      const reached = active || completed;

                      return (
                        <div
                          key={item}
                          className="relative z-10 flex flex-col items-center text-center"
                        >
                          <div
                            className={[
                              "flex size-9 items-center justify-center rounded-full border-2 text-sm font-black transition-all duration-300",
                              completed
                                ? "border-emerald-400 bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                : active
                                  ? "border-emerald-400 bg-white text-emerald-600 shadow-lg shadow-emerald-400/30 scale-110"
                                  : "border-white/20 bg-[#0b5b47] text-white/50",
                            ].join(" ")}
                          >
                            {completed ? "✓" : index + 1}
                          </div>

                          <p
                            className={[
                              "mt-2 text-center text-[12px] sm:text-xs leading-4 sm:leading-5 transition-colors duration-300",
                              reached ? "text-white font-extrabold" : "text-white/60 font-semibold",
                            ].join(" ")}
                          >
                            {item}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={form.handleSubmit(submit, (errors) =>
                showToast("error", getFirstErrorMessage(errors, t)),
              )}
              noValidate
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                {step === 0 ? (
                  <section className="space-y-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <div className="w-full shrink-0 sm:w-40">
                        <RequiredLabel htmlFor="recruiter-onboarding-avatar">
                          {t("onboarding.labels.avatar")}
                        </RequiredLabel>

                        <label
                          htmlFor="recruiter-onboarding-avatar"
                          className="group mt-2 block w-fit cursor-pointer"
                        >
                          <input
                            id="recruiter-onboarding-avatar"
                            className="hidden"
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            {...form.register("avatar")}
                          />

                          <div className="relative size-20 overflow-hidden rounded-full bg-slate-100">
                            {avatarPreview ? (
                              <Image
                                src={avatarPreview}
                                alt="Avatar"
                                width={80}
                                height={80}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-slate-300">
                                +
                              </div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 transition-colors group-hover:bg-slate-950/35">
                              <div className="flex size-8 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                                <UploadSimple size={16} weight="bold" />
                              </div>
                            </div>
                          </div>
                        </label>

                        <p className="mt-2 text-xs leading-4 text-slate-500">PNG, JPG, JPEG.</p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <RequiredLabel>{t("onboarding.labels.gender")}</RequiredLabel>

                        <div className="mt-3 flex flex-wrap gap-5">
                          {[
                            { label: t("onboarding.gender.male"), value: "MALE" },
                            { label: t("onboarding.gender.female"), value: "FEMALE" },
                          ].map((option) => {
                            const selected = selectedGender === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  form.setValue("gender", option.value as "MALE" | "FEMALE", {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                  })
                                }
                                className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                              >
                                <span
                                  className={[
                                    "flex size-4 items-center justify-center rounded-full border",
                                    selected ? "border-emerald-600" : "border-slate-300",
                                  ].join(" ")}
                                >
                                  {selected ? (
                                    <span className="size-2 rounded-full bg-emerald-600" />
                                  ) : null}
                                </span>

                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <OnboardingField
                        id="recruiter-onboarding-full-name"
                        label={t("onboarding.labels.fullName")}
                        placeholder={t("onboarding.placeholders.fullName")}
                        register={form.register("fullName")}
                        required
                      />

                      <OnboardingField
                        id="recruiter-onboarding-phone"
                        label={t("onboarding.labels.phone")}
                        placeholder={t("onboarding.placeholders.phone")}
                        register={form.register("phoneNumber", {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            e.target.value = e.target.value.replace(/[^0-9+]/g, "");
                          },
                        })}
                        required
                      />
                    </div>
                  </section>
                ) : null}

                {step === 1 ? (
                  <section className="space-y-4">
                    {/* AI Scanner Banner */}
                    <div className="relative mb-4 overflow-hidden rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/30 p-4 transition-all duration-300 lg:col-span-2">
                      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Info */}
                        <div className="flex items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-600/10">
                            <Sparkle size={18} weight="fill" className="animate-pulse" />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 sm:text-sm">
                              {t("onboarding.companyProfile.aiScan.title") ||
                                "Tự động điền thông tin nhanh bằng AI"}
                              <span className="py-0.2 rounded-full bg-emerald-100 px-1.5 text-[8px] font-black text-emerald-800 uppercase">
                                {t("onboarding.companyProfile.aiScan.badgeNew") || "Mới"}
                              </span>
                            </h4>
                            <p className="max-w-xl text-[11px] leading-relaxed font-medium text-slate-500">
                              {t("onboarding.companyProfile.aiScan.helpText") ||
                                "Tải lên Giấy đăng ký kinh doanh (GPKD), hệ thống AI của UpNext sẽ tự động phân tích và điền nhanh các thông tin."}
                            </p>
                          </div>
                        </div>

                        {/* Action */}
                        <div
                          className={[
                            "flex shrink-0 items-center gap-2 self-end sm:self-center",
                            aiLicenseFile ? "w-full grid grid-cols-2 sm:w-[320px]" : "",
                          ].join(" ")}
                        >
                          {!aiLicenseFile ? (
                            <button
                              type="button"
                              onClick={() => aiLicenseInputRef.current?.click()}
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-98"
                            >
                              <UploadSimple size={14} weight="bold" />
                              <span>
                                {t("onboarding.companyProfile.aiScan.uploadBtn") ||
                                  "Tải lên GPKD để quét"}
                              </span>
                            </button>
                          ) : (
                            <>
                              <span
                                onClick={() => aiLicenseInputRef.current?.click()}
                                title="Nhấn để chọn tệp khác"
                                className="flex h-9 min-w-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50"
                              >
                                <span className="truncate">📎 {aiLicenseFile.name}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleScanLicense()}
                                disabled={scanning}
                                className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {scanning ? (
                                  <>
                                    <CircleNotch className="size-3 animate-spin" />
                                    <span>
                                      {t("onboarding.companyProfile.aiScan.scanning") ||
                                        "Đang quét..."}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span>
                                      {t("onboarding.companyProfile.aiScan.startBtn") ||
                                        "Bắt đầu quét AI"}
                                    </span>
                                    <Lightning
                                      size={12}
                                      weight="fill"
                                      className="animate-pulse text-yellow-300"
                                    />
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <input
                        ref={aiLicenseInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        aria-label="Tải lên GPKD để quét"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAiLicenseFile(file);
                          }
                        }}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <OnboardingField
                        id="recruiter-onboarding-company-name"
                        label={t("onboarding.labels.companyName")}
                        placeholder={t("onboarding.placeholders.companyName")}
                        register={form.register("companyName")}
                        required
                      />

                      <OnboardingField
                        id="recruiter-onboarding-tax-code"
                        label={t("onboarding.labels.taxCode")}
                        placeholder={t("onboarding.placeholders.taxCode")}
                        register={form.register("taxCode")}
                        required
                      />

                      <OnboardingField
                        id="recruiter-onboarding-company-email"
                        label={t("onboarding.labels.companyEmail")}
                        placeholder={t("onboarding.placeholders.companyEmail")}
                        register={form.register("companyEmail")}
                        type="email"
                        required
                      />

                      <OnboardingField
                        id="recruiter-onboarding-company-phone"
                        label={t("onboarding.labels.companyPhone")}
                        placeholder={t("onboarding.placeholders.companyPhone")}
                        register={form.register("companyPhone", {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            e.target.value = e.target.value.replace(/[^0-9+]/g, "");
                          },
                        })}
                        required
                      />

                      <OnboardingField
                        id="recruiter-onboarding-website"
                        label={t("onboarding.labels.website")}
                        placeholder={t("onboarding.placeholders.website")}
                        register={form.register("website")}
                        type="url"
                      />

                      <div className="flex flex-col gap-1.5">
                        <RequiredLabel htmlFor="recruiter-onboarding-company-size">
                          {t("onboarding.labels.companySize")}
                        </RequiredLabel>
                        <select
                          id="recruiter-onboarding-company-size"
                          {...form.register("companySize")}
                          className="upnext-focus flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-none transition-colors focus:border-emerald-600 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {companySizeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <OnboardingField
                        id="recruiter-onboarding-address"
                        label={t("onboarding.companyProfile.fields.address")}
                        placeholder={t("onboarding.companyProfile.fields.addressPlaceholder")}
                        register={form.register("address")}
                        required
                      />

                      <div className="flex flex-col gap-1.5">
                        <RequiredLabel htmlFor="recruiter-onboarding-city">
                          {t("onboarding.companyProfile.fields.city")}
                        </RequiredLabel>
                        <select
                          id="recruiter-onboarding-city"
                          {...form.register("city")}
                          className="upnext-focus flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-none transition-colors focus:border-emerald-600 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">
                            {t("onboarding.companyProfile.fields.cityPlaceholder")}
                          </option>
                          {VIETNAM_PROVINCES.map((province) => (
                            <option key={province.name} value={province.name}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <RequiredLabel htmlFor="recruiter-onboarding-description">
                        {t("onboarding.labels.description")}
                      </RequiredLabel>

                      <textarea
                        id="recruiter-onboarding-description"
                        className="upnext-focus min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-none placeholder:text-slate-400"
                        placeholder={t("onboarding.placeholders.description")}
                        {...form.register("description")}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="recruiter-onboarding-benefits"
                        className="text-sm font-bold text-slate-700"
                      >
                        {t("onboarding.companyProfile.fields.benefits")}
                      </Label>

                      <textarea
                        id="recruiter-onboarding-benefits"
                        className="upnext-focus min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-none placeholder:text-slate-400"
                        placeholder={t("onboarding.companyProfile.fields.benefitsPlaceholder")}
                        {...form.register("benefits")}
                      />
                    </div>
                  </section>
                ) : null}

                {step === 2 ? (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                      <UploadSimple size={18} />
                      {t("onboarding.step2")}
                    </div>

                    <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-4">
                      <RequiredLabel htmlFor="recruiter-onboarding-license">
                        {t("onboarding.labels.businessLicense")}
                      </RequiredLabel>

                      <Input
                        id="recruiter-onboarding-license"
                        className="mt-2 h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none file:mr-3 file:rounded-md file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-emerald-800"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        {...form.register("businessLicense")}
                      />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {t("onboarding.upload.helpText")}
                      </p>

                      {(() => {
                        const watchedLicense = form.watch("businessLicense");
                        const selectedLicenseFile = watchedLicense?.item?.(0) || null;
                        if (!selectedLicenseFile) return null;
                        return (
                          <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-100 bg-white p-3 shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="text-emerald-600">📎</span>
                              <div className="flex flex-col">
                                <span className="max-w-[250px] truncate text-sm font-bold text-slate-700 sm:max-w-[400px]">
                                  {selectedLicenseFile.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {(selectedLicenseFile.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                form.setValue("businessLicense", undefined as any, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                });
                              }}
                              className="text-xs font-bold text-red-500 transition-colors hover:text-red-700"
                            >
                              Xóa
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </section>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                {isFirstStep ? (
                  <div />
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={skipping || form.formState.isSubmitting}
                    onClick={goBack}
                  >
                    {t("onboarding.buttons.back")}
                  </Button>
                )}

                <div className="flex items-center gap-3">
                  {!isFirstStep && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="font-semibold text-slate-500 hover:text-slate-800"
                      disabled={skipping || form.formState.isSubmitting}
                      onClick={handleSkipAndSaveProfile}
                    >
                      {skipping ? "Đang xử lý..." : t("onboarding.buttons.skip")}
                    </Button>
                  )}

                  {isLastStep ? (
                    <Button
                      type="submit"
                      disabled={skipping || form.formState.isSubmitting}
                      className="h-11 rounded-full bg-[#11a77a] px-6 text-sm font-extrabold hover:bg-[#0d966d]"
                    >
                      {form.formState.isSubmitting
                        ? t("onboarding.buttons.submitting")
                        : t("onboarding.buttons.finish")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={skipping || form.formState.isSubmitting}
                      className="h-11 rounded-full bg-[#11a77a] px-6 text-sm font-extrabold hover:bg-[#0d966d]"
                      onClick={goNext}
                    >
                      {t("onboarding.buttons.next")}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function OnboardingField({
  id,
  label,
  placeholder,
  register,
  required = false,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  required?: boolean;
  type?: "email" | "text" | "url";
}) {
  return (
    <FormInput
      id={id}
      label={label}
      required={required}
      className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none placeholder:text-slate-400"
      placeholder={placeholder}
      type={type}
      {...register}
    />
  );
}

async function syncPrimaryCompanyLocation(
  companyId: string,
  token: string,
  city: string,
  address: string,
) {
  const locations = await getCompanyLocations(companyId, token);
  const primaryLocation =
    locations.find((location) => location.name === PRIMARY_COMPANY_LOCATION_NAME) ??
    locations.find((location) => location.address === address);
  const payload = {
    name: PRIMARY_COMPANY_LOCATION_NAME,
    workingModel: "ONSITE" as const,
    city,
    address,
  };

  if (primaryLocation) {
    await updateCompanyLocation(companyId, primaryLocation.id, payload, token);
    return;
  }

  await createCompanyLocation(companyId, payload, token);
}
