import { Suspense } from "react";

import { AuditLogTable } from "@/features/admin/components/system/audit-log/audit-log-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminAuditLogPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-2xl" />}>
        <AuditLogTable />
      </Suspense>
    </div>
  );
}
