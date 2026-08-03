import { Suspense } from "react";

import { AddSalesLeadDialog } from "@/features/admin/components/finance/sales/add-sales-lead-dialog";
import { SalesCrmTable } from "@/features/admin/components/finance/sales/sales-crm-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminSalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <AddSalesLeadDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SalesCrmTable />
      </Suspense>
    </div>
  );
}
