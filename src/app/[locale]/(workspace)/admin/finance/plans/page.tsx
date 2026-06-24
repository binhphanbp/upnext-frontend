import { Suspense } from "react";

import { AddPlanDialog } from "@/features/admin/components/finance/plans/add-plan-dialog";
import { PlansTable } from "@/features/admin/components/finance/plans/plans-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminPlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gói dịch vụ (Plans)</h1>
          <p className="text-muted-foreground">
            Cấu hình các gói Subscriptions và dịch vụ lẻ cho Nhà tuyển dụng & Ứng viên.
          </p>
        </div>
        <AddPlanDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <PlansTable />
      </Suspense>
    </div>
  );
}
