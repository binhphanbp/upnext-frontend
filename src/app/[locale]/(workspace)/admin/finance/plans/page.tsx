import { Suspense } from "react";

import { AddPlanDialog } from "@/features/admin/components/finance/plans/add-plan-dialog";
import { PlansTable } from "@/features/admin/components/finance/plans/plans-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminPlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <AddPlanDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <PlansTable />
      </Suspense>
    </div>
  );
}
