"use client";

import { Prohibit, Spinner } from "@phosphor-icons/react";
import * as React from "react";
import Swal from "sweetalert2";

import { cancelInvoice, type AdminInvoiceItem } from "@/features/admin/api/invoices";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface CancelInvoiceDialogProps {
  invoice: AdminInvoiceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onSuccess: () => void;
}

export function CancelInvoiceDialog({
  invoice,
  open,
  onOpenChange,
  token,
  onSuccess,
}: CancelInvoiceDialogProps) {
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setLoading(false);
    }
  }, [open]);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu lý do hủy",
        text: "Vui lòng nhập lý do hủy hóa đơn này.",
      });
      return;
    }

    setLoading(true);
    try {
      await cancelInvoice(invoice.id, { reason: reason.trim() }, token);

      Swal.fire({
        icon: "success",
        title: "Đã hủy hóa đơn",
        text: `Hóa đơn ${invoice.invoiceCode} đã được chuyển sang trạng thái Hủy / Thất bại.`,
        timer: 2000,
        showConfirmButton: false,
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi hủy hóa đơn.";
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
      <DialogContent className="max-h-[85vh] overflow-y-auto p-5 sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2 text-base text-rose-700">
              <Prohibit size={20} weight="bold" />
              Hủy hóa đơn chờ thanh toán
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Hóa đơn sau khi hủy sẽ không thể tiếp tục thanh toán.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã hóa đơn:</span>
              <span className="font-mono font-bold text-slate-800">{invoice.invoiceCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Doanh nghiệp:</span>
              <span className="font-bold text-slate-800">{invoice.company?.name}</span>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="cancelReason" className="text-xs font-bold text-slate-700">
              Lý do hủy hóa đơn <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="cancelReason"
              placeholder="VD: Khách hàng đổi sang gói năm, đã hết hạn thanh toán..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-rose-600 font-bold text-white hover:bg-rose-700"
            >
              {loading ? <Spinner className="size-4 animate-spin" /> : null}
              Xác nhận hủy hóa đơn
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
