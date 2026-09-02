"use client";

import { CheckCircle, Spinner } from "@phosphor-icons/react";
import * as React from "react";
import Swal from "sweetalert2";

import {
  manualConfirmInvoice,
  type AdminInvoiceItem,
  type AdminPaymentMethod,
} from "@/features/admin/api/invoices";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

function formatVnd(amountStr: string | number) {
  const amount = typeof amountStr === "string" ? parseFloat(amountStr) : amountStr;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

interface ManualConfirmDialogProps {
  invoice: AdminInvoiceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onSuccess: () => void;
}

export function ManualConfirmDialog({
  invoice,
  open,
  onOpenChange,
  token,
  onSuccess,
}: ManualConfirmDialogProps) {
  const [paymentReference, setPaymentReference] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<AdminPaymentMethod>("SEPAY");
  const [adminNote, setAdminNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPaymentReference("");
      setPaymentMethod("SEPAY");
      setAdminNote("");
      setLoading(false);
    }
  }, [open]);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentReference.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu mã đối soát",
        text: "Vui lòng nhập mã giao dịch ngân hàng hoặc số bút toán đối soát.",
      });
      return;
    }

    setLoading(true);
    try {
      await manualConfirmInvoice(
        invoice.id,
        {
          paymentReference: paymentReference.trim(),
          paymentMethod,
          adminNote: adminNote.trim() || undefined,
        },
        token,
      );

      Swal.fire({
        icon: "success",
        title: "Xác nhận thành công",
        text: `Hóa đơn ${invoice.invoiceCode} đã được cập nhật thành công và gói dịch vụ đã được kích hoạt.`,
        timer: 2000,
        showConfirmButton: false,
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi xác nhận hóa đơn.";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto p-5 sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2 text-base text-emerald-700">
              <CheckCircle size={20} weight="bold" />
              Xác nhận thanh toán thủ công
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Duyệt thanh toán cho hóa đơn khi tiền đã về tài khoản ngân hàng UpNext.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã hóa đơn:</span>
              <span className="font-mono font-bold text-slate-800">{invoice.invoiceCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Doanh nghiệp:</span>
              <span className="font-bold text-slate-800">{invoice.company?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gói dịch vụ:</span>
              <span className="font-bold text-slate-800">
                {invoice.subscriptionPlan?.subscriptionName}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 pt-2">
              <span className="font-semibold text-slate-600">Số tiền cần đối soát:</span>
              <span className="text-sm font-black text-emerald-700">
                {formatVnd(invoice.amount)}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="paymentReference" className="text-xs font-bold text-slate-700">
                Mã giao dịch ngân hàng / Mã tham chiếu <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="paymentReference"
                placeholder="VD: FT2624589100234 hoặc VCB.020926..."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400">
                Mã bút toán trên sao kê ngân hàng để phục vụ kiểm toán đối soát.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod" className="text-xs font-bold text-slate-700">
                Phương thức nhận tiền
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as AdminPaymentMethod)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEPAY">Chuyển khoản Ngân hàng (SePay / QR)</SelectItem>
                  <SelectItem value="STRIPE">Thẻ quốc tế (Visa/Mastercard)</SelectItem>
                  <SelectItem value="MOMO">Ví MoMo</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminNote" className="text-xs font-bold text-slate-700">
                Ghi chú nội bộ kế toán
              </Label>
              <Textarea
                id="adminNote"
                placeholder="Ghi chú thêm (VD: Khách ghi nhầm nội dung CK, đã liên hệ xác nhận...)"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              {loading ? <Spinner className="size-4 animate-spin" /> : null}
              Xác nhận thanh toán & Kích hoạt gói
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
