import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AddPlanDialog } from "@/features/admin/components/finance/plans/add-plan-dialog";
import { PlansTable } from "@/features/admin/components/finance/plans/plans-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminPlansPage() {
  const t = useTranslations("Admin.finance.plans");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AddPlanDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <PlansTable />
      </Suspense>
    </div>
  );
}
