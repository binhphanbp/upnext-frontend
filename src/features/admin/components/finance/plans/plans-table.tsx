"use client";

import { DotsThree, MagnifyingGlass, Eye } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
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

import { PlanDetailsDialog } from "./plan-details-dialog";

export type AdminSubscriptionPlanFeature = {
  label: string;
  value: string;
};

export type AdminSubscriptionPlan = {
  id: string;
  planName: string;
  targetAudience: "Nhà tuyển dụng" | "Ứng viên";
  price: number;
  billingCycle: "Tháng" | "Năm" | "Gói tín dụng (One-time)";
  activeSubscribers: number;
  status: "Đang bán" | "Ngừng bán (Legacy)" | "Bản nháp";
  features?: AdminSubscriptionPlanFeature[];
};

const data: AdminSubscriptionPlan[] = [
  // B2B Plans
  {
    id: "EMP-FREE",
    planName: "Basic",
    targetAudience: "Nhà tuyển dụng",
    price: 0,
    billingCycle: "Tháng",
    activeSubscribers: 15420,
    status: "Đang bán",
    features: [
      {
        label: "Giới hạn đăng tin",
        value: "Được đăng 1 tin/tháng với thời hạn hiển thị mỗi tin là 14 ngày.",
      },
      { label: "Hiển thị", value: "Không hỗ trợ tin nổi bật hay gắn nhãn tuyển gấp." },
      {
        label: "Tương tác ứng viên",
        value:
          "Chỉ được xem CV của ứng viên nộp vào tin đăng, không được tìm kiếm kho CV hay liên hệ chủ động.",
      },
      {
        label: "Giới hạn AI",
        value:
          "Chỉ sử dụng AI CV Matching ở mức cơ bản, không có AI chấm điểm phù hợp CV-JD, không gợi ý ứng viên hay AI viết JD.",
      },
      { label: "Hệ thống", value: "Cung cấp 1 tài khoản HR và quản lý thống kê ở mức cơ bản." },
    ],
  },
  {
    id: "EMP-STARTER",
    planName: "Pro",
    targetAudience: "Nhà tuyển dụng",
    price: 99000,
    billingCycle: "Tháng",
    activeSubscribers: 4200,
    status: "Đang bán",
    features: [
      { label: "Giới hạn đăng tin", value: "Được đăng 3 tin/tháng với thời hạn 30 ngày." },
      { label: "Hiển thị", value: "Được cấp 1 tin nổi bật/tháng." },
      {
        label: "Tương tác ứng viên",
        value:
          "Được mở 30 lượt xem hồ sơ trong kho CV/tháng và có 15 lượt liên hệ ứng viên chủ động/tháng.",
      },
      {
        label: "Giới hạn AI",
        value:
          "AI chấm điểm phù hợp tối đa 100 CV/tháng. AI gợi ý 20 ứng viên/tháng và hỗ trợ AI viết/tối ưu JD 10 lần/tháng.",
      },
      { label: "Hệ thống", value: "Cung cấp 1 tài khoản HR và quản lý Pipeline cơ bản." },
    ],
  },
  {
    id: "EMP-GROWTH",
    planName: "Premium",
    targetAudience: "Nhà tuyển dụng",
    price: 299000,
    billingCycle: "Tháng",
    activeSubscribers: 1850,
    status: "Đang bán",
    features: [
      { label: "Giới hạn đăng tin", value: "Được đăng 10 tin/tháng với thời hạn 30 ngày." },
      { label: "Hiển thị", value: "Được cấp 3 tin nổi bật/tháng và 1 nhãn tuyển gấp/tháng." },
      {
        label: "Tương tác ứng viên",
        value: "Được mở 150 lượt xem hồ sơ/tháng và có 80 lượt liên hệ ứng viên chủ động/tháng.",
      },
      {
        label: "Giới hạn AI",
        value:
          "Khai thác AI CV Matching nâng cao, chấm điểm phù hợp 500 CV/tháng. AI gợi ý 100 ứng viên/tháng và AI viết JD 50 lần/tháng.",
      },
      {
        label: "Hệ thống",
        value:
          "Cho phép sử dụng 3 tài khoản HR, quản lý Pipeline đầy đủ, trang công ty nâng cao và có báo cáo insight.",
      },
    ],
  },
  {
    id: "EMP-SCALE",
    planName: "Enterprise",
    targetAudience: "Nhà tuyển dụng",
    price: 799000,
    billingCycle: "Tháng",
    activeSubscribers: 620,
    status: "Đang bán",
    features: [
      { label: "Giới hạn đăng tin", value: "Được đăng 30 tin/tháng với thời hạn 30 ngày." },
      { label: "Hiển thị", value: "Được cấp 10 tin nổi bật/tháng và 5 nhãn tuyển gấp/tháng." },
      {
        label: "Tương tác ứng viên",
        value: "Mở khóa 500 lượt xem hồ sơ/tháng và 250 lượt liên hệ ứng viên chủ động/tháng.",
      },
      {
        label: "Giới hạn AI",
        value:
          "AI chấm điểm phù hợp 2.000 CV/tháng. AI gợi ý 300 ứng viên/tháng và AI viết JD 200 lần/tháng.",
      },
      {
        label: "Hệ thống",
        value:
          "Hỗ trợ lên đến 10 tài khoản HR, Pipeline đầy đủ kèm báo cáo chi tiết, và trang công ty được branding cao cấp.",
      },
    ],
  },

  // B2C Plans
  {
    id: "CAN-FREE",
    planName: "Basic",
    targetAudience: "Ứng viên",
    price: 0,
    billingCycle: "Tháng",
    activeSubscribers: 125000,
    status: "Đang bán",
    features: [
      {
        label: "Chức năng cốt lõi",
        value:
          "Được tạo hồ sơ, tạo CV online, tìm việc, ứng tuyển, lưu việc làm và theo dõi trạng thái ứng tuyển hoàn toàn miễn phí.",
      },
      {
        label: "Giới hạn AI",
        value: "Chỉ được AI phân tích CV 1 lần/tháng và trải nghiệm 1 buổi demo AI Mock Interview.",
      },
      {
        label: "Tối ưu hóa",
        value:
          "Không hỗ trợ AI viết lại CV theo JD hay tạo Cover Letter. Lộ trình kỹ năng và AI CV Matching chỉ ở mức cơ bản.",
      },
    ],
  },
  {
    id: "CAN-PRO",
    planName: "Talent",
    targetAudience: "Ứng viên",
    price: 19000,
    billingCycle: "Tháng",
    activeSubscribers: 15400,
    status: "Đang bán",
    features: [
      {
        label: "Giới hạn AI CV",
        value:
          "AI phân tích CV 10 lần/tháng. Hỗ trợ AI viết lại CV theo JD 5 lần/tháng và AI tạo Cover Letter 5 lần/tháng.",
      },
      {
        label: "Luyện phỏng vấn",
        value: "Cung cấp 5 buổi AI Mock Interview/tháng kèm theo feedback phỏng vấn chi tiết.",
      },
      {
        label: "Hiển thị",
        value:
          "Ứng viên nhận được Job alert cá nhân hóa, lộ trình kỹ năng theo vị trí, được gắn Badge 'Pro Candidate' và ưu tiên hiển thị nhẹ với Recruiter.",
      },
    ],
  },
  {
    id: "CAN-CAREER-PLUS",
    planName: "Elite",
    targetAudience: "Ứng viên",
    price: 49000,
    billingCycle: "Tháng",
    activeSubscribers: 4200,
    status: "Đang bán",
    features: [
      {
        label: "Giới hạn AI CV",
        value:
          "AI phân tích CV lên đến 30 lần/tháng. Hỗ trợ AI viết lại CV theo JD 20 lần/tháng và tạo Cover Letter 20 lần/tháng.",
      },
      {
        label: "Luyện phỏng vấn",
        value: "Cung cấp 20 buổi AI Mock Interview/tháng với feedback phỏng vấn nâng cao.",
      },
      {
        label: "Hiển thị",
        value:
          "Job alert được cá nhân hóa sâu, ưu tiên hiển thị cao hơn với Recruiter và được gắn Badge 'Top Candidate'.",
      },
    ],
  },
];

export const getColumns = (
  t: any,
  onViewDetails: (plan: AdminSubscriptionPlan) => void,
): ColumnDef<AdminSubscriptionPlan>[] => [
  {
    accessorKey: "planName",
    header: t("planName"),
    cell: ({ row }) => {
      const id = row.original.id;
      // In next-intl, if a key doesn't exist, it returns the key string itself (or throws an error based on config).
      const rawTranslation = t(`planNames.${id}`);
      // Fallback in case translation doesn't match
      const translatedName =
        rawTranslation === `planNames.${id}` ? row.original.planName : rawTranslation;

      return (
        <div>
          <p className="text-foreground font-semibold">{translatedName}</p>
          <p className="text-muted-foreground text-xs">{id}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "targetAudience",
    header: t("targetAudience"),
    cell: ({ row }) => {
      const audience = row.getValue("targetAudience") as string;
      const tone = audience === "Nhà tuyển dụng" ? "brand" : "info";
      const audienceKey = audience === "Nhà tuyển dụng" ? "employer" : "candidate";
      return <Badge tone={tone}>{t(`targetAudienceOptions.${audienceKey}`)}</Badge>;
    },
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">{t("price")}</div>,
    cell: ({ row }) => {
      const cycle = row.original.billingCycle;
      const cycleKey = cycle === "Tháng" ? "month" : cycle === "Năm" ? "year" : "oneTime";
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
            row.original.price,
          )}
          <span className="text-muted-foreground block text-xs font-normal">
            / {t(`billingCycleOptions.${cycleKey}`)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "activeSubscribers",
    header: () => <div className="text-right">{t("activeSubscribers")}</div>,
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
    header: t("status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const tone =
        status === "Đang bán" ? "success" : status === "Bản nháp" ? "warning" : "neutral";

      const statusKey =
        status === "Đang bán" ? "active" : status === "Bản nháp" ? "draft" : "legacy";
      return <Badge tone={tone}>{t(`statusOptions.${statusKey}`)}</Badge>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions")}</div>,
    cell: ({ row }) => {
      const plan = row.original;

      return (
        <div className="flex justify-end gap-2 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu thao tác</span>
                <DotsThree size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewDetails(plan)}>
                <Eye className="mr-2" size={16} />
                {t("actionOptions.viewDetails") || "Xem chi tiết gói"}
              </DropdownMenuItem>
              <DropdownMenuItem>{t("actionOptions.edit")}</DropdownMenuItem>
              <DropdownMenuItem>{t("actionOptions.viewSubscribers")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {plan.status === "Bản nháp" && (
                <DropdownMenuItem className="text-success">
                  {t("actionOptions.publish")}
                </DropdownMenuItem>
              )}
              {plan.status === "Đang bán" && (
                <DropdownMenuItem className="text-warning">
                  {t("actionOptions.retire")}
                </DropdownMenuItem>
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
  const [selectedPlan, setSelectedPlan] = React.useState<AdminSubscriptionPlan | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const t = useTranslations("Admin.finance.plans.table");

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  const handleViewDetails = React.useCallback((plan: AdminSubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDetailsOpen(true);
  }, []);

  const columns = React.useMemo(() => getColumns(t, handleViewDetails), [t, handleViewDetails]);

  return (
    <>
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[350px]">
            <MagnifyingGlass
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              size={18}
            />
            <Input
              className="bg-muted h-10 rounded-xl pl-10"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder={t("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="Đang bán">{t("statusOptions.active")}</SelectItem>
              <SelectItem value="Bản nháp">{t("statusOptions.draft")}</SelectItem>
              <SelectItem value="Ngừng bán (Legacy)">{t("statusOptions.legacy")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable columns={columns} data={filteredData} />
      </div>

      <PlanDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        plan={selectedPlan}
        t={t}
      />
    </>
  );
}
