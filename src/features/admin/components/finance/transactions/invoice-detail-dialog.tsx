"use client";

import {
  CheckCircle,
  Clock,
  Printer,
  ReceiptX,
  Buildings,
  ShieldCheck,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import * as React from "react";

import type { AdminInvoiceItem } from "@/features/admin/api/invoices";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

function formatVnd(amountStr: string | number) {
  const amount = typeof amountStr === "string" ? parseFloat(amountStr) : amountStr;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(isoString: string | null) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PAID":
      return (
        <Badge tone="success" className="gap-1 px-3 py-1 text-xs font-bold uppercase">
          <CheckCircle size={14} weight="bold" /> Đã thanh toán
        </Badge>
      );
    case "PENDING":
      return (
        <Badge tone="warning" className="gap-1 px-3 py-1 text-xs font-bold uppercase">
          <Clock size={14} weight="bold" /> Chờ thanh toán
        </Badge>
      );
    case "REFUNDED":
      return (
        <Badge tone="neutral" className="gap-1 px-3 py-1 text-xs font-bold uppercase">
          <ArrowCounterClockwise size={14} weight="bold" /> Đã hoàn tiền
        </Badge>
      );
    case "FAILED":
      return (
        <Badge tone="error" className="gap-1 px-3 py-1 text-xs font-bold uppercase">
          <ReceiptX size={14} weight="bold" /> Đã hủy / Thất bại
        </Badge>
      );
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

interface InvoiceDetailDialogProps {
  invoice: AdminInvoiceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailDialog({ invoice, open, onOpenChange }: InvoiceDetailDialogProps) {
  const printableRef = React.useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const amountNum =
    typeof invoice.amount === "string" ? parseFloat(invoice.amount) : invoice.amount;
  const subTotal = Math.round(amountNum / 1.1);
  const vatAmount = amountNum - subTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-[760px]">
        <DialogHeader className="border-b border-slate-200 px-6 py-4 pr-14">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-base font-bold text-slate-800">
                Chi tiết Hóa đơn Dịch vụ
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Mã hóa đơn:{" "}
                <span className="font-mono font-bold text-slate-700">{invoice.invoiceCode}</span>
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="shrink-0 gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer size={16} weight="bold" />
              In hóa đơn
            </Button>
          </div>
        </DialogHeader>

        {/* PRINTABLE INVOICE CONTAINER */}
        <div ref={printableRef} className="printable-invoice-area space-y-6 p-6 text-slate-800">
          {/* 1. Header & Title */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Buildings size={22} weight="bold" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-wider text-slate-900 uppercase">
                    CÔNG TY CỔ PHẦN NỀN TẢNG TUYỂN DỤNG UPNEXT
                  </h2>
                  <p className="text-[11px] text-slate-500">Mã số thuế: 0317896543</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Địa chỉ: Tòa nhà UpNext Tower, 123 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh
              </p>
              <p className="text-xs text-slate-500">
                Hotline: 1900 8888 | Email: billing@upnext.dev
              </p>
            </div>

            <div className="text-right sm:min-w-[200px]">
              <h1 className="text-lg font-black tracking-tight text-emerald-800 uppercase">
                HÓA ĐƠN ĐIỆN TỬ
              </h1>
              <p className="font-mono text-xs font-bold text-slate-600">{invoice.invoiceCode}</p>
              <div className="mt-2 flex justify-end">{getStatusBadge(invoice.paymentStatus)}</div>
            </div>
          </div>

          {/* 2. Bên mua hàng */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              ĐƠN VỊ MUA HÀNG (DOANH NGHIỆP)
            </h3>
            <div className="mt-2.5 grid grid-cols-1 gap-y-1.5 text-xs sm:grid-cols-2">
              <div>
                <span className="text-slate-500">Tên doanh nghiệp:</span>{" "}
                <span className="font-bold text-slate-900">{invoice.company?.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Mã số thuế:</span>{" "}
                <span className="font-mono font-bold text-slate-900">
                  {invoice.company?.taxCode || "Chưa cập nhật"}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500">Địa chỉ:</span>{" "}
                <span className="font-medium text-slate-800">
                  {invoice.company?.address || "Chưa cập nhật địa chỉ"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Email liên hệ:</span>{" "}
                <span className="font-medium text-slate-800">{invoice.company?.email || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500">Điện thoại:</span>{" "}
                <span className="font-medium text-slate-800">{invoice.company?.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* 3. Bảng kê chi tiết dịch vụ */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 font-bold text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-center">STT</th>
                  <th className="px-4 py-3">Tên dịch vụ / Gói tuyển dụng</th>
                  <th className="px-4 py-3 text-center">Thời hạn</th>
                  <th className="px-4 py-3 text-center">Số lượng</th>
                  <th className="px-4 py-3 text-right">Đơn giá (VNĐ)</th>
                  <th className="px-4 py-3 text-right">Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="px-4 py-3.5 text-center font-mono">01</td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900">
                      {invoice.subscriptionPlan?.subscriptionName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {invoice.subscriptionPlan?.description}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {invoice.subscriptionPlan?.durationDays} ngày
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono">1</td>
                  <td className="px-4 py-3.5 text-right font-mono">{formatVnd(amountNum)}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-800">
                    {formatVnd(amountNum)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Tổng cộng và Thuế */}
          <div className="flex justify-end">
            <div className="w-full space-y-2 rounded-xl bg-slate-50 p-4 text-xs sm:w-72">
              <div className="flex justify-between text-slate-600">
                <span>Cộng tiền dịch vụ:</span>
                <span className="font-mono font-semibold">{formatVnd(subTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Thuế GTGT (VAT 10%):</span>
                <span className="font-mono font-semibold">{formatVnd(vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                <span>Tổng tiền thanh toán:</span>
                <span className="font-mono text-emerald-700">{formatVnd(amountNum)}</span>
              </div>
            </div>
          </div>

          {/* 5. Thông tin giao dịch & Đối soát */}
          <div className="rounded-xl border border-slate-200/80 p-4 text-xs">
            <h4 className="font-bold text-slate-700">Thông tin đối soát giao dịch:</h4>
            <div className="mt-2 grid grid-cols-1 gap-y-1 text-slate-600 sm:grid-cols-2">
              <div>
                <span>Cổng thanh toán:</span>{" "}
                <span className="font-bold text-slate-800 uppercase">
                  {invoice.paymentMethod || "Chuyển khoản / Chưa chọn"}
                </span>
              </div>
              <div>
                <span>Mã giao dịch / Bút toán:</span>{" "}
                <span className="font-mono font-bold text-slate-900">
                  {invoice.paymentReference || "Chưa có"}
                </span>
              </div>
              <div>
                <span>Thời gian lập hóa đơn:</span>{" "}
                <span className="font-medium text-slate-800">{formatDate(invoice.createdAt)}</span>
              </div>
              <div>
                <span>Thời gian xác nhận trả tiền:</span>{" "}
                <span className="font-medium text-slate-800">
                  {invoice.paidAt ? formatDate(invoice.paidAt) : "Chưa thanh toán"}
                </span>
              </div>
            </div>

            {invoice.adminNote ? (
              <div className="mt-3 rounded-lg bg-slate-100 p-2.5 text-[11px] text-slate-700">
                <span className="font-bold text-slate-800">Ghi chú đối soát:</span>{" "}
                {invoice.adminNote}
              </div>
            ) : null}

            {invoice.cancelledReason ? (
              <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-[11px] text-rose-700">
                <span className="font-bold text-rose-800">Lý do hủy hóa đơn:</span>{" "}
                {invoice.cancelledReason} (lúc {formatDate(invoice.cancelledAt)})
              </div>
            ) : null}

            {invoice.refundReason ? (
              <div className="mt-3 rounded-lg bg-purple-50 p-2.5 text-[11px] text-purple-700">
                <span className="font-bold text-purple-800">Lý do hoàn tiền:</span>{" "}
                {invoice.refundReason} (Mã hoàn: {invoice.refundReference || "N/A"}, lúc{" "}
                {formatDate(invoice.refundedAt)})
              </div>
            ) : null}
          </div>

          {/* 6. Chữ ký số / Dấu chứng thực */}
          <div className="flex flex-col items-end pt-2 text-center text-xs">
            <div className="flex flex-col items-center">
              <p className="font-bold text-slate-700 uppercase">ĐẠI DIỆN BÊN BÁN HÀNG</p>
              <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-400/80 bg-emerald-50/50 px-3 py-1.5 text-emerald-800">
                <ShieldCheck size={20} weight="fill" className="text-emerald-600" />
                <div className="text-left text-[10px] leading-tight">
                  <p className="font-bold">KÝ BỞI: UPNEXT CORP</p>
                  <p className="font-mono text-emerald-600">CHỨNG THỰC ĐIỆN TỬ HỢP LỆ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-slate-50/95 px-6 py-3 backdrop-blur-xs sm:flex-row">
          <div className="text-xs text-slate-500">
            Trạng thái: <span className="font-bold text-slate-800">{invoice.paymentStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold"
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Printer size={16} weight="bold" />
              In hóa đơn
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
