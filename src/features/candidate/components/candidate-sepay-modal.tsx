"use client";

import {
  X,
  Copy,
  QrCode,
  CheckCircle,
  ArrowsClockwise,
  ShieldCheck,
  Sparkle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";

import {
  type CandidateInvoice,
  type PublicSepayConfig,
  getPublicSepayConfig,
  checkSepayPayment,
} from "../api/candidate-billing-api";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

type CandidateSepayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  invoice: CandidateInvoice | null;
  onSuccess: () => void;
};

export function CandidateSepayModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: CandidateSepayModalProps) {
  const [sepayConfig, setSepayConfig] = useState<PublicSepayConfig | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch gateway config once
  useEffect(() => {
    getPublicSepayConfig()
      .then(setSepayConfig)
      .catch(() => setSepayConfig(null));
  }, []);

  // Format currency
  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  const invoiceAmountInt = invoice ? (invoice.amount.split(".")[0] ?? "") : "";
  const transferContent =
    invoice && sepayConfig?.contentPrefix
      ? `${sepayConfig.contentPrefix} ${invoice.invoiceCode}`
      : (invoice?.invoiceCode ?? "");

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    void Toast.fire({
      icon: "success",
      title: `Đã sao chép ${label}`,
    });
  };

  const handleSuccessFlow = useCallback(() => {
    setIsPaidSuccess(true);
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    void Swal.fire({
      icon: "success",
      title: "Thanh toán thành công!",
      text: "Gói thành viên ứng viên của bạn đã được kích hoạt thành công.",
      confirmButtonColor: "#10a778",
    });
    onSuccess();
  }, [onSuccess]);

  // Poll SePay check status
  const runCheckPayment = useCallback(
    async (isManual = false) => {
      if (!invoice || isPaidSuccess) return;
      try {
        if (isManual) setIsCheckingPayment(true);
        const res = await checkSepayPayment(invoice.id);
        if (res.paid) {
          handleSuccessFlow();
        } else if (isManual) {
          void Toast.fire({
            icon: "info",
            title: res.message || "Chưa nhận được giao dịch. Hệ thống vẫn đang tự động quét...",
          });
        }
      } catch {
        if (isManual) {
          void Toast.fire({
            icon: "error",
            title: "Không thể kiểm tra giao dịch lúc này. Vui lòng thử lại sau.",
          });
        }
      } finally {
        if (isManual) setIsCheckingPayment(false);
      }
    },
    [invoice, isPaidSuccess, handleSuccessFlow],
  );

  // Auto-polling when modal is open
  useEffect(() => {
    if (!isOpen || !invoice || isPaidSuccess) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    // Run poll every 3.5s
    pollTimerRef.current = setInterval(() => {
      void runCheckPayment(false);
    }, 3500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isOpen, invoice, isPaidSuccess, runCheckPayment]);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setIsPaidSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
      <div className="animate-in zoom-in-95 relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
              <Sparkle size={20} weight="fill" className="text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Nâng cấp {invoice.subscriptionPlan.subscriptionName}
              </h3>
              <p className="text-xs text-emerald-100">
                Mã hóa đơn:{" "}
                <span className="font-mono font-bold text-white">{invoice.invoiceCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isPaidSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle size={40} weight="fill" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Thanh toán thành công!</h4>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Tài khoản của bạn đã được nâng cấp lên{" "}
                <span className="font-bold text-emerald-600">
                  {invoice.subscriptionPlan.subscriptionName}
                </span>
                . Bạn có thể sử dụng đầy đủ quyền lợi AI Copilot ngay bây giờ.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
              >
                Hoàn tất & Sử dụng ngay
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Payment details container */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5">
                {sepayConfig?.enabled &&
                sepayConfig.bankBin &&
                sepayConfig.accountNumber &&
                sepayConfig.accountName ? (
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    {/* Left: bank details */}
                    <div className="flex flex-1 flex-col gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                          Thông tin chuyển khoản
                        </span>
                        {(sepayConfig.bankName?.toLowerCase().includes("sandbox") ||
                          sepayConfig.bankName?.toLowerCase().includes("test") ||
                          sepayConfig.accountName?.toLowerCase().includes("sandbox") ||
                          sepayConfig.accountName?.toLowerCase().includes("test")) && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            🧪 Test Mode
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-[105px_1fr] items-center gap-y-2.5">
                        <span className="text-slate-500">Ngân hàng:</span>
                        <span className="font-bold text-slate-800">
                          {sepayConfig.bankName ?? sepayConfig.bankBin}
                        </span>

                        <span className="text-slate-500">Chủ tài khoản:</span>
                        <span className="font-bold text-slate-800 uppercase">
                          {sepayConfig.accountName}
                        </span>

                        <span className="text-slate-500">Số tài khoản:</span>
                        <span className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          {sepayConfig.accountNumber}
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(sepayConfig.accountNumber ?? "", "Số tài khoản")
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                          >
                            <Copy size={11} /> Sao chép
                          </button>
                        </span>

                        <span className="text-slate-500">Số tiền:</span>
                        <span className="flex items-center gap-1.5 font-mono font-bold text-emerald-700">
                          {formatCurrency(invoiceAmountInt)}
                          <button
                            type="button"
                            onClick={() => handleCopyText(invoiceAmountInt, "Số tiền")}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                          >
                            <Copy size={11} /> Sao chép
                          </button>
                        </span>

                        <span className="text-slate-500">Nội dung CK:</span>
                        <span className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          <span className="rounded-md border border-amber-200/60 bg-amber-100 px-2 py-0.5 text-amber-900">
                            {transferContent}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(transferContent, "Nội dung chuyển khoản")}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                          >
                            <Copy size={11} /> Sao chép
                          </button>
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-400 italic">
                        * Vui lòng chuyển khoản đúng số tiền và nội dung chuyển khoản để hệ thống tự
                        động kích hoạt gói ngay tức thì.
                      </p>
                    </div>

                    {/* Right: VietQR */}
                    <div className="flex shrink-0 flex-col items-center justify-center border-t border-slate-200 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                      <div className="relative rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                        <Image
                          src={`https://img.vietqr.io/image/${sepayConfig.bankBin}-${sepayConfig.accountNumber}-compact.png?amount=${invoiceAmountInt}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(sepayConfig.accountName)}`}
                          alt="VietQR code"
                          width={150}
                          height={150}
                          unoptimized
                          className="size-38 object-contain"
                        />
                      </div>
                      <span className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                        <QrCode size={13} className="text-emerald-600" /> Quét mã để trả nhanh
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Đang tải cấu hình cổng thanh toán SePay...
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-600"></span>
                  </span>
                  <span>Đang tự động quét giao dịch... Hệ thống sẽ tự kích hoạt sau vài giây.</span>
                </div>

                <button
                  type="button"
                  onClick={() => void runCheckPayment(true)}
                  disabled={isCheckingPayment}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <ArrowsClockwise size={14} className={isCheckingPayment ? "animate-spin" : ""} />
                  {isCheckingPayment ? "Đang kiểm tra..." : "Tôi đã chuyển khoản"}
                </button>
              </div>

              {/* Security info note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Thanh toán bảo mật qua Cổng ngân hàng SePay (VietQR chuẩn NAPAS 247)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
