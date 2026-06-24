"use client";

import { DotsThree } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export type AdminTransaction = {
  id: string;
  client: string;
  service: string;
  amount: number;
  paymentMethod: "Chuyển khoản" | "Thẻ tín dụng" | "MoMo" | "VNPAY";
  status: "Thành công" | "Đang xử lý" | "Thất bại" | "Đã hoàn tiền";
  transactionDate: string;
};

const data: AdminTransaction[] = [
  {
    id: "TRX-88204",
    client: "TechCorp Vietnam",
    service: "Employer Premium (1 Năm)",
    amount: 24000000,
    paymentMethod: "Chuyển khoản",
    status: "Thành công",
    transactionDate: "24/06/2026 14:30:12",
  },
  {
    id: "TRX-88205",
    client: "Global Outsource LLC",
    service: "Employer Pro (1 Tháng)",
    amount: 2500000,
    paymentMethod: "Thẻ tín dụng",
    status: "Thành công",
    transactionDate: "24/06/2026 15:10:05",
  },
  {
    id: "TRX-88206",
    client: "Startup B",
    service: "Gói 5 Tin Tuyển Dụng",
    amount: 1500000,
    paymentMethod: "MoMo",
    status: "Thất bại",
    transactionDate: "24/06/2026 15:45:22",
  },
  {
    id: "TRX-88190",
    client: "Nguyễn Lê Anh (Candidate)",
    service: "Candidate Pro (1 Tháng)",
    amount: 99000,
    paymentMethod: "VNPAY",
    status: "Đang xử lý",
    transactionDate: "24/06/2026 16:00:00",
  },
  {
    id: "TRX-88150",
    client: "Scam Company",
    service: "Employer Pro (1 Tháng)",
    amount: 2500000,
    paymentMethod: "Thẻ tín dụng",
    status: "Đã hoàn tiền",
    transactionDate: "20/06/2026 09:12:45",
  },
];

export const columns: ColumnDef<AdminTransaction>[] = [
  {
    accessorKey: "id",
    header: "Mã giao dịch",
    cell: ({ row }) => <p className="font-mono text-sm font-medium">{row.original.id}</p>,
  },
  {
    accessorKey: "client",
    header: "Khách hàng",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.client}</p>
        <p className="text-muted-foreground text-xs">{row.original.service}</p>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Số tiền</div>,
    cell: ({ row }) => {
      return (
        <div className="text-brand text-right font-medium">
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
            row.original.amount,
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Phương thức thanh toán",
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Thành công"
          ? "success"
          : status === "Đang xử lý"
            ? "warning"
            : status === "Thất bại"
              ? "error"
              : "neutral";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    accessorKey: "transactionDate",
    header: "Thời gian",
    cell: ({ row }) => <div>{row.original.transactionDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const transaction = row.original;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu thao tác</span>
                <DotsThree size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem>Xem hóa đơn (Invoice)</DropdownMenuItem>
              <DropdownMenuItem>Gửi lại biên lai qua Email</DropdownMenuItem>
              <DropdownMenuSeparator />
              {transaction.status === "Thất bại" && (
                <DropdownMenuItem className="text-brand">
                  Kiểm tra lại trạng thái GD
                </DropdownMenuItem>
              )}
              {transaction.status === "Thành công" && (
                <DropdownMenuItem className="text-error">Hoàn tiền (Refund)</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function TransactionsTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
