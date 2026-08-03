import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { TransactionsTable } from "@/features/admin/components/finance/transactions/transactions-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminTransactionsPage() {
  const t = useTranslations("Admin.finance.transactions");

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <TransactionsTable />
      </Suspense>
    </div>
  );
}
