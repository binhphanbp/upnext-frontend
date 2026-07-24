import { Suspense } from "react";

import { AppealsTable } from "@/features/admin/components/appeals/appeals-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminAppealsPage() {
  return (
    <div className="flex-1 space-y-6">
      <div>
        <h2 className="text-foreground text-3xl font-extrabold tracking-tight">Kháng cáo</h2>
        <p className="text-muted-foreground mt-1">
          Xét duyệt kháng cáo từ các công ty đang bị hạn chế do khiếu nại.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <AppealsTable />
      </Suspense>
    </div>
  );
}
