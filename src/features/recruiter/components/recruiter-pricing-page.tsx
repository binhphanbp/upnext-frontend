"use client";

import { CheckCircle, Minus, Spinner } from "@phosphor-icons/react";
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

export function RecruiterPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creatingPlanId, setCreatingPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<CompanySubscriptionDetail | null>(null);
  const [token, setToken] = useState("");

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
      // Presence of the stored session is enough; the backend owns company checks.
      void loadPlans(accessToken);
    } catch {
      router.replace("/recruiter/login");
    }
  }, [loadPlans, router]);

  /**
   * Creates the invoice here, then hands off to the billing page to settle it.
   * Payment lives in one place so there is a single checkout implementation.
   */
  async function handleSubscribe(planId: string) {
    // No client-side company check: the stored session does not carry companyId,
    // and the backend already resolves it from the JWT and returns a precise
    // error when the recruiter has no company.
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
      <div className="flex h-80 items-center justify-center gap-2 text-sm font-bold text-slate-500">
        <Spinner className="size-5 animate-spin text-emerald-600" />
        Đang tải bảng giá...
      </div>
    );
  }

  const comparedFeatures = QUOTA_FEATURE_ORDER.filter((feature) =>
    plans.some((plan) => plan.features?.some((item) => item.feature === feature && item.enabled)),
  );

  const featureEntry = (plan: SubscriptionPlan, feature: SubscriptionFeature) =>
    plan.features?.find((item) => item.feature === feature);

  return (
    <div className="w-full min-w-0 space-y-10">
      <header>
        <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
          Gói dịch vụ
        </span>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Bảng giá gói tuyển dụng</h1>
        <p className="mt-1 text-sm text-slate-500">
          Chọn gói phù hợp để mở khóa hạn mức đăng tin, kho CV và các tính năng AI.
        </p>
      </header>

      <section aria-label="Danh sách gói dịch vụ">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = activeSub?.planId === plan.id;
            const isHighlighted = Boolean(plan.highlightLabel);
            const isFree = parseFloat(plan.price) === 0;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md",
                  isHighlighted
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-100",
                )}
              >
                {plan.highlightLabel ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-[10px] font-black tracking-wider text-white uppercase">
                    {plan.highlightLabel}
                  </span>
                ) : null}

                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {plan.subscriptionName}
                  </h2>
                  {plan.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {plan.description}
                    </p>
                  ) : null}

                  <div className="mt-5 flex items-baseline">
                    <span className="text-3xl font-black tracking-tight text-slate-900">
                      {isFree ? "Miễn phí" : formatCurrency(plan.price)}
                    </span>
                    {!isFree && (
                      <span className="ml-1.5 text-sm font-semibold text-slate-400">
                        / {plan.durationDays} ngày
                      </span>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3 text-xs font-semibold text-slate-600">
                    {QUOTA_FEATURE_ORDER.filter((feature) => {
                      const entry = featureEntry(plan, feature);
                      return entry?.enabled && entry.limitValue !== 0;
                    })
                      .slice(0, 5)
                      .map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <CheckCircle
                            size={16}
                            className="shrink-0 text-emerald-500"
                            weight="fill"
                          />
                          <span>
                            {QUOTA_FEATURE_LABELS[feature]}:{" "}
                            <strong className="font-bold text-slate-800">
                              {limitLabel(featureEntry(plan, feature)?.limitValue ?? null)}
                            </strong>
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <Button
                      className="w-full cursor-not-allowed bg-slate-100 text-slate-500 hover:bg-slate-100"
                      disabled
                    >
                      Gói hiện tại của bạn
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full font-bold",
                        isHighlighted
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-900 text-white hover:bg-slate-800",
                      )}
                      disabled={creatingPlanId !== null}
                      onClick={() => void handleSubscribe(plan.id)}
                    >
                      {creatingPlanId === plan.id ? (
                        <>
                          <Spinner className="mr-1.5 size-4 animate-spin" />
                          Đang tạo hóa đơn...
                        </>
                      ) : isFree ? (
                        "Thử nghiệm ngay"
                      ) : (
                        "Đăng ký gói"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {comparedFeatures.length > 0 && (
        <section aria-label="So sánh chi tiết các gói">
          <h2 className="text-lg font-bold text-slate-900">So sánh chi tiết</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-700">
                    Tính năng
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
                      {QUOTA_FEATURE_LABELS[feature]}
                    </th>
                    {plans.map((plan) => {
                      const entry = featureEntry(plan, feature);
                      return (
                        <td key={plan.id} className="px-4 py-3 text-center text-xs">
                          {entry?.enabled ? (
                            <span className="font-semibold text-slate-900">
                              {limitLabel(entry.limitValue)}
                            </span>
                          ) : (
                            <Minus
                              size={14}
                              className="inline text-slate-300"
                              aria-label="Không có"
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
    </div>
  );
}
