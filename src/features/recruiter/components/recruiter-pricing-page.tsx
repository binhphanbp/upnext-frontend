"use client";

import {
  ArrowRight,
  CaretDown,
  CaretUp,
  Check,
  CheckCircle,
  Clock,
  Crown,
  Headset,
  Lightning,
  Minus,
  Question,
  Receipt,
  RocketLaunch,
  Sparkle,
  Spinner,
  Star,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  createInvoice,
  getActiveSubscription,
  getSubscriptionPlans,
  type CompanySubscriptionDetail,
  type SubscriptionFeature,
  type SubscriptionPlan,
} from "@/features/recruiter/api/billing";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import { QUOTA_FEATURE_LABELS, QUOTA_FEATURE_ORDER } from "./plan-feature-labels";

function formatCurrency(amountStr: string) {
  const amount = parseFloat(amountStr);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function limitLabel(limit: number | null) {
  return limit === null ? "Không giới hạn" : limit.toLocaleString("vi-VN");
}

function getPlanIcon(plan: SubscriptionPlan) {
  const price = parseFloat(plan.price);
  if (price === 0) return <RocketLaunch size={24} className="text-emerald-500" />;
  if (plan.highlightLabel || price > 2000000) return <Crown size={24} className="text-amber-500" />;
  return <Lightning size={24} className="text-teal-500" />;
}

const FAQS = [
  {
    q: "Hóa đơn VAT được xuất như thế nào?",
    a: "Hệ thống hỗ trợ xuất hóa đơn điện tử GTGT tự động. Sau khi hoàn tất thanh toán, bạn có thể điền thông tin xuất hóa đơn tại trang Billing và nhận file PDF qua email trong vòng 24h làm việc.",
  },
  {
    q: "Tôi có thể nâng cấp gói khi đang sử dụng gói khác không?",
    a: "Có. Bạn có thể đăng ký gói dịch vụ mới bất kỳ lúc nào. Hệ thống sẽ tự động kích hoạt gói mới và cộng dồn thời hạn hoặc cập nhật lại hạn mức tuyển dụng cho doanh nghiệp.",
  },
  {
    q: "Các tính năng AI hoạt động như thế nào?",
    a: "AI của Upnext hỗ trợ sinh mô tả công việc (JD) chuẩn SEO ngành IT và tự động chấm điểm match giữa CV ứng viên với các yêu cầu kỹ thuật trong JD, giúp tiết kiệm đến 80% thời gian sàng lọc.",
  },
  {
    q: "Các hình thức thanh toán nào được hỗ trợ?",
    a: "Chúng tôi hỗ trợ chuyển khoản ngân hàng nhanh tự động qua Mã QR (SePay) và thanh toán quốc tế qua PayPal/Thẻ ghi nợ.",
  },
];

export function RecruiterPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creatingPlanId, setCreatingPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<CompanySubscriptionDetail | null>(null);
  const [token, setToken] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const loadPlans = useCallback(
    async (accessToken: string) => {
      try {
        setLoading(true);
        const plansData = await getSubscriptionPlans();
        setPlans(plansData.filter((plan) => plan.status === "ACTIVE"));

        try {
          setActiveSub(await getActiveSubscription(accessToken));
        } catch {
          // 404 simply means the company has never subscribed.
          setActiveSub(null);
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          localStorage.removeItem("upnext.recruiter.accessToken");
          localStorage.removeItem("upnext.recruiter.user");
          router.replace("/recruiter/login");
          return;
        }
        void Swal.fire({
          icon: "error",
          title: "Lỗi tải bảng giá",
          text: "Không thể lấy danh sách gói dịch vụ. Vui lòng thử lại sau.",
        });
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
    const rawUser = localStorage.getItem("upnext.recruiter.user");

    if (!accessToken || !rawUser) {
      router.replace("/recruiter/login");
      return;
    }

    try {
      setToken(accessToken);
      void loadPlans(accessToken);
    } catch {
      router.replace("/recruiter/login");
    }
  }, [loadPlans, router]);

  async function handleSubscribe(planId: string) {
    try {
      setCreatingPlanId(planId);
      const invoice = await createInvoice(planId, token);
      router.push(`/recruiter/billing?invoice=${invoice.id}`);
    } catch (err) {
      void Swal.fire({
        icon: "error",
        title: "Không thể tạo hóa đơn",
        text: err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.",
      });
      setCreatingPlanId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-500">
        <Spinner className="size-8 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold">Đang tải thông tin bảng giá dịch vụ...</p>
      </div>
    );
  }

  const comparedFeatures = QUOTA_FEATURE_ORDER.filter((feature) =>
    plans.some((plan) => plan.features?.some((item) => item.feature === feature && item.enabled)),
  );

  const featureEntry = (plan: SubscriptionPlan, feature: SubscriptionFeature) =>
    plan.features?.find((item) => item.feature === feature);

  return (
    <div className="w-full min-w-0 space-y-12 pb-12">
      {/* Active Subscription Banner */}
      {activeSub && activeSub.status === "ACTIVE" ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 size-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                  <Check className="size-3" weight="bold" /> Đang hoạt động
                </span>
                <span className="text-xs text-slate-400">
                  Hạn sử dụng đến: {new Date(activeSub.expiredAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                Gói hiện tại: {activeSub.plan.subscriptionName}
              </h2>
              <p className="text-xs text-slate-300">
                Đã sử dụng {activeSub.jobPostUsed} / {activeSub.jobPostLimit} lượt tin đăng &bull;{" "}
                {activeSub.boostCreditUsed} / {activeSub.boostCreditTotal} điểm Boost
              </p>
            </div>
            <Button
              onClick={() => router.push("/recruiter/billing")}
              className="bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400"
            >
              Quản lý tài khoản & Quota <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white shadow-xl sm:px-12 sm:py-14">
        {/* Decorative Glow Elements */}
        <div className="pointer-events-none absolute -top-24 -left-20 size-96 rounded-full bg-emerald-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -right-20 -bottom-24 size-96 rounded-full bg-teal-500/20 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold tracking-wider text-emerald-400 uppercase ring-1 ring-emerald-500/30 backdrop-blur-md">
            <Sparkle className="size-3.5 text-emerald-400" weight="fill" /> DỊCH VỤ TUYỂN DỤNG CAO
            CẤP
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Bảng Giá Gói Dịch Vụ Tuyển Dụng
          </h1>
          <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
            Tối ưu chi phí, bứt phá tốc độ săn nhân tài IT với công nghệ AI sàng lọc thông minh và
            quyền truy cập kho dữ liệu CV hàng đầu.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-emerald-400" /> Kích hoạt trong 60 giây
            </div>
            <div className="flex items-center gap-1.5">
              <Receipt className="size-4 text-emerald-400" /> Xuất hóa đơn VAT tự động
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkle className="size-4 text-emerald-400" /> Công nghệ AI JD & CV Matcher
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Cards Grid */}
      <section aria-label="Danh sách gói dịch vụ">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = activeSub?.planId === plan.id;
            const isHighlighted = Boolean(plan.highlightLabel);
            const isFree = parseFloat(plan.price) === 0;

            return (
              <div
                key={plan.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl bg-white p-7 transition-all duration-300",
                  isHighlighted
                    ? "border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/10"
                    : "border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-xl",
                )}
              >
                {/* Popular / Highlight Badge */}
                {plan.highlightLabel ? (
                  <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1 text-[11px] font-black tracking-widest text-white uppercase shadow-md">
                    <Star size={12} weight="fill" className="text-amber-300" />
                    {plan.highlightLabel}
                  </div>
                ) : null}

                <div>
                  {/* Plan Icon Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 transition-transform group-hover:scale-110">
                      {getPlanIcon(plan)}
                    </div>
                    {isFree ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {plan.durationDays} ngày
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-xl font-extrabold text-slate-900">
                    {plan.subscriptionName}
                  </h2>
                  {plan.description ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {plan.description}
                    </p>
                  ) : null}

                  {/* Price */}
                  <div className="mt-6 flex items-baseline border-b border-slate-100 pb-6">
                    <span className="text-3xl font-black tracking-tight text-slate-950">
                      {isFree ? "0 ₫" : formatCurrency(plan.price)}
                    </span>
                    {!isFree && (
                      <span className="ml-1.5 text-xs font-semibold text-slate-400">
                        / {plan.durationDays} ngày
                      </span>
                    )}
                  </div>

                  {/* Features Highlight */}
                  <ul className="mt-6 space-y-3.5 text-xs">
                    {QUOTA_FEATURE_ORDER.filter((feature) => {
                      const entry = featureEntry(plan, feature);
                      return entry?.enabled && entry.limitValue !== 0;
                    }).map((feature) => {
                      const isAiFeature = feature.startsWith("AI_");
                      return (
                        <li key={feature} className="flex items-start gap-2.5">
                          {isAiFeature ? (
                            <Sparkle
                              size={16}
                              className="mt-0.5 shrink-0 text-amber-500"
                              weight="fill"
                            />
                          ) : (
                            <CheckCircle
                              size={16}
                              className="mt-0.5 shrink-0 text-emerald-500"
                              weight="fill"
                            />
                          )}
                          <span className="leading-snug text-slate-600">
                            {QUOTA_FEATURE_LABELS[feature]}:{" "}
                            <strong className="font-bold text-slate-900">
                              {limitLabel(featureEntry(plan, feature)?.limitValue ?? null)}
                            </strong>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* CTA Action */}
                <div className="mt-8 pt-4">
                  {isCurrent ? (
                    <Button
                      className="w-full cursor-not-allowed border border-emerald-200 bg-emerald-50 font-bold text-emerald-700 hover:bg-emerald-50"
                      disabled
                    >
                      <CheckCircle className="mr-1.5 size-4 text-emerald-600" weight="fill" />
                      Gói hiện tại của bạn
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full h-11 text-sm font-bold rounded-xl transition-all shadow-md",
                        isHighlighted
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25"
                          : "bg-slate-950 text-white hover:bg-slate-800",
                      )}
                      disabled={creatingPlanId !== null}
                      onClick={() => void handleSubscribe(plan.id)}
                    >
                      {creatingPlanId === plan.id ? (
                        <>
                          <Spinner className="mr-2 size-4 animate-spin" />
                          Đang khởi tạo...
                        </>
                      ) : isFree ? (
                        "Trải nghiệm ngay"
                      ) : (
                        "Đăng ký gói ngay"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      {comparedFeatures.length > 0 && (
        <section aria-label="So sánh chi tiết các gói" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">So sánh chi tiết tính năng</h2>
              <p className="text-xs text-slate-500">
                Đối chiếu các hạn mức đăng tin, quyền truy cập kho CV và công nghệ AI giữa các gói.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-800 uppercase"
                  >
                    Tính năng & Hạn mức
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className="px-6 py-4 text-center text-xs font-extrabold text-slate-900"
                    >
                      <div>{plan.subscriptionName}</div>
                      <div className="text-[11px] font-normal text-slate-500">
                        {parseFloat(plan.price) === 0 ? "Miễn phí" : formatCurrency(plan.price)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparedFeatures.map((feature) => (
                  <tr key={feature} className="transition-colors hover:bg-slate-50/50">
                    <th
                      scope="row"
                      className="flex items-center gap-2 px-6 py-4 text-left text-xs font-semibold text-slate-800"
                    >
                      {feature.startsWith("AI_") ? (
                        <Sparkle className="size-4 text-amber-500" weight="fill" />
                      ) : (
                        <CheckCircle className="size-4 text-emerald-500" weight="fill" />
                      )}
                      {QUOTA_FEATURE_LABELS[feature]}
                    </th>
                    {plans.map((plan) => {
                      const entry = featureEntry(plan, feature);
                      return (
                        <td key={plan.id} className="px-6 py-4 text-center text-xs">
                          {entry?.enabled ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800">
                              {limitLabel(entry.limitValue)}
                            </span>
                          ) : (
                            <Minus
                              size={16}
                              className="inline text-slate-300"
                              aria-label="Không hỗ trợ"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Trust & Value Guarantees */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Clock size={22} weight="bold" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Kích hoạt tự động 24/7</h3>
          <p className="text-xs leading-relaxed text-slate-500">
            Hệ thống quét chuyển khoản và cấp hạn mức dịch vụ ngay trong 60 giây.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Receipt size={22} weight="bold" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Xuất hóa đơn GTGT đầy đủ</h3>
          <p className="text-xs leading-relaxed text-slate-500">
            Cung cấp hóa đơn điện tử hợp lệ theo quy định cho tài chính doanh nghiệp.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Sparkle size={22} weight="bold" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Công nghệ AI đột phá</h3>
          <p className="text-xs leading-relaxed text-slate-500">
            Tự động gợi ý và chấm điểm matching CV chuẩn kỹ năng công nghệ.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Headset size={22} weight="bold" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Chuyên viên hỗ trợ 1-1</h3>
          <p className="text-xs leading-relaxed text-slate-500">
            Đội ngũ tư vấn đồng hành tối ưu hóa chiến dịch tuyển dụng cho doanh nghiệp.
          </p>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-6">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-extrabold text-slate-900">Câu hỏi thường gặp</h2>
          <p className="text-xs text-slate-500">
            Giải đáp các thắc mắc về quy trình đăng ký, kích hoạt và hóa đơn dịch vụ.
          </p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.q} className="p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between text-left text-sm font-bold text-slate-900"
                >
                  <span className="flex items-center gap-2">
                    <Question size={18} className="shrink-0 text-emerald-600" />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <CaretUp size={16} className="shrink-0 text-slate-400" />
                  ) : (
                    <CaretDown size={16} className="shrink-0 text-slate-400" />
                  )}
                </button>
                {isOpen ? (
                  <p className="mt-3 pl-6 text-xs leading-relaxed text-slate-600">{faq.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Enterprise Contact CTA Banner */}
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="max-w-xl space-y-1">
          <h3 className="text-lg font-extrabold text-white">
            Doanh nghiệp của bạn cần giải pháp tuyển dụng Enterprise quy mô lớn?
          </h3>
          <p className="text-xs text-slate-300">
            Liên hệ với đội ngũ chuyên gia của Upnext để xây dựng gói giải pháp tùy chỉnh hạn mức và
            tính năng dành riêng cho tập đoàn.
          </p>
        </div>
        <Button
          onClick={() =>
            Swal.fire({
              icon: "info",
              title: "Tư vấn Enterprise",
              text: "Vui lòng gọi hotline 1900 xxxx hoặc email support@upnext.dev để nhận báo giá tư vấn riêng.",
            })
          }
          className="bg-white font-bold text-slate-950 hover:bg-slate-100"
        >
          Liên hệ tư vấn Enterprise <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </section>
    </div>
  );
}
