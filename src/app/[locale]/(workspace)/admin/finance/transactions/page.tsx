import { Suspense } from "react";

import { TransactionsTable } from "@/features/admin/components/finance/transactions/transactions-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminTransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử giao dịch</h1>
        <p className="text-muted-foreground">
          Theo dõi doanh thu, lịch sử thanh toán gói dịch vụ của Nhà tuyển dụng và Ứng viên.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <TransactionsTable />
      </Suspense>
    </div>
  );
}
