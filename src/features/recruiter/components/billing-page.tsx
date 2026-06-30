"use client";

import {
  Bank,
  CheckCircle,
  Copy,
  CreditCard,
  Info,
  QrCode,
  Spinner,
  Wallet,
} from "@phosphor-icons/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  createInvoice,
  getActiveSubscription,
  getInvoices,
  getSubscriptionPlans,
  payInvoice,
  type CompanySubscriptionDetail,
  type InvoiceDetail,
  type SubscriptionPlan,
} from "@/features/recruiter/api/billing";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
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
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<StoredRecruiterUser | null>(null);

  // Invoices pagination state
  const [invoicePage, setInvoicePage] = useState(1);
  const invoicePageSize = 5;

  // Checkout modal states
  const [checkoutInvoice, setCheckoutInvoice] = useState<InvoiceDetail | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"SEPAY" | "MOMO" | "STRIPE">("SEPAY");
  const [paying, setPaying] = useState(false);

  // Stripe card input mock states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const invoice = checkoutInvoice;
  const invoiceAmountInt = invoice ? (invoice.amount.split(".")[0] ?? "") : "";

  const loadBillingData = useCallback(
    async (accessToken: string) => {
      try {
        setLoading(true);
        const plansData = await getSubscriptionPlans();
        setPlans(plansData.filter((p) => p.status === "active"));

        const invoicesData = await getInvoices(accessToken);
        setInvoices(invoicesData);

        try {
          const subData = await getActiveSubscription(accessToken);
          setActiveSub(subData);
        } catch {
          // If no active subscription is found (404), set activeSub to null
          setActiveSub(null);
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
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
      const parsedUser = JSON.parse(rawUser) as StoredRecruiterUser;
      setToken(accessToken);
      setUser(parsedUser);
      void loadBillingData(accessToken);
    } catch {
      router.replace("/recruiter/login");
    }
  }, [loadBillingData, router]);

  // Handle plan purchase (Create Invoice)
  async function handleSubscribe(planId: string) {
    if (!user?.companyId) {
      void Swal.fire({
        icon: "warning",
        title: "Yêu cầu tài khoản công ty",
        text: "Tài khoản tuyển dụng của bạn cần liên kết với công ty để đăng ký gói dịch vụ.",
      });
      return;
    }

    try {
      setLoading(true);
      const invoice = await createInvoice(planId, token);
      setInvoices((prev) => [invoice, ...prev]);
      setCheckoutInvoice(invoice);
      setPaymentMethod("SEPAY");
    } catch (err) {
      void Swal.fire({
        icon: "error",
        title: "Không thể tạo hóa đơn",
        text: err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle simulated payment (Confirm Payment)
  async function handleConfirmPayment() {
    if (!checkoutInvoice) return;

    try {
      setPaying(true);

      if (paymentMethod === "STRIPE") {
        if (!cardNumber || !cardExpiry || !cardCvc) {
          void Toast.fire({
            icon: "warning",
            title: "Vui lòng nhập đầy đủ thông tin thẻ Stripe.",
          });
          setPaying(false);
          return;
        }
      }

      await payInvoice(checkoutInvoice.id, paymentMethod, token);

      void Swal.fire({
        icon: "success",
        title: "Thanh toán thành công!",
        text: "Gói dịch vụ mới của bạn đã được kích hoạt thành công.",
        confirmButtonColor: "#10a778",
      });

      setCheckoutInvoice(null);
      // Clear Stripe inputs
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");

      // Reload updated billing status
      void loadBillingData(token);
    } catch (err) {
      void Swal.fire({
        icon: "error",
        title: "Thanh toán thất bại",
        text: err instanceof Error ? err.message : "Có lỗi xảy ra khi xác nhận giao dịch.",
      });
    } finally {
      setPaying(false);
    }
  }

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
          Quản lý gói tuyển dụng hiện tại, nâng cấp dịch vụ và theo dõi lịch sử giao dịch.
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

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {/* Quota 1: Job Posts */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-700">Tin tuyển dụng đã đăng</span>
                    <span className="text-emerald-700">
                      {activeSub.jobPostUsed} / {activeSub.jobPostLimit} tin
                    </span>
                  </div>
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${Math.min((activeSub.jobPostUsed / activeSub.jobPostLimit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Hạn mức đăng tin tối đa theo gói hiện tại.
                  </p>
                </div>

                {/* Quota 2: Boost Credits */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-700">Lượt đẩy tin (Boost Credits)</span>
                    <span className="text-blue-700">
                      {activeSub.boostCreditTotal - activeSub.boostCreditUsed} /{" "}
                      {activeSub.boostCreditTotal} lượt còn lại
                    </span>
                  </div>
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${
                          activeSub.boostCreditTotal > 0
                            ? Math.min(
                                ((activeSub.boostCreditTotal - activeSub.boostCreditUsed) /
                                  activeSub.boostCreditTotal) *
                                  100,
                                100,
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Tăng cường hiển thị tin tuyển dụng tới ứng viên mục tiêu.
                  </p>
                </div>
              </div>
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
                Doanh nghiệp của bạn chưa đăng ký gói dịch vụ nào hoặc gói cũ đã hết hạn. Vui lòng
                đăng ký một trong các gói bên dưới để bắt đầu đăng tin tuyển dụng.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 2. BẢNG GIÁ & NÂNG CẤP GÓI (Pricing Plans Grid) */}
      <section aria-label="Bảng giá các gói tuyển dụng">
        <h2 className="text-lg font-bold text-slate-900">Bảng giá gói tuyển dụng</h2>
        <p className="mt-1 text-sm text-slate-500">
          Nâng cấp gói dịch vụ để mở khóa thêm quyền lợi đăng tin và các lượt đẩy tin nổi bật.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = activeSub?.planId === plan.id;
            const isStandard = plan.subscriptionName.includes("Standard");
            const isPremium = plan.subscriptionName.includes("Premium");

            return (
              <div
                key={plan.id}
                className={[
                  "relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md",
                  isStandard
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 md:-translate-y-2 md:scale-102"
                    : "border-slate-100",
                ].join(" ")}
              >
                {isStandard && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-[10px] font-black tracking-wider text-white uppercase">
                    Phổ biến nhất
                  </span>
                )}

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {plan.subscriptionName}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{plan.description}</p>

                  <div className="mt-5 flex items-baseline">
                    <span className="text-3xl font-black tracking-tight text-slate-900">
                      {parseFloat(plan.price) === 0 ? "Miễn phí" : formatCurrency(plan.price)}
                    </span>
                    {parseFloat(plan.price) > 0 && (
                      <span className="ml-1.5 text-sm font-semibold text-slate-400">
                        / {plan.durationDays} ngày
                      </span>
                    )}
                  </div>

                  {/* Feature Lists */}
                  <ul className="mt-6 space-y-3.5 text-xs font-semibold text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="shrink-0 text-emerald-500" weight="fill" />
                      <span>Thời gian: {plan.durationDays} ngày</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="shrink-0 text-emerald-500" weight="fill" />
                      <span>Đăng tối đa {plan.jobPostLimit} tin tuyển dụng</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="shrink-0 text-emerald-500" weight="fill" />
                      <span>Tặng {plan.boostCreditLimit} lượt đẩy tin (Boost)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="shrink-0 text-emerald-500" weight="fill" />
                      <span>
                        Hỗ trợ doanh nghiệp{" "}
                        {isPremium ? "24/7 chuyên nghiệp" : "trong giờ hành chính"}
                      </span>
                    </li>
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
                      className={[
                        "w-full font-bold",
                        isStandard
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-900 text-white hover:bg-slate-800",
                      ].join(" ")}
                      onClick={() => void handleSubscribe(plan.id)}
                    >
                      {parseFloat(plan.price) === 0 ? "Thử nghiệm ngay" : "Đăng ký gói"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
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
                  const isPending = inv.paymentStatus === "pending";
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
                            inv.paymentStatus === "paid"
                              ? "success"
                              : inv.paymentStatus === "pending"
                                ? "warning"
                                : "error"
                          }
                        >
                          {inv.paymentStatus === "paid"
                            ? "Đã thanh toán"
                            : inv.paymentStatus === "pending"
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
                            onClick={() => {
                              setCheckoutInvoice(inv);
                              setPaymentMethod("SEPAY");
                            }}
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
                  Vui lòng chọn phương thức thanh toán và thực hiện chuyển khoản để kích hoạt gói
                  dịch vụ.
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

                    {/* Payment Method Tabs */}
                    <div>
                      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                        Chọn phương thức thanh toán
                      </span>
                      <div className="mt-2.5 grid grid-cols-3 gap-3">
                        {/* Bank Transfer Tab Button */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("SEPAY")}
                          className={[
                            "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer",
                            paymentMethod === "SEPAY"
                              ? "border-emerald-600 bg-emerald-50/40 text-emerald-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <Bank size={24} weight="bold" />
                          <span className="text-xs font-bold">Chuyển khoản (VietQR)</span>
                        </button>

                        {/* Momo Tab Button */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("MOMO")}
                          className={[
                            "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer",
                            paymentMethod === "MOMO"
                              ? "border-emerald-600 bg-emerald-50/40 text-emerald-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <Wallet size={24} weight="bold" />
                          <span className="text-xs font-bold">Ví điện tử MoMo</span>
                        </button>

                        {/* Stripe Tab Button */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("STRIPE")}
                          className={[
                            "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer",
                            paymentMethod === "STRIPE"
                              ? "border-emerald-600 bg-emerald-50/40 text-emerald-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <CreditCard size={24} weight="bold" />
                          <span className="text-xs font-bold">Thẻ Quốc tế (Stripe)</span>
                        </button>
                      </div>
                    </div>

                    {/* Payment Details Container */}
                    <div className="rounded-xl border border-slate-100 bg-white p-5">
                      {paymentMethod === "SEPAY" && (
                        <div className="flex flex-col gap-5 md:flex-row md:items-center">
                          <div className="flex flex-1 flex-col gap-2.5 text-xs text-slate-600">
                            <h4 className="text-sm font-bold text-slate-800">
                              Thông tin chuyển khoản
                            </h4>
                            <div className="grid grid-cols-[100px_1fr] gap-y-2">
                              <span>Ngân hàng:</span>
                              <span className="font-bold text-slate-800">Vietcombank (VCB)</span>
                              <span>Chủ tài khoản:</span>
                              <span className="font-bold text-slate-800 uppercase">
                                CÔNG TY CỔ PHẦN UPNEXT
                              </span>
                              <span>Số tài khoản:</span>
                              <span className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                999988888
                                <button
                                  type="button"
                                  onClick={() => handleCopyText("999988888", "Số tài khoản")}
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
                                  {invoice.invoiceCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(invoice.invoiceCode, "Nội dung chuyển khoản")
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
                                src={`https://img.vietqr.io/image/vietcombank-999988888-compact.png?amount=${invoiceAmountInt}&addInfo=${invoice.invoiceCode}&accountName=CONG%20TY%20CO%20PHAN%20UPNEXT`}
                                alt="VietQR code"
                                width={144}
                                height={144}
                                className="size-36 object-contain"
                              />
                            </div>
                            <span className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              <QrCode size={12} /> Quét mã để trả nhanh
                            </span>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "MOMO" && (
                        <div className="flex flex-col gap-5 md:flex-row md:items-center">
                          <div className="flex flex-1 flex-col gap-2.5 text-xs text-slate-600">
                            <h4 className="text-sm font-bold text-slate-800">
                              Thanh toán qua ví MoMo
                            </h4>
                            <div className="grid grid-cols-[100px_1fr] gap-y-2">
                              <span>Số điện thoại:</span>
                              <span className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                0987654321
                                <button
                                  type="button"
                                  onClick={() => handleCopyText("0987654321", "Số điện thoại Momo")}
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                >
                                  <Copy size={10} /> Sao chép
                                </button>
                              </span>
                              <span>Chủ tài khoản:</span>
                              <span className="font-bold text-slate-800 uppercase">
                                NGUYỄN VĂN A (UPNEXT FINANCE)
                              </span>
                              <span>Lời nhắn CK:</span>
                              <span className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                <span className="rounded bg-pink-50 px-2 py-0.5 text-pink-800">
                                  {invoice.invoiceCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(invoice.invoiceCode, "Lời nhắn MoMo")
                                  }
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                >
                                  <Copy size={10} /> Sao chép
                                </button>
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400 italic">
                              * Quét mã QR bên cạnh hoặc chuyển khoản theo số điện thoại Momo với
                              nội dung chuyển khoản là mã hóa đơn.
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-center justify-center">
                            <div className="rounded-lg border border-slate-100 bg-white p-1.5 shadow-sm">
                              <Image
                                src="/assets/momo-qr.png"
                                alt="Momo QR code"
                                width={144}
                                height={144}
                                className="size-36 rounded object-cover"
                              />
                            </div>
                            <span className="mt-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              Quét ví MoMo
                            </span>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "STRIPE" && (
                        <div className="space-y-5">
                          <div className="flex justify-center">
                            <Image
                              src="/assets/stripe-card.png"
                              alt="Stripe credit card"
                              width={320}
                              height={200}
                              className="h-44 w-72 rounded-xl object-cover shadow-md"
                            />
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-800">
                              Thông tin thẻ tín dụng
                            </h4>
                            <div className="space-y-3.5">
                              <div className="flex flex-col gap-1.5">
                                <label
                                  className="text-xs font-bold text-slate-600"
                                  htmlFor="stripe-card-number"
                                >
                                  Số thẻ (Card Number)
                                </label>
                                <input
                                  aria-label="Số thẻ"
                                  id="stripe-card-number"
                                  type="text"
                                  maxLength={19}
                                  value={cardNumber}
                                  onChange={(e) =>
                                    setCardNumber(
                                      e.target.value
                                        .replace(/\D/g, "")
                                        .replace(/(.{4})/g, "$1 ")
                                        .trim(),
                                    )
                                  }
                                  placeholder="4111 2222 3333 4444"
                                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm placeholder:text-slate-300 focus:border-emerald-600 focus:outline-none"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label
                                    className="text-xs font-bold text-slate-600"
                                    htmlFor="stripe-card-expiry"
                                  >
                                    Hết hạn (MM/YY)
                                  </label>
                                  <input
                                    aria-label="Ngày hết hạn"
                                    id="stripe-card-expiry"
                                    type="text"
                                    maxLength={5}
                                    value={cardExpiry}
                                    onChange={(e) =>
                                      setCardExpiry(
                                        e.target.value
                                          .replace(/\D/g, "")
                                          .replace(/(.{2})/, "$1/")
                                          .trim(),
                                      )
                                    }
                                    placeholder="12/28"
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm placeholder:text-slate-300 focus:border-emerald-600 focus:outline-none"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label
                                    className="text-xs font-bold text-slate-600"
                                    htmlFor="stripe-card-cvc"
                                  >
                                    Mã bảo mật (CVC)
                                  </label>
                                  <input
                                    aria-label="Mã bảo mật CVC"
                                    id="stripe-card-cvc"
                                    type="password"
                                    maxLength={3}
                                    value={cardCvc}
                                    onChange={(e) =>
                                      setCardCvc(e.target.value.replace(/\D/g, "").trim())
                                    }
                                    placeholder="***"
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm placeholder:text-slate-300 focus:border-emerald-600 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <Button
                  variant="ghost"
                  className="h-10 cursor-pointer border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  onClick={() => setCheckoutInvoice(null)}
                  disabled={paying}
                >
                  Hủy bỏ
                </Button>
                <Button
                  className="flex h-10 cursor-pointer items-center gap-1.5 bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-700"
                  onClick={() => void handleConfirmPayment()}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <Spinner className="size-4 animate-spin" />
                      Đang kích hoạt...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} weight="bold" />
                      Xác nhận đã thanh toán
                    </>
                  )}
                </Button>
              </div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
