import { Suspense } from "react";

import { CompanyReviewReportsTable } from "@/features/admin/components/content/company-review-reports/company-review-reports-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminCompanyReviewReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <CompanyReviewReportsTable />
      </Suspense>
    </div>
  );
}
