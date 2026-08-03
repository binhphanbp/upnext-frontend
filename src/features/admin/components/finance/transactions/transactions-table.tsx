"use client";

import { DotsThree, MagnifyingGlass } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

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
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

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
  // Add more items for pagination
  {
    id: "TRX-88207",
    client: "Công ty ABC",
    service: "Employer Pro (1 Tháng)",
    amount: 2500000,
    paymentMethod: "Chuyển khoản",
    status: "Thành công",
    transactionDate: "25/06/2026 08:10:00",
  },
  {
    id: "TRX-88208",
    client: "Trần Văn E (Candidate)",
    service: "Candidate Pro",
    amount: 99000,
    paymentMethod: "MoMo",
    status: "Thành công",
    transactionDate: "25/06/2026 09:15:30",
  },
  {
    id: "TRX-88209",
    client: "ZaloPay HR",
    service: "Employer Premium (1 Năm)",
    amount: 24000000,
    paymentMethod: "Thẻ tín dụng",
    status: "Thành công",
    transactionDate: "25/06/2026 10:20:45",
  },
  {
    id: "TRX-88210",
    client: "FPT Software",
    service: "Gói 10 Tin Tuyển Dụng",
    amount: 2800000,
    paymentMethod: "VNPAY",
    status: "Đang xử lý",
    transactionDate: "26/06/2026 11:30:15",
  },
  {
    id: "TRX-88211",
    client: "Shopee Vietnam",
    service: "Employer Enterprise",
    amount: 50000000,
    paymentMethod: "Chuyển khoản",
    status: "Thành công",
    transactionDate: "26/06/2026 14:45:00",
  },
  {
    id: "TRX-88212",
    client: "Phạm F (Candidate)",
    service: "1:1 Mentorship",
    amount: 500000,
    paymentMethod: "Thẻ tín dụng",
    status: "Thất bại",
    transactionDate: "27/06/2026 09:00:10",
  },
  {
    id: "TRX-88213",
    client: "Tiki HR",
    service: "Gói xem 100 CV",
    amount: 2000000,
    paymentMethod: "MoMo",
    status: "Thành công",
    transactionDate: "27/06/2026 15:20:30",
  },
];

import { useTranslations } from "next-intl";

export const getColumns = (t: any): ColumnDef<AdminTransaction>[] => [
  {
    accessorKey: "id",
    header: t("id"),
    cell: ({ row }) => <p className="font-mono text-sm font-medium">{row.original.id}</p>,
  },
  {
    accessorKey: "client",
    header: t("client"),
    cell: ({ row }) => {
      const clientStr = row.original.client as string;
      const serviceStr = row.original.service as string;

      let client = clientStr;
      if (clientStr === "Nguyễn Lê Anh (Candidate)")
        client = t("mockClients.Nguyễn Lê Anh (Candidate)");
      else if (clientStr === "Công ty ABC") client = t("mockClients.Công ty ABC");
      else if (clientStr === "Trần Văn E (Candidate)")
        client = t("mockClients.Trần Văn E (Candidate)");
      else if (clientStr === "Phạm F (Candidate)") client = t("mockClients.Phạm F (Candidate)");

      let service = serviceStr;
      if (serviceStr === "Employer Premium (1 Năm)")
        service = t("mockServices.Employer Premium (1 Năm)");
      else if (serviceStr === "Employer Pro (1 Tháng)")
        service = t("mockServices.Employer Pro (1 Tháng)");
      else if (serviceStr === "Gói 5 Tin Tuyển Dụng")
        service = t("mockServices.Gói 5 Tin Tuyển Dụng");
      else if (serviceStr === "Candidate Pro (1 Tháng)")
        service = t("mockServices.Candidate Pro (1 Tháng)");
      else if (serviceStr === "Gói 10 Tin Tuyển Dụng")
        service = t("mockServices.Gói 10 Tin Tuyển Dụng");
      else if (serviceStr === "Gói xem 100 CV") service = t("mockServices.Gói xem 100 CV");

      return (
        <div>
          <p className="text-foreground font-semibold">{client}</p>
          <p className="text-muted-foreground text-xs">{service}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">{t("amount")}</div>,
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
    header: t("paymentMethod"),
    cell: ({ row }) => {
      const method = row.original.paymentMethod;
      const methodKey =
        method === "Chuyển khoản"
          ? "bankTransfer"
          : method === "Thẻ tín dụng"
            ? "creditCard"
            : method === "MoMo"
              ? "momo"
              : "vnpay";
      return <div>{t(`paymentMethodOptions.${methodKey}`)}</div>;
    },
  },
  {
    accessorKey: "status",
    header: t("status"),
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

      const statusKey =
        status === "Thành công"
          ? "success"
          : status === "Đang xử lý"
            ? "processing"
            : status === "Thất bại"
              ? "failed"
              : "refunded";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "transactionDate",
    header: t("transactionDate"),
    cell: ({ row }) => <div>{row.original.transactionDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
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
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem>{t("actionOptions.viewInvoice")}</DropdownMenuItem>
              <DropdownMenuItem>{t("actionOptions.resendEmail")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {transaction.status === "Thất bại" && (
                <DropdownMenuItem className="text-brand">
                  {t("actionOptions.recheckStatus")}
                </DropdownMenuItem>
              )}
              {transaction.status === "Thành công" && (
                <DropdownMenuItem className="text-error">
                  {t("actionOptions.refund")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function TransactionsTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const t = useTranslations("Admin.finance.transactions.table");

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  const columns = React.useMemo(() => getColumns(t), [t]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-[350px]">
          <MagnifyingGlass
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={18}
          />
          <Input className="bg-muted h-10 rounded-xl pl-10" placeholder={t("searchPlaceholder")} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="Thành công">{t("statusOptions.success")}</SelectItem>
            <SelectItem value="Đang xử lý">{t("statusOptions.processing")}</SelectItem>
            <SelectItem value="Thất bại">{t("statusOptions.failed")}</SelectItem>
            <SelectItem value="Đã hoàn tiền">{t("statusOptions.refunded")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
