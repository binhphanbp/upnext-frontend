import { CheckCircle } from "@phosphor-icons/react";
import * as React from "react";

import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { AdminSubscriptionPlan } from "./plans-table";

type PlanDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminSubscriptionPlan | null;
  t: any; // Translation function
};

export function PlanDetailsDialog({ open, onOpenChange, plan, t }: PlanDetailsDialogProps) {
  if (!plan) return null;

  const translatedName = t(`planNames.${plan.id}`);
  const isEmployer = plan.targetAudience === "Nhà tuyển dụng";
  const tone = isEmployer ? "brand" : "info";
  const audienceKey = isEmployer ? "employer" : "candidate";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <Badge tone={tone}>{t(`targetAudienceOptions.${audienceKey}`)}</Badge>
            <Badge
              tone={
                plan.status === "Đang bán"
                  ? "success"
                  : plan.status === "Bản nháp"
                    ? "warning"
                    : "neutral"
              }
            >
              {t(
                `statusOptions.${
                  plan.status === "Đang bán"
                    ? "active"
                    : plan.status === "Bản nháp"
                      ? "draft"
                      : "legacy"
                }`,
              )}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold">{translatedName}</DialogTitle>
          <DialogDescription>
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
              plan.price,
            )}{" "}
            /{" "}
            {t(
              `billingCycleOptions.${
                plan.billingCycle === "Tháng"
                  ? "month"
                  : plan.billingCycle === "Năm"
                    ? "year"
                    : "oneTime"
              }`,
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <h3 className="border-b pb-2 text-lg font-semibold">
            {t("features") || "Tính năng nổi bật"}
          </h3>
          {plan.features && plan.features.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex gap-3">
                  <CheckCircle size={24} weight="fill" className="text-success mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-foreground font-semibold">{feature.label}</h4>
                    <p className="text-muted-foreground mt-1 text-sm">{feature.value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">Chưa có thông tin chi tiết về tính năng.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
