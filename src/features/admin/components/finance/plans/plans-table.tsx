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

export type AdminSubscriptionPlan = {
  id: string;
  planName: string;
  targetAudience: "Nhà tuyển dụng" | "Ứng viên";
  price: number;
  billingCycle: "Tháng" | "Năm" | "Gói tín dụng (One-time)";
  activeSubscribers: number;
  status: "Đang bán" | "Ngừng bán (Legacy)" | "Bản nháp";
};

const data: AdminSubscriptionPlan[] = [
  {
    id: "PLAN-EMP-PRO",
    planName: "Employer Pro",
    targetAudience: "Nhà tuyển dụng",
    price: 2500000,
    billingCycle: "Tháng",
    activeSubscribers: 1450,
    status: "Đang bán",
  },
  {
    id: "PLAN-EMP-PREM",
    planName: "Employer Premium",
    targetAudience: "Nhà tuyển dụng",
    price: 24000000,
    billingCycle: "Năm",
    activeSubscribers: 320,
    status: "Đang bán",
  },
  {
    id: "PLAN-EMP-CRED",
    planName: "Gói 5 Tin Tuyển Dụng",
    targetAudience: "Nhà tuyển dụng",
    price: 1500000,
    billingCycle: "Gói tín dụng (One-time)",
    activeSubscribers: 890,
    status: "Đang bán",
  },
  {
    id: "PLAN-CAN-PRO",
    planName: "Candidate Pro (Nổi bật hồ sơ)",
    targetAudience: "Ứng viên",
    price: 99000,
    billingCycle: "Tháng",
    activeSubscribers: 5400,
    status: "Đang bán",
  },
  {
    id: "PLAN-EMP-BASIC-OLD",
    planName: "Employer Basic (2025)",
    targetAudience: "Nhà tuyển dụng",
    price: 1000000,
    billingCycle: "Tháng",
    activeSubscribers: 45,
    status: "Ngừng bán (Legacy)",
  },
  // Add more items for pagination
  {
    id: "PLAN-EMP-LITE",
    planName: "Employer Lite",
    targetAudience: "Nhà tuyển dụng",
    price: 500000,
    billingCycle: "Tháng",
    activeSubscribers: 300,
    status: "Đang bán",
  },
  {
    id: "PLAN-CAN-BASIC",
    planName: "Candidate Basic",
    targetAudience: "Ứng viên",
    price: 49000,
    billingCycle: "Tháng",
    activeSubscribers: 8500,
    status: "Bản nháp",
  },
  {
    id: "PLAN-EMP-ENT",
    planName: "Employer Enterprise",
    targetAudience: "Nhà tuyển dụng",
    price: 50000000,
    billingCycle: "Năm",
    activeSubscribers: 15,
    status: "Đang bán",
  },
  {
    id: "PLAN-EMP-CRED-10",
    planName: "Gói 10 Tin Tuyển Dụng",
    targetAudience: "Nhà tuyển dụng",
    price: 2800000,
    billingCycle: "Gói tín dụng (One-time)",
    activeSubscribers: 420,
    status: "Đang bán",
  },
  {
    id: "PLAN-CAN-MENTOR",
    planName: "1:1 Mentorship",
    targetAudience: "Ứng viên",
    price: 500000,
    billingCycle: "Gói tín dụng (One-time)",
    activeSubscribers: 120,
    status: "Bản nháp",
  },
  {
    id: "PLAN-EMP-CV",
    planName: "Gói xem 100 CV",
    targetAudience: "Nhà tuyển dụng",
    price: 2000000,
    billingCycle: "Gói tín dụng (One-time)",
    activeSubscribers: 600,
    status: "Ngừng bán (Legacy)",
  },
];

export const columns: ColumnDef<AdminSubscriptionPlan>[] = [
  {
    accessorKey: "planName",
    header: "Tên gói dịch vụ",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.planName}</p>
        <p className="text-muted-foreground text-xs">{row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "targetAudience",
    header: "Đối tượng",
    cell: ({ row }) => {
      const audience = row.getValue("targetAudience") as string;
      const tone = audience === "Nhà tuyển dụng" ? "brand" : "info";
      return <Badge tone={tone}>{audience}</Badge>;
    },
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Đơn giá</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
            row.original.price,
          )}
          <span className="text-muted-foreground block text-xs font-normal">
            / {row.original.billingCycle}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "activeSubscribers",
    header: () => <div className="text-right">Người dùng active</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat("vi-VN").format(row.original.activeSubscribers)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đang bán" ? "success" : status === "Bản nháp" ? "warning" : "neutral";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const plan = row.original;

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
              <DropdownMenuItem>Chỉnh sửa gói</DropdownMenuItem>
              <DropdownMenuItem>Xem danh sách người mua</DropdownMenuItem>
              <DropdownMenuSeparator />
              {plan.status === "Bản nháp" && (
                <DropdownMenuItem className="text-success">
                  Phát hành (Đưa lên bán)
                </DropdownMenuItem>
              )}
              {plan.status === "Đang bán" && (
                <DropdownMenuItem className="text-warning">Ngừng bán (Legacy)</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function PlansTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-[350px]">
          <MagnifyingGlass
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={18}
          />
          <Input
            className="bg-muted h-10 rounded-xl pl-10"
            placeholder="Tìm theo tên gói, mã ID..."
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Đang bán">Đang bán</SelectItem>
            <SelectItem value="Bản nháp">Bản nháp</SelectItem>
            <SelectItem value="Ngừng bán (Legacy)">Ngừng bán (Legacy)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
