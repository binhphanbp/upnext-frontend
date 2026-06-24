import { Suspense } from "react";

import { AddSalesLeadDialog } from "@/features/admin/components/finance/sales/add-sales-lead-dialog";
import { SalesCrmTable } from "@/features/admin/components/finance/sales/sales-crm-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminSalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales CRM</h1>
          <p className="text-muted-foreground">
            Quản lý phễu khách hàng B2B (Nhà tuyển dụng), theo dõi tiến độ chốt sale.
          </p>
        </div>
        <AddSalesLeadDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SalesCrmTable />
      </Suspense>
    </div>
  );
}
