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

export type AdminSalesLead = {
  id: string;
  companyName: string;
  contactName: string;
  salesRep: string;
  stage: "Tiềm năng" | "Đã liên hệ" | "Thương lượng" | "Chốt hợp đồng" | "Thất bại";
  dealValue: number;
  lastActivity: string;
};

const data: AdminSalesLead[] = [
  {
    id: "LEAD-2001",
    companyName: "TechCorp Vietnam",
    contactName: "Nguyễn Hải",
    salesRep: "Trần Nhân",
    stage: "Thương lượng",
    dealValue: 15000000,
    lastActivity: "24/06/2026",
  },
  {
    id: "LEAD-2005",
    companyName: "Global Outsource LLC",
    contactName: "Lê Minh",
    salesRep: "Trần Nhân",
    stage: "Chốt hợp đồng",
    dealValue: 45000000,
    lastActivity: "22/06/2026",
  },
  {
    id: "LEAD-2008",
    companyName: "Startup B",
    contactName: "Phạm Hà",
    salesRep: "Mai Linh",
    stage: "Tiềm năng",
    dealValue: 5000000,
    lastActivity: "20/06/2026",
  },
  {
    id: "LEAD-2010",
    companyName: "Ngân hàng TMCP Phương Nam",
    contactName: "Đặng Khoa",
    salesRep: "Nguyễn Bảo",
    stage: "Thất bại",
    dealValue: 120000000,
    lastActivity: "15/06/2026",
  },
  {
    id: "LEAD-2015",
    companyName: "E-Commerce XYZ",
    contactName: "Bùi Trang",
    salesRep: "Mai Linh",
    stage: "Đã liên hệ",
    dealValue: 20000000,
    lastActivity: "24/06/2026",
  },
];

export const columns: ColumnDef<AdminSalesLead>[] = [
  {
    accessorKey: "companyName",
    header: "Khách hàng (Công ty)",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-semibold">{row.original.companyName}</p>
        <p className="text-muted-foreground text-xs">{row.original.contactName}</p>
      </div>
    ),
  },
  {
    accessorKey: "salesRep",
    header: "Sales phụ trách",
  },
  {
    accessorKey: "stage",
    header: "Giai đoạn (Pipeline)",
    cell: ({ row }) => {
      const stage = row.getValue("stage") as string;
      const tone =
        stage === "Chốt hợp đồng"
          ? "success"
          : stage === "Thất bại"
            ? "error"
            : stage === "Thương lượng"
              ? "warning"
              : stage === "Đã liên hệ"
                ? "brand"
                : "neutral";
      return <Badge tone={tone}>{stage}</Badge>;
    },
  },
  {
    accessorKey: "dealValue",
    header: () => <div className="text-right">Giá trị Hợp đồng</div>,
    cell: ({ row }) => {
      return (
        <div className="text-brand text-right font-medium">
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
            row.original.dealValue,
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "lastActivity",
    header: "Tương tác cuối",
    cell: ({ row }) => <div>{row.original.lastActivity}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const lead = row.original;

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
              <DropdownMenuItem>Cập nhật tiến độ</DropdownMenuItem>
              <DropdownMenuItem>Ghi chú cuộc gọi / họp</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Chuyển Sales phụ trách</DropdownMenuItem>
              {lead.stage !== "Chốt hợp đồng" && lead.stage !== "Thất bại" && (
                <>
                  <DropdownMenuItem className="text-success">
                    Đánh dấu Chốt HĐ (Won)
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-error">
                    Đánh dấu Thất bại (Lost)
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function SalesCrmTable() {
  return (
    <div className="mt-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
