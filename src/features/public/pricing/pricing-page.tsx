"use client";

import { Check, Minus, Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useCallback } from "react";
import Swal from "sweetalert2";

import {
  getCandidateSubscription,
  type CandidateSubscriptionSummary,
} from "@/features/ai-copilot/api/candidate-subscription-api";
import {
  createCandidateInvoice,
  type CandidateInvoice,
} from "@/features/candidate/api/candidate-billing-api";
import { CandidateSepayModal } from "@/features/candidate/components/candidate-sepay-modal";
import { getCandidateSession } from "@/features/candidate/session";
import {
  getPublicSubscriptionPlans,
  SUBSCRIPTION_FEATURES,
  type SubscriptionFeature,
  type SubscriptionPlan,
} from "@/features/recruiter/api/billing";
import {
  isRecruiterFeatureAvailable,
  recruiterFeatureLimit,
} from "@/features/recruiter/api/plan-entitlements";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

type PricingTab = "recruiter" | "candidate";

/** Highest-priced plan gets the "contact sales" CTA rather than self-serve upgrade. */
function resolveCta(plan: SubscriptionPlan, isTopTier: boolean) {
  if (Number(plan.price) <= 0) return "free" as const;
  return isTopTier ? ("contact" as const) : ("upgrade" as const);
}

function formatPrice(price: string) {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function PricingPage() {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const [tab, setTab] = useState<PricingTab>("recruiter");
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [error, setError] = useState(false);

  // Candidate billing & modal state
  const [candidateSub, setCandidateSub] = useState<CandidateSubscriptionSummary | null>(null);
  const [checkoutInvoice, setCheckoutInvoice] = useState<CandidateInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Detect ?tab=candidate in URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab === "candidate" || urlTab === "recruiter") {
        setTab(urlTab);
      }
    }
  }, []);

  // Fetch plans based on selected tab
  const loadPlans = useCallback(async () => {
    setError(false);
    setPlans(null);

    const audience = tab === "candidate" ? "CANDIDATE" : "RECRUITER";
    try {
      const data = await getPublicSubscriptionPlans(audience);
      // Sort plans by sortOrder ascending or price ascending
      const sorted = [...data].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return Number(a.price) - Number(b.price);
      });
      setPlans(sorted);
    } catch {
      setError(true);
    }
  }, [tab]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  // If candidate tab and candidate is logged in, fetch candidate subscription
  const refreshCandidateSub = useCallback(() => {
    const session = getCandidateSession();
    if (session && tab === "candidate") {
      getCandidateSubscription()
        .then(setCandidateSub)
        .catch(() => setCandidateSub(null));
    } else {
      setCandidateSub(null);
    }
  }, [tab]);

  useEffect(() => {
    refreshCandidateSub();
  }, [refreshCandidateSub]);

  // Recruiter feature limits map
  const limitByPlan = useMemo(() => {
    const map = new Map<
      string,
      Map<SubscriptionFeature, { enabled: boolean; limit: number | null }>
    >();
    for (const plan of plans ?? []) {
      map.set(
        plan.id,
        new Map(
          plan.features.map((feature) => [
            feature.feature,
            { enabled: feature.enabled, limit: feature.limitValue },
          ]),
        ),
      );
    }
    return map;
  }, [plans]);

  /** Only show comparison rows that at least one recruiter plan actually grants. */
  const comparedFeatures = useMemo(
    () =>
      SUBSCRIPTION_FEATURES.filter((feature) =>
        (plans ?? []).some((plan) =>
          isRecruiterFeatureAvailable(feature, limitByPlan.get(plan.id)?.get(feature)?.enabled),
        ),
      ),
    [plans, limitByPlan],
  );

  const renderLimit = (planId: string, feature: SubscriptionFeature) => {
    const entry = limitByPlan.get(planId)?.get(feature);
    const available = isRecruiterFeatureAvailable(feature, entry?.enabled);
    const limit = recruiterFeatureLimit(feature, entry?.limit);

    if (!available) {
      return (
        <span className="inline-flex items-center gap-1 text-slate-400">
          <Minus size={14} aria-hidden="true" />
          <span className="sr-only">{t("notIncluded")}</span>
        </span>
      );
    }
    if (limit === null) {
      return <span className="font-semibold text-emerald-700">{t("unlimited")}</span>;
    }
    return <span className="font-semibold text-slate-900">{limit.toLocaleString("vi-VN")}</span>;
  };

  // Handle Candidate plan upgrade
  const handleCandidateUpgrade = async (plan: SubscriptionPlan) => {
    const session = getCandidateSession();
    if (!session) {
      void Swal.fire({
        icon: "info",
        title: "Yêu cầu đăng nhập",
        text: "Vui lòng đăng nhập tài khoản Ứng viên để tiến hành đăng ký và kích hoạt gói.",
        showCancelButton: true,
        confirmButtonText: "Đăng nhập ngay",
        cancelButtonText: "Để sau",
        confirmButtonColor: "#10a778",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push(`/auth?returnUrl=${encodeURIComponent("/pricing?tab=candidate")}`);
        }
      });
      return;
    }

    try {
      setIsCreatingInvoice(true);
      const newInvoice = await createCandidateInvoice(plan.id, session.accessToken);
      setCheckoutInvoice(newInvoice);
      setIsModalOpen(true);
    } catch {
      void Swal.fire({
        icon: "error",
        title: "Không thể tạo hóa đơn",
        text: "Đã xảy ra lỗi khi tạo yêu cầu thanh toán. Vui lòng thử lại sau.",
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleCandidatePaymentSuccess = () => {
    refreshCandidateSub();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
          {t("eyebrow")}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">
          {tab === "candidate" ? t("candidate.headline") : t("headline")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
          {tab === "candidate" ? t("candidate.subheadline") : t("subheadline")}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={t("eyebrow")}
        className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1"
      >
        {(["recruiter", "candidate"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "h-10 cursor-pointer rounded-full px-5 text-sm font-bold transition-all",
              tab === value
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800",
            )}
          >
            {t(`tabs.${value}`)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-10 text-center text-sm font-semibold text-rose-600">{t("states.error")}</p>
      ) : plans === null ? (
        <p className="mt-10 text-center text-sm font-semibold text-slate-500">
          {t("states.loading")}
        </p>
      ) : plans.length === 0 ? (
        <p className="mt-10 text-center text-sm font-semibold text-slate-500">
          {t("states.empty")}
        </p>
      ) : tab === "candidate" ? (
        /* CANDIDATE PLANS */
        <>
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            {plans.map((plan) => {
              const price = formatPrice(plan.price);
              const isPro = Number(plan.price) > 0;
              const isCurrentActive =
                candidateSub?.plan?.code === plan.code || (!candidateSub?.plan?.code && !isPro);

              const aiRuns =
                plan.features.find((f) => f.feature === "ai_copilot_run")?.limitValue ??
                (isPro ? 100 : 10);

              return (
                <article
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-3xl border bg-white p-7 shadow-sm transition-all hover:shadow-md",
                    isPro
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/5"
                      : "border-slate-200",
                  )}
                >
                  {isPro ? (
                    <div className="absolute -top-3.5 right-6 flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                      <Sparkle size={13} weight="fill" className="text-amber-300" />
                      Phổ biến nhất
                    </div>
                  ) : null}

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{plan.subscriptionName}</h2>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {plan.description ||
                        (isPro
                          ? "Gói nâng cao giúp tối ưu hồ sơ và tăng tỷ lệ phỏng vấn."
                          : "Gói mặc định miễn phí khi tạo tài khoản ứng viên.")}
                    </p>
                  </div>

                  <p className="mt-5 flex items-baseline gap-1.5 border-t border-slate-100 pt-5">
                    <span className="text-3xl font-extrabold text-slate-950">
                      {price ?? t("free")}
                    </span>
                    {price ? (
                      <span className="text-xs font-semibold text-slate-500">
                        {plan.durationDays === 30
                          ? t("perMonth")
                          : t("perCycle", { days: plan.durationDays })}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">vĩnh viễn</span>
                    )}
                  </p>

                  <div className="mt-6 flex-1 space-y-3.5 border-t border-slate-100 pt-5">
                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>
                        Tạo CV chuẩn ATS:{" "}
                        <strong className="font-bold text-slate-900">Không giới hạn</strong>
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>
                        Lượt trợ lý AI Copilot:{" "}
                        <strong className="font-bold text-emerald-700">
                          {aiRuns} lượt / tháng
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>
                        Phân tích & gợi ý việc làm với AI:{" "}
                        <strong className="font-bold text-slate-900">
                          {isPro ? "Ưu tiên độ khớp cao" : "Tiêu chuẩn"}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>
                        Hỗ trợ ứng viên:{" "}
                        <strong className="font-bold text-slate-900">
                          {isPro ? "Hỗ trợ ưu tiên 24/7" : "Cộng đồng"}
                        </strong>
                      </span>
                    </div>

                    {isPro ? (
                      <div className="flex items-start gap-2.5 text-xs text-slate-700">
                        <Check
                          size={16}
                          weight="bold"
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />
                        <span>
                          Thanh toán linh hoạt qua:{" "}
                          <strong className="font-bold text-emerald-700">VietQR (SePay)</strong>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-8">
                    {!isPro ? (
                      <Button
                        type="button"
                        disabled
                        className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 shadow-none"
                      >
                        {isCurrentActive ? "Đang sử dụng" : "Gói miễn phí"}
                      </Button>
                    ) : isCurrentActive ? (
                      <Button
                        type="button"
                        disabled
                        className="h-11 w-full cursor-not-allowed rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 shadow-none"
                      >
                        Đang sử dụng (Hạn:{" "}
                        {new Date(candidateSub?.plan?.expiresAt ?? "").toLocaleDateString("vi-VN")})
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => void handleCandidateUpgrade(plan)}
                        disabled={isCreatingInvoice}
                        className="h-11 w-full cursor-pointer rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
                      >
                        {isCreatingInvoice ? "Đang khởi tạo..." : "Nâng cấp gói ngay"}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Candidate Feature Comparison Table */}
          <section className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-lg font-bold text-slate-950">So sánh quyền lợi ứng viên</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-left text-xs font-bold text-slate-700"
                    >
                      Tính năng
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-center text-xs font-bold text-slate-700"
                    >
                      Candidate Free
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-center text-xs font-bold text-emerald-700"
                    >
                      Candidate Pro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <th
                      scope="row"
                      className="px-5 py-3.5 text-left text-xs font-medium text-slate-700"
                    >
                      Giá dịch vụ
                    </th>
                    <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">
                      0đ
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs font-bold text-emerald-600">
                      99.000đ / 30 ngày
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="px-5 py-3.5 text-left text-xs font-medium text-slate-700"
                    >
                      Tạo và tải CV PDF chuẩn ATS
                    </th>
                    <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-900">
                      Không giới hạn
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-900">
                      Không giới hạn
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="px-5 py-3.5 text-left text-xs font-medium text-slate-700"
                    >
                      Lượt trợ lý AI Copilot (viết CV, tối ưu, luyện phỏng vấn)
                    </th>
                    <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">
                      10 lượt / tháng
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs font-bold text-emerald-700">
                      100 lượt / tháng
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="px-5 py-3.5 text-left text-xs font-medium text-slate-700"
                    >
                      Gợi ý việc làm phù hợp theo năng lực
                    </th>
                    <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">
                      Tiêu chuẩn
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-900">
                      Ưu tiên phân tích sâu
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="px-5 py-3.5 text-left text-xs font-medium text-slate-700"
                    >
                      Phương thức thanh toán
                    </th>
                    <td className="px-5 py-3.5 text-center text-xs text-slate-400">—</td>
                    <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-900">
                      VietQR (SePay tự động)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        /* RECRUITER PLANS */
        <>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, index) => {
              const isTopTier = index === plans.length - 1;
              const ctaKey = resolveCta(plan, isTopTier);
              const price = formatPrice(plan.price);

              return (
                <article
                  key={plan.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-white p-6 shadow-none transition-shadow",
                    plan.highlightLabel
                      ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/20"
                      : "border-slate-200",
                  )}
                >
                  {plan.highlightLabel ? (
                    <span className="mb-3 w-fit rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
                      {plan.highlightLabel}
                    </span>
                  ) : null}

                  <h2 className="text-lg font-bold text-slate-950">{plan.subscriptionName}</h2>

                  <p className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-950">{price ?? t("free")}</span>
                    {price ? (
                      <span className="text-xs font-semibold text-slate-500">
                        {plan.durationDays === 30
                          ? t("perMonth")
                          : t("perCycle", { days: plan.durationDays })}
                      </span>
                    ) : null}
                  </p>

                  {plan.description ? (
                    <p className="mt-3 text-xs leading-relaxed text-slate-600">
                      {plan.description}
                    </p>
                  ) : null}

                  <ul className="mt-5 flex-1 space-y-2">
                    {SUBSCRIPTION_FEATURES.filter((feature) => {
                      const entry = limitByPlan.get(plan.id)?.get(feature);
                      return (
                        isRecruiterFeatureAvailable(feature, entry?.enabled) &&
                        recruiterFeatureLimit(feature, entry?.limit) !== 0
                      );
                    })
                      .slice(0, 4)
                      .map((feature) => {
                        const entry = limitByPlan.get(plan.id)?.get(feature);
                        const limit = recruiterFeatureLimit(feature, entry?.limit);
                        return (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-xs text-slate-700"
                          >
                            <Check
                              size={14}
                              className="mt-0.5 shrink-0 text-emerald-600"
                              aria-hidden="true"
                            />
                            <span>
                              {t(`features.${feature}`)}
                              {": "}
                              <strong className="font-semibold">
                                {limit === null ? t("unlimited") : limit.toLocaleString("vi-VN")}
                              </strong>
                            </span>
                          </li>
                        );
                      })}
                  </ul>

                  <Button
                    asChild
                    className={cn(
                      "mt-6 h-11 w-full rounded-lg text-sm font-bold shadow-none",
                      plan.highlightLabel
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                    )}
                  >
                    <Link href="/recruiter/billing">{t(`cta.${ctaKey}`)}</Link>
                  </Button>
                </article>
              );
            })}
          </div>

          <section className="mt-14">
            <h2 className="text-lg font-bold text-slate-950">{t("comparison.title")}</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-bold text-slate-700"
                    >
                      {t("comparison.feature")}
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-bold text-slate-700"
                      >
                        {plan.subscriptionName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparedFeatures.map((feature) => (
                    <tr key={feature} className="border-b border-slate-100 last:border-b-0">
                      <th
                        scope="row"
                        className="px-4 py-3 text-left text-xs font-medium text-slate-700"
                      >
                        {t(`features.${feature}`)}
                      </th>
                      {plans.map((plan) => (
                        <td key={plan.id} className="px-4 py-3 text-center text-xs">
                          {renderLimit(plan.id, feature)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Candidate SePay Checkout Modal */}
      <CandidateSepayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={checkoutInvoice}
        onSuccess={handleCandidatePaymentSuccess}
      />
    </div>
  );
}
