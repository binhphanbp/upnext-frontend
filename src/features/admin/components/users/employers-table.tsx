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

export type Employer = {
  id: string;
  companyName: string;
  representative: string;
  email: string;
  plan: "Free" | "Pro" | "Premium";
  status: "Chờ duyệt" | "Đã xác thực" | "Bị khóa";
  activeJobs: number;
  joinDate: string;
};

const data: Employer[] = [
  {
    id: "1",
    companyName: "VNG Corporation",
    representative: "Nguyễn Văn A",
    email: "hr@vng.com.vn",
    plan: "Premium",
    status: "Đã xác thực",
    activeJobs: 15,
    joinDate: "12/05/2025",
  },
  {
    id: "2",
    companyName: "FPT Software",
    representative: "Trần Thị B",
    email: "tuyendung@fsoft.com.vn",
    plan: "Pro",
    status: "Đã xác thực",
    activeJobs: 42,
    joinDate: "01/03/2024",
  },
  {
    id: "3",
    companyName: "Tech Startup X",
    representative: "Lê Văn C",
    email: "contact@startupx.io",
    plan: "Free",
    status: "Chờ duyệt",
    activeJobs: 2,
    joinDate: "24/06/2026",
  },
  {
    id: "4",
    companyName: "Shopee Vietnam",
    representative: "Phạm D",
    email: "careers@shopee.vn",
    plan: "Premium",
    status: "Đã xác thực",
    activeJobs: 8,
    joinDate: "15/11/2023",
  },
  {
    id: "5",
    companyName: "Crypto Scam Co",
    representative: "John Doe",
    email: "admin@cryptoscam.net",
    plan: "Free",
    status: "Bị khóa",
    activeJobs: 0,
    joinDate: "20/06/2026",
  },
];

export const columns: ColumnDef<Employer>[] = [
  {
    accessorKey: "companyName",
    header: "Công ty",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.companyName}</p>
        <p className="text-muted-foreground text-xs">Tham gia: {row.original.joinDate}</p>
      </div>
    ),
  },
  {
    accessorKey: "representative",
    header: "Đại diện liên hệ",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.representative}</p>
        <p className="text-muted-foreground text-xs">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "plan",
    header: "Gói dịch vụ",
    cell: ({ row }) => {
      const plan = row.getValue("plan") as string;
      const tone = plan === "Premium" ? "premium" : plan === "Pro" ? "brand" : "neutral";
      return <Badge tone={tone}>{plan}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đã xác thực" ? "success" : status === "Chờ duyệt" ? "warning" : "error";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    accessorKey: "activeJobs",
    header: () => <div className="text-right">Tin tuyển dụng</div>,
    cell: ({ row }) => {
      return <div className="text-right font-medium">{row.getValue("activeJobs")}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const employer = row.original;

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(employer.id)}>
                Copy ID Công ty
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Xem hồ sơ công ty</DropdownMenuItem>
              {employer.status === "Chờ duyệt" && (
                <DropdownMenuItem className="text-success">Duyệt tài khoản (KYC)</DropdownMenuItem>
              )}
              <DropdownMenuItem>Nâng cấp gói dịch vụ</DropdownMenuItem>
              {employer.status !== "Bị khóa" && (
                <DropdownMenuItem className="text-error">Khóa tài khoản</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function EmployersTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
