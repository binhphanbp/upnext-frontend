"use client";

import { CheckCircle, Copy, Info, QrCode, Spinner } from "@phosphor-icons/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { checkSepayPayment } from "@/features/admin/api/payment-config";
import {
  getActiveSubscription,
  getInvoice,
  getInvoices,
  getPublicSubscriptionPlans,
  getSubscriptionUsage,
  type CompanySubscriptionDetail,
  type InvoiceDetail,
  type QuotaSnapshot,
  type SubscriptionPlan,
} from "@/features/recruiter/api/billing";
import {
  getPublicSepayConfig,
  type PublicSepayConfig,
} from "@/features/recruiter/api/payment-config";
import { isUnlimitedRecruiterFeature } from "@/features/recruiter/api/plan-entitlements";
import { QUOTA_FEATURE_LABELS } from "@/features/recruiter/components/plan-feature-labels";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { RecruiterTableLayout } from "./recruiter-table-layout";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

type StoredRecruiterUser = Readonly<{
  id: string;
  email: string;
  role: string;
  companyId?: string;
}>;

function formatCurrency(amountStr: string | number) {
  const amount = typeof amountStr === "string" ? parseFloat(amountStr) : amountStr;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatOnlyDate(isoString: string | null) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
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

export function RecruiterBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<CompanySubscriptionDetail | null>(null);
  const [usage, setUsage] = useState<QuotaSnapshot[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [token, setToken] = useState("");

  // Invoices pagination state
  const [invoicePage, setInvoicePage] = useState(1);
  const invoicePageSize = 5;

  // Checkout modal states -- SePay is the only payment method now (see
  // sepay-config-form.tsx on the admin side); there is nothing left to pick,
  // so no paymentMethod state.
  const [checkoutInvoice, setCheckoutInvoice] = useState<InvoiceDetail | null>(null);
  const [sepayConfig, setSepayConfig] = useState<PublicSepayConfig | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  const invoice = checkoutInvoice;
  const invoiceAmountInt = invoice ? (invoice.amount.split(".")[0] ?? "") : "";
  // The bank content the recruiter must actually type/scan -- prefixed when
  // the configured bank account uses SePay's Virtual Account feature (e.g.
  // "TKPUPN"), so the transfer routes to the right sub-account and the
  // webhook's own prefix check (see sepay-webhook.service.ts) accepts it.
  const transferContent =
    invoice && sepayConfig?.contentPrefix
      ? `${sepayConfig.contentPrefix} ${invoice.invoiceCode}`
      : (invoice?.invoiceCode ?? "");

  const loadBillingData = useCallback(
    async (accessToken: string) => {
      try {
        setLoading(true);
        // Public listing: a recruiter must never call the admin-only
        // `/subscription-plans` endpoint, which 401s for non-admin roles and
        // was silently logging every recruiter straight back out of this page.
        const plansData = await getPublicSubscriptionPlans("RECRUITER");
        setPlans(plansData.filter((p) => p.status === "ACTIVE"));

        const invoicesData = await getInvoices(accessToken);
        setInvoices(invoicesData);

        try {
          const subData = await getActiveSubscription(accessToken);
          setActiveSub(subData);
        } catch {
          // If no active subscription is found (404), set activeSub to null
          setActiveSub(null);
        }

        try {
          const usageData = await getSubscriptionUsage(accessToken);
          setUsage(usageData);
        } catch {
          // No active subscription means there is no quota window to show.
          setUsage([]);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem("upnext.recruiter.accessToken");
          localStorage.removeItem("upnext.recruiter.tokenType");
          localStorage.removeItem("upnext.recruiter.user");
          router.replace("/recruiter/login");
        } else {
          void Swal.fire({
            icon: "error",
            title: "Lỗi tải dữ liệu",
            text: "Không thể lấy thông tin gói dịch vụ. Vui lòng thử lại sau.",
          });
        }
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
      // Parsed to validate the stored session before using the token.
      JSON.parse(rawUser) as StoredRecruiterUser;
      setToken(accessToken);
      void loadBillingData(accessToken);
    } catch {
      router.replace("/recruiter/login");
    }
  }, [loadBillingData, router]);

  // Arriving from the pricing page with ?invoice=<id>: open checkout for that
  // invoice once it has loaded, so choosing a plan flows straight into payment.
  useEffect(() => {
    if (typeof window === "undefined" || invoices.length === 0) return;

    const requestedId = new URLSearchParams(window.location.search).get("invoice");
    if (!requestedId) return;

    const target = invoices.find((item) => item.id === requestedId);
    if (target && target.paymentStatus !== "PAID") {
      setCheckoutInvoice(target);
    }

    // Drop the param so a refresh does not reopen the dialog.
    window.history.replaceState({}, "", window.location.pathname);
  }, [invoices]);

  // Bank info + VietQR image for the SePay tab are admin-configured now, not
  // hard-coded -- needs no auth, so this loads once independent of the
  // session check above.
  useEffect(() => {
    getPublicSepayConfig()
      .then(setSepayConfig)
      .catch(() => setSepayConfig(null));
  }, []);

  function handlePaymentConfirmed() {
    void Swal.fire({
      icon: "success",
      title: "Thanh toán thành công!",
      text: "Gói dịch vụ mới của bạn đã được kích hoạt thành công.",
      confirmButtonColor: "#10a778",
    });
    setCheckoutInvoice(null);
    void loadBillingData(token);
  }

  const handleManualCheckPayment = async () => {
    if (!checkoutInvoice) return;
    try {
      setIsCheckingPayment(true);
      const res = await checkSepayPayment(checkoutInvoice.id);
      if (res.paid) {
        handlePaymentConfirmed();
      } else {
        void Toast.fire({
          icon: "info",
          title: res.message || "Chưa thấy tiền vào tài khoản. Hệ thống vẫn đang tự động quét...",
        });
      }
    } catch {
      if (token) {
        try {
          const updated = await getInvoice(checkoutInvoice.id, token);
          if (updated.paymentStatus === "PAID") {
            handlePaymentConfirmed();
            return;
          }
        } catch {}
      }
      void Toast.fire({
        icon: "info",
        title: "Đang chờ ngân hàng xử lý. Vui lòng thử lại sau ít giây.",
      });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Actively poll SePay API via backend or fallback to getInvoice
  useEffect(() => {
    if (!checkoutInvoice || checkoutInvoice.paymentStatus !== "PENDING") return;

    const invoiceId = checkoutInvoice.id;
    const intervalId = window.setInterval(() => {
      checkSepayPayment(invoiceId)
        .then((res) => {
          if (res.paid) {
            handlePaymentConfirmed();
          }
        })
        .catch(() => {
          if (token) {
            getInvoice(invoiceId, token)
              .then((updated) => {
                if (updated.paymentStatus === "PAID") {
                  handlePaymentConfirmed();
                }
              })
              .catch(() => {});
          }
        });
    }, 4000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutInvoice, token]);

  // Copy to clipboard helper
  function handleCopyText(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    void Toast.fire({
      icon: "success",
      title: `Đã sao chép ${label}`,
    });
  }

  // Computed Invoice Paginated List
  const totalInvoices = invoices.length;
  const totalInvoicePages = Math.ceil(totalInvoices / invoicePageSize) || 1;
  const invoiceStartIndex = (invoicePage - 1) * invoicePageSize;
  const invoiceEndIndex = Math.min(invoiceStartIndex + invoicePageSize, totalInvoices);
  const paginatedInvoices = useMemo(() => {
    return invoices.slice(invoiceStartIndex, invoiceEndIndex);
  }, [invoices, invoiceStartIndex, invoiceEndIndex]);

  useEffect(() => {
    if (invoicePage > totalInvoicePages) {
      setInvoicePage(totalInvoicePages);
    }
  }, [totalInvoicePages, invoicePage]);

  const showInvoiceStart = totalInvoices === 0 ? 0 : invoiceStartIndex + 1;

  if (loading && plans.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-sm font-bold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8 animate-spin text-emerald-600" />
          <span>Đang tải thông tin thanh toán...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 [font-family:var(--font-sans)] [--ring:#10a778]">
      {/* Page Header */}
      <header>
        <p className="text-xs font-bold tracking-[0.16em] text-emerald-700 uppercase">
          Tài chính & Gói dịch vụ
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Thanh toán & Gói dịch vụ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Đăng tin tuyển dụng không giới hạn; quản lý các quyền lợi trả phí và theo dõi lịch sử giao
          dịch.
        </p>
      </header>

      {/* 1. GÓI DỊCH VỤ HIỆN TẠI (Current Subscription) */}
      <section aria-label="Gói dịch vụ hiện tại">
        <h2 className="text-lg font-bold text-slate-900">Gói dịch vụ hiện tại</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {activeSub ? (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {activeSub.plan.subscriptionName}
                    </h3>
                    <Badge tone="success">Đang hoạt động</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{activeSub.plan.description}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400">Thời hạn sử dụng</p>
                  <p className="text-sm font-bold text-slate-800">
                    Từ {formatOnlyDate(activeSub.startedAt)} đến{" "}
                    {formatOnlyDate(activeSub.expiredAt)}
                  </p>
                </div>
              </div>

              {usage.some((item) => item.enabled && !isUnlimitedRecruiterFeature(item.feature)) ? (
                <div className="mt-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-800">Hạn mức trong chu kỳ</h3>
                    {usage[0] ? (
                      <span className="text-xs font-semibold text-slate-400">
                        Đặt lại vào {formatOnlyDate(usage[0].periodEnd)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {usage
                      .filter((item) => item.enabled && !isUnlimitedRecruiterFeature(item.feature))
                      .map((item) => {
                        const percent =
                          item.limit === null || item.limit === 0
                            ? 0
                            : Math.min((item.used / item.limit) * 100, 100);
                        const exhausted = item.remaining === 0;

                        return (
                          <div
                            key={item.feature}
                            className="rounded-xl border border-slate-100 bg-slate-50/50 p-5"
                          >
                            <div className="flex justify-between gap-3 text-sm font-bold">
                              <span className="text-slate-700">
                                {QUOTA_FEATURE_LABELS[item.feature] ?? item.feature}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0",
                                  exhausted ? "text-rose-600" : "text-emerald-700",
                                )}
                              >
                                {item.limit === null
                                  ? "Không giới hạn"
                                  : `${item.used} / ${item.limit}`}
                              </span>
                            </div>
                            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  exhausted ? "bg-rose-500" : "bg-emerald-500",
                                )}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                              {item.limit === null
                                ? `Đã dùng ${item.used} lượt trong chu kỳ này.`
                                : exhausted
                                  ? "Đã dùng hết hạn mức. Nâng cấp gói để tiếp tục."
                                  : `Còn lại ${item.remaining} lượt.`}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
              <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Info size={28} weight="bold" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Chưa đăng ký gói tuyển dụng
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Doanh nghiệp vẫn có thể đăng tin không giới hạn sau khi được xác thực. Hãy đăng ký
                gói dịch vụ khi cần các quyền lợi trả phí như AI, Boost hoặc kho CV.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. LỊCH SỬ HÓA ĐƠN (Invoices Table) */}
      <section aria-label="Lịch sử hóa đơn">
        <h2 className="text-lg font-bold text-slate-900">Lịch sử hóa đơn</h2>
        <div className="mt-3">
          <RecruiterTableLayout loading={false}>
            <thead className="bg-slate-50/75 text-left text-xs font-bold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5" scope="col">
                  Mã hóa đơn
                </th>
                <th className="px-5 py-3.5" scope="col">
                  Gói dịch vụ
                </th>
                <th className="px-5 py-3.5 text-right" scope="col">
                  Số tiền
                </th>
                <th className="px-5 py-3.5" scope="col">
                  Phương thức
                </th>
                <th className="px-5 py-3.5" scope="col">
                  Trạng thái
                </th>
                <th className="px-5 py-3.5" scope="col">
                  Ngày tạo
                </th>
                <th className="px-5 py-3.5 text-center" scope="col">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-semibold text-slate-400">
                    Chưa có hóa đơn nào được tạo.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  const isPending = inv.paymentStatus === "PENDING";
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600">
                        {inv.invoiceCode}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {inv.subscriptionPlan?.subscriptionName}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-700">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-500 uppercase">
                        {inv.paymentMethod ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            inv.paymentStatus === "PAID"
                              ? "success"
                              : inv.paymentStatus === "PENDING"
                                ? "warning"
                                : "error"
                          }
                        >
                          {inv.paymentStatus === "PAID"
                            ? "Đã thanh toán"
                            : inv.paymentStatus === "PENDING"
                              ? "Chờ thanh toán"
                              : "Thất bại"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {formatDateTime(inv.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isPending ? (
                          <Button
                            className="h-8 bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                            onClick={() => setCheckoutInvoice(inv)}
                          >
                            Thanh toán
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </RecruiterTableLayout>

          {totalInvoices > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-white p-5">
              <div className="text-xs font-medium text-slate-500">
                Hiển thị {showInvoiceStart} - {invoiceEndIndex} trên tổng số {totalInvoices} hóa
                đơn.
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setInvoicePage((p) => Math.max(p - 1, 1))}
                  disabled={invoicePage === 1}
                >
                  <span className="sr-only">Trang trước</span>
                  <Spinner className="hidden" />
                  <span className="block font-bold">‹</span>
                </Button>

                {Array.from({ length: totalInvoicePages }, (_, i) => (
                  <Button
                    key={i}
                    variant={invoicePage === i + 1 ? "primary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setInvoicePage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setInvoicePage((p) => Math.min(p + 1, totalInvoicePages))}
                  disabled={invoicePage === totalInvoicePages}
                >
                  <span className="sr-only">Trang tiếp</span>
                  <span className="block font-bold">›</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. CHECKOUT MODAL (VietQR, Momo, Stripe) */}
      <DialogPrimitive.Root
        open={Boolean(invoice)}
        onOpenChange={(open) => {
          if (!open) setCheckoutInvoice(null);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" />

          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogPrimitive.Content
              aria-describedby="checkout-dialog-description"
              className="pointer-events-auto relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-2xl focus:outline-none"
            >
              {/* Modal Header */}
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
                <DialogPrimitive.Title className="text-lg font-black text-slate-900">
                  Thanh toán hóa đơn tuyển dụng
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  id="checkout-dialog-description"
                  className="mt-1 text-xs font-medium text-slate-500"
                >
                  Chuyển khoản đúng số tiền và nội dung bên dưới qua SePay -- gói dịch vụ sẽ được
                  kích hoạt tự động, không cần xác nhận thủ công.
                </DialogPrimitive.Description>
              </div>

              {/* Modal Body */}
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {invoice && (
                  <>
                    {/* Summary Box */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 font-semibold text-slate-700">
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <span>Mã hóa đơn:</span>
                        <span className="text-right font-mono text-slate-900">
                          {invoice.invoiceCode}
                        </span>
                        <span>Gói đăng ký:</span>
                        <span className="text-right text-slate-900">
                          {invoice.subscriptionPlan?.subscriptionName}
                        </span>
                        <span>Số tiền thanh toán:</span>
                        <span className="text-right text-lg font-black text-emerald-600">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Payment Details Container -- SePay only, no method picker */}
                    <div className="rounded-xl border border-slate-100 bg-white p-5">
                      {sepayConfig?.enabled &&
                      sepayConfig.bankBin &&
                      sepayConfig.accountNumber &&
                      sepayConfig.accountName ? (
                        <div className="flex flex-col gap-5 md:flex-row md:items-center">
                          <div className="flex flex-1 flex-col gap-2.5 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800">
                                Thông tin chuyển khoản
                              </h4>
                              {(sepayConfig.bankName?.toLowerCase().includes("sandbox") ||
                                sepayConfig.bankName?.toLowerCase().includes("test") ||
                                sepayConfig.accountName?.toLowerCase().includes("sandbox") ||
                                sepayConfig.accountName?.toLowerCase().includes("test")) && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  🧪 Sandbox / Test Mode
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-y-2">
                              <span>Ngân hàng:</span>
                              <span className="font-bold text-slate-800">
                                {sepayConfig.bankName ?? sepayConfig.bankBin}
                              </span>
                              <span>Chủ tài khoản:</span>
                              <span className="font-bold text-slate-800 uppercase">
                                {sepayConfig.accountName}
                              </span>
                              <span>Số tài khoản:</span>
                              <span className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                {sepayConfig.accountNumber}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(sepayConfig.accountNumber ?? "", "Số tài khoản")
                                  }
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                >
                                  <Copy size={10} /> Sao chép
                                </button>
                              </span>
                              <span>Số tiền:</span>
                              <span className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                {invoiceAmountInt}
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(invoiceAmountInt, "Số tiền")}
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                >
                                  <Copy size={10} /> Sao chép
                                </button>
                              </span>
                              <span>Nội dung CK:</span>
                              <span className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-800">
                                  {transferContent}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(transferContent, "Nội dung chuyển khoản")
                                  }
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                >
                                  <Copy size={10} /> Sao chép
                                </button>
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400 italic">
                              * Vui lòng chuyển khoản đúng số tiền và nội dung chuyển khoản để hệ
                              thống tự động quét và duyệt gói dịch vụ ngay lập tức.
                            </p>
                          </div>
                          {/* VietQR Dynamic Code */}
                          <div className="flex shrink-0 flex-col items-center justify-center">
                            <div className="relative rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm">
                              <Image
                                src={`https://img.vietqr.io/image/${sepayConfig.bankBin}-${sepayConfig.accountNumber}-compact.png?amount=${invoiceAmountInt}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(sepayConfig.accountName)}`}
                                alt="VietQR code"
                                width={144}
                                height={144}
                                unoptimized
                                className="size-36 object-contain"
                              />
                            </div>
                            <span className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              <QrCode size={12} /> Quét mã để trả nhanh
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-6 text-center text-xs text-slate-500">
                          <Info size={20} className="text-slate-400" />
                          <p>
                            Phương thức thanh toán SePay hiện tạm chưa khả dụng. Vui lòng liên hệ
                            đội ngũ UpNext để được hỗ trợ.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Spinner className="size-4 animate-spin text-emerald-600" />
                  <span>Đang tự động quét giao dịch SePay...</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="h-10 cursor-pointer border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    onClick={() => setCheckoutInvoice(null)}
                  >
                    Đóng
                  </Button>
                  <Button
                    type="button"
                    className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-70"
                    disabled={isCheckingPayment}
                    onClick={handleManualCheckPayment}
                  >
                    {isCheckingPayment ? (
                      <>
                        <Spinner className="size-4 animate-spin" />
                        Đang kiểm tra từ ngân hàng...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} weight="bold" />
                        Tôi đã chuyển khoản (Kiểm tra ngay)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
