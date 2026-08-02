import { Suspense } from "react";

import { AppealsTable } from "@/features/admin/components/appeals/appeals-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminAppealsPage() {
  return (
    <div className="flex-1 space-y-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <AppealsTable />
      </Suspense>
    </div>
  );
}
