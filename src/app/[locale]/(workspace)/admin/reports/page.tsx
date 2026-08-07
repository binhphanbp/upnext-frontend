import { Suspense } from "react";

import { AdminReportsTabs } from "@/features/admin/components/admin-reports-tabs";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminReportsPage() {
  return (
    <div className="flex-1 space-y-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <AdminReportsTabs />
      </Suspense>
    </div>
  );
}
