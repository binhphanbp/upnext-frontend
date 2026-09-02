"use client";

import {
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Lightning,
  QrCode,
  Receipt,
  Sparkle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  getCandidateSubscription,
  type CandidateSubscriptionSummary,
} from "@/features/ai-copilot/api/candidate-subscription-api";
import {
  cancelCandidateInvoice,
  createCandidateInvoice,
  getCandidateInvoices,
  type CandidateInvoice,
} from "@/features/candidate/api/candidate-billing-api";
import { CandidatePageHeader } from "@/features/candidate/candidate-page-header";
import { CandidateSepayModal } from "@/features/candidate/components/candidate-sepay-modal";
import { getCandidateSession } from "@/features/candidate/session";
import {
  getPublicSubscriptionPlans,
  type SubscriptionPlan,
} from "@/features/recruiter/api/billing";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

function formatCurrency(amountStr: string | number) {
  const amount = typeof amountStr === "string" ? parseFloat(amountStr) : amountStr;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDateTime(isoString: string | null) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
}

function formatOnlyDate(isoString: string | null) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function CandidateBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<CandidateSubscriptionSummary | null>(null);
  const [invoices, setInvoices] = useState<CandidateInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<CandidateInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const loadData = useCallback(async () => {
    const session = getCandidateSession();
    if (!session) {
      router.replace("/auth?returnUrl=/candidate/billing");
      return;
    }

    try {
      setLoading(true);
      const [subData, invData, plansData] = await Promise.all([
        getCandidateSubscription().catch(() => null),
        getCandidateInvoices(session.accessToken).catch(() => []),
        getPublicSubscriptionPlans("CANDIDATE").catch(() => []),
      ]);
      setSubscription(subData);
      setInvoices(invData);

      const sortedPlans = [...plansData].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return Number(a.price) - Number(b.price);
      });
      setPlans(sortedPlans);
    } catch {
      void Swal.fire({
        icon: "error",
        title: "Lỗi tải dữ liệu",
        text: "Không thể lấy thông tin gói cước và hóa đơn.",
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle direct plan purchase right on this page
  const handleBuyPlan = async (plan: SubscriptionPlan) => {
    const session = getCandidateSession();
    if (!session) {
      router.replace("/auth?returnUrl=/candidate/billing");
      return;
    }

    try {
      setIsPurchasing(true);
      const newInvoice = await createCandidateInvoice(plan.id, session.accessToken);
      setSelectedInvoice(newInvoice);
      setIsModalOpen(true);
    } catch {
      void Swal.fire({
        icon: "error",
        title: "Không thể tạo hóa đơn",
        text: "Đã xảy ra lỗi khi tạo yêu cầu thanh toán. Vui lòng thử lại sau.",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePayInvoice = (inv: CandidateInvoice) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  const handleCancelInvoice = async (inv: CandidateInvoice) => {
    const session = getCandidateSession();
    if (!session) return;

    const result = await Swal.fire({
      title: "Hủy hóa đơn?",
      text: `Bạn có chắc chắn muốn hủy hóa đơn ${inv.invoiceCode} không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#da251d",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Đồng ý hủy",
      cancelButtonText: "Đóng",
    });

    if (result.isConfirmed) {
      try {
        await cancelCandidateInvoice(inv.id, session.accessToken);
        void Swal.fire({
          icon: "success",
          title: "Đã hủy hóa đơn",
          text: `Hóa đơn ${inv.invoiceCode} đã được hủy thành công.`,
          timer: 2000,
          showConfirmButton: false,
        });
        void loadData();
      } catch {
        void Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể hủy hóa đơn. Vui lòng thử lại sau.",
        });
      }
    }
  };

  const handlePaymentSuccess = () => {
    void loadData();
  };

  const aiQuota = subscription?.usage?.find((u) => u.feature === "AI_COPILOT_RUN");
  const isPro = subscription?.plan?.code === "CANDIDATE_PRO";
  const used = aiQuota?.used ?? 0;
  const limit = aiQuota?.limit ?? (isPro ? 100 : 10);
  const quotaPercent = Math.min(100, Math.round((used / (limit || 1)) * 100));

  const proPlan = plans.find((p) => Number(p.price) > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <CandidatePageHeader
        title="Gói dịch vụ & Hóa đơn"
        description="Theo dõi quyền lợi gói hội viên ứng viên, hạn mức sử dụng AI Copilot và lịch sử hóa đơn thanh toán."
        breadcrumbItems={[
          { label: "Trang chủ", href: "/" },
          { label: "Ứng viên", href: "/candidate/profile" },
          { label: "Gói dịch vụ & Hóa đơn" },
        ]}
      />

      {loading ? (
        <div className="mt-8 flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-xs font-medium text-slate-500">Đang tải thông tin gói cước...</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* 1. SUBSCRIPTION SUMMARY & QUOTA */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Plan Info Card */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/5 p-6 shadow-sm md:col-span-2">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                      <CreditCard size={18} weight="bold" />
                    </span>
                    <h2 className="text-xl font-bold text-slate-950">
                      {subscription?.plan?.name ||
                        (isPro ? "Candidate Pro" : "Candidate Free (Mặc định)")}
                    </h2>
                    <Badge className="border-emerald-200 bg-emerald-100 text-[11px] font-semibold text-emerald-800">
                      Đang hoạt động
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {isPro
                      ? "Gói hội viên Pro giúp bạn tăng gấp 10 lần hạn mức AI Copilot, tối ưu CV và ưu tiên giới thiệu việc làm."
                      : "Gói ứng viên miễn phí mặc định hỗ trợ tạo CV chuẩn ATS và trải nghiệm AI Copilot cơ bản."}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-2xl font-extrabold text-slate-950">
                    {isPro ? "99.000đ" : "0đ"}
                  </span>
                  <p className="text-[11px] font-medium text-slate-500">
                    {isPro ? "chu kỳ 30 ngày" : "miễn phí vĩnh viễn"}
                  </p>
                </div>
              </div>

              {/* Expiry & renewal details */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="text-slate-400" />
                  <span>
                    Ngày hết hạn:{" "}
                    <strong className="font-semibold text-slate-900">
                      {isPro
                        ? formatOnlyDate(subscription?.plan?.expiresAt ?? null)
                        : "Không giới hạn"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={15} className="text-emerald-600" />
                  <span>
                    Tạo CV chuẩn ATS:{" "}
                    <strong className="font-semibold text-emerald-700">Không giới hạn</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* AI Copilot Quota Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Hạn mức AI Copilot
                  </span>
                  <Lightning size={18} weight="fill" className="text-amber-500" />
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900">{used}</span>
                  <span className="text-sm font-semibold text-slate-500">/ {limit} lượt</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Còn lại:{" "}
                  <strong className="font-bold text-emerald-600">
                    {Math.max(0, limit - used)}
                  </strong>{" "}
                  lượt trong chu kỳ
                </p>

                {/* Progress bar */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                {proPlan ? (
                  <Button
                    type="button"
                    onClick={() => void handleBuyPlan(proPlan)}
                    disabled={isPurchasing}
                    className="w-full cursor-pointer rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Sparkle size={14} weight="fill" className="mr-1 text-amber-300" />
                    {isPro ? "Gia hạn thêm 30 ngày" : "Nâng cấp lên Pro (99.000đ)"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* 2. CHỌN GÓI DỊCH VỤ ĐỂ MUA NGAY (Direct Plan Selection & Checkout) */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Gói dịch vụ ứng viên</h3>
              <p className="text-xs text-slate-500">
                Lựa chọn gói phù hợp để nâng cấp tài khoản và kích hoạt thanh toán VietQR tự động
                ngay tại đây.
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {plans.map((plan) => {
                const planIsPro = Number(plan.price) > 0;
                const isCurrentActive = planIsPro ? isPro : !isPro;

                const aiRuns =
                  plan.features.find((f) => f.feature === "ai_copilot_run")?.limitValue ??
                  (planIsPro ? 100 : 10);

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200",
                      isCurrentActive
                        ? "border-2 border-emerald-500 bg-white ring-4 ring-emerald-500/10 shadow-md"
                        : planIsPro
                          ? "border-emerald-300 bg-white shadow-sm hover:shadow-md"
                          : "border-slate-200 bg-slate-50/50 shadow-sm",
                    )}
                  >
                    {isCurrentActive ? (
                      <div className="absolute -top-3 right-5 flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                        <CheckCircle size={12} weight="fill" className="text-white" />
                        Gói đang sử dụng
                      </div>
                    ) : planIsPro ? (
                      <div className="absolute -top-3 right-5 flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                        <Sparkle size={12} weight="fill" className="text-amber-300" />
                        Khuyên dùng
                      </div>
                    ) : null}

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-slate-900">
                          {plan.subscriptionName}
                        </h4>
                        {isCurrentActive ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            Hiện tại
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 min-h-[32px] text-xs leading-relaxed text-slate-500">
                        {plan.description ||
                          (planIsPro
                            ? "Gói nâng cao giúp tối ưu hồ sơ, tăng lượt AI Copilot và tỉ lệ phỏng vấn."
                            : "Gói mặc định miễn phí khi tạo tài khoản ứng viên.")}
                      </p>

                      <div className="mt-4 flex items-baseline gap-1.5 border-t border-slate-100 pt-4">
                        <span className="text-2xl font-extrabold text-slate-950">
                          {planIsPro ? formatCurrency(plan.price) : "0 ₫"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {planIsPro ? "/ 30 ngày" : "vĩnh viễn"}
                        </span>
                      </div>

                      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-700">
                        <li className="flex items-start gap-2">
                          <Check
                            size={15}
                            weight="bold"
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />
                          <span>
                            Tạo CV chuẩn ATS:{" "}
                            <strong className="font-bold text-slate-900">Không giới hạn</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check
                            size={15}
                            weight="bold"
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />
                          <span>
                            Trợ lý AI Copilot:{" "}
                            <strong className="font-bold text-emerald-700">
                              {aiRuns} lượt / tháng
                            </strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check
                            size={15}
                            weight="bold"
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />
                          <span>
                            Phân tích & gợi ý việc làm với AI:{" "}
                            <strong className="font-bold text-slate-900">
                              {planIsPro ? "Ưu tiên độ khớp cao" : "Tiêu chuẩn"}
                            </strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check
                            size={15}
                            weight="bold"
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />
                          <span>
                            Hỗ trợ kỹ thuật:{" "}
                            <strong className="font-bold text-slate-900">
                              {planIsPro ? "Hỗ trợ ưu tiên 24/7" : "Cộng đồng"}
                            </strong>
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4">
                      {!planIsPro ? (
                        <Button
                          type="button"
                          disabled
                          className={cn(
                            "h-10 w-full cursor-not-allowed rounded-xl text-xs font-bold shadow-none",
                            isCurrentActive
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                              : "border border-slate-200 bg-slate-100 text-slate-400",
                          )}
                        >
                          {isCurrentActive ? (
                            <>
                              <CheckCircle
                                size={15}
                                weight="fill"
                                className="mr-1.5 text-emerald-600"
                              />
                              Gói đang sử dụng
                            </>
                          ) : (
                            "Gói cơ bản mặc định"
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => void handleBuyPlan(plan)}
                          disabled={isPurchasing}
                          className="h-10 w-full cursor-pointer rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
                        >
                          {isPurchasing ? (
                            "Đang khởi tạo hóa đơn..."
                          ) : isCurrentActive ? (
                            <>
                              <CheckCircle
                                size={15}
                                weight="fill"
                                className="mr-1.5 text-emerald-300"
                              />
                              Đang sử dụng (Gia hạn thêm 30 ngày)
                            </>
                          ) : (
                            <>
                              <Sparkle size={14} weight="fill" className="mr-1.5 text-amber-300" />
                              Nâng cấp ngay qua VietQR (99.000đ)
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. INVOICES HISTORY TABLE */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Lịch sử hóa đơn</h3>
                <p className="text-xs text-slate-500">
                  Danh sách toàn bộ hóa đơn thanh toán gói dịch vụ của bạn trên UpNext.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Tổng số: <strong className="text-slate-900">{invoices.length}</strong> hóa đơn
              </span>
            </div>

            {invoices.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                <Receipt size={36} className="text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có hóa đơn nào</p>
                <p className="mt-1 text-xs text-slate-500">
                  Khi bạn nâng cấp gói Candidate Pro, thông tin hóa đơn và trạng thái thanh toán sẽ
                  hiển thị tại đây.
                </p>
                {proPlan ? (
                  <Button
                    type="button"
                    onClick={() => void handleBuyPlan(proPlan)}
                    className="mt-5 h-9 cursor-pointer rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Nâng cấp gói Pro ngay
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3.5 font-bold text-slate-700">Mã hóa đơn</th>
                      <th className="px-4 py-3.5 font-bold text-slate-700">Gói dịch vụ</th>
                      <th className="px-4 py-3.5 font-bold text-slate-700">Số tiền</th>
                      <th className="px-4 py-3.5 font-bold text-slate-700">Thời gian tạo</th>
                      <th className="px-4 py-3.5 font-bold text-slate-700">Trạng thái</th>
                      <th className="px-4 py-3.5 text-right font-bold text-slate-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => {
                      const isPending = inv.paymentStatus === "PENDING";
                      const isPaid = inv.paymentStatus === "PAID";

                      return (
                        <tr key={inv.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            {inv.invoiceCode}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">
                            {inv.subscriptionPlan?.subscriptionName || "Candidate Pro"}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-950">
                            {formatCurrency(inv.amount)}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {formatDateTime(inv.createdAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            {isPaid ? (
                              <Badge className="border-emerald-200 bg-emerald-100 font-semibold text-emerald-800">
                                Đã thanh toán
                              </Badge>
                            ) : isPending ? (
                              <Badge className="border-amber-200 bg-amber-100 font-semibold text-amber-800">
                                Chờ thanh toán
                              </Badge>
                            ) : inv.paymentStatus === "FAILED" ? (
                              <Badge className="border-slate-200 bg-slate-100 font-semibold text-slate-500">
                                Đã hủy
                              </Badge>
                            ) : (
                              <Badge className="border-slate-200 bg-slate-100 font-semibold text-slate-600">
                                {inv.paymentStatus}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handlePayInvoice(inv)}
                                  className="h-8 cursor-pointer rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                                >
                                  <QrCode size={14} className="mr-1" />
                                  Thanh toán ngay
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void handleCancelInvoice(inv)}
                                  className="h-8 cursor-pointer rounded-lg border-slate-200 px-2.5 text-[11px] font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  Hủy
                                </Button>
                              </div>
                            ) : isPaid ? (
                              <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-700">
                                <CheckCircle size={14} weight="fill" />
                                Hoàn tất
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Candidate SePay Modal for paying pending or newly created invoices */}
      <CandidateSepayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={selectedInvoice}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
