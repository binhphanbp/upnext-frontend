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

export type Candidate = {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: "Công khai" | "Đang tìm việc" | "Đóng";
  applications: number;
  joinDate: string;
};

const data: Candidate[] = [
  {
    id: "1",
    name: "Lê Cát Trọng Lý",
    email: "ly.le@gmail.com",
    specialty: "Frontend (React, Next.js)",
    status: "Đang tìm việc",
    applications: 12,
    joinDate: "10/01/2026",
  },
  {
    id: "2",
    name: "Phạm Nhật Vượng",
    email: "vuongpn@outlook.com",
    specialty: "Backend (Java, Spring Boot)",
    status: "Công khai",
    applications: 5,
    joinDate: "15/05/2025",
  },
  {
    id: "3",
    name: "Đặng Lê Nguyên Vũ",
    email: "vu.dang@coffee.com",
    specialty: "Data Scientist (Python)",
    status: "Đóng",
    applications: 0,
    joinDate: "20/03/2024",
  },
  {
    id: "4",
    name: "Nguyễn Thị Phương Thảo",
    email: "thao.nguyen@vietjet.vn",
    specialty: "Product Manager",
    status: "Đang tìm việc",
    applications: 8,
    joinDate: "11/11/2025",
  },
  {
    id: "5",
    name: "Trần Đình Long",
    email: "long.tran@hoaphat.com.vn",
    specialty: "DevOps Engineer (AWS)",
    status: "Công khai",
    applications: 3,
    joinDate: "05/06/2026",
  },
  // Add 10 more mock users for pagination testing
  {
    id: "6",
    name: "Nguyễn Văn Toàn",
    email: "toan@gmail.com",
    specialty: "UI/UX Designer",
    status: "Công khai",
    applications: 2,
    joinDate: "01/01/2026",
  },
  {
    id: "7",
    name: "Trần Hữu Khang",
    email: "khang@gmail.com",
    specialty: "Fullstack Developer",
    status: "Đang tìm việc",
    applications: 4,
    joinDate: "02/02/2026",
  },
  {
    id: "8",
    name: "Lý Mạc Sầu",
    email: "sau@gmail.com",
    specialty: "QA Engineer",
    status: "Đóng",
    applications: 1,
    joinDate: "03/03/2026",
  },
  {
    id: "9",
    name: "Quách Tĩnh",
    email: "tinh@gmail.com",
    specialty: "Business Analyst",
    status: "Công khai",
    applications: 0,
    joinDate: "04/04/2026",
  },
  {
    id: "10",
    name: "Hoàng Dung",
    email: "dung@gmail.com",
    specialty: "Data Engineer",
    status: "Đang tìm việc",
    applications: 7,
    joinDate: "05/05/2026",
  },
  {
    id: "11",
    name: "Dương Quá",
    email: "qua@gmail.com",
    specialty: "Mobile Developer",
    status: "Công khai",
    applications: 3,
    joinDate: "06/06/2026",
  },
  {
    id: "12",
    name: "Tiểu Long Nữ",
    email: "nu@gmail.com",
    specialty: "Frontend (Vue)",
    status: "Đóng",
    applications: 0,
    joinDate: "07/07/2026",
  },
];

export const columns: ColumnDef<Candidate>[] = [
  {
    accessorKey: "name",
    header: "Ứng viên",
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-bold">{row.original.name}</p>
        <p className="text-muted-foreground text-xs">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "specialty",
    header: "Chuyên môn",
    cell: ({ row }) => {
      const specialty = row.getValue("specialty") as string;
      return (
        <Badge tone="neutral" className="text-xs font-medium">
          {specialty}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái hồ sơ",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đang tìm việc" ? "brand" : status === "Công khai" ? "info" : "neutral";
      return <Badge tone={tone}>{status}</Badge>;
    },
  },
  {
    accessorKey: "applications",
    header: () => <div className="text-right">Lượt ứng tuyển</div>,
    cell: ({ row }) => {
      return <div className="text-right font-medium">{row.getValue("applications")}</div>;
    },
  },
  {
    accessorKey: "joinDate",
    header: () => <div className="text-right">Ngày tham gia</div>,
    cell: ({ row }) => {
      return <div className="text-muted-foreground text-right">{row.getValue("joinDate")}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const candidate = row.original;

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(candidate.id)}>
                Copy ID Ứng viên
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Xem CV / Hồ sơ</DropdownMenuItem>
              <DropdownMenuItem>Gửi Email nhắc nhở</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-error">Khóa tài khoản</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function CandidatesTable() {
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
            placeholder="Tìm theo tên ứng viên, email, kỹ năng..."
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Công khai">Công khai</SelectItem>
            <SelectItem value="Đang tìm việc">Đang tìm việc</SelectItem>
            <SelectItem value="Đóng">Đóng</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
